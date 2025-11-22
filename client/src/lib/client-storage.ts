/**
 * Client-side storage service
 * Mimics the server storage interface but uses IndexedDB instead of PostgreSQL
 */

import { indexedDB, STORES } from './indexeddb';
import type {
  User, Category, Subcategory, Question, Quiz, UserProgress,
  MasteryScore, Badge, UserBadge, UserGameStats, Challenge, ChallengeAttempt,
  StudyGroup, StudyGroupMember, PracticeTest, PracticeTestAttempt
} from '@shared/schema';

// Generate unique IDs
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

class ClientStorage {
  // Settings
  async getCurrentUserId(): Promise<string | null> {
    const setting = await indexedDB.get<{ key: string; value: string }>(STORES.settings, 'currentUserId');
    return setting?.value || null;
  }

  async setCurrentUserId(userId: string): Promise<void> {
    await indexedDB.put(STORES.settings, { key: 'currentUserId', value: userId });
  }

  async clearCurrentUser(): Promise<void> {
    await indexedDB.delete(STORES.settings, 'currentUserId');
  }

  // User management
  async getUser(id: string): Promise<User | undefined> {
    return await indexedDB.get<User>(STORES.users, id);
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return await indexedDB.getOneByIndex<User>(STORES.users, 'email', email);
  }

  async createUser(user: Partial<User>): Promise<User> {
    const newUser: User = {
      id: user.id || generateId(),
      email: user.email!,
      passwordHash: user.passwordHash || null,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      profileImageUrl: user.profileImageUrl || null,
      role: user.role || 'user',
      tenantId: user.tenantId || 1,
      certificationGoals: user.certificationGoals || null,
      studyPreferences: user.studyPreferences || null,
      skillsAssessment: user.skillsAssessment || null,
      polarCustomerId: user.polarCustomerId || null,
      createdAt: user.createdAt || new Date(),
      updatedAt: user.updatedAt || new Date(),
    };
    await indexedDB.put(STORES.users, newUser);
    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const user = await this.getUser(id);
    if (!user) return null;
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    await indexedDB.put(STORES.users, updatedUser);
    return updatedUser;
  }

  async updateUserGoals(id: string, goals: {
    certificationGoals: string[];
    studyPreferences: any;
    skillsAssessment: any;
  }): Promise<User | null> {
    return this.updateUser(id, goals);
  }

  // Categories
  async getCategories(tenantId: number = 1): Promise<Category[]> {
    const all = await indexedDB.getByIndex<Category>(STORES.categories, 'tenantId', tenantId);
    return all;
  }

  async createCategory(category: Partial<Category>): Promise<Category> {
    const newCategory: any = {
      tenantId: category.tenantId || 1,
      name: category.name!,
      description: category.description || null,
      icon: category.icon || null,
    };
    const id = await indexedDB.add(STORES.categories, newCategory);
    return { ...newCategory, id: Number(id) };
  }

  async updateCategory(id: number, updates: Partial<Category>): Promise<Category> {
    const category = await indexedDB.get<Category>(STORES.categories, id);
    if (!category) throw new Error('Category not found');
    
    const updated = { ...category, ...updates };
    await indexedDB.put(STORES.categories, updated);
    return updated;
  }

  async deleteCategory(id: number): Promise<void> {
    await indexedDB.delete(STORES.categories, id);
  }

  // Subcategories
  async getSubcategories(categoryId?: number, tenantId: number = 1): Promise<Subcategory[]> {
    if (categoryId) {
      return await indexedDB.getByIndex<Subcategory>(STORES.subcategories, 'categoryId', categoryId);
    }
    return await indexedDB.getByIndex<Subcategory>(STORES.subcategories, 'tenantId', tenantId);
  }

  async createSubcategory(subcategory: Partial<Subcategory>): Promise<Subcategory> {
    const newSubcategory: any = {
      tenantId: subcategory.tenantId || 1,
      categoryId: subcategory.categoryId!,
      name: subcategory.name!,
      description: subcategory.description || null,
    };
    const id = await indexedDB.add(STORES.subcategories, newSubcategory);
    return { ...newSubcategory, id: Number(id) };
  }

