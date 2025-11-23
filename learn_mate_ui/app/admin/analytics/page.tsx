'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PlatformAnalytics } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp,
  Users,
  BookOpen,
  Award,
  Activity
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.getAdminAnalytics();
      setAnalytics(response as PlatformAnalytics);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Detailed Analytics</h1>
        <div className="grid grid-cols-1 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Detailed Analytics</h1>

      {/* User Growth */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
            User Growth (Last 7 Days)
          </CardTitle>
          <CardDescription>New user registrations per day</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.recent_activity && analytics.recent_activity.length > 0 ? (
            <div className="space-y-3">
              {analytics.recent_activity.map((activity, index) => {
                const maxUsers = Math.max(...analytics.recent_activity.map(a => a.new_users));
                const widthPercentage = (activity.new_users / maxUsers) * 100;
                
                return (
                  <div key={activity.date} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">
                        {new Date(activity.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="text-gray-600">
                        {activity.new_users} user{activity.new_users !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${widthPercentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          )}
        </CardContent>
      </Card>

      {/* User Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-600" />
            User Distribution by Role
          </CardTitle>
          <CardDescription>
            Total: {analytics.user_statistics.total_users} users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.user_statistics.by_role.map((role) => {
              const percentage = (role.count / analytics.user_statistics.total_users) * 100;
              const colorClass = 
                role.role === 'admin' ? 'bg-red-600' :
                role.role === 'teacher' ? 'bg-blue-600' :
                'bg-green-600';

              return (
                <div key={role.role} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium capitalize">{role.role}s</span>
                    <span className="text-gray-600">
                      {role.count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`${colorClass} h-3 rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Content Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-orange-600" />
            Content Statistics
          </CardTitle>
          <CardDescription>Platform learning resources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Subjects</p>
              <p className="text-3xl font-bold text-orange-600">
                {analytics.content_statistics.total_subjects}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Lessons</p>
              <p className="text-3xl font-bold text-purple-600">
                {analytics.content_statistics.total_lessons}
              </p>
            </div>
            <div className="p-4 bg-pink-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Quizzes</p>
              <p className="text-3xl font-bold text-pink-600">
                {analytics.content_statistics.total_quizzes}
              </p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Enrollments</p>
              <p className="text-3xl font-bold text-indigo-600">
                {analytics.content_statistics.total_enrollments}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quiz Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2 text-yellow-600" />
            Quiz Performance
          </CardTitle>
          <CardDescription>Platform-wide assessment metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">Total Quiz Attempts</p>
              <p className="text-4xl font-bold">
                {analytics.quiz_statistics.total_attempts}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Average Score</p>
              <div className="flex items-baseline space-x-2">
                <p className="text-4xl font-bold text-yellow-600">
                  {analytics.quiz_statistics.average_score}%
                </p>
              </div>
              <div className="mt-4 w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-yellow-600 h-4 rounded-full transition-all"
                  style={{ width: `${analytics.quiz_statistics.average_score}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2 text-green-600" />
            Active Students
          </CardTitle>
          <CardDescription>Students with activity in the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-6xl font-bold text-green-600">
              {analytics.user_statistics.active_students_7days}
            </p>
            <p className="text-gray-600 mt-2">
              {analytics.user_statistics.by_role.find(r => r.role === 'student')?.count || 0} total students
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {((analytics.user_statistics.active_students_7days / 
                (analytics.user_statistics.by_role.find(r => r.role === 'student')?.count || 1)) * 100).toFixed(1)}% 
              active rate
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
