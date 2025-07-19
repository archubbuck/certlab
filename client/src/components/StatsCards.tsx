import { useQuery } from "@tanstack/react-query";
import { localStorage } from "@/lib/localStorage";
import { Card, CardContent } from "@/components/ui/card";

export default function StatsCards() {
  const currentUser = localStorage.getCurrentUser();
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/user', currentUser?.id, 'stats'],
    enabled: !!currentUser,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: "Total Quizzes",
      value: stats?.totalQuizzes || 0,
      icon: "fas fa-clipboard-list",
      bgColor: "bg-primary bg-opacity-10",
      iconColor: "text-primary"
    },
    {
      title: "Average Score",
      value: `${stats?.averageScore || 0}%`,
      icon: "fas fa-chart-line",
      bgColor: "bg-secondary bg-opacity-10",
      iconColor: "text-secondary"
    },
    {
      title: "Study Streak",
      value: `${stats?.studyStreak || 0} days`,
      icon: "fas fa-fire",
      bgColor: "bg-accent bg-opacity-10",
      iconColor: "text-accent"
    },
    {
      title: "Pass Rate",
      value: `${stats?.passingRate || 0}%`,
      icon: "fas fa-trophy",
      bgColor: stats?.passingRate >= 85 ? "bg-green-100" : "bg-red-100",
      iconColor: stats?.passingRate >= 85 ? "text-green-600" : "text-red-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat, index) => (
        <Card key={index} className="material-shadow border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                <i className={`${stat.icon} ${stat.iconColor} text-xl`}></i>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
