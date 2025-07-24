import Header from "@/components/Header";
import DashboardHero from "@/components/DashboardHero";
import DashboardStats from "@/components/DashboardStats";
import LearningModeWizard from "@/components/LearningModeWizard";
import ActivitySidebar from "@/components/ActivitySidebar";
import MasteryMeter from "@/components/MasteryMeter";
import StudyPlanCard from "@/components/StudyPlanCard";
import QuickActionsCard from "@/components/QuickActionsCard";
import StudyGroupCard from "@/components/StudyGroupCard";
import PracticeTestMode from "@/components/PracticeTestMode";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome & Quick Stats */}
        <div className="mb-8">
          <DashboardHero />
        </div>

        {/* Main Learning Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Start Learning - Primary Action */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-border p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Start Learning</h2>
              <p className="text-muted-foreground">Choose your certification and begin studying</p>
            </div>
            <LearningModeWizard />
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-2">Quick Actions</h2>
              <p className="text-sm text-muted-foreground">Jump into learning</p>
            </div>
            <QuickActionsCard />
          </div>
        </div>

        {/* Progress & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Your Progress */}
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-2">Your Progress</h2>
              <p className="text-sm text-muted-foreground">Track mastery across certifications</p>
            </div>
            <MasteryMeter />
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-2">Recent Activity</h2>
              <p className="text-sm text-muted-foreground">Your latest study sessions</p>
            </div>
            <ActivitySidebar />
          </div>
        </div>

        {/* AI Assistant & Study Plan */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-border p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">Helen AI Study Assistant</h2>
            <p className="text-sm text-muted-foreground">Personalized recommendations and study guidance</p>
          </div>
          <StudyPlanCard />
        </div>
      </main>
    </div>
  );
}
