import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { queryKeys } from '@/lib/queryClient';
import { useLearningPreferences } from '@/hooks/useLearningPreferences';
import { PlayCircle, BookOpen, Star, Target } from 'lucide-react';
import type { Category } from '@shared/schema';

const LAST_CERTIFICATION_KEY = 'certlab_last_certification';

interface CertificationSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartQuiz: (categoryId: number, categoryName: string) => void;
  isLoading?: boolean;
}

export function CertificationSelectionDialog({
  open,
  onOpenChange,
  onStartQuiz,
  isLoading = false,
}: CertificationSelectionDialogProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  // Get user's learning preferences
  const { isCategoryInGoals, hasCertificationGoals } = useLearningPreferences();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: queryKeys.categories.all(),
  });

  // Sort categories: recommended (matching goals) first
  const sortedCategories = useMemo(() => {
    if (!hasCertificationGoals) return categories;

    return [...categories].sort((a, b) => {
      const aInGoals = isCategoryInGoals(a);
      const bInGoals = isCategoryInGoals(b);
      if (aInGoals && !bInGoals) return -1;
      if (!aInGoals && bInGoals) return 1;
      return 0;
    });
  }, [categories, hasCertificationGoals, isCategoryInGoals]);

  // Load last selected certification from localStorage, or default to first goal-aligned category
  useEffect(() => {
    if (open && categories.length > 0) {
      try {
        const lastCertificationId = localStorage.getItem(LAST_CERTIFICATION_KEY);
        if (
          lastCertificationId &&
          categories.some((c) => c.id.toString() === lastCertificationId)
        ) {
          setSelectedCategoryId(lastCertificationId);
        } else if (hasCertificationGoals && sortedCategories.length > 0) {
          // Default to first recommended category based on goals
          setSelectedCategoryId(sortedCategories[0].id.toString());
        } else {
          // Default to first category if no last selection or if the last selection is no longer valid
          setSelectedCategoryId(categories[0].id.toString());
        }
      } catch (error) {
        // If localStorage fails, just default to first category
        setSelectedCategoryId(categories[0].id.toString());
      }
    }
  }, [open, categories, sortedCategories, hasCertificationGoals]);

  const handleStartQuiz = () => {
    if (!selectedCategoryId) return;

    const categoryId = parseInt(selectedCategoryId, 10);
    if (isNaN(categoryId)) return;

    const selectedCategory = categories.find((c) => c.id === categoryId);

    if (selectedCategory) {
      // Save selection for next time
      try {
        localStorage.setItem(LAST_CERTIFICATION_KEY, selectedCategoryId);
      } catch (error) {
        // Silently fail if localStorage is unavailable
        console.warn('Failed to save certification selection:', error);
      }
      onStartQuiz(categoryId, selectedCategory.name);
    }
  };

  const selectedCategory = categories.find((c) => c.id.toString() === selectedCategoryId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Select Certification
          </DialogTitle>
          <DialogDescription>
            {hasCertificationGoals
              ? 'Certifications matching your goals are highlighted. Your selection will be remembered.'
              : 'Choose which certification you want to practice. Your selection will be remembered for future sessions.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
            {hasCertificationGoals && <Target className="h-4 w-4 text-primary" />}
            {hasCertificationGoals ? 'Recommended for You' : 'Available Certifications'}
          </Label>

          {categories.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <p>No certifications available.</p>
              <p className="text-sm mt-1">Please add certifications first.</p>
            </div>
          ) : (
            <RadioGroup
              value={selectedCategoryId}
              onValueChange={setSelectedCategoryId}
              className="space-y-3"
            >
              {sortedCategories.map((category) => {
                const isRecommended = isCategoryInGoals(category);
                return (
                  <div
                    key={category.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedCategoryId === category.id.toString()
                        ? 'border-primary bg-primary/5'
                        : isRecommended && hasCertificationGoals
                          ? 'border-yellow-300 dark:border-yellow-600 bg-yellow-50/50 dark:bg-yellow-900/20 hover:border-primary/50'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <RadioGroupItem
                      value={category.id.toString()}
                      id={`cert-${category.id}`}
                      className="shrink-0"
                    />
                    <Label htmlFor={`cert-${category.id}`} className="flex-1 cursor-pointer">
                      <div className="font-medium flex items-center gap-2">
                        {category.name}
                        {isRecommended && hasCertificationGoals && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                      {category.description && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {category.description}
                        </div>
                      )}
                      {isRecommended && hasCertificationGoals && (
                        <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">
                          Matches your certification goals
                        </div>
                      )}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          )}
        </div>

        <div className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">10 questions</span> will be selected from
            the{' '}
            <span className="font-medium text-foreground">
              {selectedCategory?.name || 'selected certification'}
            </span>{' '}
            category.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleStartQuiz}
            disabled={isLoading || !selectedCategoryId || categories.length === 0}
            className="gap-2"
          >
            <PlayCircle className="w-4 h-4" />
            {isLoading ? 'Starting...' : 'Start Practice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
