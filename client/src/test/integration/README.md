# Integration Tests

This directory contains integration tests for CertLab that validate complex cross-module interactions.

## Directory Structure

```
integration/
├── README.md                    # This file
├── helpers/                     # Test utilities and helpers
│   ├── test-providers.tsx      # Integration test providers with mocked services
│   └── integration-utils.ts    # Common utilities for integration tests
├── mocks/                       # Realistic mocks for external dependencies
│   ├── firebase-mock.ts        # Mock Firebase authentication
│   └── firestore-mock.ts       # Mock Firestore with realistic behavior
└── scenarios/                   # Integration test suites
    ├── auth-flow.test.tsx      # Authentication flow tests
    ├── multi-tenant.test.ts    # Multi-tenancy tests
    ├── quiz-flow.test.ts       # Quiz workflow tests
    └── query-cache.test.tsx    # Query caching/invalidation tests
```

## Testing Approach

### Integration vs Unit Tests

**Unit tests** (`*.test.ts` in src):
- Test individual functions and components in isolation
- Use simple mocks (vi.mock)
- Fast execution
- Focus on correctness of individual units

**Integration tests** (this directory):
- Test interactions between multiple modules
- Use realistic mocks that simulate actual behavior
- Test full user workflows
- Validate data flow across boundaries
- Slower but provide higher confidence

### Mock Strategy

Integration tests use **realistic mocks** that simulate actual behavior:

1. **Firebase Mock**: Simulates authentication state changes, token refresh, etc.
2. **Firestore Mock**: In-memory database with realistic query behavior
3. **Storage Mock**: Simulates network delays and offline scenarios

These mocks are more complex than unit test mocks but less complex than the actual services, striking a balance between realism and test speed.

### Test Organization

Each test scenario file focuses on a specific workflow:

1. **Setup**: Initialize test environment with providers
2. **Execute**: Perform user actions or system operations
3. **Assert**: Verify expected behavior across modules
4. **Cleanup**: Reset state between tests

## Running Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific integration test file
npx vitest run client/src/test/integration/scenarios/auth-flow.test.tsx

# Run integration tests in watch mode
npx vitest watch client/src/test/integration
```

## Writing New Integration Tests

### Template

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { IntegrationTestProvider } from '../helpers/test-providers';
import { resetIntegrationMocks } from '../helpers/integration-utils';

describe('Feature Integration Tests', () => {
  beforeEach(() => {
    resetIntegrationMocks();
  });

  afterEach(() => {
    // Cleanup
  });

  it('should test complete workflow', async () => {
    // 1. Setup
    const { user } = render(
      <IntegrationTestProvider>
        <YourComponent />
      </IntegrationTestProvider>
    );

    // 2. Execute
    // Simulate user actions...

    // 3. Assert
    await waitFor(() => {
      expect(screen.getByText('Expected Result')).toBeInTheDocument();
    });
  });
});
```

### Best Practices

1. **Test Real Workflows**: Simulate actual user journeys, not just API calls
2. **Use Realistic Data**: Create test data that matches production patterns
3. **Test Edge Cases**: Include error scenarios, offline mode, race conditions
4. **Keep Tests Independent**: Each test should be runnable in isolation
5. **Document Assumptions**: Explain what behavior is being validated and why
6. **Avoid Brittleness**: Don't test implementation details, test observable behavior

## Coverage Goals

Integration tests should cover:
- ✅ Multi-tenant data isolation
- ✅ Authentication flows (Firebase, local, errors)
- ✅ Cloud sync operations
- ✅ Quiz creation and completion workflows
- ✅ Query caching and invalidation
- ✅ Offline-to-online transitions
- ✅ Session persistence

## Continuous Integration

Integration tests run in CI on every PR. They must:
- ✅ Complete within 2 minutes
- ✅ Not require external services
- ✅ Be deterministic (no flaky tests)
- ✅ Clean up resources properly
