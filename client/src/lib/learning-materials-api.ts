/**
 * Learning Materials API
 *
 * Provides access to learning materials (lectures) for quiz creation and study.
 * This API abstracts the storage layer and provides filtering, search, and access control
 * for learning materials based on user permissions and content metadata.
 *
 * @module learning-materials-api
 */

import { storage } from './storage-factory';
import type { Lecture, User } from '@shared/schema';

/**
 * Filter options for learning materials queries
 */
export interface LearningMaterialsFilters {
  /** Filter by specific category IDs */
  categoryIds?: number[];
  /** Filter by specific subcategory IDs */
  subcategoryIds?: number[];
  /** Filter by difficulty level (1-5) */
  difficultyLevel?: number;
  /** Filter by minimum difficulty level */
  minDifficulty?: number;
  /** Filter by maximum difficulty level */
  maxDifficulty?: number;
  /** Filter by tags (any match) */
  tags?: string[];
  /** Filter by content type */
  contentType?: 'text' | 'video' | 'pdf' | 'interactive' | 'code';
  /** Filter by visibility level */
  visibility?: 'private' | 'shared' | 'public';
  /** Include only read materials */
  isRead?: boolean;
  /** Search text to match in title or description */
  searchText?: string;
  /** Limit results */
  limit?: number;
}

/**
 * Learning material with metadata for quiz creation
 */
export interface LearningMaterialForQuiz extends Lecture {
  /** Whether the material is accessible by the current user */
  isAccessible: boolean;
  /** Reason for lack of access (if not accessible) */
  accessReason?: string;
}

/**
 * Result of learning materials query
 */
export interface LearningMaterialsResult {
  /** Array of learning materials */
  materials: LearningMaterialForQuiz[];
  /** Total count before pagination */
  totalCount: number;
  /** Whether more results are available */
  hasMore: boolean;
}

/**
 * Get all accessible learning materials for a user
 *
 * @param userId - User ID to fetch materials for
 * @param tenantId - Optional tenant ID for multi-tenancy
 * @param filters - Optional filters to apply
 * @returns Promise resolving to learning materials result
 *
 * @example
 * ```typescript
 * const result = await getAccessibleLearningMaterials('user123', 1, {
 *   categoryIds: [1, 2],
 *   difficultyLevel: 3,
 *   tags: ['security', 'networking']
 * });
 * ```
 */
export async function getAccessibleLearningMaterials(
  userId: string,
  tenantId?: number,
  filters?: LearningMaterialsFilters
): Promise<LearningMaterialsResult> {
  try {
    // Fetch user's lectures from storage
    const materials = await storage.getUserLectures(userId, tenantId);

    // Apply access control - check if materials are accessible
    const materialsWithAccess: LearningMaterialForQuiz[] = materials.map((material) => {
      const isAccessible = checkMaterialAccess(material, userId);
      return {
        ...material,
        isAccessible,
        accessReason: isAccessible ? undefined : getAccessReason(material),
      };
    });

    // Apply filters
    let filteredMaterials = materialsWithAccess;

    if (filters) {
      filteredMaterials = applyFilters(filteredMaterials, filters);
    }

    // Sort by creation date (newest first)
    filteredMaterials.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    const totalCount = filteredMaterials.length;
    const limit = filters?.limit;
    const hasMore = limit ? totalCount > limit : false;

    // Apply limit if specified
    if (limit && limit > 0) {
      filteredMaterials = filteredMaterials.slice(0, limit);
    }

    return {
      materials: filteredMaterials,
      totalCount,
      hasMore,
    };
  } catch (error) {
    console.error('Error fetching learning materials:', error);
    throw new Error('Failed to fetch learning materials');
  }
}

/**
 * Get learning materials by specific IDs
 *
 * @param userId - User ID
 * @param materialIds - Array of material IDs to fetch
 * @returns Promise resolving to array of materials
 */
export async function getLearningMaterialsByIds(
  userId: string,
  materialIds: number[]
): Promise<Lecture[]> {
  try {
    const allMaterials = await storage.getUserLectures(userId);
    return allMaterials.filter((material) => material.id && materialIds.includes(material.id));
  } catch (error) {
    console.error('Error fetching learning materials by IDs:', error);
    return [];
  }
}

/**
 * Get learning materials grouped by category
 *
 * @param userId - User ID
 * @param tenantId - Optional tenant ID
 * @returns Promise resolving to materials grouped by category ID
 */
export async function getLearningMaterialsByCategory(
  userId: string,
  tenantId?: number
): Promise<Map<number, Lecture[]>> {
  try {
    const result = await getAccessibleLearningMaterials(userId, tenantId);
    const grouped = new Map<number, Lecture[]>();

    result.materials.forEach((material) => {
      if (!material.isAccessible) return;

      const categoryId = material.categoryId;
      if (!grouped.has(categoryId)) {
        grouped.set(categoryId, []);
      }
      grouped.get(categoryId)!.push(material);
    });

    return grouped;
  } catch (error) {
    console.error('Error grouping learning materials by category:', error);
    return new Map();
  }
}

/**
 * Search learning materials by text query
 *
 * @param userId - User ID
 * @param query - Search query
 * @param tenantId - Optional tenant ID
 * @returns Promise resolving to matching materials
 */
export async function searchLearningMaterials(
  userId: string,
  query: string,
  tenantId?: number
): Promise<Lecture[]> {
  try {
    const result = await getAccessibleLearningMaterials(userId, tenantId, {
      searchText: query,
    });
    return result.materials.filter((m) => m.isAccessible);
  } catch (error) {
    console.error('Error searching learning materials:', error);
    return [];
  }
}

/**
 * Check if a material is accessible by the user
 *
 * @param material - Learning material to check
 * @param userId - User ID
 * @returns True if accessible, false otherwise
 */
