/**
 * Personalized Learning Recommendations Component
 *
 * Displays personalized learning recommendations based on the user's
 * Skills Assessment data, including learning style preferences,
 * experience level, and motivation-driven content suggestions.
 *
 * @module SkillsBasedRecommendations
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useSkillsAssessment, getDifficultyLabel } from '@/hooks/useSkillsAssessment';
import { useLocation } from 'wouter';
import {
  Lightbulb,
  Target,
  BookOpen,
  Palette,
  ArrowRight,
  Sparkles,
  GraduationCap,
  TrendingUp,
  Eye,
  Headphones,
  Hand,
  FileText,
} from 'lucide-react';

interface SkillsBasedRecommendationsProps {
  className?: string;
  /** Maximum number of recommendations to show */
  maxRecommendations?: number;
  /** Whether to show the complete assessment CTA if not filled */
  showAssessmentCTA?: boolean;
}

/**
 * Maps learning style to an icon component
 */
function getLearningStyleIcon(style: string | undefined) {
  switch (style) {
    case 'visual':
      return Eye;
    case 'auditory':
      return Headphones;
    case 'kinesthetic':
      return Hand;
    case 'reading':
      return FileText;
    default:
      return BookOpen;
  }
}

/**
 * Gets a description for the learning style
 */
function getLearningStyleLabel(style: string | undefined): string {
  switch (style) {
    case 'visual':
      return 'Visual Learner';
    case 'auditory':
      return 'Auditory Learner';
    case 'kinesthetic':
      return 'Hands-on Learner';
    case 'reading':
      return 'Reading/Writing Learner';
    default:
      return 'Learning Style';
  }
}

/**
 * Component that displays personalized learning recommendations
 * based on the user's Skills Assessment data.
 */
export default function SkillsBasedRecommendations({
  className = '',
  maxRecommendations = 3,
  showAssessmentCTA = true,
}: SkillsBasedRecommendationsProps) {
  const [, setLocation] = useLocation();
  const { skillsAssessment, preferences, contentRecommendations, suggestedFocusAreas, isLoading } =
    useSkillsAssessment();

  // Don't render while loading
  if (isLoading) {
    return null;
  }

  // Show CTA to complete assessment if not done
  if (!preferences.isAssessmentComplete && showAssessmentCTA) {
    return (
      <Card className={`border-dashed border-2 border-primary/30 bg-primary/5 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Personalize Your Experience
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Complete your Skills Assessment to unlock personalized learning recommendations tailored
            to your experience level, learning style, and goals.
          </p>
          <Button
            variant="default"
            size="sm"
            onClick={() => setLocation('/app/profile')}
            className="w-full"
          >
            <GraduationCap className="w-4 h-4 mr-2" />
            Complete Skills Assessment
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  const LearningStyleIcon = getLearningStyleIcon(skillsAssessment?.learningStyle);
  const displayRecommendations = contentRecommendations.slice(0, maxRecommendations);

  return (
    <Card className={`card-enhanced ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Personalized for You
          </CardTitle>
          {skillsAssessment?.learningStyle && (
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <LearningStyleIcon className="w-3 h-3" />
              {getLearningStyleLabel(skillsAssessment.learningStyle)}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Experience Level & Difficulty */}
        {skillsAssessment?.experienceLevel && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Recommended Difficulty</span>
            </div>
            <Badge variant="secondary">
              {getDifficultyLabel(preferences.recommendedDifficulty)}
            </Badge>
          </div>
        )}

        {/* Learning Style Recommendations */}
        {displayRecommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Based on your learning style
            </h4>
            <div className="space-y-2">
              {displayRecommendations.map((rec, index) => (
                <div
                  key={`${rec.type}-${index}`}
                  className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <span className="text-lg">{rec.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{rec.title}</span>
                      {rec.priority === 'high' && (
                        <Badge variant="default" className="text-xs px-1.5 py-0">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{rec.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Focus Areas (experience gaps) */}
        {suggestedFocusAreas.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Suggested Focus Areas
            </h4>
            <div className="flex flex-wrap gap-2">
              {suggestedFocusAreas.map((area) => (
                <Badge key={area} variant="outline" className="text-xs">
                  {area}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on areas not listed in your experience
            </p>
          </div>
        )}

        {/* Motivation-based messaging */}
        {(preferences.showCareerAdvancement || preferences.showComplianceContent) && (
          <div className="pt-2 border-t border-border/50">
            {preferences.showCareerAdvancement && (
              <p className="text-xs text-muted-foreground italic">
                💼 Your certification journey supports your career advancement goals
              </p>
            )}
            {preferences.showComplianceContent && (
              <p className="text-xs text-muted-foreground italic mt-1">
                ✓ Building knowledge that supports compliance requirements
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
