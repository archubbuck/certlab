# Session Management Documentation

## Overview

CertLab implements a robust session persistence and validation system to provide a seamless user experience without page flashing or UI flickering during authentication state transitions.

## Architecture

### Session Storage

The application uses **sessionStorage** to cache authentication state, providing instant UI rendering on page load:

- **Key**: `certlab_auth_state`, `certlab_auth_user`, `certlab_auth_timestamp`
- **Location**: `client/src/lib/auth-provider.tsx`
- **Expiry**: 24 hours (configurable via `SESSION_MAX_AGE_MS`)

### Session Lifecycle

1. **Initialization**
   - On app load, cached auth state is read from sessionStorage
   - If cached session exists and is not stale (< 24 hours old), user state is immediately restored
   - Loading state is set to `true` to validate the cached session against Firebase/IndexedDB

2. **Validation**
   - Firebase auth state listener is set up
   - For local auth (dev mode), IndexedDB is checked for current user
   - Once validation completes, `authInitialized` is set to `true` and `isLoading` becomes `false`

3. **Updates**
   - Any auth state change (login, logout, token refresh) updates sessionStorage
   - Timestamp is updated on each auth state cache write
   - Stale sessions are automatically cleared on next page load

### Components

#### SessionLoader (`client/src/components/SessionLoader.tsx`)

A consistent loading component shown during session validation:
- Used by `ProtectedRoute` for authenticated routes
- Used by `App Router` for landing page during initialization
- Displays "Validating session..." or custom message
- Provides accessible loading indicators

#### ProtectedRoute (`client/src/components/ProtectedRoute.tsx`)

Wrapper for authenticated routes:
- Shows `SessionLoader` during authentication check
- Redirects to landing page (`/`) if not authenticated
- Preserves attempted route for post-login redirect
- Renders children only when authenticated

#### useSessionValidator Hook (`client/src/hooks/use-session-validator.ts`)

Optional hook for pages that need explicit session validation:
```typescript
const { isValidating, isAuthenticated, user, isSessionValid } = useSessionValidator();

if (isValidating) {
  return <SessionLoader />;
}

if (!isSessionValid) {
  return <Navigate to="/" />;
}

// Render authenticated content
```

## Session Expiry Handling

### Automatic Detection

- Sessions older than 24 hours are considered stale
- Stale sessions are automatically cleared on page load
- User is redirected to login page seamlessly

### Manual Invalidation

```typescript
import { storage } from '@/lib/storage-factory';

// Clear current session
await storage.clearCurrentUser();

// Session cache will be cleared automatically
```

## Flash Prevention Strategy

### Problem
Without proper session management, users may see:
- Landing page briefly before redirect to dashboard (authenticated users)
- Dashboard flash before redirect to landing (unauthenticated users)
- Loading spinner flickering during page transitions

### Solution

1. **Optimistic Rendering**
   - Read cached auth state synchronously on mount
   - Show last known UI state immediately
   - Validate in background without blocking render

2. **Coordinated Loading States**
   - `isLoading`: True during initial validation or substantive auth changes
   - `authInitialized`: True once first auth check completes
   - Only show loading UI when truly necessary

3. **Consistent Components**
   - All loading states use `SessionLoader` for consistency
   - All protected routes use `ProtectedRoute` wrapper
   - Landing page shows loader during auth check

## Implementation Examples

### Protected Page with Session Validation

```typescript
import { SessionLoader } from '@/components/SessionLoader';
import { useAuth } from '@/lib/auth-provider';

export default function DashboardPage() {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return <SessionLoader message="Loading dashboard..." />;
  }

  return (
    <div>
      <h1>Welcome, {user?.firstName}!</h1>
      {/* Dashboard content */}
    </div>
  );
}
```

### Custom Session Validation

```typescript
import { useSessionValidator } from '@/hooks/use-session-validator';
import { SessionLoader } from '@/components/SessionLoader';

export default function MyPage() {
  const { isValidating, isSessionValid, user } = useSessionValidator();

  if (isValidating) {
    return <SessionLoader message="Validating access..." />;
  }

  if (!isSessionValid) {
    return <Navigate to="/" />;
  }

  return <div>Protected content for {user?.email}</div>;
}
```

## Testing

### Unit Tests

Session management is tested in:
- `client/src/lib/auth-provider.test.tsx` - Auth provider behavior
- `client/src/App.test.tsx` - Flash prevention on landing page
- `client/src/components/ProtectedRoute.test.tsx` - Route protection

### Manual Testing Checklist

- [ ] Fresh load shows no flash on landing page
- [ ] Authenticated user lands on dashboard without flash
- [ ] Logout redirects to landing smoothly
- [ ] Stale session (24h+ old) clears and redirects to login
- [ ] Protected routes show loading state during validation
- [ ] Navigation between protected routes is smooth
- [ ] Browser refresh maintains session state

## Configuration

### Session Expiry Time

Edit `client/src/lib/auth-provider.tsx`:

```typescript
// Session considered stale after 24 hours
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // Change this value
```

### Loading Messages

Customize loading messages per component:

```typescript
<SessionLoader message="Custom loading message..." />
```

## Troubleshooting

### Issue: Page still flashes on load

**Check:**
1. Is sessionStorage enabled in browser?
2. Are session cache keys being written correctly?
3. Is `isLoading` state being properly managed?

**Debug:**
```typescript
// In browser console:
console.log(sessionStorage.getItem('certlab_auth_state'));
console.log(sessionStorage.getItem('certlab_auth_user'));
console.log(sessionStorage.getItem('certlab_auth_timestamp'));
```

### Issue: Session not persisting between page loads

**Check:**
1. Using sessionStorage (not localStorage)
2. Session timestamp not exceeding 24 hours
3. No browser extensions clearing storage

### Issue: Loading state never completes

**Check:**
1. Firebase auth listener is being set up correctly
2. Mock Firebase auth in tests properly triggers callback
3. `authInitialized` state is being set

## Future Enhancements

Potential improvements for session management:

1. **Remember Me**: Optional localStorage persistence
2. **Session Renewal**: Automatic refresh before 24h expiry
3. **Multi-Tab Sync**: Broadcast channel for cross-tab auth sync
4. **Progressive Enhancement**: Skeleton loaders for specific content areas
5. **Session Analytics**: Track session duration and quality metrics

## Related Files

- `client/src/lib/auth-provider.tsx` - Main auth provider with session caching
- `client/src/components/SessionLoader.tsx` - Loading UI component
- `client/src/components/ProtectedRoute.tsx` - Route protection wrapper
- `client/src/hooks/use-session-validator.ts` - Session validation hook
- `client/src/App.tsx` - Root routing with flash prevention
