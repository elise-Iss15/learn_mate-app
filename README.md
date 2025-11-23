# LearnMate South Sudan

An offline-first e-learning platform designed specifically for educational institutions in South Sudan, enabling quality education in low-connectivity environments. LearnMate provides a complete learning management system with support for students, teachers, and administrators, featuring offline content access, automatic synchronization, and multi-language support (English/Arabic).

## 🌟 Key Features

- **Offline-First Architecture**: Download entire subjects and work completely offline
- **Multi-Role System**: Separate interfaces for students, teachers, and administrators
- **Content Management**: Create and manage subjects, lessons (with PDF uploads), and quizzes
- **Progress Tracking**: Comprehensive analytics and progress monitoring
- **Background Sync**: Automatic synchronization when connectivity returns
- **PWA Support**: Installable as a native app on mobile and desktop
- **Multi-Language**: Full support for English and Arabic

## 🚀 Live Demo

- **UI (Frontend)**: [https://learn-mate-app.vercel.app](https://learn-mate-app.vercel.app)
- **API (Backend)**: [https://learn-mate-app.onrender.com](https://learn-mate-app.onrender.com)
- **Video Demo**: [Watch Demo on Google Drive](https://drive.google.com/file/d/1YPaa-yiCYBGGyYsbgZOtqXC6xX0XL2m-/view?usp=sharing)

### Test Accounts

You can use the following test accounts to explore the platform:

| Role | Email | Password |
|------|-------|----------|
| **Student** | alice@student.ss | password |
| **Teacher** | john.doe@learnmate.ss | password |
| **Admin** | admin@gmail.com | password |

## 📚 Documentation

- **UI Documentation**: [learn_mate_ui/README.md](learn_mate_ui/README.md)
- **API Documentation**: [learn_mate_api/README.md](learn_mate_api/README.md) & [API Reference](learn_mate_api/API_REFERENCE.md)

## 🛠️ Technology Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + Shadcn UI
- IndexedDB (Dexie.js) for offline storage
- Zustand for state management

### Backend
- Node.js + Express
- MySQL
- JWT Authentication
- Dropbox API for file storage

## 📦 Project Structure

```
learn_mate/
├── learn_mate_api/     # Backend API (Node.js/Express)
├── learn_mate_ui/      # Frontend UI (Next.js)
└── README.md           # This file
```

## 🎯 Target Audience

LearnMate is built for educational institutions operating in areas with limited internet connectivity, providing uninterrupted access to educational content regardless of network availability.
