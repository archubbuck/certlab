import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { QuizTemplate } from '@shared/schema';

// Store mock functions
let getUserDocumentMock: any;
let getUserDocumentsMock: any;
let setUserDocumentMock: any;

// Mock the firestore-service module
vi.mock('./firestore-service', () => ({
  getUserDocument: (...args: any[]) => getUserDocumentMock(...args),
  getUserDocuments: (...args: any[]) => getUserDocumentsMock(...args),
  setUserDocument: (...args: any[]) => setUserDocumentMock(...args),
  getFirestoreInstance: vi.fn(() => ({})),
  Timestamp: {
    fromDate: (date: Date) => date,
  },
  timestampToDate: (date: any) => date,
  where: vi.fn(),
  orderBy: vi.fn(),
}));

// Mock the errors module
vi.mock('./errors', () => ({
  logError: vi.fn(),
}));

describe('Quiz Template Duplication', () => {
  let firestoreStorage: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Initialize mock functions
    getUserDocumentMock = vi.fn();
    getUserDocumentsMock = vi.fn();
    setUserDocumentMock = vi.fn();

    // Reset modules to get fresh instance
    vi.resetModules();

    // Import firestore storage after mocks are set up
    const storage = await import('./firestore-storage');
    firestoreStorage = storage.firestoreStorage;

    // Ensure the storage has a current user ID set
    await firestoreStorage.setCurrentUserId('test-user');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getUserQuizTemplates', () => {
    it('should return all quiz templates for a user', async () => {
      const mockTemplates: QuizTemplate[] = [
        {
          id: 1,
          userId: 'user1',
          tenantId: 1,
          title: 'Test Quiz 1',
          description: 'Description 1',
          instructions: 'Instructions 1',
          categoryIds: [1],
          subcategoryIds: [1],
          customQuestions: [],
          questionCount: 0,
          timeLimit: null,
          passingScore: 70,
          maxAttempts: null,
          difficultyLevel: 1,
          isPublished: false,
          isDraft: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          userId: 'user1',
          tenantId: 1,
          title: 'Test Quiz 2',
          description: 'Description 2',
          instructions: 'Instructions 2',
          categoryIds: [2],
          subcategoryIds: [2],
          customQuestions: [],
          questionCount: 0,
          timeLimit: 30,
          passingScore: 80,
          maxAttempts: 3,
          difficultyLevel: 2,
          isPublished: true,
          isDraft: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      getUserDocumentsMock.mockResolvedValue(mockTemplates);

      const result = await firestoreStorage.getUserQuizTemplates('user1');

      expect(getUserDocumentsMock).toHaveBeenCalledWith('user1', 'quizTemplates');
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Test Quiz 1');
      expect(result[1].title).toBe('Test Quiz 2');
    });

    it('should filter templates by tenantId when provided', async () => {
      const mockTemplates: QuizTemplate[] = [
        {
          id: 1,
          userId: 'user1',
          tenantId: 1,
          title: 'Tenant 1 Quiz',
          description: '',
          instructions: '',
          categoryIds: [],
          subcategoryIds: [],
          customQuestions: [],
          questionCount: 0,
          timeLimit: null,
          passingScore: 70,
          maxAttempts: null,
          difficultyLevel: 1,
          isPublished: false,
          isDraft: true,
        },
        {
          id: 2,
          userId: 'user1',
          tenantId: 2,
          title: 'Tenant 2 Quiz',
          description: '',
          instructions: '',
          categoryIds: [],
          subcategoryIds: [],
          customQuestions: [],
          questionCount: 0,
          timeLimit: null,
          passingScore: 70,
          maxAttempts: null,
          difficultyLevel: 1,
          isPublished: false,
          isDraft: true,
        },
      ];

      getUserDocumentsMock.mockResolvedValue(mockTemplates);

      const result = await firestoreStorage.getUserQuizTemplates('user1', 1);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Tenant 1 Quiz');
    });

    it('should return empty array on error', async () => {
      getUserDocumentsMock.mockRejectedValue(new Error('Database error'));

      const result = await firestoreStorage.getUserQuizTemplates('user1');

      expect(result).toEqual([]);
    });
  });

  describe('getQuizTemplate', () => {
    it('should return a single quiz template', async () => {
      const mockTemplate: QuizTemplate = {
        id: 1,
        userId: 'user1',
        tenantId: 1,
        title: 'Test Quiz',
        description: 'Test Description',
        instructions: 'Test Instructions',
        categoryIds: [1],
        subcategoryIds: [1],
        customQuestions: [],
        questionCount: 5,
        timeLimit: 30,
        passingScore: 70,
        maxAttempts: 3,
        difficultyLevel: 2,
        isPublished: false,
        isDraft: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      getUserDocumentMock.mockResolvedValue(mockTemplate);

      const result = await firestoreStorage.getQuizTemplate('user1', 1);

      expect(getUserDocumentMock).toHaveBeenCalledWith('user1', 'quizTemplates', '1');
      expect(result).toBeDefined();
      expect(result?.title).toBe('Test Quiz');
      expect(result?.questionCount).toBe(5);
    });

    it('should return undefined when template not found', async () => {
      getUserDocumentMock.mockResolvedValue(null);

      const result = await firestoreStorage.getQuizTemplate('user1', 999);

      expect(result).toBeUndefined();
    });

    it('should return undefined on error', async () => {
      getUserDocumentMock.mockRejectedValue(new Error('Database error'));

      const result = await firestoreStorage.getQuizTemplate('user1', 1);

      expect(result).toBeUndefined();
    });
  });

  describe('duplicateQuizTemplate', () => {
    it('should duplicate a quiz template with modified fields', async () => {
      const originalTemplate: QuizTemplate = {
        id: 1,
        userId: 'user1',
        tenantId: 1,
        title: 'Original Quiz',
        description: 'Original Description',
        instructions: 'Original Instructions',
        categoryIds: [1, 2],
        subcategoryIds: [1, 2, 3],
        customQuestions: [
          {
            id: 'q1',
            text: 'Question 1',
            options: [
              { id: 0, text: 'Option 1' },
              { id: 1, text: 'Option 2' },
            ],
            correctAnswer: 0,
            explanation: 'Explanation 1',
            difficultyLevel: 2,
            type: 'multiple_choice',
            tags: ['tag1'],
          },
        ],
        questionCount: 1,
        timeLimit: 30,
        passingScore: 80,
        maxAttempts: 3,
        difficultyLevel: 2,
        isPublished: true,
        isDraft: false,
        tags: ['original-tag'],
        randomizeQuestions: true,
        randomizeAnswers: false,
        feedbackMode: 'instant',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      getUserDocumentMock.mockResolvedValue(originalTemplate);
      setUserDocumentMock.mockResolvedValue(undefined);

      // Mock createQuizVersion
      vi.spyOn(firestoreStorage, 'createQuizVersion').mockResolvedValue({});

      const result = await firestoreStorage.duplicateQuizTemplate(1, 'user1');

      // Verify getQuizTemplate was called
      expect(getUserDocumentMock).toHaveBeenCalledWith('user1', 'quizTemplates', '1');

      // Verify setUserDocument was called with correct data
      expect(setUserDocumentMock).toHaveBeenCalled();
      const [userId, collection, id, duplicate] = setUserDocumentMock.mock.calls[0];
      expect(userId).toBe('user1');
      expect(collection).toBe('quizTemplates');
      expect(duplicate.title).toBe('Copy of Original Quiz');
      expect(duplicate.isDraft).toBe(true);
      expect(duplicate.isPublished).toBe(false);

      // Verify all data is preserved
      expect(duplicate.description).toBe('Original Description');
      expect(duplicate.instructions).toBe('Original Instructions');
      expect(duplicate.categoryIds).toEqual([1, 2]);
      expect(duplicate.subcategoryIds).toEqual([1, 2, 3]);
      expect(duplicate.customQuestions).toHaveLength(1);
      expect(duplicate.timeLimit).toBe(30);
      expect(duplicate.passingScore).toBe(80);
      expect(duplicate.maxAttempts).toBe(3);
      expect(duplicate.difficultyLevel).toBe(2);
      expect(duplicate.tags).toEqual(['original-tag']);
      expect(duplicate.randomizeQuestions).toBe(true);

      // Verify version history was created
      expect(firestoreStorage.createQuizVersion).toHaveBeenCalled();
    });

    it('should throw error when template not found', async () => {
      getUserDocumentMock.mockResolvedValue(null);

      await expect(firestoreStorage.duplicateQuizTemplate(999, 'user1')).rejects.toThrow(
        'Quiz template not found'
      );
    });

    it('should throw error when user is not the owner', async () => {
      const originalTemplate: QuizTemplate = {
        id: 1,
        userId: 'different-user',
        tenantId: 1,
        title: 'Original Quiz',
        description: '',
        instructions: '',
        categoryIds: [],
        subcategoryIds: [],
        customQuestions: [],
        questionCount: 0,
        timeLimit: null,
        passingScore: 70,
        maxAttempts: null,
        difficultyLevel: 1,
        isPublished: false,
        isDraft: true,
      };

      getUserDocumentMock.mockResolvedValue(originalTemplate);

      await expect(firestoreStorage.duplicateQuizTemplate(1, 'user1')).rejects.toThrow(
        'Only the quiz owner can duplicate this template'
      );
    });

    it('should throw error when userId is not provided', async () => {
      await expect(firestoreStorage.duplicateQuizTemplate(1, '')).rejects.toThrow(
        'User ID required'
      );
    });
  });
});
