# LearnMate UI - Quick Setup Guide

## Project Structure Created

The following has been set up for you:

### ✅ Core Infrastructure
- **Next.js 14** with TypeScript and App Router
- **PWA Configuration** with service worker and caching strategies
- **IndexedDB** with Dexie.js for offline storage
- **Shadcn UI** components with Tailwind CSS

### ✅ Key Libraries Installed
- `@ducanh2912/next-pwa` - PWA support
- `dexie` & `dexie-react-hooks` - IndexedDB
- `axios` - HTTP client
- `zustand` - State management
- `lucide-react` - Icons
- `shadcn/ui` - UI components

### ✅ Offline-First Features
1. **Service Worker** - Caches app shell and assets
2. **IndexedDB Database** - Stores subjects, lessons, quizzes
3. **Download Manager** - Download subjects for offline use
4. **Sync Queue** - Queues offline actions for later sync
5. **Network Detection** - Monitors online/offline status

### ✅ Created Files

#### Core Configuration
- `/next.config.ts` - PWA and Next.js config
- `/public/manifest.json` - PWA manifest
- `/.env.local` - Environment variables

#### Libraries & Services
- `/lib/api.ts` - API client with offline support
- `/lib/db.ts` - IndexedDB schema and operations
- `/lib/types.ts` - TypeScript definitions
- `/lib/auth-store.ts` - Authentication state management
- `/lib/auth-provider.tsx` - Auth context provider
- `/lib/sync-service.ts` - Background sync service
- `/lib/offline-service.ts` - Offline download manager

#### Hooks
- `/hooks/use-online-status.ts` - Network status hook
- `/hooks/use-sync-status.ts` - Sync queue hooks
- `/hooks/use-offline-subject.ts` - Offline subject management

#### Components
- `/components/network-status.tsx` - Online/offline indicator
- `/components/offline-download-button.tsx` - Download UI
- `/components/ui/*` - Shadcn UI components

#### Pages
- `/app/page.tsx` - Landing page
- `/app/layout.tsx` - Root layout with PWA
- `/app/auth/login/page.tsx` - Login page
- `/app/auth/register/page.tsx` - Registration page
- `/app/dashboard/page.tsx` - Role-based router
- `/app/student/layout.tsx` - Student layout with navigation

## 🚀 Next Steps to Complete

### 1. Create Student Pages

You need to create these pages in `/app/student/`:

```bash
# Dashboard
app/student/dashboard/page.tsx

# Subjects
app/student/subjects/page.tsx          # List all subjects
app/student/subjects/[id]/page.tsx     # Subject detail with lessons

# Lessons
app/student/lessons/[id]/page.tsx      # Lesson viewer

# Quiz
app/student/quiz/[id]/page.tsx         # Quiz interface
app/student/quiz/[id]/result/page.tsx  # Quiz results

# Progress
app/student/progress/page.tsx          # Progress tracking
```

### 2. Create Teacher Pages

```bash
# Dashboard
app/teacher/dashboard/page.tsx
app/teacher/layout.tsx

# Lessons Management
app/teacher/lessons/page.tsx          # List lessons
app/teacher/lessons/create/page.tsx   # Create lesson
app/teacher/lessons/[id]/edit/page.tsx # Edit lesson

# Analytics
app/teacher/analytics/[subjectId]/page.tsx
```

### 3. Create Admin Pages

```bash
# Dashboard
app/admin/dashboard/page.tsx
app/admin/layout.tsx

# User Management
app/admin/users/page.tsx
```

### 4. Add PWA Icons

Create these icon files in `/public/`:
- `icon-192x192.png` (192x192 px)
- `icon-512x512.png` (512x512 px)

You can use a free tool like [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator) or create simple ones with any image editor.

## 📝 Example Page Templates

### Student Dashboard Example

```typescript
// app/student/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookOpen, CheckCircle, TrendingUp } from 'lucide-react';

export default function StudentDashboard() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await api.getStudentDashboard();
        setDashboard(data);
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Dashboard</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.enrolled_subjects || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed Lessons</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard?.completed_lessons || 0} / {dashboard?.total_lessons || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((dashboard?.completed_lessons / dashboard?.total_lessons || 0) * 100)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add more dashboard sections here */}
    </div>
  );
}
```

### Subject List Example

```typescript
// app/student/subjects/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OfflineDownloadButton } from '@/components/offline-download-button';
import { BookOpen } from 'lucide-react';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const data = await api.getSubjects();
        setSubjects(data.data || data);
      } catch (error) {
        console.error('Failed to fetch subjects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Available Subjects</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <Card key={subject.id}>
            <CardHeader>
              <CardTitle>{subject.name}</CardTitle>
              <CardDescription>Grade {subject.grade_level}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{subject.description}</p>
              
              <div className="flex flex-col gap-2">
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
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

## 🧪 Testing the App

### 1. Start the API
```bash
cd ../learn_mate_api
npm start
```

### 2. Start the UI
```bash
npm run dev
```

### 3. Test Offline Mode
1. Register a new student account
2. Browse subjects and download one
3. Open Chrome DevTools → Network → Offline
4. Browse the downloaded subject
5. Take a quiz offline
6. Go back online and watch the sync

## 📚 Key Concepts

### Authentication Flow
1. User logs in → JWT tokens stored in localStorage
2. API client automatically includes token in requests
3. Token refresh happens automatically on 401 errors
4. Logout clears tokens and all offline data

### Offline Download
1. Click "Download for Offline" button
2. System fetches: subject + lessons + quizzes + PDFs
3. Everything stored in IndexedDB
4. Subject marked as available offline

### Offline Usage
1. App detects offline status (navigator.onLine)
2. All data read from IndexedDB instead of API
3. Actions (quiz submit, progress) added to sync queue
4. Queue processed when back online

### Background Sync
1. Service runs every 30 seconds when online
2. Processes sync queue items in order
3. Retries failed items up to 3 times
4. Removes successfully synced items

## 🐛 Common Issues

### "Cannot find module" errors
```bash
npm install
```

### Service worker not registering
- Only works in production build or HTTPS
- Use `npm run build && npm start` to test PWA

### IndexedDB not working
- Check browser compatibility
- Clear browser data and retry

### API connection failed
- Verify API is running on http://localhost:5000
- Check .env.local configuration

## 📖 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Dexie.js Guide](https://dexie.org/docs/)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)
- [Shadcn UI Components](https://ui.shadcn.com/)

## ✅ What's Already Working

- ✅ PWA configuration with service worker
- ✅ IndexedDB database with Dexie
- ✅ API client with automatic token refresh
- ✅ Authentication system (login/register)
- ✅ Offline download service
- ✅ Background sync queue
- ✅ Network status detection
- ✅ Landing page
- ✅ Student layout with navigation

## 🎯 What You Need to Complete

- [ ] Student dashboard page
- [ ] Subject listing and detail pages
- [ ] Lesson viewer page
- [ ] Quiz interface and results pages
- [ ] Teacher dashboard and CRUD pages
- [ ] Admin dashboard and user management
- [ ] PWA icons (192x192 and 512x512)

---

**The foundation is solid! Build the remaining pages following the examples above.**
