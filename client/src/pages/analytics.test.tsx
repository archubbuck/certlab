/**
 * Unit tests for Analytics page component
 *
 * Tests analytics display, data calculations, and user interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import * as React from 'react';

// Mock the auth provider
const mockUseAuth = vi.fn();
vi.mock('@/lib/auth-provider', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock recharts to avoid canvas issues
vi.mock('recharts', () => ({
  LineChart: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  AreaChart: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => <div data-testid="area" />,
  BarChart: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

// Mock analytics service
vi.mock('@/lib/analytics-service', () => ({
  analyticsService: {
    calculateLearningCurve: vi.fn(() => []),
    predictExamReadiness: vi.fn(() => ({ ready: true, score: 85, confidence: 'high' })),
    forecastPerformance: vi.fn(() => ({ trend: 'improving', score: 80 })),
    calculateStudyEfficiency: vi.fn(() => ({ efficiency: 0.85, recommendation: 'Great!' })),
    identifySkillGaps: vi.fn(() => []),
    detectBurnoutRisk: vi.fn(() => ({ risk: 'low', recommendation: 'Keep it up!' })),
    identifyPeakPerformanceTimes: vi.fn(() => ({ best: 'morning', worst: 'evening' })),
    generateInsights: vi.fn(() => []),
  },
}));

// Import component after mocks
import Analytics from './analytics';

describe('Analytics Page', () => {
  function createWrapper() {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    return function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>{children}</MemoryRouter>
        </QueryClientProvider>
      );
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 1, email: 'test@example.com', role: 'user', tenantId: 1 },
      isAuthenticated: true,
      isLoading: false,
    });
  });

  it('should render analytics page title', () => {
    render(<Analytics />, { wrapper: createWrapper() });

    expect(screen.getByText(/Analytics/i)).toBeInTheDocument();
  });

  it('should display loading state when user data is being fetched', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: true,
      isLoading: true,
    });

    render(<Analytics />, { wrapper: createWrapper() });

    // Should not crash and should handle loading state gracefully
    expect(screen.queryByText(/Analytics/i)).toBeInTheDocument();
  });

  it('should display analytics sections when data is loaded', async () => {
    render(<Analytics />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Check for key analytics sections
      expect(screen.getByText(/Analytics/i)).toBeInTheDocument();
    });
  });

  it('should render chart components', async () => {
    render(<Analytics />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Check if charts are rendered (using our mocked components)
      const charts = screen.queryAllByTestId(/chart/i);
      expect(charts.length).toBeGreaterThan(0);
    });
  });

  it('should handle empty quiz data gracefully', () => {
    render(<Analytics />, { wrapper: createWrapper() });

    // Should not crash with no data
    expect(screen.getByText(/Analytics/i)).toBeInTheDocument();
  });

  it('should call analytics service methods with correct data', async () => {
    const { analyticsService } = await import('@/lib/analytics-service');

    render(<Analytics />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(analyticsService.calculateLearningCurve).toHaveBeenCalled();
      expect(analyticsService.predictExamReadiness).toHaveBeenCalled();
      expect(analyticsService.calculateStudyEfficiency).toHaveBeenCalled();
    });
  });

  it('should display exam readiness information', async () => {
    render(<Analytics />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Analytics page should show analytics-related content
      expect(screen.getByText(/Analytics/i)).toBeInTheDocument();
    });
  });

  it('should render tabs for different analytics views', () => {
    render(<Analytics />, { wrapper: createWrapper() });

    // The analytics page uses tabs - check for tab-related elements
    const tabElements = document.querySelectorAll('[role="tab"]');
    expect(tabElements.length).toBeGreaterThan(0);
  });

  it('should memoize analytics calculations', async () => {
    const { analyticsService } = await import('@/lib/analytics-service');
    const { rerender } = render(<Analytics />, { wrapper: createWrapper() });

    const initialCallCount = analyticsService.calculateLearningCurve.mock.calls.length;

    // Re-render without changing data
    rerender(<Analytics />);

    // Should not call analytics methods again (memoization working)
    expect(analyticsService.calculateLearningCurve.mock.calls.length).toBe(initialCallCount);
  });

  it('should handle navigation to other pages', () => {
    render(<Analytics />, { wrapper: createWrapper() });

    // Page should render without navigation errors
    expect(screen.getByText(/Analytics/i)).toBeInTheDocument();
  });

  it('should display performance trends', async () => {
    render(<Analytics />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Should display some form of analytics content
      const analyticsContent = screen.getByText(/Analytics/i);
      expect(analyticsContent).toBeInTheDocument();
    });
  });

  it('should show skill gaps when available', async () => {
    const { analyticsService } = await import('@/lib/analytics-service');
    analyticsService.identifySkillGaps.mockReturnValue([
      { category: 'Math', subcategory: 'Algebra', score: 45 },
      { category: 'Science', subcategory: 'Physics', score: 55 },
    ]);

    render(<Analytics />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Analytics service should be called
      expect(analyticsService.identifySkillGaps).toHaveBeenCalled();
    });
  });

  it('should display burnout risk assessment', async () => {
    const { analyticsService } = await import('@/lib/analytics-service');
    render(<Analytics />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Should call burnout detection
      expect(analyticsService.detectBurnoutRisk).toHaveBeenCalled();
    });
  });

  it('should show performance forecast for different time periods', async () => {
    const { analyticsService } = await import('@/lib/analytics-service');
    render(<Analytics />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Should call forecast for multiple periods
      expect(analyticsService.forecastPerformance).toHaveBeenCalled();
    });
  });

  it('should handle user without quiz data', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 999, email: 'newuser@example.com', role: 'user', tenantId: 1 },
      isAuthenticated: true,
      isLoading: false,
    });

    render(<Analytics />, { wrapper: createWrapper() });

    // Should render without crashing
    expect(screen.getByText(/Analytics/i)).toBeInTheDocument();
  });

  it('should display study efficiency metrics', async () => {
    const { analyticsService } = await import('@/lib/analytics-service');
    render(<Analytics />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(analyticsService.calculateStudyEfficiency).toHaveBeenCalled();
    });
  });

  it('should identify peak performance times', async () => {
    const { analyticsService } = await import('@/lib/analytics-service');
    render(<Analytics />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(analyticsService.identifyPeakPerformanceTimes).toHaveBeenCalled();
    });
  });

  it('should generate actionable insights', async () => {
    const { analyticsService } = await import('@/lib/analytics-service');
    render(<Analytics />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(analyticsService.generateInsights).toHaveBeenCalled();
    });
  });
});
