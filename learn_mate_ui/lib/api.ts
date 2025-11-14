import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { cacheManager } from './db';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Token management
let accessToken: string | null = null;
let refreshToken: string | null = null;

export const tokenManager = {
  setTokens(access: string, refresh: string) {
    accessToken = access;
    refreshToken = refresh;
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
    }
  },

  getAccessToken(): string | null {
    if (!accessToken && typeof window !== 'undefined') {
      accessToken = localStorage.getItem('accessToken');
    }
    return accessToken;
  },

  getRefreshToken(): string | null {
    if (!refreshToken && typeof window !== 'undefined') {
      refreshToken = localStorage.getItem('refreshToken');
    }
    return refreshToken;
  },

  clearTokens() {
    accessToken = null;
    refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },

  hasValidToken(): boolean {
    return !!this.getAccessToken();
  },
};

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refresh = tokenManager.getRefreshToken();
        if (refresh) {
          const response = await axios.post(`${API_URL}/auth/refresh-token`, {
            refreshToken: refresh,
          });

          const { accessToken: newAccessToken } = response.data.data;
          tokenManager.setTokens(newAccessToken, refresh);

          // Retry original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout
        tokenManager.clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Network status helper
export const networkStatus = {
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  },

  onStatusChange(callback: (isOnline: boolean) => void) {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => callback(true));
      window.addEventListener('offline', () => callback(false));
    }
  },
};

// API client with offline support
class ApiClient {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  // Generic request with cache
  async request<T>(
    config: AxiosRequestConfig,
    cacheKey?: string,
    cacheDuration?: number
  ): Promise<T> {
    // Try cache first if GET request and cache key provided
    if (config.method?.toLowerCase() === 'get' && cacheKey) {
      const cached = await cacheManager.get<T>(cacheKey);
      if (cached) {
        // If online, fetch in background to update cache
        if (networkStatus.isOnline()) {
          this.client.request<{ data: T }>(config)
            .then(response => {
              cacheManager.set(cacheKey, response.data.data, cacheDuration);
            })
            .catch(() => {
              // Silently fail background refresh
            });
        }
        return cached;
      }
    }

    // Make actual request
    try {
      const response = await this.client.request<{ data: T }>(config);
      
      // Cache the response if cache key provided
      if (cacheKey && config.method?.toLowerCase() === 'get') {
        await cacheManager.set(cacheKey, response.data.data, cacheDuration);
      }
      
      return response.data.data;
    } catch (error) {
      // If offline and we have cache, return it
      if (!networkStatus.isOnline() && cacheKey) {
        const cached = await cacheManager.get<T>(cacheKey);
        if (cached) {
          return cached;
        }
      }
      throw error;
    }
  }

