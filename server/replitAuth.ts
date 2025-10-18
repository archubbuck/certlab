import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only secure cookies in production
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  const userId = claims["sub"];
  const userEmail = claims["email"];
  
  // Check if user exists before upserting
  const existingUser = await storage.getUserById(userId);
  const isNewUser = !existingUser;
  
  // Upsert the user
  const user = await storage.upsertUser({
    id: userId,
    email: userEmail,
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
  
  // Auto-subscribe new users to free plan
  if (isNewUser && userEmail) {
    console.log(`[Auth] New user detected: ${userId} (${userEmail}). Creating free plan subscription...`);
    
    try {
      // Import here to avoid circular dependency
      const { getPolarClient } = await import('./polar');
      const { SUBSCRIPTION_PLANS } = await import('./polar');
      const { getProductId, getPriceId } = await import('./polar');
      
      // Get free plan configuration
      const freeProductId = getProductId('free', 'monthly');
      const freePriceId = getPriceId('free', 'monthly');
      
      if (freeProductId && freePriceId) {
        // Create a customer in Polar if configured
        const polarClient = await getPolarClient(userId);
        
        try {
          // Check if customer already exists
          let customer = await polarClient.getCustomerByEmail(userEmail);
          
          if (!customer) {
            // Create customer in Polar
            customer = await polarClient.createCustomer({
              email: userEmail,
              name: `${claims["first_name"] || ''} ${claims["last_name"] || ''}`.trim() || undefined,
              metadata: {
                userId: userId,
                source: 'auto_signup',
                createdAt: new Date().toISOString(),
              },
            });
            
            console.log(`[Auth] Created Polar customer for new user: ${customer.id}`);
            
            // Update user with Polar customer ID
            await storage.updateUser(userId, {
              polarCustomerId: customer.id,
            });
          }
          
          // Create free subscription in database
          const subscriptionData = {
            userId: userId,
            polarSubscriptionId: `free_${userId}_${Date.now()}`,
            polarCustomerId: customer.id,
            productId: freeProductId,
            priceId: freePriceId,
            plan: 'free',
            status: 'active',
            billingInterval: 'month',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year for free tier
            metadata: {
              source: 'auto_signup',
              createdAt: new Date().toISOString(),
            } as any,
          };
          
          await storage.createSubscription(subscriptionData as any);
          
          // Update user's subscription benefits
          await storage.updateUser(userId, {
            subscriptionBenefits: {
              plan: 'free',
              quizzesPerDay: SUBSCRIPTION_PLANS.free.limits.quizzesPerDay,
              categoriesAccess: SUBSCRIPTION_PLANS.free.limits.categoriesAccess,
              analyticsAccess: SUBSCRIPTION_PLANS.free.limits.analyticsAccess,
              lastSyncedAt: new Date().toISOString(),
            },
          });
          
          console.log(`[Auth] Successfully created free plan subscription for new user: ${userId}`);
        } catch (polarError: any) {
          console.error(`[Auth] Error creating Polar customer/subscription for new user:`, polarError);
          // Still create local subscription even if Polar fails
          const subscriptionData = {
            userId: userId,
            polarSubscriptionId: `free_${userId}_${Date.now()}`,
            polarCustomerId: `local_${userId}`,
            productId: freeProductId,
            priceId: freePriceId,
            plan: 'free',
            status: 'active',
            billingInterval: 'month',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            metadata: {
              source: 'auto_signup',
              createdAt: new Date().toISOString(),
              polarError: polarError.message,
            } as any,
          };
          
          await storage.createSubscription(subscriptionData as any);
          
          await storage.updateUser(userId, {
            subscriptionBenefits: {
              plan: 'free',
              quizzesPerDay: SUBSCRIPTION_PLANS.free.limits.quizzesPerDay,
              categoriesAccess: SUBSCRIPTION_PLANS.free.limits.categoriesAccess,
              analyticsAccess: SUBSCRIPTION_PLANS.free.limits.analyticsAccess,
              lastSyncedAt: new Date().toISOString(),
            },
          });
        }
      } else {
        console.warn(`[Auth] Free plan not configured (missing product/price IDs). Skipping auto-subscription.`);
      }
    } catch (error: any) {
      console.error(`[Auth] Failed to auto-subscribe new user to free plan:`, error);
      // Don't throw - authentication should still succeed
    }
  }
}



export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  let config;
  try {
    config = await getOidcConfig();
  } catch (error) {
    console.error("Failed to initialize OIDC config:", error);
    throw error;
  }

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  const domains = process.env.REPLIT_DOMAINS!.split(",");
  console.log("Setting up auth for domains:", domains);
  
  for (const domain of domains) {
    console.log(`Registering strategy for domain: ${domain}`);
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }
  
  console.log("Registered strategies:", Object.keys((passport as any)._strategies || {}));

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    const hostname = req.hostname;
    console.log(`Login attempt for hostname: ${hostname}`);
    console.log(`Available strategies:`, (passport as any)._strategies ? Object.keys((passport as any)._strategies) : 'None');
    
    // Map localhost to the Replit domain for development
    let authDomain = hostname;
    if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
      authDomain = domains[0]; // Use the first Replit domain
      console.log(`Mapping localhost to Replit domain: ${authDomain}`);
    }
    
    passport.authenticate(`replitauth:${authDomain}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    const hostname = req.hostname;
    
    // Map localhost to the Replit domain for development
    let authDomain = hostname;
    if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
      authDomain = domains[0]; // Use the first Replit domain
    }
    
    passport.authenticate(`replitauth:${authDomain}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Production authentication logic
  // Check if user is authenticated via passport
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user as any;

  // Check if token has expired
  if (user.expires_at) {
    const now = Math.floor(Date.now() / 1000);
    if (now > user.expires_at) {
      const refreshToken = user.refresh_token;
      if (!refreshToken) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      try {
        const config = await getOidcConfig();
        const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
        updateUserSession(user, tokenResponse);
      } catch (error) {
        console.error("Token refresh failed:", error);
        return res.status(401).json({ message: "Unauthorized" });
      }
    }
  }

  return next();
};