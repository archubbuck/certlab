import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';
import { ContentSkeleton } from '@/components/ui/content-skeleton';
import { queryKeys } from '@/lib/queryClient';
import { MetadataDisplay } from '@/components/MetadataDisplay';
import { ContentRenderer } from '@/components/ContentRenderer';

export default function LecturePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: lecture,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.lecture.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/lecture/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load study guide');
      }
      return response.json();
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <ContentSkeleton lines={6} showHeader={true} />
        </div>
      </div>
    );
  }

  if (error || !lecture) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-red-200">
            <CardContent className="p-8 text-center">
              <div className="text-red-500 mb-4">
                <BookOpen className="h-12 w-12 mx-auto" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Study Guide Not Found</h2>
              <p className="text-gray-600 mb-4">
                The study guide you're looking for could not be found or may have been removed.
              </p>
              <Button onClick={() => navigate('/app/dashboard')}>Back to Dashboard</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{lecture.title}</h1>
                <p className="text-gray-600">
                  Generated on {new Date(lecture.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            {/* Display metadata */}
            <MetadataDisplay
              tags={lecture.tags}
              difficultyLevel={lecture.difficultyLevel}
              authorName={lecture.authorName}
              createdAt={lecture.createdAt}
              updatedAt={lecture.updatedAt}
            />
          </div>
        </div>

        {/* Study Guide Content with Multiple Content Type Support */}
        <ContentRenderer lecture={lecture} />

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4">
          <Button variant="outline" onClick={() => window.print()} className="flex-1">
            Print Study Guide
          </Button>
          <Button onClick={() => window.history.back()} className="flex-1">
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
