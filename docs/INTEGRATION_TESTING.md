# Integration Testing Guide for CertLab

This guide explains the integration testing strategy implemented for CertLab's multi-tenant and data-flow features.

## Overview

Integration tests validate that multiple modules work together correctly. Unlike unit tests that test individual functions in isolation, integration tests exercise real workflows that span authentication, storage, query management, and UI components.

## Why Integration Tests?

CertLab has complex cross-module interactions:

1. **Authentication** → **Storage** → **Query Client** → **UI Components**
2. **Multi-tenant Data Isolation** across Firestore collections
3. **TanStack Query Caching** synchronized with Firebase/Firestore
4. **Quiz Workflows** spanning creation, taking, submission, and review
5. **Session Management** across page reloads and auth state changes

Unit tests alone cannot validate these workflows. Integration tests provide confidence that the system works end-to-end.

## Test Infrastructure

### Mock Services

We use **realistic mocks** that simulate actual service behavior:

#### Firebase Mock (`firebase-mock.ts`)
- Maintains authentication state
- Fires auth state listeners
- Simulates sign-in/sign-out flows
- Supports concurrent auth operations

#### Firestore Mock (`firestore-mock.ts`)
- In-memory document database
- Supports queries with where/orderBy/limit
- Maintains collections and subcollections
- Tracks user-specific data isolation

### Test Utilities

#### `integration-utils.ts`
Common utilities for integration tests:
- `resetIntegrationMocks()` - Reset all mocks between tests
- `signInTestUser()` / `signOutTestUser()` - Auth helpers
- `seedTestData()` - Populate mock Firestore with test data
- `createTest*()` functions - Factory functions for test data
- `waitForAsync()` / `waitForCondition()` - Async helpers
- `assertDefined()` / `assertArrayEquals()` - Custom assertions

#### `test-providers.tsx`
React providers for integration tests:
- `IntegrationTestProvider` - Wraps components with QueryClient and mocked services
- `createTestQueryClient()` - Creates fresh QueryClient for each test
- Exports `firebaseMock` and `firestoreMock` for direct manipulation

## Test Suites

### 1. Multi-Tenant Tests (`multi-tenant.test.ts`)

**Purpose**: Validate data isolation and tenant switching

**Tests**:
- Data isolation between tenants (quizzes, categories, users)
- Tenant switching workflow
- Cross-tenant data access prevention
- Tenant-specific queries and filtering
- Concurrent tenant operations
- Referential integrity across tenants

**Key Validations**:
- User in tenant 1 cannot see tenant 2 data
- Switching tenants updates data context
- Inactive tenants are handled correctly

### 2. Authentication Flow Tests (`auth-flow.test.tsx`)

**Purpose**: Validate authentication lifecycle and session management

**Tests**:
- Firebase authentication initialization
- User sign-in and Firestore profile creation
- Session persistence across page reloads
- Logout and session cleanup
- Local/dev fallback authentication
- Error handling (network errors, invalid credentials)
- Concurrent authentication attempts
- Auth state transitions

**Key Validations**:
- Auth state changes propagate correctly
- Session persists across reloads
- Cleanup happens on logout
- Development mode works without Firebase

### 3. Query Caching Tests (`query-cache.test.tsx`)

**Purpose**: Validate TanStack Query caching and invalidation

**Tests**:
- Cache behavior for different data types (static, user, auth, quiz)
- Stale time configuration
- Cache invalidation after mutations
- Cross-component cache sharing
- Cross-page cache consistency
- Query key consistency
- Refetch behavior based on stale time

**Key Validations**:
- Static data cached longer than user data
- Mutations invalidate correct queries
- Same query keys share cache across components
- Stale data refetches automatically

### 4. Quiz Flow Tests (`quiz-flow.test.ts`)

**Purpose**: Validate complete quiz workflows

**Tests**:
- Quiz creation with configuration
- Question generation based on criteria
- Quiz start and question loading
- Answer submission and tracking
- Quiz completion and score calculation
- Quiz review and results display
- Data persistence across sessions
- State management (not started → started → completed)

**Key Validations**:
- Quiz configuration validates correctly
- Progress tracks accurately
- Answers can be changed before submission
- Completed quizzes cannot be modified
- User progress updates after completion

## Running Integration Tests

### All Integration Tests
```bash
npm run test:integration
```

### Specific Test File
```bash
npx vitest run client/src/test/integration/scenarios/multi-tenant.test.ts
```

### Watch Mode (for development)
```bash
npx vitest watch client/src/test/integration
```

### Unit Tests Only (excluding integration)
```bash
npm run test:unit
```

## Writing New Integration Tests

### Step 1: Set Up Test Environment

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetIntegrationMocks,
  signInTestUser,
  seedTestData,
  createTestUser,
} from '../helpers/integration-utils';
import { firestoreMock } from '../helpers/test-providers';
import { storage } from '@/lib/storage-factory';

