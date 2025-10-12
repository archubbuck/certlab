import { useLocation } from "wouter";
import { Home, ChevronRight } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BreadcrumbItemData {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

export default function BreadcrumbNavigation({ className }: { className?: string }) {
  const [location, setLocation] = useLocation();

  const getBreadcrumbs = (): BreadcrumbItemData[] => {
    const pathSegments = location.split('/').filter(Boolean);
    
    // Always start with home
    const breadcrumbs: BreadcrumbItemData[] = [
      { label: 'Dashboard', href: '/app/dashboard', icon: <Home className="w-4 h-4" /> }
    ];

    // Comprehensive path mapping for all pages
    const pathMapping: Record<string, string> = {
      'app': '',
      'dashboard': 'Dashboard',
      'quiz': 'Quiz Session',
      'achievements': 'Achievements',
      'review': 'Review Sessions',
      'results': 'Results',
      'study-groups': 'Study Groups',
      'practice-tests': 'Practice Tests',
      'challenges': 'Challenges',
      'accessibility': 'Accessibility',
      'admin': 'Admin Panel',
      'ui-structure': 'UI Structure',
      'profile': 'Profile',
      'lecture': 'Study Guide',
      // Subscription pages
      'subscription-plans': 'Subscription Plans',
      'subscription-manage': 'Manage Subscription',
      'subscription-success': 'Payment Success',
      'subscription-cancel': 'Cancellation',
      // Login page
      'login': 'Login',
    };

    let currentPath = '';
    
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Handle dynamic segments (IDs, etc.)
      const isNumeric = /^\d+$/.test(segment);
      const isDynamicId = /^[a-f0-9-]+$/i.test(segment) && segment.includes('-');
      
      let label = pathMapping[segment];
      
      // If no mapping found and it's not a dynamic segment, create a label
      if (!label && !isNumeric && !isDynamicId && segment !== 'app') {
        label = segment
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
      
      // Skip empty labels, app segment, duplicate dashboard, and dynamic IDs
      if (label && label !== 'Dashboard' && segment !== 'app' && !isNumeric && !isDynamicId) {
        breadcrumbs.push({
          label,
          href: index < pathSegments.length - 1 ? currentPath : undefined
        });
      }
      
      // Special handling for dynamic routes
      if (isNumeric || isDynamicId) {
        const previousSegment = pathSegments[index - 1];
        if (previousSegment === 'quiz') {
          breadcrumbs[breadcrumbs.length - 1].label = 'Quiz Session';
        } else if (previousSegment === 'lecture') {
          breadcrumbs[breadcrumbs.length - 1].label = 'Study Guide';
        } else if (previousSegment === 'results') {
          breadcrumbs[breadcrumbs.length - 1].label = 'Quiz Results';
        }
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  // Don't show breadcrumbs on the dashboard home page
  if (location === '/app' || location === '/app/dashboard') {
    return null;
  }

  return (
    <div className={cn(
      "mb-6 px-4 py-3 bg-muted/30 backdrop-blur-sm rounded-lg border border-border/50 shadow-sm",
      "transition-all duration-200 hover:shadow-md hover:bg-muted/40",
      className
    )}>
      <Breadcrumb>
        <BreadcrumbList className="flex-wrap">
          {breadcrumbs.flatMap((crumb, index) => {
            const items = [];
            
            // Add the breadcrumb item
            items.push(
              <BreadcrumbItem key={`${crumb.label}-${index}`}>
                {crumb.href ? (
                  <BreadcrumbLink asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLocation(crumb.href!)}
                      className={cn(
                        "h-auto py-1.5 px-2.5",
                        "text-muted-foreground hover:text-foreground",
                        "transition-all duration-200",
                        "hover:bg-accent/50"
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        {index === 0 && (
                          <>
                            {crumb.icon}
                            <span className="hidden sm:inline">{crumb.label}</span>
                          </>
                        )}
                        {index !== 0 && crumb.label}
                      </span>
                    </Button>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="flex items-center gap-1.5 font-semibold text-foreground px-2.5 py-1.5">
                    {index === 0 && crumb.icon}
                    <span className={cn(index === 0 && "hidden sm:inline")}>
                      {crumb.label}
                    </span>
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
            );
            
            // Add separator if not the last item
            if (index < breadcrumbs.length - 1) {
              items.push(
                <BreadcrumbSeparator key={`separator-${index}`} className="[&>svg]:w-4 [&>svg]:h-4 text-muted-foreground/60">
                  <ChevronRight />
                </BreadcrumbSeparator>
              );
            }
            
            return items;
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}