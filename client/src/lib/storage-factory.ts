/**
 * Storage Factory
 *
 * Provides a unified storage interface that routes operations between
 * IndexedDB (local-only mode) and Firestore (cloud sync mode).
 *
 * ## Architecture
 *
 * - **Local-only mode**: Uses IndexedDB via client-storage.ts
 * - **Cloud sync mode**: Uses Firestore via firestore-storage.ts
 * - **Hybrid caching**: IndexedDB acts as cache for Firestore data
 * - **Automatic fallback**: Falls back to IndexedDB when offline
 *
 * ## Usage
 *
 * ```typescript
 * import { storage, setStorageMode } from './storage-factory';
 *
 * // Use storage (automatically routes to correct backend)
 * const quizzes = await storage.getUserQuizzes(userId);
 *
 * // Switch to cloud sync mode
 * await setStorageMode('cloud');
 *
 * // Switch to local-only mode
 * await setStorageMode('local');
 * ```
 *
 * @module storage-factory
 */

import { clientStorage } from './client-storage';
import { firestoreStorage } from './firestore-storage';
import { initializeFirestoreService, isFirestoreInitialized } from './firestore-service';
import { getCurrentFirebaseUser } from './firebase';
import { logError } from './errors';
import type { IClientStorage } from '@shared/storage-interface';

/**
 * Storage mode types
 */
export type StorageMode = 'local' | 'cloud' | 'hybrid';

/**
 * Current storage mode
 */
let currentMode: StorageMode = 'local';

/**
 * Whether Firestore is available
 */
let firestoreAvailable = false;

/**
 * Initialize the storage system
 * This should be called on app startup
 */
export async function initializeStorage(): Promise<void> {
  try {
    // Try to initialize Firestore
    firestoreAvailable = await initializeFirestoreService();

    if (firestoreAvailable) {
      console.log('[Storage Factory] Firestore initialized successfully');

      // Check if user is logged in with Firebase
      const firebaseUser = getCurrentFirebaseUser();
      if (firebaseUser) {
        console.log('[Storage Factory] Firebase user detected, enabling cloud mode');
        currentMode = 'cloud';
        await firestoreStorage.setCurrentUserId(firebaseUser.uid);
      }
    } else {
      console.log('[Storage Factory] Firestore not available, using local mode');
      currentMode = 'local';
    }
  } catch (error) {
    logError('initializeStorage', error);
    currentMode = 'local';
  }
}

/**
 * Get the current storage mode
 */
export function getStorageMode(): StorageMode {
  return currentMode;
}

/**
 * Set the storage mode
 * @param mode The storage mode to use
 */
export async function setStorageMode(mode: StorageMode): Promise<void> {
  try {
    if (mode === 'cloud' || mode === 'hybrid') {
      if (!firestoreAvailable) {
        console.warn('[Storage Factory] Cannot enable cloud mode: Firestore not available');
        currentMode = 'local';
        return;
      }

      const firebaseUser = getCurrentFirebaseUser();
      if (!firebaseUser) {
        console.warn('[Storage Factory] Cannot enable cloud mode: No Firebase user');
        currentMode = 'local';
        return;
      }

      await firestoreStorage.setCurrentUserId(firebaseUser.uid);
    }

    currentMode = mode;
    console.log(`[Storage Factory] Storage mode set to: ${mode}`);
  } catch (error) {
    logError('setStorageMode', error, { mode });
    currentMode = 'local';
  }
}

/**
 * Check if cloud sync is available
 */
export function isCloudSyncAvailable(): boolean {
  return firestoreAvailable && isFirestoreInitialized();
}

/**
 * Check if currently using cloud sync
 */
export function isUsingCloudSync(): boolean {
  return currentMode === 'cloud' && firestoreAvailable;
}

/**
 * Storage adapter that routes to the appropriate backend
 */
class StorageRouter implements IClientStorage {
  /**
   * Get the active storage backend based on current mode
   */
  private getActiveStorage(): IClientStorage {
    if (currentMode === 'cloud' && firestoreAvailable) {
      return firestoreStorage;
    }
    return clientStorage;
  }

  /**
   * Execute an operation with fallback to local storage
   */
  private async withFallback<T>(
    operation: (storage: IClientStorage) => Promise<T>,
    operationName: string
  ): Promise<T> {
    try {
      const storage = this.getActiveStorage();
      return await operation(storage);
    } catch (error) {
      // If we're in cloud mode and operation failed, try local storage as fallback
      if (currentMode === 'cloud') {
        console.warn(
          `[Storage Router] ${operationName} failed in cloud mode, falling back to local`
        );
        logError(operationName, error);
        return await operation(clientStorage);
      }
      throw error;
    }
  }

