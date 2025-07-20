import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { localStorage } from "@/lib/localStorage";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UserStats, Category, MasteryScore } from "@shared/schema";

export default function DashboardHero() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const currentUser = localStorage.getCurrentUser();

  const { data: stats } = useQuery<UserStats>({
    queryKey: ['/api/user', currentUser?.id, 'stats'],
    enabled: !!currentUser,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { data: masteryScores = [] } = useQuery<MasteryScore[]>({
    queryKey: ['/api/user', currentUser?.id, 'mastery'],
    enabled: !!currentUser,
  });

  // Quick quiz creation mutation
  const createQuickQuizMutation = useMutation({
    mutationFn: async (quizData: any) => {
      const response = await apiRequest({ 
        method: "POST", 
        endpoint: "/api/quiz", 
        data: quizData 
      });
      return response.json();
    },
    onSuccess: (quiz) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      setLocation(`/quiz/${quiz.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create quiz. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsCreatingQuiz(false);
    }
  });

  const handleQuickQuiz = (categoryId: number, mode: "study" | "quiz") => {
    setIsCreatingQuiz(true);
    createQuickQuizMutation.mutate({
      title: `Quick ${mode === "quiz" ? "Assessment" : "Study"} - ${categories.find(c => c.id === categoryId)?.name}`,
      categoryIds: [categoryId],
      questionCount: mode === "quiz" ? 20 : 10,
      timeLimit: mode === "quiz" ? 30 : null,
      mode: mode
    });
  };

  // Calculate overall mastery progress
  const calculateOverallMastery = () => {
    if (masteryScores.length === 0) return 0;
    const total = masteryScores.reduce((sum, score) => sum + score.rollingAverage, 0);
    return Math.round(total / masteryScores.length);
  };

  // Get HELEN AI insights based on user data
  const getAIInsights = () => {
    const overallMastery = calculateOverallMastery();
    const recentQuizzes = stats?.totalQuizzes || 0;
    const averageScore = stats?.averageScore || 0;
    const streak = stats?.currentStreak || 0;

    if (recentQuizzes === 0) {
      return {
        message: "Welcome to your certification journey! Let's start with your first assessment to understand your current knowledge level.",
        type: "welcome",
        action: "Take your first quiz to get personalized study recommendations."
      };
    }

    if (overallMastery >= 85) {
      return {
        message: "Excellent progress! You're approaching certification readiness. Focus on maintaining consistency across all domains.",
        type: "excellent",
        action: "Take practice exams to simulate the real certification experience."
      };
    }

    if (overallMastery >= 70) {
      return {
        message: "Great momentum! You're building solid foundational knowledge. Keep focusing on your weaker areas to reach mastery.",
        type: "good",
        action: "Target quiz mode sessions in domains with lower mastery scores."
      };
    }

    if (streak >= 7) {
      return {
        message: "Amazing dedication! Your consistent daily practice is paying off. This habit will accelerate your certification success.",
        type: "streak",
        action: "Maintain this momentum - consistency is key to retention."
      };
    }

    if (averageScore < 60) {
      return {
        message: "Every expert was once a beginner. Focus on study mode first to build understanding, then test with quiz mode.",
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
      <div className="mb-8">
        <Card className="material-shadow border border-gray-100">
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <Card className="material-shadow border border-gray-100 overflow-hidden">
        {/* HELEN AI Insights Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                className="text-white animate-bounce"
                style={{
                  animation: 'gentle-float 3s ease-in-out infinite'
                }}
              >
                {/* Friendly AI Avatar */}
                <circle cx="12" cy="8" r="3" fill="currentColor" opacity="0.9">
                  <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
                </circle>
                <path 
                  d="M12 12c-2.5 0-4.5 1.5-4.5 3.5v2c0 0.5 0.5 1 1 1h7c0.5 0 1-0.5 1-1v-2c0-2-2-3.5-4.5-3.5z" 
                  fill="currentColor" 
                  opacity="0.8"
                >
                  <animate attributeName="opacity" values="0.6;0.9;0.6" dur="2.5s" repeatCount="indefinite" />
                </path>
                {/* Friendly eyes */}
                <circle cx="10.5" cy="7.5" r="0.5" fill="white">
                  <animate attributeName="r" values="0.5;0.3;0.5" dur="3s" repeatCount="indefinite" />
                </circle>
                <circle cx="13.5" cy="7.5" r="0.5" fill="white">
                  <animate attributeName="r" values="0.5;0.3;0.5" dur="3s" repeatCount="indefinite" />
                </circle>
                {/* Thinking dots */}
                <g opacity="0.6">
                  <circle cx="8" cy="4" r="1" fill="currentColor">
                    <animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite" begin="0s" />
                  </circle>
                  <circle cx="16" cy="4" r="1" fill="currentColor">
                    <animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite" begin="0.5s" />
                  </circle>
                  <circle cx="12" cy="2" r="1" fill="currentColor">
                    <animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite" begin="1s" />
                  </circle>
                </g>
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">HELEN AI Assistant</h3>
                <Badge variant="secondary" className="text-xs">
                  {insights.type === "excellent" ? "Expert Level" :
                   insights.type === "good" ? "Advanced" :
                   insights.type === "streak" ? "Consistent" :
                   insights.type === "welcome" ? "Getting Started" :
                   "Improving"}
                </Badge>
              </div>
              <p className="text-gray-700 mb-2">{insights.message}</p>
              <p className="text-sm text-blue-700 font-medium">{insights.action}</p>
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h4>
              <div className="space-y-2">
                {categories.slice(0, 3).map((category) => (
                  <div key={category.id} className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickQuiz(category.id, "study")}
                      disabled={isCreatingQuiz}
                      className="flex-1 text-xs"
                    >
                      <i className="fas fa-brain mr-1"></i>
                      Study {category.name}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleQuickQuiz(category.id, "quiz")}
                      disabled={isCreatingQuiz}
                      className="flex-1 text-xs bg-primary hover:bg-blue-700"
                    >
                      <i className="fas fa-clipboard-check mr-1"></i>
                      Quiz {category.name}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Metrics */}
            <div className="lg:col-span-2">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Your Progress</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalQuizzes}</div>
                  <div className="text-xs text-blue-700">Total Sessions</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.averageScore}%</div>
                  <div className="text-xs text-green-700">Average Score</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{overallMastery}%</div>
                  <div className="text-xs text-purple-700">Overall Mastery</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{stats.currentStreak || 0}</div>
                  <div className="text-xs text-orange-700">Day Streak</div>
                </div>
              </div>

              {/* Motivation Message */}
              <div className="mt-4 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-lightbulb text-yellow-600"></i>
                  <span className="text-sm font-medium text-gray-900">Today's Focus</span>
                </div>
                <p className="text-sm text-gray-700 mt-1">
                  {masteryScores.length > 0 ? (
                    `Work on ${masteryScores
                      .sort((a, b) => a.rollingAverage - b.rollingAverage)
                      .slice(0, 2)
                      .map(score => categories.find(c => c.id === score.categoryId)?.name)
                      .filter(Boolean)
                      .join(" and ")} to boost your weakest areas.`
                  ) : (
                    "Complete your first assessment to get personalized recommendations."
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}