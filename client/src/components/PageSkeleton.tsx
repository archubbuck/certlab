import { Skeleton } from '@/components/ui/skeleton';

interface PageSkeletonProps {
  /**
   * Show a header skeleton (default: true)
   */
  showHeader?: boolean;

  /**
   * Show a sidebar skeleton (default: false)
   */
  showSidebar?: boolean;

  /**
   * Number of content rows to show (default: 5)
   */
  contentRows?: number;
}

/**
 * PageSkeleton - A skeleton loader for page content
 * Provides better UX than a spinner during initial page load
 */
export function PageSkeleton({
  showHeader = true,
  showSidebar = false,
  contentRows = 5,
}: PageSkeletonProps) {
  return (
    <div className="min-h-screen bg-background p-6 animate-in fade-in duration-300">
      {showHeader && (
        <div className="mb-8 space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      )}

      <div className="flex gap-6">
        {showSidebar && (
          <div className="w-64 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        <div className="flex-1 space-y-4">
          {Array.from({ length: contentRows }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
