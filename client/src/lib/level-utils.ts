import type { UserStats } from '@shared/schema';

/**
 * Points per level configuration constant
 * Each level N requires (N * POINTS_PER_LEVEL) points to complete
 */
const POINTS_PER_LEVEL = 100;

/**
 * Calculates the user's level based on total points earned.
 * Uses a progressive level system where each level requires more points.
 *
 * Level progression:
 * - Level 1: 0-99 points (needs 100 to complete)
 * - Level 2: 100-299 points (needs 200 to complete)
 * - Level 3: 300-599 points (needs 300 to complete)
 * - Level 4: 600-999 points (needs 400 to complete)
 * - Level N: sum of (i * 100) for i=1 to N-1
 *
 * @param totalPoints - Total gamification points earned by the user
 * @returns The calculated level (minimum 1)
 *
 * @example
 * calculateLevelFromPoints(0)   // Returns 1
 * calculateLevelFromPoints(150) // Returns 2
 * calculateLevelFromPoints(650) // Returns 4
 */
export function calculateLevelFromPoints(totalPoints: number): number {
  let level = 1;
  let pointsNeeded = 0;

  while (true) {
    const pointsForNextLevel = level * POINTS_PER_LEVEL;
    if (pointsNeeded + pointsForNextLevel > totalPoints) {
      break;
    }
    pointsNeeded += pointsForNextLevel;
    level++;
  }

  return level;
}

/**
 * Calculates the cumulative points needed to reach the start of a specific level.
 *
 * This returns the total points accumulated at the START of the target level.
 * For example, Level 3 starts at 300 points (after completing Levels 1 and 2).
 *
 * Formula: sum of (i * 100) for i=1 to (targetLevel - 1)
 *
 * @param targetLevel - The level to calculate starting points for
 * @returns The cumulative points at the start of the level
 *
 * @example
 * calculatePointsForLevel(1) // Returns 0 (Level 1 starts at 0)
 * calculatePointsForLevel(2) // Returns 100 (Level 2 starts at 100)
 * calculatePointsForLevel(3) // Returns 300 (Level 3 starts at 300)
 * calculatePointsForLevel(4) // Returns 600 (Level 4 starts at 600)
 */
export function calculatePointsForLevel(targetLevel: number): number {
  let points = 0;
  for (let i = 1; i < targetLevel; i++) {
    points += i * POINTS_PER_LEVEL;
  }
  return points;
}

/**
 * Calculate user level, current XP, and XP goal based on quiz statistics
 * @param stats User statistics containing quiz data
 * @returns Object containing level, currentXP, xpGoal, and xpProgress percentage
 */
export function calculateLevelAndXP(stats: UserStats | undefined) {
  // Level increases every 10 quizzes completed
  const level = stats ? Math.floor((stats.totalQuizzes || 0) / 10) + 1 : 1;

  // XP calculation: 250 XP per quiz in current level + bonus from average score
  const currentXP = stats
    ? ((stats.totalQuizzes || 0) % 10) * 250 + Math.floor((stats.averageScore || 0) * 5)
    : 0;

  // XP goal increases with each level
  const xpGoal = level * 1000;

  // Calculate progress percentage
  const xpProgress = (currentXP / xpGoal) * 100;

  return {
    level,
    currentXP,
    xpGoal,
    xpProgress: Math.min(xpProgress, 100), // Cap at 100%
  };
}
