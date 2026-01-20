import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Textarea } from './textarea';

describe('Textarea component snapshots', () => {
  it('renders Textarea with default props', () => {
    const { container } = render(<Textarea />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders Textarea with placeholder', () => {
    const { container } = render(<Textarea placeholder="Enter your text..." />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders disabled Textarea', () => {
    const { container } = render(<Textarea disabled placeholder="Disabled textarea" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders Textarea with custom className', () => {
    const { container } = render(<Textarea className="custom-textarea" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders Textarea with rows', () => {
    const { container } = render(<Textarea rows={5} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
