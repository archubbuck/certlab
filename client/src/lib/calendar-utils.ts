/**
 * Calendar grid generation utility for activity heatmaps
 * Generates a weekly grid for a given year, aligned to Sunday-Saturday weeks
 */

export const MONTH_NAMES = [
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
] as const;

/**
 * Generate calendar grid for a given year
 * @param selectedYear - The year to generate the calendar for
 * @returns Array of weeks, where each week is an array of 7 dates (Sunday-Saturday)
 */
export function generateCalendarGrid(selectedYear: number): Date[][] {
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

/**
 * Generate month labels for a calendar grid
 * @param calendarGrid - The full calendar grid
 * @param selectedYear - The year being displayed
 * @returns Array of month labels with their offsets
 */
export function generateMonthLabels(
  calendarGrid: Date[][],
  selectedYear: number
): Array<{ month: string; offset: number }> {
  const labels: { month: string; offset: number }[] = [];

  let lastMonth = -1;
  calendarGrid.forEach((week, weekIndex) => {
    const firstDayOfWeek = week[0];
    const month = firstDayOfWeek.getMonth();

    if (month !== lastMonth && firstDayOfWeek.getFullYear() === selectedYear) {
      labels.push({
        month: MONTH_NAMES[month],
        offset: weekIndex,
      });
      lastMonth = month;
    }
  });

  return labels;
}
