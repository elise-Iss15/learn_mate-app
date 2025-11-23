'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Subject, Lesson, SubjectAnalytics, EnrolledStudent } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Users, 
  FileText, 
  TrendingUp, 
  Award,
  Plus,
  Edit,
  Trash2,
  BookOpen,
  ClipboardCheck,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

export default function SubjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = parseInt(params.id as string);

  const [subject, setSubject] = useState<Subject | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [analytics, setAnalytics] = useState<SubjectAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('lessons');

  useEffect(() => {
    loadSubjectData();
  }, [subjectId]);

  const loadSubjectData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [subjectData, studentsData, analyticsData] = await Promise.all([
        api.getSubjectById(subjectId),
        api.getEnrolledStudents(subjectId),
        api.getSubjectAnalytics(subjectId)
      ]);

      setSubject(subjectData.subject);
      setLessons(subjectData.subject.lessons || []);
      setStudents(studentsData.students);
      setAnalytics(analyticsData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load subject data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLesson = async (lessonId: number) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;

    try {
      await api.deleteLesson(lessonId);
      loadSubjectData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete lesson');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-32" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Subject not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Subjects
        </Button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{subject.name}</h1>
            <p className="text-gray-500 mt-1">{subject.description}</p>
            <Badge variant="secondary" className="mt-2">
              Grade {subject.grade_level}
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_students}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lessons</CardTitle>
              <FileText className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_lessons}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.completion_rate}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Quiz Score</CardTitle>
              <Award className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.average_quiz_score !== null ? `${analytics.average_quiz_score}%` : 'N/A'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Lessons Tab */}
        <TabsContent value="lessons" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => router.push(`/teacher/subjects/${subjectId}/lessons/new`)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Lesson
            </Button>
          </div>

          {lessons.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No lessons yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Create your first lesson to start teaching
                </p>
                <Button onClick={() => router.push(`/teacher/subjects/${subjectId}/lessons/new`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Lesson
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson, index) => (
                <Card key={lesson.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <h3 className="font-semibold text-lg">{lesson.title}</h3>
                          {!lesson.is_published && (
                            <Badge variant="secondary">Draft</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {lesson.content}
                        </p>
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          {lesson.quiz_count && lesson.quiz_count > 0 && (
                            <span className="flex items-center gap-1">
                              <ClipboardCheck className="h-3 w-3" />
                              {lesson.quiz_count} {lesson.quiz_count === 1 ? 'Quiz' : 'Quizzes'}
                            </span>
                          )}
                          {lesson.content_file_name && (
                            <span>📎 {lesson.content_file_name}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/teacher/subjects/${subjectId}/lessons/${lesson.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteLesson(lesson.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          {students.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No students enrolled
                </h3>
                <p className="text-gray-500">
                  Students will appear here once they enroll in this subject
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {students.map((student) => (
                <Card key={student.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">
                          {student.first_name} {student.last_name}
                        </h3>
                        <p className="text-sm text-gray-600">{student.email}</p>
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          <span>Grade {student.grade_level}</span>
                          <span>
                            Enrolled: {format(new Date(student.enrolled_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div>
                          <p className="text-sm font-semibold">Progress</p>
                          <p className="text-xs text-gray-600">
                            {student.lessons_completed}/{student.total_lessons} lessons
                          </p>
                          <Progress value={student.completion_rate} className="w-24 mt-1" />
                        </div>
                        {student.avg_quiz_score !== null && (
                          <div>
                            <p className="text-sm font-semibold">Avg Score</p>
                            <p className="text-xs text-gray-600">{student.avg_quiz_score}%</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          {analytics && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Top Performers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-600" />
                    Top Performers
                  </CardTitle>
                  <CardDescription>
                    Students with highest quiz scores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.top_performers.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No quiz data available yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {analytics.top_performers.map((student, index) => (
                        <div key={student.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{index + 1}</Badge>
                            <span className="text-sm font-medium">
                              {student.student_name}
                            </span>
                          </div>
                          <Badge className="bg-yellow-100 text-yellow-800">
                            {student.average_score}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Struggling Students */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    Needs Attention
                  </CardTitle>
                  <CardDescription>
                    Students who may need extra support
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.struggling_students.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No students needing attention
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {analytics.struggling_students.map((student, index) => (
                        <div key={student.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{index + 1}</Badge>
                            <span className="text-sm font-medium">
                              {student.student_name}
                            </span>
                          </div>
                          <Badge variant="secondary">
                            {student.average_score}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
