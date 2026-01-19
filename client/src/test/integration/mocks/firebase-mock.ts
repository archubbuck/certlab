/**
 * Firebase Authentication Mock for Integration Tests
 *
 * Provides a realistic mock of Firebase authentication that simulates:
 * - User sign-in/sign-out
 * - Auth state changes
 * - Token management
 * - Error scenarios
 *
 * This mock is more sophisticated than unit test mocks, maintaining
 * stateful behavior to support integration testing scenarios.
 */

import { vi } from 'vitest';

export interface MockFirebaseUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified?: boolean;
}

interface AuthStateListener {
  (user: MockFirebaseUser | null): void;
}

class FirebaseMockService {
  private currentUser: MockFirebaseUser | null = null;
  private authStateListeners: Set<AuthStateListener> = new Set();
  private isConfigured = true;
  private initializeDelay = 0;

  /**
   * Set the current user and notify all listeners
   */
  setUser(user: MockFirebaseUser | null): void {
    this.currentUser = user;
    this.notifyAuthStateListeners();
  }

  /**
   * Get the current user
   */
  getUser(): MockFirebaseUser | null {
    return this.currentUser;
  }

  /**
   * Register an auth state change listener
   */
  onAuthStateChanged(callback: AuthStateListener): () => void {
    this.authStateListeners.add(callback);

    // Immediately call with current state (simulating Firebase behavior)
    setTimeout(() => callback(this.currentUser), this.initializeDelay);

    // Return unsubscribe function
    return () => {
      this.authStateListeners.delete(callback);
    };
  }

  /**
   * Notify all auth state listeners
   */
  private notifyAuthStateListeners(): void {
    this.authStateListeners.forEach((listener) => {
      listener(this.currentUser);
    });
  }

  /**
   * Simulate sign in with Google
   */
  async signInWithGoogle(): Promise<{ user: MockFirebaseUser }> {
    const user: MockFirebaseUser = {
      uid: `test-uid-${Date.now()}`,
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: 'https://example.com/photo.jpg',
      emailVerified: true,
    };
    this.setUser(user);
    return { user };
  }

  /**
   * Simulate sign in with email/password
   */
  async signInWithEmail(email: string, password: string): Promise<{ user: MockFirebaseUser }> {
    if (!email || !password) {
      throw new Error('Invalid credentials');
    }
    const user: MockFirebaseUser = {
      uid: `test-uid-${Date.now()}`,
      email,
      displayName: email.split('@')[0],
      emailVerified: false,
    };
    this.setUser(user);
    return { user };
  }

  /**
   * Simulate sign up with email/password
   */
  async signUpWithEmail(email: string, password: string): Promise<{ user: MockFirebaseUser }> {
    if (!email || !password) {
      throw new Error('Invalid credentials');
    }
    const user: MockFirebaseUser = {
      uid: `test-uid-${Date.now()}`,
      email,
      displayName: email.split('@')[0],
      emailVerified: false,
    };
    this.setUser(user);
    return { user };
  }

  /**
   * Simulate sign out
   */
  async signOut(): Promise<void> {
    this.setUser(null);
  }

  /**
   * Check if Firebase is configured
   */
  isFirebaseConfigured(): boolean {
    return this.isConfigured;
  }

  /**
   * Control whether Firebase appears configured
   */
  setConfigured(configured: boolean): void {
    this.isConfigured = configured;
  }

  /**
   * Set initialization delay (for testing loading states)
   */
  setInitializeDelay(delayMs: number): void {
    this.initializeDelay = delayMs;
  }

  /**
   * Reset mock to initial state
   */
  reset(): void {
    this.currentUser = null;
    this.authStateListeners.clear();
    this.isConfigured = true;
    this.initializeDelay = 0;
  }
}

// Singleton instance
export const firebaseMock = new FirebaseMockService();

/**
 * Create mocked Firebase module for integration tests
 */
export function createFirebaseMock() {
  return {
    isFirebaseConfigured: vi.fn(() => firebaseMock.isFirebaseConfigured()),
    initializeFirebase: vi.fn(async () => {
      if (firebaseMock.isFirebaseConfigured()) {
        // Simulate async initialization
        await new Promise((resolve) => setTimeout(resolve, 10));
        return true;
      }
      return false;
    }),
    onFirebaseAuthStateChanged: vi.fn((callback: AuthStateListener) =>
      firebaseMock.onAuthStateChanged(callback)
    ),
    signOutFromGoogle: vi.fn(async () => firebaseMock.signOut()),
    getCurrentFirebaseUser: vi.fn(() => firebaseMock.getUser()),
    signInWithGoogle: vi.fn(async () => firebaseMock.signInWithGoogle()),
    signInWithEmail: vi.fn(async (email: string, password: string) =>
      firebaseMock.signInWithEmail(email, password)
    ),
    signUpWithEmail: vi.fn(async (email: string, password: string) =>
      firebaseMock.signUpWithEmail(email, password)
    ),
    sendPasswordReset: vi.fn(async () => {
      // Mock password reset
    }),
    getFirebaseAuth: vi.fn(() => null),
  };
}