  async updateSubcategory(id: number, updates: Partial<Subcategory>): Promise<Subcategory> {
    const subcategory = await indexedDB.get<Subcategory>(STORES.subcategories, id);
    if (!subcategory) throw new Error('Subcategory not found');
    
    const updated = { ...subcategory, ...updates };
    await indexedDB.put(STORES.subcategories, updated);
    return updated;
  }

  async deleteSubcategory(id: number): Promise<void> {
    await indexedDB.delete(STORES.subcategories, id);
  }

  // Questions
  async getQuestionsByCategories(
    categoryIds: number[],
    subcategoryIds?: number[],
    difficultyLevels?: number[],
    tenantId: number = 1
  ): Promise<Question[]> {
    const allQuestions = await indexedDB.getByIndex<Question>(STORES.questions, 'tenantId', tenantId);
    
    return allQuestions.filter(q => {
      const categoryMatch = categoryIds.includes(q.categoryId);
      const subcategoryMatch = !subcategoryIds || subcategoryIds.length === 0 || subcategoryIds.includes(q.subcategoryId);
      const difficultyMatch = !difficultyLevels || difficultyLevels.length === 0 || (q.difficultyLevel && difficultyLevels.includes(q.difficultyLevel));
      return categoryMatch && subcategoryMatch && difficultyMatch;
    });
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    return await indexedDB.get<Question>(STORES.questions, id);
  }

  async createQuestion(question: Partial<Question>): Promise<Question> {
    const newQuestion: any = {
      tenantId: question.tenantId || 1,
      categoryId: question.categoryId!,
      subcategoryId: question.subcategoryId!,
      text: question.text!,
      options: question.options!,
      correctAnswer: question.correctAnswer!,
      explanation: question.explanation || null,
      difficultyLevel: question.difficultyLevel || 1,
      tags: question.tags || null,
    };
    const id = await indexedDB.add(STORES.questions, newQuestion);
    return { ...newQuestion, id: Number(id) };
  }

  async updateQuestion(id: number, updates: Partial<Question>): Promise<Question> {
    const question = await indexedDB.get<Question>(STORES.questions, id);
    if (!question) throw new Error('Question not found');
    
    const updated = { ...question, ...updates };
    await indexedDB.put(STORES.questions, updated);
    return updated;
  }

  async deleteQuestion(id: number): Promise<void> {
    await indexedDB.delete(STORES.questions, id);
  }

  async getQuestionsByTenant(tenantId: number): Promise<Question[]> {
    return await indexedDB.getByIndex<Question>(STORES.questions, 'tenantId', tenantId);
  }

  // Quizzes
  async createQuiz(quiz: Partial<Quiz>): Promise<Quiz> {
    const newQuiz: any = {
      userId: quiz.userId!,
      title: quiz.title!,
      categoryIds: quiz.categoryIds!,
      subcategoryIds: quiz.subcategoryIds || [],
      questionCount: quiz.questionCount!,
      timeLimit: quiz.timeLimit || null,
      startedAt: quiz.startedAt || new Date(),
      completedAt: quiz.completedAt || null,
      score: quiz.score || null,
      correctAnswers: quiz.correctAnswers || null,
      totalQuestions: quiz.totalQuestions || null,
      answers: quiz.answers || null,
      isAdaptive: quiz.isAdaptive || false,
      adaptiveMetrics: quiz.adaptiveMetrics || null,
      difficultyLevel: quiz.difficultyLevel || 1,
      difficultyFilter: quiz.difficultyFilter || null,
      isPassing: quiz.isPassing || false,
      missedTopics: quiz.missedTopics || null,
      mode: quiz.mode || 'study',
    };
    const id = await indexedDB.add(STORES.quizzes, newQuiz);
    return { ...newQuiz, id: Number(id) };
  }

  async getQuiz(id: number): Promise<Quiz | undefined> {
    return await indexedDB.get<Quiz>(STORES.quizzes, id);
  }

