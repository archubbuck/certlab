import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetadataDisplay, MetadataDisplayCompact } from './MetadataDisplay';

describe('MetadataDisplay', () => {
  it('renders nothing when no metadata is provided', () => {
    const { container } = render(<MetadataDisplay />);
    expect(container.firstChild).toBeNull();
  });

  it('renders difficulty badge correctly', () => {
    render(<MetadataDisplay difficultyLevel={1} />);
    expect(screen.getByText('Beginner')).toBeInTheDocument();
  });

  it('renders all difficulty levels correctly', () => {
    const difficulties = [
      { level: 1, label: 'Beginner' },
      { level: 2, label: 'Intermediate' },
      { level: 3, label: 'Advanced' },
      { level: 4, label: 'Expert' },
      { level: 5, label: 'Master' },
    ];

    difficulties.forEach(({ level, label }) => {
      const { unmount } = render(<MetadataDisplay difficultyLevel={level} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    });
  });

  it('renders author name correctly', () => {
    render(<MetadataDisplay authorName="John Doe" />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders created date correctly', () => {
    const createdAt = new Date('2024-01-01');
    render(<MetadataDisplay createdAt={createdAt} />);
    // Check that some date text is present (exact text depends on relative time)
    expect(screen.getByText(/Created/)).toBeInTheDocument();
  });

  it('renders updated date instead of created date when both are present', () => {
    const createdAt = new Date('2024-01-01');
    const updatedAt = new Date('2024-01-15');
    render(<MetadataDisplay createdAt={createdAt} updatedAt={updatedAt} />);
    expect(screen.getByText(/Updated/)).toBeInTheDocument();
    expect(screen.queryByText(/Created/)).not.toBeInTheDocument();
  });

  it('renders tags correctly', () => {
    const tags = ['security', 'networking', 'cissp'];
    render(<MetadataDisplay tags={tags} />);
    tags.forEach((tag) => {
      expect(screen.getByText(tag)).toBeInTheDocument();
    });
  });

  it('limits tags display to 5 in normal mode', () => {
    const tags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7'];
    render(<MetadataDisplay tags={tags} />);
    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag5')).toBeInTheDocument();
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('limits tags display to 3 in compact mode', () => {
    const tags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'];
    render(<MetadataDisplayCompact tags={tags} />);
    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag3')).toBeInTheDocument();
    expect(screen.getByText('+2 more')).toBeInTheDocument();
    expect(screen.queryByText('tag4')).not.toBeInTheDocument();
  });

  it('renders multiple metadata fields together', () => {
    const tags = ['security', 'cissp'];
    const createdAt = new Date('2024-01-01');
    render(
      <MetadataDisplay
        tags={tags}
        difficultyLevel={3}
        authorName="Jane Smith"
        createdAt={createdAt}
      />
    );
    expect(screen.getByText('Advanced')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('security')).toBeInTheDocument();
    expect(screen.getByText('cissp')).toBeInTheDocument();
    expect(screen.getByText(/Created/)).toBeInTheDocument();
  });

  it('handles null tags array', () => {
    const { container } = render(<MetadataDisplay tags={null} difficultyLevel={1} />);
    expect(container).toBeInTheDocument();
    expect(screen.getByText('Beginner')).toBeInTheDocument();
  });

  it('handles empty tags array', () => {
    const { container } = render(<MetadataDisplay tags={[]} difficultyLevel={2} />);
    expect(container).toBeInTheDocument();
    expect(screen.getByText('Intermediate')).toBeInTheDocument();
  });

  it('ignores invalid difficulty levels', () => {
    render(<MetadataDisplay difficultyLevel={0} />);
    // Should not render any difficulty badge text
    expect(
      screen.queryByText(/Beginner|Intermediate|Advanced|Expert|Master/)
    ).not.toBeInTheDocument();
  });

  it('ignores difficulty levels above 5', () => {
    render(<MetadataDisplay difficultyLevel={6} />);
    // Should not render any difficulty badge text
    expect(
      screen.queryByText(/Beginner|Intermediate|Advanced|Expert|Master/)
    ).not.toBeInTheDocument();
  });
});
