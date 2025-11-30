/**
 * Custom hook for accessing and applying user learning preferences.
 *
 * This hook provides access to the user's learning preferences stored in their profile,
 * including certification goals, study schedule, and difficulty preferences.
 * It also provides helper functions to filter and prioritize content based on these preferences.
 *
 * @module useLearningPreferences
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-provider';
import { queryKeys } from '@/lib/queryClient';
import type { Category } from '@shared/schema';
import type { StudyPreferences, SkillsAssessment } from '@shared/storage-interface';

/**
 * User profile with learning preferences
 */
interface UserProfile {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  certificationGoals?: string[] | null;
  studyPreferences?: StudyPreferences | null;
  skillsAssessment?: SkillsAssessment | null;
}

/**
 * Return type for the useLearningPreferences hook
 */
interface LearningPreferencesResult {
  /** User's certification goal names (e.g., "CISSP", "CISM") */
  certificationGoals: string[];
  /** User's study preferences (time, difficulty, days, etc.) */
  studyPreferences: StudyPreferences | null;
  /** User's skills assessment */
  skillsAssessment: SkillsAssessment | null;
  /** Whether preferences are currently loading */
  isLoading: boolean;
  /** Whether the user has set any certification goals */
  hasCertificationGoals: boolean;
  /** Whether the user has set study preferences */
  hasStudyPreferences: boolean;
  /** The user's preferred difficulty level */
  preferredDifficulty: 'beginner' | 'intermediate' | 'advanced';
  /** Daily study time in minutes */
  dailyStudyTimeMinutes: number;
  /** Days the user has scheduled for study */
  studyDays: string[];
  /** Whether today is a scheduled study day */
  isTodayStudyDay: boolean;
  /**
   * Filter categories based on user's certification goals.
   * Returns categories that match the user's goals, or all categories if no goals are set.
   */
  filterCategoriesByGoals: (categories: Category[]) => Category[];
  /**
   * Check if a category matches the user's certification goals
   */
  isCategoryInGoals: (category: Category) => boolean;
  /**
   * Get the difficulty level number (1-5 scale) from preference string
   * Used for filtering questions by difficulty
   */
  getDifficultyLevelRange: () => number[];
}

/**
 * Maps difficulty preference strings to numeric difficulty level ranges.
 * Questions use a 1-5 difficulty scale:
 * - 1-2: beginner
 * - 2-4: intermediate
 * - 4-5: advanced
 */
function getDifficultyRange(
  difficulty: 'beginner' | 'intermediate' | 'advanced' | undefined
): number[] {
  switch (difficulty) {
    case 'beginner':
      return [1, 2];
    case 'intermediate':
      return [2, 3, 4];
    case 'advanced':
      return [4, 5];
    default:
      return [1, 2, 3, 4, 5]; // All difficulties if not set
  }
}

/**
 * Get the current day name for checking study schedule
 */
function getCurrentDayName(): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
}

/**
 * Hook to access and apply user learning preferences throughout the application.
 *
 * @example
 * ```tsx
 * function PracticeTestsPage() {
 *   const {
 *     filterCategoriesByGoals,
 *     preferredDifficulty,
 *     hasCertificationGoals
 *   } = useLearningPreferences();
 *
 *   const { data: allCategories = [] } = useQuery({ ... });
 *
 *   // Filter categories based on user's goals
 *   const recommendedCategories = filterCategoriesByGoals(allCategories);
 *
 *   return (
 *     <div>
 *       {hasCertificationGoals && (
 *         <p>Showing content for your certification goals</p>
 *       )}
 *       {recommendedCategories.map(cat => (
 *         <CategoryCard key={cat.id} category={cat} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useLearningPreferences(): LearningPreferencesResult {
  const { user } = useAuth();

  // Fetch full user profile to get preferences
  const { data: userProfile, isLoading } = useQuery<UserProfile>({
    queryKey: queryKeys.user.detail(user?.id),
    enabled: !!user?.id,
  });

  // Extract preferences with defaults
  const certificationGoals = userProfile?.certificationGoals || [];
  const studyPreferences = userProfile?.studyPreferences || null;
  const skillsAssessment = userProfile?.skillsAssessment || null;

  // Derived values
  const hasCertificationGoals = certificationGoals.length > 0;
  const hasStudyPreferences =
    studyPreferences !== null &&
    (studyPreferences.dailyTimeMinutes !== undefined ||
      studyPreferences.preferredDifficulty !== undefined ||
      (studyPreferences.studyDays && studyPreferences.studyDays.length > 0));

  const preferredDifficulty = studyPreferences?.preferredDifficulty || 'intermediate';
  const dailyStudyTimeMinutes = studyPreferences?.dailyTimeMinutes || 30;
  const studyDays = studyPreferences?.studyDays || [];
  const isTodayStudyDay = studyDays.length === 0 || studyDays.includes(getCurrentDayName());

  /**
   * Filter categories based on user's certification goals.
   * Matches category names against the user's selected certifications.
   */
  const filterCategoriesByGoals = (categories: Category[]): Category[] => {
    if (!hasCertificationGoals) {
      return categories; // Return all if no goals set
    }

    return categories.filter((category) => {
      // Check if the category name matches any certification goal
      // This handles cases like:
      // - Category: "CISSP" matches goal: "CISSP"
      // - Category: "CISM Certification" contains goal: "CISM"
      const categoryName = category.name.toLowerCase();
      return certificationGoals.some(
        (goal) =>
          categoryName.includes(goal.toLowerCase()) || goal.toLowerCase().includes(categoryName)
      );
    });
  };

  /**
   * Check if a specific category matches the user's certification goals
   */
  const isCategoryInGoals = (category: Category): boolean => {
    if (!hasCertificationGoals) {
      return true; // All categories are valid if no goals set
    }

    const categoryName = category.name.toLowerCase();
    return certificationGoals.some(
      (goal) =>
        categoryName.includes(goal.toLowerCase()) || goal.toLowerCase().includes(categoryName)
    );
  };

  /**
   * Get the difficulty level range based on user's preferred difficulty
   */
  const getDifficultyLevelRange = (): number[] => {
    return getDifficultyRange(preferredDifficulty);
  };

  return {
    certificationGoals,
    studyPreferences,
    skillsAssessment,
    isLoading,
    hasCertificationGoals,
    hasStudyPreferences,
    preferredDifficulty,
    dailyStudyTimeMinutes,
    studyDays,
    isTodayStudyDay,
    filterCategoriesByGoals,
    isCategoryInGoals,
    getDifficultyLevelRange,
  };
}
