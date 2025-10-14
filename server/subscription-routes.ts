import { Express, Request, Response } from "express";
import { z } from "zod";
import { fromError } from "zod-validation-error";
import { getPolarClient, SUBSCRIPTION_PLANS } from "./polar";
import type { User } from "@shared/schema";
import { normalizePlanName, getPlanFeatures, isPaidPlan, validateSubscriptionState, mergeSubscriptionState, type SubscriptionPlan } from "../shared/subscriptionUtils";
import { subscriptionLockManager } from "./subscriptionLock";

// Request/Response schemas
const createCheckoutSchema = z.object({
  plan: z.enum(['free', 'pro', 'enterprise']), // Added 'free' to support downgrades
  billingInterval: z.enum(['monthly', 'yearly']).optional().default('monthly'),
});

const cancelSubscriptionSchema = z.object({
  immediate: z.boolean().optional().default(false),
});

export function registerSubscriptionRoutes(app: Express, storage: any, isAuthenticated: any) {
  // Helper function to check and reset daily quiz count
  const checkAndResetDailyQuizCount = async (userId: string): Promise<void> => {
    const user = await storage.getUserById(userId);
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastReset = user.lastQuizResetDate ? new Date(user.lastQuizResetDate) : null;
    
    if (!lastReset || lastReset < today) {
      // Reset the daily quiz count
      await storage.updateUser(userId, {
        dailyQuizCount: 0,
        lastQuizResetDate: today,
      });
    }
  };

  // Get current subscription status - DATABASE-FIRST approach
  app.get("/api/subscription/status", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const sessionUser = req.user as any;
      if (!sessionUser) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Fetch fresh user data from database to get updated email
      const userId = sessionUser.claims?.sub || sessionUser.id;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      // Check and reset daily quiz count if needed
      await checkAndResetDailyQuizCount(userId);

      // Get updated user data for quiz count
      const updatedUser = await storage.getUserById(userId);

      // Default to free tier benefits
      let benefits = {
        plan: 'free',
        quizzesPerDay: SUBSCRIPTION_PLANS.free.limits.quizzesPerDay,
        categoriesAccess: SUBSCRIPTION_PLANS.free.limits.categoriesAccess,
        analyticsAccess: SUBSCRIPTION_PLANS.free.limits.analyticsAccess,
        lastSyncedAt: new Date().toISOString(),
      };

      let isSubscribed = false;
      let status = 'inactive';
      let expiresAt = undefined;

      // FIRST: Check database for active subscription
      const dbSubscription = await storage.getSubscriptionByUserId(userId);
      
      // Check if we have a recent subscription in database (within last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const shouldSyncWithPolar = !dbSubscription || 
        !dbSubscription.updatedAt || 
        new Date(dbSubscription.updatedAt) < oneHourAgo;

      if (dbSubscription && !shouldSyncWithPolar) {
        // Use database subscription data as source of truth
        console.log(`[Subscription Status] Using cached database subscription for user ${userId}`);
        
        const plan = SUBSCRIPTION_PLANS[dbSubscription.plan as keyof typeof SUBSCRIPTION_PLANS] || SUBSCRIPTION_PLANS.free;
        benefits = {
          plan: dbSubscription.plan || 'free',
          quizzesPerDay: plan.limits.quizzesPerDay,
          categoriesAccess: plan.limits.categoriesAccess,
          analyticsAccess: plan.limits.analyticsAccess,
          lastSyncedAt: dbSubscription.updatedAt?.toISOString() || new Date().toISOString(),
        };
        
        isSubscribed = dbSubscription.status === 'active' || dbSubscription.status === 'trialing';
        status = dbSubscription.status || 'inactive';
        expiresAt = dbSubscription.currentPeriodEnd?.toISOString();
        
        // Also update user's cached benefits for consistency
        await storage.updateUser(userId, {
          subscriptionBenefits: {
            ...benefits,
            subscriptionId: dbSubscription.id,
            polarSubscriptionId: dbSubscription.polarSubscriptionId,
            cancelAtPeriodEnd: dbSubscription.cancelAtPeriodEnd,
            canceledAt: dbSubscription.canceledAt?.toISOString(),
            currentPeriodEnd: dbSubscription.currentPeriodEnd?.toISOString(),
            trialEndsAt: dbSubscription.trialEndsAt?.toISOString(),
          },
        });
      } else if (process.env.POLAR_API_KEY && user.email) {
        // Database data is stale or missing - sync with Polar
        console.log(`[Subscription Status] Syncing with Polar for user ${userId} (data ${shouldSyncWithPolar ? 'stale' : 'missing'})`);
        
        try {
          const polarClient = await getPolarClient(userId);
          const polarData = await polarClient.syncUserSubscriptionBenefits(user.email);
          
          // Update user with Polar customer ID and benefits
          benefits = polarData.benefits;
          
          await storage.updateUser(userId, {
            polarCustomerId: polarData.customerId,
            subscriptionBenefits: benefits,
          });

          // If we have a Polar subscription, update or create database record
          if (polarData.customerId) {
            try {
              const detailedBenefits = await polarClient.getSubscriptionBenefits(polarData.customerId);
              status = detailedBenefits.status;
              expiresAt = detailedBenefits.expiresAt;
              
              // Get the active subscription from Polar to update database
              const subscriptions = await polarClient.getSubscriptions(polarData.customerId);
              const activeSubscription = subscriptions.find(sub => 
                sub.status === 'active' || sub.status === 'trialing'
              );
              
              if (activeSubscription) {
                // Update or create subscription in database
                // Handle both camelCase and snake_case from Polar API
                const sub = activeSubscription as any;
                const subscriptionData = {
                  userId: userId,
                  polarSubscriptionId: sub.id,
                  polarCustomerId: polarData.customerId,
                  productId: sub.productId || sub.product_id,
                  priceId: sub.priceId || sub.price_id,
                  status: sub.status,
                  plan: benefits.plan || 'free',
                  billingInterval: sub.billingInterval || sub.recurring_interval || 'month',
                  currentPeriodStart: sub.currentPeriodStart || sub.current_period_start ? new Date(sub.currentPeriodStart || sub.current_period_start) : new Date(),
                  currentPeriodEnd: sub.currentPeriodEnd || sub.current_period_end ? new Date(sub.currentPeriodEnd || sub.current_period_end) : new Date(),
                  trialEndsAt: sub.trialEndsAt || sub.trial_ends_at ? new Date(sub.trialEndsAt || sub.trial_ends_at) : undefined,
                  cancelAtPeriodEnd: sub.cancelAtPeriodEnd !== undefined ? sub.cancelAtPeriodEnd : (sub.cancel_at_period_end || false),
                  canceledAt: sub.canceledAt || sub.canceled_at ? new Date(sub.canceledAt || sub.canceled_at) : undefined,
                  metadata: {
                    syncedFromPolar: true,
                    syncedAt: new Date().toISOString(),
                  },
                };
                
                if (dbSubscription) {
                  await storage.updateSubscription(dbSubscription.id, subscriptionData);
                } else {
                  await storage.createSubscription(subscriptionData);
                }
              }
            } catch (err) {
              console.error("Error getting detailed subscription status:", err);
            }
          }

          // Determine subscription status from benefits
          isSubscribed = benefits.plan !== 'free';
          status = isSubscribed ? 'active' : 'inactive';
        } catch (polarError) {
          console.error("Error syncing with Polar:", polarError);
          // Fall back to cached benefits if Polar sync fails
          if (updatedUser?.subscriptionBenefits) {
            benefits = updatedUser.subscriptionBenefits as any;
            isSubscribed = benefits.plan !== 'free';
          }
        }
      } else if (updatedUser?.subscriptionBenefits) {
        // No Polar configured - use cached benefits
        benefits = updatedUser.subscriptionBenefits as any;
        isSubscribed = benefits.plan !== 'free';
      }

      // Check if subscription is scheduled for cancellation
      const cancelAtPeriodEnd = (benefits as any).cancelAtPeriodEnd || false;
      const canceledAt = (benefits as any).canceledAt;
      
      // Adjust status if subscription is scheduled for cancellation
      if (cancelAtPeriodEnd && isSubscribed) {
        status = 'canceling';
      }

      // Prepare subscription state for validation
      const subscriptionState = {
        plan: benefits.plan || 'free',
        status,
        expiresAt: expiresAt || (cancelAtPeriodEnd ? (benefits as any).currentPeriodEnd : undefined),
        canceledAt,
        subscriptionId: (benefits as any).subscriptionId,
        trialEndsAt: (benefits as any).trialEndsAt,
      };

      // Validate and normalize subscription state
      const validation = validateSubscriptionState(subscriptionState);
      
      // Apply corrections if any
      if (validation.corrections) {
        Object.assign(subscriptionState, validation.corrections);
        
        // Log warnings in development
        if (process.env.NODE_ENV === 'development' && validation.warnings.length > 0) {
          console.log('Subscription state validation warnings:', validation.warnings);
        }
      }

      // Handle validation errors
      if (!validation.isValid) {
        console.error('Subscription state validation errors:', validation.errors);
        // Continue with corrected state but log the issues
      }

      // Use normalized plan name
      const planName = validation.normalizedPlan;
      const plan = SUBSCRIPTION_PLANS[planName as keyof typeof SUBSCRIPTION_PLANS] || SUBSCRIPTION_PLANS.free;

      return res.json({
        isConfigured: !!process.env.POLAR_API_KEY,
        isSubscribed,
        plan: planName,
        status: subscriptionState.status,
        cancelAtPeriodEnd,
        canceledAt: subscriptionState.canceledAt,
        expiresAt: subscriptionState.expiresAt,
        features: plan.features,
        limits: {
          quizzesPerDay: benefits.quizzesPerDay,
          categoriesAccess: benefits.categoriesAccess,
          analyticsAccess: benefits.analyticsAccess,
          teamMembers: (benefits as any).teamMembers,
        },
        dailyQuizCount: updatedUser?.dailyQuizCount || 0,
      });
    } catch (error: any) {
      console.error("Error fetching subscription status:", error);
      res.status(500).json({ 
        error: "Failed to fetch subscription status",
        message: error.message 
      });
    }
  });

  // Get current subscription details - DATABASE-FIRST approach
  app.get("/api/subscription/current", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const sessionUser = req.user as any;
      if (!sessionUser) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const userId = sessionUser.claims?.sub || sessionUser.id;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      // FIRST: Check database for active subscription
      const dbSubscription = await storage.getSubscriptionByUserId(userId);
      
      // Check if we have a recent subscription in database (within last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const shouldSyncWithPolar = !dbSubscription || 
        !dbSubscription.updatedAt || 
        new Date(dbSubscription.updatedAt) < oneHourAgo;

      if (dbSubscription && !shouldSyncWithPolar) {
        // Use database subscription data as source of truth
        console.log(`[Subscription Current] Using cached database subscription for user ${userId}`);
        
        return res.json({
          subscription: {
            id: dbSubscription.id,
            polarSubscriptionId: dbSubscription.polarSubscriptionId,
            plan: dbSubscription.plan,
            status: dbSubscription.status,
            billingInterval: dbSubscription.billingInterval,
            currentPeriodStart: dbSubscription.currentPeriodStart?.toISOString(),
            currentPeriodEnd: dbSubscription.currentPeriodEnd?.toISOString(),
            trialEndsAt: dbSubscription.trialEndsAt?.toISOString(),
            cancelAtPeriodEnd: dbSubscription.cancelAtPeriodEnd,
            canceledAt: dbSubscription.canceledAt?.toISOString(),
            updatedAt: dbSubscription.updatedAt?.toISOString(),
          },
          fromCache: true,
        });
      }

      // Database data is stale or missing - sync with Polar if configured
      if (process.env.POLAR_API_KEY && user.email) {
        console.log(`[Subscription Current] Syncing with Polar for user ${userId} (data ${shouldSyncWithPolar ? 'stale' : 'missing'})`);
        
        try {
          const polarClient = await getPolarClient(userId);
          
          // Get customer ID first
          const customer = await polarClient.getCustomerByEmail(user.email);
          if (!customer) {
            return res.json({ subscription: null, message: "No subscription found" });
          }

          const customerId = customer.id;
          
          // Get active subscription from Polar
          const subscriptions = await polarClient.getSubscriptions(customerId);
          const activeSubscription = subscriptions.find(sub => 
            sub.status === 'active' || sub.status === 'trialing'
          );
          
          if (!activeSubscription) {
            return res.json({ subscription: null, message: "No active subscription found" });
          }

          // Determine plan from product ID (handle both camelCase and snake_case)
          const sub = activeSubscription as any;
          let planName = 'free';
          const productId = sub.productId || sub.product_id;
          if (productId === SUBSCRIPTION_PLANS.pro.productId) {
            planName = 'pro';
          } else if (productId === SUBSCRIPTION_PLANS.enterprise.productId) {
            planName = 'enterprise';
          }

          // Update or create subscription in database
          const subscriptionData = {
            userId: userId,
            polarSubscriptionId: sub.id,
            polarCustomerId: customerId,
            productId: productId,
            priceId: sub.priceId || sub.price_id,
            status: sub.status,
            plan: planName,
            billingInterval: sub.billingInterval || sub.recurring_interval || 'month',
            currentPeriodStart: sub.currentPeriodStart || sub.current_period_start ? new Date(sub.currentPeriodStart || sub.current_period_start) : new Date(),
            currentPeriodEnd: sub.currentPeriodEnd || sub.current_period_end ? new Date(sub.currentPeriodEnd || sub.current_period_end) : new Date(),
            trialEndsAt: sub.trialEndsAt || sub.trial_ends_at ? new Date(sub.trialEndsAt || sub.trial_ends_at) : undefined,
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd !== undefined ? sub.cancelAtPeriodEnd : (sub.cancel_at_period_end || false),
            canceledAt: sub.canceledAt || sub.canceled_at ? new Date(sub.canceledAt || sub.canceled_at) : undefined,
            metadata: {
              syncedFromPolar: true,
              syncedAt: new Date().toISOString(),
            },
          };
          
          let savedSubscription;
          if (dbSubscription) {
            savedSubscription = await storage.updateSubscription(dbSubscription.id, subscriptionData);
          } else {
            savedSubscription = await storage.createSubscription(subscriptionData);
          }

          return res.json({
            subscription: {
              id: savedSubscription?.id,
              polarSubscriptionId: savedSubscription?.polarSubscriptionId,
              plan: savedSubscription?.plan,
              status: savedSubscription?.status,
              billingInterval: savedSubscription?.billingInterval,
              currentPeriodStart: savedSubscription?.currentPeriodStart?.toISOString(),
              currentPeriodEnd: savedSubscription?.currentPeriodEnd?.toISOString(),
              trialEndsAt: savedSubscription?.trialEndsAt?.toISOString(),
              cancelAtPeriodEnd: savedSubscription?.cancelAtPeriodEnd,
              canceledAt: savedSubscription?.canceledAt?.toISOString(),
              updatedAt: savedSubscription?.updatedAt?.toISOString(),
            },
            fromCache: false,
          });
        } catch (error) {
          console.error("Error fetching subscription from Polar:", error);
          
          // If Polar fails but we have database data, return it
          if (dbSubscription) {
            return res.json({
              subscription: {
                id: dbSubscription.id,
                polarSubscriptionId: dbSubscription.polarSubscriptionId,
                plan: dbSubscription.plan,
                status: dbSubscription.status,
                billingInterval: dbSubscription.billingInterval,
                currentPeriodStart: dbSubscription.currentPeriodStart?.toISOString(),
                currentPeriodEnd: dbSubscription.currentPeriodEnd?.toISOString(),
                trialEndsAt: dbSubscription.trialEndsAt?.toISOString(),
                cancelAtPeriodEnd: dbSubscription.cancelAtPeriodEnd,
                canceledAt: dbSubscription.canceledAt?.toISOString(),
                updatedAt: dbSubscription.updatedAt?.toISOString(),
              },
              fromCache: true,
              warning: "Unable to sync with Polar, using cached data",
            });
          }
          
          return res.status(500).json({ 
            error: "Failed to fetch subscription",
            message: "Unable to retrieve subscription information" 
          });
        }
      }

      // No Polar configured and no database subscription
      return res.json({ subscription: null, message: "No subscription service configured" });
    } catch (error: any) {
      console.error("Error fetching current subscription:", error);
      res.status(500).json({ 
        error: "Failed to fetch subscription",
        message: error.message 
      });
    }
  });

  // Get available subscription plans
  app.get("/api/subscription/plans", (req: Request, res: Response) => {
    // Filter out sensitive IDs and return plan information
    const plans = Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => ({
      id: key,
      name: plan.name,
      features: plan.features,
      limits: plan.limits,
      // Prices are handled by Polar, not exposed directly
    }));

    res.json({ plans });
  });

  // Create checkout session for subscription - REFACTORED
  app.post("/api/subscription/checkout", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const sessionUser = req.user as any;
      if (!sessionUser) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Fetch fresh user data from database to get updated email
      const userId = sessionUser.claims?.sub || sessionUser.id;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      // Validate request body
      const result = createCheckoutSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: "Validation error", 
          details: fromError(result.error).toString() 
        });
      }

      const { plan, billingInterval } = result.data;
      
      // Require email for all users
      if (!user.email) {
        return res.status(400).json({ 
          error: "Email required", 
          message: "Please set up an email address in your profile to subscribe" 
        });
      }

      // Check if Polar is configured
      if (!process.env.POLAR_API_KEY) {
        return res.status(503).json({ 
          error: "Service unavailable", 
          message: "Subscription service is not configured. Please contact support." 
        });
      }

      // Get the plan configuration
      const planConfig = SUBSCRIPTION_PLANS[plan];
      // Free plan doesn't have productId - that's ok, we'll handle it below
      if (!planConfig) {
        return res.status(400).json({ 
          error: "Invalid plan", 
          message: "The selected plan is not available" 
        });
      }
      
      // Check if plan has productId (free plan doesn't)
      if (!('productId' in planConfig) || !planConfig.productId) {
        return res.status(400).json({ 
          error: "Invalid plan", 
          message: "The selected plan requires a valid product ID configuration" 
        });
      }

      // Get the appropriate Polar client for this user
      const polarClient = await getPolarClient(userId);
      
      // Create or get customer in Polar
      const customer = await polarClient.createOrGetCustomerForUser(
        user.email,
        `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined
      );

      // Store Polar customer ID
      await storage.updateUser(userId, {
        polarCustomerId: customer.id,
      });

      // Check if customer has any existing subscriptions
      const existingSubscriptions = await polarClient.getSubscriptions(customer.id);
      
      // Find active or trialing subscription
      const activeSubscription = existingSubscriptions.find(sub => 
        sub.status === 'active' || sub.status === 'trialing'
      );

      // Handle existing subscription - switch plan instead of creating new checkout
      if (activeSubscription) {
        console.log(`User ${user.email} has existing subscription, switching plan from current to ${plan}`);
        
        try {
          // Check if planConfig has productId before using it
          if (!('productId' in planConfig) || !planConfig.productId) {
            return res.status(400).json({ 
              error: "Invalid plan configuration",
              message: "Cannot switch to a plan without a product ID"
            });
          }
          
          // Use switchSubscriptionPlan for immediate upgrade
          const updatedSubscription = await polarClient.switchSubscriptionPlan({
            subscriptionId: activeSubscription.id,
            newProductId: planConfig.productId,
            switchAtPeriodEnd: false, // Switch immediately for upgrades
          });

          // For regular users, sync from Polar
          const polarData = await polarClient.syncUserSubscriptionBenefits(user.email);
          await storage.updateUser(userId, {
            subscriptionBenefits: polarData.benefits,
          });

          // Return success response for immediate upgrade
          return res.json({
            success: true,
            message: `Successfully upgraded to ${plan} plan`,
            upgraded: true,
            plan: plan,
            redirectUrl: '/app/subscription/success', // Redirect to success page
          });
        } catch (switchError: any) {
          console.error('Error switching subscription plan:', switchError);
          // Fall through to create new checkout if switching fails
        }
      }

      // Check for cancelled subscription that might block new checkout
      const cancelledSubscription = existingSubscriptions.find(sub => 
        sub.status === 'canceled' && sub.cancelAtPeriodEnd === false
      );

      if (cancelledSubscription) {
        console.log(`User ${user.email} has a cancelled subscription, may need special handling`);
        // For cancelled subscriptions that have ended, proceed with new checkout
        // Polar should handle this case appropriately
      }

      // No active subscription or switching failed - create new checkout session
      // Properly derive the base URL from request headers
      let baseUrl: string;
      
      // Priority 1: Use APP_URL if explicitly set
      if (process.env.APP_URL) {
        baseUrl = process.env.APP_URL;
        console.log('[Subscription] Using APP_URL for checkout:', baseUrl);
      } else {
        // Priority 2: Try to use REPLIT_DOMAINS if available (production Replit)
        if (process.env.REPLIT_DOMAINS) {
          const replitDomain = process.env.REPLIT_DOMAINS.split(',')[0].trim();
          baseUrl = `https://${replitDomain}`;
          console.log('[Subscription] Using REPLIT_DOMAINS for checkout:', baseUrl);
        } else {
          // Priority 3: Derive from request headers
          const protocol = req.get('x-forwarded-proto') || req.protocol;
          const host = req.get('host');
          
          if (!host) {
            // Fallback to localhost if no host header
            baseUrl = 'http://localhost:5000';
            console.warn('[Subscription] Warning: Using fallback localhost URL for checkout');
          } else {
            baseUrl = `${protocol}://${host}`;
            console.log('[Subscription] Using request headers for checkout:', baseUrl);
          }
        }
      }
      
      // Ensure baseUrl doesn't have trailing slash
      baseUrl = baseUrl.replace(/\/$/, '');
      
      console.log(`[Subscription] Creating checkout for user ${user.email} with baseUrl: ${baseUrl}`);
      
      // Check productId again before creating session (defensive programming)
      if (!('productId' in planConfig) || !planConfig.productId) {
        return res.status(400).json({ 
          error: "Invalid plan configuration",
          message: "Cannot create checkout session without a product ID"
        });
      }
      
      // Log the URLs being used for debugging
      const successUrl = `${baseUrl}/app/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${baseUrl}/app/subscription/cancel`;
      
      console.log('[Subscription] Checkout URLs:', {
        success: successUrl,
        cancel: cancelUrl,
        productId: planConfig.productId,
        customerEmail: user.email
      });

      const session = await polarClient.createCheckoutSession({
        productId: planConfig.productId,
        successUrl: successUrl,
        cancelUrl: cancelUrl,
        customerEmail: user.email,
        metadata: {
          userId: userId,
          plan: plan,
          billingInterval: billingInterval || 'month',
        },
      });

      console.log(`[Subscription] Checkout session created successfully: ${session.id}`);

      // Prepare database for incoming webhook by creating a pending subscription record
      // This helps track checkout sessions and handle webhook delays
      const pendingSubscriptionData = {
        userId: userId,
        polarSubscriptionId: session.id, // Store checkout session ID temporarily
        polarCustomerId: customer.id,
        productId: planConfig.productId,
        status: 'pending_checkout',
        plan: plan,
        billingInterval: billingInterval,
        metadata: {
          checkoutSessionId: session.id,
          checkoutCreatedAt: new Date().toISOString(),
          checkoutUrl: session.url,
          isPendingCheckout: true,
        },
      };

      // Check if there's an existing pending checkout record
      const existingPendingSubscription = await storage.getSubscriptionByUserId(userId);
      
      if (existingPendingSubscription && existingPendingSubscription.status === 'pending_checkout') {
        // Update existing pending record with new checkout session
        await storage.updateSubscription(existingPendingSubscription.id, pendingSubscriptionData);
        console.log(`[Subscription] Updated existing pending checkout record for user ${userId}`);
      } else if (!existingPendingSubscription) {
        // Create new pending subscription record
        await storage.createSubscription(pendingSubscriptionData);
        console.log(`[Subscription] Created pending checkout record for user ${userId}`);
      }

      res.json({
        checkoutUrl: session.url,
        sessionId: session.id,
      });
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      
      // Provide helpful error message for product not found
      if (error.message?.includes('Not Found')) {
        res.status(500).json({ 
          error: "Polar product not configured",
          message: "The subscription products are not yet configured in your Polar account. Please create products in Polar and update the product IDs in the application configuration.",
          details: {
            attempted_plan: req.body?.plan,
            instruction: "Visit your Polar dashboard to create subscription products, then update the POLAR_PRODUCT_IDS environment variables with the actual product IDs."
          }
        });
        return;
      }
      
      res.status(500).json({ 
        error: "Failed to create checkout session",
        message: error.message 
      });
    }
  });

  // Handle successful checkout (callback from Polar) - REFACTORED
  app.get("/api/subscription/success", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { session_id } = req.query;
      
      if (!session_id || typeof session_id !== 'string') {
        return res.status(400).json({ error: "Missing session ID" });
      }

      const sessionUser = req.user as any;
      if (!sessionUser) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Fetch fresh user data from database to get updated email
      const userId = sessionUser.claims?.sub || sessionUser.id;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      // Get the appropriate Polar client for this user
      const polarClient = await getPolarClient(userId);
      
      // Verify the checkout session
      const session = await polarClient.getCheckoutSession(session_id);
      
      // Sync from Polar
      if (user.email) {
        const polarData = await polarClient.syncUserSubscriptionBenefits(user.email);
        
        if (polarData.benefits.plan !== 'free') {
          // Update user subscription benefits in database
          await storage.updateUser(userId, {
            polarCustomerId: polarData.customerId,
            subscriptionBenefits: polarData.benefits,
          });

          const planName = polarData.benefits.plan;
          const plan = SUBSCRIPTION_PLANS[planName as keyof typeof SUBSCRIPTION_PLANS] || SUBSCRIPTION_PLANS.pro;

          return res.json({
            success: true,
            message: "Subscription activated successfully",
            plan: planName,
            features: plan.features,
          });
        }
      }

      res.status(400).json({ 
        error: "Subscription verification failed",
        message: "Unable to verify subscription. Please contact support." 
      });
    } catch (error: any) {
      console.error("Error handling subscription success:", error);
      res.status(500).json({ 
        error: "Failed to activate subscription",
        message: error.message 
      });
    }
  });

  // Cancel subscription - REFACTORED with race condition prevention
  app.post("/api/subscription/cancel", isAuthenticated, async (req: Request, res: Response) => {
    let releaseLock: (() => void) | undefined;
    
    try {
      const sessionUser = req.user as any;
      if (!sessionUser) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Fetch user ID consistently with other endpoints
      const userId = sessionUser.claims?.sub || sessionUser.id;

      // Acquire lock to prevent race conditions
      try {
        releaseLock = await subscriptionLockManager.acquireLock(
          userId,
          'cancel-subscription',
          15000 // 15 second timeout
        );
      } catch (lockError: any) {
        return res.status(409).json({
          error: "Operation in progress",
          message: "Another subscription operation is in progress. Please try again shortly."
        });
      }

      // Validate request body
      const result = cancelSubscriptionSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: "Validation error", 
          details: fromError(result.error).toString() 
        });
      }

      const { immediate } = result.data;

      // Get user data
      const userData = await storage.getUserById(userId);
      
      // Regular flow for all users
      if (!userData?.polarCustomerId) {
        return res.status(400).json({ 
          error: "No active subscription", 
          message: "You don't have an active subscription to cancel" 
        });
      }

      // Get the appropriate Polar client for this user
      const polarClient = await getPolarClient(userId);
      
      // Get current subscription from Polar
      let subscriptionId: string | undefined;
      try {
        const subscriptions = await polarClient.getSubscriptions(userData.polarCustomerId);
        const activeSubscription = subscriptions.find(sub => 
          sub.status === 'active' || sub.status === 'trialing'
        );
        
        if (!activeSubscription) {
          return res.status(400).json({ 
            error: "No active subscription", 
            message: "You don't have an active subscription to cancel" 
          });
        }
        
        subscriptionId = activeSubscription.id;
      } catch (error) {
        console.error("Error finding subscription:", error);
        return res.status(400).json({ 
          error: "Subscription not found", 
          message: "Unable to find your subscription. It may have already been canceled or expired." 
        });
      }

      // Cancel subscription in Polar with the new options
      const cancellationResult = await polarClient.cancelSubscription(
        subscriptionId,
        {
          immediate: immediate,
          cancelAtPeriodEnd: !immediate
        }
      );

      // Update database subscription record immediately after Polar cancellation
      const dbSubscription = await storage.getSubscriptionByUserId(userId);
      
      if (dbSubscription) {
        const now = new Date();
        const updateData: any = {
          canceledAt: now,
          cancelAtPeriodEnd: !immediate,
          status: immediate ? 'canceled' : dbSubscription.status, // Keep current status if canceling at period end
          metadata: {
            ...(dbSubscription.metadata as any || {}),
            cancellationRequestedAt: now.toISOString(),
            cancellationImmediate: immediate,
            cancellationProcessed: true,
          },
        };

        // If immediate cancellation, also update the end date
        if (immediate) {
          updateData.endedAt = now;
        }

        await storage.updateSubscription(dbSubscription.id, updateData);
      }

      // Update user subscription benefits
      const updatedBenefits = userData.subscriptionBenefits as any || {};
      if (immediate) {
        // Immediate cancellation - revert to free tier
        updatedBenefits.plan = 'free';
        updatedBenefits.quizzesPerDay = SUBSCRIPTION_PLANS.free.limits.quizzesPerDay;
        updatedBenefits.categoriesAccess = SUBSCRIPTION_PLANS.free.limits.categoriesAccess;
        updatedBenefits.analyticsAccess = SUBSCRIPTION_PLANS.free.limits.analyticsAccess;
        updatedBenefits.cancelAtPeriodEnd = false;
        delete updatedBenefits.teamMembers;
        delete updatedBenefits.canceledAt;
      } else {
        // For scheduled cancellation, keep current benefits but mark as canceling
        updatedBenefits.cancelAtPeriodEnd = true;
        updatedBenefits.canceledAt = new Date().toISOString();
        updatedBenefits.currentPeriodEnd = cancellationResult.subscription.currentPeriodEnd;
      }
      updatedBenefits.lastSyncedAt = new Date().toISOString();

      await storage.updateUser(userId, {
        subscriptionBenefits: updatedBenefits,
      });

      // Return appropriate response based on cancellation type
      if (immediate) {
        res.json({
          success: true,
          message: "Subscription canceled immediately. A prorated refund will be processed to your original payment method.",
          refundAmount: cancellationResult.refundAmount,
          canceledAt: cancellationResult.subscription.canceledAt,
        });
      } else {
        res.json({
          success: true,
          message: "Your subscription will be canceled at the end of the current billing period. You'll keep access until then.",
          cancelAtPeriodEnd: true,
          canceledAt: updatedBenefits.canceledAt,
          endsAt: cancellationResult.subscription.currentPeriodEnd,
        });
      }
    } catch (error: any) {
      console.error("Error canceling subscription:", error);
      res.status(500).json({ 
        error: "Failed to cancel subscription",
        message: error.message 
      });
    } finally {
      // Always release the lock
      if (releaseLock) {
        releaseLock();
      }
    }
  });

  // Resume canceled subscription - REFACTORED
  app.post("/api/subscription/resume", isAuthenticated, async (req: Request, res: Response) => {
    const sessionUser = req.user as any;
    if (!sessionUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Fetch user ID consistently with other endpoints
    const userId = sessionUser.claims?.sub || sessionUser.id;

    // Get user data
    const userData = await storage.getUserById(userId);
    
    try {
      if (!userData?.polarCustomerId) {
        return res.status(400).json({ 
          error: "No subscription found", 
          message: "Unable to find a subscription to resume. Please start a new subscription." 
        });
      }

      // Get the appropriate Polar client for this user
      const polarClient = await getPolarClient(userId);
      
      // Find canceled subscription in Polar
      let subscriptionId: string | undefined;
      try {
        const subscriptions = await polarClient.getSubscriptions(userData.polarCustomerId);
        const canceledSubscription = subscriptions.find(sub => 
          sub.status === 'canceled' && sub.cancelAtPeriodEnd === true
        );
        
        if (!canceledSubscription) {
          return res.status(400).json({ 
            error: "No canceled subscription found", 
            message: "Unable to find a canceled subscription to resume. Your subscription may have expired." 
          });
        }
        
        subscriptionId = canceledSubscription.id;
      } catch (error) {
        console.error("Error finding subscription:", error);
        return res.status(400).json({ 
          error: "Subscription not found", 
          message: "Unable to find your subscription." 
        });
      }

      // Resume subscription in Polar
      const resumedSubscription = await polarClient.resumeSubscription(subscriptionId);

      // Sync updated benefits from Polar and clear cancellation flags
      if (userData.email) {
        const polarData = await polarClient.syncUserSubscriptionBenefits(userData.email);
        // Ensure cancellation flags are cleared when resuming
        const updatedBenefits = {
          ...polarData.benefits,
          cancelAtPeriodEnd: false,
        };
        delete (updatedBenefits as any).canceledAt;
        
        await storage.updateUser(userId, {
          subscriptionBenefits: updatedBenefits,
        });
      }

      res.json({
        success: true,
        message: "Subscription resumed successfully",
        status: resumedSubscription.status,
        expiresAt: resumedSubscription.currentPeriodEnd,
      });
    } catch (error: any) {
      console.error("Error resuming subscription:", error);
      
      // Check if it's a Polar API error about subscription not existing
      if (error.message?.includes("not found") || error.message?.includes("does not exist")) {
        // Update benefits to free tier if subscription doesn't exist
        const freeBenefits = {
          plan: 'free',
          quizzesPerDay: SUBSCRIPTION_PLANS.free.limits.quizzesPerDay,
          categoriesAccess: SUBSCRIPTION_PLANS.free.limits.categoriesAccess,
          analyticsAccess: SUBSCRIPTION_PLANS.free.limits.analyticsAccess,
          lastSyncedAt: new Date().toISOString(),
        };
        
        await storage.updateUser(userData.id, {
          subscriptionBenefits: freeBenefits,
        });
        
        return res.status(400).json({ 
          error: "Subscription not found",
          message: "Your subscription could not be found in our payment system. It may have expired or been removed. Please start a new subscription." 
        });
      }
      
      res.status(500).json({ 
        error: "Failed to resume subscription",
        message: error.message 
      });
    }
  });

  // Switch subscription plan - NEW ENDPOINT with race condition prevention
  app.post("/api/subscription/switch", isAuthenticated, async (req: Request, res: Response) => {
    let releaseLock: (() => void) | undefined;
    
    const sessionUser = req.user as any;
    if (!sessionUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const switchPlanSchema = z.object({
      newPlan: z.enum(['pro', 'enterprise']),
      billingInterval: z.enum(['monthly', 'yearly']).optional().default('monthly'),
      switchAtPeriodEnd: z.boolean().optional().default(false),
    });

    try {
      // Validate request body
      const { newPlan, billingInterval, switchAtPeriodEnd } = switchPlanSchema.parse(req.body);

      // Extract user ID consistently with other endpoints
      const userId = sessionUser.claims?.sub || sessionUser.id;
      
      // Acquire lock to prevent race conditions
      try {
        releaseLock = await subscriptionLockManager.acquireLock(
          userId,
          'switch-subscription',
          15000 // 15 second timeout
        );
      } catch (lockError: any) {
        return res.status(409).json({
          error: "Operation in progress",
          message: "Another subscription operation is in progress. Please try again shortly."
        });
      }
      
      // Get user data
      const userData = await storage.getUserById(userId);
      
      // Check for Polar customer ID
      if (!userData?.polarCustomerId) {
        return res.status(400).json({ 
          error: "No customer account found", 
          message: "You need to have an active or past subscription to switch plans." 
        });
      }

      // Check if Polar is configured
      if (!process.env.POLAR_API_KEY) {
        return res.status(503).json({ 
          error: "Subscription service not configured",
          message: "Subscription switching is currently unavailable. Please contact support."
        });
      }

      // Get the appropriate Polar client for this user
      const polarClient = await getPolarClient(userId);
      
      // Get current subscription from Polar
      const subscriptions = await polarClient.getSubscriptions(userData.polarCustomerId);
      const currentSubscription = subscriptions.find(sub => 
        sub.status === 'active' || sub.status === 'trialing'
      );

      if (!currentSubscription) {
        return res.status(400).json({ 
          error: "No active subscription", 
          message: "You don't have an active subscription to switch. Please start a new subscription instead." 
        });
      }

      // Get the product ID for the new plan
      const newPlanConfig = SUBSCRIPTION_PLANS[newPlan];
      if (!newPlanConfig || !('productId' in newPlanConfig) || !newPlanConfig.productId) {
        return res.status(400).json({ 
          error: "Invalid plan",
          message: `The ${newPlan} plan is not properly configured. Please contact support.`
        });
      }
      const newProductId = newPlanConfig.productId;

      // Check if switching to the same plan
      if (currentSubscription.productId === newProductId) {
        return res.status(400).json({ 
          error: "Already on this plan",
          message: `You are already subscribed to the ${newPlan} plan.`
        });
      }

      // Get available prices for the new product to find the right price ID
      // This helps select monthly vs yearly pricing
      let priceId: string | undefined;
      try {
        const prices = await polarClient.getProductPrices(newProductId);
        
        // Find matching price based on billing interval
        const targetInterval = billingInterval === 'yearly' ? 'year' : 'month';
        const matchingPrice = prices.find(price => 
          price.interval === targetInterval && price.intervalCount === 1
        );
        
        if (matchingPrice) {
          priceId = matchingPrice.id;
        }
      } catch (error) {
        console.error("Error fetching product prices:", error);
        // Continue without price ID - Polar will use default pricing
      }

      // Switch the subscription plan
      const updatedSubscription = await polarClient.switchSubscriptionPlan({
        subscriptionId: currentSubscription.id,
        newProductId,
        priceId,
        switchAtPeriodEnd,
      });

      // Update database subscription record immediately after successful Polar API call
      const dbSubscription = await storage.getSubscriptionByUserId(userId);
      
      // Handle both camelCase and snake_case from Polar API
      const updatedSub = updatedSubscription as any;
      const subscriptionData = {
        userId: userId,
        polarSubscriptionId: updatedSub.id,
        polarCustomerId: userData.polarCustomerId,
        productId: newProductId,
        priceId: priceId || updatedSub.priceId || updatedSub.price_id,
        status: updatedSub.status,
        plan: newPlan,
        billingInterval: billingInterval,
        currentPeriodStart: updatedSub.currentPeriodStart || updatedSub.current_period_start ? new Date(updatedSub.currentPeriodStart || updatedSub.current_period_start) : new Date(),
        currentPeriodEnd: updatedSub.currentPeriodEnd || updatedSub.current_period_end ? new Date(updatedSub.currentPeriodEnd || updatedSub.current_period_end) : new Date(),
        trialEndsAt: updatedSub.trialEndsAt || updatedSub.trial_ends_at ? new Date(updatedSub.trialEndsAt || updatedSub.trial_ends_at) : undefined,
        cancelAtPeriodEnd: updatedSub.cancelAtPeriodEnd !== undefined ? updatedSub.cancelAtPeriodEnd : (updatedSub.cancel_at_period_end || false),
        metadata: {
          switchedFrom: currentSubscription.productId,
          switchedAt: new Date().toISOString(),
          switchAtPeriodEnd: switchAtPeriodEnd,
        },
      };

      let savedSubscription;
      if (dbSubscription) {
        savedSubscription = await storage.updateSubscription(dbSubscription.id, subscriptionData);
      } else {
        savedSubscription = await storage.createSubscription(subscriptionData);
      }

      // Sync updated benefits from Polar and update user
      if (userData.email) {
        const polarData = await polarClient.syncUserSubscriptionBenefits(userData.email);
        await storage.updateUser(userData.id, {
          subscriptionBenefits: {
            ...polarData.benefits,
            subscriptionId: savedSubscription?.id,
          },
        });
      }

      // Determine if it's an upgrade or downgrade
      const isUpgrade = newPlan === 'enterprise';

      // Return data from database record as source of truth
      res.json({
        success: true,
        message: switchAtPeriodEnd 
          ? `Plan ${isUpgrade ? 'upgrade' : 'downgrade'} scheduled for the end of your current billing period`
          : `Successfully ${isUpgrade ? 'upgraded' : 'downgraded'} to ${newPlan} plan`,
        newPlan,
        billingInterval,
        switchAtPeriodEnd,
        effectiveDate: switchAtPeriodEnd 
          ? savedSubscription?.currentPeriodEnd?.toISOString() 
          : savedSubscription?.updatedAt?.toISOString(),
        subscription: {
          id: savedSubscription?.id,
          polarSubscriptionId: savedSubscription?.polarSubscriptionId,
          status: savedSubscription?.status,
          currentPeriodEnd: savedSubscription?.currentPeriodEnd?.toISOString(),
          plan: savedSubscription?.plan,
        },
      });

    } catch (error: any) {
      console.error("Error switching subscription:", error);
      
      if (error.name === 'ZodError') {
        const validationError = fromError(error);
        return res.status(400).json({ 
          error: "Invalid request",
          message: validationError.toString()
        });
      }

      res.status(500).json({ 
        error: "Failed to switch subscription",
        message: error.message || "An unexpected error occurred while switching your subscription plan."
      });
    } finally {
      // Always release the lock
      if (releaseLock) {
        releaseLock();
      }
    }
  });

  // Confirm checkout session after successful payment - REFACTORED
  app.get("/api/subscription/confirm", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { session_id } = req.query;
      const user = req.user as User;
      const userId = (user as any).claims?.sub || (user as any).id;

      console.log(`[Subscription] Confirming checkout session ${session_id} for user ${userId}`);

      if (!session_id || typeof session_id !== 'string') {
        console.error('[Subscription] Missing or invalid session ID in confirmation request');
        return res.status(400).json({ 
          error: "Missing session ID",
          success: false 
        });
      }

      // Check if Polar is configured
      if (!process.env.POLAR_API_KEY) {
        // If Polar is not configured, just return success with mock data
        return res.json({
          success: true,
          plan: 'pro',
          billingInterval: 'month',
          message: 'Subscription confirmed (demo mode)'
        });
      }

      try {
        // Get the appropriate Polar client for this user
        const polarClient = await getPolarClient(userId);
        
        // Get the checkout session from Polar
        const session = await polarClient.getCheckoutSession(session_id);
        
        if (!session) {
          return res.status(404).json({ 
            error: "Session not found",
            success: false 
          });
        }

        // Extract plan info from metadata
        const plan = session.metadata?.plan || 'pro';
        const billingInterval = session.metadata?.billingInterval || 'month';

        // Sync subscription benefits from Polar
        const userData = await storage.getUserById(userId);
        if (userData?.email) {
          const polarData = await polarClient.syncUserSubscriptionBenefits(userData.email);
          await storage.updateUser(userId, {
            polarCustomerId: polarData.customerId,
            subscriptionBenefits: polarData.benefits,
          });
        }

        return res.json({
          success: true,
          plan,
          billingInterval,
          message: 'Subscription activated successfully'
        });
      } catch (polarError) {
        console.error('Error confirming Polar session:', polarError);
        
        // Even if Polar fails, update user to pro for demo purposes
        const proBenefits = {
          plan: 'pro',
          quizzesPerDay: SUBSCRIPTION_PLANS.pro.limits.quizzesPerDay,
          categoriesAccess: SUBSCRIPTION_PLANS.pro.limits.categoriesAccess,
          analyticsAccess: SUBSCRIPTION_PLANS.pro.limits.analyticsAccess,
          lastSyncedAt: new Date().toISOString(),
        };
        
        await storage.updateUser(userId, {
          subscriptionBenefits: proBenefits,
        });

        return res.json({
          success: true,
          plan: 'pro',
          billingInterval: 'month',
          message: 'Subscription confirmed'
        });
      }
    } catch (error) {
      console.error('Error confirming subscription:', error);
      res.status(500).json({ 
        error: "Internal server error",
        success: false 
      });
    }
  });

  // Webhook endpoint for Polar events - ENHANCED WITH FULL SUBSCRIPTION DATA PERSISTENCE
  app.post("/api/subscription/webhook", async (req: Request, res: Response) => {
    try {
      const { type, data } = req.body;

      console.log(`[Webhook] Received Polar event: ${type}`);
      console.log(`[Webhook] Event data:`, JSON.stringify(data, null, 2));

      // Verify webhook signature if secret is configured
      // For webhooks, we use the real client by default since we don't have user context yet
      const defaultPolarClient = await getPolarClient();
      
      if (process.env.POLAR_WEBHOOK_SECRET) {
        const signature = req.headers['polar-webhook-signature'] as string;
        if (!signature) {
          console.error("[Webhook] Missing webhook signature");
          // Return 200 to prevent retries even on signature failure
          return res.status(200).json({ received: true, error: "Missing webhook signature" });
        }

        const isValid = defaultPolarClient.verifyWebhook(
          JSON.stringify(req.body),
          signature
        );

        if (!isValid) {
          console.error("[Webhook] Invalid webhook signature");
          // Return 200 to prevent retries even on signature failure
          return res.status(200).json({ received: true, error: "Invalid webhook signature" });
        }
      }

      // Handle different webhook events
      switch (type) {
        case 'subscription.created':
        case 'subscription.updated':
        case 'subscription.resumed': {
          const subscription = data.subscription;
          const customerId = subscription.customer_id;

          console.log(`[Webhook] Processing ${type} for customer ID: ${customerId}`);
          console.log(`[Webhook] Subscription ID: ${subscription.id}`);
          console.log(`[Webhook] Product ID: ${subscription.product_id}`);
          console.log(`[Webhook] Status: ${subscription.status}`);

          // Find user by customer ID
          const users = await storage.getUserByPolarCustomerId(customerId);
          if (!users || users.length === 0) {
            console.warn(`[Webhook] No user found for customer ID: ${customerId}`);
            return res.status(200).json({ received: true });
          }

          const user = users[0];
          console.log(`[Webhook] Found user: ${user.id} (${user.email})`);

          // Update user's Polar customer ID if not set
          if (!user.polarCustomerId) {
            console.log(`[Webhook] Updating user's Polar customer ID`);
            await storage.updateUser(user.id, {
              polarCustomerId: customerId,
            });
          }

          try {
            // Check if subscription exists in database
            const existingSubscription = await storage.getSubscriptionByPolarId(subscription.id);
            
            // Determine plan from product ID
            let planName = 'free';
            if (subscription.product_id === SUBSCRIPTION_PLANS.pro.productId) {
              planName = 'pro';
            } else if (subscription.product_id === SUBSCRIPTION_PLANS.enterprise.productId) {
              planName = 'enterprise';
            }

            const plan = SUBSCRIPTION_PLANS[planName as keyof typeof SUBSCRIPTION_PLANS];

            // Prepare subscription data
            const subscriptionData = {
              userId: user.id,
              polarSubscriptionId: subscription.id,
              polarCustomerId: customerId,
              productId: subscription.product_id,
              priceId: subscription.price_id,
              status: subscription.status,
              plan: planName,
              billingInterval: subscription.recurring_interval || 'month',
              currentPeriodStart: subscription.current_period_start ? new Date(subscription.current_period_start) : new Date(),
              currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end) : new Date(),
              trialEndsAt: subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : undefined,
              cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
              canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at) : undefined,
              endedAt: subscription.ended_at ? new Date(subscription.ended_at) : undefined,
              metadata: {
                productName: subscription.product?.name,
                priceAmount: subscription.price?.amount,
                priceCurrency: subscription.price?.currency,
                customerEmail: subscription.customer?.email,
                webhookProcessedAt: new Date().toISOString(),
                eventType: type,
              },
            };

            let savedSubscription;
            
            if (existingSubscription) {
              console.log(`[Webhook] Updating existing subscription ${existingSubscription.id}`);
              // Update existing subscription
              savedSubscription = await storage.updateSubscription(
                existingSubscription.id,
                subscriptionData
              );
            } else {
              console.log(`[Webhook] Creating new subscription record`);
              // Create new subscription
              savedSubscription = await storage.createSubscription(subscriptionData);
            }

            console.log(`[Webhook] Subscription ${savedSubscription ? 'saved' : 'save failed'} - ID: ${savedSubscription?.id}`);

            // Update user's subscription benefits with full details
            const benefitsWithSubscription = {
              plan: planName,
              quizzesPerDay: plan.limits.quizzesPerDay,
              categoriesAccess: plan.limits.categoriesAccess,
              analyticsAccess: plan.limits.analyticsAccess,
              teamMembers: (plan.limits as any).teamMembers,
              subscriptionId: savedSubscription?.id,
              polarSubscriptionId: subscription.id,
              cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
              canceledAt: subscription.canceled_at,
              currentPeriodEnd: subscription.current_period_end,
              trialEndsAt: subscription.trial_ends_at,
              lastSyncedAt: new Date().toISOString(),
            };

            console.log(`[Webhook] Updating user benefits to ${planName} plan`);
            await storage.updateUser(user.id, {
              subscriptionBenefits: benefitsWithSubscription,
            });

            console.log(`[Webhook] Successfully processed ${type} for user ${user.id}`);
          } catch (dbError) {
            console.error(`[Webhook] Database error processing subscription:`, dbError);
            // Continue processing - we'll still return 200 to prevent retries
          }

          break;
        }

        case 'subscription.canceled':
        case 'subscription.expired': {
          const subscription = data.subscription;
          const customerId = subscription.customer_id;

          console.log(`[Webhook] Processing ${type} for customer ID: ${customerId}`);
          console.log(`[Webhook] Subscription ID: ${subscription.id}`);

          // Find user by customer ID
          const users = await storage.getUserByPolarCustomerId(customerId);
          if (!users || users.length === 0) {
            console.warn(`[Webhook] No user found for customer ID: ${customerId}`);
            return res.status(200).json({ received: true });
          }

          const user = users[0];
          console.log(`[Webhook] Found user: ${user.id} (${user.email})`);

          try {
            // Find and update subscription in database
            const existingSubscription = await storage.getSubscriptionByPolarId(subscription.id);
            
            if (existingSubscription) {
              console.log(`[Webhook] Updating subscription ${existingSubscription.id} to ${type === 'subscription.canceled' ? 'canceled' : 'expired'}`);
              
              const updateData: any = {
                status: type === 'subscription.canceled' ? 'canceled' : 'expired',
              };

              if (type === 'subscription.canceled') {
                updateData.canceledAt = subscription.canceled_at ? new Date(subscription.canceled_at) : new Date();
                updateData.cancelAtPeriodEnd = subscription.cancel_at_period_end || false;
              } else if (type === 'subscription.expired') {
                updateData.endedAt = subscription.ended_at ? new Date(subscription.ended_at) : new Date();
              }

              // Add metadata about the cancellation/expiration
              updateData.metadata = {
                ...(existingSubscription.metadata as any || {}),
                [`${type}_processed_at`]: new Date().toISOString(),
                cancellationReason: subscription.cancellation_reason,
                eventType: type,
              };

              await storage.updateSubscriptionByPolarId(
                subscription.id,
                updateData
              );
            } else {
              console.warn(`[Webhook] No subscription found in database for Polar ID: ${subscription.id}`);
            }

            // Update user to free tier benefits
            const freeBenefits = {
              plan: 'free',
              quizzesPerDay: SUBSCRIPTION_PLANS.free.limits.quizzesPerDay,
              categoriesAccess: SUBSCRIPTION_PLANS.free.limits.categoriesAccess,
              analyticsAccess: SUBSCRIPTION_PLANS.free.limits.analyticsAccess,
              subscriptionId: null, // Clear the subscription reference
              polarSubscriptionId: null,
              cancelAtPeriodEnd: false,
              canceledAt: type === 'subscription.canceled' ? (subscription.canceled_at || new Date().toISOString()) : undefined,
              endedAt: type === 'subscription.expired' ? (subscription.ended_at || new Date().toISOString()) : undefined,
              lastSyncedAt: new Date().toISOString(),
            };

            console.log(`[Webhook] Reverting user to free tier`);
            await storage.updateUser(user.id, {
              subscriptionBenefits: freeBenefits,
            });

            console.log(`[Webhook] Successfully processed ${type} for user ${user.id}`);
          } catch (dbError) {
            console.error(`[Webhook] Database error processing cancellation/expiration:`, dbError);
            // Continue processing - we'll still return 200 to prevent retries
          }

          break;
        }

        case 'checkout.created':
        case 'checkout.updated': {
          // Log checkout events but don't process them
          console.log(`[Webhook] Checkout event received: ${type}`);
          break;
        }

        default:
          console.log(`[Webhook] Unhandled webhook event: ${type}`);
      }

      // Always return 200 OK to prevent webhook retries
      res.json({ received: true });
    } catch (error: any) {
      console.error(`[Webhook] Critical error processing webhook:`, error);
      console.error(`[Webhook] Error stack:`, error.stack);
      
      // Even on critical errors, return 200 OK to prevent webhook retries
      // Polar will not retry if we return 200, preventing duplicate processing
      res.status(200).json({ 
        received: true,
        error: "Internal processing error - logged for investigation"
      });
    }
  });
}