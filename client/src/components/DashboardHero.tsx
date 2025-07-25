import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Calendar, Award, BookOpen, Brain, ClipboardCheck } from "lucide-react";
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
      {/* Enhanced Welcome Hero with Clean Background */}
      <div className="relative overflow-hidden rounded-md bg-gradient-to-br from-primary/5 via-background to-secondary/3 border border-border/50 p-8 mb-8">
        {/* Clean background accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/8 to-transparent rounded-md"></div>
        
        {/* Helen's AI Learning Dashboard */}
        <div className="relative z-10 space-y-8">
          {/* Helen's Primary Conversation */}
          <div className="flex items-start gap-6">
            {/* Helen's Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 p-1 shadow-xl rounded-3xl">
                <div className="w-full h-full bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900 dark:to-blue-900 flex items-center justify-center relative overflow-hidden rounded-2xl">
                  {/* Helen's Geometric AI Face */}
                  <div className="relative w-16 h-16">
                    {/* Main face shape - hexagon */}
                    <div className="absolute inset-2 bg-gradient-to-br from-purple-400 to-pink-400 dark:from-purple-300 dark:to-pink-300" 
                         style={{clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)'}}>
                    </div>
                    
                    {/* Circuit pattern overlay */}
                    <div className="absolute top-3 left-6 w-4 h-0.5 bg-white/60 rounded-full"></div>
                    <div className="absolute top-4 left-4 w-0.5 h-3 bg-white/60 rounded-full"></div>
                    <div className="absolute top-3 right-6 w-4 h-0.5 bg-white/60 rounded-full"></div>
                    <div className="absolute top-4 right-4 w-0.5 h-3 bg-white/60 rounded-full"></div>
                    <div className="absolute bottom-3 left-5 w-6 h-0.5 bg-white/60 rounded-full"></div>
                    
                    {/* Glowing eyes */}
                    <div className="absolute top-6 left-5 w-2 h-2 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50 animate-pulse"></div>
                    <div className="absolute top-6 right-5 w-2 h-2 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50 animate-pulse"></div>
                    
                    {/* Eye highlights */}
                    <div className="absolute top-6.5 left-5.5 w-0.5 h-0.5 bg-white rounded-full"></div>
                    <div className="absolute top-6.5 right-5.5 w-0.5 h-0.5 bg-white rounded-full"></div>
                    
                    {/* Smile - LED style */}
                    <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                      <div className="w-1 h-1 bg-cyan-400 rounded-full"></div>
                      <div className="w-1 h-1 bg-cyan-400 rounded-full"></div>
                      <div className="w-1 h-1 bg-cyan-400 rounded-full"></div>
                      <div className="w-1 h-1 bg-cyan-400 rounded-full"></div>
                      <div className="w-1 h-1 bg-cyan-400 rounded-full"></div>
                    </div>
                    
                    {/* AI core indicator */}
                    <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full animate-ping"></div>
                    <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full"></div>
                  </div>
                </div>
              </div>
              {/* AI Status Indicator */}
              <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-green-500 rounded-full border-3 border-background shadow-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>
            
            {/* Helen's Main Chat */}
            <div className="flex-1 relative">
              {/* Chat Bubble Tail */}
              <div className="absolute left-0 top-6 w-0 h-0 border-t-12 border-t-transparent border-b-12 border-b-transparent border-r-16 border-r-card -translate-x-4"></div>
              
              {/* Chat Content */}
              <div className="card-raised p-8 rounded-lg bg-gradient-to-br from-card to-purple-50/30 dark:to-purple-950/30 border border-purple-200/30 dark:border-purple-800/30 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="font-bold text-purple-700 dark:text-purple-300 text-2xl">Helen</h3>
                  <Badge variant="secondary" className="text-sm bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 px-3 py-1">AI Learning Assistant</Badge>
                </div>
                <p className="text-foreground mb-3 text-2xl font-semibold">
                  Welcome back, {currentUser?.firstName || 'Student'}!
                </p>
                <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                  I've been analyzing your learning patterns and progress data. Based on your recent performance, I've identified optimal study opportunities that align with your certification goals. Let me guide your next learning session for maximum effectiveness.
                </p>
                
                {/* AI Recommendations */}
                <div className="flex flex-wrap gap-3">
                  <Button 
                    size="lg" 
                    onClick={() => handleQuickQuiz('AI Recommended')}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg text-base px-6 py-3"
                  >
                    <Brain className="w-5 h-5 mr-3" />
                    Start AI-Guided Session
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => handleQuickQuiz('Quick Practice')}
                    className="border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-950/50 text-base px-6 py-3"
                  >
                    <BookOpen className="w-5 h-5 mr-3" />
                    Practice Mode
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Helen's Learning Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Performance Analysis */}
            <div className="card-raised p-6 rounded-lg bg-gradient-to-br from-card to-blue-50/20 dark:to-blue-950/20 border border-blue-200/30 dark:border-blue-800/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Performance Analysis</h3>
                  <p className="text-sm text-muted-foreground">AI-powered insights</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Learning Sessions</span>
                  <span className="font-bold text-blue-600">{stats?.totalQuizzes || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Average Score</span>
                  <span className="font-bold text-blue-600">{Math.round(stats?.averageScore || 0)}%</span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  Helen recommends focusing on areas below 80% mastery
                </p>
              </div>
            </div>

            {/* Learning Momentum */}
            <div className="card-raised p-6 rounded-lg bg-gradient-to-br from-card to-green-50/20 dark:to-green-950/20 border border-green-200/30 dark:border-green-800/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Learning Momentum</h3>
                  <p className="text-sm text-muted-foreground">Consistency tracking</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Current Streak</span>
                  <span className="font-bold text-green-600">{stats?.currentStreak || 0} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Optimal Study Time</span>
                  <span className="font-bold text-green-600">15-30 min</span>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                  {stats?.currentStreak > 0 ? 
                    "Excellent consistency! Helen suggests maintaining this momentum." :
                    "Helen recommends starting with short, daily study sessions."
                  }
                </p>
              </div>
            </div>

            {/* Next Steps */}
            <div className="card-raised p-6 rounded-lg bg-gradient-to-br from-card to-purple-50/20 dark:to-purple-950/20 border border-purple-200/30 dark:border-purple-800/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">AI Recommendations</h3>
                  <p className="text-sm text-muted-foreground">Personalized guidance</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-sm">
                  <span className="font-medium text-purple-600 dark:text-purple-400">Next Focus Area:</span>
                  <p className="text-muted-foreground mt-1">
                    {stats?.totalQuizzes > 0 ? 
                      "Review incorrect answers and strengthen weak domains" :
                      "Begin with foundational concepts in your chosen certification"
                    }
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="w-full border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-950/50"
                >
                  View Helen's Study Plan
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Helen's Additional Insights */}
        <div className="mt-8 p-6 rounded-md bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-200/50 dark:border-purple-800/50">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg rounded-xl relative overflow-hidden">
              {/* Smaller geometric Helen for insights */}
              <div className="relative w-6 h-6">
                {/* Mini hexagon face */}
                <div className="absolute inset-0.5 bg-white/80"
                     style={{clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)'}}>
                </div>
                {/* Mini circuit lines */}
                <div className="absolute top-1 left-1.5 w-1.5 h-0.5 bg-purple-500 rounded-full"></div>
                <div className="absolute bottom-1 right-1.5 w-1.5 h-0.5 bg-purple-500 rounded-full"></div>
                {/* Glowing eyes */}
                <div className="absolute top-1.5 left-1.5 w-0.5 h-0.5 bg-cyan-400 rounded-full"></div>
                <div className="absolute top-1.5 right-1.5 w-0.5 h-0.5 bg-cyan-400 rounded-full"></div>
                {/* LED smile */}
                <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                  <div className="w-0.5 h-0.5 bg-cyan-400 rounded-full"></div>
                  <div className="w-0.5 h-0.5 bg-cyan-400 rounded-full"></div>
                  <div className="w-0.5 h-0.5 bg-cyan-400 rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                Helen's Smart Insights
                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200">
                  Personalized
                </Badge>
              </h3>
              <p className="text-muted-foreground mb-3">{insights.message}</p>
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">{insights.action}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}