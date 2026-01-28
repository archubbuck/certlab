# ADR-010: Quiz System Architecture

**Status:** ✅ Accepted  
**Date:** 2024-12-22  
**Deciders:** CertLab Team  
**Context:** Define the quiz creation, quiz-taking state machine, adaptive difficulty, and scoring system architecture.

## Table of Contents

- [Executive Summary](#executive-summary)
- [Context and Problem Statement](#context-and-problem-statement)
- [Decision](#decision)
- [Implementation Details](#implementation-details)
- [Consequences](#consequences)
- [Alternatives Considered](#alternatives-considered)
- [Related Documents](#related-documents)
- [Code References](#code-references)
- [Revision History](#revision-history)

---

## Executive Summary

CertLab's quiz system supports **7 question types**, **adaptive difficulty**, **randomization**, and **comprehensive scoring** using a state machine pattern. The system handles quiz creation, question selection, answer submission, and results calculation with real-time progress tracking.

### Quick Reference

| Aspect | Implementation | Purpose |
|--------|---------------|---------|
| **Question Types** | MCQ single/multi, T/F, fill-blank, short answer, matching, ordering | Diverse assessment methods |
| **Quiz State Machine** | useQuizState hook | Manage quiz-taking flow |
| **Adaptive Difficulty** | Performance-based selection | Personalized learning |
| **Randomization** | Fisher-Yates shuffle | Prevent memorization |
| **Scoring** | Percentage + category breakdown | Track progress |
| **Timer** | Optional countdown | Simulate exams |
| **Navigation** | Next/Previous/Jump | Flexible quiz-taking |
| **Persistence** | Local state + Firestore | Prevent data loss |

**Key Metrics:**
- Question types: 7
- Max questions/quiz: 250
- State transitions: <16ms
- Score calculation: <50ms

---

## Context and Problem Statement

CertLab needed a quiz system that would:

1. **Support multiple question types** for varied assessments
2. **Manage complex quiz-taking flow** with state machine
3. **Provide adaptive difficulty** based on performance
4. **Enable randomization** of questions/answers
5. **Track progress in real-time** with live scoring
6. **Support timed quizzes** for exam simulation
7. **Calculate comprehensive scores** with breakdown
8. **Store quiz history** for progress tracking
9. **Enable review mode** to revisit quizzes
10. **Provide instant feedback** on correctness

### Requirements

**Functional Requirements:**
- ✅ 7 question types (MCQ single/multi, T/F, fill, short, matching, ordering)
- ✅ Quiz configuration (time, randomization, threshold)
- ✅ Real-time answer tracking and validation
- ✅ Question navigation (next, previous, jump)
- ✅ Timer countdown with warnings
- ✅ Score calculation with category breakdown
- ✅ Adaptive difficulty adjustment
- ✅ Quiz review with explanations
- ✅ Progress persistence (save & resume)

**Non-Functional Requirements:**
- ✅ State transitions <16ms
- ✅ Score calculation <50ms
- ✅ Support 250 questions/quiz
- ✅ Timer accuracy ±1s
- ✅ Auto-save every 30s
- ✅ Mobile responsive

---

## Decision

We adopted a **state machine-based quiz architecture** with the following states and transitions:

### Quiz State Machine

```
Loading → Ready → Taking → Done
    ↓        ↓        ↓       ↓
  Error    Start   Submit  Review
```

**States:**
- **Loading**: Fetching quiz and questions
- **Ready**: Quiz loaded, can start
- **Taking**: User answering questions
- **Done**: Quiz completed, showing results

**Events:**
- START_QUIZ, SUBMIT_ANSWER
- NEXT_QUESTION, PREVIOUS_QUESTION
- JUMP_TO, FINISH_QUIZ
- TIMER_EXPIRE, SAVE_PROGRESS

### Question Types

**1. Multiple Choice Single**
```typescript
{
  questionType: 'multiple_choice_single',
  text: 'What is RBAC?',
  options: [
    { id: 0, text: 'Role-based access control' },
    { id: 1, text: 'Rule-based authentication' }
  ],
  correctAnswerIndex: 0
}
```

**2. Multiple Choice Multiple**
```typescript
{
  questionType: 'multiple_choice_multiple',
  text: 'CIA triad principles?',
  options: [
    { id: 0, text: 'Confidentiality' },
    { id: 1, text: 'Integrity' },
    { id: 2, text: 'Availability' }
  ],
  correctAnswerIndexes: [0, 1, 2]
}
```

**3. True/False**
```typescript
{
  questionType: 'true_false',
  text: 'HTTPS encrypts data in transit.',
  correctAnswerIndex: 0 // 0=true, 1=false
}
```

**4. Fill in Blank**
```typescript
{
  questionType: 'fill_in_blank',
  text: 'Protocol on port 443: _____',
  correctAnswer: 'HTTPS',
  acceptedAnswers: ['https', 'HTTPS', 'Https']
}
```

**5. Short Answer**
```typescript
{
  questionType: 'short_answer',
  text: 'Explain defense in depth.',
  requiresManualGrading: true
}
```

**6. Matching**
```typescript
{
  questionType: 'matching',
  matchingPairs: [
    { id: 0, left: 'OSI Layer 7', right: 'Application' },
    { id: 1, left: 'OSI Layer 4', right: 'Transport' }
  ]
}
```

**7. Ordering**
```typescript
{
  questionType: 'ordering',
  orderingItems: [
    { id: 0, text: 'Identify assets', correctPosition: 0 },
    { id: 1, text: 'Assess risks', correctPosition: 1 }
  ]
}
```

---

## Implementation Details

### 1. useQuizState Hook

**File:** `client/src/hooks/useQuizState.ts`

```typescript
import { useState, useCallback, useEffect } from 'react';

type QuizState = 'loading' | 'ready' | 'taking' | 'done';

interface Answer {
  questionId: number;
  userAnswer: number | number[] | string;
  isCorrect: boolean;
  timeSpent: number;
}

export function useQuizState(quiz: Quiz, questions: Question[]) {
  const [state, setState] = useState<QuizState>('loading');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, Answer>>(new Map());
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    if (questions.length > 0) setState('ready');
  }, [questions]);

  const startQuiz = useCallback(() => {
    setState('taking');
    const interval = setInterval(() => {
      setTimeElapsed(prev => {
        const newTime = prev + 1;
        if (quiz.timeLimit && newTime >= quiz.timeLimit * 60) {
          finishQuiz();
        }
        return newTime;
      });
    }, 1000);
  }, [quiz.timeLimit]);

  const submitAnswer = useCallback((userAnswer: any) => {
    const question = questions[currentQuestionIndex];
    const isCorrect = checkAnswer(question, userAnswer);
    setAnswers(prev => new Map(prev).set(question.id, {
      questionId: question.id,
      userAnswer,
      isCorrect,
      timeSpent: 0
    }));
  }, [currentQuestionIndex]);

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const finishQuiz = () => setState('done');

  return {
    state,
    currentQuestionIndex,
    currentQuestion: questions[currentQuestionIndex],
    answers,
    timeElapsed,
    startQuiz,
    submitAnswer,
    nextQuestion,
    previousQuestion,
    finishQuiz
  };
}
```

### 2. QuizInterface Component

**File:** `client/src/components/QuizInterface.tsx`

```typescript
export default function QuizInterface({ quizId }: { quizId: number }) {
  const { data: quiz } = useQuery(['quiz', quizId]);
  const { data: questions = [] } = useQuery(['quiz', quizId, 'questions']);

  const {
    state,
    currentQuestion,
    answers,
    timeElapsed,
    startQuiz,
    submitAnswer,
    nextQuestion,
    previousQuestion,
    finishQuiz
  } = useQuizState(quiz!, questions);

  if (state === 'ready') {
    return (
      <Button onClick={startQuiz}>Start Quiz</Button>
    );
  }

  if (state === 'taking') {
    return (
      <>
        <QuizHeader time={timeElapsed} />
        <QuestionDisplay 
          question={currentQuestion}
          onSubmit={submitAnswer}
        />
        <QuestionNavigator 
          onNext={nextQuestion}
          onPrevious={previousQuestion}
          onFinish={finishQuiz}
        />
      </>
    );
  }

  if (state === 'done') {
    return <QuizResults answers={answers} />;
  }
}
```

### 3. Question Randomization

**File:** `client/src/lib/quiz-randomization.ts`

```typescript
// Fisher-Yates shuffle algorithm
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function randomizeQuiz(
  quiz: Quiz,
  questions: Question[]
): Question[] {
  let processed = [...questions];

  // Randomize question order
  if (quiz.randomizeQuestions) {
    processed = shuffleArray(processed);
  }

  // Randomize answer options
  if (quiz.randomizeAnswers) {
    processed = processed.map(q => {
      if (q.questionType.includes('multiple_choice')) {
        return {
          ...q,
          options: shuffleArray(q.options || [])
        };
      }
      return q;
    });
  }

  return processed;
}
```

### 4. Scoring System

**File:** `client/src/lib/quiz-scoring.ts`

```typescript
interface QuizScore {
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  passed: boolean;
  categoryScores: Map<number, CategoryScore>;
  difficultyScores: Map<string, DifficultyScore>;
  timeMetrics: TimeMetrics;
}

export function calculateQuizScore(
  quiz: Quiz,
  questions: Question[],
  answers: Map<number, Answer>,
  timeElapsed: number
): QuizScore {
  const totalQuestions = questions.length;
  const correctAnswers = Array.from(answers.values())
    .filter(a => a.isCorrect).length;
  const percentage = (correctAnswers / totalQuestions) * 100;
  const passed = percentage >= (quiz.passThreshold || 70);

  // Category scores
  const categoryScores = new Map();
  questions.forEach(q => {
    const catId = q.categoryId;
    if (!categoryScores.has(catId)) {
      categoryScores.set(catId, {
        categoryId: catId,
        correct: 0,
        total: 0,
        percentage: 0
      });
    }
    const cat = categoryScores.get(catId);
    cat.total++;
    if (answers.get(q.id)?.isCorrect) cat.correct++;
    cat.percentage = (cat.correct / cat.total) * 100;
  });

  // Difficulty scores
  const difficultyScores = new Map();
  ['easy', 'medium', 'hard'].forEach(diff => {
    const diffQs = questions.filter(q => q.difficulty === diff);
    const correct = diffQs.filter(q => 
      answers.get(q.id)?.isCorrect
    ).length;
    difficultyScores.set(diff, {
      difficulty: diff,
      correct,
      total: diffQs.length,
      percentage: diffQs.length ? (correct / diffQs.length) * 100 : 0
    });
  });

  return {
    totalQuestions,
    correctAnswers,
    percentage,
    passed,
    categoryScores,
    difficultyScores,
    timeMetrics: {
      totalTimeSeconds: timeElapsed,
      averageTimePerQuestion: timeElapsed / totalQuestions
    }
  };
}
```

### 5. Adaptive Difficulty

**File:** `client/src/lib/adaptive-difficulty.ts`

```typescript
export function selectAdaptiveQuestions(
  questions: Question[],
  userMastery: number,
  count: number
): Question[] {
  // Calculate difficulty weights based on mastery
  const weights = {
    easy: userMastery < 50 ? 0.6 : 0.2,
    medium: userMastery < 70 ? 0.3 : 0.5,
    hard: userMastery >= 70 ? 0.5 : 0.1
  };

  // Group by difficulty
  const byDifficulty = {
    easy: questions.filter(q => q.difficulty === 'easy'),
    medium: questions.filter(q => q.difficulty === 'medium'),
    hard: questions.filter(q => q.difficulty === 'hard')
  };

  // Select questions based on weights
  const selected = [];
  selected.push(
    ...shuffleArray(byDifficulty.easy)
      .slice(0, Math.floor(count * weights.easy))
  );
  selected.push(
    ...shuffleArray(byDifficulty.medium)
      .slice(0, Math.floor(count * weights.medium))
  );
  selected.push(
    ...shuffleArray(byDifficulty.hard)
      .slice(0, count - selected.length)
  );

  return shuffleArray(selected);
}
```

---

## Consequences

### Positive

1. **Flexible Assessment** - 7 question types support diverse testing
2. **Predictable Flow** - State machine provides clear quiz progression
3. **Adaptive Learning** - Difficulty adjusts to user performance
4. **Exam Simulation** - Timer and randomization mimic real exams
5. **Comprehensive Analysis** - Category/difficulty breakdown identifies weaknesses
6. **Real-Time Feedback** - Instant answer validation
7. **Progress Persistence** - Auto-save prevents data loss

### Negative

1. **State Complexity** - State machine adds overhead for simple quizzes
2. **Manual Grading** - Short answer requires instructor review
3. **Timer Accuracy** - JavaScript timers have ±1s drift

### Mitigations

1. Use simple mode for non-exam quizzes
2. Implement admin grading interface
3. Add server-side timer validation for critical exams

---

## Alternatives Considered

### Alternative 1: Form-Based Quiz (No State Machine)

Simple form submission without state management.

**Pros:** Simpler, less code  
**Cons:** No progress tracking, no timer, no navigation

**Reason for Rejection:** Insufficient for certification exam simulation.

### Alternative 2: Server-Side Quiz Processing

Process quiz logic on server with API calls.

**Pros:** Secure scoring, accurate timer  
**Cons:** Requires server, latency

**Reason for Rejection:** CertLab is client-side only.

### Alternative 3: XState for State Machine

Use XState library for state management.

**Pros:** Robust library, visualizations  
**Cons:** Additional dependency, overkill

**Reason for Rejection:** Custom hook is sufficient and lightweight.

---

## Related Documents

- [ADR-003: Data Storage & Firestore Collections](ADR-003-data-storage-firestore-collections.md)
- [ADR-006: Component Architecture](ADR-006-component-architecture.md)
- [ADR-007: State Management Strategy](ADR-007-state-management.md)

---

## Code References

| File | Lines | Description |
|------|-------|-------------|
| `client/src/hooks/useQuizState.ts` | 1-200 | Quiz state machine |
| `client/src/components/QuizInterface.tsx` | 1-150 | Quiz interface |
| `client/src/lib/quiz-scoring.ts` | 1-150 | Score calculation |
| `shared/schema.ts` | 70-110 | Question types |

---

## Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2024-12-22 | 1.0 | CertLab Team | Initial version - quiz system architecture |
