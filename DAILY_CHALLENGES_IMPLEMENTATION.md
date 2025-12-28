# Daily Challenges & Rewards Implementation

## Overview

This document describes the implementation of the Daily Challenges & Rewards feature with full Firestore and IndexedDB support. The feature enables persistent tracking of user quest progress, daily login rewards, and unlockable titles across both cloud (Firestore) and local (IndexedDB) storage backends.

## Architecture

### Hybrid Storage Pattern

The application uses a **hybrid storage architecture** that automatically switches between Firestore and IndexedDB:

- **Production/Firebase Mode**: When Firebase is configured, data is stored in Firestore with automatic offline caching
- **Development/Local Mode**: When Firebase is not configured, data is stored locally in IndexedDB
- **Automatic Routing**: The `storage-factory.ts` module routes all storage operations to the appropriate backend

```
Daily Challenges Page
        ↓
TanStack Query (React Query)
        ↓
Query Client (queryClient.ts)
        ↓
Storage Factory (storage-factory.ts)
        ↓
   ┌────────────────────┐
   ↓                    ↓
Firestore Storage   IndexedDB Storage
(firestore-storage.ts) (client-storage.ts)
```

## Data Models

### Quest
Represents a daily, weekly, or monthly challenge that users can complete.

```typescript
interface Quest {
  id: number;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  requirement: {
    type: 'quizzes_completed' | 'questions_answered' | 'perfect_scores' | 'study_streak';
    target: number;
    categoryId?: number; // Optional category restriction
  };
  reward: {
    points: number;
    title?: string; // Optional title unlock
    badgeId?: number; // Optional badge unlock
  };
  isActive: boolean;
  validFrom: Date;
  validUntil: Date | null; // Expiration for time-limited quests
  createdAt: Date;
}
```

### UserQuestProgress
Tracks a user's progress towards completing a specific quest.

