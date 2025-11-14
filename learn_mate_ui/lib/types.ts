// Type definitions for the LearnMate API

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  first_name: string;
  last_name: string;
  grade_level?: number;
  preferred_language: string;
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface Subject {
  id: number;
  name: string;
  description: string;
  grade_level: number;
  created_by: number;
  created_at: string;
  updated_at?: string;
  creator_username?: string;
  creator_first_name?: string;
  creator_last_name?: string;
  teacher_name?: string;
  lesson_count?: number;
  enrolled?: boolean;
}

export interface Lesson {
  id: number;
  subject_id: number;
  title: string;
  content: string;
  content_url?: string;
  content_file_url?: string | null;
  content_file_public_id?: string | null;
  content_file_name?: string | null;
  order_number: number;
  language: string;
  created_by?: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  has_quiz: boolean;
  quiz_id?: number;
  quiz_count?: number;
  is_completed?: boolean;
}

export interface Question {
  id: number;
  quiz_id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  correct_answer: string;
  options?: string[];
  points: number;
  order_number: number;
}

export interface Quiz {
  id: number;
  lesson_id: number;
  title: string;
  description: string;
  passing_score: number;
  time_limit?: number;
  max_attempts: number;
  created_at: string;
  questions: Question[];
}

export interface QuizAttempt {
  id: number;
  quiz_id: number;
  student_id: number;
  started_at: string;
  completed_at?: string;
  score?: number;
  passed?: boolean;
}

export interface QuizSubmission {
  attempt_id: number;
  answers: Array<{
    question_id: number;
    student_answer: string;
  }>;
}

export interface QuizResult {
  attempt_id: number;
  quiz_id: number;
  score: number;
  total_points: number;
  percentage: number;
  passed: boolean;
  time_taken: number;
  results: Array<{
    question_id: number;
    question_text: string;
    student_answer: string;
    correct_answer: string;
    is_correct: boolean;
    points_earned: number;
    points_possible: number;
  }>;
}

export interface StudentProgress {
  subject_id: number;
  subject_name: string;
  total_lessons: number;
  completed_lessons: number;
  progress_percentage: number;
  last_accessed?: string;
}

export interface StudentDashboard {
  enrolled_subjects: number;
  completed_lessons: number;
  total_lessons: number;
  recent_activity: Array<{
    type: 'lesson' | 'quiz';
    subject_name: string;
    lesson_title: string;
    completed_at: string;
  }>;
  progress_by_subject: StudentProgress[];
}

export interface TeacherDashboard {
  total_subjects: number;
  total_lessons: number;
  total_students: number;
  subjects: Array<{
    id: number;
    name: string;
    enrolled_students: number;
    total_lessons: number;
    avg_completion_rate: number;
  }>;
}

export interface TeacherAnalytics {
  subject_id: number;
  subject_name: string;
  total_students: number;
  avg_completion_rate: number;
  student_performance: Array<{
    student_id: number;
    student_name: string;
    lessons_completed: number;
    total_lessons: number;
    avg_quiz_score: number;
  }>;
}

export interface AdminAnalytics {
  total_users: number;
  total_students: number;
  total_teachers: number;
  total_subjects: number;
  total_lessons: number;
  total_quizzes: number;
  active_users_last_30_days: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Offline sync types
export interface SyncQueueItem {
  id?: number;
  type: 'quiz_submit' | 'lesson_progress' | 'enroll';
  endpoint: string;
  method: 'POST' | 'PUT';
  payload?: any;
  data?: any;
  created_at: number;
  retries: number;
}

export interface OfflineSubject {
  id: number;
  subject: Subject;
  lessons: Lesson[];
  quizzes: Quiz[];
  downloaded_at: number;
}
