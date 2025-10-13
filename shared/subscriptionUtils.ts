// Utility functions for standardizing subscription plan handling

export const VALID_PLANS = ['free', 'pro', 'enterprise'] as const;
export type SubscriptionPlan = typeof VALID_PLANS[number];

/**
 * Normalizes a plan name to lowercase and validates it
 * @param plan - The plan name to normalize (can be null/undefined)
 * @returns The normalized plan name or 'free' as default
 */
export function normalizePlanName(plan: string | null | undefined): SubscriptionPlan {
  if (!plan) return 'free';
  
  const normalized = plan.toLowerCase();
  if (VALID_PLANS.includes(normalized as SubscriptionPlan)) {
    return normalized as SubscriptionPlan;
  }
  
  console.warn(`Invalid plan name: ${plan}, defaulting to 'free'`);
  return 'free';
}

/**
 * Formats a plan name for display (capitalizes first letter)
 * @param plan - The normalized plan name
 * @returns The display-friendly plan name
 */
export function formatPlanNameForDisplay(plan: SubscriptionPlan): string {
  switch (plan) {
    case 'free':
      return 'Free';
    case 'pro':
      return 'Pro';
    case 'enterprise':
      return 'Enterprise';
    default:
      return 'Free';
  }
}

/**
 * Checks if a plan is a paid plan
 * @param plan - The normalized plan name
 * @returns True if the plan is pro or enterprise
 */
export function isPaidPlan(plan: SubscriptionPlan): boolean {
  return plan === 'pro' || plan === 'enterprise';
}

/**
 * Checks if a plan is enterprise
 * @param plan - The normalized plan name
 * @returns True if the plan is enterprise
 */
export function isEnterprisePlan(plan: SubscriptionPlan): boolean {
  return plan === 'enterprise';
}

/**
 * Gets the upgrade path for a given plan
 * @param plan - The current normalized plan name
 * @returns The next plan level or null if already at enterprise
 */
export function getUpgradePlan(plan: SubscriptionPlan): SubscriptionPlan | null {
  switch (plan) {
    case 'free':
      return 'pro';
    case 'pro':
      return 'enterprise';
    case 'enterprise':
      return null;
    default:
      return 'pro';
  }
}

/**
 * Compares two plans to determine if it's an upgrade
 * @param currentPlan - The current plan
 * @param newPlan - The new plan
 * @returns True if newPlan is an upgrade from currentPlan
 */
export function isPlanUpgrade(currentPlan: SubscriptionPlan, newPlan: SubscriptionPlan): boolean {
  const planHierarchy = { free: 0, pro: 1, enterprise: 2 };
  return planHierarchy[newPlan] > planHierarchy[currentPlan];
}

/**
 * Gets plan features based on the plan type
 * @param plan - The normalized plan name
 * @returns Object containing plan limits and features
 */
export function getPlanFeatures(plan: SubscriptionPlan) {
  switch (plan) {
    case 'free':
      return {
        quizzesPerDay: 5,
        categoriesAccess: ['basic'],
        analyticsAccess: 'basic',
        teamMembers: 1,
      };
    case 'pro':
      return {
        quizzesPerDay: -1, // Unlimited
        categoriesAccess: ['all'],
        analyticsAccess: 'advanced',
        teamMembers: 1,
      };
    case 'enterprise':
      return {
        quizzesPerDay: -1, // Unlimited
        categoriesAccess: ['all'],
        analyticsAccess: 'enterprise',
        teamMembers: 50,
      };
    default:
      return getPlanFeatures('free');
  }
}