# ADR-011: Gamification & Achievements System

**Status:** ✅ Accepted  
**Date:** 2024-12-22  
**Deciders:** CertLab Team  
**Context:** Define the gamification strategy including points, levels, badges, streaks, and achievement triggers.

## Table of Contents

- [Executive Summary](#executive-summary)
- [Context and Problem Statement](#context-and-problem-statement)
- [Decision](#decision)
- [Implementation Details](#implementation-details)
- [Consequences](#consequences)
- [Alternatives Considered](#alternatives-considered)
- [Related Documents](#related-documents)
- [Code References](#code-references)
- [Revision History](#revision-history)

---

## Executive Summary

CertLab implements a **comprehensive gamification system** with points, levels, badges, streaks, and achievements to motivate learners and track progress. The system uses Firebase for real-time updates and TanStack Query for caching.

### Quick Reference

| Aspect | Implementation | Purpose |
|--------|---------------|---------|
| **Points System** | XP earned per activity | Quantify progress |
| **Levels** | XP thresholds (10 levels) | Show advancement |
| **Badges** | 50+ achievements | Recognize milestones |
| **Streak Tracking** | Daily login tracking | Encourage consistency |
| **Leaderboards** | Per-tenant rankings | Foster competition |
| **Achievement Triggers** | Event-based unlocks | Reward accomplishments |
| **Progress Bars** | Visual feedback | Show completion |
| **Notifications** | Toast alerts | Celebrate wins |

**Key Metrics:**
- Total badges: 50+
- Max level: 10
- XP per quiz: 50-200
- Streak bonus: +10% XP
- Leaderboard refresh: Real-time

---

## Context and Problem Statement

CertLab needed gamification to:

1. **Motivate learners** to complete quizzes
2. **Track progress** visually
3. **Recognize achievements** with badges
4. **Encourage daily practice** with streaks
5. **Foster competition** with leaderboards
6. **Provide instant feedback** on accomplishments
7. **Create sense of progression** with levels
8. **Reward consistency** with bonuses

### Requirements

**Functional Requirements:**
- ✅ Points earned for quizzes, reviews, lectures
- ✅ Level progression based on XP
- ✅ Badge unlocking with criteria
- ✅ Daily streak tracking
- ✅ Leaderboard per tenant
- ✅ Achievement notifications
- ✅ Progress visualization
- ✅ Historical stats

**Non-Functional Requirements:**
- ✅ Real-time updates <500ms
- ✅ Badge check <10ms
- ✅ Leaderboard query <200ms
- ✅ Streak calculation <50ms

---

## Decision

We adopted a **multi-layered gamification system**:

### Gamification Architecture

```
┌───────────────────────────────────────────────────────────┐
│              Gamification System                          │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Points &   │  │    Badges    │  │   Streaks    │   │
│  │    Levels    │  │              │  │              │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                  │                  │           │
│         └──────────────────┼──────────────────┘           │
│                            ▼                              │
│                  ┌──────────────────┐                     │
│                  │  Achievement     │                     │
│                  │  Trigger Engine  │                     │
│                  └──────────────────┘                     │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### Points & Levels

**XP Earning:**
- Quiz completed: 50 XP
- Perfect score: +50 XP bonus
- Lecture read: 20 XP
- Question reviewed: 5 XP
- Daily login: 10 XP
- Streak bonus: +10% XP

**Level Thresholds:**
```typescript
const LEVEL_THRESHOLDS = [
  0,     // Level 1
  100,   // Level 2
  250,   // Level 3
  500,   // Level 4
  1000,  // Level 5
  2000,  // Level 6
  4000,  // Level 7
  7000,  // Level 8
  12000, // Level 9
  20000  // Level 10 (max)
];
```

### Badge System

**Badge Categories:**
- **Quiz Mastery**: Perfect scores, speed runs
- **Dedication**: Streaks, daily logins
- **Knowledge**: Category expertise
- **Completion**: Course finish, all quizzes
- **Special**: Early bird, night owl, weekend warrior

**Badge Schema:**
```typescript
interface Badge {
  id: string;
  name: string;
  description: string;
  category: 'quiz' | 'dedication' | 'knowledge' | 'completion' | 'special';
  iconUrl: string;
  criteria: {
    type: string;
    value: number;
  };
  xpReward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}
```

**Example Badges:**
- 🏆 First Steps: Complete your first quiz
- 🔥 On Fire: Maintain 7-day streak
- ⚡ Speed Demon: Complete quiz in <10 minutes
- 🎯 Perfectionist: 10 perfect scores
- 📚 Bookworm: Read 50 lectures
- 🌟 CISSP Master: 100% in all CISSP categories

### Streak Tracking

**Algorithm:**
```typescript
function calculateStreak(
  lastLoginDate: Date,
  currentStreak: number
): number {
  const now = new Date();
  const daysSinceLogin = Math.floor(
    (now.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceLogin === 0) {
    // Same day login
    return currentStreak;
  } else if (daysSinceLogin === 1) {
    // Consecutive day
    return currentStreak + 1;
  } else {
    // Streak broken
    return 1;
  }
}
```

---

## Implementation Details

### 1. User Game Stats

**File:** `shared/schema.ts`

```typescript
export const userGameStats = pgTable('user_game_stats', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  tenantId: integer('tenant_id').notNull().default(1),
  
  // Points & Levels
  totalXP: integer('total_xp').notNull().default(0),
  level: integer('level').notNull().default(1),
  
  // Streaks
  currentStreak: integer('current_streak').notNull().default(0),
  longestStreak: integer('longest_streak').notNull().default(0),
  lastLoginDate: timestamp('last_login_date'),
  
  // Activity counts
  quizzesCompleted: integer('quizzes_completed').notNull().default(0),
  perfectScores: integer('perfect_scores').notNull().default(0),
  lecturesRead: integer('lectures_read').notNull().default(0),
  questionsReviewed: integer('questions_reviewed').notNull().default(0),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### 2. Badge System

**File:** `client/src/lib/badge-system.ts`

```typescript
interface BadgeCriteria {
  type: 'quizzes_completed' | 'perfect_scores' | 'streak' | 'lectures_read';
  value: number;
}

export function checkBadgeUnlock(
  badge: Badge,
  stats: UserGameStats
): boolean {
  const { type, value } = badge.criteria;

  switch (type) {
    case 'quizzes_completed':
      return stats.quizzesCompleted >= value;
    case 'perfect_scores':
      return stats.perfectScores >= value;
    case 'streak':
      return stats.currentStreak >= value;
    case 'lectures_read':
      return stats.lecturesRead >= value;
    default:
      return false;
  }
}

export async function awardBadge(
  userId: string,
  badgeId: string,
  tenantId: number
): Promise<void> {
  // Save to Firestore
  await storage.createUserBadge({
    userId,
    badgeId,
    tenantId,
    unlockedAt: new Date(),
  });

  // Award XP bonus
  const badge = await storage.getBadge(badgeId);
  if (badge) {
    await addXP(userId, badge.xpReward, tenantId);
  }

  // Show notification
  toast.success(`🎉 Badge Unlocked: ${badge.name}!`);
}
```

### 3. XP & Level System

**File:** `client/src/lib/xp-system.ts`

```typescript
const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 2000, 4000, 7000, 12000, 20000
];

export function calculateLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

export function getXPForNextLevel(currentXP: number): {
  current: number;
  next: number;
  progress: number;
} {
  const currentLevel = calculateLevel(currentXP);
  const currentThreshold = LEVEL_THRESHOLDS[currentLevel - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[currentLevel] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  
  const xpIntoLevel = currentXP - currentThreshold;
  const xpNeededForLevel = nextThreshold - currentThreshold;
  const progress = (xpIntoLevel / xpNeededForLevel) * 100;

  return {
    current: currentThreshold,
    next: nextThreshold,
    progress: Math.min(progress, 100),
  };
}

export async function addXP(
  userId: string,
  amount: number,
  tenantId: number
): Promise<void> {
  const stats = await storage.getUserGameStats(userId, tenantId);
  const newXP = stats.totalXP + amount;
  const oldLevel = stats.level;
  const newLevel = calculateLevel(newXP);

  await storage.updateUserGameStats(userId, {
    totalXP: newXP,
    level: newLevel,
  });

  // Check level up
  if (newLevel > oldLevel) {
    toast.success(`🎊 Level Up! You're now Level ${newLevel}!`);
  }
}
```

### 4. Achievement Tracker Hook

**File:** `client/src/hooks/use-achievements.ts`

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { storage } from '@/lib/storage-factory';
import { useAuth } from '@/lib/auth-provider';
import { useBranding } from '@/lib/branding-provider';

export function useAchievements() {
  const { user } = useAuth();
  const { currentTenantId } = useBranding();

  const statsQuery = useQuery({
    queryKey: ['gameStats', user?.id, currentTenantId],
    queryFn: () => storage.getUserGameStats(user!.id, currentTenantId),
    enabled: !!user?.id,
  });

  const badgesQuery = useQuery({
    queryKey: ['userBadges', user?.id, currentTenantId],
    queryFn: () => storage.getUserBadges(user!.id, currentTenantId),
    enabled: !!user?.id,
  });

  const addXPMutation = useMutation({
    mutationFn: (amount: number) => addXP(user!.id, amount, currentTenantId),
    onSuccess: () => {
      queryClient.invalidateQueries(['gameStats', user?.id, currentTenantId]);
    },
  });

  return {
    stats: statsQuery.data,
    badges: badgesQuery.data,
    isLoading: statsQuery.isLoading || badgesQuery.isLoading,
    addXP: addXPMutation.mutate,
  };
}
```

### 5. Level Progress Component

**File:** `client/src/components/LevelProgress.tsx`

```typescript
import { Progress } from '@/components/ui/progress';
import { useAchievements } from '@/hooks/use-achievements';

export function LevelProgress() {
  const { stats } = useAchievements();

  if (!stats) return null;

  const { current, next, progress } = getXPForNextLevel(stats.totalXP);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">Level {stats.level}</span>
          <span className="text-sm text-muted-foreground">
            {stats.totalXP} XP
          </span>
        </div>
        <span className="text-sm text-muted-foreground">
          Next: Level {stats.level + 1}
        </span>
      </div>
      
      <Progress value={progress} className="h-3" />
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{current} XP</span>
        <span>{next} XP</span>
      </div>
    </div>
  );
}
```

### 6. Badge Display Component

**File:** `client/src/components/BadgeDisplay.tsx`

```typescript
import { useAchievements } from '@/hooks/use-achievements';
import { Badge } from '@/components/ui/badge';

export function BadgeDisplay() {
  const { badges } = useAchievements();

  if (!badges) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {badges.map((userBadge) => (
        <div 
          key={userBadge.id}
          className="flex flex-col items-center p-4 bg-card rounded-lg border"
        >
          <img 
            src={userBadge.badge.iconUrl} 
            alt={userBadge.badge.name}
            className="w-16 h-16 mb-2"
          />
          <h4 className="font-semibold text-sm text-center">
            {userBadge.badge.name}
          </h4>
          <p className="text-xs text-muted-foreground text-center">
            {userBadge.badge.description}
          </p>
          <Badge variant={userBadge.badge.rarity} className="mt-2">
            {userBadge.badge.rarity}
          </Badge>
        </div>
      ))}
    </div>
  );
}
```

### 7. Streak Display Component

**File:** `client/src/components/StreakDisplay.tsx`

```typescript
import { useAchievements } from '@/hooks/use-achievements';
import { Flame } from 'lucide-react';

export function StreakDisplay() {
  const { stats } = useAchievements();

  if (!stats) return null;

  return (
    <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg">
      <Flame className="h-8 w-8" />
      <div>
        <div className="text-3xl font-bold">
          {stats.currentStreak} Days
        </div>
        <div className="text-sm opacity-90">
          Longest: {stats.longestStreak} days
        </div>
      </div>
    </div>
  );
}
```

---

## Consequences

### Positive

1. **Increased Engagement** - Gamification motivates learners
2. **Progress Visibility** - Levels and XP show advancement
3. **Achievement Recognition** - Badges reward milestones
4. **Consistent Practice** - Streaks encourage daily use
5. **Competition** - Leaderboards foster healthy rivalry
6. **Instant Feedback** - Notifications celebrate wins
7. **Long-term Motivation** - Multiple progression systems

### Negative

1. **Complexity** - Multiple systems to maintain
2. **Database Load** - Frequent XP/badge updates
3. **Notification Fatigue** - Too many alerts

### Mitigations

1. Use batch updates for XP
2. Cache stats with TanStack Query
3. Allow disabling notifications

---

## Alternatives Considered

### Alternative 1: Simple Points Only

Just track total points without levels/badges.

**Pros:** Simple, easy to implement  
**Cons:** Less engaging, no variety

**Reason for Rejection:** Insufficient motivation for long-term learning.

### Alternative 2: Third-Party Gamification Service

Use service like Gamify or Badgeville.

**Pros:** Pre-built features  
**Cons:** Cost, vendor lock-in, integration complexity

**Reason for Rejection:** Firebase integration is simpler and cheaper.

### Alternative 3: Complex Skill Trees

RPG-style skill progression trees.

**Pros:** Deep progression system  
**Cons:** Over-engineered, confusing

**Reason for Rejection:** Too complex for certification learning platform.

---

## Related Documents

- [ADR-003: Data Storage & Firestore Collections](ADR-003-data-storage-firestore-collections.md)
- [ADR-007: State Management Strategy](ADR-007-state-management.md)

---

## Code References

| File | Lines | Description |
|------|-------|-------------|
| `client/src/lib/xp-system.ts` | 1-100 | XP and level calculations |
| `client/src/lib/badge-system.ts` | 1-80 | Badge unlock logic |
| `client/src/hooks/use-achievements.ts` | 1-50 | Achievement tracking |
| `shared/schema.ts` | 300-350 | Game stats schema |

---

## Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2024-12-22 | 1.0 | CertLab Team | Initial version - gamification system |
