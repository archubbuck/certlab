import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DraggableList } from './DraggableList';

describe('DraggableList', () => {
  const mockItems = [
    { id: '1', text: 'Item 1' },
    { id: '2', text: 'Item 2' },
    { id: '3', text: 'Item 3' },
  ];

  const mockOnReorder = vi.fn();

  it('renders all items', () => {
    render(
      <DraggableList
        items={mockItems}
        onReorder={mockOnReorder}
        renderItem={(item) => <div>{item.text}</div>}
      />
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('renders drag handles for each item', () => {
    render(
      <DraggableList
        items={mockItems}
        onReorder={mockOnReorder}
        renderItem={(item) => <div>{item.text}</div>}
      />
    );

    const dragHandles = screen.getAllByLabelText('Drag to reorder');
    expect(dragHandles).toHaveLength(3);
  });

  it('does not render drag handles when disabled', () => {
    render(
      <DraggableList
        items={mockItems}
        onReorder={mockOnReorder}
        renderItem={(item) => <div>{item.text}</div>}
        disabled={true}
      />
    );

    const dragHandles = screen.queryAllByLabelText('Drag to reorder');
    expect(dragHandles).toHaveLength(0);
  });

  it('renders with custom className', () => {
    const { container } = render(
      <DraggableList
        items={mockItems}
        onReorder={mockOnReorder}
        renderItem={(item) => <div>{item.text}</div>}
        className="custom-class"
      />
    );

    const list = container.querySelector('.custom-class');
    expect(list).toBeInTheDocument();
  });

  it('renders with ARIA labels for accessibility', () => {
    render(
      <DraggableList
        items={mockItems}
        onReorder={mockOnReorder}
        renderItem={(item) => <div>{item.text}</div>}
      />
    );

    const list = screen.getByRole('list');
    expect(list).toHaveAttribute(
      'aria-label',
      'Reorderable list. Use arrow keys to navigate and space to pick up or drop items.'
    );
  });

  it('passes correct index to renderItem', () => {
    const renderItem = vi.fn((item, index) => (
      <div>
        {item.text} - {index}
      </div>
    ));

    render(<DraggableList items={mockItems} onReorder={mockOnReorder} renderItem={renderItem} />);

    expect(screen.getByText('Item 1 - 0')).toBeInTheDocument();
    expect(screen.getByText('Item 2 - 1')).toBeInTheDocument();
    expect(screen.getByText('Item 3 - 2')).toBeInTheDocument();
  });
});
