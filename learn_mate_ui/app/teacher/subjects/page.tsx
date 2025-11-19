'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Subject } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Users, 
  FileText, 
  Plus,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SubjectWithStats extends Subject {
  lesson_count: number;
  student_count: number;
}

export default function TeacherSubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<SubjectWithStats | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    grade_level: '1'
  });
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getTeacherSubjects({ page: 1, limit: 50 });
      setSubjects(response.subjects);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.createSubject({
        name: formData.name,
        description: formData.description,
        grade_level: parseInt(formData.grade_level)
      });
      setCreateDialogOpen(false);
      setFormData({ name: '', description: '', grade_level: '1' });
      loadSubjects();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create subject');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;

    try {
      setSubmitting(true);
      await api.updateSubject(selectedSubject.id, {
        name: formData.name,
        description: formData.description,
        grade_level: parseInt(formData.grade_level)
      });
      setEditDialogOpen(false);
      setSelectedSubject(null);
      setFormData({ name: '', description: '', grade_level: '1' });
      loadSubjects();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update subject');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubject = async (subjectId: number) => {
    if (!confirm('Are you sure you want to delete this subject? This will also delete all lessons and quizzes.')) {
      return;
    }

    try {
      await api.deleteSubject(subjectId);
      loadSubjects();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete subject');
    }
  };

  const openEditDialog = (subject: SubjectWithStats) => {
    setSelectedSubject(subject);
    setFormData({
      name: subject.name,
      description: subject.description || '',
      grade_level: subject.grade_level.toString()
    });
    setEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Subjects</h1>
          <p className="text-gray-500 mt-1">
            Manage your subjects, lessons, and quizzes
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Subject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Subject</DialogTitle>
              <DialogDescription>
                Add a new subject to teach your students
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <Label htmlFor="name">Subject Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Mathematics"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the subject"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="grade_level">Grade Level</Label>
                <Select
                  value={formData.grade_level}
                  onValueChange={(value) => setFormData({ ...formData, grade_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => (
                      <SelectItem key={grade} value={grade.toString()}>
                        Grade {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Subject'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Subjects Grid */}
      {subjects.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No subjects yet
            </h3>
            <p className="text-gray-500 mb-6">
              Create your first subject to start teaching
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Subject
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <Card
              key={subject.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{subject.name}</CardTitle>
                    <Badge variant="secondary" className="mt-2">
                      Grade {subject.grade_level}
                    </Badge>
                  </div>
                </div>
                {subject.description && (
                  <CardDescription className="mt-2 line-clamp-2">
                    {subject.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-600">
                      <FileText className="h-4 w-4" />
                      Lessons
                    </span>
                    <span className="font-semibold">{subject.lesson_count}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-600">
                      <Users className="h-4 w-4" />
                      Students
                    </span>
                    <span className="font-semibold">{subject.student_count}</span>
                  </div>
                  
                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/teacher/subjects/${subject.id}`)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(subject);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSubject(subject.id);
                      }}
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>
              Update your subject information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSubject} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Subject Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-grade_level">Grade Level</Label>
              <Select
                value={formData.grade_level}
                onValueChange={(value) => setFormData({ ...formData, grade_level: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => (
                    <SelectItem key={grade} value={grade.toString()}>
                      Grade {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Updating...' : 'Update Subject'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
