'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, BookOpen, Award, TrendingUp, ArrowLeft } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface SubjectProgress {
  subject_id: number;
  subject_name: string;
  grade_level: number;
  total_lessons: number;
  completed_lessons: number;
  completion_percentage: number;
  avg_quiz_score: number | null;
}

export default function StudentProgressPage() {
  const router = useRouter();
  const [progressData, setProgressData] = useState<SubjectProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const response = await api.getStudentProgress();
      const data = response.data?.subjects || response.subjects || [];
      setProgressData(data);
    } catch (err: any) {
      console.error('Failed to fetch progress:', err);
      setError(err.message || 'Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 50) return 'text-blue-600';
    if (percentage >= 25) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-600';
    if (percentage >= 50) return 'bg-blue-600';
    if (percentage >= 25) return 'bg-yellow-600';
    return 'bg-gray-600';
  };

  const getQuizScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  const overallStats = progressData.reduce(
    (acc, subject) => ({
      totalLessons: acc.totalLessons + subject.total_lessons,
      completedLessons: acc.completedLessons + subject.completed_lessons,
      totalQuizScore: acc.totalQuizScore + (subject.avg_quiz_score || 0),
      quizCount: acc.quizCount + (subject.avg_quiz_score ? 1 : 0)
    }),
    { totalLessons: 0, completedLessons: 0, totalQuizScore: 0, quizCount: 0 }
  );

  const overallCompletion = overallStats.totalLessons > 0
    ? Math.round((overallStats.completedLessons / overallStats.totalLessons) * 100)
    : 0;

  const overallQuizAverage = overallStats.quizCount > 0
    ? Math.round(overallStats.totalQuizScore / overallStats.quizCount)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Progress</h1>
          <p className="text-muted-foreground mt-1">
            Track your learning journey across all subjects
          </p>
        </div>
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overall Completion
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{overallCompletion}%</div>
            <Progress value={overallCompletion} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {overallStats.completedLessons} of {overallStats.totalLessons} lessons completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Enrolled Subjects
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{progressData.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Active learning paths
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Quiz Score
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {overallQuizAverage !== null ? `${overallQuizAverage}%` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Across all subjects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subject Progress */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Progress by Subject</h2>
        
        {progressData.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Subjects Yet</h3>
              <p className="text-muted-foreground mb-4">
                Enroll in subjects to start tracking your progress
              </p>
              <Link href="/student/subjects">
                <Button>Browse Subjects</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {progressData.map((subject) => (
              <Card key={subject.subject_id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Subject Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-semibold">{subject.subject_name}</h3>
                          <Badge variant="outline">Grade {subject.grade_level}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {subject.completed_lessons} of {subject.total_lessons} lessons completed
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-3xl font-bold ${getProgressColor(subject.completion_percentage)}`}>
                          {subject.completion_percentage}%
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <Progress 
                        value={subject.completion_percentage} 
                        className="h-3"
                      />
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Lesson Progress
                        </span>
                        {subject.completion_percentage === 100 && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            Completed!
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Quiz Score and Action */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-4">
                        {subject.avg_quiz_score !== null ? (
                          <div className={`px-3 py-1 rounded-md border ${getQuizScoreColor(subject.avg_quiz_score)}`}>
                            <span className="text-sm font-medium">
                              Quiz Average: {subject.avg_quiz_score}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            No quizzes taken yet
                          </span>
                        )}
                      </div>
                      <Link href={`/student/subjects/${subject.subject_id}`}>
                        <Button variant="outline" size="sm">
                          {subject.completion_percentage === 100 ? 'Review' : 'Continue Learning'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Performance Summary */}
      {progressData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Top Performing Subjects</h4>
                  <div className="space-y-2">
                    {progressData
                      .filter(s => s.avg_quiz_score !== null)
                      .sort((a, b) => (b.avg_quiz_score || 0) - (a.avg_quiz_score || 0))
                      .slice(0, 3)
                      .map((subject) => (
                        <div key={subject.subject_id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{subject.subject_name}</span>
                          <span className="font-medium">{subject.avg_quiz_score}%</span>
                        </div>
                      ))}
                    {progressData.filter(s => s.avg_quiz_score !== null).length === 0 && (
                      <p className="text-sm text-muted-foreground">No quiz scores yet</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Nearly Complete</h4>
                  <div className="space-y-2">
                    {progressData
                      .filter(s => s.completion_percentage > 0 && s.completion_percentage < 100)
                      .sort((a, b) => b.completion_percentage - a.completion_percentage)
                      .slice(0, 3)
                      .map((subject) => (
                        <div key={subject.subject_id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{subject.subject_name}</span>
                          <span className="font-medium">{subject.completion_percentage}%</span>
                        </div>
                      ))}
                    {progressData.filter(s => s.completion_percentage > 0 && s.completion_percentage < 100).length === 0 && (
                      <p className="text-sm text-muted-foreground">All subjects complete or not started</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
