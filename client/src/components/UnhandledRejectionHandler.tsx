import { useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { getErrorInfo, logError } from '@/lib/errors';

/**
 * A component that listens for unhandled promise rejections and displays
 * user-friendly error notifications with category-appropriate actions and retry support.
 *
 * This component should be mounted once at the app level.
 */
export function UnhandledRejectionHandler() {
  const { toast } = useToast();

  // Handle retry action by reloading the page - only for errors where reload helps
  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;

      // Log the error for debugging and monitoring
      logError('unhandledRejection', error);

      // Prevent the default browser error handling
      event.preventDefault();

      // Get comprehensive error information
      const { title, message, action, retryable } = getErrorInfo(error);

      // Show user-friendly toast notification with retry option if applicable
      if (retryable) {
        toast({
          variant: 'destructive',
          title,
          description: `${message}${action ? ` ${action}.` : ''}`,
          action: (
            <ToastAction altText="Try again" onClick={handleRetry}>
              Try Again
            </ToastAction>
          ),
        });
      } else {
        // Non-retryable errors: show message with action guidance
        toast({
          variant: 'destructive',
          title,
          description: `${message}${action ? ` ${action}.` : ''}`,
        });
      }
    };

    // Add the event listener
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [toast, handleRetry]);

  // This component doesn't render anything
  return null;
}
