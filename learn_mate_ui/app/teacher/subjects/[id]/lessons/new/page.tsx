'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Upload, AlertCircle, Loader2 } from 'lucide-react';

export default function NewLessonPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = parseInt(params.id as string);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    order_number: '',
    is_published: true
  });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('subject_id', subjectId.toString());
      formDataToSend.append('title', formData.title);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('is_published', formData.is_published ? '1' : '0');
      
      if (formData.order_number) {
        formDataToSend.append('order_number', formData.order_number);
      }
      
      if (file) {
        formDataToSend.append('file', file);
      }

      await api.createLesson(formDataToSend);
      router.push(`/teacher/subjects/${subjectId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create lesson');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

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

      <Card>
        <CardHeader>
          <CardTitle>Create New Lesson</CardTitle>
          <CardDescription>
            Add a new lesson to your subject
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
                placeholder="e.g., Introduction to Algebra"
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
                placeholder="Enter the lesson content here..."
                rows={10}
                disabled={submitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Provide detailed content for students to learn
              </p>
            </div>

            <div>
              <Label htmlFor="file">Attach File (Optional)</Label>
              <div className="mt-2">
                <label
                  htmlFor="file"
                  className="flex items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {file ? file.name : 'Click to upload PDF, DOCX, or other files'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Max file size: 10MB
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
                placeholder="e.g., 1, 2, 3..."
                disabled={submitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Set the order in which this lesson appears
              </p>
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
                    Creating...
                  </>
                ) : (
                  'Create Lesson'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