```typescript
interface UserQuestProgress {
  id: number;
  userId: string;
  tenantId: number;
  questId: number;
  progress: number; // Current progress towards target
  isCompleted: boolean;
  completedAt: Date | null;
  rewardClaimed: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### DailyReward
Configuration for a single day's reward in the 7-day cycle.

```typescript
interface DailyReward {
  id: number;
  day: number; // Day number (1-7 for weekly cycle)
  reward: {
    points: number;
    title?: string;
    streakFreeze?: boolean; // Special reward: extra streak freeze
  };
  description: string;
}
```

### UserDailyReward
Records when a user claims a daily reward.

```typescript
interface UserDailyReward {
  id: number;
  userId: string;
  tenantId: number;
  day: number;
  claimedAt: Date;
  rewardData: any; // Copy of reward data at time of claim
}
```

### UserTitle
Represents an unlocked profile title.

```typescript
interface UserTitle {
  id: number;
  userId: string;
  tenantId: number;
  title: string; // e.g., "Quiz Master", "Streak Champion"
  description: string | null;
  unlockedAt: Date;
  source: string | null; // Where it came from: "quest", "badge", "achievement", "special"
}
```

## Storage Implementation

### Shared Interface Methods

All storage methods are defined in `shared/storage-interface.ts`:

**Quest Management (8 methods):**
- `getQuests()` - Get all quests
- `getActiveQuests()` - Get active quests (not expired)
- `getQuestsByType(type)` - Get quests by type (daily/weekly/monthly)
- `getUserQuestProgress(userId, tenantId)` - Get all user quest progress
- `getUserQuestProgressByQuest(userId, questId, tenantId)` - Get progress for specific quest
- `updateUserQuestProgress(userId, questId, progress, tenantId)` - Update quest progress
- `completeQuest(userId, questId, tenantId)` - Mark quest as completed
- `claimQuestReward(userId, questId, tenantId)` - Claim quest reward

**Daily Rewards (4 methods):**
- `getDailyRewards()` - Get all daily reward configurations
- `getUserDailyRewards(userId, tenantId)` - Get user's claimed rewards
- `hasClaimedDailyReward(userId, day)` - Check if day was claimed
- `claimDailyReward(userId, day, tenantId)` - Claim daily reward

**Title Management (3 methods):**
- `unlockTitle(userId, title, description, source, tenantId)` - Unlock a title
- `getUserTitles(userId, tenantId)` - Get user's unlocked titles
- `setSelectedTitle(userId, title)` - Set user's displayed title

### Firestore Implementation

**File**: `client/src/lib/firestore-storage.ts`

**Collections Structure:**
- `/quests` - Shared quest configurations
- `/dailyRewards` - Shared daily reward configurations
- `/users/{userId}/questProgress` - User-specific quest progress
- `/users/{userId}/dailyRewardClaims` - User-specific reward claims
- `/users/{userId}/titles` - User-specific unlocked titles

**Key Features:**
- Uses Firestore's automatic offline persistence
- Implements tenant isolation through data filtering
- Converts Firestore Timestamps to JavaScript Dates
- Handles error logging and recovery

### IndexedDB Implementation

**File**: `client/src/lib/client-storage.ts`

**Schema Version**: 7 (incremented from 6)

**New Object Stores:**

1. **quests**
   - Primary key: `id` (autoIncrement)
   - Indexes: `type`, `isActive`

2. **userQuestProgress**
   - Primary key: `id` (autoIncrement)
   - Indexes: `userId`, `tenantId`, `questId`
   - Composite indexes: `userQuest` (userId + questId), `userTenantQuest` (unique: userId + tenantId + questId)

3. **dailyRewards**
   - Primary key: `id` (autoIncrement)
   - Indexes: `day` (unique)

4. **userDailyRewards**
   - Primary key: `id` (autoIncrement)
   - Indexes: `userId`, `tenantId`, `day`
   - Composite indexes: `userDay` (userId + day), `userTenantDay` (userId + tenantId + day)

5. **userTitles**
   - Primary key: `id` (autoIncrement)
   - Indexes: `userId`, `tenantId`, `title`
   - Composite index: `userTenant` (userId + tenantId)

**Key Features:**
- Efficient indexing for common query patterns
- Tenant isolation through filtering
- Automatic ID generation for new records

## Data Seeding

**File**: `client/src/lib/seed-data.ts`

**Seed Version**: 6 (tracks whether seeding has run)

### Quest Seeding (6 quests)

**Daily Quests (2):**
1. "Daily Warm-up" - Complete 1 quiz (10 points)
2. "Answer Sprint" - Answer 20 questions correctly (15 points)

**Weekly Quests (3):**
1. "Weekly Warrior" - Complete 5 quizzes (50 points + title)
2. "Perfect Practice" - Get 3 perfect scores (75 points + title)
3. "Study Streak" - Study 5 days in a row (100 points)

**Monthly Quests (1):**
1. "Monthly Master" - Complete 20 quizzes (200 points + title)

### Daily Reward Seeding (7-day cycle)

| Day | Points | Special Reward |
|-----|--------|----------------|
| 1   | 5      | -              |
| 2   | 10     | -              |
| 3   | 15     | -              |
| 4   | 20     | -              |
| 5   | 25     | -              |
| 6   | 30     | -              |
| 7   | 50     | Streak Freeze  |

The cycle resets after day 7, and day 7 grants a bonus "Streak Freeze" that can protect the user's study streak.

## UI Integration

### Daily Challenges Page

**File**: `client/src/pages/daily-challenges.tsx`

**Route**: `/app/daily-challenges`

**Features:**
- **Daily Login Rewards Section**: Displays 7-day reward cycle with current day highlighted
- **Quest Tabs**: Daily, Weekly, Monthly quest views
- **Progress Tracking**: Visual progress bars showing quest completion
- **Reward Claiming**: One-click reward claiming with celebration effects

**Queries Used:**
```typescript
// Get active quests
useQuery({
  queryKey: queryKeys.quests.active(),
  enabled: !!currentUser
});

// Get daily rewards configuration
useQuery({
  queryKey: queryKeys.dailyRewards.all(),
  enabled: !!currentUser
});

// Get user's reward claims
useQuery({
  queryKey: queryKeys.dailyRewards.userClaims(currentUser?.id),
  enabled: !!currentUser
});