  async getUserQuizzes(userId: string): Promise<Quiz[]> {
    const quizzes = await indexedDB.getByIndex<Quiz>(STORES.quizzes, 'userId', userId);
    return quizzes.sort((a, b) => {
      const aDate = a.startedAt ? new Date(a.startedAt).getTime() : 0;
      const bDate = b.startedAt ? new Date(b.startedAt).getTime() : 0;
      return bDate - aDate;
    });
  }

  async updateQuiz(id: number, updates: Partial<Quiz>): Promise<Quiz> {
    const quiz = await indexedDB.get<Quiz>(STORES.quizzes, id);
    if (!quiz) throw new Error('Quiz not found');
    
    const updated = { ...quiz, ...updates };
    await indexedDB.put(STORES.quizzes, updated);
    return updated;
  }

  // User Progress
  async getUserProgress(userId: string): Promise<UserProgress[]> {
    return await indexedDB.getByIndex<UserProgress>(STORES.userProgress, 'userId', userId);
  }

  async updateUserProgress(userId: string, categoryId: number, progress: Partial<UserProgress>): Promise<UserProgress> {
    // Try to find existing progress
    const allProgress = await this.getUserProgress(userId);
    const existing = allProgress.find(p => p.categoryId === categoryId);
    
    if (existing) {
      const updated = { ...existing, ...progress };
      await indexedDB.put(STORES.userProgress, updated);
      return updated;
    } else {
      const newProgress: any = {
        userId,
        categoryId,
        questionsCompleted: progress.questionsCompleted || 0,
        totalQuestions: progress.totalQuestions || 0,
        averageScore: progress.averageScore || 0,
        lastQuizDate: progress.lastQuizDate || null,
        adaptiveDifficulty: progress.adaptiveDifficulty || 1,
        consecutiveCorrect: progress.consecutiveCorrect || 0,
        consecutiveWrong: progress.consecutiveWrong || 0,
        weakSubcategories: progress.weakSubcategories || null,
      };
      const id = await indexedDB.add(STORES.userProgress, newProgress);
      return { ...newProgress, id: Number(id) };
    }
  }

  async getUserStats(userId: string): Promise<{
    totalQuizzes: number;
    averageScore: number;
    studyStreak: number;
    certifications: number;
    passingRate: number;
    masteryScore: number;
  }> {
    const quizzes = await this.getUserQuizzes(userId);
    const completedQuizzes = quizzes.filter(q => q.completedAt);
    
    const totalQuizzes = completedQuizzes.length;
    const averageScore = totalQuizzes > 0
      ? Math.round(completedQuizzes.reduce((sum, q) => sum + (q.score || 0), 0) / totalQuizzes)
      : 0;
    
    const passingQuizzes = completedQuizzes.filter(q => (q.score || 0) >= 85);
    const passingRate = totalQuizzes > 0
      ? Math.round((passingQuizzes.length / totalQuizzes) * 100)
      : 0;
    
    // Calculate study streak
    const sortedQuizzes = completedQuizzes
      .filter(q => q.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
    
    let studyStreak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const quiz of sortedQuizzes) {
      const quizDate = new Date(quiz.completedAt!);
      quizDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((currentDate.getTime() - quizDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === studyStreak) {
        studyStreak++;
      } else if (daysDiff > studyStreak) {
        break;
      }
    }
    
    const masteryScore = await this.calculateOverallMasteryScore(userId);
    
    return {
      totalQuizzes,
      averageScore,
      studyStreak,
      certifications: 0, // Not implemented in client-side version
      passingRate,
      masteryScore,
    };
  }

  // Lectures
  async createLecture(userId: string, quizId: number, title: string, content: string, topics: string[], categoryId: number): Promise<any> {
    const lecture: any = {
      userId,
      quizId,
      title,
      content,
      topics,
      categoryId,
      subcategoryId: null,
      createdAt: new Date(),
      isRead: false,
    };
    const id = await indexedDB.add(STORES.lectures, lecture);
    return { ...lecture, id: Number(id) };
  }

  async getUserLectures(userId: string): Promise<any[]> {
    const lectures = await indexedDB.getByIndex(STORES.lectures, 'userId', userId);
    return lectures.sort((a: any, b: any) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    });
  }

