'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Lesson, Quiz } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Upload, 
  AlertCircle, 
  Loader2, 
  Plus, 
  Edit,
  Trash2,
  FileText
} from 'lucide-react';

export default function EditLessonPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = parseInt(params.id as string);
  const lessonId = parseInt(params.lessonId as string);

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    order_number: '',
    is_published: true
  });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLesson();
  }, [lessonId]);

  const loadLesson = async () => {
    try {
      setLoading(true);
      const response = await api.getLessonById(lessonId);
      const lessonData = response.lesson;
      setLesson(lessonData);
      setQuizzes(lessonData.quizzes || []);
      setFormData({
        title: lessonData.title,
        content: lessonData.content || '',
        order_number: lessonData.order_number?.toString() || '',
        is_published: lessonData.is_published
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load lesson');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('subject_id', subjectId.toString());
      formDataToSend.append('title', formData.title);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('is_published', formData.is_published.toString());
      
      if (formData.order_number) {
        formDataToSend.append('order_number', formData.order_number);
      }
      
      if (file) {
        formDataToSend.append('file', file);
      }

      await api.updateLesson(lessonId, formDataToSend);
      router.push(`/teacher/subjects/${subjectId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update lesson');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDeleteQuiz = async (quizId: number) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;

    try {
      await api.deleteQuiz(quizId);
      loadLesson();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete quiz');
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-12 w-32" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error && !lesson) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          disabled={submitting}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <Tabs defaultValue="edit" className="w-full">
        <TabsList>
          <TabsTrigger value="edit">Edit Lesson</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes ({quizzes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="edit">
          <Card>
            <CardHeader>
              <CardTitle>Edit Lesson</CardTitle>
              <CardDescription>
                Update lesson information and content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="title">Lesson Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <Label htmlFor="content">Lesson Content *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    required
                    rows={10}
                    disabled={submitting}
                  />
                </div>

                {lesson?.content_file_name && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <FileText className="h-4 w-4 inline mr-2" />
                      Current file: {lesson.content_file_name}
                    </p>
                  </div>
                )}

                <div>
                  <Label htmlFor="file">Replace File (Optional)</Label>
                  <div className="mt-2">
                    <label
                      htmlFor="file"
                      className="flex items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-center">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          {file ? file.name : 'Click to upload a new file'}
                        </p>
                      </div>
                      <input
                        id="file"
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={submitting}
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="order_number">Order Number (Optional)</Label>
                  <Input
                    id="order_number"
                    type="number"
                    value={formData.order_number}
                    onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
                    disabled={submitting}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_published"
                    checked={formData.is_published}
                    onCheckedChange={(checked: boolean) => setFormData({ ...formData, is_published: checked })}
                    disabled={submitting}
                  />
                  <Label htmlFor="is_published" className="cursor-pointer">
                    Publish lesson (make visible to students)
                  </Label>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={submitting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting} className="flex-1">
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Lesson'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quizzes">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Lesson Quizzes</CardTitle>
                  <CardDescription>
                    Manage quizzes for this lesson
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => router.push(`/teacher/subjects/${subjectId}/lessons/${lessonId}/quizzes/new`)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Quiz
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {quizzes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No quizzes yet</p>
                  <Button 
                    variant="outline"
                    onClick={() => router.push(`/teacher/subjects/${subjectId}/lessons/${lessonId}/quizzes/new`)}
                  >
                    Create First Quiz
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {quizzes.map((quiz) => (
                    <div 
                      key={quiz.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <h4 className="font-semibold">{quiz.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{quiz.description}</p>
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          <span>Time: {quiz.time_limit} min</span>
                          <span>Passing: {quiz.passing_score}%</span>
                          <span>Max Attempts: {quiz.max_attempts}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/teacher/subjects/${subjectId}/lessons/${lessonId}/quizzes/${quiz.id}`)}
                        >
                          View Results
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteQuiz(quiz.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
