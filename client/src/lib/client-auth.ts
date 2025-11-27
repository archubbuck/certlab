/**
 * Client-side authentication system
 * Uses browser storage for authentication state
 * 
 * Security notes for client-side password hashing:
 * - Uses PBKDF2 with 100,000 iterations via Web Crypto API
 * - Generates a unique 128-bit salt for each password using crypto.getRandomValues()
 * - Hash format: "pbkdf2:iterations:salt:hash" for version identification
 * - While client-side hashing provides some protection, users should understand that
 *   all data (including hashes) is stored locally in IndexedDB which can be accessed
 *   by anyone with physical access to the device
 * - This implementation protects against casual inspection but not against determined
 *   attackers with device access
 */

import { clientStorage } from './client-storage';
import type { User } from '@shared/schema';

// PBKDF2 configuration
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16; // 128 bits
const HASH_LENGTH = 32; // 256 bits

/**
 * Generates a cryptographically secure random salt
 */
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Converts Uint8Array to hex string
 */
function arrayToHex(array: Uint8Array): string {
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Converts hex string to Uint8Array
 */
function hexToArray(hex: string): Uint8Array {
  const matches = hex.match(/.{1,2}/g);
  if (!matches) return new Uint8Array(0);
  return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
}

/**
 * Hash password using PBKDF2 with the provided salt and iterations
 * Returns the hash as a hex string
 */
async function pbkdf2Hash(password: string, salt: Uint8Array, iterations: number = PBKDF2_ITERATIONS): Promise<string> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  // Derive bits using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    HASH_LENGTH * 8 // length in bits
  );
  
  return arrayToHex(new Uint8Array(derivedBits));
}

/**
 * Constant-time comparison of two hex strings to prevent timing attacks.
 * Compares all bytes regardless of early mismatches.
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Creates a password hash using PBKDF2
 * Returns format: "pbkdf2:iterations:salt:hash"
 */
async function hashPassword(password: string): Promise<string> {
  const salt = generateSalt();
  const hash = await pbkdf2Hash(password, salt);
  return `pbkdf2:${PBKDF2_ITERATIONS}:${arrayToHex(salt)}:${hash}`;
}

/**
 * Verifies a password against a stored hash
 * Supports both legacy SHA-256 hashes and new PBKDF2 hashes
 * Uses constant-time comparison to prevent timing attacks
 */
async function verifyPassword(password: string, storedHash: string): Promise<{ valid: boolean; needsRehash: boolean }> {
  // Check if this is a PBKDF2 hash (format: "pbkdf2:iterations:salt:hash")
  if (storedHash.startsWith('pbkdf2:')) {
    const parts = storedHash.split(':');
    if (parts.length !== 4) {
      return { valid: false, needsRehash: false };
    }
    
    const [, iterationsStr, saltHex, expectedHash] = parts;
    const iterations = parseInt(iterationsStr, 10);
    
    // Validate iterations is a positive integer within reasonable bounds
    // Minimum 1000 iterations, maximum 10 million (prevents DoS)
    if (isNaN(iterations) || iterations < 1000 || iterations > 10000000) {
      return { valid: false, needsRehash: false };
    }
    
    const salt = hexToArray(saltHex);
    
    // Use the shared pbkdf2Hash function with stored iterations
    const computedHash = await pbkdf2Hash(password, salt, iterations);
    
    // Use constant-time comparison to prevent timing attacks
    const valid = constantTimeCompare(computedHash, expectedHash);
    
    // Check if we need to rehash (e.g., if iterations have increased)
    const needsRehash = valid && iterations < PBKDF2_ITERATIONS;
    
    return { valid, needsRehash };
  }
  
  // Legacy SHA-256 hash (64 character hex string)
  // These need to be migrated to PBKDF2
  if (storedHash.length === 64 && /^[0-9a-f]+$/.test(storedHash)) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Use constant-time comparison to prevent timing attacks
    const valid = constantTimeCompare(computedHash, storedHash);
    // Legacy hashes always need rehashing to PBKDF2
    return { valid, needsRehash: valid };
  }
  
  // Unknown hash format
  return { valid: false, needsRehash: false };
}

export interface AuthResponse {
  success: boolean;
  user?: Omit<User, 'passwordHash'>;
  message?: string;
}

class ClientAuth {
  async register(email: string, password: string, firstName?: string, lastName?: string): Promise<AuthResponse> {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { success: false, message: 'Invalid email format' };
      }

      // Validate password length if password is provided
      if (password && password.length > 0 && password.length < 8) {
        return { success: false, message: 'Password must be at least 8 characters' };
      }

      // Check if user already exists
      const existingUser = await clientStorage.getUserByEmail(email);
      if (existingUser) {
        return { success: false, message: 'User with this email already exists' };
      }

      // Create user with optional password
      const passwordHash = password && password.length > 0 ? await hashPassword(password) : null;
      const user = await clientStorage.createUser({
        email,
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
        role: 'user',
        tenantId: 1,
      });

      // Set as current user
      await clientStorage.setCurrentUserId(user.id);

