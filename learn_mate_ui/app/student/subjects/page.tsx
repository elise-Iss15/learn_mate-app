'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OfflineDownloadButton } from '@/components/offline-download-button';
import { Loader2, BookOpen, GraduationCap, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Subject {
  id: number;
  name: string;
  description: string;
  grade_level: number;
  created_by: number;
  created_at: string;
  creator_username: string;
  creator_first_name: string;
  creator_last_name: string;
  lesson_count: number;
  enrolled?: boolean;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolling, setEnrolling] = useState<number | null>(null);
  const [enrolledSubjectIds, setEnrolledSubjectIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch both all subjects and enrolled subjects
      const [allSubjectsResponse, enrolledResponse] = await Promise.all([
        api.getSubjects(),
        api.getEnrolledSubjects()
      ]);

      // Extract subjects from the nested response structure
      const allSubjects = allSubjectsResponse.data?.subjects || allSubjectsResponse.subjects || allSubjectsResponse.data || allSubjectsResponse;
      const enrolledSubjects = enrolledResponse.data?.subjects || enrolledResponse.subjects || enrolledResponse.data || enrolledResponse;

      // Create a Set of enrolled subject IDs for quick lookup
      const enrolledIds = new Set(
        Array.isArray(enrolledSubjects) 
          ? enrolledSubjects.map((s: any) => s.id) 
          : []
      );
      setEnrolledSubjectIds(enrolledIds);

      // Mark subjects as enrolled
      const subjectsWithEnrollment = Array.isArray(allSubjects)
        ? allSubjects.map((subject: Subject) => ({
            ...subject,
            enrolled: enrolledIds.has(subject.id)
          }))
        : [];

      setSubjects(subjectsWithEnrollment);
    } catch (err: any) {
      console.error('Failed to fetch subjects:', err);
      setError(err.message || 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (subjectId: number) => {
    setEnrolling(subjectId);
    try {
      await api.enrollInSubject(subjectId);
      // Refresh data to update enrollment status
      await fetchData();
    } catch (err: any) {
      console.error('Failed to enroll:', err);
      alert('Failed to enroll in subject. Please try again.');
    } finally {
      setEnrolling(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Available Subjects</h1>
          <p className="text-muted-foreground mt-1">
            Browse and enroll in subjects to start learning
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {subjects.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Subjects Available</h3>
            <p className="text-muted-foreground">
              Check back later for new subjects
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <Card key={subject.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-2">{subject.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <GraduationCap className="h-4 w-4" />
                      Grade {subject.grade_level}
                    </CardDescription>
                  </div>
                  {subject.enrolled && (
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {subject.description}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {subject.lesson_count} {subject.lesson_count === 1 ? 'lesson' : 'lessons'}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground mt-2">
                    Teacher: {subject.creator_first_name} {subject.creator_last_name}
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-4 border-t">
                  {subject.enrolled ? (
                    <>
                      <Link href={`/student/subjects/${subject.id}`}>
                        <Button className="w-full">
                          <BookOpen className="h-4 w-4 mr-2" />
                          View Lessons
                        </Button>
                      </Link>
                      
                      <OfflineDownloadButton
                        subjectId={subject.id}
                        subjectName={subject.name}
                      />
                    </>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleEnroll(subject.id)}
                      disabled={enrolling === subject.id || subject.enrolled}
                    >
                      {enrolling === subject.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enrolling...
                        </>
                      ) : subject.enrolled ? (
                        'Already Enrolled'
                      ) : (
                        'Enroll Now'
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
