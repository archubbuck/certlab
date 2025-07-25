import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Target, 
  Clock, 
  Award,
  BookOpen,
  AlertCircle,
  CheckCircle,
  ArrowRight
} from "lucide-react";

interface PersonalizedInsight {
  id: string;
  type: 'strength' | 'weakness' | 'recommendation' | 'achievement' | 'warning';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  actionText?: string;
  actionUrl?: string;
  metric?: string;
  progress?: number;
}

interface PersonalizedInsightsProps {
  insights: PersonalizedInsight[];
  className?: string;
}

export default function PersonalizedInsights({ 
  insights, 
  className = "" 
}: PersonalizedInsightsProps) {
  
  if (!insights || insights.length === 0) {
    return null;
  }

  const getInsightIcon = (type: PersonalizedInsight['type']) => {
    switch (type) {
      case 'strength':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'weakness':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case 'recommendation':
        return <Target className="w-4 h-4 text-blue-600" />;
      case 'achievement':
        return <Award className="w-4 h-4 text-purple-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <BookOpen className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getInsightBadgeVariant = (priority: PersonalizedInsight['priority']) => {
    switch (priority) {
      case 'high':
        return 'destructive' as const;
      case 'medium':
        return 'default' as const;
      case 'low':
        return 'secondary' as const;
      default:
        return 'secondary' as const;
    }
  };

  // Sort insights by priority (high first)
  const sortedInsights = insights.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  // Show max 3 insights to avoid overwhelming the user
  const displayInsights = sortedInsights.slice(0, 3);

  return (
    <Card className={`card-enhanced mb-6 ${className}`}>
      <CardHeader className="card-spacious pb-3">
        <CardTitle className="text-base font-semibold text-comfortable flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Helen's Insights
          <Badge variant="outline" className="text-xs">
            Personalized
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="card-breathing pt-0">
        <div className="space-y-3">
          {displayInsights.map((insight) => (
            <div 
              key={insight.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex-shrink-0 mt-0.5">
                {getInsightIcon(insight.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm text-foreground">
                    {insight.title}
                  </h4>
                  <Badge 
                    variant={getInsightBadgeVariant(insight.priority)}
                    className="text-xs px-1.5 py-0.5"
                  >
                    {insight.priority}
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground text-relaxed mb-2">
                  {insight.message}
                </p>
                
                {insight.metric && (
                  <div className="text-xs text-primary font-medium mb-2">
                    {insight.metric}
                  </div>
                )}
                
                {insight.progress !== undefined && (
                  <div className="w-full bg-muted rounded-full h-1.5 mb-2">
                    <div 
                      className="bg-primary h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, insight.progress))}%` }}
                    />
                  </div>
                )}
                
                {insight.actionText && insight.actionUrl && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-auto p-0 text-xs font-medium text-primary hover:text-primary/80"
                    onClick={() => window.location.href = insight.actionUrl!}
                  >
                    {insight.actionText}
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-3 border-t border-border/30">
          <p className="text-xs text-muted-foreground text-center text-relaxed">
            <Clock className="w-3 h-3 inline mr-1" />
            Updated based on your recent learning activity
          </p>
        </div>
      </CardContent>
    </Card>
  );
}