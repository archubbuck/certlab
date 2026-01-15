/**
 * Tests for Learning Materials API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAccessibleLearningMaterials,
  getLearningMaterialsByIds,
  getLearningMaterialsByCategory,
  searchLearningMaterials,
  getUniqueTags,
  getUniqueContentTypes,
  getLearningMaterialsStats,
  type LearningMaterialsFilters,
} from './learning-materials-api';
import type { Lecture } from '@shared/schema';

// Mock storage
vi.mock('./storage-factory', () => ({
  storage: {
    getUserLectures: vi.fn(),
  },
}));

import { storage } from './storage-factory';

describe('Learning Materials API', () => {
  // Sample test data
  const mockLectures: Partial<Lecture>[] = [
    {
      id: 1,
      userId: 'user1',
      tenantId: 1,
      title: 'Introduction to CISSP Security',
      description: 'Basic security concepts',
      content: 'Content here',
      topics: ['security', 'basics'],
      tags: ['security', 'cissp', 'beginner'],
      categoryId: 1,
      subcategoryId: 10,
      difficultyLevel: 1,
      author: 'user1',
      authorName: 'Test Author',
      contentType: 'text',
      visibility: 'private',
      createdAt: new Date('2024-01-01'),
      isRead: false,
      requiresPurchase: false,
      distributionMethod: 'open',
      sendNotifications: true,
    } as Lecture,
    {
      id: 2,
      userId: 'user1',
      tenantId: 1,
      title: 'Advanced Network Security',
      description: 'Network security deep dive',
      content: 'Content here',
      topics: ['networking', 'security'],
      tags: ['networking', 'security', 'advanced'],
      categoryId: 1,
      subcategoryId: 11,
      difficultyLevel: 3,
      author: 'user1',
      authorName: 'Test Author',
      contentType: 'video',
      visibility: 'public',
      createdAt: new Date('2024-01-02'),
      isRead: true,
      requiresPurchase: false,
      distributionMethod: 'open',
      sendNotifications: true,
    },
    {
      id: 3,
      userId: 'user1',
      tenantId: 1,
      title: 'Cryptography Fundamentals',
      description: 'Introduction to cryptography',
      content: 'Content here',
      topics: ['cryptography'],
      tags: ['cryptography', 'encryption', 'intermediate'],
      categoryId: 2,
      subcategoryId: 20,
      difficultyLevel: 2,
      author: 'user1',
      authorName: 'Test Author',
      contentType: 'pdf',
      visibility: 'shared',
      sharedWithUsers: ['user1', 'user2'],
      createdAt: new Date('2024-01-03'),
      isRead: false,
      requiresPurchase: false,
      distributionMethod: 'open',
      sendNotifications: true,
    },
    {
      id: 4,
      userId: 'user2',
      tenantId: 1,
      title: 'Premium Security Course',
      description: 'Premium content',
      content: 'Content here',
      topics: ['security'],
      tags: ['security', 'premium'],
      categoryId: 1,
      subcategoryId: 10,
      difficultyLevel: 4,
      author: 'user2',
      authorName: 'Other Author',
      contentType: 'interactive',
      visibility: 'public',
      createdAt: new Date('2024-01-04'),
      isRead: false,
      requiresPurchase: true,
      purchaseProductId: 'product-123',
      distributionMethod: 'open',
      sendNotifications: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAccessibleLearningMaterials', () => {
    it('should return all accessible materials for a user', async () => {
      vi.mocked(storage.getUserLectures).mockResolvedValue(mockLectures);

      const result = await getAccessibleLearningMaterials('user1', 1);

      expect(result.materials).toHaveLength(4);
      expect(result.totalCount).toBe(4);
      expect(result.hasMore).toBe(false);
    });

    it('should filter materials by category IDs', async () => {
      vi.mocked(storage.getUserLectures).mockResolvedValue(mockLectures);

      const filters: LearningMaterialsFilters = {
        categoryIds: [1],
      };

      const result = await getAccessibleLearningMaterials('user1', 1, filters);

      expect(result.materials).toHaveLength(3);
      expect(result.materials.every((m) => m.categoryId === 1)).toBe(true);
    });

    it('should filter materials by subcategory IDs', async () => {
      vi.mocked(storage.getUserLectures).mockResolvedValue(mockLectures);

      const filters: LearningMaterialsFilters = {
        subcategoryIds: [10],
      };

      const result = await getAccessibleLearningMaterials('user1', 1, filters);

      expect(result.materials).toHaveLength(2);
      expect(result.materials.every((m) => m.subcategoryId === 10)).toBe(true);
    });

    it('should filter materials by difficulty level', async () => {
      vi.mocked(storage.getUserLectures).mockResolvedValue(mockLectures);

      const filters: LearningMaterialsFilters = {
        difficultyLevel: 3,
      };

      const result = await getAccessibleLearningMaterials('user1', 1, filters);

      expect(result.materials).toHaveLength(1);
      expect(result.materials[0].difficultyLevel).toBe(3);
    });

    it('should filter materials by min and max difficulty', async () => {
      vi.mocked(storage.getUserLectures).mockResolvedValue(mockLectures);

      const filters: LearningMaterialsFilters = {
        minDifficulty: 2,
        maxDifficulty: 3,
      };

      const result = await getAccessibleLearningMaterials('user1', 1, filters);

      expect(result.materials).toHaveLength(2);
      expect(
        result.materials.every((m) => m.difficultyLevel! >= 2 && m.difficultyLevel! <= 3)
      ).toBe(true);
    });

    it('should filter materials by tags', async () => {
      vi.mocked(storage.getUserLectures).mockResolvedValue(mockLectures);

      const filters: LearningMaterialsFilters = {
        tags: ['cryptography'],
      };

      const result = await getAccessibleLearningMaterials('user1', 1, filters);

      expect(result.materials).toHaveLength(1);
      expect(result.materials[0].tags).toContain('cryptography');
    });

    it('should filter materials by content type', async () => {
      vi.mocked(storage.getUserLectures).mockResolvedValue(mockLectures);

      const filters: LearningMaterialsFilters = {
        contentType: 'video',
      };

      const result = await getAccessibleLearningMaterials('user1', 1, filters);

      expect(result.materials).toHaveLength(1);
      expect(result.materials[0].contentType).toBe('video');
    });

    it('should filter materials by read status', async () => {
      vi.mocked(storage.getUserLectures).mockResolvedValue(mockLectures);

      const filters: LearningMaterialsFilters = {
        isRead: true,
      };

      const result = await getAccessibleLearningMaterials('user1', 1, filters);

      expect(result.materials).toHaveLength(1);
      expect(result.materials[0].isRead).toBe(true);
    });

    it('should filter materials by search text', async () => {
      vi.mocked(storage.getUserLectures).mockResolvedValue(mockLectures);

      const filters: LearningMaterialsFilters = {
        searchText: 'cryptography',
      };

      const result = await getAccessibleLearningMaterials('user1', 1, filters);

      expect(result.materials).toHaveLength(1);
      expect(result.materials[0].title).toContain('Cryptography');
    });

    it('should apply limit to results', async () => {
      vi.mocked(storage.getUserLectures).mockResolvedValue(mockLectures);

      const filters: LearningMaterialsFilters = {
        limit: 2,
      };

      const result = await getAccessibleLearningMaterials('user1', 1, filters);

      expect(result.materials).toHaveLength(2);
      expect(result.totalCount).toBe(4);
      expect(result.hasMore).toBe(true);
    });

    it('should mark materials with access control correctly', async () => {
      vi.mocked(storage.getUserLectures).mockResolvedValue(mockLectures);

      const result = await getAccessibleLearningMaterials('user1', 1);

      // Materials are sorted newest first: 4, 3, 2, 1
      // Material 4 is public but requires purchase - not accessible
      const material4 = result.materials.find((m) => m.id === 4);
      expect(material4?.isAccessible).toBe(false);
      expect(material4?.accessReason).toBe('Purchase required');

      // Material 3 is shared with user1 - accessible
      const material3 = result.materials.find((m) => m.id === 3);
      expect(material3?.isAccessible).toBe(true);

      // Material 2 is owned by user1 - accessible
      const material2 = result.materials.find((m) => m.id === 2);
      expect(material2?.isAccessible).toBe(true);

      // Material 1 is owned by user1 - accessible
      const material1 = result.materials.find((m) => m.id === 1);
      expect(material1?.isAccessible).toBe(true);
    });

    it('should sort materials by creation date (newest first)', async () => {
      vi.mocked(storage.getUserLectures).mockResolvedValue(mockLectures);

      const result = await getAccessibleLearningMaterials('user1', 1);

      // Verify materials are sorted newest first
      for (let i = 0; i < result.materials.length - 1; i++) {
        const current = new Date(result.materials[i].createdAt!).getTime();
        const next = new Date(result.materials[i + 1].createdAt!).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });
  });

  describe('getLearningMaterialsByIds', () => {
    it('should return materials with specific IDs', async () => {
      vi.mocked(storage.getUserLectures).mockResolvedValue(mockLectures);

      const result = await getLearningMaterialsByIds('user1', [1, 3]);

      expect(result).toHaveLength(2);
      expect(result.map((m) => m.id)).toEqual([1, 3]);
    });

    it('should return empty array for non-existent IDs', async () => {
      vi.mocked(storage.getUserLectures).mockResolvedValue(mockLectures);

      const result = await getLearningMaterialsByIds('user1', [999, 888]);

      expect(result).toHaveLength(0);
    });
  });

  describe('getLearningMaterialsByCategory', () => {
    it('should group materials by category', async () => {
      vi.mocked(storage.getUserLectures).mockResolvedValue(mockLectures);

      const result = await getLearningMaterialsByCategory('user1', 1);

      expect(result.size).toBe(2);
      // Category 1: materials 1, 2 (owned by user1), and 4 (not accessible due to purchase)
      // Only accessible ones are counted (1 and 2)
      expect(result.get(1)).toHaveLength(2);
      // Category 2: material 3 (shared with user1)
      expect(result.get(2)).toHaveLength(1);
    });
  });

  describe('searchLearningMaterials', () => {
    it('should search materials by query text', async () => {
      vi.mocked(storage.getUserLectures).mockResolvedValue(mockLectures);

      const result = await searchLearningMaterials('user1', 'security');

      expect(result.length).toBeGreaterThan(0);
      expect(
        result.every(
          (m) =>
            m.title.toLowerCase().includes('security') ||
            m.description?.toLowerCase().includes('security') ||
            m.tags?.some((t) => t.toLowerCase().includes('security'))
        )
      ).toBe(true);
    });
  });

  describe('getUniqueTags', () => {
    it('should return unique tags from materials', () => {
      const tags = getUniqueTags(mockLectures as Lecture[]);

      expect(tags).toContain('security');
      expect(tags).toContain('networking');
      expect(tags).toContain('cryptography');
      expect(new Set(tags).size).toBe(tags.length); // All unique
    });
  });

  describe('getUniqueContentTypes', () => {
    it('should return unique content types from materials', () => {
      const types = getUniqueContentTypes(mockLectures as Lecture[]);

      expect(types).toContain('text');
      expect(types).toContain('video');
      expect(types).toContain('pdf');
      expect(types).toContain('interactive');
      expect(new Set(types).size).toBe(types.length); // All unique
    });
  });

  describe('getLearningMaterialsStats', () => {
    it('should return statistics about materials', () => {
      const stats = getLearningMaterialsStats(mockLectures as Lecture[]);

      expect(stats.total).toBe(4);
      expect(stats.byContentType).toEqual({
        text: 1,
        video: 1,
        pdf: 1,
        interactive: 1,
      });
      expect(stats.byDifficulty).toEqual({
        1: 1,
        2: 1,
        3: 1,
        4: 1,
      });
      expect(stats.readCount).toBe(1);
      expect(stats.unreadCount).toBe(3);
    });
  });
});
