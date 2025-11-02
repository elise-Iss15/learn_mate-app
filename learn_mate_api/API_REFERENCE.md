# LearnMate API Endpoints Reference

## Quick Reference Guide

### Response Format

All API responses follow this format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]
}
```

### Authentication Header

For protected endpoints, include:
```
Authorization: Bearer <your-access-token>
```

---

## 1. Authentication Endpoints

### POST /api/auth/register
Register a new user

**Access:** Public

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "Password123",
  "role": "student",
  "first_name": "John",
  "last_name": "Doe",
  "grade_level": 8,
  "preferred_language": "en"
}
```

**Response:** 201 Created
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### POST /api/auth/login
Login user

**Access:** Public

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### POST /api/auth/refresh-token
Get new access token

**Access:** Public (requires refresh token)

**Request Body:**
```json
{
  "refreshToken": "your-refresh-token"
}
```

### GET /api/auth/me
Get current user profile

**Access:** Private

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "role": "student"
    }
  }
}
```

---

## 2. Subject Endpoints

### GET /api/subjects
Get all subjects

**Access:** Public

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `grade_level` (optional): Filter by grade level

**Example:** `/api/subjects?grade_level=8&page=1&limit=10`

### GET /api/subjects/:id
Get subject details with lessons

**Access:** Public

**Example:** `/api/subjects/1`

### POST /api/subjects
Create new subject

**Access:** Teacher, Admin

**Request Body:**
```json
{
  "name": "Mathematics - Grade 8",
  "description": "Comprehensive math course",
  "grade_level": 8
}
```

### PUT /api/subjects/:id
Update subject

**Access:** Teacher (owner), Admin

**Request Body:**
```json
{
  "name": "Updated Subject Name",
  "description": "Updated description",
  "grade_level": 8
}
```

### DELETE /api/subjects/:id
Delete subject

**Access:** Admin only

---

## 3. Lesson Endpoints

### GET /api/lessons/:id
Get lesson details

**Access:** Public

**Response includes:**
- Lesson content
- Associated quizzes
- User progress (if authenticated as student)

### POST /api/lessons
Create new lesson

**Access:** Teacher, Admin

**Request Body:**
```json
{
  "subject_id": 1,
  "title": "Introduction to Algebra",
  "content": "Lesson content here...",
  "order_number": 1,
  "language": "en",
  "is_published": true
}
```

### PUT /api/lessons/:id
Update lesson

**Access:** Teacher (owner), Admin

### DELETE /api/lessons/:id
Delete lesson

**Access:** Teacher (owner), Admin

### POST /api/lessons/:id/progress
Update lesson progress

**Access:** Student

**Request Body:**
```json
{
  "is_completed": true,
  "time_spent": 1200
}
```

---

## 4. Quiz Endpoints

### GET /api/quizzes/:id
Get quiz with questions

**Access:** Public

**Response includes:**
- Quiz details
- Questions (without correct answers for students)
- User attempts (if authenticated as student)

### POST /api/quizzes
Create new quiz

**Access:** Teacher, Admin

**Request Body:**
```json
{
  "lesson_id": 1,
  "title": "Algebra Basics Quiz",
  "description": "Test your understanding",
  "time_limit": 15,
  "passing_score": 70,
  "max_attempts": 3,
  "questions": [
    {
      "question_text": "What is 2 + 2?",
      "question_type": "multiple_choice",
      "points": 5,
      "options": [
        { "option_text": "3", "is_correct": false },
        { "option_text": "4", "is_correct": true }
      ]
    }
  ]
}
```

### POST /api/quizzes/:id/start
Start new quiz attempt

**Access:** Student

**Response:** Attempt ID and time limit

### POST /api/quizzes/:id/submit
Submit quiz answers

**Access:** Student

**Request Body:**
```json
{
  "attempt_id": 1,
  "answers": [
    {
      "question_id": 1,
      "student_answer": "4"
    }
  ]
}
```

**Response:** Score, feedback, and pass/fail status

### GET /api/quizzes/:id/attempts
Get student's quiz attempts

**Access:** Student

---

## 5. Student Endpoints

### GET /api/students/dashboard
Get student dashboard

**Access:** Student

**Response:**
```json
{
  "success": true,
  "data": {
    "enrolled_subjects": 5,
    "completed_lessons": 23,
    "total_lessons": 50,
    "quizzes_taken": 12,
    "average_score": 78,
    "recent_activity": [ ... ]
  }
}
```

### GET /api/students/progress
Get detailed progress by subject

**Access:** Student

### GET /api/students/subjects
Get enrolled subjects

**Access:** Student

**Query Parameters:**
- `page`, `limit`: Pagination

### POST /api/students/enroll/:subjectId
Enroll in subject

**Access:** Student

**Example:** `/api/students/enroll/1`

### DELETE /api/students/enroll/:subjectId
Unenroll from subject

**Access:** Student

### GET /api/students/quiz-history
Get quiz attempt history

**Access:** Student

---

## 6. Teacher Endpoints

### GET /api/teachers/dashboard
Get teacher dashboard with analytics

**Access:** Teacher, Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "total_subjects": 5,
    "total_lessons": 45,
    "total_quizzes": 20,
    "total_students": 150,
    "recent_submissions": [ ... ],
    "top_subjects": [ ... ]
  }
}
```

