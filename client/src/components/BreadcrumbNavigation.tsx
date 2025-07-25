import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "wouter";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  BreadcrumbPage
} from "@/components/ui/breadcrumb";

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

const routeMap: Record<string, BreadcrumbItem[]> = {
  '/': [
    { label: 'Dashboard', isCurrentPage: true }
  ],
  '/achievements': [
    { label: 'Dashboard', href: '/' },
    { label: 'Achievements', isCurrentPage: true }
  ],
  '/accessibility': [
    { label: 'Dashboard', href: '/' },
    { label: 'Tools', href: '/' },
    { label: 'Accessibility', isCurrentPage: true }
  ],
  '/ui-structure': [
    { label: 'Dashboard', href: '/' },
    { label: 'Tools', href: '/' },
    { label: 'App Structure', isCurrentPage: true }
  ],
  '/admin': [
    { label: 'Dashboard', href: '/' },
    { label: 'Administration', isCurrentPage: true }
  ]
};

// Dynamic route patterns
const dynamicRoutes = [
  {
    pattern: /^\/quiz\/(\d+)$/,
    generator: (matches: RegExpMatchArray) => [
      { label: 'Dashboard', href: '/' },
      { label: 'Quiz Session', isCurrentPage: true }
    ]
  },
  {
    pattern: /^\/results\/(\d+)$/,
    generator: (matches: RegExpMatchArray) => [
      { label: 'Dashboard', href: '/' },
      { label: 'Quiz Results', isCurrentPage: true }
    ]
  },
  {
    pattern: /^\/review\/(\d+)$/,
    generator: (matches: RegExpMatchArray) => [
      { label: 'Dashboard', href: '/' },
      { label: 'Quiz Review', isCurrentPage: true }
    ]
  }
];

export default function BreadcrumbNavigation() {
  const [location] = useLocation();

  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    // Check static routes first
    if (routeMap[location]) {
      return routeMap[location];
    }

    // Check dynamic routes
    for (const route of dynamicRoutes) {
      const matches = location.match(route.pattern);
      if (matches) {
        return route.generator(matches);
      }
    }

    // Fallback for unknown routes
    const pathSegments = location.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Dashboard', href: '/' }
    ];

    pathSegments.forEach((segment, index) => {
      const isLast = index === pathSegments.length - 1;
      const href = '/' + pathSegments.slice(0, index + 1).join('/');
      const label = segment.charAt(0).toUpperCase() + segment.slice(1);

      breadcrumbs.push({
        label,
        href: isLast ? undefined : href,
        isCurrentPage: isLast
      });
    });

    return breadcrumbs;
  };

  const breadcrumbItems = getBreadcrumbItems();

  // Don't show breadcrumbs on home page or if only one item
  if (location === '/' || breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <div className="border-b bg-muted/30 px-4 py-2">
      <div className="max-w-7xl mx-auto">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">
                  <Home className="w-3 h-3" />
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            
            {breadcrumbItems.slice(1).map((item, index) => (
              <div key={index} className="flex items-center">
                <BreadcrumbSeparator>
                  <ChevronRight className="w-3 h-3" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  {item.isCurrentPage ? (
                    <BreadcrumbPage className="text-sm">
                      {item.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={item.href!} className="text-sm hover:text-foreground">
                        {item.label}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
}