describe('My Integration Tests', () => {
  beforeEach(async () => {
    // Reset mocks
    resetIntegrationMocks();

    // Seed test data
    await seedTestData({
      tenants: [{ id: 1, name: 'Test Tenant', isActive: true }],
      users: [{ id: 'user1', email: 'test@example.com', tenantId: 1, role: 'user' }],
    });

    // Sign in user
    const testUser = createTestUser({ uid: 'user1' });
    await signInTestUser(testUser);
    await firestoreMock.setCurrentUserId('user1');
  });

  // ... tests
});
```

### Step 2: Write Test Cases

```typescript
it('should validate cross-module interaction', async () => {
  // 1. Arrange: Set up test data
  await seedTestData({
    categories: [{ id: 1, name: 'Test Category', tenantId: 1 }],
  });

  // 2. Act: Perform operation
  const categories = await storage.getCategories(1);

  // 3. Assert: Verify results
  expect(categories).toHaveLength(1);
  expect(categories[0].name).toBe('Test Category');
});
```

### Step 3: Test React Components

```typescript
import { render, waitFor } from '@testing-library/react';
import { IntegrationTestProvider } from '../helpers/test-providers';

it('should render component with real data', async () => {
  const { result } = render(
    <IntegrationTestProvider>
      <MyComponent />
    </IntegrationTestProvider>
  );

  await waitFor(() => {
    expect(screen.getByText('Expected Content')).toBeInTheDocument();
  });
});
```

## Best Practices

### DO:
✅ Reset mocks before each test with `resetIntegrationMocks()`  
✅ Use realistic test data that matches production patterns  
✅ Test complete workflows, not just individual operations  
✅ Use `waitForAsync()` when testing async operations  
✅ Test error scenarios and edge cases  
✅ Keep tests independent (can run in any order)  
✅ Document what behavior you're validating and why  

### DON'T:
❌ Test implementation details (test observable behavior)  
❌ Make tests depend on execution order  
❌ Use real Firebase/Firestore (always use mocks)  
❌ Create brittle tests that break on UI changes  
❌ Ignore intermittent test failures (fix flaky tests)  
❌ Test things already covered by unit tests  

## Debugging Integration Tests

### View Mock State
```typescript
import { getIntegrationMockState } from '../helpers/test-providers';

// Check current mock state
const state = getIntegrationMockState();
console.log('Firebase user:', state.firebase.currentUser);
console.log('Firestore initialized:', state.firestore.isInitialized);
```

### Inspect Firestore Data
```typescript
// Get document
const doc = await firestoreMock.getDocument('users', 'user1');
console.log('User data:', doc);

// Get collection
const docs = await firestoreMock.getDocuments('categories');
console.log('All categories:', docs);
```

### Add Debug Logging
```typescript
it('should debug behavior', async () => {
  console.log('Before operation');
  
  const result = await storage.getUserQuizzes('user1', 1);
  
  console.log('Result:', result);
  console.log('Result length:', result.length);
});
```

## Continuous Integration

Integration tests run automatically on every PR via GitHub Actions. The workflow:

1. Installs dependencies with `npm ci`
2. Runs type checking with `npm run check`
3. Runs all tests (unit + integration) with `npm run test:run`
4. Generates coverage report

Tests must:
- ✅ Complete within 2 minutes total
- ✅ Not require external services (all mocked)
- ✅ Pass consistently (no flaky tests)
- ✅ Clean up resources properly

## Coverage Goals

Integration tests contribute to overall coverage but focus on:
- **Integration coverage**: Are workflows tested end-to-end?
- **Cross-module coverage**: Do modules work together correctly?
- **Error path coverage**: Do error scenarios work as expected?

Rather than raw percentage, we aim for:
- ✅ All critical user workflows covered
- ✅ All multi-tenant scenarios covered
- ✅ All authentication flows covered
- ✅ All data sync patterns covered

## Future Enhancements

Potential additions to integration test suite:
- [ ] Cloud sync tests (online/offline transitions)
- [ ] Conflict resolution tests
- [ ] Performance tests (load time, query time)
- [ ] Data migration tests (schema upgrades)
- [ ] Real-time sync tests (multiple clients)
- [ ] Notification integration tests
- [ ] Gamification workflow tests

## Resources

- **Test Files**: `client/src/test/integration/scenarios/`
- **Test Utilities**: `client/src/test/integration/helpers/`
- **Test Mocks**: `client/src/test/integration/mocks/`
- **Vitest Docs**: https://vitest.dev/guide/
- **Testing Library**: https://testing-library.com/docs/react-testing-library/intro/
- **TanStack Query Testing**: https://tanstack.com/query/latest/docs/react/guides/testing

## Questions?

If you have questions about integration testing:
1. Read this guide thoroughly
2. Check existing test files for examples
3. Review test utilities and mocks
4. Ask in team discussions

Happy testing! 🧪
