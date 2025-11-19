'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { TeacherDashboard } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Users, 
  FileText, 
  ClipboardCheck, 
  TrendingUp,
  Clock,
  Award,
  ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

export default function TeacherDashboardPage() {
  const [dashboard, setDashboard] = useState<TeacherDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getTeacherDashboard();
      setDashboard(response);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!dashboard) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Overview of your teaching activities
          </p>
        </div>
        <Button onClick={() => router.push('/teacher/subjects')}>
          <BookOpen className="h-4 w-4 mr-2" />
          Manage Subjects
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.total_subjects}</div>
            <p className="text-xs text-muted-foreground">
              Active subjects you're teaching
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.total_lessons}</div>
            <p className="text-xs text-muted-foreground">
              Lessons created across subjects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.total_quizzes}</div>
            <p className="text-xs text-muted-foreground">
              Quizzes available to students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.total_students}</div>
            <p className="text-xs text-muted-foreground">
              Students enrolled in your subjects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Quiz Submissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Recent Quiz Submissions
            </CardTitle>
            <CardDescription>
              Latest quiz attempts by your students
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.recent_submissions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No quiz submissions yet
              </p>
            ) : (
              <div className="space-y-4">
                {dashboard.recent_submissions.slice(0, 5).map((submission) => {
                  const percentage = Math.round((submission.score / submission.total_points) * 100);
                  const passed = percentage >= 60;

                  return (
                    <div
                      key={submission.id}
                      className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">
                            {submission.first_name} {submission.last_name}
                          </p>
                          <Badge variant={passed ? 'default' : 'destructive'}>
                            {percentage}%
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {submission.quiz_title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {submission.subject_name} • {submission.lesson_title}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {format(new Date(submission.completed_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">
                          {submission.score}/{submission.total_points}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Performing Subjects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Subject Performance
            </CardTitle>
            <CardDescription>
              Your top performing subjects
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.top_subjects.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No subjects yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => router.push('/teacher/subjects')}
                >
                  Create Your First Subject
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboard.top_subjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/teacher/subjects/${subject.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{subject.name}</h4>
                        <div className="flex gap-4 mt-2 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {subject.enrolled_students} students
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {subject.total_lessons} lessons
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        {subject.avg_quiz_score !== null ? (
                          <>
                            <div className="flex items-center gap-1">
                              <Award className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm font-bold">
                                {subject.avg_quiz_score}%
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">Avg. Score</p>
                          </>
                        ) : (
                          <p className="text-xs text-gray-400">No quiz data</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-end mt-2 text-xs text-blue-600">
                      View Details
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
