# Daily Challenges & Rewards - Firestore Implementation

## Overview

This document describes the Firestore data structure and implementation for the Daily Challenges & Rewards system in CertLab.

## Firestore Collections

### Shared Collections (Top-Level)

These collections contain shared content accessible to all users:

#### `quests`
Defines available quests (daily, weekly, monthly challenges).

**Document Structure:**
```typescript
{
  id: number,
  title: string,
  description: string,
  type: 'daily' | 'weekly' | 'monthly' | 'special',
  requirement: {
    type: 'quizzes_completed' | 'questions_answered' | 'perfect_scores' | 'study_streak',
    target: number,
    categoryId?: number, // Optional category restriction
  },
  reward: {
    points: number,
    title?: string,        // Optional title unlock
    badgeId?: number,      // Optional badge unlock
  },
  isActive: boolean,
  validFrom: Date,
  validUntil: Date | null, // null = no expiration
  createdAt: Date,
}
```

**Document ID:** String representation of numeric ID (e.g., "1", "2", "3")

**Examples:**
- Quest #1: Complete 3 quizzes today (daily, 50 points)
- Quest #4: Complete 20 quizzes this week (weekly, 250 points + "Study Warrior" title)
- Quest #7: Complete 100 quizzes this month (monthly, 1000 points + "Quiz Master" title)

#### `dailyRewards`
Defines the 7-day daily login reward cycle.

**Document Structure:**
```typescript
{
  id: number,
  day: number,           // 1-7 for weekly cycle
  reward: {
    points: number,
    title?: string,
    streakFreeze?: boolean, // Day 7 grants a streak freeze
  },
  description: string,
}
```

**Document ID:** String representation of numeric ID (e.g., "1", "2", "7")

**Examples:**
- Day 1: 10 points
- Day 7: 50 points + streak freeze

### Per-User Subcollections

These subcollections are stored under `/users/{userId}/` and contain user-specific data:

#### `questProgress`
Tracks user's progress on each quest they've interacted with.

**Path:** `/users/{userId}/questProgress/{questId}`

**Document Structure:**
```typescript
{
  id: number,
  userId: string,
  tenantId: number,
  questId: number,
  progress: number,           // Current progress towards target
  isCompleted: boolean,
  completedAt: Date | null,
  rewardClaimed: boolean,
  createdAt: Date,
  updatedAt: Date,
}
```

**Document ID:** String representation of questId (e.g., "1", "4", "7")

**Lifecycle:**
1. Created when user makes first progress on a quest
2. Updated as user progresses
3. `isCompleted` set to true when `progress >= requirement.target`
4. `rewardClaimed` set to true when user claims the reward

#### `dailyRewardClaims`
Records which daily rewards the user has claimed.

**Path:** `/users/{userId}/dailyRewardClaims/{claimId}`

**Document Structure:**
```typescript
{
  id: number,
  userId: string,
  tenantId: number,
  day: number,              // Which day of the 7-day cycle
  claimedAt: Date,
  rewardData: {
    points: number,
    streakFreeze?: boolean,
  },
}
```

**Document ID:** Timestamp-based unique ID (e.g., "1703721234567")

**Notes:**
- One claim per day per user (enforced by application logic)
- Used to check if user has already claimed reward for a specific day
- 7-day cycle resets based on `consecutiveLoginDays % 7`

#### `titles`
Stores titles unlocked by the user (from quests, achievements, etc.).

**Path:** `/users/{userId}/titles/{titleId}`

**Document Structure:**
```typescript
{
  id: number,
  userId: string,
  tenantId: number,
  title: string,            // e.g., "Quiz Master", "Streak Champion"
  description: string,
  source: string,           // 'quest', 'badge', 'achievement', 'special'
  unlockedAt: Date,
}
```

**Document ID:** Timestamp-based unique ID (e.g., "1703721234567")

**Notes:**
- Multiple titles can be unlocked by a user
- Current selected title is stored in `userGameStats.selectedTitle`

### Modified Collections

#### `userGameStats`
Extended to support daily login tracking and selected titles.

**Path:** `/users/{userId}/gameStats`

**New/Modified Fields:**
```typescript
{
  lastLoginDate: Date,              // Last login date (used for streak tracking)
  consecutiveLoginDays: number,     // Number of consecutive days logged in
  selectedTitle: string | null,     // Currently selected/displayed title
  // ... existing fields
}
```

## Implementation Status

### ✅ Completed

1. **Firestore Storage Methods**
   - ✅ `getQuests()` - Get all quests
   - ✅ `getActiveQuests()` - Get active (non-expired) quests
   - ✅ `getQuestsByType(type)` - Filter quests by type
   - ✅ `getUserQuestProgress(userId, tenantId)` - Get all user quest progress
   - ✅ `getUserQuestProgressByQuest(userId, questId, tenantId)` - Get specific quest progress
   - ✅ `updateUserQuestProgress(userId, questId, progress, tenantId)` - Update progress
   - ✅ `completeQuest(userId, questId, tenantId)` - Mark quest complete
   - ✅ `claimQuestReward(userId, questId, tenantId)` - Claim quest reward
   - ✅ `getDailyRewards()` - Get all daily rewards
   - ✅ `getUserDailyRewards(userId, tenantId)` - Get user's claims
   - ✅ `hasClaimedDailyReward(userId, day)` - Check if claimed
   - ✅ `claimDailyReward(userId, day, tenantId)` - Claim daily reward
   - ✅ `unlockTitle(userId, title, description, source, tenantId)` - Unlock title
   - ✅ `getUserTitles(userId, tenantId)` - Get user's titles
   - ✅ `setSelectedTitle(userId, title)` - Set selected title