  // ==========================================
  // Session Management
  // ==========================================

  async getCurrentUserId(): Promise<string | null> {
    return this.withFallback((s) => s.getCurrentUserId(), 'getCurrentUserId');
  }

  async setCurrentUserId(userId: string): Promise<void> {
    // Set in both storages to keep them in sync
    await clientStorage.setCurrentUserId(userId);
    if (firestoreAvailable) {
      await firestoreStorage.setCurrentUserId(userId);
    }
  }

  async clearCurrentUser(): Promise<void> {
    await clientStorage.clearCurrentUser();
    if (firestoreAvailable) {
      await firestoreStorage.clearCurrentUser();
    }
  }

  async getAllUsers(): Promise<any[]> {
    return this.withFallback((s) => s.getAllUsers(), 'getAllUsers');
  }

  // ==========================================
  // Tenant Management
  // ==========================================

  async getTenants(): Promise<any[]> {
    return this.withFallback((s) => s.getTenants(), 'getTenants');
  }

  async getTenant(id: number): Promise<any> {
    return this.withFallback((s) => s.getTenant(id), 'getTenant');
  }

  async createTenant(tenant: any): Promise<any> {
    return this.withFallback((s) => s.createTenant(tenant), 'createTenant');
  }

  async updateTenant(id: number, updates: any): Promise<any> {
    return this.withFallback((s) => s.updateTenant(id, updates), 'updateTenant');
  }

  async getUsersByTenant(tenantId: number): Promise<any[]> {
    return this.withFallback((s) => s.getUsersByTenant(tenantId), 'getUsersByTenant');
  }

  // ==========================================
  // User Management
  // ==========================================

  async getUser(id: string): Promise<any> {
    return this.withFallback((s) => s.getUser(id), 'getUser');
  }

  async getUserById(id: string): Promise<any> {
    return this.withFallback((s) => s.getUserById(id), 'getUserById');
  }

  async getUserByEmail(email: string): Promise<any> {
    return this.withFallback((s) => s.getUserByEmail(email), 'getUserByEmail');
  }

  async createUser(user: any): Promise<any> {
    return this.withFallback((s) => s.createUser(user), 'createUser');
  }

  async updateUser(id: string, updates: any): Promise<any> {
    return this.withFallback((s) => s.updateUser(id, updates), 'updateUser');
  }

  async updateUserGoals(id: string, goals: any): Promise<any> {
    return this.withFallback((s) => s.updateUserGoals(id, goals), 'updateUserGoals');
  }

  // ==========================================
  // Categories
  // ==========================================

  async getCategories(tenantId?: number): Promise<any[]> {
    return this.withFallback((s) => s.getCategories(tenantId), 'getCategories');
  }

  async createCategory(category: any): Promise<any> {
    return this.withFallback((s) => s.createCategory(category), 'createCategory');
  }

  async updateCategory(id: number, updates: any): Promise<any> {
    return this.withFallback((s) => s.updateCategory(id, updates), 'updateCategory');
  }

  async deleteCategory(id: number): Promise<void> {
    return this.withFallback((s) => s.deleteCategory(id), 'deleteCategory');
  }

  // ==========================================
  // Subcategories
  // ==========================================

  async getSubcategories(categoryId?: number, tenantId?: number): Promise<any[]> {
    return this.withFallback((s) => s.getSubcategories(categoryId, tenantId), 'getSubcategories');
  }

  async createSubcategory(subcategory: any): Promise<any> {
    return this.withFallback((s) => s.createSubcategory(subcategory), 'createSubcategory');
  }

  async updateSubcategory(id: number, updates: any): Promise<any> {
    return this.withFallback((s) => s.updateSubcategory(id, updates), 'updateSubcategory');
  }

  async deleteSubcategory(id: number): Promise<void> {
    return this.withFallback((s) => s.deleteSubcategory(id), 'deleteSubcategory');
  }

  // ==========================================
  // Questions
  // ==========================================

  async getQuestionsByCategories(
    categoryIds: number[],
    subcategoryIds?: number[],
    difficultyLevels?: number[],
    tenantId?: number
  ): Promise<any[]> {
    return this.withFallback(
      (s) => s.getQuestionsByCategories(categoryIds, subcategoryIds, difficultyLevels, tenantId),
      'getQuestionsByCategories'
    );
  }

  async getQuestion(id: number): Promise<any> {
    return this.withFallback((s) => s.getQuestion(id), 'getQuestion');
  }

  async createQuestion(question: any): Promise<any> {
    return this.withFallback((s) => s.createQuestion(question), 'createQuestion');
  }

  async updateQuestion(id: number, updates: any): Promise<any> {
    return this.withFallback((s) => s.updateQuestion(id, updates), 'updateQuestion');
  }

