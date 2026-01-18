/**
 * Unit tests for achievement-service.ts
 *
 * Tests achievement unlocking, badge management, and progression logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { achievementService } from './achievement-service';

// Mock storage
const mockStorage = {
  getUserBadges: vi.fn(),
  getBadges: vi.fn(),
  awardBadge: vi.fn(),
  getUserGameStats: vi.fn(),
  updateUserGameStats: vi.fn(),
};

vi.mock('./storage-factory', () => ({
  storage: mockStorage,
}));

describe('Achievement Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkAchievements', () => {
    it('should check for new achievements after quiz completion', async () => {
      const userId = 1;
      const context = {
        quizCompleted: true,
        score: 95,
        perfectScore: true,
      };

      mockStorage.getUserBadges.mockResolvedValue([]);
      mockStorage.getBadges.mockResolvedValue([
        {
          id: 1,
          name: 'Perfect Score',
          description: 'Score 100% on a quiz',
          icon: '🎯',
          condition: 'perfect_score',
          points: 50,
        },
      ]);

      await achievementService.checkAchievements(userId, context);

      expect(mockStorage.getUserBadges).toHaveBeenCalledWith(userId);
      expect(mockStorage.getBadges).toHaveBeenCalled();
    });

    it('should not award duplicate badges', async () => {
      const userId = 1;
      const context = {
        quizCompleted: true,
        score: 100,
      };

      mockStorage.getUserBadges.mockResolvedValue([
        {
          userId: 1,
          badgeId: 1,
          earnedAt: '2024-01-01',
          notified: true,
        },
      ]);
      mockStorage.getBadges.mockResolvedValue([
        {
          id: 1,
          name: 'First Quiz',
          description: 'Complete your first quiz',
          icon: '🎓',
          condition: 'first_quiz',
          points: 10,
        },
      ]);

      await achievementService.checkAchievements(userId, context);

      // Should not award badge again
      expect(mockStorage.awardBadge).not.toHaveBeenCalled();
    });

    it('should award badge for first quiz completion', async () => {
      const userId = 1;
      const context = {
        quizCompleted: true,
        isFirstQuiz: true,
      };

      mockStorage.getUserBadges.mockResolvedValue([]);
      mockStorage.getBadges.mockResolvedValue([
        {
          id: 1,
          name: 'First Quiz',
          description: 'Complete your first quiz',
          icon: '🎓',
          condition: 'first_quiz',
          points: 10,
        },
      ]);

      await achievementService.checkAchievements(userId, context);

      expect(mockStorage.awardBadge).toHaveBeenCalledWith(userId, 1);
    });

    it('should award badge for streak milestone', async () => {
      const userId = 1;
      const context = {
        streak: 7,
      };

      mockStorage.getUserBadges.mockResolvedValue([]);
      mockStorage.getBadges.mockResolvedValue([
        {
          id: 2,
          name: 'Week Warrior',
          description: 'Maintain a 7-day streak',
          icon: '🔥',
          condition: 'streak_7',
          points: 25,
        },
      ]);

      await achievementService.checkAchievements(userId, context);

      expect(mockStorage.awardBadge).toHaveBeenCalledWith(userId, 2);
    });

    it('should handle errors gracefully', async () => {
      const userId = 1;
      const context = { quizCompleted: true };

      mockStorage.getUserBadges.mockRejectedValue(new Error('Database error'));

      // Should not throw
      await expect(achievementService.checkAchievements(userId, context)).resolves.toBeUndefined();
    });
  });

  describe('getUnlockProgress', () => {
    it('should calculate progress towards next achievement', async () => {
      const userId = 1;
      const badgeId = 1;

      mockStorage.getUserGameStats.mockResolvedValue({
        quizzesCompleted: 5,
        perfectScores: 2,
        streak: 3,
      });

      mockStorage.getBadges.mockResolvedValue([
        {
          id: badgeId,
          name: 'Quiz Master',
          description: 'Complete 10 quizzes',
          icon: '👑',
          condition: 'quizzes_10',
          points: 50,
        },
      ]);

      const progress = await achievementService.getUnlockProgress(userId, badgeId);

      expect(progress).toBeDefined();
      expect(progress.current).toBe(5);
      expect(progress.target).toBe(10);
      expect(progress.percentage).toBe(50);
    });

    it('should return 100% for already earned badges', async () => {
      const userId = 1;
      const badgeId = 1;

      mockStorage.getUserBadges.mockResolvedValue([
        {
          userId: 1,
          badgeId: 1,
          earnedAt: '2024-01-01',
          notified: true,
        },
      ]);

      const progress = await achievementService.getUnlockProgress(userId, badgeId);

      expect(progress.percentage).toBe(100);
      expect(progress.unlocked).toBe(true);
    });
  });

  describe('getNextAchievements', () => {
    it('should return closest achievements to unlock', async () => {
      const userId = 1;

      mockStorage.getUserBadges.mockResolvedValue([]);
      mockStorage.getBadges.mockResolvedValue([
        {
          id: 1,
          name: 'Beginner',
          description: 'Complete 5 quizzes',
          icon: '🎯',
          condition: 'quizzes_5',
          points: 10,
        },
        {
          id: 2,
          name: 'Intermediate',
          description: 'Complete 10 quizzes',
          icon: '🎓',
          condition: 'quizzes_10',
          points: 25,
        },
        {
          id: 3,
          name: 'Expert',
          description: 'Complete 50 quizzes',
          icon: '👑',
          condition: 'quizzes_50',
          points: 100,
        },
      ]);

      mockStorage.getUserGameStats.mockResolvedValue({
        quizzesCompleted: 3,
        perfectScores: 0,
        streak: 1,
      });

      const nextAchievements = await achievementService.getNextAchievements(userId, 3);

      expect(nextAchievements).toHaveLength(3);
      // Should be sorted by proximity to unlock
      expect(nextAchievements[0].id).toBe(1); // Closest to unlocking
    });

    it('should exclude already earned badges', async () => {
      const userId = 1;

      mockStorage.getUserBadges.mockResolvedValue([
        {
          userId: 1,
          badgeId: 1,
          earnedAt: '2024-01-01',
          notified: true,
        },
      ]);

      mockStorage.getBadges.mockResolvedValue([
        {
          id: 1,
          name: 'First Quiz',
          description: 'Complete your first quiz',
          icon: '🎓',
          condition: 'first_quiz',
          points: 10,
        },
        {
          id: 2,
          name: 'Quiz Master',
          description: 'Complete 10 quizzes',
          icon: '👑',
          condition: 'quizzes_10',
          points: 50,
        },
      ]);

      mockStorage.getUserGameStats.mockResolvedValue({
        quizzesCompleted: 1,
        perfectScores: 0,
        streak: 1,
      });

      const nextAchievements = await achievementService.getNextAchievements(userId, 5);

      // Should only include unearned badges
      expect(nextAchievements).not.toContainEqual(expect.objectContaining({ id: 1 }));
    });
  });

  describe('calculateTotalPoints', () => {
    it('should sum points from all earned badges', async () => {
      const userId = 1;

      mockStorage.getUserBadges.mockResolvedValue([
        {
          userId: 1,
          badgeId: 1,
          earnedAt: '2024-01-01',
          notified: true,
        },
        {
          userId: 1,
          badgeId: 2,
          earnedAt: '2024-01-02',
          notified: true,
        },
        {
          userId: 1,
          badgeId: 3,
          earnedAt: '2024-01-03',
          notified: true,
        },
      ]);

      mockStorage.getBadges.mockResolvedValue([
        {
          id: 1,
          name: 'Badge 1',
          description: 'Test',
          icon: '🎯',
          condition: 'test',
          points: 10,
        },
        {
          id: 2,
          name: 'Badge 2',
          description: 'Test',
          icon: '🎓',
          condition: 'test',
          points: 25,
        },
        {
          id: 3,
          name: 'Badge 3',
          description: 'Test',
          icon: '👑',
          condition: 'test',
          points: 50,
        },
      ]);

      const totalPoints = await achievementService.calculateTotalPoints(userId);

      expect(totalPoints).toBe(85); // 10 + 25 + 50
    });

    it('should return 0 when no badges are earned', async () => {
      const userId = 1;

      mockStorage.getUserBadges.mockResolvedValue([]);
      mockStorage.getBadges.mockResolvedValue([]);

      const totalPoints = await achievementService.calculateTotalPoints(userId);

      expect(totalPoints).toBe(0);
    });
  });

  describe('getAchievementStats', () => {
    it('should return achievement statistics', async () => {
      const userId = 1;

      mockStorage.getUserBadges.mockResolvedValue([
        {
          userId: 1,
          badgeId: 1,
          earnedAt: '2024-01-01',
          notified: true,
        },
        {
          userId: 1,
          badgeId: 2,
          earnedAt: '2024-01-02',
          notified: true,
        },
      ]);

      mockStorage.getBadges.mockResolvedValue([
        {
          id: 1,
          name: 'Badge 1',
          description: 'Test',
          icon: '🎯',
          condition: 'test',
          points: 10,
          rarity: 'common',
        },
        {
          id: 2,
          name: 'Badge 2',
          description: 'Test',
          icon: '🎓',
          condition: 'test',
          points: 25,
          rarity: 'rare',
        },
        {
          id: 3,
          name: 'Badge 3',
          description: 'Test',
          icon: '👑',
          condition: 'test',
          points: 50,
          rarity: 'legendary',
        },
      ]);

      const stats = await achievementService.getAchievementStats(userId);

      expect(stats.totalEarned).toBe(2);
      expect(stats.totalAvailable).toBe(3);
      expect(stats.completionRate).toBeCloseTo(66.67, 1);
      expect(stats.totalPoints).toBe(35); // 10 + 25
    });

    it('should categorize badges by rarity', async () => {
      const userId = 1;

      mockStorage.getUserBadges.mockResolvedValue([
        {
          userId: 1,
          badgeId: 1,
          earnedAt: '2024-01-01',
          notified: true,
        },
      ]);

      mockStorage.getBadges.mockResolvedValue([
        {
          id: 1,
          name: 'Common Badge',
          description: 'Test',
          icon: '🎯',
          condition: 'test',
          points: 10,
          rarity: 'common',
        },
        {
          id: 2,
          name: 'Rare Badge',
          description: 'Test',
          icon: '🎓',
          condition: 'test',
          points: 50,
          rarity: 'rare',
        },
        {
          id: 3,
          name: 'Legendary Badge',
          description: 'Test',
          icon: '👑',
          condition: 'test',
          points: 100,
          rarity: 'legendary',
        },
      ]);

      const stats = await achievementService.getAchievementStats(userId);

      expect(stats.byRarity).toBeDefined();
      expect(stats.byRarity.common).toBe(1);
      expect(stats.byRarity.rare).toBe(0);
      expect(stats.byRarity.legendary).toBe(0);
    });
  });
});
