'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, LayoutDashboard, GraduationCap, LogOut } from 'lucide-react';
import { useEffect } from 'react';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    if (user && user.role !== 'teacher' && user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const getActiveTab = () => {
    if (pathname?.includes('/subjects')) return 'subjects';
    return 'dashboard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">LearnMate</h1>
                <p className="text-xs text-gray-500">Teacher Portal</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <Tabs value={getActiveTab()} className="hidden md:block">
              <TabsList>
                <TabsTrigger
                  value="dashboard"
                  onClick={() => router.push('/teacher/dashboard')}
                  className="flex items-center gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger
                  value="subjects"
                  onClick={() => router.push('/teacher/subjects')}
                  className="flex items-center gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  My Subjects
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden pb-3">
            <Tabs value={getActiveTab()} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="dashboard"
                  onClick={() => router.push('/teacher/dashboard')}
                  className="flex items-center gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger
                  value="subjects"
                  onClick={() => router.push('/teacher/subjects')}
                  className="flex items-center gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  Subjects
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
