/**
 * Skills Assessment Hook
 *
 * This hook provides access to the user's skills assessment data and derives
 * personalized recommendations, content preferences, and learning insights
 * based on their assessment responses.
 *
 * ## Features
 *
 * - Access to raw skills assessment data
 * - Derived personalization preferences
 * - Learning style-specific content recommendations
 * - Experience level-based difficulty suggestions
 * - Motivation-driven feature highlights
 *
 * @module useSkillsAssessment
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-provider';
import { queryKeys } from '@/lib/queryClient';
import type { SkillsAssessment } from '@shared/storage-interface';

/**
 * Personalization preferences derived from skills assessment
 */
export interface PersonalizationPreferences {
  /** Recommended quiz difficulty level (1-5 scale) */
  recommendedDifficulty: number;
  /** Whether to show visual learning aids prominently */
  preferVisualContent: boolean;
  /** Whether to emphasize hands-on/interactive exercises */
  preferInteractiveContent: boolean;
  /** Whether to highlight reading materials */
  preferReadingContent: boolean;
  /** Whether to show career-focused messaging */
  showCareerAdvancement: boolean;
  /** Whether to show compliance-related content */
  showComplianceContent: boolean;
  /** Relevant experience areas for personalized recommendations */
  focusAreas: string[];
  /** User's stated motivations */
  motivations: string[];
  /** Whether the assessment has been completed */
  isAssessmentComplete: boolean;
}

/**
 * Content recommendation based on learning style
 */
export interface ContentRecommendation {
  type: 'visual' | 'reading' | 'interactive' | 'audio';
  title: string;
  description: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Result type for the useSkillsAssessment hook
 */
export interface UseSkillsAssessmentResult {
  /** Raw skills assessment data from user profile */
  skillsAssessment: SkillsAssessment | null;
  /** Derived personalization preferences */
  preferences: PersonalizationPreferences;
  /** Learning style-specific content recommendations */
  contentRecommendations: ContentRecommendation[];
  /** Personalized welcome message based on experience level */
  welcomeMessage: string;
  /** Suggested focus areas based on experience gaps */
  suggestedFocusAreas: string[];
  /** Whether the data is loading */
  isLoading: boolean;
  /** Whether there was an error loading the data */
  isError: boolean;
}

/**
 * User profile type with skills assessment
 */
interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  skillsAssessment?: SkillsAssessment;
}

/**
 * Maps experience level to recommended difficulty (1-5 scale)
 */
const EXPERIENCE_TO_DIFFICULTY: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};

/**
 * All available experience areas for gap analysis
 */
const ALL_EXPERIENCE_AREAS = [
  'Network Security',
  'Cloud Computing',
  'Risk Management',
  'Incident Response',
  'Compliance',
  'Security Architecture',
  'DevSecOps',
  'Cryptography',
];

/**
 * Default personalization preferences when no assessment is available
 */
const DEFAULT_PREFERENCES: PersonalizationPreferences = {
  recommendedDifficulty: 2,
  preferVisualContent: true,
  preferInteractiveContent: false,
  preferReadingContent: false,
  showCareerAdvancement: true,
  showComplianceContent: false,
  focusAreas: [],
  motivations: [],
  isAssessmentComplete: false,
};