  async deleteQuestion(id: number): Promise<void> {
    return this.withFallback((s) => s.deleteQuestion(id), 'deleteQuestion');
  }

  async getQuestionsByTenant(tenantId: number): Promise<any[]> {
    return this.withFallback((s) => s.getQuestionsByTenant(tenantId), 'getQuestionsByTenant');
  }

  // ==========================================
  // Quizzes
  // ==========================================

  async createQuiz(quiz: any): Promise<any> {
    return this.withFallback((s) => s.createQuiz(quiz), 'createQuiz');
  }

  async getQuiz(id: number): Promise<any> {
    return this.withFallback((s) => s.getQuiz(id), 'getQuiz');
  }

  async getUserQuizzes(userId: string, tenantId?: number): Promise<any[]> {
    return this.withFallback((s) => s.getUserQuizzes(userId, tenantId), 'getUserQuizzes');
  }

  async updateQuiz(id: number, updates: any): Promise<any> {
    return this.withFallback((s) => s.updateQuiz(id, updates), 'updateQuiz');
  }

  async getQuizQuestions(quizId: number): Promise<any[]> {
    return this.withFallback((s) => s.getQuizQuestions(quizId), 'getQuizQuestions');
  }

  async submitQuiz(quizId: number, answers: any[]): Promise<any> {
    return this.withFallback((s) => s.submitQuiz(quizId, answers), 'submitQuiz');
  }

  // ==========================================
  // User Progress
  // ==========================================

  async getUserProgress(userId: string, tenantId?: number): Promise<any[]> {
    return this.withFallback((s) => s.getUserProgress(userId, tenantId), 'getUserProgress');
  }

  async updateUserProgress(
    userId: string,
    categoryId: number,
    progress: any,
    tenantId?: number
  ): Promise<any> {
    return this.withFallback(
      (s) => s.updateUserProgress(userId, categoryId, progress, tenantId),
      'updateUserProgress'
    );
  }

  async getUserStats(userId: string, tenantId?: number): Promise<any> {
    return this.withFallback((s) => s.getUserStats(userId, tenantId), 'getUserStats');
  }

  // ==========================================
  // Lectures
  // ==========================================

  async createLecture(
    userId: string,
    quizId: number,
    title: string,
    content: string,
    topics: string[],
    categoryId: number,
    tenantId?: number
  ): Promise<any> {
    return this.withFallback(
      (s) => s.createLecture(userId, quizId, title, content, topics, categoryId, tenantId),
      'createLecture'
    );
  }

  async getUserLectures(userId: string, tenantId?: number): Promise<any[]> {
    return this.withFallback((s) => s.getUserLectures(userId, tenantId), 'getUserLectures');
  }

  async getLecture(id: number): Promise<any> {
    return this.withFallback((s) => s.getLecture(id), 'getLecture');
  }

  // ==========================================
  // Mastery Scores
  // ==========================================

  async updateMasteryScore(
    userId: string,
    categoryId: number,
    subcategoryId: number,
    isCorrect: boolean
  ): Promise<void> {
    return this.withFallback(
      (s) => s.updateMasteryScore(userId, categoryId, subcategoryId, isCorrect),
      'updateMasteryScore'
    );
  }

  async getUserMasteryScores(userId: string, tenantId?: number): Promise<any[]> {
    return this.withFallback(
      (s) => s.getUserMasteryScores(userId, tenantId),
      'getUserMasteryScores'
    );
  }

  async calculateOverallMasteryScore(userId: string, tenantId?: number): Promise<number> {
    return this.withFallback(
      (s) => s.calculateOverallMasteryScore(userId, tenantId),
      'calculateOverallMasteryScore'
    );
  }

  async getCertificationMasteryScores(userId: string, tenantId?: number): Promise<any[]> {
    return this.withFallback(
      (s) => s.getCertificationMasteryScores(userId, tenantId),
      'getCertificationMasteryScores'
    );
  }

  // ==========================================
  // Badges
  // ==========================================

  async getBadges(): Promise<any[]> {
    return this.withFallback((s) => s.getBadges(), 'getBadges');
  }

  async getUserBadges(userId: string, tenantId?: number): Promise<any[]> {
    return this.withFallback((s) => s.getUserBadges(userId, tenantId), 'getUserBadges');
  }

  async createUserBadge(userBadge: any): Promise<any> {
    return this.withFallback((s) => s.createUserBadge(userBadge), 'createUserBadge');
  }

  async updateUserBadge(id: number, updates: any): Promise<any> {
    return this.withFallback((s) => s.updateUserBadge(id, updates), 'updateUserBadge');
  }

  // ==========================================
  // Game Stats
  // ==========================================

