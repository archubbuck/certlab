import Header from "@/components/Header";
import DashboardHero from "@/components/DashboardHero";
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
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <DashboardHero />
        
        {/* Enhanced Study Dashboard Layout */}
        <div className="space-y-6 sm:space-y-8">
          {/* Main Learning Mode Wizard */}
          <div className="grid-item">
            <LearningModeWizard />
          </div>
          
          {/* Helen's AI Assistant (includes study plan and progress) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="grid-item">
              <StudyPlanCard />
            </div>
            <div className="grid-item">
              <QuickActionsCard />
            </div>
          </div>
          
          {/* Activity Sidebar */}
          <div className="grid-item">
            <ActivitySidebar />
          </div>
        </div>

        {/* Section Separator */}
        <div className="section-separator mt-8 sm:mt-10 lg:mt-12"></div>

        {/* Advanced Features Section */}
        <div className="mt-8 sm:mt-10 lg:mt-12 space-y-6 section-separator">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 layout-container">
            <div className="grid-item">
              <StudyGroupCard />
            </div>
            <div className="grid-item">
              <PracticeTestMode />
            </div>
          </div>
        </div>

        {/* Mastery Progress Section */}
        <div id="progress-section" className="mt-4 sm:mt-6 lg:mt-8">
          <MasteryMeter />
        </div>
      </main>
    </div>
  );
}
