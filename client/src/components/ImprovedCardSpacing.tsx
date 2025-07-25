import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ImprovedCardSpacingProps {
  title: string;
  description?: string;
  badge?: string;
  children: React.ReactNode;
  variant?: "default" | "compact" | "spacious";
  className?: string;
}

export default function ImprovedCardSpacing({
  title,
  description,
  badge,
  children,
  variant = "default",
  className = ""
}: ImprovedCardSpacingProps) {
  
  const spacingClasses = {
    compact: "card-compact",
    default: "card-enhanced",
    spacious: "card-spacious"
  };

  const contentSpacing = {
    compact: "p-4",
    default: "card-breathing",
    spacious: "card-breathing-extra"
  };

  return (
    <Card className={`${spacingClasses[variant]} ${className}`}>
      <CardHeader className="card-spacious border-b border-border/30">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-comfortable flex items-center gap-2">
              {title}
              {badge && (
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  {badge}
                </Badge>
              )}
            </CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1 text-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className={contentSpacing[variant]}>
        <div className="content-breathing">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}