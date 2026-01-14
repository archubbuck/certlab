import { createContext, useContext, useEffect, useState } from 'react';
import { storage } from './storage-factory';
import { logError, logInfo } from './errors';
import { useAuth } from './auth-provider';

type Theme =
  | 'light'
  | 'dark'
  | 'nord'
  | 'catppuccin'
  | 'tokyo-night'
  | 'dracula'
  | 'rose-pine'
  | 'high-contrast';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isLoading: boolean;
};

const initialState: ThemeProviderState = {
  theme: 'light',
  setTheme: () => null,
  isLoading: true,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'ui-theme',
  ...props
}: ThemeProviderProps) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );
  const [isLoading, setIsLoading] = useState(true);

  // Load theme from Firestore when user logs in
  useEffect(() => {
    const loadUserTheme = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const preferences = await storage.getUserThemePreferences(user.id);
        if (preferences?.selectedTheme) {
          setThemeState(preferences.selectedTheme);
          localStorage.setItem(storageKey, preferences.selectedTheme);
          logInfo('User theme loaded from Firestore', { theme: preferences.selectedTheme });
        }
      } catch (error) {
        logError(
          'loadUserTheme',
          error instanceof Error ? error : new Error('Failed to load theme')
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadUserTheme();
  }, [user?.id, storageKey]);

  // Apply theme to DOM
  useEffect(() => {
    const root = window.document.documentElement;

    // Remove all theme classes
    root.classList.remove(
      'light',
      'dark',
      'nord',
      'catppuccin',
      'tokyo-night',
      'dracula',
      'rose-pine',
      'high-contrast'
    );

    if (theme === 'light') {
      // Light is the default, no class needed
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const setTheme = async (newTheme: Theme) => {
    // Update local state and localStorage immediately for responsive UI
    setThemeState(newTheme);
    localStorage.setItem(storageKey, newTheme);

    // Save to Firestore if user is logged in
    if (user?.id) {
      try {
        await storage.setUserThemePreferences({
          userId: user.id,
          tenantId: 1, // TODO: Get from user context
          selectedTheme: newTheme,
        });
        logInfo('User theme saved to Firestore', { theme: newTheme });
      } catch (error) {
        logError('setTheme', error instanceof Error ? error : new Error('Failed to save theme'));
        // Continue even if Firestore save fails - user still sees the theme change
      }
    }
  };

  const value = {
    theme,
    setTheme,
    isLoading,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
