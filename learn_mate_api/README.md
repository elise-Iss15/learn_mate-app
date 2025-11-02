# LearnMate South Sudan API

> A RESTful API for an e-learning platform designed for low-connectivity environments in South Sudan

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-green.svg)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Configuration](#configuration)
- [Running the Server](#running-the-server)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Security](#security)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

LearnMate South Sudan API is a backend system that powers an e-learning platform specifically designed for educational institutions in South Sudan. The platform supports offline-first functionality, multiple languages, and is optimized for low-bandwidth environments.

### Key Objectives

- **Accessibility**: Works in low-connectivity environments
- **Scalability**: Handles multiple subjects, lessons, and users
- **Security**: JWT-based authentication with role-based access control
- **Flexibility**: Supports multiple content types and languages
- **Offline Support**: Sync capabilities for offline quiz submissions

## ✨ Features

### User Management
- ✅ User registration and authentication
- ✅ Role-based access control (Student, Teacher, Admin)
- ✅ JWT token-based authentication
- ✅ Password hashing with bcrypt
- ✅ Refresh token mechanism

### Content Management
- ✅ Subject creation and management
- ✅ Lesson creation with rich content
- ✅ Multi-language support (English, Arabic)
- ✅ Content organization by grade level

### Assessment System
- ✅ Quiz creation with multiple question types
- ✅ Multiple choice questions
- ✅ True/False questions
- ✅ Short answer questions
- ✅ Automatic grading
- ✅ Quiz attempt tracking
- ✅ Score calculation and feedback

### Student Features
- ✅ Course enrollment
- ✅ Progress tracking
- ✅ Personal dashboard
- ✅ Quiz history
- ✅ Performance analytics

### Teacher Features
- ✅ Content creation and management
- ✅ Student progress monitoring
- ✅ Performance analytics
- ✅ Quiz result analysis
- ✅ Subject-wise statistics

### Admin Features
- ✅ User management
- ✅ Platform-wide analytics
- ✅ Role management
- ✅ System monitoring

## 🛠 Technology Stack

| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework |
| **MySQL** | Database |
| **JWT** | Authentication |
| **bcrypt** | Password hashing |
| **express-validator** | Input validation |
| **cors** | Cross-origin resource sharing |
| **dotenv** | Environment configuration |
| **express-rate-limit** | API rate limiting |

## 📦 Installation

### Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn package manager

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd learn_mate_api
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=learnmate_db
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_REFRESH_SECRET=your_refresh_token_secret_change_in_production
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# CORS
FRONTEND_URL=http://localhost:3000

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=5
```

## 🗄 Database Setup

### Step 1: Create Database

Login to MySQL:

```bash
mysql -u root -p
```

Create the database:

```sql
CREATE DATABASE learnmate_db;
USE learnmate_db;
```

### Step 2: Run Schema

Execute the schema file:

```bash
mysql -u root -p learnmate_db < database/schema.sql
```

Or from MySQL prompt:

```sql
SOURCE database/schema.sql;
```

### Step 3: Seed Sample Data (Optional)

```bash
mysql -u root -p learnmate_db < database/seed.sql
```

**Note**: The seed file contains sample admin users users with the password `password` and email `admin@gmail.com` for admin user.

## 🚀 Running the Server

### Development Mode

```bash
npm run dev
```

This uses nodemon for auto-restart on file changes.

### Production Mode

```bash
npm start
```

The server will start on the port specified in your `.env` file (default: 5000).

You should see:

```
✅ Database connected successfully

╔═══════════════════════════════════════════════════╗
║                                                   ║
║        LearnMate South Sudan API Server          ║
║                                                   ║
╚═══════════════════════════════════════════════════╝

🚀 Server running on port 5000
🌍 Environment: development
📡 API Base URL: http://localhost:5000/api
```

## 📚 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Endpoints Overview

#### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| POST | `/api/auth/refresh-token` | Refresh access token | Public |
| POST | `/api/auth/logout` | Logout user | Private |
| GET | `/api/auth/me` | Get current user | Private |

#### Subject Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/subjects` | Get all subjects | Public |
| GET | `/api/subjects/:id` | Get subject by ID | Public |
| POST | `/api/subjects` | Create subject | Teacher/Admin |
| PUT | `/api/subjects/:id` | Update subject | Teacher/Admin |
| DELETE | `/api/subjects/:id` | Delete subject | Admin |

#### Lesson Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/lessons/:id` | Get lesson by ID | Public |
| POST | `/api/lessons` | Create lesson | Teacher/Admin |
| PUT | `/api/lessons/:id` | Update lesson | Teacher/Admin |
| DELETE | `/api/lessons/:id` | Delete lesson | Teacher/Admin |
| POST | `/api/lessons/:id/progress` | Update progress | Student |

#### Quiz Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/quizzes/:id` | Get quiz with questions | Public |
| POST | `/api/quizzes` | Create quiz | Teacher/Admin |
| PUT | `/api/quizzes/:id` | Update quiz | Teacher/Admin |
| DELETE | `/api/quizzes/:id` | Delete quiz | Teacher/Admin |
| POST | `/api/quizzes/:id/start` | Start quiz attempt | Student |
| POST | `/api/quizzes/:id/submit` | Submit quiz answers | Student |
| GET | `/api/quizzes/:id/attempts` | Get quiz attempts | Student |

#### Student Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/students/dashboard` | Get dashboard data | Student |
| GET | `/api/students/progress` | Get progress stats | Student |
| GET | `/api/students/subjects` | Get enrolled subjects | Student |
| POST | `/api/students/enroll/:subjectId` | Enroll in subject | Student |
| DELETE | `/api/students/enroll/:subjectId` | Unenroll from subject | Student |
| GET | `/api/students/quiz-history` | Get quiz history | Student |

#### Teacher Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/teachers/dashboard` | Get dashboard analytics | Teacher/Admin |
| GET | `/api/teachers/subjects` | Get created subjects | Teacher/Admin |
| GET | `/api/teachers/students/:subjectId` | Get enrolled students | Teacher/Admin |
| GET | `/api/teachers/analytics/:subjectId` | Get subject analytics | Teacher/Admin |
| GET | `/api/teachers/quiz-results/:quizId` | Get quiz results | Teacher/Admin |

#### Admin Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/admin/users` | Get all users | Admin |
| GET | `/api/admin/users/:id` | Get user by ID | Admin |
| POST | `/api/admin/users` | Create user | Admin |
| PUT | `/api/admin/users/:id/role` | Update user role | Admin |
| DELETE | `/api/admin/users/:id` | Delete user | Admin |
| GET | `/api/admin/analytics` | Platform analytics | Admin |

### Example Requests

#### Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "Password123",
    "role": "student",
    "first_name": "John",
    "last_name": "Doe",
    "grade_level": 8
  }'
```

#### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gmail.com",
    "password": "password"
  }'
```

#### Create Subject (Teacher)

```bash
curl -X POST http://localhost:5000/api/subjects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "name": "Mathematics - Grade 8",
    "description": "Comprehensive math course",
    "grade_level": 8
  }'
```

#### Submit Quiz

```bash
curl -X POST http://localhost:5000/api/quizzes/1/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "attempt_id": 1,
    "answers": [
      {
        "question_id": 1,
        "student_answer": "Option A"
      },
      {
        "question_id": 2,
        "student_answer": "True"
      }
    ]
  }'
```

## 📁 Project Structure

```
learn_mate_api/
│
├── src/
│   ├── config/
│   │   └── database.js          # MySQL connection configuration
│   │
│   ├── controllers/
│   │   ├── auth.controller.js   # Authentication logic
│   │   ├── subject.controller.js
│   │   ├── lesson.controller.js
│   │   ├── quiz.controller.js
│   │   ├── student.controller.js
│   │   ├── teacher.controller.js
│   │   └── admin.controller.js
│   │
│   ├── middleware/
│   │   ├── auth.js              # JWT verification
│   │   ├── roleCheck.js         # Role-based access control
│   │   ├── validation.js        # Input validation
│   │   └── errorHandler.js      # Error handling
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── subject.routes.js
│   │   ├── lesson.routes.js
│   │   ├── quiz.routes.js
│   │   ├── student.routes.js
│   │   ├── teacher.routes.js
│   │   └── admin.routes.js
│   │
│   ├── utils/
│   │   ├── jwt.js               # JWT helper functions
│   │   └── validators.js        # Validation schemas
│   │
│   └── server.js                # Main application entry
│
├── database/
│   ├── schema.sql               # Database schema
│   └── seed.sql                 # Sample data
│
├── .env.example                 # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## 🔒 Security

### Implemented Security Measures

1. **Password Security**
   - Passwords hashed using bcrypt (10 rounds)
   - Never stored or returned in plain text

2. **Authentication**
   - JWT-based stateless authentication
   - Access tokens expire in 15 minutes
   - Refresh tokens expire in 7 days
   - Tokens stored securely in database

3. **Authorization**
   - Role-based access control (RBAC)
   - Route-level permission checks
   - Resource ownership validation

4. **Input Validation**
   - All inputs validated using express-validator
   - SQL injection prevention via parameterized queries
   - XSS protection through input sanitization

5. **Rate Limiting**
   - Auth endpoints: 5 requests per minute
   - API endpoints: 100 requests per minute

6. **CORS**
   - Configured to allow only specific origins
   - Credentials support enabled

7. **Error Handling**
   - Sensitive information never exposed in errors
   - Stack traces only in development mode

## 🧪 Testing

### Manual Testing

Use tools like:
- **Postman** - Import the API endpoints for testing
- **cURL** - Command-line testing (examples above)
- **Thunder Client** - VS Code extension

### Test User Accounts (from seed data)

```
Admin:
  Email: admin@gmail.com
  Password: password

Teacher:
  Email: john.doe@learnmate.ss
  Password: password

Student:
  Email: alice@student.ss
  Password: password
```

## 🙏 Acknowledgments

- Built for educational institutions in South Sudan
- Designed with low-connectivity environments in mind
- Inspired by the need for accessible education

---

**Made with ❤️ for South Sudan Education**