### GET /api/teachers/subjects
Get subjects created by teacher

**Access:** Teacher, Admin

### GET /api/teachers/students/:subjectId
Get enrolled students for subject

**Access:** Teacher, Admin

**Response includes:**
- Student list
- Completion rates
- Average scores

### GET /api/teachers/analytics/:subjectId
Get detailed subject analytics

**Access:** Teacher, Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "subject_name": "Mathematics",
    "total_students": 45,
    "total_lessons": 20,
    "completion_rate": 67,
    "average_quiz_score": 72,
    "top_performers": [ ... ],
    "struggling_students": [ ... ]
  }
}
```

### GET /api/teachers/quiz-results/:quizId
Get all student results for quiz

**Access:** Teacher, Admin

---

## 7. Admin Endpoints

### GET /api/admin/analytics
Get platform-wide analytics

**Access:** Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "user_statistics": { ... },
    "content_statistics": { ... },
    "quiz_statistics": { ... },
    "recent_activity": [ ... ],
    "popular_subjects": [ ... ]
  }
}
```

### GET /api/admin/users
Get all users with filters

**Access:** Admin

**Query Parameters:**
- `role`: Filter by role (student/teacher/admin)
- `grade_level`: Filter by grade level
- `search`: Search by name, email, username
- `page`, `limit`: Pagination

### GET /api/admin/users/:id
Get user details with statistics

**Access:** Admin

### POST /api/admin/users
Create new user (as admin)

**Access:** Admin

**Request Body:** Same as register endpoint

### PUT /api/admin/users/:id/role
Update user role

**Access:** Admin

**Request Body:**
```json
{
  "role": "teacher"
}
```

### DELETE /api/admin/users/:id
Delete user

**Access:** Admin

---

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate entry) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

## Rate Limits

- **Auth endpoints**: 5 requests per minute
- **Other endpoints**: 100 requests per minute

## Pagination

All list endpoints support pagination:
- Default: 20 items per page
- Max: 100 items per page

**Query parameters:**
- `page`: Page number (starts at 1)
- `limit`: Items per page

**Response includes pagination info:**
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

## Best Practices

1. **Always check** the `success` field in responses
2. **Store** refresh tokens securely
3. **Refresh** access tokens before they expire
4. **Handle** rate limiting with exponential backoff
5. **Validate** user input on client side too
6. **Use HTTPS** in production
7. **Don't** expose tokens in URLs

## Example Workflows

### Student Taking a Quiz

1. GET `/api/subjects` - Browse subjects
2. POST `/api/students/enroll/1` - Enroll in subject
3. GET `/api/subjects/1` - Get lessons
4. GET `/api/lessons/1` - View lesson
5. POST `/api/lessons/1/progress` - Mark as complete
6. GET `/api/quizzes/1` - Get quiz
7. POST `/api/quizzes/1/start` - Start attempt
8. POST `/api/quizzes/1/submit` - Submit answers
9. GET `/api/students/dashboard` - View updated stats

### Teacher Creating Content

1. POST `/api/subjects` - Create subject
2. POST `/api/lessons` - Create lessons
3. POST `/api/quizzes` - Create quiz with questions
4. GET `/api/teachers/students/1` - Monitor students
5. GET `/api/teachers/analytics/1` - View analytics

---

**For more details, see the full [README.md](README.md)**
