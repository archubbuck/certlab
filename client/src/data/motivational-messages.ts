/**
 * Motivational Messages Configuration
 *
 * This module provides personalized motivational messages for the dashboard
 * based on user progress, achievements, and skills assessment data. Messages
 * are categorized by context to provide relevant encouragement.
 *
 * ## Message Categories
 *
 * - **general**: Default messages shown when no specific context applies
 * - **newUser**: Messages for users who haven't completed any quizzes yet
 * - **streak**: Messages related to study streaks
 * - **highPerformance**: Messages for users with high average scores (≥80%)
 * - **improvement**: Encouraging messages for users showing improvement
 * - **milestone**: Messages for reaching quiz milestones (5, 10, 25, etc.)
 * - **careerFocused**: Messages for users motivated by career advancement
 * - **complianceFocused**: Messages for users motivated by compliance requirements
 * - **beginnerEncouragement**: Messages for users at beginner experience level
 * - **expertChallenge**: Messages for expert-level users
 *
 * ## Personalization
 *
 * The `getPersonalizedMessage` and `getPersonalizedMessageWithAssessment` functions
 * analyze user stats and skills assessment to select the most relevant category
 * of messages, then return a random message from that category.
 *
 * @module motivational-messages
 */

import type { UserStats } from '@shared/schema';
import type { SkillsAssessment } from '@shared/storage-interface';

/**
 * Configuration thresholds for message personalization
 * These values determine when different message categories are triggered
 */
const STREAK_THRESHOLD = 3; // Minimum streak days for streak messages
const HIGH_PERFORMANCE_THRESHOLD = 80; // Minimum average score (%) for high performance messages
const MILESTONE_INTERVAL = 5; // Quiz count interval for milestone messages
const IMPROVEMENT_MIN_QUIZZES = 3; // Minimum quizzes before showing improvement messages
const IMPROVEMENT_PROBABILITY = 0.2; // Probability (20%) of showing improvement messages

/**
 * Categories of motivational messages for different user contexts
 */
export type MessageCategory =
  | 'general'
  | 'newUser'
  | 'streak'
  | 'highPerformance'
  | 'improvement'
  | 'milestone'
  | 'careerFocused'
  | 'complianceFocused'
  | 'beginnerEncouragement'
  | 'expertChallenge';

/**
 * Configuration object containing all motivational messages by category
 */
export const motivationalMessages: Record<MessageCategory, string[]> = {
  general: [
    'Every question answered brings you closer to your certification goals!',
    'Consistency is key - keep up your daily practice!',
    'Your dedication today shapes your success tomorrow.',
    'Small steps daily lead to big achievements.',
    'Focus on progress, not perfection.',
    'Learning is a journey - enjoy every step!',
    'Stay curious, stay motivated, stay successful.',
    'Your effort today is an investment in your future.',
  ],
  newUser: [
    'Welcome! Your certification journey starts with a single question.',
    'Ready to begin? Every expert was once a beginner.',
    'Take your first quiz and start building your knowledge!',
    'The path to certification success begins here.',
    "Your learning adventure awaits - let's get started!",
  ],
  streak: [
    'Amazing streak! Keep the momentum going!',
    "Your consistency is paying off - don't break the chain!",
    "Day by day, you're building an unstoppable habit.",
    'Your dedication is inspiring - keep that streak alive!',
    "Streaks build champions - you're on your way!",
  ],
  highPerformance: [
    "Outstanding performance! You're mastering this material.",
    'Your hard work is showing in your scores - keep it up!',
    "You're performing at an excellent level - aim for the top!",
    'Excellence is your standard - maintain that high bar!',
    'Your knowledge is shining through - phenomenal work!',
  ],
  improvement: [
    "Your scores are improving - that's what growth looks like!",
    'Each quiz makes you stronger - keep pushing forward!',
    'Progress detected! Your practice is paying dividends.',
    "You're getting better every day - trust the process!",
    "Improvement is the goal, and you're achieving it!",
  ],
  milestone: [
    'Milestone reached! Celebrate your progress!',
    "Look how far you've come - amazing dedication!",
    "Another milestone conquered - you're unstoppable!",
    'Your commitment is truly impressive - well done!',
    'Milestones are proof of your dedication - keep going!',
  ],
  careerFocused: [
    'Your certification will open new career doors - keep pushing!',
    'Investment in knowledge pays the best dividends for your career.',
    'Every quiz brings you closer to your next career milestone.',
    "Top employers value certified professionals like you're becoming!",
    "Your dedication today builds tomorrow's career success.",
  ],
  complianceFocused: [
    'Meeting compliance requirements while building real expertise!',
    "Your organization's security posture strengthens with each session.",
    "Compliance and competence go hand in hand - you're achieving both.",
    'Building the knowledge that keeps organizations secure.',
    'Your training supports both personal growth and regulatory compliance.',
  ],
  beginnerEncouragement: [
    'Every expert started exactly where you are - keep going!',
    'Building foundations today creates expertise tomorrow.',
    "You're taking the first steps toward security mastery.",
    "Embrace the learning curve - it's proof you're growing!",
    "Starting is the hardest part, and you've already done it!",
  ],
  expertChallenge: [
    "Ready to tackle the most advanced concepts? Let's go!",
    'Challenge yourself with expert-level scenarios today.',
    'Your expertise is impressive - time to push even further.',
    'Master the edge cases that separate good from great.',
    "Expert mode engaged - show what you're capable of!",
  ],
};

