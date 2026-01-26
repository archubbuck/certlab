/**
 * Vitest configuration for unit and component tests.
 * Extends Vite configuration with test-specific settings (jsdom, coverage, etc.).
 * Path aliases should be kept in sync with vite.config.ts.
 */
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // Enable global test APIs (describe, it, expect) without explicit imports
    // Note: If using TypeScript, add "vitest/globals" to tsconfig compilerOptions.types if you see type errors
    globals: true,
    setupFiles: ['./client/src/test/setup.ts'],
    include: ['client/src/**/*.{test,spec}.{ts,tsx}', 'shared/**/*.{test,spec}.{ts,tsx}'],
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    // Disable file-level parallelism because some tests rely on a singleton
    // offlineQueue and shared localStorage state, which can cause race conditions
    // when multiple test files run concurrently in the same process.
    fileParallelism: false,
    // Use threads pool with limited concurrency to balance speed and resource usage
    pool: 'threads',
    // Limit concurrent tests to avoid resource exhaustion (Vitest 4+ format)
    minWorkers: 1,
    maxWorkers: 2,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['client/src/**/*.{ts,tsx}', 'shared/**/*.{ts,tsx}'],
      exclude: [
        'client/src/**/*.test.{ts,tsx}',
        'client/src/**/*.spec.{ts,tsx}',
        'shared/**/*.test.{ts,tsx}',
        'shared/**/*.spec.{ts,tsx}',
        'client/src/test/**',
        'client/src/main.tsx',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'client', 'src'),
      '@shared': path.resolve(import.meta.dirname, 'shared'),
      '@assets': path.resolve(import.meta.dirname, 'attached_assets'),
    },
  },
});
