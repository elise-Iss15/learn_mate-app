import Dexie, { Table } from 'dexie';
import type {
  Subject,
  Lesson,
  Quiz,
  SyncQueueItem,
  OfflineSubject,
  User,
  StudentProgress,
  StudentDashboard,
  TeacherDashboard,
  TeacherAnalytics,
  AdminAnalytics,
} from './types';

// IndexedDB Database Schema
export class LearnMateDB extends Dexie {
  // Tables
  subjects!: Table<Subject, number>;
  lessons!: Table<Lesson, number>;
  quizzes!: Table<Quiz, number>;
  offlineSubjects!: Table<OfflineSubject, number>;
  syncQueue!: Table<SyncQueueItem, number>;
  cachedData!: Table<{ key: string; data: any; timestamp: number }, string>;
  
  constructor() {
    super('LearnMateDB');
    
    this.version(1).stores({
      subjects: '++id, name, grade_level, created_at',
      lessons: '++id, subject_id, title, order_number, is_published',
      quizzes: '++id, lesson_id, title',
      offlineSubjects: '++id, downloaded_at',
      syncQueue: '++id, type, created_at, retries',
      cachedData: 'key, timestamp',
    });
  }
}

export const db = new LearnMateDB();

// Cache management functions
export const cacheManager = {
  // Set cache with expiry
  async set(key: string, data: any, expiryMs: number = 24 * 60 * 60 * 1000) {
    await db.cachedData.put({
      key,
      data,
      timestamp: Date.now() + expiryMs,
    });
  },

  // Get cache if not expired
  async get<T>(key: string): Promise<T | null> {
    const cached = await db.cachedData.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.timestamp) {
      // Cache expired, remove it
      await db.cachedData.delete(key);
      return null;
    }
    
    return cached.data as T;
  },

  // Remove specific cache
  async remove(key: string) {
    await db.cachedData.delete(key);
  },

  // Clear all cache
  async clear() {
    await db.cachedData.clear();
  },

  // Clear expired cache
  async clearExpired() {
    const now = Date.now();
    const expired = await db.cachedData.where('timestamp').below(now).toArray();
    await Promise.all(expired.map(item => db.cachedData.delete(item.key)));
  },
};

// Offline subject management
export const offlineManager = {
  // Download subject for offline use
  async downloadSubject(subjectId: number, subject: Subject, lessons: Lesson[], quizzes: Quiz[]) {
    const offlineSubject: OfflineSubject = {
      id: subjectId,
      subject,
      lessons,
      quizzes,
      downloaded_at: Date.now(),
    };

    await db.offlineSubjects.put(offlineSubject);
    
    // Also store in individual tables for easier querying
    await db.subjects.put(subject);
    await Promise.all(lessons.map(lesson => db.lessons.put(lesson)));
    await Promise.all(quizzes.map(quiz => db.quizzes.put(quiz)));
  },

  // Get offline subject
  async getOfflineSubject(subjectId: number): Promise<OfflineSubject | null> {
    const offlineSubject = await db.offlineSubjects.get(subjectId);
    return offlineSubject || null;
  },

  // Check if subject is available offline
  async isSubjectAvailableOffline(subjectId: number): Promise<boolean> {
    const offlineSubject = await db.offlineSubjects.get(subjectId);
    return !!offlineSubject;
  },

  // Get all offline subjects
  async getAllOfflineSubjects(): Promise<OfflineSubject[]> {
    return await db.offlineSubjects.toArray();
  },

  // Remove offline subject
  async removeOfflineSubject(subjectId: number) {
    await db.offlineSubjects.delete(subjectId);
    // Note: We keep the data in other tables as they might be cached
  },

  // Get offline lessons for subject
  async getOfflineLessons(subjectId: number): Promise<Lesson[]> {
    return await db.lessons.where('subject_id').equals(subjectId).toArray();
  },

  // Get offline quiz
  async getOfflineQuiz(quizId: number): Promise<Quiz | undefined> {
    return await db.quizzes.get(quizId);
  },
};

// Sync queue management
export const syncQueue = {
  // Add item to sync queue
  async add(item: Omit<SyncQueueItem, 'id' | 'created_at' | 'retries'>) {
    const queueItem: SyncQueueItem = {
      ...item,
      created_at: Date.now(),
      retries: 0,
    };
    
    await db.syncQueue.add(queueItem);
  },

  // Get all pending sync items
  async getAll(): Promise<SyncQueueItem[]> {
    return await db.syncQueue.orderBy('created_at').toArray();
  },

  // Remove item from queue
  async remove(id: number) {
    await db.syncQueue.delete(id);
  },

  // Update retry count
  async incrementRetry(id: number) {
    const item = await db.syncQueue.get(id);
    if (item) {
      item.retries += 1;
      await db.syncQueue.put(item);
    }
  },

  // Clear all queue
  async clear() {
    await db.syncQueue.clear();
  },

  // Get queue count
  async count(): Promise<number> {
    return await db.syncQueue.count();
  },
};

// Subject operations
export const subjectOperations = {
  async getAll(): Promise<Subject[]> {
    return await db.subjects.toArray();
  },

  async getById(id: number): Promise<Subject | undefined> {
    return await db.subjects.get(id);
  },

  async save(subject: Subject) {
    await db.subjects.put(subject);
  },

  async saveMany(subjects: Subject[]) {
    await db.subjects.bulkPut(subjects);
  },
};

// Lesson operations
export const lessonOperations = {
  async getById(id: number): Promise<Lesson | undefined> {
    return await db.lessons.get(id);
  },

  async getBySubject(subjectId: number): Promise<Lesson[]> {
    return await db.lessons.where('subject_id').equals(subjectId).sortBy('order_number');
  },

  async save(lesson: Lesson) {
    await db.lessons.put(lesson);
  },

  async saveMany(lessons: Lesson[]) {
    await db.lessons.bulkPut(lessons);
  },
};

// Quiz operations
export const quizOperations = {
  async getById(id: number): Promise<Quiz | undefined> {
    return await db.quizzes.get(id);
  },

  async save(quiz: Quiz) {
    await db.quizzes.put(quiz);
  },
};

// Database initialization and cleanup
export const dbUtils = {
  // Clear all data (for logout)
  async clearAll() {
    await db.subjects.clear();
    await db.lessons.clear();
    await db.quizzes.clear();
    await db.offlineSubjects.clear();
    await db.syncQueue.clear();
    await db.cachedData.clear();
  },

  // Clear cache only (keep offline data)
  async clearCache() {
    await db.cachedData.clear();
  },

  // Get database size estimate
  async getSize(): Promise<{ usage: number; quota: number } | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    }
    return null;
  },
};

export default db;
