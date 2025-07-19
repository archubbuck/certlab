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

    // Seed categories based on authentic certification data
    const cats = [
      { name: "CC", description: "Certified in Cybersecurity", icon: "fas fa-shield-alt" },
      { name: "CGRC", description: "Certified in Governance, Risk and Compliance", icon: "fas fa-balance-scale" },
      { name: "CISA", description: "Certified Information Systems Auditor", icon: "fas fa-search" },
      { name: "CISM", description: "Certified Information Security Manager", icon: "fas fa-cogs" },
      { name: "CISSP", description: "Certified Information Systems Security Professional", icon: "fas fa-lock" },
      { name: "Cloud+", description: "CompTIA Cloud+ Certification", icon: "fas fa-cloud" },
    ];
    
    const insertedCategories = await db.insert(categories).values(cats).returning();

    // Create subcategories mapping
    const subcategoriesData = [];
    
    // CC - Certified in Cybersecurity domains
    const ccCategory = insertedCategories.find(cat => cat.name === "CC");
    if (ccCategory) {
      subcategoriesData.push(
        { categoryId: ccCategory.id, name: "Security Principles", description: "Domain 1: Security Principles" },
        { categoryId: ccCategory.id, name: "Business Continuity & Incident Response", description: "Domain 2: Business Continuity, Disaster Recovery, and Incident Response Concepts" },
        { categoryId: ccCategory.id, name: "Access Control Concepts", description: "Domain 3: Access Control Concepts" },
        { categoryId: ccCategory.id, name: "Network Security", description: "Domain 4: Network Security Concepts" },
        { categoryId: ccCategory.id, name: "Security Operations", description: "Domain 5: Security Operations Concepts" }
      );
    }

    // CGRC - Certified in Governance, Risk and Compliance domains
    const cgrcCategory = insertedCategories.find(cat => cat.name === "CGRC");
    if (cgrcCategory) {
      subcategoriesData.push(
        { categoryId: cgrcCategory.id, name: "Security & Privacy Governance", description: "Domain 1: Security and Privacy Governance, Risk Management, and Compliance Program" },
        { categoryId: cgrcCategory.id, name: "Information System Scope", description: "Domain 2: Scope of the Information System" },
        { categoryId: cgrcCategory.id, name: "Control Selection & Approval", description: "Domain 3: Selection and Approval of Security and Privacy Controls" },
        { categoryId: cgrcCategory.id, name: "Control Implementation", description: "Domain 4: Implementation of Security and Privacy Controls" },
        { categoryId: cgrcCategory.id, name: "Control Assessment & Audit", description: "Domain 5: Assessment/Audit of Security and Privacy Controls" },
        { categoryId: cgrcCategory.id, name: "System Compliance", description: "Domain 6: System Compliance" },
        { categoryId: cgrcCategory.id, name: "Compliance Maintenance", description: "Domain 7: Compliance Maintenance" }
      );
    }

    // CISA - Certified Information Systems Auditor domain
    const cisaCategory = insertedCategories.find(cat => cat.name === "CISA");
    if (cisaCategory) {
      subcategoriesData.push(
        { categoryId: cisaCategory.id, name: "Information Systems Auditing Process", description: "Domain 1: Information Systems Auditing Process" }
      );
    }

    // CISM - Certified Information Security Manager domains
    const cismCategory = insertedCategories.find(cat => cat.name === "CISM");
    if (cismCategory) {
      subcategoriesData.push(
        { categoryId: cismCategory.id, name: "Information Security Governance", description: "Domain 1: Information Security Governance" },
        { categoryId: cismCategory.id, name: "Information Security Risk Management", description: "Domain 2: Information Security Risk Management" },
        { categoryId: cismCategory.id, name: "Information Security Program", description: "Domain 3: Information Security Program" },
        { categoryId: cismCategory.id, name: "Incident Management & Response", description: "Domain 4: Incident Management and Response" }
      );
    }

    // CISSP - Certified Information Systems Security Professional domains
    const cisspCategory = insertedCategories.find(cat => cat.name === "CISSP");
    if (cisspCategory) {
      subcategoriesData.push(
        { categoryId: cisspCategory.id, name: "Security & Risk Management", description: "Domain 1: Security and Risk Management" },
        { categoryId: cisspCategory.id, name: "Asset Security", description: "Domain 2: Asset Security" },
        { categoryId: cisspCategory.id, name: "Security Architecture & Engineering", description: "Domain 3: Security Architecture and Engineering" },
        { categoryId: cisspCategory.id, name: "Communication & Network Security", description: "Domain 4: Communication and Network Security" },
        { categoryId: cisspCategory.id, name: "Identity & Access Management", description: "Domain 5: Identity and Access Management" },
        { categoryId: cisspCategory.id, name: "Security Assessment & Testing", description: "Domain 6: Security Assessment and Testing" },
        { categoryId: cisspCategory.id, name: "Security Operations", description: "Domain 7: Security Operations" },
        { categoryId: cisspCategory.id, name: "Software Development Security", description: "Domain 8: Software Development Security" }
      );
    }

    // Cloud+ - CompTIA Cloud+ domains
    const cloudCategory = insertedCategories.find(cat => cat.name === "Cloud+");
    if (cloudCategory) {
      subcategoriesData.push(
        { categoryId: cloudCategory.id, name: "Cloud Architecture & Design", description: "Domain 1: Cloud Architecture & Design" },
        { categoryId: cloudCategory.id, name: "Cloud Security", description: "Domain 2: Cloud Security" },
        { categoryId: cloudCategory.id, name: "Cloud Deployment", description: "Domain 3: Cloud Deployment" },
        { categoryId: cloudCategory.id, name: "Operations & Support", description: "Domain 4: Operations and Support" },
        { categoryId: cloudCategory.id, name: "Troubleshooting", description: "Domain 5: Troubleshooting" }
      );
    }

    const insertedSubcategories = await db.insert(subcategories).values(subcategoriesData).returning();

    // Seed sample questions for different certifications
    const sampleQuestions = [];

    // CC - Security Principles questions
    const ccSecurityPrinciplesSubcat = insertedSubcategories.find(sub => sub.name === "Security Principles");
    if (ccSecurityPrinciplesSubcat) {
      const ccCategory = insertedCategories.find(cat => cat.name === "CC");
      sampleQuestions.push(
        {
          categoryId: ccCategory.id,
          subcategoryId: ccSecurityPrinciplesSubcat.id,
          text: "What is the PRIMARY goal of implementing the CIA triad in information security?",
          options: [
            { text: "To ensure data is encrypted at rest", id: 0 },
            { text: "To maintain confidentiality, integrity, and availability of information", id: 1 },
            { text: "To comply with regulatory requirements", id: 2 },
            { text: "To reduce operational costs", id: 3 }
          ],
          correctAnswer: 1,
          explanation: "The CIA triad (Confidentiality, Integrity, and Availability) represents the three fundamental principles of information security that must be maintained to protect organizational data and systems."
        },
        {
          categoryId: ccCategory.id,
          subcategoryId: ccSecurityPrinciplesSubcat.id,
          text: "Which principle ensures that information is accessible to authorized users when needed?",
          options: [
            { text: "Confidentiality", id: 0 },
            { text: "Integrity", id: 1 },
            { text: "Availability", id: 2 },
            { text: "Non-repudiation", id: 3 }
          ],
          correctAnswer: 2,
          explanation: "Availability ensures that information and systems are accessible to authorized users when they need them, preventing disruptions to business operations."
        }
      );
    }

    // CISSP - Asset Security questions
    const cisspAssetSecuritySubcat = insertedSubcategories.find(sub => sub.name === "Asset Security");
    if (cisspAssetSecuritySubcat) {
      const cisspCategory = insertedCategories.find(cat => cat.name === "CISSP");
      sampleQuestions.push(
        {
          categoryId: cisspCategory.id,
          subcategoryId: cisspAssetSecuritySubcat.id,
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
          categoryId: cisspCategory.id,
          subcategoryId: cisspAssetSecuritySubcat.id,
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
      );
    }

    // Cloud+ - Cloud Security questions
    const cloudSecuritySubcat = insertedSubcategories.find(sub => sub.name === "Cloud Security");
    if (cloudSecuritySubcat) {
      const cloudCategory = insertedCategories.find(cat => cat.name === "Cloud+");
      sampleQuestions.push(
        {
          categoryId: cloudCategory.id,
          subcategoryId: cloudSecuritySubcat.id,
          text: "Which cloud security model assigns security responsibilities between the cloud provider and customer?",
          options: [
            { text: "Zero Trust Model", id: 0 },
            { text: "Shared Responsibility Model", id: 1 },
            { text: "Defense in Depth Model", id: 2 },
            { text: "Least Privilege Model", id: 3 }
          ],
          correctAnswer: 1,
          explanation: "The Shared Responsibility Model defines the division of security responsibilities between cloud service providers and customers, varying based on the service model (IaaS, PaaS, SaaS)."
        }
      );
    }

    // CISM - Information Security Governance questions
    const cismGovernanceSubcat = insertedSubcategories.find(sub => sub.name === "Information Security Governance");
    if (cismGovernanceSubcat) {
      const cismCategory = insertedCategories.find(cat => cat.name === "CISM");
      sampleQuestions.push(
        {
          categoryId: cismCategory.id,
          subcategoryId: cismGovernanceSubcat.id,
          text: "What is the PRIMARY benefit of establishing an information security governance framework?",
          options: [
            { text: "Reducing security incidents", id: 0 },
            { text: "Ensuring alignment between security strategy and business objectives", id: 1 },
            { text: "Meeting compliance requirements", id: 2 },
            { text: "Minimizing security costs", id: 3 }
          ],
          correctAnswer: 1,
          explanation: "Information security governance ensures that security strategies and initiatives align with business objectives, providing strategic direction and oversight."
        }
      );
    }

    await db.insert(questions).values(sampleQuestions);
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
