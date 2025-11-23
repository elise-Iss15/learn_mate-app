'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { UsersListResponse, UserWithStats } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Plus, 
  Eye, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  UserCog
} from 'lucide-react';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [createFormData, setCreateFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'student',
    first_name: '',
    last_name: '',
    grade_level: '',
  });

  useEffect(() => {
    loadUsers();
  }, [currentPage, roleFilter, gradeFilter, searchTerm]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 20,
      };

      if (roleFilter !== 'all') {
        params.role = roleFilter;
      }

      if (gradeFilter !== 'all') {
        params.grade_level = parseInt(gradeFilter);
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await api.getAllUsers(params);
      setUsers(response.users);
      setTotalPages(response.pagination.pages);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadUsers();
  };

  const handleCreateUser = async () => {
    try {
      setValidationErrors({});
      await api.createUser({
        ...createFormData,
        grade_level: createFormData.grade_level ? parseInt(createFormData.grade_level) : undefined,
      });
      setShowCreateDialog(false);
      setCreateFormData({
        username: '',
        email: '',
        password: '',
        role: 'student',
        first_name: '',
        last_name: '',
        grade_level: '',
      });
      loadUsers();
    } catch (err: any) {
      // Handle validation errors
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const errors: Record<string, string> = {};
        err.response.data.errors.forEach((error: any) => {
          errors[error.field] = error.message;
        });
        setValidationErrors(errors);
      } else {
        // Show general error message
        alert(err.response?.data?.message || 'Failed to create user');
      }
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await api.deleteUser(selectedUser.id);
      setShowDeleteDialog(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete user');
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="flex space-x-2">
                <Input
                  placeholder="Search by name, email, or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} variant="secondary">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="teacher">Teachers</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>

            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {[...Array(12)].map((_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    Grade {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
          <CardDescription>Manage all platform users</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No users found</p>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h3 className="font-semibold">
                          {user.first_name} {user.last_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          @{user.username} • {user.email}
                        </p>
                      </div>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role}
                      </Badge>
                      {user.grade_level && (
                        <Badge variant="outline">Grade {user.grade_level}</Badge>
                      )}
                    </div>
                    {user.stats && (
                      <div className="mt-2 flex space-x-4 text-xs text-gray-500">
                        {user.role === 'student' && (
                          <>
                            <span>Enrolled: {user.stats.enrolled_subjects || 0}</span>
                            <span>Completed: {user.stats.completed_lessons || 0}</span>
                            <span>Quizzes: {user.stats.quiz_attempts || 0}</span>
                          </>
                        )}
                        {user.role === 'teacher' && (
                          <>
                            <span>Subjects: {user.stats.subjects_created || 0}</span>
                            <span>Lessons: {user.stats.lessons_created || 0}</span>
                            <span>Quizzes: {user.stats.quizzes_created || 0}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/users/${user.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog 
        open={showCreateDialog} 
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) {
            setValidationErrors({});
            setCreateFormData({
              username: '',
              email: '',
              password: '',
              role: 'student',
              first_name: '',
              last_name: '',
              grade_level: '',
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the platform
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {Object.keys(validationErrors).length > 0 && !validationErrors.username && !validationErrors.email && !validationErrors.password && (
              <Alert variant="destructive">
                <AlertDescription>
                  Please fix the validation errors below.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={createFormData.first_name}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, first_name: e.target.value })
                  }
                  className={validationErrors.first_name ? 'border-red-500' : ''}
                />
                {validationErrors.first_name && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.first_name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={createFormData.last_name}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, last_name: e.target.value })
                  }
                  className={validationErrors.last_name ? 'border-red-500' : ''}
                />
                {validationErrors.last_name && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.last_name}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={createFormData.username}
                onChange={(e) =>
                  setCreateFormData({ ...createFormData, username: e.target.value })
                }
                className={validationErrors.username ? 'border-red-500' : ''}
                required
              />
              {validationErrors.username && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.username}</p>
              )}
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={createFormData.email}
                onChange={(e) =>
                  setCreateFormData({ ...createFormData, email: e.target.value })
                }
                className={validationErrors.email ? 'border-red-500' : ''}
                required
              />
              {validationErrors.email && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>
              )}
            </div>
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={createFormData.password}
                onChange={(e) =>
                  setCreateFormData({ ...createFormData, password: e.target.value })
                }
                className={validationErrors.password ? 'border-red-500' : ''}
                required
              />
              {validationErrors.password ? (
                <p className="text-sm text-red-500 mt-1">{validationErrors.password}</p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  At least 6 characters, include uppercase, lowercase, and number
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={createFormData.role}
                  onValueChange={(value) =>
                    setCreateFormData({ ...createFormData, role: value })
                  }
                >
                  <SelectTrigger className={validationErrors.role ? 'border-red-500' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.role && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.role}</p>
                )}
              </div>
              <div>
                <Label htmlFor="grade_level">Grade Level</Label>
                <Select
                  value={createFormData.grade_level}
                  onValueChange={(value) =>
                    setCreateFormData({ ...createFormData, grade_level: value })
                  }
                >
                  <SelectTrigger className={validationErrors.grade_level ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(12)].map((_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        Grade {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.grade_level && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.grade_level}</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete user &quot;{selectedUser?.username}&quot;? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedUser(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