/**
 * Hook for accessing and deriving personalized data from skills assessment
 *
 * @returns Skills assessment data and derived personalization preferences
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const { preferences, contentRecommendations, welcomeMessage } = useSkillsAssessment();
 *
 *   return (
 *     <div>
 *       <h1>{welcomeMessage}</h1>
 *       {preferences.preferVisualContent && <VisualLearningTips />}
 *       {contentRecommendations.map(rec => (
 *         <RecommendationCard key={rec.type} {...rec} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSkillsAssessment(): UseSkillsAssessmentResult {
  const { user } = useAuth();

  // Fetch user profile which includes skills assessment
  const {
    data: userProfile,
    isLoading,
    isError,
  } = useQuery<UserProfile>({
    queryKey: queryKeys.user.detail(user?.id),
    enabled: !!user?.id,
  });

  const skillsAssessment = userProfile?.skillsAssessment ?? null;

  // Derive personalization preferences from skills assessment
  const preferences = useMemo<PersonalizationPreferences>(() => {
    if (!skillsAssessment) {
      return DEFAULT_PREFERENCES;
    }

    const { experienceLevel, learningStyle, relevantExperience, motivations } = skillsAssessment;

    // Check if assessment has meaningful data
    const isAssessmentComplete = !!(
      experienceLevel ||
      learningStyle ||
      (relevantExperience && relevantExperience.length > 0) ||
      (motivations && motivations.length > 0)
    );

    return {
      recommendedDifficulty: EXPERIENCE_TO_DIFFICULTY[experienceLevel || 'intermediate'] || 2,
      preferVisualContent: learningStyle === 'visual',
      preferInteractiveContent: learningStyle === 'kinesthetic',
      preferReadingContent: learningStyle === 'reading',
      showCareerAdvancement:
        motivations?.includes('Career advancement') ||
        motivations?.includes('Salary increase') ||
        false,
      showComplianceContent:
        motivations?.includes('Compliance requirement') ||
        motivations?.includes('Job requirement') ||
        false,
      focusAreas: relevantExperience || [],
      motivations: motivations || [],
      isAssessmentComplete,
    };
  }, [skillsAssessment]);

  // Generate content recommendations based on learning style
  const contentRecommendations = useMemo<ContentRecommendation[]>(() => {
    const recommendations: ContentRecommendation[] = [];
    const learningStyle = skillsAssessment?.learningStyle || 'visual';

    switch (learningStyle) {
      case 'visual':
        recommendations.push(
          {
            type: 'visual',
            title: 'Diagrams & Charts',
            description: 'Learn with visual representations of security concepts',
            icon: '📊',
            priority: 'high',
          },
          {
            type: 'visual',
            title: 'Video Explanations',
            description: 'Watch concept breakdowns and walkthroughs',
            icon: '🎬',
            priority: 'high',
          },
          {
            type: 'interactive',
            title: 'Interactive Quizzes',
            description: 'Test your knowledge with visual feedback',
            icon: '🎯',
            priority: 'medium',
          }
        );
        break;

      case 'auditory':
        recommendations.push(
          {
            type: 'audio',
            title: 'Audio Lectures',
            description: 'Listen to expert explanations while on the go',
            icon: '🎧',
            priority: 'high',
          },
          {
            type: 'interactive',
            title: 'Discussion Forums',
            description: 'Engage in conversations about security topics',
            icon: '💬',
            priority: 'high',
          },
          {
            type: 'visual',
            title: 'Video Content',
            description: 'Watch and listen to concept explanations',
            icon: '📺',
            priority: 'medium',
          }
        );
        break;

      case 'kinesthetic':
        recommendations.push(
          {
            type: 'interactive',
            title: 'Hands-on Labs',
            description: 'Practice with interactive security scenarios',
            icon: '🔧',
            priority: 'high',
          },
          {
            type: 'interactive',
            title: 'Practice Challenges',
            description: 'Apply concepts through micro-challenges',
            icon: '🏆',
            priority: 'high',
          },
          {
            type: 'visual',
            title: 'Step-by-step Guides',
            description: 'Follow along with practical tutorials',
            icon: '📋',
            priority: 'medium',
          }
        );
        break;

      case 'reading':
        recommendations.push(
          {
            type: 'reading',
            title: 'Study Notes',
            description: 'Comprehensive written materials for deep learning',
            icon: '📚',
            priority: 'high',
          },
          {
            type: 'reading',
            title: 'Documentation',
            description: 'Detailed reference materials and guides',
            icon: '📖',
            priority: 'high',
          },
          {
            type: 'interactive',
            title: 'Written Exercises',
            description: 'Practice with text-based problem solving',
            icon: '✍️',
            priority: 'medium',
          }
        );
        break;
    }

    return recommendations;
  }, [skillsAssessment?.learningStyle]);

  // Generate personalized welcome message
  const welcomeMessage = useMemo<string>(() => {
    const experienceLevel = skillsAssessment?.experienceLevel;
    const firstName = userProfile?.firstName || 'there';

    switch (experienceLevel) {
      case 'beginner':
        return `Welcome, ${firstName}! Let's build your security foundation together.`;
      case 'intermediate':
        return `Great to see you, ${firstName}! Ready to level up your security expertise?`;
      case 'advanced':
        return `Welcome back, ${firstName}! Let's sharpen those advanced security skills.`;
      case 'expert':
        return `Hello, ${firstName}! Ready to master the most challenging concepts?`;
      default:
        return `Welcome, ${firstName}! Your certification journey continues here.`;
    }
  }, [skillsAssessment?.experienceLevel, userProfile?.firstName]);

  // Suggest focus areas based on experience gaps
  const suggestedFocusAreas = useMemo<string[]>(() => {
    const relevantExperience = skillsAssessment?.relevantExperience || [];

    // Find areas the user hasn't selected as experienced in
    const gaps = ALL_EXPERIENCE_AREAS.filter((area) => !relevantExperience.includes(area));

    // Return top 3 suggested areas to focus on
    return gaps.slice(0, 3);
  }, [skillsAssessment?.relevantExperience]);

  return {
    skillsAssessment,
    preferences,
    contentRecommendations,
    welcomeMessage,
    suggestedFocusAreas,
    isLoading,
    isError,
  };
}

/**
 * Gets a difficulty label from a numeric difficulty level
 */
export function getDifficultyLabel(level: number): string {
  switch (level) {
    case 1:
      return 'Beginner';
    case 2:
      return 'Intermediate';
    case 3:
      return 'Advanced';
    case 4:
    case 5:
      return 'Expert';
    default:
      return 'Intermediate';
  }
}

/**
 * Gets a learning style description for display
 */
export function getLearningStyleDescription(style: SkillsAssessment['learningStyle']): string {
  switch (style) {
    case 'visual':
      return 'You learn best through diagrams, charts, and visual representations.';
    case 'auditory':
      return 'You learn best through listening and verbal explanations.';
    case 'kinesthetic':
      return 'You learn best through hands-on practice and interactive exercises.';
    case 'reading':
      return 'You learn best through reading and written materials.';
    default:
      return 'Complete your skills assessment to get personalized learning tips.';
  }
}
