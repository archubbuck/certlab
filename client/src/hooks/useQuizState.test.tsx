/**
 * Unit tests for useQuizState hook
 *
 * Tests quiz state management, answer selection, navigation, and submission
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import * as React from 'react';
import type { Quiz, Question } from '@/components/quiz/types';

// Mock the dependencies
vi.mock('wouter', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ['/quiz/1', vi.fn()],
}));

vi.mock('@/lib/storage-factory', () => ({
  storage: {
    submitQuizAttempt: vi.fn(),
  },
}));

vi.mock('@/lib/achievement-service', () => ({
  achievementService: {
    checkAchievements: vi.fn(),
  },
}));

vi.mock('@/lib/gamification-service', () => ({
  gamificationService: {
    awardPoints: vi.fn(),
  },
}));

vi.mock('@/components/Celebration', () => ({
  triggerCelebration: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@/lib/quiz-grading', () => ({
  gradeQuestion: vi.fn((question, answer) => ({
    correct: answer === 'A',
    feedback: 'Test feedback',
  })),
  parseAnswer: vi.fn((answer) => answer),
}));

// Import after mocks
import { useQuizState } from './useQuizState';

describe('useQuizState', () => {
  const mockQuestions: Question[] = [
    {
      id: 1,
      questionText: 'Question 1?',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'A',
      explanation: 'Explanation 1',
      difficulty: 'easy',
      category: 'Test Category',
      subcategory: 'Test Subcategory',
      tenantId: 1,
      tags: [],
    },
    {
      id: 2,
      questionText: 'Question 2?',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'B',
      explanation: 'Explanation 2',
      difficulty: 'medium',
      category: 'Test Category',
      subcategory: 'Test Subcategory',
      tenantId: 1,
      tags: [],
    },
    {
      id: 3,
      questionText: 'Question 3?',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'C',
      explanation: 'Explanation 3',
      difficulty: 'hard',
      category: 'Test Category',
      subcategory: 'Test Subcategory',
      tenantId: 1,
      tags: [],
    },
  ];

  const mockQuiz: Quiz = {
    id: 1,
    userId: 1,
    title: 'Test Quiz',
    description: 'Test description',
    categoryId: 1,
    subcategoryId: 1,
    questionIds: [1, 2, 3],
    timeLimit: 60,
    passingScore: 70,
    tenantId: 1,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  function createWrapper() {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    return function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(
      () => useQuizState({ quizId: 1, quiz: mockQuiz, questions: mockQuestions }),
      { wrapper: createWrapper() }
    );

    expect(result.current.state.currentQuestionIndex).toBe(0);
    expect(result.current.state.answers).toEqual({});
    expect(result.current.state.flaggedQuestions).toEqual([]);
    expect(result.current.state.submitted).toBe(false);
  });

  it('should return the current question', () => {
    const { result } = renderHook(
      () => useQuizState({ quizId: 1, quiz: mockQuiz, questions: mockQuestions }),
      { wrapper: createWrapper() }
    );

    expect(result.current.currentQuestion).toEqual(mockQuestions[0]);
  });

  it('should calculate progress correctly', () => {
    const { result } = renderHook(
      () => useQuizState({ quizId: 1, quiz: mockQuiz, questions: mockQuestions }),
      { wrapper: createWrapper() }
    );

    // Initial progress: 0% (0 of 3 questions answered)
    expect(result.current.progress).toBe(0);
  });

  it('should handle answer change', () => {
    const { result } = renderHook(
      () => useQuizState({ quizId: 1, quiz: mockQuiz, questions: mockQuestions }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.handleAnswerChange(1, 'A');
    });

    expect(result.current.state.answers[1]).toBe('A');
  });

  it('should navigate to next question', () => {
    const { result } = renderHook(
      () => useQuizState({ quizId: 1, quiz: mockQuiz, questions: mockQuestions }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.handleNextQuestion();
    });

    expect(result.current.state.currentQuestionIndex).toBe(1);
    expect(result.current.currentQuestion).toEqual(mockQuestions[1]);
  });

  it('should navigate to previous question', () => {
    const { result } = renderHook(
      () => useQuizState({ quizId: 1, quiz: mockQuiz, questions: mockQuestions }),
      { wrapper: createWrapper() }
    );

    // Move to second question first
    act(() => {
      result.current.handleNextQuestion();
    });

    expect(result.current.state.currentQuestionIndex).toBe(1);

    // Move back to first question
    act(() => {
      result.current.handlePreviousQuestion();
    });

    expect(result.current.state.currentQuestionIndex).toBe(0);
  });

  it('should not go below first question', () => {
    const { result } = renderHook(
      () => useQuizState({ quizId: 1, quiz: mockQuiz, questions: mockQuestions }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.handlePreviousQuestion();
    });

    expect(result.current.state.currentQuestionIndex).toBe(0);
  });

  it('should not go beyond last question', () => {
    const { result } = renderHook(
      () => useQuizState({ quizId: 1, quiz: mockQuiz, questions: mockQuestions }),
      { wrapper: createWrapper() }
    );

    // Move to last question
    act(() => {
      result.current.handleNextQuestion();
      result.current.handleNextQuestion();
      result.current.handleNextQuestion();
    });

    expect(result.current.state.currentQuestionIndex).toBe(2);
  });

  it('should flag a question for review', () => {
    const { result } = renderHook(
      () => useQuizState({ quizId: 1, quiz: mockQuiz, questions: mockQuestions }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.handleFlagQuestion(1);
    });

    expect(result.current.state.flaggedQuestions).toContain(1);
  });

  it('should unflag a previously flagged question', () => {
    const { result } = renderHook(
      () => useQuizState({ quizId: 1, quiz: mockQuiz, questions: mockQuestions }),
      { wrapper: createWrapper() }
    );

    // Flag the question
    act(() => {
      result.current.handleFlagQuestion(1);
    });

    expect(result.current.state.flaggedQuestions).toContain(1);

    // Unflag the question
    act(() => {
      result.current.handleFlagQuestion(1);
    });

    expect(result.current.state.flaggedQuestions).not.toContain(1);
  });

  it('should jump to a specific question', () => {
    const { result } = renderHook(
      () => useQuizState({ quizId: 1, quiz: mockQuiz, questions: mockQuestions }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.handleGoToQuestion(2);
    });

    expect(result.current.state.currentQuestionIndex).toBe(2);
    expect(result.current.currentQuestion).toEqual(mockQuestions[2]);
  });

  it('should calculate answered questions count', () => {
    const { result } = renderHook(
      () => useQuizState({ quizId: 1, quiz: mockQuiz, questions: mockQuestions }),
      { wrapper: createWrapper() }
    );

    // Answer two questions
    act(() => {
      result.current.handleAnswerChange(1, 'A');
      result.current.handleAnswerChange(2, 'B');
    });

    expect(result.current.answeredCount).toBe(2);
  });

  it('should handle time remaining countdown', () => {
    vi.useFakeTimers();

    const { result } = renderHook(
      () => useQuizState({ quizId: 1, quiz: mockQuiz, questions: mockQuestions }),
      { wrapper: createWrapper() }
    );

    const initialTime = result.current.timeRemaining;

    // Fast-forward time by 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.timeRemaining).toBeLessThan(initialTime);

    vi.useRealTimers();
  });

  it('should calculate unanswered questions', () => {
    const { result } = renderHook(
      () => useQuizState({ quizId: 1, quiz: mockQuiz, questions: mockQuestions }),
      { wrapper: createWrapper() }
    );

    // Answer only first question
    act(() => {
      result.current.handleAnswerChange(1, 'A');
    });

    expect(result.current.unansweredQuestions).toHaveLength(2);
  });

  it('should handle quiz submission', async () => {
    const { result } = renderHook(
      () => useQuizState({ quizId: 1, quiz: mockQuiz, questions: mockQuestions }),
      { wrapper: createWrapper() }
    );

    // Answer all questions
    act(() => {
      result.current.handleAnswerChange(1, 'A');
      result.current.handleAnswerChange(2, 'B');
      result.current.handleAnswerChange(3, 'C');
    });

    // Submit quiz
    act(() => {
      result.current.handleSubmitQuiz();
    });

    await waitFor(() => {
      expect(result.current.state.submitted).toBe(true);
    });
  });

  it('should not allow changes after submission', () => {
    const { result } = renderHook(
      () => useQuizState({ quizId: 1, quiz: mockQuiz, questions: mockQuestions }),
      { wrapper: createWrapper() }
    );

    // Answer a question
    act(() => {
      result.current.handleAnswerChange(1, 'A');
    });

    // Submit quiz
    act(() => {
      result.current.handleSubmitQuiz();
    });

    // Try to change answer after submission
    act(() => {
      result.current.handleAnswerChange(1, 'B');
    });

    // Answer should remain unchanged
    expect(result.current.state.answers[1]).toBe('A');
  });
});
