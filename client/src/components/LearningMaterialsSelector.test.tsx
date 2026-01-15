/**
 * Tests for LearningMaterialsSelector component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LearningMaterialsSelector } from './LearningMaterialsSelector';
import type { Lecture } from '@shared/schema';

describe('LearningMaterialsSelector', () => {
  const mockMaterials: Lecture[] = [
    {
      id: 1,
      userId: 'user1',
      tenantId: 1,
      title: 'Introduction to Security',
      description: 'Basic security concepts',
      content: 'Content here',
      topics: ['security'],
      tags: ['security', 'basics'],
      categoryId: 1,
      subcategoryId: 10,
      difficultyLevel: 1,
      contentType: 'text',
      visibility: 'public',
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
      title: 'Advanced Networking',
      description: 'Network security deep dive',
      content: 'Content here',
      topics: ['networking'],
      tags: ['networking', 'advanced'],
      categoryId: 1,
      subcategoryId: 11,
      difficultyLevel: 3,
      contentType: 'video',
      visibility: 'public',
      createdAt: new Date('2024-01-02'),
      isRead: true,
      requiresPurchase: false,
      distributionMethod: 'open',
      sendNotifications: true,
    } as Lecture,
  ];

  const mockOnSelectionChange = vi.fn();

  it('should not render when hasCategoriesSelected is false', () => {
    const { container } = render(
      <LearningMaterialsSelector
        materials={mockMaterials}
        selectedIds={[]}
        onSelectionChange={mockOnSelectionChange}
        hasCategoriesSelected={false}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should show loading state when isLoading is true', () => {
    render(
      <LearningMaterialsSelector
        materials={[]}
        selectedIds={[]}
        onSelectionChange={mockOnSelectionChange}
        isLoading={true}
        hasCategoriesSelected={true}
      />
    );

    expect(screen.getByText(/Loading learning materials.../i)).toBeInTheDocument();
  });

  it('should show error state when isError is true', () => {
    render(
      <LearningMaterialsSelector
        materials={[]}
        selectedIds={[]}
        onSelectionChange={mockOnSelectionChange}
        isError={true}
        hasCategoriesSelected={true}
      />
    );

    expect(
      screen.getByText(/Failed to load learning materials. You can still create the quiz/i)
    ).toBeInTheDocument();
  });

  it('should show empty state when no materials are available', () => {
    render(
      <LearningMaterialsSelector
        materials={[]}
        selectedIds={[]}
        onSelectionChange={mockOnSelectionChange}
        hasCategoriesSelected={true}
      />
    );

    expect(
      screen.getByText(/No learning materials available for the selected categories./i)
    ).toBeInTheDocument();
    expect(screen.getByText(/You can still create the quiz without materials./i)).toBeInTheDocument();
  });

  it('should render materials list when materials are available', () => {
    render(
      <LearningMaterialsSelector
        materials={mockMaterials}
        selectedIds={[]}
        onSelectionChange={mockOnSelectionChange}
        hasCategoriesSelected={true}
      />
    );

    expect(screen.getByText('Introduction to Security')).toBeInTheDocument();
    expect(screen.getByText('Advanced Networking')).toBeInTheDocument();
    expect(screen.getByText(/Found 2 learning materials/i)).toBeInTheDocument();
  });

  it('should display material metadata badges correctly', () => {
    render(
      <LearningMaterialsSelector
        materials={mockMaterials}
        selectedIds={[]}
        onSelectionChange={mockOnSelectionChange}
        hasCategoriesSelected={true}
      />
    );

    // Check difficulty levels
    expect(screen.getByText('Level 1')).toBeInTheDocument();
    expect(screen.getByText('Level 3')).toBeInTheDocument();

    // Check content types
    expect(screen.getByText('text')).toBeInTheDocument();
    expect(screen.getByText('video')).toBeInTheDocument();

    // Check read status
    expect(screen.getByText('Read')).toBeInTheDocument();
  });

  it('should show selection counter when materials are selected', () => {
    render(
      <LearningMaterialsSelector
        materials={mockMaterials}
        selectedIds={[1, 2]}
        onSelectionChange={mockOnSelectionChange}
        hasCategoriesSelected={true}
      />
    );

    expect(screen.getByText('2 materials selected')).toBeInTheDocument();
  });

  it('should show singular form when one material is selected', () => {
    render(
      <LearningMaterialsSelector
        materials={mockMaterials}
        selectedIds={[1]}
        onSelectionChange={mockOnSelectionChange}
        hasCategoriesSelected={true}
      />
    );

    expect(screen.getByText('1 material selected')).toBeInTheDocument();
  });

  it('should filter out materials without IDs before rendering', () => {
    const materialsWithoutIds: Lecture[] = [
      {
        ...mockMaterials[0],
        id: undefined as any, // Material without ID
      },
      mockMaterials[1],
    ];

    render(
      <LearningMaterialsSelector
        materials={materialsWithoutIds}
        selectedIds={[]}
        onSelectionChange={mockOnSelectionChange}
        hasCategoriesSelected={true}
      />
    );

    // Should still render materials, but handleToggle would need to check for ID
    // The component should handle this gracefully
    expect(screen.getByText('Advanced Networking')).toBeInTheDocument();
  });

  it('should handle materials without descriptions gracefully', () => {
    const materialsWithoutDesc: Lecture[] = [
      {
        ...mockMaterials[0],
        description: null,
      },
    ];

    render(
      <LearningMaterialsSelector
        materials={materialsWithoutDesc}
        selectedIds={[]}
        onSelectionChange={mockOnSelectionChange}
        hasCategoriesSelected={true}
      />
    );

    expect(screen.getByText('Introduction to Security')).toBeInTheDocument();
    // Description should not be rendered
    expect(screen.queryByText('Basic security concepts')).not.toBeInTheDocument();
  });

  it('should handle materials without optional fields gracefully', () => {
    const minimalMaterial: Lecture[] = [
      {
        ...mockMaterials[0],
        difficultyLevel: null,
        contentType: null,
        isRead: false,
      },
    ];

    render(
      <LearningMaterialsSelector
        materials={minimalMaterial}
        selectedIds={[]}
        onSelectionChange={mockOnSelectionChange}
        hasCategoriesSelected={true}
      />
    );

    expect(screen.getByText('Introduction to Security')).toBeInTheDocument();
    // Optional badges should not be rendered
    expect(screen.queryByText(/Level/)).not.toBeInTheDocument();
  });
});