// Get user game stats (for consecutive login days)
useQuery({
  queryKey: queryKeys.user.stats(currentUser?.id),
  enabled: !!currentUser
});
```

**Mutations:**
```typescript
// Claim daily reward
useMutation({
  mutationFn: (day: number) => 
    gamificationService.claimDailyReward(userId, day, tenantId),
  onSuccess: () => {
    triggerCelebration('reward');
    toast({ title: '🎁 Reward Claimed!' });
    // Invalidate queries to refresh UI
    queryClient.invalidateQueries(queryKeys.dailyRewards.userClaims(userId));
    queryClient.invalidateQueries(queryKeys.user.all(userId));
  }
});

// Claim quest reward
useMutation({
  mutationFn: (questId: number) =>
    gamificationService.claimQuestReward(userId, questId, tenantId),
  onSuccess: () => {
    triggerCelebration('quest');
    toast({ title: '✨ Quest Reward Claimed!' });
    // Invalidate queries to refresh UI
    queryClient.invalidateQueries(queryKeys.userQuestProgress.all(userId));
    queryClient.invalidateQueries(queryKeys.user.all(userId));
  }
});
```

### Gamification Service

**File**: `client/src/lib/gamification-service.ts`

**Key Methods:**

1. **processQuestUpdates(userId, quiz, tenantId)**
   - Called after quiz completion
   - Updates quest progress for all active quests
   - Completes quests that meet their targets
   - Unlocks titles and awards points

2. **claimQuestReward(userId, questId, tenantId)**
   - Marks quest reward as claimed
   - Awards points to user
   - Returns quest details

3. **processDailyLogin(userId, tenantId)**
   - Called when user logs in or app loads
   - Checks if user already logged in today
   - Calculates consecutive login days
   - Returns whether to show reward prompt

4. **claimDailyReward(userId, day, tenantId)**
   - Claims the daily reward for specified day
   - Updates user points
   - Grants streak freeze if applicable
   - Creates claim record

5. **calculateConsecutiveDays(gameStats)**
   - Determines consecutive login days
   - Resets if gap > 1 day
   - Increments on consecutive days

## Query Key Structure

**File**: `client/src/lib/queryClient.ts`

```typescript
// Quest queries
queryKeys.quests.all() // All quests
queryKeys.quests.active() // Active quests only
queryKeys.quests.byType(type) // Quests by type

// User quest progress
queryKeys.userQuestProgress.all(userId) // All user quest progress
queryKeys.userQuestProgress.byQuest(userId, questId) // Specific quest progress

// Daily rewards
queryKeys.dailyRewards.all() // All daily reward configs
queryKeys.dailyRewards.userClaims(userId) // User's claimed rewards

// User titles
queryKeys.userTitles.all(userId) // User's unlocked titles
```

## Testing

### Build Verification

```bash
# Type check (must pass with 0 errors)
npm run check

# Production build (must succeed)
npm run build