function checkMaterialAccess(material: Lecture, userId: string): boolean {
  // Check if requires purchase first (blocks access regardless of visibility)
  if (material.requiresPurchase && material.purchaseProductId) {
    // TODO: Check if user has purchased the product
    // For now, we'll return false for unpurchased materials
    // Exception: owner can always access their own content
    if (material.userId !== userId) {
      return false;
    }
  }

  // Check availability dates
  const now = new Date();
  if (material.availableFrom && new Date(material.availableFrom) > now) {
    return false;
  }
  if (material.availableUntil && new Date(material.availableUntil) < now) {
    return false;
  }

  // User's own materials are always accessible
  if (material.userId === userId) {
    return true;
  }

  // Check visibility settings
  if (material.visibility === 'public') {
    return true;
  }

  if (material.visibility === 'shared') {
    // Check if user is in shared list
    if (material.sharedWithUsers && material.sharedWithUsers.includes(userId)) {
      return true;
    }
  }

  // Private materials are only accessible by owner
  return false;
}

/**
 * Get reason for lack of access to a material
 *
 * @param material - Learning material
 * @returns Human-readable access reason
 */
function getAccessReason(material: Lecture): string {
  const now = new Date();

  if (material.requiresPurchase) {
    return 'Purchase required';
  }

  if (material.availableFrom && new Date(material.availableFrom) > now) {
    return `Available from ${new Date(material.availableFrom).toLocaleDateString()}`;
  }

  if (material.availableUntil && new Date(material.availableUntil) < now) {
    return 'No longer available';
  }

  if (material.visibility === 'private') {
    return 'Private content';
  }

  return 'Access restricted';
}

/**
 * Apply filters to learning materials
 *
 * @param materials - Array of materials to filter
 * @param filters - Filters to apply
 * @returns Filtered array of materials
 */
function applyFilters(
  materials: LearningMaterialForQuiz[],
  filters: LearningMaterialsFilters
): LearningMaterialForQuiz[] {
  let filtered = materials;

  // Filter by category IDs
  if (filters.categoryIds && filters.categoryIds.length > 0) {
    filtered = filtered.filter((m) => filters.categoryIds!.includes(m.categoryId));
  }

  // Filter by subcategory IDs
  if (filters.subcategoryIds && filters.subcategoryIds.length > 0) {
    filtered = filtered.filter(
      (m) => m.subcategoryId && filters.subcategoryIds!.includes(m.subcategoryId)
    );
  }

  // Filter by difficulty level (exact match)
  if (filters.difficultyLevel !== undefined) {
    filtered = filtered.filter((m) => m.difficultyLevel === filters.difficultyLevel);
  }

  // Filter by minimum difficulty
  if (filters.minDifficulty !== undefined) {
    filtered = filtered.filter(
      (m) =>
        m.difficultyLevel !== undefined &&
        m.difficultyLevel !== null &&
        m.difficultyLevel >= filters.minDifficulty!
    );
  }

  // Filter by maximum difficulty
  if (filters.maxDifficulty !== undefined) {
    filtered = filtered.filter(
      (m) =>
        m.difficultyLevel !== undefined &&
        m.difficultyLevel !== null &&
        m.difficultyLevel <= filters.maxDifficulty!
    );
  }

  // Filter by tags (any match)
  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter((m) => {
      if (!m.tags || m.tags.length === 0) return false;
      return filters.tags!.some((tag) => m.tags!.includes(tag));
    });
  }

  // Filter by content type
  if (filters.contentType) {
    filtered = filtered.filter((m) => m.contentType === filters.contentType);
  }

  // Filter by visibility
  if (filters.visibility) {
    filtered = filtered.filter((m) => m.visibility === filters.visibility);
  }

  // Filter by read status
  if (filters.isRead !== undefined) {
    filtered = filtered.filter((m) => m.isRead === filters.isRead);
  }

  // Filter by search text
  if (filters.searchText && filters.searchText.trim()) {
    const searchLower = filters.searchText.toLowerCase().trim();
    filtered = filtered.filter((m) => {
      const titleMatch = m.title?.toLowerCase().includes(searchLower);
      const descriptionMatch = m.description?.toLowerCase().includes(searchLower);
      const tagsMatch = m.tags?.some((tag) => tag.toLowerCase().includes(searchLower));
      return titleMatch || descriptionMatch || tagsMatch;
    });
  }

  return filtered;
}

/**
 * Get unique tags from learning materials
 *
 * @param materials - Array of materials
 * @returns Array of unique tags
 */
export function getUniqueTags(materials: Lecture[]): string[] {
  const tagSet = new Set<string>();
  materials.forEach((material) => {
    if (material.tags) {
      material.tags.forEach((tag) => tagSet.add(tag));
    }
  });
  return Array.from(tagSet).sort();
}

/**
 * Get unique content types from learning materials
 *
 * @param materials - Array of materials
 * @returns Array of unique content types
 */
export function getUniqueContentTypes(materials: Lecture[]): string[] {
  const typeSet = new Set<string>();
  materials.forEach((material) => {
    if (material.contentType) {
      typeSet.add(material.contentType);
    }
  });
  return Array.from(typeSet).sort();
}

/**
 * Get statistics about learning materials
 *
 * @param materials - Array of materials
 * @returns Statistics object
 */
export function getLearningMaterialsStats(materials: Lecture[]) {
  return {
    total: materials.length,
    byContentType: materials.reduce(
      (acc, m) => {
        const type = m.contentType || 'text';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
    byDifficulty: materials.reduce(
      (acc, m) => {
        const level = m.difficultyLevel || 1;
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>
    ),
    readCount: materials.filter((m) => m.isRead).length,
    unreadCount: materials.filter((m) => !m.isRead).length,
  };
}
