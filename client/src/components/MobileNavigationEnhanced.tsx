import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/lib/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Menu, 
  Home, 
  BookOpen, 
  Trophy, 
  Users, 
  Settings, 
  ChevronRight,
  ArrowLeft,
  Search,
  Star,
  TrendingUp,
  Clock
} from "lucide-react";

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  description?: string;
  isNew?: boolean;
}

export default function MobileNavigationEnhanced() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const navSections: NavSection[] = [
    {
      title: "Learning",
      items: [
        {
          label: "Dashboard",
          href: "/app/dashboard",
          icon: <Home className="w-4 h-4" />,
          description: "Your learning overview"
        },
        {
          label: "Start Learning",
          href: "/app/quiz",
          icon: <BookOpen className="w-4 h-4" />,
          description: "Begin a new session",
          badge: "Quick"
        },
        {
          label: "Achievements",
          href: "/app/achievements",
          icon: <Trophy className="w-4 h-4" />,
          description: "View your badges and progress"
        },
        {
          label: "Study Groups",
          href: "/app/study-groups",
          icon: <Users className="w-4 h-4" />,
          description: "Collaborative learning",
          isNew: true
        }
      ]
    },
    {
      title: "Tools & Features",
      items: [
        {
          label: "Review Sessions",
          href: "/app/review",
          icon: <Clock className="w-4 h-4" />,
          description: "Review past performance"
        },
        {
          label: "Progress Analytics",
          href: "/app/analytics",
          icon: <TrendingUp className="w-4 h-4" />,
          description: "Detailed performance insights",
          isNew: true
        },
        {
          label: "Accessibility",
          href: "/app/accessibility",
          icon: <Settings className="w-4 h-4" />,
          description: "Accessibility features"
        }
      ]
    }
  ];

  // Filter items based on search
  const filteredSections = searchQuery
    ? navSections
        .map(section => ({
          ...section,
          items: section.items.filter(item =>
            item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        }))
        .filter(section => section.items.length > 0)
    : navSections;

  const handleNavigation = (href: string) => {
    setLocation(href);
    setIsOpen(false);
    setCurrentSection(null);
    setSearchQuery("");
  };

  const handleSectionClick = (sectionTitle: string) => {
    setCurrentSection(currentSection === sectionTitle ? null : sectionTitle);
  };

  const handleBack = () => {
    setCurrentSection(null);
    setSearchQuery("");
  };

  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        window.location.href = '/app/login';
      }
    } catch (error) {
      console.error('Sign out failed:', error);
    }
    setIsOpen(false);
  };

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
    setCurrentSection(null);
    setSearchQuery("");
  }, [location]);

  if (!isMobile) {
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="p-2 h-9 w-9 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      
      <SheetContent side="left" className="w-80 p-0">
        <ScrollArea className="h-full">
          <div className="flex flex-col h-full">
            {/* Header with user info */}
            <div className="p-4 border-b border-border bg-muted/20">
              {currentSection && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="mb-3 p-0 h-auto text-sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Menu
                </Button>
              )}
              
              {!currentSection && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {user?.firstName?.[0] || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {user?.firstName || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Cert Lab Student
                      </p>
                    </div>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search features..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Navigation content */}
            <div className="flex-1 p-4">
              {!currentSection ? (
                // Main menu
                <div className="space-y-4">
                  {filteredSections.map((section) => (
                    <div key={section.title}>
                      <button
                        onClick={() => handleSectionClick(section.title)}
                        className="w-full flex items-center justify-between p-3 text-left rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <h3 className="font-medium text-sm">{section.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            {section.items.length} features
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                // Section detail view
                <div className="space-y-2">
                  {filteredSections
                    .find(section => section.title === currentSection)
                    ?.items.map((item) => (
                      <button
                        key={item.href}
                        onClick={() => handleNavigation(item.href)}
                        className={`w-full p-4 text-left rounded-lg border transition-all duration-200 hover:shadow-md ${
                          location === item.href
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {item.label}
                              </span>
                              {item.badge && (
                                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                  {item.badge}
                                </Badge>
                              )}
                              {item.isNew && (
                                <Badge variant="outline" className="text-xs px-2 py-0.5 border-green-200 text-green-700">
                                  <Star className="w-3 h-3 mr-1" />
                                  New
                                </Badge>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-muted-foreground">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-muted/10">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="w-full"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}