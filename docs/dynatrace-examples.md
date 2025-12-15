# Dynatrace Integration Examples

This document provides practical examples of how Dynatrace is integrated into CertLab and how to add custom tracking to new features.

## Table of Contents

- [Basic Setup](#basic-setup)
- [Automatic Tracking](#automatic-tracking)
- [Custom Action Tracking](#custom-action-tracking)
- [Error Reporting](#error-reporting)
- [User Session Tracking](#user-session-tracking)
- [Common Patterns](#common-patterns)

## Basic Setup

### 1. Environment Configuration

Add these to your `.env` file:

```bash
# Dynatrace Configuration
VITE_DYNATRACE_ENVIRONMENT_ID=abc12345
VITE_DYNATRACE_APPLICATION_ID=APPLICATION-123ABC456DEF
VITE_DYNATRACE_BEACON_URL=https://abc12345.live.dynatrace.com/bf
VITE_ENABLE_DYNATRACE=true
VITE_DYNATRACE_DEV_MODE=false  # Don't pollute prod metrics with dev data
```

### 2. Generate and Add Script Snippet

```bash
# Generate the Dynatrace snippet
node scripts/generate-dynatrace-snippet.js

# Copy the generated snippet from dynatrace-snippet.html
# Paste it into client/index.html in the <head> section
```

### 3. Verify Integration

```bash
# Build and run the application
npm run build
npm run preview

# Open browser DevTools → Network tab
# Look for requests to your Dynatrace beacon URL
# Should see requests to: https://{environmentId}.live.dynatrace.com/bf
```

## Automatic Tracking

Dynatrace automatically tracks these events without any code changes:

### Page Views and Navigation

```typescript
// Automatic tracking when using Wouter
<Route path="/dashboard" component={Dashboard} />
<Route path="/quiz" component={Quiz} />

// Dynatrace automatically captures:
// - Page load times
// - Route changes
// - User navigation patterns
```

### JavaScript Errors

```typescript
// Automatic error capture
function someFunction() {
  throw new Error('Something went wrong');
  // Dynatrace automatically captures this error with stack trace
}
```

### Resource Loading

```typescript
// Automatic tracking of:
// - CSS file loading times
// - JavaScript bundle loading
// - Image loading performance
// - API call timing
```

## Custom Action Tracking

### Basic Action Tracking

```typescript
import { trackAction, completeAction } from '@/lib/dynatrace';

function handleQuizComplete() {
  const actionId = trackAction('Quiz Completed');
  
  try {
    // Save quiz results
    await saveQuizResults(results);
    
    // Complete the action successfully
    completeAction(actionId);
  } catch (error) {
    // Action is automatically completed on error
    completeAction(actionId);
    throw error;
  }
}
```

### Async Action Tracking (Recommended)

```typescript
import { trackAsyncAction } from '@/lib/dynatrace';

async function handleQuizComplete() {
  // Automatically tracks action start, completion, and any errors
  await trackAsyncAction('Quiz Completed', async () => {
    return await saveQuizResults(results);
  });
}
```

### Sync Action Tracking

```typescript
import { trackSyncAction } from '@/lib/dynatrace';

function calculateScore() {
  // Tracks synchronous operations
  return trackSyncAction('Calculate Quiz Score', () => {
    return performCalculation(answers);
  });
}
```

## Error Reporting

### Manual Error Reporting

```typescript
import { reportError, trackAction, completeAction } from '@/lib/dynatrace';

async function riskyOperation() {
  const actionId = trackAction('Risky Operation');
  
  try {
    await performOperation();
  } catch (error) {
    // Report error to Dynatrace with action context
    reportError(error, actionId);
    
    // Handle error in your application
    console.error('Operation failed:', error);
  } finally {
    completeAction(actionId);
  }
}
```

### Error Boundary Integration

```typescript
import { Component, ErrorInfo, ReactNode } from 'react';
import { reportError } from '@/lib/dynatrace';

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Report to Dynatrace
    reportError(error);
    
    // Log additional context
    console.error('Component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
```

## User Session Tracking

### Login Event

```typescript
import { identifyUser } from '@/lib/dynatrace';

async function handleLogin(email: string, password: string) {
  const user = await authenticateUser(email, password);
  
  // Identify user for session tracking
  // Use anonymized ID (numeric ID or UUID), never PII
  identifyUser(user.id.toString());
  
  return user;
}
```

### Logout Event

```typescript
import { endSession } from '@/lib/dynatrace';

async function handleLogout() {
  // End Dynatrace session
  endSession();
  
  // Clear local auth
  await clearSession();
  
  // Redirect to login
  navigate('/login');
}
```

### Current Implementation (auth-provider.tsx)

```typescript
// From client/src/lib/auth-provider.tsx

// On user load (login)
const loadUser = useCallback(async () => {
  const currentUser = await clientAuth.getCurrentUser();
  setUser(currentUser);
  
  // Track user session
  if (currentUser) {
    identifyUser(currentUser.id);
  }
}, []);

// On logout
const logout = useCallback(async () => {
  // End session before clearing auth
  endSession();
  
  await clientAuth.logout();
  setUser(null);
}, []);
```

## Common Patterns

### Pattern 1: Button Click Tracking

```typescript
import { trackAction, completeAction } from '@/lib/dynatrace';

function ShareButton() {
  const handleShare = async () => {
    const actionId = trackAction('Share Quiz Results', 'click');
    
    try {
      await shareResults();
      toast.success('Results shared!');
    } finally {
      completeAction(actionId);
    }
  };

  return <Button onClick={handleShare}>Share</Button>;
}
```

### Pattern 2: Form Submission Tracking

```typescript
import { trackAsyncAction } from '@/lib/dynatrace';

function ProfileForm() {
  const handleSubmit = async (data: FormData) => {
    await trackAsyncAction('Update Profile', async () => {
      const result = await updateProfile(data);
      toast.success('Profile updated!');
      return result;
    });
  };

  return <Form onSubmit={handleSubmit}>...</Form>;
}
```

### Pattern 3: Feature Usage Tracking

```typescript
import { trackAction, completeAction } from '@/lib/dynatrace';

function StudyGroupCard({ group }: { group: StudyGroup }) {
  const handleJoin = async () => {
    const actionId = trackAction('Study Group Joined', 'custom');
    
    try {
      await joinStudyGroup(group.id);
      toast.success(`Joined ${group.name}!`);
    } finally {
      completeAction(actionId);
    }
  };

  return (
    <Card>
      <CardContent>
        <h3>{group.name}</h3>
        <Button onClick={handleJoin}>Join Group</Button>
      </CardContent>
    </Card>
  );
}
```

### Pattern 4: Multi-Step Process Tracking

```typescript
import { trackAction, completeAction } from '@/lib/dynatrace';

async function handleQuizFlow() {
  // Track the entire quiz flow as one action
  const quizActionId = trackAction('Quiz Flow - Complete');
  
  try {
    // Step 1: Start quiz
    const startId = trackAction('Quiz Flow - Step 1: Start');
    await startQuiz();
    completeAction(startId);
    
    // Step 2: Answer questions
    const answerId = trackAction('Quiz Flow - Step 2: Answer Questions');
    await answerQuestions();
    completeAction(answerId);
    
    // Step 3: Submit
    const submitId = trackAction('Quiz Flow - Step 3: Submit');
    await submitQuiz();
    completeAction(submitId);
    
    // Complete overall flow
    completeAction(quizActionId);
  } catch (error) {
    // Complete action on error
    completeAction(quizActionId);
    throw error;
  }
}
```

### Pattern 5: Performance Monitoring

```typescript
import { now, trackAction, completeAction } from '@/lib/dynatrace';

async function loadQuizQuestions(categoryIds: number[]) {
  const actionId = trackAction('Load Quiz Questions');
  const startTime = now();
  
  try {
    const questions = await fetchQuestions(categoryIds);
    const duration = now() - startTime;
    
    // Log performance metric
    console.log(`Loaded ${questions.length} questions in ${duration}ms`);
    
    return questions;
  } finally {
    completeAction(actionId);
  }
}
```

### Pattern 6: Badge Earning Tracking

```typescript
import { trackAction, completeAction } from '@/lib/dynatrace';

async function checkAndAwardBadges(userId: string, quizResult: QuizResult) {
  const badges = await checkEligibleBadges(userId, quizResult);
  
  for (const badge of badges) {
    const actionId = trackAction(`Badge Earned - ${badge.name}`, 'custom');
    
    try {
      await awardBadge(userId, badge.id);
      toast.success(`🎉 Badge earned: ${badge.name}!`);
    } finally {
      completeAction(actionId);
    }
  }
}
```

### Pattern 7: Data Export Tracking

```typescript
import { trackAsyncAction } from '@/lib/dynatrace';

function ExportButton() {
  const handleExport = async () => {
    const data = await trackAsyncAction('Export User Data', async () => {
      // Tracked action includes the data fetching
      return await storage.exportData();
    });
    
    // Create and download file
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'certlab-export.json';
    a.click();
  };

  return <Button onClick={handleExport}>Export Data</Button>;
}
```

### Pattern 8: Feature Flag / A/B Testing

```typescript
import { trackAction, completeAction } from '@/lib/dynatrace';

function QuizInterface({ experimentVariant }: { experimentVariant: 'A' | 'B' }) {
  useEffect(() => {
    // Track which variant the user saw
    const actionId = trackAction(`Experiment: Quiz UI - Variant ${experimentVariant}`);
    
    return () => {
      completeAction(actionId);
    };
  }, [experimentVariant]);

  return experimentVariant === 'A' ? <QuizVariantA /> : <QuizVariantB />;
}
```

## Testing Dynatrace Integration

### Development Testing

```bash
# Enable Dynatrace in development
VITE_DYNATRACE_DEV_MODE=true npm run dev

# Open browser DevTools → Console
# Look for Dynatrace initialization logs:
# [Dynatrace] Initialized for CertLab (abc12345)
```

### Verify Custom Actions

1. Open your application
2. Perform actions that trigger custom tracking (e.g., complete a quiz)
3. Wait 2-5 minutes for data to appear in Dynatrace
4. Go to Dynatrace → Applications & Microservices → CertLab
5. Navigate to **Multidimensional analysis**
6. Filter by custom action name

### Test Error Reporting

```typescript
// Temporarily add this to test error reporting
import { reportError } from '@/lib/dynatrace';

function TestErrorButton() {
  const testError = () => {
    const error = new Error('Test error for Dynatrace');
    reportError(error);
    console.log('Test error reported to Dynatrace');
  };

  return <Button onClick={testError}>Test Error Reporting</Button>;
}
```

## Best Practices

### DO ✅

- **Use descriptive action names**: "Quiz Completed - CISSP" instead of "Action1"
- **Track business-critical actions**: Focus on key user journeys
- **Use async tracking helpers**: `trackAsyncAction()` handles errors automatically
- **Anonymize user IDs**: Use numeric IDs or UUIDs, never PII
- **Disable in development**: Set `VITE_DYNATRACE_DEV_MODE=false` by default

### DON'T ❌

- **Don't track every click**: Too many actions clutters analytics
- **Don't send PII**: Never send names, emails, or sensitive data
- **Don't forget to complete actions**: Always call `completeAction()` or use wrappers
- **Don't block user actions**: All Dynatrace calls are non-blocking and safe to fail
- **Don't enable in development by default**: Pollutes production metrics

## Troubleshooting

### Action Not Appearing in Dynatrace

```typescript
// Add debug logging
import { trackAction, completeAction, isDynatraceAvailable } from '@/lib/dynatrace';

function debugAction() {
  console.log('Dynatrace available?', isDynatraceAvailable());
  
  const actionId = trackAction('Test Action');
  console.log('Action ID:', actionId);  // Should not be -1
  
  completeAction(actionId);
}
```

### Check Configuration

```typescript
import { getDynatraceConfig } from '@/lib/dynatrace';

console.log('Dynatrace config:', getDynatraceConfig());
// Should show environmentId, applicationId, beaconUrl
```

## Additional Resources

- [setup/dynatrace.md](setup/dynatrace.md) - Complete setup guide
- [architecture/overview.md](architecture/overview.md) - System architecture with observability
- [Dynatrace JavaScript API](https://www.dynatrace.com/support/help/platform-modules/digital-experience/web-applications/support/javascript-api)
- [Dynatrace Best Practices](https://www.dynatrace.com/support/help/how-to-use-dynatrace/real-user-monitoring/best-practices/)

---

**Last Updated**: 2024-12-14
**Version**: 1.0.0
