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
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Dashboard Overview Section */}
        <section className="dashboard-section">
          <DashboardHero />
        </section>

        {/* Key Statistics */}
        <DashboardStats />

        {/* Learning Session Configuration */}
        <section className="dashboard-section">
          <div className="section-header mb-6">
            <h2 className="text-xl font-semibold text-foreground">Start Learning Session</h2>
            <p className="text-sm text-muted-foreground">Configure and begin your certification study session</p>
          </div>
          <LearningModeWizard />
        </section>
        
        {/* AI Assistant & Quick Actions */}
        <section className="dashboard-section">
          <div className="section-header mb-6">
            <h2 className="text-xl font-semibold text-foreground">Helen AI Assistant</h2>
            <p className="text-sm text-muted-foreground">Personalized study guidance and quick learning actions</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StudyPlanCard />
            <QuickActionsCard />
          </div>
        </section>
        
        {/* Recent Activity & Progress */}
        <section className="dashboard-section">
          <div className="section-header mb-6">
            <h2 className="text-xl font-semibold text-foreground">Learning Activity</h2>
            <p className="text-sm text-muted-foreground">Your recent quiz results and performance trends</p>
          </div>
          <ActivitySidebar />
        </section>

        {/* Advanced Learning Features */}
        <section className="dashboard-section">
          <div className="section-header mb-6">
            <h2 className="text-xl font-semibold text-foreground">Advanced Features</h2>
            <p className="text-sm text-muted-foreground">Collaborative learning and practice test preparation</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StudyGroupCard />
            <PracticeTestMode />
          </div>
        </section>

        {/* Mastery Progress Tracking */}
        <section id="progress-section" className="dashboard-section">
          <div className="section-header mb-6">
            <h2 className="text-xl font-semibold text-foreground">Mastery Progress</h2>
            <p className="text-sm text-muted-foreground">Track your certification mastery across all study areas</p>
          </div>
          <MasteryMeter />
        </section>
      </main>
    </div>
  );
}
