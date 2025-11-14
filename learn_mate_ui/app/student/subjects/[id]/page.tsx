'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { offlineManager } from '@/lib/db';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OfflineDownloadButton } from '@/components/offline-download-button';
import { Loader2, BookOpen, CheckCircle, Lock, ArrowLeft, PlayCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Lesson {
  id: number;
  subject_id: number;
  title: string;
  content: string;
  content_file_url?: string | null;
  content_file_public_id?: string | null;
  content_file_name?: string | null;
  order_number: number;
  language: string;
  created_by?: number;
  is_published?: boolean | number;
  created_at: string;
  updated_at: string;
  quiz_count?: number;
  is_completed?: boolean;
}

interface Subject {
  id: number;
  name: string;
  description: string;
  grade_level: number;
  created_by: number;
  created_at: string;
  creator_username?: string;
  creator_first_name?: string;
  creator_last_name?: string;
  lesson_count?: number;
}

export default function SubjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const isOnline = useOnlineStatus();
  const subjectId = parseInt(params.id as string);

  const [subject, setSubject] = useState<Subject | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOfflineAvailable, setIsOfflineAvailable] = useState(false);

  useEffect(() => {
    fetchData();
    checkOfflineAvailability();
  }, [subjectId]);

  const fetchData = async () => {
    try {
      if (isOnline) {
        const [subjectResponse, lessonsResponse] = await Promise.all([
          api.getSubjectById(subjectId),
          api.getLessonsBySubject(subjectId)
        ]);
        
        const subjectData = subjectResponse.data || subjectResponse;
        const lessonsData = lessonsResponse.data?.lessons || lessonsResponse.lessons || lessonsResponse.data || lessonsResponse;
        const lessonsArray = Array.isArray(lessonsData) ? lessonsData : [];
        const lessonIds = lessonsArray.map((l: any) => l.id);
        
        if (lessonIds.length > 0 && lessonIds.length <= 10) {
          const progressPromises = lessonIds.map((id: number) => 
            api.getLessonById(id).catch(() => null)
          );
          const lessonDetails = await Promise.all(progressPromises);
          
          const lessonsWithProgress = lessonsArray.map((lesson: any) => {
            const detail = lessonDetails.find((d: any) => 
              d?.data?.lesson?.id === lesson.id || d?.lesson?.id === lesson.id || d?.id === lesson.id
            );
            const lessonData = detail?.data?.lesson || detail?.lesson || detail;
            return {
              ...lesson,
              is_completed: lessonData?.user_progress?.is_completed === 1 || 
                           lessonData?.user_progress?.is_completed === true ||
                           lessonData?.is_completed === true
            };
          });
          setLessons(lessonsWithProgress);
        } else {
          setLessons(lessonsArray);
        }
        
        setSubject(subjectData as Subject);
      } else {
        const offlineSubject = await offlineManager.getOfflineSubject(subjectId);
        if (offlineSubject) {
          setSubject(offlineSubject.subject);
          setLessons(offlineSubject.lessons);
        } else {
          setError('This subject is not available offline. Please go online to view it.');
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch subject:', err);
      setError(err.message || 'Failed to load subject details');
    } finally {
      setLoading(false);
    }
  };

  const checkOfflineAvailability = async () => {
    const available = await offlineManager.isSubjectAvailableOffline(subjectId);
    setIsOfflineAvailable(available);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">{error || 'Subject not found'}</p>
        </div>
      </div>
    );
  }

  const completedLessons = lessons.filter(l => l.is_completed).length;
  const progress = lessons.length > 0 ? (completedLessons / lessons.length) * 100 : 0;
  
  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Subjects
      </Button>

      {/* Subject Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-2xl">{subject.name}</CardTitle>
              <CardDescription className="mt-2">
                Grade {subject.grade_level}
              </CardDescription>
            </div>
            {isOfflineAvailable && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Available Offline
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{subject.description}</p>
          
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="text-sm font-medium">Progress</p>
              <p className="text-2xl font-bold">{Math.round(progress)}%</p>
              <p className="text-sm text-muted-foreground">
                {completedLessons} of {lessons.length} lessons completed
              </p>
            </div>
            <Progress value={progress} className="w-1/3" />
          </div>

          <OfflineDownloadButton
            subjectId={subjectId}
            subjectName={subject.name}
          />
        </CardContent>
      </Card>

      {/* Lessons List */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Lessons</h2>
        
        {lessons.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Lessons Yet</h3>
              <p className="text-muted-foreground">
                Lessons will appear here once they are added by your teacher
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {lessons.map((lesson, index) => (
              <Card key={lesson.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center font-bold shrink-0">
                      {lesson.order_number || index + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg">{lesson.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {lesson.is_completed && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Completed
                          </Badge>
                        )}
                        {lesson.quiz_count && lesson.quiz_count > 0 && (
                          <Badge variant="outline">
                            {lesson.quiz_count} {lesson.quiz_count === 1 ? 'Quiz' : 'Quizzes'}
                          </Badge>
                        )}
                        {lesson.content_file_url && (
                          <Badge variant="outline">
                            PDF Attached
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Link href={`/student/lessons/${lesson.id}`}>
                      <Button>
                        {lesson.is_completed ? (
                          <>
                            <BookOpen className="h-4 w-4 mr-2" />
                            Review
                          </>
                        ) : (
                          <>
                            <PlayCircle className="h-4 w-4 mr-2" />
                            Start
                          </>
                        )}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