2. **Query Client Integration**
   - ✅ Query keys for quests, daily rewards, quest progress
   - ✅ Route handlers in `getQueryFn`
   - ✅ Proper caching and invalidation

3. **UI Components**
   - ✅ Daily Challenges page exists (`/client/src/pages/daily-challenges.tsx`)
   - ✅ Uses gamification service for business logic
   - ✅ Displays daily/weekly/monthly quests
   - ✅ Shows 7-day reward cycle with claim button

### 🔄 Pending

1. **Data Seeding**
   - 🔄 Run seed script to populate Firestore
   - 🔄 Verify data in Firebase Console
   - 🔄 Test with real user accounts

2. **Testing**
   - 🔄 Test quest progress tracking
   - 🔄 Test daily reward claims
   - 🔄 Test 7-day cycle reset logic
   - 🔄 Test edge cases (missed days, expired quests)
   - 🔄 UI consistency validation

3. **Documentation**
   - 🔄 Admin seeding instructions
   - 🔄 Firestore security rules (if needed)

## Seeding Data

### Prerequisites

1. **Firebase Admin SDK Service Account**
   - Download service account key from Firebase Console
   - Go to Project Settings > Service Accounts > Generate New Private Key
   - Save as `firebase-service-account.json` (DO NOT commit to git)

2. **Set Environment Variable**
   ```bash
   export FIREBASE_SERVICE_ACCOUNT_KEY="$(cat firebase-service-account.json)"
   ```

### Running the Seed Script

```bash
# Install dependencies (if not already installed)
npm install firebase-admin

# Run the seed script
npx tsx scripts/seed-gamification-data.ts
```

**Expected Output:**
```
Starting gamification data seeding...

Seeding quests...
✓ Seeded 9 quests
Seeding daily rewards...
✓ Seeded 7 daily rewards

✓ All gamification data seeded successfully!

Summary:
  - 3 daily quests
  - 3 weekly quests
  - 3 monthly quests
  - 7 daily rewards (7-day cycle)
```

### Verifying Data

Check Firebase Console:
1. Go to Firestore Database
2. Verify collections:
   - `quests` should have 9 documents
   - `dailyRewards` should have 7 documents

## Security Rules

Add these rules to your `firestore.rules` file:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Shared content - read-only for authenticated users
    match /quests/{questId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.role == 'admin';
    }
    
    match /dailyRewards/{rewardId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.role == 'admin';
    }
    
    // Per-user data
    match /users/{userId} {
      // Quest progress
      match /questProgress/{questId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Daily reward claims
      match /dailyRewardClaims/{claimId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Titles
      match /titles/{titleId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## Usage Examples

### Checking User's Quest Progress

```typescript
import { storage } from '@/lib/storage-factory';

// Get all active quests
const activeQuests = await storage.getActiveQuests();

// Get user's progress for each quest
const userId = currentUser.id;
const tenantId = currentUser.tenantId;

for (const quest of activeQuests) {
  const progress = await storage.getUserQuestProgressByQuest(userId, quest.id, tenantId);
  console.log(`Quest "${quest.title}": ${progress?.progress || 0}/${quest.requirement.target}`);
}
```

### Claiming Daily Reward

```typescript
import { gamificationService } from '@/lib/gamification-service';

// Process daily login (checks if user should receive reward)
const loginResult = await gamificationService.processDailyLogin(userId, tenantId);

if (loginResult.shouldShowReward) {
  // Show reward UI, let user click claim button
  // On claim:
  const result = await gamificationService.claimDailyReward(userId, loginResult.day, tenantId);
  console.log(`Claimed ${result.pointsEarned} points!`);
}
```

### Updating Quest Progress After Quiz

```typescript
import { gamificationService } from '@/lib/gamification-service';

// After quiz completion
const result = await gamificationService.processQuestUpdates(userId, quiz, tenantId);

if (result.completedQuests.length > 0) {
  console.log(`Completed ${result.completedQuests.length} quests!`);
  console.log(`Earned ${result.pointsEarned} points`);
  
  if (result.titlesUnlocked.length > 0) {
    console.log(`Unlocked titles: ${result.titlesUnlocked.join(', ')}`);
  }
}
```

## Troubleshooting

### Issue: "Firestore is not initialized"
**Solution:** Ensure Firebase is configured with valid credentials. Check `VITE_FIREBASE_*` environment variables.

### Issue: "Permission denied" when reading quests
**Solution:** 
1. User must be authenticated
2. Check Firestore security rules
3. Verify user's authentication token

### Issue: Daily reward already claimed
**Solution:** This is expected behavior. The 7-day cycle resets based on consecutive login days. Check `userGameStats.consecutiveLoginDays`.

### Issue: Quest progress not updating
**Solution:**
1. Verify `gamificationService.processQuestUpdates()` is called after quiz completion
2. Check that quest requirement type matches the user action
3. Verify quest is active and not expired

## Future Enhancements

1. **Automatic Quest Reset**
   - Cloud function to reset daily/weekly/monthly quests
   - Schedule based on quest type

2. **Quest Expiration**
   - Automatic deactivation of expired quests
   - Notification when quest is about to expire

3. **Dynamic Quest Generation**
   - AI-generated personalized quests
   - Based on user's weak areas and goals

4. **Leaderboards**
   - Track quest completion across users
   - Monthly/weekly top performers

5. **Quest Chains**
   - Multi-step quests that unlock progressively
   - Story-based quest progression
