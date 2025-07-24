import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Calendar, Award, BookOpen } from "lucide-react";
import type { UserStats, Category, MasteryScore } from "@shared/schema";

export default function DashboardHero() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const { data: stats } = useQuery<UserStats>({
    queryKey: [`/api/user/${currentUser?.id}/stats`],
    enabled: !!currentUser?.id,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { data: masteryScores = [] } = useQuery<MasteryScore[]>({
    queryKey: [`/api/user/${currentUser?.id}/mastery`],
    enabled: !!currentUser?.id,
  });

  const handleQuickQuiz = async (mode: string) => {
    if (!currentUser?.id) {
      toast({
        title: "Login Required",
        description: "Please log in to start a quiz.",
        variant: "destructive",
      });
      return;
    }

    try {
      const categoryIds = categories.slice(0, 2).map(c => c.id);
      const quiz = await apiRequest({
        endpoint: "/api/quiz",
        method: "POST",
        data: {
          userId: currentUser.id,
          categoryIds,
          questionCount: 15,
          title: `${mode} Session - ${new Date().toLocaleDateString()}`,
        },
      });

      if (quiz?.id) {
        window.location.href = `/app/quiz/${quiz.id}`;
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create quiz session",
        variant: "destructive",
      });
    }
  };

  const calculateOverallMastery = () => {
    if (masteryScores.length === 0) return 0;
    const total = masteryScores.reduce((sum, score) => sum + score.rollingAverage, 0);
    return Math.round(total / masteryScores.length);
  };

  const getAIInsights = () => {
    if (!stats || stats.totalQuizzes === 0) {
      return {
        message: "Welcome to Cert Lab! Start with a learning session to begin building your cybersecurity expertise.",
        type: "welcome",
        action: "Take your first assessment to get personalized study recommendations."
      };
    }

    if (stats.averageScore < 60) {
      return {
        message: "Focus on foundational concepts first. Study mode sessions will help build your knowledge base.",
        type: "encouragement",
        action: "Start with study mode sessions to learn concepts before assessments."
      };
    }

    return {
      message: "You're making steady progress! Regular practice and review will help solidify your knowledge for certification success.",
      type: "progress",
      action: "Continue balanced practice with both study and quiz modes."
    };
  };

  const insights = getAIInsights();
  const overallMastery = calculateOverallMastery();

  if (!stats) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Welcome Header with Key Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {currentUser?.firstName || 'Student'}!
          </h1>
          <p className="text-lg text-muted-foreground">
            Ready to continue your certification journey
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="flex gap-6 mt-4 lg:mt-0">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats?.totalQuizzes || 0}</div>
            <div className="text-sm text-muted-foreground">Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats?.currentStreak || 0}</div>
            <div className="text-sm text-muted-foreground">Day Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{Math.round(stats?.averageScore || 0)}%</div>
            <div className="text-sm text-muted-foreground">Avg Score</div>
          </div>
        </div>
      </div>
    </div>
  );
}