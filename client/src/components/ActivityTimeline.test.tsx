import { describe, it, expect } from 'vitest';
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
    const completedSessions = sessions.filter((s) => s.completedAt);

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
      .filter((s) => s.completedAt)
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
      .filter((s) => s.completedAt)
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
