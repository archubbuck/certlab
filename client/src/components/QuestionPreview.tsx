import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, BookOpen, Clock } from "lucide-react";

interface QuestionPreviewProps {
  question: {
    id: number;
    text: string;
    options: Array<{ text: string; id: number }>;
    difficulty: number;
    category: string;
    subcategory: string;
  };
  onSelect: (questionId: number) => void;
  isSelected?: boolean;
}

export default function QuestionPreview({ question, onSelect, isSelected = false }: QuestionPreviewProps) {
  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1:
      case 2:
        return 'bg-green-100 text-green-800 border-green-200';
      case 3:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 4:
      case 5:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 2) return 'Beginner';
    if (difficulty === 3) return 'Intermediate';
    return 'Advanced';
  };

  return (
    <Card className={`transition-all cursor-pointer hover:shadow-md ${
      isSelected ? 'ring-2 ring-blue-500 border-blue-200' : ''
    }`} onClick={() => onSelect(question.id)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {question.category}
              </Badge>
              <Badge 
                variant="outline" 
                className={`text-xs ${getDifficultyColor(question.difficulty)}`}
              >
                {getDifficultyLabel(question.difficulty)}
              </Badge>
            </div>
            <CardTitle className="text-sm font-medium leading-tight">
              {question.subcategory}
            </CardTitle>
          </div>
          <Button 
            variant={isSelected ? "default" : "outline"}
            size="sm"
            className="shrink-0"
          >
            {isSelected ? (
              <>
                <Eye className="w-3 h-3 mr-1" />
                Selected
              </>
            ) : (
              <>
                <BookOpen className="w-3 h-3 mr-1" />
                Preview
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          {question.text.substring(0, 120)}
          {question.text.length > 120 && '...'}
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {question.options.length} options
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            ~2 min
          </div>
        </div>
      </CardContent>
    </Card>
  );
}