/**
 * Determines the most appropriate message category based on user statistics
 *
 * @param stats - User statistics object (optional, may be undefined for new users)
 * @returns The most relevant message category for the user's current state
 */
export function getMessageCategory(stats: UserStats | null | undefined): MessageCategory {
  // New user or no stats available
  if (!stats || stats.totalQuizzes === 0) {
    return 'newUser';
  }

  // Check for active streak
  if (stats.studyStreak >= STREAK_THRESHOLD) {
    return 'streak';
  }

  // High performer
  if (stats.averageScore >= HIGH_PERFORMANCE_THRESHOLD) {
    return 'highPerformance';
  }

  // Milestone achievements
  if (stats.totalQuizzes > 0 && stats.totalQuizzes % MILESTONE_INTERVAL === 0) {
    return 'milestone';
  }

  // Show improvement message occasionally for users who have completed enough quizzes
  if (stats.totalQuizzes >= IMPROVEMENT_MIN_QUIZZES && Math.random() < IMPROVEMENT_PROBABILITY) {
    return 'improvement';
  }

  // Default to general messages
  return 'general';
}

/**
 * Determines the most appropriate message category based on user statistics
 * and skills assessment data for enhanced personalization.
 *
 * @param stats - User statistics object (optional)
 * @param skillsAssessment - User's skills assessment data (optional)
 * @returns The most relevant message category for the user's current state
 */
export function getMessageCategoryWithAssessment(
  stats: UserStats | null | undefined,
  skillsAssessment: SkillsAssessment | null | undefined
): MessageCategory {
  // New user or no stats available
  if (!stats || stats.totalQuizzes === 0) {
    // Check if beginner level is set in assessment
    if (skillsAssessment?.experienceLevel === 'beginner') {
      return 'beginnerEncouragement';
    }
    return 'newUser';
  }

  // Expert-level users with good performance get challenge messages
  if (
    skillsAssessment?.experienceLevel === 'expert' &&
    stats.averageScore >= HIGH_PERFORMANCE_THRESHOLD
  ) {
    return 'expertChallenge';
  }

  // Check for career-focused motivations
  const motivations = skillsAssessment?.motivations || [];
  const isCareerFocused =
    motivations.includes('Career advancement') || motivations.includes('Salary increase');
  const isComplianceFocused =
    motivations.includes('Compliance requirement') || motivations.includes('Job requirement');

  // Check for active streak
  if (stats.studyStreak >= STREAK_THRESHOLD) {
    return 'streak';
  }

  // High performer
  if (stats.averageScore >= HIGH_PERFORMANCE_THRESHOLD) {
    return 'highPerformance';
  }

  // Milestone achievements
  if (stats.totalQuizzes > 0 && stats.totalQuizzes % MILESTONE_INTERVAL === 0) {
    return 'milestone';
  }

  // Career-focused messages for users with career motivations (occasional)
  if (isCareerFocused && Math.random() < 0.3) {
    return 'careerFocused';
  }

  // Compliance-focused messages for users with compliance motivations (occasional)
  if (isComplianceFocused && Math.random() < 0.3) {
    return 'complianceFocused';
  }

  // Beginner encouragement for beginner-level users
  if (skillsAssessment?.experienceLevel === 'beginner' && Math.random() < 0.25) {
    return 'beginnerEncouragement';
  }

  // Show improvement message occasionally for users who have completed enough quizzes
  if (stats.totalQuizzes >= IMPROVEMENT_MIN_QUIZZES && Math.random() < IMPROVEMENT_PROBABILITY) {
    return 'improvement';
  }

  // Default to general messages
  return 'general';
}

/**
 * Returns a random message from the specified category
 *
 * @param category - The message category to select from
 * @returns A random motivational message from the specified category
 */
export function getRandomMessageFromCategory(category: MessageCategory): string {
  const messages = motivationalMessages[category];
  const index = Math.floor(Math.random() * messages.length);
  return messages[index];
}

/**
 * Gets a personalized motivational message based on user statistics
 *
 * This function analyzes the user's progress and achievements to select
 * the most relevant category of messages, then returns a random message
 * from that category.
 *
 * @param stats - User statistics object (optional)
 * @returns A personalized motivational message
 *
 * @example
 * ```typescript
 * const message = getPersonalizedMessage(userStats);
 * // Returns: "Your hard work is showing in your scores - keep it up!"
 * ```
 */
export function getPersonalizedMessage(stats: UserStats | null | undefined): string {
  const category = getMessageCategory(stats);
  return getRandomMessageFromCategory(category);
}

/**
 * Gets a personalized motivational message based on user statistics and skills assessment
 *
 * This enhanced function analyzes both the user's progress/achievements and their
 * skills assessment data (experience level, motivations) to select the most relevant
 * category of messages.
 *
 * @param stats - User statistics object (optional)
 * @param skillsAssessment - User's skills assessment data (optional)
 * @returns A personalized motivational message
 *
 * @example
 * ```typescript
 * const message = getPersonalizedMessageWithAssessment(userStats, skillsAssessment);
 * // Returns: "Your certification will open new career doors - keep pushing!"
 * ```
 */
export function getPersonalizedMessageWithAssessment(
  stats: UserStats | null | undefined,
  skillsAssessment: SkillsAssessment | null | undefined
): string {
  const category = getMessageCategoryWithAssessment(stats, skillsAssessment);
  return getRandomMessageFromCategory(category);
}

/**
 * Gets all messages from all categories (for testing or display purposes)
 *
 * @returns Array of all motivational messages
 */
export function getAllMessages(): string[] {
  return Object.values(motivationalMessages).flat();
}
