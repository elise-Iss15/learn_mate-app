# 🚀 Quick Start Guide - LearnMate UI

## ⚡ Get Running in 5 Minutes

### Step 1: Verify Installation
```bash
cd learn_mate_ui
npm install  # Should already be done
```

### Step 2: Start the API Server
```bash
# In a separate terminal
cd ../learn_mate_api
npm start
```

The API should start on `http://localhost:5000`

### Step 3: Start the UI Development Server
```bash
npm run dev
```

### Step 4: Open Your Browser
Navigate to: **http://localhost:3000**

You should see the LearnMate landing page! 🎉

---

## 🧪 Test the App

### Create an Account
1. Click "Get Started" or "Sign Up"
2. Fill in the registration form:
   - Choose role: **Student**
   - Select grade level: **8**
   - Preferred language: **English**
3. Submit the form

### You'll be redirected to the dashboard router
- Currently shows a loading spinner (dashboard page not created yet)
- This is expected! The infrastructure works.

---

## 🎨 What You See

### ✅ Working Pages
- **Landing Page** (`/`) - Beautiful hero section
- **Login Page** (`/auth/login`) - Full authentication
- **Register Page** (`/auth/register`) - Complete registration flow

### 🔨 Pages to Build (Templates in SETUP.md)
- Student Dashboard
- Subjects List
- Lesson Viewer
- Quiz Interface

---

## 🛠️ Next Actions

### 1. Create Simple Icons (5 minutes)

You can use any tool to create simple square icons:

**Option A: Use an Online Tool**
- Go to https://www.favicon-generator.org/
- Upload any image or create a simple design
- Download 192x192 and 512x512 versions
- Save as `icon-192x192.png` and `icon-512x512.png` in `/public/`

**Option B: Use GIMP/Photoshop**
- Create a 512x512 canvas with #2563eb (blue) background
- Add white text "LM" in the center
- Save two versions: 512x512 and 192x192

**Option C: Simple Colored Square**
```bash
# On Linux with ImageMagick
convert -size 512x512 xc:#2563eb public/icon-512x512.png
convert -size 192x192 xc:#2563eb public/icon-192x192.png
```

### 2. Build Your First Page (15 minutes)

Copy this code to create the student dashboard:

**File: `app/student/dashboard/page.tsx`**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookOpen, CheckCircle } from 'lucide-react';

export default function StudentDashboard() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await api.getStudentDashboard();
        setDashboard(data);
      } catch (error) {
        console.error('Error:', error);
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
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(((dashboard?.completed_lessons || 0) / (dashboard?.total_lessons || 1)) * 100)}%
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

Now visit `/student/dashboard` - you'll see your dashboard!

### 3. Add the Subjects Page (20 minutes)

**File: `app/student/subjects/page.tsx`**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OfflineDownloadButton } from '@/components/offline-download-button';
import { Loader2, BookOpen } from 'lucide-react';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await api.getSubjects();
        setSubjects(response.data || response);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Available Subjects</h1>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <Card key={subject.id}>
            <CardHeader>
              <CardTitle>{subject.name}</CardTitle>
              <CardDescription>Grade {subject.grade_level}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {subject.description}
              </p>
              
              <div className="text-sm text-muted-foreground">
                {subject.lesson_count || 0} lessons
              </div>

              <div className="flex flex-col gap-2">
                <Button className="w-full">
                  <BookOpen className="h-4 w-4 mr-2" />
                  View Lessons
                </Button>
                
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

Now visit `/student/subjects` - browse and download subjects!

---

## 🧪 Test Offline Mode

### Step 1: Download a Subject
1. Navigate to `/student/subjects`
2. Click "Download for Offline" on any subject
3. Wait for download to complete (watch progress bar)

### Step 2: Go Offline
1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Select "Offline" from the throttling dropdown

### Step 3: Test Offline
1. Refresh the page
2. Navigate around the app
3. The subject you downloaded should still be accessible!

### Step 4: Test Sync
1. Take a quiz offline (when quiz page is built)
2. Go back online
3. Watch the sync indicator - it will automatically sync your quiz!

---

## 📖 Understand What's Built

### The Magic Behind the Scenes

When you download a subject:
```
1. Fetch subject details from API
2. Fetch all lessons for that subject
3. For each lesson, fetch its quiz
4. Download any PDF files
5. Store EVERYTHING in IndexedDB
6. Mark subject as "available offline"
```

When you're offline:
```
1. App detects no internet (navigator.onLine)
2. All data read from IndexedDB
3. Actions (quiz submit) go to sync queue
4. Network indicator shows "Offline"
```

When you come back online:
```
1. App detects internet restored
2. Sync service automatically starts
3. Processes sync queue items one by one
4. Retries failures up to 3 times
5. Shows sync progress in network indicator
```

### Why This is Powerful

- **Students in remote areas** can download at school (with WiFi)
- **Study at home** without internet
- **All progress saved** and synced when back online
- **Nothing is lost** even with spotty connection

---

## 🎯 Your Mission

1. ✅ App is running
2. ✅ You can register and login
3. 🔲 Create dashboard page (15 min)
4. 🔲 Create subjects page (20 min)
5. 🔲 Create icons (5 min)
6. 🔲 Test offline mode (10 min)

**Total time to working demo: ~1 hour**

---

## 🆘 Troubleshooting

### "Cannot connect to API"
- Make sure API is running on port 5000
- Check `.env.local` has correct API URL

### "Hooks can only be called inside function components"
- Make sure file has `'use client'` at the top
- Check all imports are correct

### "Module not found"
- Run `npm install` again
- Delete `.next` folder and restart

### Service Worker not working
- Only works in production or with HTTPS
- Run `npm run build && npm start` to test PWA

---

## 🎉 You're Ready!

You have:
- ✅ A working Next.js app
- ✅ Complete offline infrastructure
- ✅ Authentication system
- ✅ API integration
- ✅ Beautiful UI components
- ✅ Network status detection
- ✅ Download & sync functionality

**Now go build those pages! You've got this! 💪**

See `SETUP.md` for more examples and `CHECKLIST.md` for what to build next.

---

**Questions?** Check the inline code comments or refer to the comprehensive documentation in `README.md` and `SETUP.md`.
