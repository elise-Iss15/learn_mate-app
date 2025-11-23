'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Subject } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  BookOpen, 
  FileText, 
  Users,
  Eye,
  ChevronLeft,
  ChevronRight,
  Trash2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslations } from 'next-intl';

export default function AdminContentPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const tSubjects = useTranslations('subjects');

  useEffect(() => {
    loadSubjects();
  }, [currentPage, gradeFilter]);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 20,
      };

      if (gradeFilter !== 'all') {
        params.grade_level = parseInt(gradeFilter);
      }

      const response = await api.getSubjects(params);
      setSubjects(response.subjects);
      setTotalPages(response.pagination.pages);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadSubjects();
  };

  const filteredSubjects = subjects.filter((subject) =>
    searchTerm
      ? subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.description?.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Content Management</h1>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="flex space-x-2">
                <Input
                  placeholder="Search subjects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} variant="secondary">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

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

      {/* Subjects List */}
      <Card>
        <CardHeader>
          <CardTitle>Subjects ({filteredSubjects.length})</CardTitle>
          <CardDescription>All platform content</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : filteredSubjects.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No subjects found</p>
          ) : (
            <div className="space-y-3">
              {filteredSubjects.map((subject) => (
                <div
                  key={subject.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">{subject.name}</h3>
                      <Badge variant="outline">Grade {subject.grade_level}</Badge>
                    </div>
                    {subject.description && (
                      <p className="text-sm text-gray-600 mb-2 ml-8">
                        {subject.description}
                      </p>
                    )}
                    <div className="flex space-x-4 text-sm text-gray-500 ml-8">
                      <span className="flex items-center">
                        <FileText className="h-4 w-4 mr-1" />
                        {subject.lesson_count || 0} lessons
                      </span>
                      <span>
                        By {subject.creator_first_name} {subject.creator_last_name}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/teacher/subjects/${subject.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
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
    </div>
  );
}
