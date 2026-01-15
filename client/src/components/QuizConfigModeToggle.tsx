/**
 * Quiz Configuration Mode Toggle Component
 *
 * Provides a toggle switch to change between basic and advanced configuration modes
 * with localStorage persistence for user preference.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const VIEW_MODE_STORAGE_KEY = 'quiz-builder-view-mode';

export interface QuizConfigModeToggleProps {
  /** Current view mode */
  mode: 'basic' | 'advanced';
  /** Callback when mode changes */
  onModeChange: (mode: 'basic' | 'advanced') => void;
}

/**
 * QuizConfigModeToggle component
 *
 * Displays a toggle switch to switch between basic and advanced configuration modes.
 * Note: This component does NOT persist to localStorage - that's handled by the parent
 * using useQuizConfigMode hook to avoid duplicate persistence logic.
 *
 * @example
 * ```tsx
 * <QuizConfigModeToggle
 *   mode={viewMode}
 *   onModeChange={setViewMode}
 * />
 * ```
 */
export function QuizConfigModeToggle({ mode, onModeChange }: QuizConfigModeToggleProps) {
  const isAdvanced = mode === 'advanced';

  const handleToggle = (checked: boolean) => {
    onModeChange(checked ? 'advanced' : 'basic');
  };

  return (
    <Card className="bg-muted/30">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-semibold mb-1">Configuration Mode</h3>
            <p className="text-xs text-muted-foreground">
              {isAdvanced
                ? 'Advanced mode with all options and granular controls'
                : 'Basic mode with essential quiz settings only'}
            </p>
          </div>
          <div className="flex items-center gap-3 ml-4">
            <Label htmlFor="view-mode-toggle" className="text-sm">
              {isAdvanced ? 'Advanced' : 'Basic'}
            </Label>
            <Switch id="view-mode-toggle" checked={isAdvanced} onCheckedChange={handleToggle} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Hook to get and manage quiz configuration view mode
 *
 * Handles localStorage persistence and avoids SSR hydration mismatches by
 * reading from localStorage after mount.
 *
 * @returns Current mode and setter function
 *
 * @example
 * ```tsx
 * const [viewMode, setViewMode] = useQuizConfigMode();
 * ```
 */
export function useQuizConfigMode(): ['basic' | 'advanced', (mode: 'basic' | 'advanced') => void] {
  // Initialize with default value only; read localStorage after mount
  const [mode, setMode] = useState<'basic' | 'advanced'>('basic');
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved preference from localStorage on client after mount
  useEffect(() => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        setIsInitialized(true);
        return;
      }
      const saved = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      if (saved === 'advanced') {
        setMode('advanced');
      }
    } catch (error) {
      console.error('Failed to load view mode preference:', error);
      // Ignore errors and keep default 'basic' mode
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Persist mode changes to localStorage
  useEffect(() => {
    if (!isInitialized) return; // Don't persist until initial load is complete

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
      }
    } catch (error) {
      console.error('Failed to save view mode preference:', error);
    }
  }, [mode, isInitialized]);

  return [mode, setMode];
}
