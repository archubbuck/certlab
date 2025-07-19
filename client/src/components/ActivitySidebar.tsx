import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { localStorage } from "@/lib/localStorage";
import { getScoreColor } from "@/lib/questions";
import type { Quiz, UserProgress, Category } from "@shared/schema";

export default function ActivitySidebar() {
  const currentUser = localStorage.getCurrentUser();

  const { data: recentQuizzes = [] } = useQuery<Quiz[]>({
    queryKey: ['/api/user', currentUser?.id, 'quizzes'],
    enabled: !!currentUser,
  });

  const { data: userProgress = [] } = useQuery<UserProgress[]>({
    queryKey: ['/api/user', currentUser?.id, 'progress'],
    enabled: !!currentUser,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const completedQuizzes = recentQuizzes
    .filter(quiz => quiz.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
    .slice(0, 3);

  const formatDate = (date: string) => {
    const now = new Date();
    const quizDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - quizDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return quizDate.toLocaleDateString();
  };

  const getCategoryName = (categoryIds: number[]) => {
    const names = categoryIds
      .map(id => categories.find(cat => cat.id === id)?.name)
      .filter(Boolean);
    return names.length > 0 ? names.join(", ") : "Mixed Quiz";
  };

  const getProgressForCategory = (categoryId: number) => {
    return userProgress.find(p => p.categoryId === categoryId);
  };

  return (
    <div className="space-y-6">
      {/* Recent Quiz Results */}
      <Card className="material-shadow border border-gray-100 overflow-hidden">
        <CardHeader className="p-4 border-b border-gray-100">
          <CardTitle className="font-medium text-gray-900">Recent Quiz Results</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {completedQuizzes.length > 0 ? (
            completedQuizzes.map((quiz) => (
              <div key={quiz.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      {getCategoryName(quiz.categoryIds as number[])}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {formatDate(quiz.completedAt!)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getScoreColor(quiz.score || 0)}`}>
                      {quiz.score}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {quiz.correctAnswers}/{quiz.totalQuestions || quiz.questionCount}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `/review/${quiz.id}`}
                    className="flex-1 text-xs"
                  >
                    <i className="fas fa-eye mr-1"></i>
                    Review
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `/results/${quiz.id}`}
                    className="flex-1 text-xs"
                  >
                    <i className="fas fa-chart-bar mr-1"></i>
                    Results
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              No completed quizzes yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Study Progress */}
      <Card className="material-shadow border border-gray-100 overflow-hidden">
        <CardHeader className="p-4 border-b border-gray-100">
          <CardTitle className="font-medium text-gray-900">Certification Progress</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {categories.map((category) => {
            const progress = getProgressForCategory(category.id);
            const percentage = progress ? Math.round((progress.questionsCompleted / Math.max(progress.totalQuestions, 1)) * 100) : 0;
            const score = progress?.averageScore || 0;
            
            return (
              <div key={category.id}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">{category.name}</span>
                  <span className="text-sm text-gray-500">{score}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      score >= 90 ? 'bg-secondary' :
                      score >= 80 ? 'bg-primary' :
                      score >= 70 ? 'bg-accent' : 'bg-gray-400'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {progress?.questionsCompleted || 0}/{progress?.totalQuestions || 0} questions completed
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="material-shadow border border-gray-100 overflow-hidden">
        <CardHeader className="p-4 border-b border-gray-100">
          <CardTitle className="font-medium text-gray-900">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start material-shadow-hover"
            disabled
          >
            <div className="flex items-center space-x-3">
              <i className="fas fa-redo text-error"></i>
              <div className="text-left">
                <h4 className="text-sm font-medium text-gray-900">Review Incorrect</h4>
                <p className="text-xs text-gray-500">Practice failed questions</p>
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start material-shadow-hover"
            disabled
          >
            <div className="flex items-center space-x-3">
              <i className="fas fa-random text-primary"></i>
              <div className="text-left">
                <h4 className="text-sm font-medium text-gray-900">Random Quiz</h4>
                <p className="text-xs text-gray-500">Mixed questions</p>
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start material-shadow-hover"
            disabled
          >
            <div className="flex items-center space-x-3">
              <i className="fas fa-chart-bar text-secondary"></i>
              <div className="text-left">
                <h4 className="text-sm font-medium text-gray-900">View Analytics</h4>
                <p className="text-xs text-gray-500">Detailed performance</p>
              </div>
            </div>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
