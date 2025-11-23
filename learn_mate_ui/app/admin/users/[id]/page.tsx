'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { UserWithStats } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  Shield,
  BookOpen,
  FileText,
  Award,
  GraduationCap
} from 'lucide-react';

export default function UserDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<UserWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [newRole, setNewRole] = useState<string>('');

  useEffect(() => {
    if (userId) {
      loadUserDetails();
    }
  }, [userId]);

  const loadUserDetails = async () => {
    try {
      setLoading(true);
      const response = await api.getUserById(parseInt(userId));
      setUser(response.data.user);
    } catch (err) {
      console.error('Failed to load user details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!user || !newRole) return;

    try {
      await api.updateUserRole(user.id, newRole);
      setShowRoleDialog(false);
      loadUserDetails();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user role');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'teacher':
        return 'bg-blue-100 text-blue-800';
      case 'student':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">User not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push('/admin/users')}
        >
          Back to Users
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/users')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">User Details</h1>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setNewRole(user.role);
            setShowRoleDialog(true);
          }}
        >
          <Shield className="h-4 w-4 mr-2" />
          Change Role
        </Button>
      </div>

      {/* User Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">
                {user.first_name} {user.last_name}
              </CardTitle>
              <CardDescription>@{user.username}</CardDescription>
            </div>
            <Badge className={getRoleBadgeColor(user.role)}>
              {user.role}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
            {user.grade_level && (
              <div className="flex items-center space-x-3">
                <GraduationCap className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Grade Level</p>
                  <p className="font-medium">Grade {user.grade_level}</p>
                </div>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="font-medium">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Preferred Language</p>
                <p className="font-medium">{user.preferred_language}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {user.stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {user.role === 'student' && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Enrolled Subjects
                  </CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {user.stats.enrolled_subjects || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Active enrollments
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Completed Lessons
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {user.stats.completed_lessons || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Lessons finished
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Quiz Attempts
                  </CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {user.stats.quiz_attempts || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total attempts
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {user.role === 'teacher' && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Subjects Created
                  </CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {user.stats.subjects_created || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total subjects
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Lessons Created
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {user.stats.lessons_created || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total lessons
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Quizzes Created
                  </CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {user.stats.quizzes_created || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total quizzes
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Change Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {user.first_name} {user.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole}>Update Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
