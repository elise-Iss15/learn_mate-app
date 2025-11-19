'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  TrendingUp, 
  Users,
  CheckCircle,
  XCircle,
  Award,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface QuizResults {
  quiz: {
    id: number;
    title: string;
    passing_score: number;
  };
  statistics: {
    total_attempts: number;
    average_score: number;
    passed: number;
    failed: number;
    pass_rate: number;
  };
  attempts: Array<{
    id: number;
    student_id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    score: number;
    total_points: number;
    percentage: number;
    started_at: string;
    completed_at: string;
    student_name: string;
  }>;
}

export default function QuizResultsPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = parseInt(params.id as string);
  const quizId = parseInt(params.quizId as string);

  const [results, setResults] = useState<QuizResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadResults();
  }, [quizId]);

  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getQuizResults(quizId);
      setResults(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load quiz results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-12 w-32" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Results not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { quiz, statistics, attempts } = results;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="mt-4">
          <h1 className="text-3xl font-bold text-gray-900">{quiz.title}</h1>
          <p className="text-gray-500 mt-1">Quiz Results & Analytics</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total_attempts}</div>
            <p className="text-xs text-muted-foreground">Student submissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.average_score}%</div>
            <Progress value={statistics.average_score} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistics.passed}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.pass_rate}% pass rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statistics.failed}</div>
            <p className="text-xs text-muted-foreground">
              Below {quiz.passing_score}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Individual Results */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Results</CardTitle>
          <CardDescription>
            Detailed results for each student attempt
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attempts.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No attempts yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {attempts
                .sort((a, b) => b.percentage - a.percentage)
                .map((attempt, index) => {
                  const passed = attempt.percentage >= quiz.passing_score;
                  const isTopScore = index === 0;

                  return (
                    <div
                      key={attempt.id}
                      className={`p-4 border rounded-lg ${
                        isTopScore ? 'bg-yellow-50 border-yellow-200' : 'hover:bg-gray-50'
                      } transition-colors`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {isTopScore && (
                                <Award className="h-5 w-5 text-yellow-600" />
                              )}
                              <h4 className="font-semibold">
                                {attempt.student_name}
                              </h4>
                            </div>
                            <Badge variant={passed ? 'default' : 'destructive'}>
                              {passed ? 'Passed' : 'Failed'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {attempt.email}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Completed: {format(new Date(attempt.completed_at), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="text-2xl font-bold">
                                {attempt.percentage}%
                              </p>
                              <p className="text-xs text-gray-500">
                                {attempt.score}/{attempt.total_points} points
                              </p>
                            </div>
                            {passed ? (
                              <CheckCircle className="h-6 w-6 text-green-600" />
                            ) : (
                              <XCircle className="h-6 w-6 text-red-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Score Distribution */}
      {attempts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
            <CardDescription>
              Visual breakdown of student performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { range: '90-100%', color: 'bg-green-500', label: 'Excellent' },
                { range: '80-89%', color: 'bg-blue-500', label: 'Very Good' },
                { range: '70-79%', color: 'bg-yellow-500', label: 'Good' },
                { range: '60-69%', color: 'bg-orange-500', label: 'Passing' },
                { range: '0-59%', color: 'bg-red-500', label: 'Needs Improvement' }
              ].map((tier) => {
                const count = attempts.filter((a) => {
                  const score = a.percentage;
                  if (tier.range === '90-100%') return score >= 90;
                  if (tier.range === '80-89%') return score >= 80 && score < 90;
                  if (tier.range === '70-79%') return score >= 70 && score < 80;
                  if (tier.range === '60-69%') return score >= 60 && score < 70;
                  return score < 60;
                }).length;
                const percentage = (count / attempts.length) * 100;

                return (
                  <div key={tier.range}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium">{tier.label} ({tier.range})</span>
                      <span className="text-gray-600">{count} students ({Math.round(percentage)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`${tier.color} h-3 rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
