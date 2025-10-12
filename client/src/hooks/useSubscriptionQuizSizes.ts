import { useQuery } from "@tanstack/react-query";

interface SubscriptionStatusResponse {
  isConfigured: boolean;
  isSubscribed: boolean;
  plan: string;
  status: string;
  expiresAt?: string;
  features: string[];
  limits: {
    quizzesPerDay: number;
    categoriesAccess: string[];
    analyticsAccess: string;
  };
  dailyQuizCount: number;
}

interface QuizSizeConfig {
  studyMode: number;
  reviewMode: number;
  quickMode: number;
  quizMode: number;
  practiceMode: number;
  isLoading: boolean;
  canCreateQuiz: boolean;
  remainingQuizzes: number | null;
  subscription: SubscriptionStatusResponse | undefined;
}

// Default quiz sizes for different subscription tiers
const QUIZ_SIZE_CONFIGS = {
  free: {
    studyMode: 5,
    reviewMode: 5,
    quickMode: 10,
    quizMode: 10,
    practiceMode: 5,
  },
  pro: {
    studyMode: 10,
    reviewMode: 10,
    quickMode: 15,
    quizMode: 25,
    practiceMode: 15,
  },
  enterprise: {
    studyMode: 15,
    reviewMode: 20,
    quickMode: 25,
    quizMode: 50,
    practiceMode: 30,
  },
  // Fallback defaults when subscription data is loading
  default: {
    studyMode: 10,
    reviewMode: 10,
    quickMode: 15,
    quizMode: 25,
    practiceMode: 10,
  },
};

export function useSubscriptionQuizSizes(): QuizSizeConfig {
  const { data: subscription, isLoading, error } = useQuery<SubscriptionStatusResponse>({
    queryKey: ["/api/subscription/status"],
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // If subscription service is not configured or there's an error, use default sizes
  if (error || (!isLoading && subscription && !subscription.isConfigured)) {
    return {
      ...QUIZ_SIZE_CONFIGS.default,
      isLoading: false,
      canCreateQuiz: true,
      remainingQuizzes: null,
      subscription: undefined,
    };
  }

  // While loading, use defaults but indicate loading state
  if (isLoading || !subscription) {
    return {
      ...QUIZ_SIZE_CONFIGS.default,
      isLoading: true,
      canCreateQuiz: true,
      remainingQuizzes: null,
      subscription: undefined,
    };
  }

  // Get the appropriate config based on subscription plan
  const plan = subscription.plan.toLowerCase() as keyof typeof QUIZ_SIZE_CONFIGS;
  const config = QUIZ_SIZE_CONFIGS[plan] || QUIZ_SIZE_CONFIGS.free;

  // Check if user can create more quizzes
  const quizLimit = subscription.limits.quizzesPerDay;
  const canCreateQuiz = quizLimit === -1 || subscription.dailyQuizCount < quizLimit;
  const remainingQuizzes = quizLimit === -1 ? null : Math.max(0, quizLimit - subscription.dailyQuizCount);

  return {
    ...config,
    isLoading: false,
    canCreateQuiz,
    remainingQuizzes,
    subscription,
  };
}

// Helper function to get a specific quiz size with optional override
export function getQuizSize(
  mode: 'study' | 'review' | 'quick' | 'quiz' | 'practice',
  subscription?: SubscriptionStatusResponse,
  override?: number
): number {
  // If override is provided, use it
  if (override !== undefined) {
    return override;
  }

  // Get plan config
  const plan = subscription?.plan?.toLowerCase() || 'default';
  const config = QUIZ_SIZE_CONFIGS[plan as keyof typeof QUIZ_SIZE_CONFIGS] || QUIZ_SIZE_CONFIGS.default;

  // Map mode to config key
  const modeKey = mode + 'Mode' as keyof typeof config;
  return config[modeKey] || 10;
}

// Helper function to get max allowed quiz size for a plan
export function getMaxQuizSize(subscription?: SubscriptionStatusResponse): number {
  const plan = subscription?.plan?.toLowerCase() || 'free';
  
  switch (plan) {
    case 'enterprise':
      return 100; // Enterprise can have very large quizzes
    case 'pro':
      return 50;  // Pro has a reasonable upper limit
    case 'free':
    default:
      return 15;  // Free tier is limited
  }
}