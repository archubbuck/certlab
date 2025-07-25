import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface CollapsibleSectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  storageKey?: string;
  className?: string;
}

export default function CollapsibleSection({
  title,
  description,
  icon,
  children,
  defaultExpanded = false,
  storageKey,
  className = ""
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Load state from localStorage if storageKey is provided
  useEffect(() => {
    if (storageKey) {
      const savedState = localStorage.getItem(`collapsible-${storageKey}`);
      if (savedState !== null) {
        setIsExpanded(JSON.parse(savedState));
      }
    }
  }, [storageKey]);

  // Save state to localStorage when changed
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(`collapsible-${storageKey}`, JSON.stringify(isExpanded));
    }
  }, [isExpanded, storageKey]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card className={`card-enhanced transition-all duration-300 ${className}`}>
      <CardHeader className="card-spacious pb-3">
        <Button
          variant="ghost"
          onClick={toggleExpanded}
          className="w-full justify-between p-0 h-auto text-left hover:bg-transparent"
          aria-expanded={isExpanded}
          aria-controls={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}
        >
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10 text-primary">
                {icon}
              </div>
            )}
            <div className="text-left">
              <h3 className="font-semibold text-comfortable">{title}</h3>
              {description && (
                <p className="text-sm text-muted-foreground mt-1 text-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 transition-transform duration-200 ease-in-out">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </Button>
      </CardHeader>
      
      <div
        id={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded 
            ? 'max-h-[2000px] opacity-100' 
            : 'max-h-0 opacity-0'
        }`}
      >
        <CardContent className="card-breathing pt-0">
          <div className="content-breathing">
            {children}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}