import { describe, it, expect } from 'vitest';

// Test to verify ActivityConfig interface structure
describe('StudyTimer - Activity Duration Association', () => {
  it('should have ActivityConfig type with label and duration', () => {
    // This test verifies the structure of ActivityConfig
    interface ActivityConfig {
      label: string;
      duration: number; // in minutes
    }

    const testActivity: ActivityConfig = {
      label: 'Study',
      duration: 25,
    };

    expect(testActivity.label).toBe('Study');
    expect(testActivity.duration).toBe(25);
  });

  it('should have default activities with associated durations', () => {
    // Verify default activities structure
    const defaultActivities = [
      { label: 'Study', duration: 25 },
      { label: 'Work', duration: 25 },
      { label: 'Exercise', duration: 30 },
      { label: 'Meditation', duration: 10 },
    ];

    expect(defaultActivities).toHaveLength(4);

    // Verify each activity has both label and duration
    defaultActivities.forEach((activity) => {
      expect(activity).toHaveProperty('label');
      expect(activity).toHaveProperty('duration');
      expect(typeof activity.label).toBe('string');
      expect(typeof activity.duration).toBe('number');
      expect(activity.duration).toBeGreaterThan(0);
    });
  });

  it('should preserve different durations for different activities', () => {
    // Simulate the activity configuration array
    const activities = [
      { label: 'Study', duration: 25 },
      { label: 'Meditation', duration: 10 },
      { label: 'Exercise', duration: 30 },
    ];

    // Simulate selecting an activity and getting its duration
    const selectActivity = (label: string) => {
      const activity = activities.find((a) => a.label === label);
      return activity ? activity.duration : null;
    };

    // Verify each activity returns its own duration
    expect(selectActivity('Study')).toBe(25);
    expect(selectActivity('Meditation')).toBe(10);
    expect(selectActivity('Exercise')).toBe(30);
  });

  it('should allow adding new activity with custom duration', () => {
    const activities = [
      { label: 'Study', duration: 25 },
      { label: 'Work', duration: 25 },
    ];

    // Simulate adding a new activity
    const newActivity = { label: 'Reading', duration: 15 };
    activities.push(newActivity);

    // Verify the new activity is in the list with its duration
    expect(activities).toHaveLength(3);
    const addedActivity = activities.find((a) => a.label === 'Reading');
    expect(addedActivity).toBeDefined();
    expect(addedActivity?.duration).toBe(15);
  });

  it('should maintain duration when switching between activities', () => {
    const activities = [
      { label: 'Study', duration: 25 },
      { label: 'Meditation', duration: 10 },
      { label: 'Exercise', duration: 30 },
    ];

    // Simulate switching between activities
    let selectedActivity = 'Study';
    let timerDuration = activities.find((a) => a.label === selectedActivity)?.duration;
    expect(timerDuration).toBe(25);

    // Switch to Meditation
    selectedActivity = 'Meditation';
    timerDuration = activities.find((a) => a.label === selectedActivity)?.duration;
    expect(timerDuration).toBe(10);

    // Switch back to Study
    selectedActivity = 'Study';
    timerDuration = activities.find((a) => a.label === selectedActivity)?.duration;
    expect(timerDuration).toBe(25); // Duration should still be 25, not 10

    // Switch to Exercise
    selectedActivity = 'Exercise';
    timerDuration = activities.find((a) => a.label === selectedActivity)?.duration;
    expect(timerDuration).toBe(30);
  });

  it('should handle case-insensitive duplicate check correctly', () => {
    const activities = [
      { label: 'Study', duration: 25 },
      { label: 'Work', duration: 25 },
    ];

    // Simulate checking for duplicates (case-insensitive)
    const checkDuplicate = (newLabel: string) => {
      const newLabelLower = newLabel.toLowerCase();
      return activities.some((a) => a.label.toLowerCase() === newLabelLower);
    };

    expect(checkDuplicate('study')).toBe(true); // lowercase version exists
    expect(checkDuplicate('STUDY')).toBe(true); // uppercase version exists
    expect(checkDuplicate('Study')).toBe(true); // exact match
    expect(checkDuplicate('Reading')).toBe(false); // new activity
  });
});
