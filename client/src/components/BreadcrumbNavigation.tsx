import { useLocation } from "wouter";
import { ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

export default function BreadcrumbNavigation() {
  const [location, setLocation] = useLocation();

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.split('/').filter(Boolean);
    
    // Always start with home
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Dashboard', href: '/app/dashboard', icon: <Home className="w-4 h-4" /> }
    ];

    // Map path segments to readable labels
    const pathMapping: Record<string, string> = {
      'app': '',
      'dashboard': 'Dashboard',
      'quiz': 'Learning Session',
      'achievements': 'Achievements',
      'review': 'Review Sessions',
      'results': 'Results',
      'study-groups': 'Study Groups',
      'accessibility': 'Accessibility',
      'admin': 'Administration',
      'ui-structure': 'UI Structure'
    };

    let currentPath = '';
    
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const label = pathMapping[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      
      // Skip empty labels and don't duplicate dashboard
      if (label && label !== 'Dashboard' && segment !== 'app') {
        breadcrumbs.push({
          label,
          href: index < pathSegments.length - 1 ? currentPath : undefined
        });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  // Don't show breadcrumbs if we're only on dashboard
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.label} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 mx-2 text-muted-foreground/60" />
            )}
            {crumb.href ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation(crumb.href!)}
                className="h-auto p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  {crumb.icon}
                  {crumb.label}
                </span>
              </Button>
            ) : (
              <span className="flex items-center gap-1.5 text-foreground font-medium">
                {crumb.icon}
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}