  // Authentication endpoints
  async register(data: {
    username: string;
    email: string;
    password: string;
    role: 'student' | 'teacher' | 'admin';
    first_name: string;
    last_name: string;
    grade_level?: number;
    preferred_language: string;
  }) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    const { accessToken, refreshToken: refresh } = response.data.data;
    tokenManager.setTokens(accessToken, refresh);
    return response.data;
  }

  async logout() {
    const refresh = tokenManager.getRefreshToken();
    if (refresh) {
      try {
        await this.client.post('/auth/logout', { refreshToken: refresh });
      } catch (error) {
        // Continue with logout even if API call fails
      }
    }
    tokenManager.clearTokens();
  }

  async getCurrentUser() {
    return this.request<any>(
      { method: 'GET', url: '/auth/me' },
      'current-user',
      5 * 60 * 1000 // 5 minutes
    );
  }

  // Subject endpoints
  async getSubjects(params?: { page?: number; limit?: number; grade_level?: number }) {
    return this.request<any>(
      { method: 'GET', url: '/subjects', params },
      'subjects',
      30 * 60 * 1000 // 30 minutes - subjects change infrequently
    );
  }

  async getSubjectById(id: number) {
    return this.request<any>(
      { method: 'GET', url: `/subjects/${id}` },
      `subject-${id}`,
      30 * 60 * 1000
    );
  }

  async createSubject(data: { name: string; description: string; grade_level: number }) {
    const response = await this.client.post('/subjects', data);
    return response.data;
  }

  // Lesson endpoints
  async getLessonById(id: number) {
    return this.request<any>(
      { method: 'GET', url: `/lessons/${id}` },
      `lesson-${id}`,
      30 * 60 * 1000
    );
  }

  async markLessonComplete(lessonId: number, time_spent: number) {
    const response = await this.client.post(`/lessons/${lessonId}/progress`, {
      is_completed: true,
      time_spent
    });
    return response.data;
  }

  async getLessonsBySubject(subjectId: number) {
    return this.request<any>(
      { method: 'GET', url: `/lessons/subject/${subjectId}` },
      `lessons-subject-${subjectId}`,
      30 * 60 * 1000
    );
  }

  async downloadLessonPDF(id: number) {
    const response = await this.client.get(`/lessons/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async createLesson(data: FormData | any) {
    const config: AxiosRequestConfig = {
      method: 'POST',
      url: '/lessons',
      data,
    };

    if (data instanceof FormData) {
      config.headers = { 'Content-Type': 'multipart/form-data' };
    }

    const response = await this.client.request(config);
    return response.data;
  }

  async updateLesson(id: number, data: FormData | any) {
    const config: AxiosRequestConfig = {
      method: 'PUT',
      url: `/lessons/${id}`,
      data,
    };

    if (data instanceof FormData) {
      config.headers = { 'Content-Type': 'multipart/form-data' };
    }

    const response = await this.client.request(config);
    return response.data;
  }

  async deleteLesson(id: number) {
    const response = await this.client.delete(`/lessons/${id}`);
    return response.data;
  }

  async updateLessonProgress(id: number, data: { is_completed: boolean; time_spent: number }) {
    const response = await this.client.post(`/lessons/${id}/progress`, data);
    return response.data;
  }

  // Quiz endpoints
  async getQuizById(id: number) {
    return this.request<any>(
      { method: 'GET', url: `/quizzes/${id}` },
      `quiz-${id}`,
      30 * 60 * 1000
    );
  }

  async startQuizAttempt(quizId: number) {
    const response = await this.client.post(`/quizzes/${quizId}/start`);
    return response.data;
  }

  async submitQuiz(quizId: number, data: { attempt_id: number; answers: any[] }) {
    const response = await this.client.post(`/quizzes/${quizId}/submit`, data);
    return response.data;
  }

  // Student endpoints
  async getStudentDashboard() {
    return this.request<any>(
      { method: 'GET', url: '/students/dashboard' },
      'student-dashboard',
      5 * 60 * 1000 // 5 minutes - dashboard data changes frequently
    );
  }

  async getStudentProgress() {
    return this.request<any>(
      { method: 'GET', url: '/students/progress' },
      'student-progress',
      5 * 60 * 1000
    );
  }

  async getEnrolledSubjects(params?: { page?: number; limit?: number }) {
    return this.request<any>(
      { method: 'GET', url: '/students/subjects', params },
      'enrolled-subjects',
      5 * 60 * 1000
    );
  }

  async enrollInSubject(subjectId: number) {
    const response = await this.client.post(`/students/enroll/${subjectId}`);
    return response.data;
  }

  // Teacher endpoints
  async getTeacherDashboard() {
    return this.request<any>(
      { method: 'GET', url: '/teachers/dashboard' },
      'teacher-dashboard',
      5 * 60 * 1000
    );
  }

  async getSubjectAnalytics(subjectId: number) {
    return this.request<any>(
      { method: 'GET', url: `/teachers/analytics/${subjectId}` },
      `analytics-${subjectId}`,
      10 * 60 * 1000
    );
  }

  // Admin endpoints
  async getAdminAnalytics() {
    return this.request<any>(
      { method: 'GET', url: '/admin/analytics' },
      'admin-analytics',
      10 * 60 * 1000
    );
  }

  async getAllUsers(params?: { page?: number; limit?: number }) {
    return this.request<any>(
      { method: 'GET', url: '/admin/users', params },
      `admin-users-${params?.page || 1}`,
      5 * 60 * 1000
    );
  }
}

export const api = new ApiClient(apiClient);
export default api;
