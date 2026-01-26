/**
 * Test Fixtures and Custom Setup
 *
 * Extends Playwright's base test with custom fixtures for:
 * - Authentication state management
 * - Test data seeding
 * - Common page objects
 */

import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Define custom fixture types
type CustomFixtures = {
  authenticatedPage: Page;
};

/**
 * Extended test with custom fixtures
 */
export const test = base.extend<CustomFixtures>({
  /**
   * Provides a page that can be used for authenticated tests
   *
   * Note: This fixture does not automatically authenticate.
   * Tests using this fixture should check if authentication is available
   * and skip gracefully if not (e.g., when Firebase is not configured).
   *
   * In CI, Firebase credentials should be configured, allowing tests to work.
   * Locally, use Firebase Auth Emulator or skip auth-required tests.
   */
  authenticatedPage: async ({ page }, use) => {
    // Just provide the page - authentication must be handled by the test itself
    // or by external setup (e.g., Firebase emulator, test user credentials)
    await use(page);
  },
});

// Re-export expect for convenience
export { expect };

/**
 * Test data factory functions
 */
export const testData = {
  /**
   * Generate test user data
   */
  generateTestUser: () => ({
    email: `test-${Date.now()}@example.com`,
    firstName: 'Test',
    lastName: 'User',
  }),

  /**
   * Quiz configuration test data
   */
  quizConfig: {
    basic: {
      categories: ['CISSP'],
      questionCount: 10,
      mode: 'study',
    },
    multiCategory: {
      categories: ['CISSP', 'CISM'],
      questionCount: 20,
      mode: 'quiz',
    },
    adaptive: {
      categories: ['CISSP'],
      questionCount: 15,
      mode: 'adaptive',
    },
  },
};
