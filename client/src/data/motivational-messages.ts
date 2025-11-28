/**
 * Motivational Messages Configuration
 * 
 * This module provides personalized motivational messages for the dashboard
 * based on user progress and achievements. Messages are categorized by
 * context to provide relevant encouragement.
 * 
 * ## Message Categories
 * 
 * - **general**: Default messages shown when no specific context applies
 * - **newUser**: Messages for users who haven't completed any quizzes yet
 * - **streak**: Messages related to study streaks
 * - **highPerformance**: Messages for users with high average scores (≥80%)
 * - **improvement**: Encouraging messages for users showing improvement
 * - **milestone**: Messages for reaching quiz milestones (5, 10, 25, etc.)
 * 
 * ## Personalization
 * 
 * The `getPersonalizedMessage` function analyzes user stats to select
 * the most relevant message category, then returns a random message
 * from that category.
 * 
 * @module motivational-messages
 */

import type { UserStats } from '@shared/schema';

/**
 * Categories of motivational messages for different user contexts
 */
export type MessageCategory = 
  | 'general' 
  | 'newUser' 
  | 'streak' 
  | 'highPerformance' 
  | 'improvement' 
  | 'milestone';

/**
 * Configuration object containing all motivational messages by category
 */
export const motivationalMessages: Record<MessageCategory, string[]> = {
  general: [
    "Every question answered brings you closer to your certification goals!",
    "Consistency is key - keep up your daily practice!",
    "Your dedication today shapes your success tomorrow.",
    "Small steps daily lead to big achievements.",
    "Focus on progress, not perfection.",
    "Learning is a journey - enjoy every step!",
    "Stay curious, stay motivated, stay successful.",
    "Your effort today is an investment in your future.",
  ],
  newUser: [
    "Welcome! Your certification journey starts with a single question.",
    "Ready to begin? Every expert was once a beginner.",
    "Take your first quiz and start building your knowledge!",
    "The path to certification success begins here.",
    "Your learning adventure awaits - let's get started!",
  ],
  streak: [
    "Amazing streak! Keep the momentum going!",
    "Your consistency is paying off - don't break the chain!",
    "Day by day, you're building an unstoppable habit.",
    "Your dedication is inspiring - keep that streak alive!",
    "Streaks build champions - you're on your way!",
  ],
  highPerformance: [
    "Outstanding performance! You're mastering this material.",
    "Your hard work is showing in your scores - keep it up!",
    "You're performing at an excellent level - aim for the top!",
    "Excellence is your standard - maintain that high bar!",
    "Your knowledge is shining through - phenomenal work!",
  ],
  improvement: [
    "Your scores are improving - that's what growth looks like!",
    "Each quiz makes you stronger - keep pushing forward!",
    "Progress detected! Your practice is paying dividends.",
    "You're getting better every day - trust the process!",
    "Improvement is the goal, and you're achieving it!",
  ],
  milestone: [
    "Milestone reached! Celebrate your progress!",
    "Look how far you've come - amazing dedication!",
    "Another milestone conquered - you're unstoppable!",
    "Your commitment is truly impressive - well done!",
    "Milestones are proof of your dedication - keep going!",
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

  // Check for active streak (3+ days)
  if (stats.studyStreak >= 3) {
    return 'streak';
  }

  // High performer (80%+ average)
  if (stats.averageScore >= 80) {
    return 'highPerformance';
  }

  // Milestone achievements (every 5 quizzes)
  if (stats.totalQuizzes > 0 && stats.totalQuizzes % 5 === 0) {
    return 'milestone';
  }

  // Show improvement message occasionally (roughly 20% of the time)
  // for users who have completed at least 3 quizzes
  if (stats.totalQuizzes >= 3 && Math.random() < 0.2) {
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
 * Gets all messages from all categories (for testing or display purposes)
 * 
 * @returns Array of all motivational messages
 */
export function getAllMessages(): string[] {
  return Object.values(motivationalMessages).flat();
}
