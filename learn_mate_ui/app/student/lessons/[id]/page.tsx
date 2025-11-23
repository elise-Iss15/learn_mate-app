'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { syncQueue, offlineManager } from '@/lib/db';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, CheckCircle, FileText, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface Quiz {
  id: number;
  title: string;
  description: string;
  time_limit: number;
  passing_score: number;
  max_attempts: number;
}

interface UserProgress {
  is_completed: number;
  time_spent: number;
  last_accessed: string;
}

interface Lesson {
  id: number;
  subject_id: number;
  title: string;
  content: string;
  content_file_url?: string | null;
  content_file_name?: string | null;
  order_number: number;
  language: string;
  created_by?: number;
  is_published?: number | boolean;
  created_at: string;
  updated_at: string;
  subject_name?: string;
  grade_level?: number;
  creator_username?: string;
  quizzes?: Quiz[];
  user_progress?: UserProgress;
  has_quiz?: boolean;
  quiz_id?: number;
  quiz_count?: number;
  is_completed?: boolean;
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const isOnline = useOnlineStatus();
  const lessonId = parseInt(params.id as string);

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);

  useEffect(() => {
    fetchLesson();
  }, [lessonId]);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [lessonId]);

  const fetchLesson = async () => {
    try {
      if (isOnline) {
        const response = await api.getLessonById(lessonId);
        // Handle nested response structure: response.data.lesson
        const lessonData = response.data?.lesson || response.lesson || response.data || response;
        setLesson(lessonData as Lesson);
      } else {
        // Try to find lesson in offline storage
        const offlineSubjects = await offlineManager.getAllOfflineSubjects();
        let foundLesson: Lesson | null = null;

        for (const offlineSubject of offlineSubjects) {
          const lessonMatch = offlineSubject.lessons.find(l => l.id === lessonId);
          if (lessonMatch) {
            foundLesson = lessonMatch;
            break;
          }
        }

        if (foundLesson) {
          setLesson(foundLesson);
        } else {
          setError('This lesson is not available offline. Please go online to view it.');
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch lesson:', err);
      setError(err.message || 'Failed to load lesson');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!lesson) return;

    setCompleting(true);
    try {
      if (isOnline) {
        await api.markLessonComplete(lessonId, timeSpent);
        setLesson({ 
          ...lesson, 
          is_completed: true,
          user_progress: {
            ...lesson.user_progress,
            is_completed: 1,
            time_spent: (lesson.user_progress?.time_spent || 0) + timeSpent,
            last_accessed: new Date().toISOString()
          } as UserProgress
        });
      } else {
        await syncQueue.add({
          type: 'lesson_progress',
          endpoint: `/student/lessons/${lessonId}/progress`,
          method: 'POST',
          payload: {
            lesson_id: lessonId,
            completed: true,
            time_spent: timeSpent
          }
        });
        setLesson({ ...lesson, is_completed: true });
      }
    } catch (err: any) {
      console.error('Failed to mark lesson complete:', err);
      alert('Failed to mark lesson as complete. Please try again.');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertDescription>{error || 'Lesson not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }
  console.log('Lesson data:', lesson);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        {!isOnline && (
          <Badge variant="secondary">Offline Mode</Badge>
        )}
      </div>

      {/* Lesson Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              {lesson.subject_name && (
                <p className="text-sm text-muted-foreground mb-1">
                  {lesson.subject_name}
                  {lesson.grade_level && ` • Grade ${lesson.grade_level}`}
                </p>
              )}
              <CardTitle className="text-2xl">{lesson.title}</CardTitle>
              {lesson.user_progress?.is_completed || lesson.is_completed ? (
                <div className="flex items-center gap-2 mt-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Completed</span>
                </div>
              ) : null}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Lesson Content */}
      <Card>
        <CardHeader>
          <CardTitle>Lesson Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="prose prose-slate max-w-none"
            dangerouslySetInnerHTML={{ __html: lesson.content }}
          />
        </CardContent>
      </Card>

      {/* PDF Attachment */}
      {lesson.content_file_url && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/lessons/${lessonId}/download`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <FileText className="h-5 w-5" />
              <span>{lesson.content_file_name || 'Download Lesson PDF'}</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4 flex-wrap">
        {!(lesson.user_progress?.is_completed || lesson.is_completed) && (
          <Button
            size="lg"
            onClick={handleMarkComplete}
            disabled={completing}
          >
            {completing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Marking Complete...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Complete
              </>
            )}
          </Button>
        )}

        {lesson.quizzes && lesson.quizzes.length > 0 && (
          lesson.quizzes.map((quiz) => (
            <Link key={quiz.id} href={`/student/quiz/${quiz.id}`}>
              <Button size="lg" variant="outline">
                {quiz.title}
              </Button>
            </Link>
          ))
        )}
      </div>

      {!isOnline && (
        <Alert>
          <AlertDescription>
            You're viewing this lesson offline. Your progress will be synced when you're back online.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
