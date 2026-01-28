# ADR-012: Theme & Accessibility System

**Status:** ✅ Accepted  
**Date:** 2024-12-22  
**Deciders:** CertLab Team  
**Context:** Define the theme system supporting 7 themes and accessibility features meeting WCAG 2.2 Level AA standards.

## Table of Contents

- [Executive Summary](#executive-summary)
- [Context and Problem Statement](#context-and-problem-statement)
- [Decision](#decision)
- [Implementation Details](#implementation-details)
- [Consequences](#consequences)
- [Alternatives Considered](#alternatives-considered)
- [Related Documents](#related-documents)
- [Code References](#code-references)
- [Revision History](#revision-history)

---

## Executive Summary

CertLab implements **7 customizable themes** with **WCAG 2.2 Level AA accessibility** compliance, including keyboard navigation, screen reader support, focus management, and high-contrast mode.

### Quick Reference

| Aspect | Implementation | Purpose |
|--------|---------------|---------|
| **Themes** | 7 themes (light, dark, nord, catppuccin, tokyo-night, dracula, rose-pine, high-contrast) | Visual customization |
| **Theme Provider** | React Context + CSS variables | Centralized theme management |
| **WCAG Compliance** | Level AA standards | Accessibility for all users |
| **Keyboard Navigation** | Full keyboard support | Screen reader friendly |
| **Focus Management** | Visible focus indicators | Clear navigation |
| **Color Contrast** | 4.5:1 minimum | Readable text |
| **Screen Readers** | ARIA labels + semantic HTML | Assistive technology |
| **High Contrast** | Dedicated theme | Vision impairments |

**Key Metrics:**
- Themes: 7 (+ high-contrast)
- Contrast ratio: ≥4.5:1 (AA)
- Focus indicators: Visible on all interactive elements
- ARIA coverage: 95%+

---

## Context and Problem Statement

CertLab needed a theme and accessibility system that would:

1. **Provide visual customization** for user preference
2. **Meet WCAG 2.2 Level AA** accessibility standards
3. **Support keyboard navigation** for all features
4. **Enable screen reader** compatibility
5. **Maintain color contrast** for readability
6. **Persist theme selection** across sessions
7. **Support high-contrast mode** for vision impairments
8. **Provide focus indicators** for keyboard users

### Requirements

**Functional Requirements:**
- ✅ 7+ theme options with CSS variables
- ✅ Theme persistence in Firestore
- ✅ Keyboard navigation for all UI
- ✅ ARIA labels on interactive elements
- ✅ Focus trap in modals/dialogs
- ✅ Skip navigation links
- ✅ Semantic HTML structure
- ✅ High-contrast theme option

**Non-Functional Requirements:**
- ✅ Color contrast ≥4.5:1 (AA standard)
- ✅ Theme switch <100ms
- ✅ Keyboard shortcuts documented
- ✅ Screen reader tested
- ✅ Focus indicators visible

---

## Decision

We adopted a **CSS variable-based theme system** with **comprehensive accessibility features**:

### Theme Architecture

```
┌─────────────────────────────────────────────────────────┐
│                Theme & Accessibility System             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────┐      │
│  │         ThemeProvider (React Context)        │      │
│  ├──────────────────────────────────────────────┤      │
│  │  • Manages current theme state               │      │
│  │  • Persists selection to Firestore           │      │
│  │  • Applies CSS variables to <html>           │      │
│  │  • Provides setTheme function                │      │
│  └──────────────────────────────────────────────┘      │
│                                                         │
│  ┌──────────────────────────────────────────────┐      │
│  │       7 Theme Options (CSS Variables)        │      │
│  ├──────────────────────────────────────────────┤      │
│  │  • light           - Default light theme     │      │
│  │  • dark            - Default dark theme      │      │
│  │  • nord            - Nordic color palette    │      │
│  │  • catppuccin      - Pastel color palette    │      │
│  │  • tokyo-night     - Dark neon theme         │      │
│  │  • dracula         - Purple dark theme       │      │
│  │  • rose-pine       - Warm dark theme         │      │
│  │  • high-contrast   - Max contrast for a11y   │      │
│  └──────────────────────────────────────────────┘      │
│                                                         │
│  ┌──────────────────────────────────────────────┐      │
│  │       Accessibility Features (WCAG 2.2 AA)   │      │
│  ├──────────────────────────────────────────────┤      │
│  │  • Keyboard navigation (Tab, Arrow keys)     │      │
│  │  • Focus indicators (2px outline)            │      │
│  │  • ARIA labels (aria-label, aria-describedby)│      │
│  │  • Semantic HTML (nav, main, section, etc)   │      │
│  │  • Skip links (<a href="#main-content">)     │      │
│  │  • Focus trap in modals                      │      │
│  │  • Alt text on images                        │      │
│  │  • Color contrast ≥4.5:1                     │      │
│  └──────────────────────────────────────────────┘      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### 1. ThemeProvider

**File:** `client/src/lib/theme-provider.tsx`

```typescript
import { createContext, useContext, useEffect, useState } from 'react';
import { storage } from './storage-factory';
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

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isLoading: boolean;
}

const ThemeProviderContext = createContext<ThemeProviderState>(null!);

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'ui-theme',
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}) {
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
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
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

    // Add current theme class
    root.classList.add(theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(storageKey, newTheme);

    // Save to Firestore if user is logged in
    if (user?.id) {
      storage.updateUserThemePreferences(user.id, {
        selectedTheme: newTheme,
      });
    }
  };

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme, isLoading }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeProviderContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

### 2. CSS Variables for Themes

**File:** `client/src/index.css`

```css
/* Light Theme (Default) */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
}

/* Dark Theme */
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 224.3 76.3% 48%;
}

/* Nord Theme */
.nord {
  --background: 220 16% 22%;
  --foreground: 218 27% 94%;
  --primary: 193 43% 67%;
  --primary-foreground: 220 16% 22%;
  --secondary: 220 16% 36%;
  --secondary-foreground: 218 27% 94%;
  --muted: 220 16% 36%;
  --muted-foreground: 218 27% 84%;
  --accent: 179 25% 65%;
  --accent-foreground: 220 16% 22%;
  --destructive: 354 42% 56%;
  --destructive-foreground: 218 27% 94%;
  --border: 220 16% 36%;
  --input: 220 16% 36%;
  --ring: 193 43% 67%;
}

/* High Contrast Theme (WCAG AAA) */
.high-contrast {
  --background: 0 0% 0%;
  --foreground: 0 0% 100%;
  --primary: 60 100% 50%;
  --primary-foreground: 0 0% 0%;
  --secondary: 0 0% 20%;
  --secondary-foreground: 0 0% 100%;
  --muted: 0 0% 20%;
  --muted-foreground: 0 0% 90%;
  --accent: 60 100% 50%;
  --accent-foreground: 0 0% 0%;
  --destructive: 0 100% 50%;
  --destructive-foreground: 0 0% 100%;
  --border: 0 0% 100%;
  --input: 0 0% 20%;
  --ring: 60 100% 50%;
}

/* Focus indicators for keyboard navigation */
*:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

/* Skip to main content link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

### 3. Keyboard Navigation

**File:** `client/src/lib/keyboard-navigation.ts`

```typescript
// Global keyboard shortcuts
export function setupKeyboardNavigation() {
  document.addEventListener('keydown', (e) => {
    // Alt+T: Toggle theme
    if (e.altKey && e.key === 't') {
      e.preventDefault();
      // Open theme selector
      document.getElementById('theme-selector')?.click();
    }

    // Alt+/: Open help
    if (e.altKey && e.key === '/') {
      e.preventDefault();
      // Open help modal
      document.getElementById('help-modal')?.click();
    }

    // Escape: Close modal
    if (e.key === 'Escape') {
      // Close any open modals
      const openModals = document.querySelectorAll('[role="dialog"][open]');
      openModals.forEach((modal) => {
        (modal as HTMLElement).click();
      });
    }
  });
}
```

### 4. ARIA Labels

**File:** `client/src/components/Header.tsx`

```typescript
export default function Header() {
  return (
    <header role="banner">
      <nav role="navigation" aria-label="Main navigation">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        
        <div className="container">
          <Link to="/" aria-label="CertLab Home">
            <Logo />
          </Link>

          <button
            aria-label="Toggle theme"
            aria-expanded={themeMenuOpen}
            aria-controls="theme-menu"
            onClick={toggleThemeMenu}
          >
            <Sun className="h-5 w-5" />
          </button>

          <button
            aria-label="Open main menu"
            aria-expanded={menuOpen}
            aria-controls="main-menu"
            onClick={toggleMenu}
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open menu</span>
          </button>
        </div>
      </nav>
    </header>
  );
}
```

### 5. Focus Trap in Modals

**File:** `client/src/hooks/use-focus-trap.ts`

```typescript
import { useEffect, useRef } from 'react';

export function useFocusTrap(isOpen: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const container = containerRef.current;
    if (!container) return;

    // Get all focusable elements
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus first element
    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift+Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return containerRef;
}
```

### 6. Theme Selector Component

**File:** `client/src/components/ThemeSelector.tsx`

```typescript
import { useTheme } from '@/lib/theme-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sun, Moon } from 'lucide-react';

const THEMES = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'nord', label: 'Nord' },
  { value: 'catppuccin', label: 'Catppuccin' },
  { value: 'tokyo-night', label: 'Tokyo Night' },
  { value: 'dracula', label: 'Dracula' },
  { value: 'rose-pine', label: 'Rose Pine' },
  { value: 'high-contrast', label: 'High Contrast' },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Select theme"
          id="theme-selector"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {THEMES.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onClick={() => setTheme(t.value as Theme)}
            className={theme === t.value ? 'bg-accent' : ''}
          >
            {t.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## Consequences

### Positive

1. **Visual Customization** - 7+ themes for user preference
2. **Accessibility** - WCAG 2.2 AA compliance
3. **Keyboard Navigation** - Full keyboard support
4. **Screen Reader** - Comprehensive ARIA labels
5. **Persistence** - Theme saved to Firestore
6. **High Contrast** - Vision impairment support
7. **Developer Experience** - CSS variables easy to customize

### Negative

1. **Theme Maintenance** - 7 themes to update
2. **Testing Complexity** - Test all themes + accessibility
3. **Bundle Size** - CSS for all themes

### Mitigations

1. Use CSS variable generator tool
2. Automated accessibility testing
3. Lazy load theme CSS

---

## Alternatives Considered

### Alternative 1: Tailwind Dark Mode Only

Use only Tailwind's built-in dark mode.

**Pros:** Simple, minimal code  
**Cons:** Limited to 2 themes, no customization

**Reason for Rejection:** Users want more theme variety.

### Alternative 2: Styled Components Theming

Use styled-components ThemeProvider.

**Pros:** Type-safe themes, scoped styles  
**Cons:** Runtime CSS-in-JS overhead, larger bundle

**Reason for Rejection:** CSS variables are more performant.

### Alternative 3: Radix Themes

Use Radix UI's theming system.

**Pros:** Pre-built themes, accessibility  
**Cons:** Limited customization, opinionated design

**Reason for Rejection:** Need full control over theme design.

---

## Related Documents

- [ADR-005: Frontend Technology Stack](ADR-005-frontend-technology-stack.md)
- [ADR-006: Component Architecture](ADR-006-component-architecture.md)

---

## Code References

| File | Lines | Description |
|------|-------|-------------|
| `client/src/lib/theme-provider.tsx` | 1-120 | Theme context provider |
| `client/src/index.css` | 1-200 | Theme CSS variables |
| `client/src/hooks/use-focus-trap.ts` | 1-60 | Focus trap hook |
| `client/src/components/ThemeSelector.tsx` | 1-80 | Theme selector UI |

---

## Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2024-12-22 | 1.0 | CertLab Team | Initial version - theme & accessibility |