  async getUserGameStats(userId: string): Promise<any> {
    return this.withFallback((s) => s.getUserGameStats(userId), 'getUserGameStats');
  }

  async updateUserGameStats(userId: string, updates: any): Promise<any> {
    return this.withFallback((s) => s.updateUserGameStats(userId, updates), 'updateUserGameStats');
  }

  // ==========================================
  // Challenges
  // ==========================================

  async getChallenges(userId?: string): Promise<any[]> {
    return this.withFallback((s) => s.getChallenges(userId), 'getChallenges');
  }

  async getChallenge(id: number): Promise<any> {
    return this.withFallback((s) => s.getChallenge(id), 'getChallenge');
  }

  async createChallenge(challenge: any): Promise<any> {
    return this.withFallback((s) => s.createChallenge(challenge), 'createChallenge');
  }

  async getChallengeAttempts(userId: string): Promise<any[]> {
    return this.withFallback((s) => s.getChallengeAttempts(userId), 'getChallengeAttempts');
  }

  async createChallengeAttempt(attempt: any): Promise<any> {
    return this.withFallback((s) => s.createChallengeAttempt(attempt), 'createChallengeAttempt');
  }

  // ==========================================
  // Study Groups
  // ==========================================

  async getStudyGroups(): Promise<any[]> {
    return this.withFallback((s) => s.getStudyGroups(), 'getStudyGroups');
  }

  async getStudyGroup(id: number): Promise<any> {
    return this.withFallback((s) => s.getStudyGroup(id), 'getStudyGroup');
  }

  async createStudyGroup(group: any): Promise<any> {
    return this.withFallback((s) => s.createStudyGroup(group), 'createStudyGroup');
  }

  async getUserStudyGroups(userId: string): Promise<any[]> {
    return this.withFallback((s) => s.getUserStudyGroups(userId), 'getUserStudyGroups');
  }

  async joinStudyGroup(userId: string, groupId: number): Promise<any> {
    return this.withFallback((s) => s.joinStudyGroup(userId, groupId), 'joinStudyGroup');
  }

  async leaveStudyGroup(userId: string, groupId: number): Promise<void> {
    return this.withFallback((s) => s.leaveStudyGroup(userId, groupId), 'leaveStudyGroup');
  }

  // ==========================================
  // Practice Tests
  // ==========================================

  async getPracticeTests(): Promise<any[]> {
    return this.withFallback((s) => s.getPracticeTests(), 'getPracticeTests');
  }

  async getPracticeTest(id: number): Promise<any> {
    return this.withFallback((s) => s.getPracticeTest(id), 'getPracticeTest');
  }

  async createPracticeTest(test: any): Promise<any> {
    return this.withFallback((s) => s.createPracticeTest(test), 'createPracticeTest');
  }

  async getPracticeTestAttempts(userId: string, testId?: number): Promise<any[]> {
    return this.withFallback(
      (s) => s.getPracticeTestAttempts(userId, testId),
      'getPracticeTestAttempts'
    );
  }

  async createPracticeTestAttempt(attempt: any): Promise<any> {
    return this.withFallback(
      (s) => s.createPracticeTestAttempt(attempt),
      'createPracticeTestAttempt'
    );
  }

  async updatePracticeTestAttempt(id: number, updates: any): Promise<any> {
    return this.withFallback(
      (s) => s.updatePracticeTestAttempt(id, updates),
      'updatePracticeTestAttempt'
    );
  }

  // ==========================================
  // Token Management
  // ==========================================

  async getUserTokenBalance(userId: string): Promise<number> {
    return this.withFallback((s) => s.getUserTokenBalance(userId), 'getUserTokenBalance');
  }

  async addTokens(userId: string, amount: number): Promise<number> {
    return this.withFallback((s) => s.addTokens(userId, amount), 'addTokens');
  }

  async consumeTokens(userId: string, amount: number): Promise<any> {
    return this.withFallback((s) => s.consumeTokens(userId, amount), 'consumeTokens');
  }

  calculateQuizTokenCost(questionCount: number): number {
    return this.getActiveStorage().calculateQuizTokenCost(questionCount);
  }

  // ==========================================
  // Data Management
  // ==========================================

  async exportData(): Promise<string> {
    return this.withFallback((s) => s.exportData(), 'exportData');
  }

  async importData(jsonData: string): Promise<void> {
    return this.withFallback((s) => s.importData(jsonData), 'importData');
  }

  async clearAllData(): Promise<void> {
    return this.withFallback((s) => s.clearAllData(), 'clearAllData');
  }
}

// Export the storage router as the default storage interface
export const storage = new StorageRouter();

// For backward compatibility, also export as default
export default storage;
