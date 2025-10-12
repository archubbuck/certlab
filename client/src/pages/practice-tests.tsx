import PracticeTestMode from "@/components/PracticeTestMode";

export default function PracticeTests() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Practice Tests</h1>
          <p className="text-muted-foreground">
            Take full-length practice exams that simulate real certification tests to prepare effectively.
          </p>
        </div>

        {/* Practice Test Mode Component */}
        <PracticeTestMode />
      </main>
    </div>
  );
}