  async getLecture(id: number): Promise<any> {
    return await indexedDB.get(STORES.lectures, id);
  }

  // Mastery Scores
  async updateMasteryScore(userId: string, categoryId: number, subcategoryId: number, isCorrect: boolean): Promise<void> {
    const allScores = await indexedDB.getByIndex<MasteryScore>(STORES.masteryScores, 'userId', userId);
    const existing = allScores.find(s => s.categoryId === categoryId && s.subcategoryId === subcategoryId);
    
    if (existing) {
      const newCorrect = isCorrect ? existing.correctAnswers + 1 : existing.correctAnswers;
      const newTotal = existing.totalAnswers + 1;
      const rollingAverage = Math.round((newCorrect / newTotal) * 100);
      
      const updated = {
        ...existing,
        correctAnswers: newCorrect,
        totalAnswers: newTotal,
        rollingAverage,
        lastUpdated: new Date(),
      };
      await indexedDB.put(STORES.masteryScores, updated);
    } else {
      const newScore: any = {
        userId,
        categoryId,
        subcategoryId,
        correctAnswers: isCorrect ? 1 : 0,
        totalAnswers: 1,
        rollingAverage: isCorrect ? 100 : 0,
        lastUpdated: new Date(),
      };
      await indexedDB.add(STORES.masteryScores, newScore);
    }
  }

  async getUserMasteryScores(userId: string): Promise<MasteryScore[]> {
    return await indexedDB.getByIndex<MasteryScore>(STORES.masteryScores, 'userId', userId);
  }

  async calculateOverallMasteryScore(userId: string): Promise<number> {
    const scores = await this.getUserMasteryScores(userId);
    if (scores.length === 0) return 0;
    
    const totalAverage = scores.reduce((sum, s) => sum + s.rollingAverage, 0);
    return Math.round(totalAverage / scores.length);
  }

  async getCertificationMasteryScores(userId: string): Promise<{ categoryId: number; masteryScore: number }[]> {
    const scores = await this.getUserMasteryScores(userId);
    const categoryScores = new Map<number, { total: number; count: number }>();
    
    for (const score of scores) {
      const existing = categoryScores.get(score.categoryId) || { total: 0, count: 0 };
      categoryScores.set(score.categoryId, {
        total: existing.total + score.rollingAverage,
        count: existing.count + 1,
      });
    }
    
    return Array.from(categoryScores.entries()).map(([categoryId, data]) => ({
      categoryId,
      masteryScore: Math.round(data.total / data.count),
    }));
  }

