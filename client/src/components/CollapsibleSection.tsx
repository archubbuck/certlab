import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CollapsibleSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  persistKey?: string; // Key for localStorage persistence
  className?: string;
  icon?: React.ReactNode;
}

export default function CollapsibleSection({
  title,
  description,
  children,
  defaultExpanded = true,
  persistKey,
  className = "",
  icon
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Load persisted state on mount
  useEffect(() => {
    if (persistKey) {
      try {
        const saved = localStorage.getItem(`collapsible-${persistKey}`);
        if (saved !== null) {
          setIsExpanded(JSON.parse(saved));
        }
      } catch (error) {
        console.warn('Failed to load collapse state:', error);
      }
    }
  }, [persistKey]);

  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    
    // Persist state if key provided
    if (persistKey) {
      try {
        localStorage.setItem(`collapsible-${persistKey}`, JSON.stringify(newState));
      } catch (error) {
        console.warn('Failed to save collapse state:', error);
      }
    }
  };

  return (
    <Card className={`card-enhanced transition-all duration-200 ${className}`}>
      <CardHeader 
        className="cursor-pointer select-none card-spacious border-b border-border/50"
        onClick={handleToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && <div className="text-primary">{icon}</div>}
            <div>
              <CardTitle className="text-lg font-semibold text-comfortable">
                {title}
              </CardTitle>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {description}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 shrink-0 text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="card-breathing animate-in slide-in-from-top-2 duration-200">
          {children}
        </CardContent>
      )}
    </Card>
  );
}