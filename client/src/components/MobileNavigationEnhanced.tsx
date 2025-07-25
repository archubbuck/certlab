import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Menu, Home, BookOpen, Award, Settings, BarChart3, Zap, Brain, Target } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
  description?: string;
}

interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

export default function MobileNavigationEnhanced() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();

  const navigationSections: NavigationSection[] = [
    {
      title: "Main",
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: <Home className="w-4 h-4" />,
          href: "/",
          description: "Your learning home"
        },
        {
          id: "achievements",
          label: "Achievements",
          icon: <Award className="w-4 h-4" />,
          href: "/achievements",
          description: "Track your progress"
        },
      ]
    },
    {
      title: "Quick Actions",
      items: [
        {
          id: "quick-quiz",
          label: "Quick Quiz",
          icon: <Zap className="w-4 h-4" />,
          href: "/quiz/quick",
          badge: "5 min",
          description: "Fast practice session"
        },
        {
          id: "helen-rec",
          label: "Helen's Pick",
          icon: <Brain className="w-4 h-4" />,
          href: "/quiz/recommended",
          badge: "AI",
          description: "AI-curated questions"
        },
      ]
    },
    {
      title: "Tools",
      items: [
        {
          id: "accessibility",
          label: "Accessibility",
          icon: <Settings className="w-4 h-4" />,
          href: "/accessibility",
          description: "WCAG compliance tools"
        },
        {
          id: "ui-structure",
          label: "App Structure",
          icon: <BarChart3 className="w-4 h-4" />,
          href: "/ui-structure",
          description: "Explore architecture"
        },
      ]
    }
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  const handleItemClick = () => {
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.email || 'User'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Learning Dashboard
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Sections */}
          <div className="flex-1 overflow-y-auto py-4">
            {navigationSections.map((section, sectionIndex) => (
              <div key={section.title} className="px-4 mb-6">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Link key={item.id} href={item.href}>
                      <div
                        onClick={handleItemClick}
                        className={`
                          flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer
                          ${isActive(item.href) 
                            ? 'bg-primary text-primary-foreground' 
                            : 'hover:bg-muted'
                          }
                        `}
                      >
                        <div className="flex-shrink-0">
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {item.label}
                            </span>
                            {item.badge && (
                              <Badge variant="secondary" className="text-xs">
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                {sectionIndex < navigationSections.length - 1 && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}
          </div>

          {/* Bottom Action */}
          <div className="p-4 border-t">
            <Button 
              className="w-full" 
              onClick={handleItemClick}
            >
              <Target className="w-4 h-4 mr-2" />
              Start Learning
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}