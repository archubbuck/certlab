/**
 * Mock Firestore Service for Testing
 *
 * Provides a complete mock implementation of firestore-service.ts
 * This ensures tests don't require actual Firebase/Firestore connections.
 */
import { vi } from 'vitest';

/**
 * Mock Firestore service that can be used in tests
 */
export const mockFirestoreService = {
  // Initialization functions
  initializeFirestoreService: vi.fn().mockResolvedValue(true),
  isFirestoreInitialized: vi.fn().mockReturnValue(true),
  getFirestore: vi.fn().mockReturnValue({}),

  // Collection references
  collection: vi.fn(),
  doc: vi.fn(),

  // Query operations
  getDocs: vi.fn().mockResolvedValue({ docs: [], empty: true }),
  getDoc: vi.fn().mockResolvedValue({ exists: () => false, data: () => undefined }),
  setDoc: vi.fn().mockResolvedValue(undefined),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  deleteDoc: vi.fn().mockResolvedValue(undefined),
  addDoc: vi.fn().mockResolvedValue({ id: 'mock-doc-id' }),

  // Query builders
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),

  // Transactions
  runTransaction: vi.fn().mockResolvedValue(undefined),

  // Batch operations
  writeBatch: vi.fn().mockReturnValue({
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  }),

  // Timestamps
  serverTimestamp: vi.fn(),
  Timestamp: {
    now: vi.fn().mockReturnValue({ seconds: Date.now() / 1000, nanoseconds: 0 }),
    fromDate: vi.fn((date: Date) => ({
      seconds: date.getTime() / 1000,
      nanoseconds: 0,
      toDate: () => date,
    })),
  },
};

/**
 * Creates a mock for the firestore-service module
 * Use this in vi.mock() calls
 */
export const createFirestoreServiceMock = () => ({
  initializeFirestoreService: vi.fn().mockResolvedValue(true),
  isFirestoreInitialized: vi.fn().mockReturnValue(true),
  getFirestore: vi.fn().mockReturnValue(mockFirestoreService),
});

/**
 * Default export for easy mocking
 */
export default mockFirestoreService;
