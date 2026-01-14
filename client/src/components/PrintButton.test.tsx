import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PrintButton from './PrintButton';

describe('PrintButton', () => {
  let printSpy: ReturnType<typeof vi.spyOn>;
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    printSpy.mockRestore();
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  describe('rendering', () => {
    it('should render with default props', () => {
      render(<PrintButton />);
      const button = screen.getByRole('button', { name: /print page/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Print');
    });

    it('should render with custom label', () => {
      render(<PrintButton label="Print Results" content="results" />);
      const button = screen.getByRole('button', { name: /print results/i });
      expect(button).toHaveTextContent('Print Results');
    });

    it('should render icon only when iconOnly is true', () => {
      render(<PrintButton iconOnly label="Print" />);
      const button = screen.getByRole('button');
      expect(button).not.toHaveTextContent('Print');
      // Icon should still be present
      const icon = button.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<PrintButton className="custom-class" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should render with different variants', () => {
      const { rerender } = render(<PrintButton variant="default" />);
      let button = screen.getByRole('button');
      expect(button).toBeInTheDocument();

      rerender(<PrintButton variant="outline" />);
      button = screen.getByRole('button');
      expect(button).toBeInTheDocument();

      rerender(<PrintButton variant="secondary" />);
      button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should render with different sizes', () => {
      const { rerender } = render(<PrintButton size="sm" />);
      let button = screen.getByRole('button');
      expect(button).toBeInTheDocument();

      rerender(<PrintButton size="default" />);
      button = screen.getByRole('button');
      expect(button).toBeInTheDocument();

      rerender(<PrintButton size="lg" />);
      button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should set data-content attribute when content prop is provided', () => {
      render(<PrintButton content="quiz" />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-content', 'quiz');
    });
  });

  describe('print functionality', () => {
    it('should call window.print when clicked', async () => {
      const user = userEvent.setup();
      render(<PrintButton />);
      const button = screen.getByRole('button');

      await user.click(button);

      expect(printSpy).toHaveBeenCalledTimes(1);
    });

    it('should call onBeforePrint callback before printing', async () => {
      const user = userEvent.setup();
      const onBeforePrint = vi.fn();
      render(<PrintButton onBeforePrint={onBeforePrint} />);
      const button = screen.getByRole('button');

      await user.click(button);

      expect(onBeforePrint).toHaveBeenCalledTimes(1);
      expect(onBeforePrint).toHaveBeenCalledBefore(printSpy);
    });

    it('should set up afterprint event listener when onAfterPrint is provided', async () => {
      const user = userEvent.setup();
      const onAfterPrint = vi.fn();
      render(<PrintButton onAfterPrint={onAfterPrint} />);
      const button = screen.getByRole('button');

      await user.click(button);

      expect(addEventListenerSpy).toHaveBeenCalledWith('afterprint', expect.any(Function));
      expect(printSpy).toHaveBeenCalledTimes(1);
    });

    it('should call onAfterPrint when afterprint event fires', async () => {
      const user = userEvent.setup();
      const onAfterPrint = vi.fn();
      render(<PrintButton onAfterPrint={onAfterPrint} />);
      const button = screen.getByRole('button');

      await user.click(button);

      // Get the afterprint handler that was registered
      const afterPrintHandler = addEventListenerSpy.mock.calls.find(
        (call: any) => call[0] === 'afterprint'
      )?.[1] as EventListener;

      expect(afterPrintHandler).toBeDefined();

      // Simulate the afterprint event
      afterPrintHandler(new Event('afterprint'));

      expect(onAfterPrint).toHaveBeenCalledTimes(1);
    });

    it('should remove afterprint event listener after callback executes', async () => {
      const user = userEvent.setup();
      const onAfterPrint = vi.fn();
      render(<PrintButton onAfterPrint={onAfterPrint} />);
      const button = screen.getByRole('button');

      await user.click(button);

      // Get the afterprint handler
      const afterPrintHandler = addEventListenerSpy.mock.calls.find(
        (call: any) => call[0] === 'afterprint'
      )?.[1] as EventListener;

      // Simulate the afterprint event
      afterPrintHandler(new Event('afterprint'));

      expect(removeEventListenerSpy).toHaveBeenCalledWith('afterprint', afterPrintHandler);
    });

    it('should not set up afterprint listener when onAfterPrint is not provided', async () => {
      const user = userEvent.setup();
      render(<PrintButton />);
      const button = screen.getByRole('button');

      await user.click(button);

      expect(addEventListenerSpy).not.toHaveBeenCalledWith('afterprint', expect.any(Function));
    });
  });

  describe('accessibility', () => {
    it('should have proper aria-label with content type', () => {
      render(<PrintButton content="results" />);
      const button = screen.getByRole('button', { name: /print results/i });
      expect(button).toHaveAttribute('aria-label', 'Print results');
    });

    it('should have proper aria-label without content type', () => {
      render(<PrintButton />);
      const button = screen.getByRole('button', { name: /print page/i });
      expect(button).toHaveAttribute('aria-label', 'Print page');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<PrintButton />);
      const button = screen.getByRole('button');

      button.focus();
      expect(button).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(printSpy).toHaveBeenCalledTimes(1);
    });
  });
});
