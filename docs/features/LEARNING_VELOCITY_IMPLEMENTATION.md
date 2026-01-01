# Learning Velocity Chart - Implementation Documentation

## Overview
The Learning Velocity chart on the dashboard displays daily experience (XP) earned by users over the **last 10 days** (rolling window).

## Problem Solved
Previously, the chart displayed hardcoded percentage values `[20, 35, 45, 60, 70, 75, 80]` that did not reflect actual user activity. This has been fixed to display real experience points earned from quiz completions.

## Current Implementation (Updated)

### Time Window
- **Period**: Last 10 days (rolling window)
- **Calculation**: From (today - 9 days) to today
- **Index**: Array[0] = 9 days ago, Array[9] = today
- **Default**: Days with no activity show 0 XP

### Experience Point Calculation
Experience points are awarded for quiz completion using the same system as `achievement-service.ts`:

| Activity | XP Earned |
|----------|-----------|
| Quiz Completion (base) | 10 XP |
| Each Correct Answer | 5 XP |
| Passing Score (≥85%) | 25 XP bonus |
| Perfect Score (100%) | 50 XP bonus |

### Example Calculations

**Example 1: Failed Quiz (5/10 correct, 50% score)**
- Base: 10 XP
- Correct answers: 5 × 5 = 25 XP
- **Total: 35 XP**

**Example 2: Passing Quiz (9/10 correct, 90% score)**
- Base: 10 XP
- Correct answers: 9 × 5 = 45 XP
- Passing bonus: 25 XP
- **Total: 80 XP**

**Example 3: Perfect Quiz (10/10 correct, 100% score)**
- Base: 10 XP
- Correct answers: 10 × 5 = 50 XP
- Passing bonus: 25 XP
- Perfect score bonus: 50 XP
- **Total: 135 XP**

### Chart Display

The chart displays 10 bars representing the last 10 days:

```
Y-axis: Actual XP values (scaled to max daily XP)
X-axis: Date labels in M/D format (e.g., 1/1, 1/2, 1/10)

Example visualization for 10 days:
Max: 135 XP
     ┌──────────────────────────────────────────────────────┐
 135 │                                  █                   │
 100 │                                  █           █       │
  75 │                                  █     █     █       │
  50 │              █     █             █     █     █       │
  25 │      █       █     █             █     █     █       │
   0 └──────────────────────────────────────────────────────┘
      1/1  1/2  1/3  1/4  1/5  1/6  1/7  1/8  1/9  1/10
```

### Features

1. **Dynamic Scaling**: Y-axis automatically scales based on the maximum XP earned in any single day
2. **Hover Tooltips**: Hovering over a bar shows the exact XP value for that day
3. **Zero Handling**: Days with no activity show 0 XP (no bar displayed)
4. **Rolling Window**: Shows the last 10 days (today - 9 days to today)
5. **Date Labels**: X-axis shows actual dates in M/D format for clarity

### Code Location

- **Main Implementation**: `client/src/pages/dashboard.tsx` (lines 314-392)
- **Chart Rendering**: `client/src/pages/dashboard.tsx` (lines 494-556)
- **Test Suite**: `client/src/pages/dashboard.test.tsx`

### Testing

The implementation includes 9 comprehensive tests covering:
- Point calculation for various quiz scenarios
- Daily aggregation logic for 10-day window
- Scaling and percentage conversion
- Edge cases (empty data, zero values)

Run tests with:
```bash
npm run test:run -- dashboard.test.tsx
```

## Update History

### Version 2.0 (Current) - 10-Day Rolling Window
- **Changed**: Time window from current week to last 10 days
- **Changed**: X-axis labels from day names to date format (M/D)
- **Changed**: Array size from 7 to 10 elements
- **Improved**: Better visibility of activity patterns over time
- **Improved**: No dependency on week boundaries

### Version 1.0 - Current Week Display
- Initial implementation with Monday-Sunday display
- Week-based calculation
- Day name labels (Mon, Tue, Wed, etc.)

## Future Enhancements

Possible improvements for future iterations:
1. Show XP breakdown on click (base + correct + bonuses)
2. Add comparison to previous week
3. Display goal/target XP per day
4. Add animation when bars update
5. Show detailed analytics on hover (quizzes completed, accuracy, etc.)
