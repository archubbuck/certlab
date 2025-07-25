import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

interface PersonalizedInsightsProps {
  insights: string[];
}

export default function PersonalizedInsights({ insights }: PersonalizedInsightsProps) {
  if (insights.length === 0) return null;

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
          <Lightbulb className="w-5 h-5" />
          Helen's Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {insights.map((insight, index) => (
            <p 
              key={index} 
              className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed"
            >
              {insight}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}