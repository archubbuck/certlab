/**
 * Unit tests for calendar grid generation logic
 * Ensures all months including December are properly generated
 */

import { describe, it, expect } from 'vitest';

describe('Calendar Grid Generation', () => {
  /**
   * Generate calendar grid for a given year
   * This is extracted from ContributionHeatmap component for testing
   */
  function generateCalendarGrid(selectedYear: number): Date[][] {
    const startDate = new Date(selectedYear, 0, 1); // January 1st
    const endDate = new Date(selectedYear, 11, 31); // December 31st

    // Adjust start date to the previous Sunday to align grid
    const startDay = startDate.getDay();
    if (startDay !== 0) {
      startDate.setDate(startDate.getDate() - startDay);
    }

    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate || currentWeek.length < 7) {
      currentWeek.push(new Date(currentDate));

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      currentDate.setDate(currentDate.getDate() + 1);

      // Stop if we've gone too far into the next year
      if (currentDate.getFullYear() > selectedYear && currentWeek.length === 0) {
        break;
      }
    }

    return weeks;
  }

  it('should generate calendar grid for 2025 with all 12 months', () => {
    const grid = generateCalendarGrid(2025);

    // Collect all unique months from the grid
    const months = new Set<number>();
    grid.forEach((week) => {
      week.forEach((date) => {
        if (date.getFullYear() === 2025) {
          months.add(date.getMonth());
        }
      });
    });

    // Should have all 12 months (0-11)
    expect(months.size).toBe(12);
    expect(Array.from(months).sort((a, b) => a - b)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ]);
  });

  it('should include December in the calendar grid for 2025', () => {
    const grid = generateCalendarGrid(2025);

    // Find all December dates
    const decemberDates: Date[] = [];
    grid.forEach((week) => {
      week.forEach((date) => {
        if (date.getMonth() === 11 && date.getFullYear() === 2025) {
          decemberDates.push(date);
        }
      });
    });

    // December has 31 days
    expect(decemberDates.length).toBe(31);

    // Check that all December dates from 1-31 are present
    const decemberDays = decemberDates.map((d) => d.getDate()).sort((a, b) => a - b);
    expect(decemberDays).toEqual(Array.from({ length: 31 }, (_, i) => i + 1));
  });

  it('should include December in mobile view (last 16 weeks) for 2025', () => {
    const grid = generateCalendarGrid(2025);
    const mobileGrid = grid.slice(-16);

    // Find December dates in mobile view
    const decemberDates: Date[] = [];
    mobileGrid.forEach((week) => {
      week.forEach((date) => {
        if (date.getMonth() === 11 && date.getFullYear() === 2025) {
          decemberDates.push(date);
        }
      });
    });

    // Mobile view should include all 31 days of December
    expect(decemberDates.length).toBe(31);
  });

  it('should generate December month label in mobile view for 2025', () => {
    const grid = generateCalendarGrid(2025);
    const mobileGrid = grid.slice(-16);

    // Generate month labels (same logic as component)
    const labels: { month: string; offset: number }[] = [];
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    let lastMonth = -1;
    mobileGrid.forEach((week, weekIndex) => {
      const firstDayOfWeek = week[0];
      const month = firstDayOfWeek.getMonth();

      if (month !== lastMonth && firstDayOfWeek.getFullYear() === 2025) {
        labels.push({
          month: months[month],
          offset: weekIndex,
        });
        lastMonth = month;
      }
    });

    // Should have December label
    const decemberLabel = labels.find((label) => label.month === 'Dec');
    expect(decemberLabel).toBeDefined();
    expect(decemberLabel?.month).toBe('Dec');
  });

  it('should include December weeks at correct positions in mobile view', () => {
    const grid = generateCalendarGrid(2025);
    const mobileGrid = grid.slice(-16);

    // Check that December appears in the expected week positions
    const weeksWithDecember = mobileGrid
      .map((week, index) => ({
        index,
        hasDecember: week.some((date) => date.getMonth() === 11 && date.getFullYear() === 2025),
      }))
      .filter((week) => week.hasDecember);

    // December should appear in multiple weeks (partial weeks at boundaries)
    expect(weeksWithDecember.length).toBeGreaterThan(0);

    // Based on 2025 calendar, December should be in weeks 11-15 of mobile view
    const decemberWeekIndices = weeksWithDecember.map((w) => w.index);
    expect(decemberWeekIndices).toContain(11); // Week starting Nov 30 (partial Dec)
    expect(decemberWeekIndices).toContain(12); // Week starting Dec 7
    expect(decemberWeekIndices).toContain(13); // Week starting Dec 14
    expect(decemberWeekIndices).toContain(14); // Week starting Dec 21
    expect(decemberWeekIndices).toContain(15); // Week starting Dec 28 (partial Dec)
  });
});