# Dev server (should start on port 5000 or 5001)
npm run dev
```

### Verification Steps

1. **Data Seeding**: Check console for "Seeding quests..." and "Seeding daily rewards..." messages
2. **Quest Loading**: Navigate to `/app/daily-challenges` and verify quests display
3. **Daily Rewards**: Verify 7-day reward grid displays with current day highlighted
4. **Progress Tracking**: Complete a quiz and verify quest progress updates
5. **Reward Claiming**: Click "Claim Today's Reward" and verify points awarded
6. **Quest Completion**: Complete quest requirements and verify reward can be claimed

### Edge Cases to Test

1. **Missed Days**: 
   - User doesn't log in for multiple days
   - Consecutive login days should reset to 1
   - Daily reward cycle should start over

2. **Reset Cycles**:
   - Complete full 7-day reward cycle
   - Verify cycle resets to day 1 on day 8

3. **Quest Expiration**:
   - Daily quests should reset daily
   - Weekly quests should reset weekly
   - Monthly quests should reset monthly

4. **Concurrent Updates**:
   - Multiple quest progress updates in quick succession
   - Verify all progress is tracked correctly

5. **Tenant Isolation**:
   - Users in different tenants should not see each other's progress
   - Rewards should be isolated by tenant

## Security Considerations

1. **Firestore Security Rules** (to be implemented):
   ```
   match /users/{userId}/questProgress/{progressId} {
     allow read, write: if request.auth.uid == userId;
   }
   
   match /users/{userId}/dailyRewardClaims/{claimId} {
     allow read, write: if request.auth.uid == userId;
   }
   
   match /users/{userId}/titles/{titleId} {
     allow read, write: if request.auth.uid == userId;
   }
   
   match /quests/{questId} {
     allow read: if request.auth != null;
     allow write: if request.auth.token.role == 'admin';
   }
   
   match /dailyRewards/{rewardId} {
     allow read: if request.auth != null;
     allow write: if request.auth.token.role == 'admin';
   }
   ```

2. **Validation**:
   - Quest progress cannot exceed target
   - Daily rewards can only be claimed once per day
   - Reward claiming requires quest completion
   - Title unlocking is controlled by server-side logic

3. **Rate Limiting** (to be implemented):
   - Limit quest progress updates to prevent abuse
   - Throttle reward claiming attempts
   - Monitor for suspicious patterns

## Future Enhancements

1. **Quest Templates**: Create reusable quest templates for easy quest creation
2. **Dynamic Rewards**: Adjust rewards based on user level or progress
3. **Leaderboards**: Show top quest completers and streak maintainers
4. **Social Features**: Share quest completions and reward claims
5. **Push Notifications**: Remind users to claim daily rewards
6. **Quest Chains**: Unlock new quests by completing prerequisites
7. **Seasonal Events**: Time-limited special quests with unique rewards
8. **Custom Quests**: Allow admins to create tenant-specific quests

## Troubleshooting

### Quest Progress Not Updating

**Symptom**: Quest progress doesn't update after quiz completion

**Possible Causes**:
1. Quest requirement type doesn't match quiz activity
2. TanStack Query cache is stale
3. Storage operation failed silently

**Solutions**:
1. Check quest requirement type matches activity (e.g., 'quizzes_completed')
2. Force refetch: `queryClient.invalidateQueries(queryKeys.userQuestProgress.all(userId))`
3. Check browser console for error logs
4. Verify IndexedDB stores exist and have data

### Daily Rewards Not Displaying

**Symptom**: Daily reward grid is empty or shows loading state

**Possible Causes**:
1. Seed data not loaded
2. Query error or loading state
3. User not authenticated

**Solutions**:
1. Check console for "Seeding daily rewards..." message
2. Check browser DevTools → Application → IndexedDB → certlab → dailyRewards
3. Verify user is logged in and `currentUser` is not null
4. Check TanStack Query DevTools for query state

### Reward Already Claimed Error

**Symptom**: User cannot claim reward even though button is enabled

**Possible Causes**:
1. Race condition in state updates
2. Cached query data is stale
3. Claim record already exists in database

**Solutions**:
1. Add debouncing to claim button
2. Disable button immediately after click
3. Check userDailyRewards store for existing claim
4. Clear IndexedDB and re-seed data if necessary

## Performance Considerations

1. **Query Caching**: TanStack Query caches results for 30 seconds (configurable)
2. **Index Optimization**: Composite indexes speed up common query patterns
3. **Lazy Loading**: Quest page components are lazy-loaded for faster initial page load
4. **Offline Support**: Firestore SDK provides automatic offline caching
5. **Batch Updates**: Consider batching multiple quest progress updates

## Conclusion

The Daily Challenges & Rewards feature is fully implemented with robust Firestore and IndexedDB support. The architecture provides flexibility for both cloud and local storage, ensuring the feature works in all deployment scenarios. The implementation follows CertLab's existing patterns and integrates seamlessly with the gamification system.

Key achievements:
- ✅ 15 new storage methods implemented
- ✅ 5 new IndexedDB stores with optimized indexes
- ✅ Full Firestore integration ready for deployment
- ✅ Comprehensive quest and reward system
- ✅ Automated data seeding
- ✅ UI integration with TanStack Query
- ✅ TypeScript type safety throughout
- ✅ Production build verified

The feature is ready for deployment with Firebase credentials and comprehensive testing with real user scenarios.
