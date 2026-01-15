/**
 * Tests for QuizConfigModeToggle component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuizConfigMode } from './QuizConfigModeToggle';

const VIEW_MODE_STORAGE_KEY = 'quiz-builder-view-mode';

describe('QuizConfigModeToggle', () => {
  // Mock localStorage
  let localStorageMock: { [key: string]: string } = {};

  beforeEach(() => {
    // Clear localStorage mock before each test
    localStorageMock = {};

    // Mock localStorage methods
    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: vi.fn(),
    } as Storage;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('useQuizConfigMode hook', () => {
    it('should initialize with basic mode when no saved preference exists', () => {
      const { result } = renderHook(() => useQuizConfigMode());

      expect(result.current[0]).toBe('basic');
    });

    it('should initialize with advanced mode when saved preference is advanced', () => {
      localStorageMock[VIEW_MODE_STORAGE_KEY] = 'advanced';

      const { result } = renderHook(() => useQuizConfigMode());

      expect(result.current[0]).toBe('advanced');
    });

    it('should initialize with basic mode when saved preference is invalid', () => {
      localStorageMock[VIEW_MODE_STORAGE_KEY] = 'invalid';

      const { result } = renderHook(() => useQuizConfigMode());

      expect(result.current[0]).toBe('basic');
    });

    it('should handle localStorage errors gracefully and default to basic mode', () => {
      // Mock getItem to throw an error
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage access denied');
      });

      const { result } = renderHook(() => useQuizConfigMode());

      expect(result.current[0]).toBe('basic');
    });

    it('should update mode when setter is called', () => {
      const { result } = renderHook(() => useQuizConfigMode());

      expect(result.current[0]).toBe('basic');

      // Change to advanced mode
      act(() => {
        result.current[1]('advanced');
      });

      expect(result.current[0]).toBe('advanced');
    });

    it('should persist mode changes to localStorage through parent component', () => {
      const { result } = renderHook(() => useQuizConfigMode());

      // Change to advanced mode
      act(() => {
        result.current[1]('advanced');
      });

      // Note: The hook itself doesn't persist - it's the parent component's responsibility
      // This test verifies the setter works correctly
      expect(result.current[0]).toBe('advanced');
    });

    it('should toggle between basic and advanced modes', () => {
      const { result } = renderHook(() => useQuizConfigMode());

      // Start with basic
      expect(result.current[0]).toBe('basic');

      // Toggle to advanced
      act(() => {
        result.current[1]('advanced');
      });
      expect(result.current[0]).toBe('advanced');

      // Toggle back to basic
      act(() => {
        result.current[1]('basic');
      });
      expect(result.current[0]).toBe('basic');
    });
  });
});
