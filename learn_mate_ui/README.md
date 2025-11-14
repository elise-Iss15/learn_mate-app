# LearnMate South Sudan - Offline-First PWA

A comprehensive offline-first Progressive Web Application built with Next.js 14 for educational access in low-connectivity environments in South Sudan.

## 🎯 Project Overview

LearnMate is an e-learning platform that prioritizes offline functionality, allowing students to download entire subjects with lessons and quizzes for offline access. All progress is automatically synced when connectivity is restored.

## ✨ Key Features

### Offline-First Architecture
- **Full PWA Support**: Service workers cache application shell and assets
- **IndexedDB Storage**: Client-side database (Dexie.js) stores all educational content
- **Download Subjects**: Students can download complete subjects including all lessons, quizzes, and PDF materials
- **Offline Quiz Taking**: Complete quizzes without internet
- **Background Sync**: Automatic synchronization of offline actions when online

### Role-Based Features

#### Student
- Personal dashboard with progress tracking
- Browse and enroll in subjects
- Download subjects for offline access
- Take lessons and quizzes offline
- Auto-sync quiz submissions and lesson progress

#### Teacher
- Teacher dashboard with analytics
- Create and manage lessons (text + PDF support)
- Create quizzes with multiple question types
- View student performance analytics

#### Admin
- Platform-wide analytics
- User management
- System monitoring

## 🛠 Technology Stack

- **Next.js 14** - App Router, TypeScript
- **Tailwind CSS** + **Shadcn UI** - Styling
- **@ducanh2912/next-pwa** - PWA configuration
- **Dexie.js** - IndexedDB wrapper
- **Zustand** - State management
- **Axios** - HTTP client

## 🚀 Getting Started

### Installation

```bash
cd learn_mate_ui
npm install
```

### Configuration

Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## 📚 Core Architecture

### Offline Data Flow

1. **Online**: Browse subjects, data cached via Stale-While-Revalidate
2. **Download**: Click "Download for Offline" → fetches all subject data
3. **Offline**: All data served from IndexedDB
4. **Sync**: Actions queued and synced when online

### IndexedDB Schema

- `subjects` - Subject data
- `lessons` - Lesson content
- `quizzes` - Quiz data with questions
- `offlineSubjects` - Downloaded subject bundles
- `syncQueue` - Offline actions to sync
- `cachedData` - Key-value cache with expiry

## 🔧 Key Files

- `/lib/api.ts` - API client with offline support
- `/lib/db.ts` - IndexedDB configuration
- `/lib/sync-service.ts` - Background sync logic
- `/lib/offline-service.ts` - Download manager
- `/components/offline-download-button.tsx` - Download UI
- `/hooks/use-online-status.ts` - Network detection

## 📱 PWA Features

- Installable on mobile/desktop
- Offline functionality
- Fast load with service worker caching
- Background sync
- Responsive design

## 🧪 Testing Offline Mode

1. Chrome DevTools → Network → Offline
2. Download a subject while online
3. Go offline and browse/take quizzes
4. Come back online → watch sync happen

## 📖 API Integration

Integrates all endpoints from `learn_mate_api`:
- `/auth/*` - Authentication
- `/subjects/*` - Subject management
- `/lessons/*` - Lesson CRUD + progress
- `/quizzes/*` - Quiz taking
- `/students/*` - Student dashboard
- `/teachers/*` - Teacher dashboard
- `/admin/*` - Admin analytics

## 🐛 Troubleshooting

### Service Worker Not Updating
Clear cache: Application → Clear storage → Clear site data

### IndexedDB Errors
```javascript
import { db } from '@/lib/db';
await db.delete();
```

### Manual Sync
```javascript
import { syncService } from '@/lib/sync-service';
await syncService.sync();
```

## 📄 License

Educational use only - ALU Year 2 Project

---

**Built with ❤️ for education in South Sudan**
