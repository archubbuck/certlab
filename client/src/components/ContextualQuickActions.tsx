import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, Brain, Clock, Award, ArrowRight } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import type { UserStats } from "@shared/schema";

interface ContextualQuickActionsProps {
  stats?: UserStats;
  userGoals?: string[];
}

interface SmartAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  priority: 'high' | 'medium' | 'low';
  action: () => void;
  badge?: string;
  disabled?: boolean;
}

export default function ContextualQuickActions({ stats, userGoals }: ContextualQuickActionsProps) {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  const createQuizMutation = useMutation({
    mutationFn: async (quizData: any) => {
      return await apiRequest('/api/quiz', {
        method: 'POST',
        body: JSON.stringify(quizData),
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      window.location.href = `/quiz/${data.id}`;
    },
    onError: (error) => {
      console.error('Failed to create quiz:', error);
    },
    onSettled: () => {
      setIsCreating(false);
    }
  });

  const generateSmartActions = (): SmartAction[] => {
    const actions: SmartAction[] = [];
    const hasStats = stats && stats.totalQuizzes > 0;
    const hasGoals = userGoals && userGoals.length > 0;
    const isNewUser = !hasStats || stats.totalQuizzes === 0;
    const lowPerformance = hasStats && stats.averageScore < 70;
    const noStreak = !hasStats || stats.currentStreak === 0;

    // New User Quick Start
    if (isNewUser) {
      actions.push({
        id: 'quick-start',
        title: 'Take Your First Quiz',
        description: 'Start with 5 beginner-friendly questions',
        icon: <Target className="w-4 h-4" />,
        priority: 'high',
        badge: 'Recommended',
        action: () => {
          setIsCreating(true);
          createQuizMutation.mutate({
            userId: user?.id,
            categoryIds: [35], // CC category for beginners
            subcategoryIds: [],
            questionCount: 5,
            title: 'Quick Start Quiz',
            timeLimit: 600, // 10 minutes
          });
        }
      });
    }

    // Performance Improvement
    if (lowPerformance) {
      actions.push({
        id: 'focus-weak-areas',
        title: 'Focus on Weak Areas',
        description: 'Target your lowest scoring topics',
        icon: <TrendingUp className="w-4 h-4" />,
        priority: 'high',
        badge: 'High Impact',
        action: () => {
          setIsCreating(true);
          createQuizMutation.mutate({
            userId: user?.id,
            categoryIds: [35, 36], // Mix of categories
            subcategoryIds: [],
            questionCount: 10,
            title: 'Improvement Focus Quiz',
            timeLimit: 900, // 15 minutes
          });
        }
      });
    }

    // Daily Streak Recovery
    if (noStreak && hasStats) {
      actions.push({
        id: 'restart-streak',
        title: 'Restart Your Streak',
        description: 'Quick 5-minute daily practice session',
        icon: <Clock className="w-4 h-4" />,
        priority: 'high',
        badge: 'Daily Goal',
        action: () => {
          setIsCreating(true);
          createQuizMutation.mutate({
            userId: user?.id,
            categoryIds: [35],
            subcategoryIds: [],
            questionCount: 3,
            title: 'Daily Streak Quiz',
            timeLimit: 300, // 5 minutes
          });
        }
      });
    }

    // Goal-Based Practice
    if (hasGoals && userGoals.length > 0) {
      const primaryGoal = userGoals[0];
      actions.push({
        id: 'goal-practice',
        title: `${primaryGoal} Practice`,
        description: 'Focused practice for your certification goal',
        icon: <Award className="w-4 h-4" />,
        priority: 'medium',
        badge: 'Goal-Aligned',
        action: () => {
          setIsCreating(true);
          // Map certification names to category IDs
          const categoryMap: { [key: string]: number } = {
            'CC': 35,
            'CGRC': 36,
            'CISA': 37,
            'CISM': 38,
            'CISSP': 39,
            'Cloud+': 40
          };
          const categoryId = categoryMap[primaryGoal] || 35;
          
          createQuizMutation.mutate({
            userId: user?.id,
            categoryIds: [categoryId],
            subcategoryIds: [],
            questionCount: 15,
            title: `${primaryGoal} Goal Practice`,
            timeLimit: 1200, // 20 minutes
          });
        }
      });
    }

    // Advanced Challenge
    if (hasStats && stats.averageScore >= 80) {
      actions.push({
        id: 'challenge-mode',
        title: 'Advanced Challenge',
        description: 'Test your knowledge with harder questions',
        icon: <Brain className="w-4 h-4" />,
        priority: 'medium',
        badge: 'Expert',
        action: () => {
          setIsCreating(true);
          createQuizMutation.mutate({
            userId: user?.id,
            categoryIds: [35, 36, 37, 38], // Multiple categories
            subcategoryIds: [],
            questionCount: 20,
            title: 'Advanced Challenge Quiz',
            timeLimit: 1800, // 30 minutes
          });
        }
      });
    }

    // Mixed Review
    if (hasStats && stats.totalQuizzes >= 5) {
      actions.push({
        id: 'mixed-review',
        title: 'Mixed Review',
        description: 'Review across all your studied topics',
        icon: <ArrowRight className="w-4 h-4" />,
        priority: 'low',
        action: () => {
          setIsCreating(true);
          createQuizMutation.mutate({
            userId: user?.id,
            categoryIds: [35, 36, 37], // Multiple categories
            subcategoryIds: [],
            questionCount: 12,
            title: 'Mixed Review Quiz',
            timeLimit: 1200, // 20 minutes
          });
        }
      });
    }

    return actions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const smartActions = generateSmartActions();

  if (smartActions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Smart Actions
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Personalized actions based on your progress and goals
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {smartActions.slice(0, 3).map((action) => (
          <div
            key={action.id}
            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start gap-3 flex-1">
              <div className="mt-1">
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm">{action.title}</h4>
                  {action.badge && (
                    <Badge 
                      variant={action.priority === 'high' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {action.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={action.action}
              disabled={action.disabled || isCreating}
              className="shrink-0"
            >
              {isCreating ? 'Creating...' : 'Start'}
            </Button>
          </div>
        ))}
        
        {smartActions.length > 3 && (
          <div className="text-center pt-2">
            <Button variant="ghost" size="sm">
              View All Actions ({smartActions.length - 3} more)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}