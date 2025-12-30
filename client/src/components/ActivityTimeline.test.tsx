import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActivityTimeline } from './ActivityTimeline';
import type { StudyTimerSession } from '@shared/schema';

describe('Activity Timer - Activity Label Feature', () => {
  it('should include activityLabel field in StudyTimerSession type', () => {
    // This test verifies that the TypeScript type includes the new activityLabel field
    const mockSession: StudyTimerSession = {
      id: 1,
      userId: 'test-user',
      tenantId: 1,
      sessionType: 'work',
      activityLabel: 'Meditation',
      duration: 25,
      startedAt: new Date(),
      completedAt: null,
      isCompleted: false,
      isPaused: false,
      pausedAt: null,
      totalPausedTime: 0,
      categoryId: null,
      notes: null,
    };

    expect(mockSession.activityLabel).toBe('Meditation');
  });

  it('should allow null activityLabel for backward compatibility', () => {
    const legacySession: StudyTimerSession = {
      id: 2,
      userId: 'test-user',
      tenantId: 1,
      sessionType: 'work',
      activityLabel: null,
      duration: 25,
      startedAt: new Date(),
      completedAt: new Date(),
      isCompleted: true,
      isPaused: false,
      pausedAt: null,
      totalPausedTime: 0,
      categoryId: null,
      notes: null,
    };

    expect(legacySession.activityLabel).toBeNull();
  });

  it('should filter completed sessions correctly', () => {
    const sessions: StudyTimerSession[] = [
      {
        id: 1,
        userId: 'test-user',
        tenantId: 1,
        sessionType: 'work',
        activityLabel: 'Meditation',
        duration: 25,
        startedAt: new Date('2024-01-01T10:00:00'),
        completedAt: new Date('2024-01-01T10:25:00'),
        isCompleted: true,
        isPaused: false,
        pausedAt: null,
        totalPausedTime: 0,
        categoryId: null,
        notes: null,
      },
      {
        id: 2,
        userId: 'test-user',
        tenantId: 1,
        sessionType: 'work',
        activityLabel: 'Study',
        duration: 25,
        startedAt: new Date('2024-01-01T11:00:00'),
        completedAt: null, // Not completed
        isCompleted: false,
        isPaused: false,
        pausedAt: null,
        totalPausedTime: 0,
        categoryId: null,
        notes: null,
      },
      {
        id: 3,
        userId: 'test-user',
        tenantId: 1,
        sessionType: 'work',
        activityLabel: 'Exercise',
        duration: 30,
        startedAt: new Date('2024-01-01T12:00:00'),
        completedAt: new Date('2024-01-01T12:30:00'),
        isCompleted: true,
        isPaused: false,
        pausedAt: null,
        totalPausedTime: 0,
        categoryId: null,
        notes: null,
      },
    ];

    // Filter logic from ActivityTimeline component
    const completedSessions = sessions.filter((s) => s.isCompleted && s.completedAt);

    expect(completedSessions).toHaveLength(2);
    expect(completedSessions[0].activityLabel).toBe('Meditation');
    expect(completedSessions[1].activityLabel).toBe('Exercise');
  });

  it('should sort sessions by completedAt date descending', () => {
    const sessions: StudyTimerSession[] = [
      {
        id: 1,
        userId: 'test-user',
        tenantId: 1,
        sessionType: 'work',
        activityLabel: 'First',
        duration: 25,
        startedAt: new Date('2024-01-01T10:00:00'),
        completedAt: new Date('2024-01-01T10:25:00'),
        isCompleted: true,
        isPaused: false,
        pausedAt: null,
        totalPausedTime: 0,
        categoryId: null,
        notes: null,
      },
      {
        id: 2,
        userId: 'test-user',
        tenantId: 1,
        sessionType: 'work',
        activityLabel: 'Last',
        duration: 25,
        startedAt: new Date('2024-01-01T13:00:00'),
        completedAt: new Date('2024-01-01T13:25:00'),
        isCompleted: true,
        isPaused: false,
        pausedAt: null,
        totalPausedTime: 0,
        categoryId: null,
        notes: null,
      },
      {
        id: 3,
        userId: 'test-user',
        tenantId: 1,
        sessionType: 'work',
        activityLabel: 'Middle',
        duration: 25,
        startedAt: new Date('2024-01-01T11:00:00'),
        completedAt: new Date('2024-01-01T11:25:00'),
        isCompleted: true,
        isPaused: false,
        pausedAt: null,
        totalPausedTime: 0,
        categoryId: null,
        notes: null,
      },
    ];

    // Sort logic from ActivityTimeline component
    const sortedSessions = sessions
      .filter((s) => s.isCompleted && s.completedAt)
      .sort((a, b) => {
        const dateA = new Date(a.completedAt!).getTime();
        const dateB = new Date(b.completedAt!).getTime();
        return dateB - dateA;
      });

    expect(sortedSessions[0].activityLabel).toBe('Last');
    expect(sortedSessions[1].activityLabel).toBe('Middle');
    expect(sortedSessions[2].activityLabel).toBe('First');
  });

  it('should limit timeline to 5 most recent sessions', () => {
    const sessions: StudyTimerSession[] = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      userId: 'test-user',
      tenantId: 1,
      sessionType: 'work',
      activityLabel: `Activity ${i + 1}`,
      duration: 25,
      startedAt: new Date(`2024-01-01T${10 + i}:00:00`),
      completedAt: new Date(`2024-01-01T${10 + i}:25:00`),
      isCompleted: true,
      isPaused: false,
      pausedAt: null,
      totalPausedTime: 0,
      categoryId: null,
      notes: null,
    }));

    // Timeline logic
    const recentSessions = sessions
      .filter((s) => s.isCompleted && s.completedAt)
      .sort((a, b) => {
        const dateA = new Date(a.completedAt!).getTime();
        const dateB = new Date(b.completedAt!).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);

    expect(recentSessions).toHaveLength(5);
    expect(recentSessions[0].activityLabel).toBe('Activity 10');
    expect(recentSessions[4].activityLabel).toBe('Activity 6');
  });
});

