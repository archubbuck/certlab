import { 
  users, categories, subcategories, questions, quizzes, userProgress,
  type User, type InsertUser, type Category, type InsertCategory,
  type Subcategory, type InsertSubcategory, type Question, type InsertQuestion,
  type Quiz, type InsertQuiz, type UserProgress, type InsertUserProgress
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, desc } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Categories and subcategories
  getCategories(): Promise<Category[]>;
  getSubcategories(categoryId?: number): Promise<Subcategory[]>;
  
  // Questions
  getQuestionsByCategories(categoryIds: number[], subcategoryIds?: number[]): Promise<Question[]>;
  getQuestion(id: number): Promise<Question | undefined>;
  
  // Quizzes
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  getUserQuizzes(userId: number): Promise<Quiz[]>;
  updateQuiz(id: number, updates: Partial<Quiz>): Promise<Quiz>;
  
  // User progress
  getUserProgress(userId: number): Promise<UserProgress[]>;
  updateUserProgress(userId: number, categoryId: number, progress: Partial<InsertUserProgress>): Promise<UserProgress>;
  getUserStats(userId: number): Promise<{
    totalQuizzes: number;
    averageScore: number;
    studyStreak: number;
    certifications: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.seedData();
  }

  private async seedData() {
    // Check if data already exists
    const existingCategories = await db.select().from(categories);
    if (existingCategories.length > 0) return;

    // Seed categories
    const cats = [
      { name: "CISSP", description: "Certified Information Systems Security Professional", icon: "fas fa-shield-alt" },
      { name: "Security+", description: "CompTIA Security+ Certification", icon: "fas fa-lock" },
      { name: "CEH", description: "Certified Ethical Hacker", icon: "fas fa-user-secret" },
      { name: "CISM", description: "Certified Information Security Manager", icon: "fas fa-cogs" },
    ];
    
    const insertedCategories = await db.insert(categories).values(cats).returning();

    // Seed subcategories for CISSP
    const cisspsubs = [
      { categoryId: insertedCategories[0].id, name: "Asset Security", description: "Information and asset classification" },
      { categoryId: insertedCategories[0].id, name: "Security Architecture", description: "Security models and architecture" },
      { categoryId: insertedCategories[0].id, name: "Communication Security", description: "Network and communication security" },
      { categoryId: insertedCategories[0].id, name: "Identity & Access Management", description: "IAM principles and practices" },
      { categoryId: insertedCategories[0].id, name: "Security Testing", description: "Assessment and testing" },
    ];

    const insertedSubcategories = await db.insert(subcategories).values(cisspsubs).returning();

    // Seed some questions for CISSP Asset Security
    const assetSecurityQuestions = [
      {
        categoryId: insertedCategories[0].id,
        subcategoryId: insertedSubcategories[0].id,
        text: "Which of the following is the PRIMARY purpose of implementing data classification in an organization?",
        options: [
          { text: "To ensure compliance with legal and regulatory requirements", id: 0 },
          { text: "To determine appropriate security controls and handling procedures", id: 1 },
          { text: "To reduce storage costs by identifying redundant data", id: 2 },
          { text: "To improve data processing performance", id: 3 }
        ],
        correctAnswer: 1,
        explanation: "The primary purpose of data classification is to determine appropriate security controls and handling procedures based on the sensitivity and value of the data."
      },
      {
        categoryId: insertedCategories[0].id,
        subcategoryId: insertedSubcategories[0].id,
        text: "What is the MOST important consideration when establishing data retention policies?",
        options: [
          { text: "Storage capacity limitations", id: 0 },
          { text: "Legal and regulatory requirements", id: 1 },
          { text: "Employee convenience", id: 2 },
          { text: "Technology refresh cycles", id: 3 }
        ],
        correctAnswer: 1,
        explanation: "Legal and regulatory requirements are the most important consideration when establishing data retention policies as they define mandatory retention periods."
      }
    ];

    await db.insert(questions).values(assetSecurityQuestions);
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getSubcategories(categoryId?: number): Promise<Subcategory[]> {
    if (categoryId) {
      return await db.select().from(subcategories).where(eq(subcategories.categoryId, categoryId));
    }
    return await db.select().from(subcategories);
  }

  async getQuestionsByCategories(categoryIds: number[], subcategoryIds?: number[]): Promise<Question[]> {
    if (subcategoryIds && subcategoryIds.length > 0) {
      return await db.select().from(questions).where(
        and(
          inArray(questions.categoryId, categoryIds),
          inArray(questions.subcategoryId, subcategoryIds)
        )
      );
    }
    
    return await db.select().from(questions).where(inArray(questions.categoryId, categoryIds));
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question || undefined;
  }

  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const [quiz] = await db.insert(quizzes).values({
      ...insertQuiz,
      timeLimit: insertQuiz.timeLimit || null
    }).returning();
    return quiz;
  }

  async getQuiz(id: number): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz || undefined;
  }

  async getUserQuizzes(userId: number): Promise<Quiz[]> {
    return await db.select().from(quizzes).where(eq(quizzes.userId, userId)).orderBy(desc(quizzes.startedAt));
  }

  async updateQuiz(id: number, updates: Partial<Quiz>): Promise<Quiz> {
    const [quiz] = await db.update(quizzes).set(updates).where(eq(quizzes.id, id)).returning();
    if (!quiz) throw new Error("Quiz not found");
    return quiz;
  }

  async getUserProgress(userId: number): Promise<UserProgress[]> {
    return await db.select().from(userProgress).where(eq(userProgress.userId, userId));
  }

  async updateUserProgress(userId: number, categoryId: number, progressData: Partial<InsertUserProgress>): Promise<UserProgress> {
    const [existing] = await db.select().from(userProgress).where(
      and(eq(userProgress.userId, userId), eq(userProgress.categoryId, categoryId))
    );
    
    if (existing) {
      const [updated] = await db.update(userProgress)
        .set(progressData)
        .where(and(eq(userProgress.userId, userId), eq(userProgress.categoryId, categoryId)))
        .returning();
      return updated;
    } else {
      const [newProgress] = await db.insert(userProgress).values({
        userId,
        categoryId,
        questionsCompleted: 0,
        totalQuestions: 0,
        averageScore: 0,
        lastQuizDate: null,
        ...progressData
      }).returning();
      return newProgress;
    }
  }

  async getUserStats(userId: number): Promise<{
    totalQuizzes: number;
    averageScore: number;
    studyStreak: number;
    certifications: number;
  }> {
    const userQuizzes = await this.getUserQuizzes(userId);
    const completedQuizzes = userQuizzes.filter(quiz => quiz.completedAt);
    
    const totalQuizzes = completedQuizzes.length;
    const averageScore = totalQuizzes > 0 
      ? Math.round(completedQuizzes.reduce((sum, quiz) => sum + (quiz.score || 0), 0) / totalQuizzes)
      : 0;
    
    // Simple streak calculation - consecutive days with quizzes
    const studyStreak = this.calculateStudyStreak(completedQuizzes);
    
    // Count certifications (categories with >80% average score)
    const progress = await this.getUserProgress(userId);
    const certifications = progress.filter(p => p.averageScore > 80).length;
    
    return {
      totalQuizzes,
      averageScore,
      studyStreak,
      certifications
    };
  }

  private calculateStudyStreak(quizzes: Quiz[]): number {
    if (quizzes.length === 0) return 0;
    
    const dates = quizzes
      .map(quiz => quiz.completedAt)
      .filter(date => date !== null)
      .map(date => new Date(date!).toDateString())
      .sort();
    
    const uniqueDates = Array.from(new Set(dates));
    if (uniqueDates.length === 0) return 0;
    
    let streak = 1;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    // Check if streak is current
    if (uniqueDates[uniqueDates.length - 1] !== today && uniqueDates[uniqueDates.length - 1] !== yesterday) {
      return 0;
    }
    
    for (let i = uniqueDates.length - 2; i >= 0; i--) {
      const current = new Date(uniqueDates[i + 1]);
      const previous = new Date(uniqueDates[i]);
      const diffTime = current.getTime() - previous.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }
}

export const storage = new DatabaseStorage();