      // Return without password hash
      const { passwordHash: _, ...sanitizedUser } = user;
      return { success: true, user: sanitizedUser };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Registration failed' };
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = await clientStorage.getUserByEmail(email);
      if (!user) {
        return { success: false, message: 'Invalid email or password' };
      }

      // If user has no password set, allow password-less login
      if (!user.passwordHash) {
        // Set as current user
        await clientStorage.setCurrentUserId(user.id);

        // Return without password hash
        const { passwordHash: _, ...sanitizedUser } = user;
        return { success: true, user: sanitizedUser };
      }

      // Verify password using the new verification function
      const { valid, needsRehash } = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        return { success: false, message: 'Invalid email or password' };
      }

      // If the password was verified but needs rehashing (e.g., migrating from SHA-256 to PBKDF2),
      // rehash with the new algorithm
      if (needsRehash) {
        const newHash = await hashPassword(password);
        await clientStorage.updateUser(user.id, { passwordHash: newHash });
      }

      // Set as current user
      await clientStorage.setCurrentUserId(user.id);

      // Return without password hash
      const { passwordHash: _, ...sanitizedUser } = user;
      return { success: true, user: sanitizedUser };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed' };
    }
  }

  async logout(): Promise<void> {
    await clientStorage.clearCurrentUser();
  }

  async getCurrentUser(): Promise<Omit<User, 'passwordHash'> | null> {
    try {
      const userId = await clientStorage.getCurrentUserId();
      if (!userId) return null;

      const user = await clientStorage.getUser(userId);
      if (!user) {
        // Clear invalid session
        await clientStorage.clearCurrentUser();
        return null;
      }

      const { passwordHash: _, ...sanitizedUser } = user;
      return sanitizedUser;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  async updateProfile(updates: Partial<User>): Promise<AuthResponse> {
    try {
      const userId = await clientStorage.getCurrentUserId();
      if (!userId) {
        return { success: false, message: 'Not authenticated' };
      }

      // Don't allow updating password through this method
      const { passwordHash, ...safeUpdates } = updates as any;

      const updatedUser = await clientStorage.updateUser(userId, safeUpdates);
      if (!updatedUser) {
        return { success: false, message: 'User not found' };
      }

      const { passwordHash: _, ...sanitizedUser } = updatedUser;
      return { success: true, user: sanitizedUser };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, message: 'Profile update failed' };
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<AuthResponse> {
    try {
      const userId = await clientStorage.getCurrentUserId();
      if (!userId) {
        return { success: false, message: 'Not authenticated' };
      }

      const user = await clientStorage.getUser(userId);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // If user has no password, allow setting one without current password
      if (!user.passwordHash) {
        // Validate new password
        if (newPassword.length < 8) {
          return { success: false, message: 'Password must be at least 8 characters' };
        }

        // Set password
        const newHash = await hashPassword(newPassword);
        const updatedUser = await clientStorage.updateUser(userId, { passwordHash: newHash });
        if (!updatedUser) {
          return { success: false, message: 'Password setup failed' };
        }

        const { passwordHash: _, ...sanitizedUser } = updatedUser;
        return { success: true, user: sanitizedUser, message: 'Password set successfully' };
      }

      // Verify current password using the secure verification function
      const { valid } = await verifyPassword(currentPassword, user.passwordHash);
      if (!valid) {
        return { success: false, message: 'Current password is incorrect' };
      }

      // Validate new password
      if (newPassword.length < 8) {
        return { success: false, message: 'New password must be at least 8 characters' };
      }

      // Update password with new PBKDF2 hash
      const newHash = await hashPassword(newPassword);
      const updatedUser = await clientStorage.updateUser(userId, { passwordHash: newHash });
      if (!updatedUser) {
        return { success: false, message: 'Password update failed' };
      }

      const { passwordHash: _, ...sanitizedUser } = updatedUser;
      return { success: true, user: sanitizedUser };
    } catch (error) {
      console.error('Password change error:', error);
      return { success: false, message: 'Password change failed' };
    }
  }

  async getAllUsers(): Promise<(Omit<User, 'passwordHash'> & { hasPassword: boolean })[]> {
    try {
      const users = await clientStorage.getAllUsers();
      
      // Return users without password hashes, but include hasPassword flag
      return users.map(user => {
        const { passwordHash, ...sanitizedUser } = user;
        return { ...sanitizedUser, hasPassword: !!passwordHash };
      });
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async hasPassword(userId: string): Promise<boolean> {
    try {
      const user = await clientStorage.getUser(userId);
      return !!user?.passwordHash;
    } catch (error) {
      console.error('Error checking password:', error);
      return false;
    }
  }

  async loginPasswordless(email: string): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = await clientStorage.getUserByEmail(email);
      if (!user) {
        return { success: false, message: 'Account not found' };
      }

      // Verify account has no password (is password-less)
      if (user.passwordHash) {
        return { success: false, message: 'This account requires a password' };
      }

      // Set as current user
      await clientStorage.setCurrentUserId(user.id);

      // Return without password hash
      const { passwordHash: _, ...sanitizedUser } = user;
      return { success: true, user: sanitizedUser };
    } catch (error) {
      console.error('Password-less login error:', error);
      return { success: false, message: 'Login failed' };
    }
  }
}

export const clientAuth = new ClientAuth();
