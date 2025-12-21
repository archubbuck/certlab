import PracticeTestMode from '@/components/PracticeTestMode';

/**
 * Practice Tests Page
 *
 * Displays available practice tests for certification preparation.
 * Practice tests are full-length exams that simulate real certification tests.
 */
export default function PracticeTestsPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Practice Tests</h1>
          <p className="text-muted-foreground">
            Take full-length practice exams to prepare for your certification
          </p>
        </div>

        <PracticeTestMode />
      </main>
    </div>
  );
}
