'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookOpen, CheckCircle, TrendingUp, Clock, Award } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface DashboardData {
  enrolled_subjects: number;
  completed_lessons: number;
  total_lessons: number;
  recent_activity: Array<{
    type: 'lesson' | 'quiz';
    subject_name: string;
    lesson_title: string;
    date: string;
  }>;
  progress_by_subject: Array<{
    subject_id: number;
    subject_name: string;
    total_lessons: number;
    completed_lessons: number;
    progress_percentage: number;
  }>;
}

export default function StudentDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await api.getStudentDashboard();
        setDashboard(data as DashboardData);
      } catch (err: any) {
        console.error('Failed to fetch dashboard:', err);
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Error loading dashboard: {error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const overallProgress = dashboard?.total_lessons 
    ? Math.round((dashboard.completed_lessons / dashboard.total_lessons) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <Link href="/student/subjects">
          <Button>
            <BookOpen className="h-4 w-4 mr-2" />
            Browse Subjects
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.enrolled_subjects || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed Lessons</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard?.completed_lessons || 0} / {dashboard?.total_lessons || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overallProgress}% complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallProgress}%</div>
            <Progress value={overallProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Progress by Subject */}
      {dashboard?.progress_by_subject && dashboard.progress_by_subject.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard.progress_by_subject.map((subject) => (
                <div key={subject.subject_id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{subject.subject_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {subject.completed_lessons} / {subject.total_lessons} lessons completed
                      </p>
                    </div>
                    <span className="text-sm font-medium">
                      {Math.round(subject.progress_percentage)}%
                    </span>
                  </div>
                  <Progress value={subject.progress_percentage} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {dashboard?.recent_activity && dashboard.recent_activity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard.recent_activity.map((activity, index) => (
                <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    {activity.type === 'lesson' ? (
                      <BookOpen className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Award className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{activity.lesson_title}</p>
                    <p className="text-sm text-muted-foreground">{activity.subject_name}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {(!dashboard?.enrolled_subjects || dashboard.enrolled_subjects === 0) && (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Enrolled Subjects Yet</h3>
            <p className="text-muted-foreground mb-6">
              Start your learning journey by browsing available subjects
            </p>
            <Link href="/student/subjects">
              <Button size="lg">
                Explore Subjects
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
