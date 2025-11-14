import { api, networkStatus } from './api';
import { offlineManager } from './db';
import type { Subject, Lesson, Quiz } from './types';

export interface DownloadProgress {
  status: 'idle' | 'downloading' | 'completed' | 'error';
  progress: number;
  currentStep?: string;
  error?: string;
}

class OfflineDownloadService {
  private downloading = new Set<number>();
  private listeners = new Map<number, Array<(progress: DownloadProgress) => void>>();

  // Check if subject is currently downloading
  isDownloading(subjectId: number): boolean {
    return this.downloading.has(subjectId);
  }

  // Subscribe to download progress
  subscribe(subjectId: number, callback: (progress: DownloadProgress) => void) {
    if (!this.listeners.has(subjectId)) {
      this.listeners.set(subjectId, []);
    }
    this.listeners.get(subjectId)!.push(callback);

    return () => {
      const callbacks = this.listeners.get(subjectId);
      if (callbacks) {
        this.listeners.set(
          subjectId,
          callbacks.filter(cb => cb !== callback)
        );
      }
    };
  }

  // Notify listeners
  private notify(subjectId: number, progress: DownloadProgress) {
    const callbacks = this.listeners.get(subjectId);
    if (callbacks) {
      callbacks.forEach(callback => callback(progress));
    }
  }

  // Download subject for offline use
  async downloadSubject(subjectId: number): Promise<boolean> {
    // Check if already downloading
    if (this.downloading.has(subjectId)) {
      return false;
    }

    // Check network
    if (!networkStatus.isOnline()) {
      this.notify(subjectId, {
        status: 'error',
        progress: 0,
        error: 'No network connection available',
      });
      return false;
    }

    this.downloading.add(subjectId);
    this.notify(subjectId, {
      status: 'downloading',
      progress: 0,
      currentStep: 'Starting download...',
    });

    try {
      // Step 1: Fetch subject details (10%)
      this.notify(subjectId, {
        status: 'downloading',
        progress: 10,
        currentStep: 'Fetching subject details...',
      });

      const subject = await api.getSubjectById(subjectId) as Subject;

      // Step 2: Fetch all lessons for subject (30%)
      this.notify(subjectId, {
        status: 'downloading',
        progress: 30,
        currentStep: 'Fetching lessons...',
      });

      const lessons = await api.getLessonsBySubject(subjectId) as Lesson[];

      // Step 3: Fetch lesson details and quizzes (30-80%)
      const quizzes: Quiz[] = [];
      const totalLessons = lessons.length;

      for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i];
        const progressPercent = 30 + Math.round((i / totalLessons) * 50);

        this.notify(subjectId, {
          status: 'downloading',
          progress: progressPercent,
          currentStep: `Downloading lesson ${i + 1}/${totalLessons}...`,
        });

        // Fetch full lesson details
        const lessonDetails = await api.getLessonById(lesson.id) as Lesson;
        lessons[i] = lessonDetails;

        // If lesson has quiz, fetch it
        if (lessonDetails.has_quiz && lessonDetails.quiz_id) {
          try {
            const quiz = await api.getQuizById(lessonDetails.quiz_id) as Quiz;
            quizzes.push(quiz);
          } catch (error) {
            console.error(`Failed to fetch quiz ${lessonDetails.quiz_id}:`, error);
          }
        }

        // If lesson has PDF, download it
        if (lessonDetails.content_url) {
          try {
            const pdfBlob = await api.downloadLessonPDF(lesson.id);
            // Store blob URL for offline access
            const blobUrl = URL.createObjectURL(pdfBlob);
            lessonDetails.content_url = blobUrl;
          } catch (error) {
            console.error(`Failed to download PDF for lesson ${lesson.id}:`, error);
          }
        }
      }

      // Step 4: Save to IndexedDB (90%)
      this.notify(subjectId, {
        status: 'downloading',
        progress: 90,
        currentStep: 'Saving to offline storage...',
      });

      await offlineManager.downloadSubject(subjectId, subject, lessons, quizzes);

      // Complete (100%)
      this.notify(subjectId, {
        status: 'completed',
        progress: 100,
        currentStep: 'Download completed!',
      });

      return true;
    } catch (error) {
      console.error('Download error:', error);
      this.notify(subjectId, {
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'Download failed',
      });
      return false;
    } finally {
      this.downloading.delete(subjectId);
    }
  }

  // Remove offline subject
  async removeOfflineSubject(subjectId: number): Promise<boolean> {
    try {
      await offlineManager.removeOfflineSubject(subjectId);
      return true;
    } catch (error) {
      console.error('Failed to remove offline subject:', error);
      return false;
    }
  }

  // Check if subject is available offline
  async isAvailableOffline(subjectId: number): Promise<boolean> {
    return await offlineManager.isSubjectAvailableOffline(subjectId);
  }

  // Get all offline subjects
  async getOfflineSubjects() {
    return await offlineManager.getAllOfflineSubjects();
  }

  // Get offline subject with all data
  async getOfflineSubject(subjectId: number) {
    return await offlineManager.getOfflineSubject(subjectId);
  }

  // Get storage usage
  async getStorageInfo() {
    const offlineSubjects = await this.getOfflineSubjects();
    
    // Estimate storage usage
    let estimatedSize = 0;
    for (const subject of offlineSubjects) {
      // Rough estimate: each lesson ~50KB, each quiz ~20KB
      estimatedSize += subject.lessons.length * 50 * 1024;
      estimatedSize += subject.quizzes.length * 20 * 1024;
    }

    return {
      offlineSubjects: offlineSubjects.length,
      totalLessons: offlineSubjects.reduce((sum, s) => sum + s.lessons.length, 0),
      totalQuizzes: offlineSubjects.reduce((sum, s) => sum + s.quizzes.length, 0),
      estimatedSize,
      estimatedSizeMB: (estimatedSize / (1024 * 1024)).toFixed(2),
    };
  }
}

export const offlineDownloadService = new OfflineDownloadService();
export default offlineDownloadService;
