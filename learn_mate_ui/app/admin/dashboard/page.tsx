'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PlatformAnalytics } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  FileText, 
  TrendingUp,
  Award
} from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('admin');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.getAdminAnalytics();
      setAnalytics(response as PlatformAnalytics);
    } catch (err: any) {
      console.error('Analytics error:', err);
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Platform Analytics</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error || 'Failed to load analytics'}</p>
      </div>
    );
  }

  const getUserCountByRole = (role: string) => {
    const roleData = analytics.user_statistics.by_role.find(r => r.role === role);
    return roleData ? roleData.count : 0;
  };

  const statCards = [
    {
      title: t('totalUsers'),
      value: analytics.user_statistics.total_users,
      icon: Users,
      description: 'All registered users',
      color: 'text-blue-600',
    },
    {
      title: t('students'),
      value: getUserCountByRole('student'),
      icon: GraduationCap,
      description: `${analytics.user_statistics.active_students_7days} ${t('activeStudents')} (7 days)`,
      color: 'text-green-600',
    },
    {
      title: t('teachers'),
      value: getUserCountByRole('teacher'),
      icon: Users,
      description: 'Teaching on platform',
      color: 'text-purple-600',
    },
    {
      title: t('totalSubjects'),
      value: analytics.content_statistics.total_subjects,
      icon: BookOpen,
      description: `${analytics.content_statistics.total_lessons} ${t('totalLessons').toLowerCase()}`,
      color: 'text-orange-600',
    },
    {
      title: t('totalQuizzes'),
      value: analytics.content_statistics.total_quizzes,
      icon: FileText,
      description: `${analytics.quiz_statistics.total_attempts} ${t('totalAttempts').toLowerCase()}`,
      color: 'text-pink-600',
    },
    {
      title: t('enrollments'),
      value: analytics.content_statistics.total_enrollments,
      icon: TrendingUp,
      description: 'Active enrollments',
      color: 'text-indigo-600',
    },
    {
      title: t('avgScore'),
      value: `${analytics.quiz_statistics.average_score}%`,
      icon: Award,
      description: 'Platform average',
      color: 'text-yellow-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('platformAnalytics')}</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      {analytics.recent_activity && analytics.recent_activity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('recentActivity')} ({t('lastDays')})</CardTitle>
            <CardDescription>New user registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.recent_activity.map((activity) => (
                <div
                  key={activity.date}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm font-medium">
                    {new Date(activity.date).toLocaleDateString()}
                  </span>
                  <span className="text-sm text-gray-600">
                    {activity.new_users} {t('newUsers')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Popular Subjects */}
      {analytics.popular_subjects && analytics.popular_subjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('popularSubjects')}</CardTitle>
            <CardDescription>By enrollment count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.popular_subjects.slice(0, 10).map((subject, index) => (
                <div
                  key={subject.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{subject.name}</p>
                      <p className="text-xs text-gray-500">
                        {t('Grade')} {subject.grade_level}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">
                      {subject.enrollment_count}
                    </p>
                    <p className="text-xs text-gray-500">enrollments</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
