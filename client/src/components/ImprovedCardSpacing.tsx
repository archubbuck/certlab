import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ImprovedCardSpacingProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'spacious' | 'compact';
  title?: string;
  description?: string;
}

export default function ImprovedCardSpacing({ 
  children, 
  className, 
  variant = 'default',
  title,
  description
}: ImprovedCardSpacingProps) {
  const getSpacingClasses = () => {
    switch (variant) {
      case 'spacious':
        return 'card-spacious';
      case 'compact':
        return 'card-compact';
      default:
        return 'card-breathing';
    }
  };

  return (
    <Card className={cn(getSpacingClasses(), className)}>
      {(title || description) && (
        <CardHeader className="content-breathing">
          {title && <CardTitle className="section-rhythm">{title}</CardTitle>}
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </CardHeader>
      )}
      <CardContent className="content-breathing section-rhythm">
        {children}
      </CardContent>
    </Card>
  );
}