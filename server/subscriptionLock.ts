import { EventEmitter } from 'events';

/**
 * Simple in-memory lock manager for preventing race conditions
 * during subscription operations
 */
class SubscriptionLockManager extends EventEmitter {
  private locks: Map<string, {
    acquired: Date;
    operation: string;
    timeout: NodeJS.Timeout;
  }> = new Map();
  
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_WAIT_TIME = 10000; // 10 seconds

  /**
   * Acquire a lock for a specific user's subscription operations
   * @param userId - The user ID to lock
   * @param operation - Description of the operation
   * @param timeoutMs - Optional timeout in milliseconds
   * @returns Promise that resolves when lock is acquired or rejects on timeout
   */
  async acquireLock(
    userId: string, 
    operation: string, 
    timeoutMs: number = this.DEFAULT_TIMEOUT
  ): Promise<() => void> {
    const startTime = Date.now();
    
    // Wait for existing lock to be released
    while (this.locks.has(userId)) {
      if (Date.now() - startTime > this.MAX_WAIT_TIME) {
        const existingLock = this.locks.get(userId);
        throw new Error(
          `Failed to acquire lock for user ${userId}. ` +
          `Operation "${existingLock?.operation}" is still in progress.`
        );
      }
      
      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Create timeout to auto-release lock if not released manually
    const timeout = setTimeout(() => {
      console.warn(`Lock for user ${userId} (${operation}) timed out after ${timeoutMs}ms`);
      this.releaseLock(userId);
    }, timeoutMs);
    
    // Acquire the lock
    this.locks.set(userId, {
      acquired: new Date(),
      operation,
      timeout,
    });
    
    console.log(`Lock acquired for user ${userId}: ${operation}`);
    
    // Return release function
    return () => this.releaseLock(userId);
  }
  
  /**
   * Release a lock for a specific user
   * @param userId - The user ID to unlock
   */
  private releaseLock(userId: string): void {
    const lock = this.locks.get(userId);
    if (lock) {
      clearTimeout(lock.timeout);
      this.locks.delete(userId);
      console.log(`Lock released for user ${userId}: ${lock.operation}`);
      this.emit('lockReleased', userId);
    }
  }
  
  /**
   * Check if a user's subscription operations are locked
   * @param userId - The user ID to check
   * @returns True if locked
   */
  isLocked(userId: string): boolean {
    return this.locks.has(userId);
  }
  
  /**
   * Get information about a current lock
   * @param userId - The user ID to check
   * @returns Lock information or undefined
   */
  getLockInfo(userId: string): { operation: string; acquiredAt: Date } | undefined {
    const lock = this.locks.get(userId);
    if (lock) {
      return {
        operation: lock.operation,
        acquiredAt: lock.acquired,
      };
    }
    return undefined;
  }
  
  /**
   * Clear all locks (use with caution, mainly for testing)
   */
  clearAllLocks(): void {
    this.locks.forEach((lock) => {
      clearTimeout(lock.timeout);
    });
    this.locks.clear();
    console.log('All subscription locks cleared');
  }
}

// Export singleton instance
export const subscriptionLockManager = new SubscriptionLockManager();

/**
 * Decorator function to wrap an async function with lock management
 * @param operation - Description of the operation
 * @param getUserId - Function to extract user ID from arguments
 */
export function withSubscriptionLock<T extends (...args: any[]) => Promise<any>>(
  operation: string,
  getUserId: (args: Parameters<T>) => string
): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: Parameters<T>): Promise<ReturnType<T>> {
      const userId = getUserId(args);
      const releaseLock = await subscriptionLockManager.acquireLock(userId, operation);
      
      try {
        const result = await originalMethod.apply(this, args);
        return result;
      } finally {
        releaseLock();
      }
    };
    
    return descriptor;
  };
}