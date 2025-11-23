import { syncQueue } from './db';
import { api, networkStatus } from './api';
import type { SyncQueueItem } from './types';

const MAX_RETRIES = 3;
const SYNC_INTERVAL = 30000; // 30 seconds

class SyncService {
  private isSyncing = false;
  private intervalId: NodeJS.Timeout | null = null;
  private listeners: Array<(status: SyncStatus) => void> = [];

  constructor() {
    // Listen for network status changes
    if (typeof window !== 'undefined') {
      networkStatus.onStatusChange((isOnline) => {
        if (isOnline) {
          this.sync();
        }
      });
    }
  }

  // Start background sync
  start() {
    if (this.intervalId) return;

    // Initial sync
    this.sync();

    // Set up interval
    this.intervalId = setInterval(() => {
      if (networkStatus.isOnline()) {
        this.sync();
      }
    }, SYNC_INTERVAL);
  }

  // Stop background sync
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Subscribe to sync status changes
  subscribe(callback: (status: SyncStatus) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  // Notify listeners
  private notify(status: SyncStatus) {
    this.listeners.forEach(callback => callback(status));
  }

  // Main sync function
  async sync(): Promise<SyncResult> {
    if (this.isSyncing || !networkStatus.isOnline()) {
      return { success: false, synced: 0, failed: 0, pending: 0 };
    }

    this.isSyncing = true;
    this.notify({ status: 'syncing', progress: 0 });

    try {
      const items = await syncQueue.getAll();
      
      if (items.length === 0) {
        this.notify({ status: 'idle', progress: 100 });
        return { success: true, synced: 0, failed: 0, pending: 0 };
      }

      let synced = 0;
      let failed = 0;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const progress = Math.round(((i + 1) / items.length) * 100);
        
        this.notify({ status: 'syncing', progress, current: i + 1, total: items.length });

        try {
          await this.syncItem(item);
          await syncQueue.remove(item.id!);
          synced++;
        } catch (error) {
          console.error('Failed to sync item:', item, error);
          
          if (item.retries >= MAX_RETRIES) {
            // Max retries reached, remove from queue
            await syncQueue.remove(item.id!);
            failed++;
          } else {
            // Increment retry count
            await syncQueue.incrementRetry(item.id!);
          }
        }
      }

      const pending = await syncQueue.count();
      const result = { success: true, synced, failed, pending };
      
      this.notify({ status: 'idle', progress: 100 });
      
      return result;
    } catch (error) {
      console.error('Sync error:', error);
      this.notify({ status: 'error', progress: 0 });
      return { success: false, synced: 0, failed: 0, pending: 0 };
    } finally {
      this.isSyncing = false;
    }
  }

  // Sync individual item
  private async syncItem(item: SyncQueueItem): Promise<void> {
    switch (item.type) {
      case 'quiz_submit':
        await this.syncQuizSubmission(item);
        break;
      case 'lesson_progress':
        await this.syncLessonProgress(item);
        break;
      case 'enroll':
        await this.syncEnrollment(item);
        break;
      default:
        throw new Error(`Unknown sync type: ${item.type}`);
    }
  }

  // Sync quiz submission
  private async syncQuizSubmission(item: SyncQueueItem): Promise<void> {
    const quizId = parseInt(item.endpoint.split('/')[2]);
    
    const attemptResponse = await api.startQuizAttempt(quizId);
    const attemptData = attemptResponse.data || attemptResponse;
    
    await api.submitQuiz(quizId, {
      attempt_id: attemptData.attempt_id,
      answers: item.payload.answers
    });
  }

  // Sync lesson progress
  private async syncLessonProgress(item: SyncQueueItem): Promise<void> {
    // Extract lesson ID from endpoint
    const lessonId = parseInt(item.endpoint.split('/')[2]);
    await api.updateLessonProgress(lessonId, item.payload);
  }

  // Sync enrollment
  private async syncEnrollment(item: SyncQueueItem): Promise<void> {
    // Extract subject ID from endpoint
    const subjectId = parseInt(item.endpoint.split('/')[3]);
    await api.enrollInSubject(subjectId);
  }

  // Get queue status
  async getStatus(): Promise<QueueStatus> {
    const count = await syncQueue.count();
    return {
      pending: count,
      syncing: this.isSyncing,
    };
  }

  // Add item to queue
  async addToQueue(
    type: SyncQueueItem['type'],
    endpoint: string,
    method: 'POST' | 'PUT',
    payload: any
  ): Promise<void> {
    await syncQueue.add({ type, endpoint, method, payload });
    
    // Try to sync immediately if online
    if (networkStatus.isOnline() && !this.isSyncing) {
      setTimeout(() => this.sync(), 100);
    }
  }

  // Clear completed items from queue
  async clearQueue(): Promise<void> {
    await syncQueue.clear();
  }
}

// Types
export interface SyncStatus {
  status: 'idle' | 'syncing' | 'error';
  progress: number;
  current?: number;
  total?: number;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  pending: number;
}

export interface QueueStatus {
  pending: number;
  syncing: boolean;
}

// Singleton instance
export const syncService = new SyncService();

// Helper functions for adding to queue
export const queueActions = {
  async submitQuiz(quizId: number, payload: any) {
    await syncService.addToQueue(
      'quiz_submit',
      `/quizzes/${quizId}/submit`,
      'POST',
      payload
    );
  },

  async updateLessonProgress(lessonId: number, payload: any) {
    await syncService.addToQueue(
      'lesson_progress',
      `/lessons/${lessonId}/progress`,
      'POST',
      payload
    );
  },

  async enrollInSubject(subjectId: number) {
    await syncService.addToQueue(
      'enroll',
      `/students/enroll/${subjectId}`,
      'POST',
      {}
    );
  },
};

export default syncService;