  // Badges
  async getBadges(): Promise<Badge[]> {
    return await indexedDB.getAll<Badge>(STORES.badges);
  }

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return await indexedDB.getByIndex<UserBadge>(STORES.userBadges, 'userId', userId);
  }

  async createUserBadge(userBadge: Partial<UserBadge>): Promise<UserBadge> {
    const newBadge: any = {
      userId: userBadge.userId!,
      badgeId: userBadge.badgeId!,
      earnedAt: userBadge.earnedAt || new Date(),
      progress: userBadge.progress || 0,
      isNotified: userBadge.isNotified || false,
    };
    const id = await indexedDB.add(STORES.userBadges, newBadge);
    return { ...newBadge, id: Number(id) };
  }

  async updateUserBadge(id: number, updates: Partial<UserBadge>): Promise<UserBadge> {
    const badge = await indexedDB.get<UserBadge>(STORES.userBadges, id);
    if (!badge) throw new Error('User badge not found');
    
    const updated = { ...badge, ...updates };
    await indexedDB.put(STORES.userBadges, updated);
    return updated;
  }

  // Game Stats
  async getUserGameStats(userId: string): Promise<UserGameStats | undefined> {
    return await indexedDB.getOneByIndex<UserGameStats>(STORES.userGameStats, 'userId', userId);
  }

  async updateUserGameStats(userId: string, updates: Partial<UserGameStats>): Promise<UserGameStats> {
    const existing = await this.getUserGameStats(userId);
    
    if (existing) {
      const updated = { ...existing, ...updates, updatedAt: new Date() };
      await indexedDB.put(STORES.userGameStats, updated);
      return updated;
    } else {
      const newStats: any = {
        userId,
        totalPoints: updates.totalPoints || 0,
        currentStreak: updates.currentStreak || 0,
        longestStreak: updates.longestStreak || 0,
        lastActivityDate: updates.lastActivityDate || null,
        totalBadgesEarned: updates.totalBadgesEarned || 0,
        level: updates.level || 1,
        nextLevelPoints: updates.nextLevelPoints || 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const id = await indexedDB.add(STORES.userGameStats, newStats);
      return { ...newStats, id: Number(id) };
    }
  }

  // Challenges
  async getChallenges(userId?: string): Promise<Challenge[]> {
    if (userId) {
      return await indexedDB.getByIndex<Challenge>(STORES.challenges, 'userId', userId);
    }
    return await indexedDB.getAll<Challenge>(STORES.challenges);
  }

  async getChallenge(id: number): Promise<Challenge | undefined> {
    return await indexedDB.get<Challenge>(STORES.challenges, id);
  }

  async createChallenge(challenge: Partial<Challenge>): Promise<Challenge> {
    const newChallenge: any = {
      userId: challenge.userId!,
      type: challenge.type!,
      title: challenge.title!,
      description: challenge.description || null,
      categoryId: challenge.categoryId || null,
      subcategoryId: challenge.subcategoryId || null,
      targetScore: challenge.targetScore || 80,
      questionsCount: challenge.questionsCount || 5,
      timeLimit: challenge.timeLimit || 5,
      difficulty: challenge.difficulty || 1,
      streakMultiplier: challenge.streakMultiplier || 1,
      pointsReward: challenge.pointsReward || 50,
      isActive: challenge.isActive ?? true,
      availableAt: challenge.availableAt || new Date(),
      expiresAt: challenge.expiresAt || null,
      createdAt: challenge.createdAt || new Date(),
    };
    const id = await indexedDB.add(STORES.challenges, newChallenge);
    return { ...newChallenge, id: Number(id) };
  }

  async getChallengeAttempts(userId: string): Promise<ChallengeAttempt[]> {
    return await indexedDB.getByIndex<ChallengeAttempt>(STORES.challengeAttempts, 'userId', userId);
  }

  async createChallengeAttempt(attempt: Partial<ChallengeAttempt>): Promise<ChallengeAttempt> {
    const newAttempt: any = {
      userId: attempt.userId!,
      challengeId: attempt.challengeId!,
      quizId: attempt.quizId || null,
      score: attempt.score || null,
      pointsEarned: attempt.pointsEarned || 0,
      timeSpent: attempt.timeSpent || null,
      isCompleted: attempt.isCompleted || false,
      isPassed: attempt.isPassed || false,
      answers: attempt.answers || null,
      startedAt: attempt.startedAt || new Date(),
      completedAt: attempt.completedAt || null,
    };
    const id = await indexedDB.add(STORES.challengeAttempts, newAttempt);
    return { ...newAttempt, id: Number(id) };
  }

  // Study Groups
  async getStudyGroups(): Promise<StudyGroup[]> {
    return await indexedDB.getAll<StudyGroup>(STORES.studyGroups);
  }

  async getStudyGroup(id: number): Promise<StudyGroup | undefined> {
    return await indexedDB.get<StudyGroup>(STORES.studyGroups, id);
  }

  async createStudyGroup(group: Partial<StudyGroup>): Promise<StudyGroup> {
    const newGroup: any = {
      name: group.name!,
      description: group.description || null,
      creatorId: group.creatorId!,
      categoryId: group.categoryId || null,
      isPublic: group.isPublic ?? true,
      maxMembers: group.maxMembers || null,
      createdAt: group.createdAt || new Date(),
    };
    const id = await indexedDB.add(STORES.studyGroups, newGroup);
    return { ...newGroup, id: Number(id) };
  }

  async getUserStudyGroups(userId: string): Promise<StudyGroup[]> {
    const memberships = await indexedDB.getByIndex<StudyGroupMember>(STORES.studyGroupMembers, 'userId', userId);
    const groupIds = memberships.map(m => m.groupId);
    const groups = await this.getStudyGroups();
    return groups.filter(g => groupIds.includes(g.id));
  }

  async joinStudyGroup(userId: string, groupId: number): Promise<StudyGroupMember> {
    const member: any = {
      userId,
      groupId,
      joinedAt: new Date(),
      role: 'member',
    };
    const id = await indexedDB.add(STORES.studyGroupMembers, member);
    return { ...member, id: Number(id) };
  }

  async leaveStudyGroup(userId: string, groupId: number): Promise<void> {
    const memberships = await indexedDB.getByIndex<StudyGroupMember>(STORES.studyGroupMembers, 'userId', userId);
    const membership = memberships.find(m => m.groupId === groupId);
    if (membership) {
      await indexedDB.delete(STORES.studyGroupMembers, membership.id);
    }
  }

  // Practice Tests
  async getPracticeTests(): Promise<PracticeTest[]> {
    return await indexedDB.getAll<PracticeTest>(STORES.practiceTests);
  }

  async getPracticeTest(id: number): Promise<PracticeTest | undefined> {
    return await indexedDB.get<PracticeTest>(STORES.practiceTests, id);
  }

  async createPracticeTest(test: Partial<PracticeTest>): Promise<PracticeTest> {
    const newTest: any = {
      title: test.title!,
      description: test.description || null,
      categoryId: test.categoryId!,
      questionsCount: test.questionsCount || 50,
      timeLimit: test.timeLimit || 60,
      passingScore: test.passingScore || 70,
      createdAt: test.createdAt || new Date(),
    };
    const id = await indexedDB.add(STORES.practiceTests, newTest);
    return { ...newTest, id: Number(id) };
  }

  async getPracticeTestAttempts(userId: string, testId?: number): Promise<PracticeTestAttempt[]> {
    const attempts = await indexedDB.getByIndex<PracticeTestAttempt>(STORES.practiceTestAttempts, 'userId', userId);
    if (testId) {
      return attempts.filter(a => a.testId === testId);
    }
    return attempts;
  }

  async createPracticeTestAttempt(attempt: Partial<PracticeTestAttempt>): Promise<PracticeTestAttempt> {
    const newAttempt: any = {
      userId: attempt.userId!,
      testId: attempt.testId!,
      quizId: attempt.quizId!,
      score: attempt.score || null,
      isPassed: attempt.isPassed || false,
      startedAt: attempt.startedAt || new Date(),
      completedAt: attempt.completedAt || null,
    };
    const id = await indexedDB.add(STORES.practiceTestAttempts, newAttempt);
    return { ...newAttempt, id: Number(id) };
  }

  async updatePracticeTestAttempt(id: number, updates: Partial<PracticeTestAttempt>): Promise<PracticeTestAttempt> {
    const attempt = await indexedDB.get<PracticeTestAttempt>(STORES.practiceTestAttempts, id);
    if (!attempt) throw new Error('Practice test attempt not found');
    
    const updated = { ...attempt, ...updates };
    await indexedDB.put(STORES.practiceTestAttempts, updated);
    return updated;
  }

  // Data export/import
  async exportData(): Promise<string> {
    const data = await indexedDB.exportData();
    return JSON.stringify(data, null, 2);
  }

  async importData(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData);
    await indexedDB.importData(data);
  }

  async clearAllData(): Promise<void> {
    await indexedDB.clearAllData();
    await this.clearCurrentUser();
  }
}

export const clientStorage = new ClientStorage();
