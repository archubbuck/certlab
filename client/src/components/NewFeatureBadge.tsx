import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Sparkles } from "lucide-react";

interface NewFeatureBadgeProps {
  featureId: string;
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export default function NewFeatureBadge({
  featureId,
  children,
  title = "New Feature!",
  description = "Check out this enhanced functionality",
  className = ""
}: NewFeatureBadgeProps) {
  const [isVisible, setIsVisible] = useState(false);
  const storageKey = `new-feature-dismissed-${featureId}`;

  useEffect(() => {
    // Check if this feature badge has been dismissed
    const dismissed = localStorage.getItem(storageKey);
    if (!dismissed) {
      // Small delay to make the animation more noticeable
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  const handleDismiss = () => {
    localStorage.setItem(storageKey, 'true');
    setIsVisible(false);
  };

  return (
    <div className={`relative ${className}`}>
      {children}
      
      {isVisible && (
        <div className="absolute -top-2 -right-2 z-20 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="relative">
            <Badge 
              variant="default" 
              className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg border-0 px-3 py-1 animate-pulse"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              {title}
            </Badge>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="absolute -top-1 -right-1 h-5 w-5 p-0 rounded-full bg-background/80 hover:bg-background border border-border/50"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
          
          {/* Tooltip/description */}
          <div className="absolute top-full right-0 mt-2 w-48 p-2 bg-popover border border-border rounded-md shadow-md text-xs text-popover-foreground animate-in fade-in slide-in-from-top-1 duration-200 delay-100">
            <p className="text-relaxed">{description}</p>
            <div className="absolute -top-1 right-4 w-2 h-2 bg-popover border-l border-t border-border rotate-45"></div>
          </div>
        </div>
      )}
    </div>
  );
}