describe('ActivityTimeline Component Rendering', () => {
  it('should render empty state when no sessions exist', () => {
    render(<ActivityTimeline sessions={[]} />);

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('No completed activities yet')).toBeInTheDocument();
    expect(
      screen.getByText('Complete your first timer session to see it here')
    ).toBeInTheDocument();
  });

  it('should render completed sessions with custom labels', () => {
    const sessions: StudyTimerSession[] = [
      {
        id: 1,
        userId: 'test-user',
        tenantId: 1,
        sessionType: 'work',
        activityLabel: 'Meditation',
        duration: 25,
        startedAt: new Date('2024-01-01T10:00:00'),
        completedAt: new Date('2024-01-01T10:25:00'),
        isCompleted: true,
        isPaused: false,
        pausedAt: null,
        totalPausedTime: 0,
        categoryId: null,
        notes: null,
      },
      {
        id: 2,
        userId: 'test-user',
        tenantId: 1,
        sessionType: 'work',
        activityLabel: 'Exercise',
        duration: 30,
        startedAt: new Date('2024-01-01T11:00:00'),
        completedAt: new Date('2024-01-01T11:30:00'),
        isCompleted: true,
        isPaused: false,
        pausedAt: null,
        totalPausedTime: 0,
        categoryId: null,
        notes: null,
      },
    ];

    render(<ActivityTimeline sessions={sessions} />);

    expect(screen.getByText('Meditation')).toBeInTheDocument();
    expect(screen.getByText('Exercise')).toBeInTheDocument();
  });

  it('should display default labels for sessions without custom labels', () => {
    const sessions: StudyTimerSession[] = [
      {
        id: 1,
        userId: 'test-user',
        tenantId: 1,
        sessionType: 'work',
        activityLabel: null,
        duration: 25,
        startedAt: new Date('2024-01-01T10:00:00'),
        completedAt: new Date('2024-01-01T10:25:00'),
        isCompleted: true,
        isPaused: false,
        pausedAt: null,
        totalPausedTime: 0,
        categoryId: null,
        notes: null,
      },
      {
        id: 2,
        userId: 'test-user',
        tenantId: 1,
        sessionType: 'break',
        activityLabel: null,
        duration: 5,
        startedAt: new Date('2024-01-01T11:00:00'),
        completedAt: new Date('2024-01-01T11:05:00'),
        isCompleted: true,
        isPaused: false,
        pausedAt: null,
        totalPausedTime: 0,
        categoryId: null,
        notes: null,
      },
      {
        id: 3,
        userId: 'test-user',
        tenantId: 1,
        sessionType: 'long_break',
        activityLabel: null,
        duration: 15,
        startedAt: new Date('2024-01-01T12:00:00'),
        completedAt: new Date('2024-01-01T12:15:00'),
        isCompleted: true,
        isPaused: false,
        pausedAt: null,
        totalPausedTime: 0,
        categoryId: null,
        notes: null,
      },
    ];

    render(<ActivityTimeline sessions={sessions} />);

    expect(screen.getByText('Work Session')).toBeInTheDocument();
    expect(screen.getByText('Short Break')).toBeInTheDocument();
    expect(screen.getByText('Long Break')).toBeInTheDocument();
  });

  it('should format durations correctly', () => {
    const sessions: StudyTimerSession[] = [
      {
        id: 1,
        userId: 'test-user',
        tenantId: 1,
        sessionType: 'work',
        activityLabel: 'Short Session',
        duration: 25,
        startedAt: new Date('2024-01-01T10:00:00'),
        completedAt: new Date('2024-01-01T10:25:00'),
        isCompleted: true,
        isPaused: false,
        pausedAt: null,
        totalPausedTime: 0,
        categoryId: null,
        notes: null,
      },
      {
        id: 2,
        userId: 'test-user',
        tenantId: 1,
        sessionType: 'work',
        activityLabel: 'Long Session',
        duration: 90,
        startedAt: new Date('2024-01-01T11:00:00'),
        completedAt: new Date('2024-01-01T12:30:00'),
        isCompleted: true,
        isPaused: false,
        pausedAt: null,
        totalPausedTime: 0,
        categoryId: null,
        notes: null,
      },
    ];

    render(<ActivityTimeline sessions={sessions} />);

    // Check for formatted durations in the document
    expect(screen.getByText(/25m/)).toBeInTheDocument();
    expect(screen.getByText(/1h 30m/)).toBeInTheDocument();
  });

  it('should not display incomplete sessions', () => {
    const sessions: StudyTimerSession[] = [
      {
        id: 1,
        userId: 'test-user',
        tenantId: 1,
        sessionType: 'work',
        activityLabel: 'Completed',
        duration: 25,
        startedAt: new Date('2024-01-01T10:00:00'),
        completedAt: new Date('2024-01-01T10:25:00'),
        isCompleted: true,
        isPaused: false,
        pausedAt: null,
        totalPausedTime: 0,
        categoryId: null,
        notes: null,
      },
      {
        id: 2,
        userId: 'test-user',
        tenantId: 1,
        sessionType: 'work',
        activityLabel: 'Incomplete',
        duration: 25,
        startedAt: new Date('2024-01-01T11:00:00'),
        completedAt: null,
        isCompleted: false,
        isPaused: false,
        pausedAt: null,
        totalPausedTime: 0,
        categoryId: null,
        notes: null,
      },
    ];

    render(<ActivityTimeline sessions={sessions} />);

    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.queryByText('Incomplete')).not.toBeInTheDocument();
  });

  it('should limit display to 5 most recent sessions', () => {
    const sessions: StudyTimerSession[] = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      userId: 'test-user',
      tenantId: 1,
      sessionType: 'work',
      activityLabel: `Activity ${i + 1}`,
      duration: 25,
      startedAt: new Date(`2024-01-01T${10 + i}:00:00`),
      completedAt: new Date(`2024-01-01T${10 + i}:25:00`),
      isCompleted: true,
      isPaused: false,
      pausedAt: null,
      totalPausedTime: 0,
      categoryId: null,
      notes: null,
    }));

    render(<ActivityTimeline sessions={sessions} />);

    // Should show the 5 most recent (Activity 10, 9, 8, 7, 6)
    expect(screen.getByText('Activity 10')).toBeInTheDocument();
    expect(screen.getByText('Activity 9')).toBeInTheDocument();
    expect(screen.getByText('Activity 8')).toBeInTheDocument();
    expect(screen.getByText('Activity 7')).toBeInTheDocument();
    expect(screen.getByText('Activity 6')).toBeInTheDocument();

    // Should not show older sessions
    expect(screen.queryByText('Activity 5')).not.toBeInTheDocument();
    expect(screen.queryByText('Activity 1')).not.toBeInTheDocument();
  });
});
