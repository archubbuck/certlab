import { describe, it, expect } from 'vitest';
import { gradeQuestion, parseAnswer } from './quiz-grading';
import type { Question } from '@shared/schema';

describe('Quiz Grading', () => {
  describe('Multiple Choice Single', () => {
    const question: Partial<Question> = {
      id: 1,
      questionType: 'multiple_choice_single',
      options: [
        { id: 0, text: 'Option A' },
        { id: 1, text: 'Option B' },
        { id: 2, text: 'Option C' },
      ],
      correctAnswer: 1,
    };

    it('should grade correct answer as correct', () => {
      const result = gradeQuestion(question as Question, 1);
      expect(result.isCorrect).toBe(true);
    });

    it('should grade incorrect answer as incorrect', () => {
      const result = gradeQuestion(question as Question, 0);
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('Multiple Choice Multiple', () => {
    const question: Partial<Question> = {
      id: 2,
      questionType: 'multiple_choice_multiple',
      options: [
        { id: 0, text: 'Option A' },
        { id: 1, text: 'Option B' },
        { id: 2, text: 'Option C' },
        { id: 3, text: 'Option D' },
      ],
      correctAnswers: [1, 2],
    };

    it('should grade all correct answers as correct', () => {
      const result = gradeQuestion(question as Question, [1, 2]);
      expect(result.isCorrect).toBe(true);
    });

    it('should grade partial answers as incorrect', () => {
      const result = gradeQuestion(question as Question, [1]);
      expect(result.isCorrect).toBe(false);
    });

    it('should grade extra answers as incorrect', () => {
      const result = gradeQuestion(question as Question, [0, 1, 2]);
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('True/False', () => {
    const question: Partial<Question> = {
      id: 3,
      questionType: 'true_false',
      options: [
        { id: 0, text: 'True' },
        { id: 1, text: 'False' },
      ],
      correctAnswer: 0,
    };

    it('should grade correct answer as correct', () => {
      const result = gradeQuestion(question as Question, 0);
      expect(result.isCorrect).toBe(true);
    });

    it('should grade incorrect answer as incorrect', () => {
      const result = gradeQuestion(question as Question, 1);
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('Fill in the Blank', () => {
    const question: Partial<Question> = {
      id: 4,
      questionType: 'fill_in_blank',
      acceptedAnswers: ['Paris', 'paris'],
    };

    it('should grade exact match as correct', () => {
      const result = gradeQuestion(question as Question, 'Paris');
      expect(result.isCorrect).toBe(true);
    });

    it('should be case-insensitive', () => {
      const result = gradeQuestion(question as Question, 'PARIS');
      expect(result.isCorrect).toBe(true);
    });

    it('should trim whitespace', () => {
      const result = gradeQuestion(question as Question, '  Paris  ');
      expect(result.isCorrect).toBe(true);
    });

    it('should grade incorrect answer as incorrect', () => {
      const result = gradeQuestion(question as Question, 'London');
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('Short Answer', () => {
    it('should flag manual grading questions', () => {
      const question: Partial<Question> = {
        id: 5,
        questionType: 'short_answer',
        requiresManualGrading: true,
      };

      const result = gradeQuestion(question as Question, 'Any answer');
      expect(result.isCorrect).toBe(false);
      expect(result.details).toContain('manual grading');
    });
  });

  describe('Matching', () => {
    const question: Partial<Question> = {
      id: 6,
      questionType: 'matching',
      matchingPairs: [
        { id: 0, left: 'Cat', right: 'Meow' },
        { id: 1, left: 'Dog', right: 'Bark' },
        { id: 2, left: 'Cow', right: 'Moo' },
      ],
    };

    it('should grade all correct matches as correct', () => {
      const userAnswer = {
        0: 0, // Cat -> Meow (pair id 0)
        1: 1, // Dog -> Bark (pair id 1)
        2: 2, // Cow -> Moo (pair id 2)
      };
      const result = gradeQuestion(question as Question, userAnswer);
      expect(result.isCorrect).toBe(true);
    });

    it('should grade incorrect matches as incorrect', () => {
      const userAnswer = {
        0: 1, // Cat -> Bark (wrong)
        1: 0, // Dog -> Meow (wrong)
        2: 2, // Cow -> Moo (correct)
      };
      const result = gradeQuestion(question as Question, userAnswer);
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('Ordering', () => {
    const question: Partial<Question> = {
      id: 7,
      questionType: 'ordering',
      orderingItems: [
        { id: 0, text: 'First', correctPosition: 0 },
        { id: 1, text: 'Second', correctPosition: 1 },
        { id: 2, text: 'Third', correctPosition: 2 },
      ],
    };

    it('should grade correct order as correct', () => {
      const result = gradeQuestion(question as Question, [0, 1, 2]);
      expect(result.isCorrect).toBe(true);
    });

    it('should grade incorrect order as incorrect', () => {
      const result = gradeQuestion(question as Question, [2, 1, 0]);
      expect(result.isCorrect).toBe(false);
    });

    it('should grade partially correct order as incorrect', () => {
      const result = gradeQuestion(question as Question, [0, 2, 1]);
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('parseAnswer', () => {
    it('should parse numeric answers for MCQ single', () => {
      const result = parseAnswer('2', 'multiple_choice_single');
      expect(result).toBe(2);
    });

    it('should keep text for fill-in-blank', () => {
      const result = parseAnswer('Paris', 'fill_in_blank');
      expect(result).toBe('Paris');
    });

    it('should parse JSON for complex types', () => {
      const result = parseAnswer('[1, 2, 3]', 'multiple_choice_multiple');
      expect(result).toEqual([1, 2, 3]);
    });

    it('should return string if JSON parsing fails', () => {
      const result = parseAnswer('not json', 'unknown_type');
      expect(result).toBe('not json');
    });
  });
});
