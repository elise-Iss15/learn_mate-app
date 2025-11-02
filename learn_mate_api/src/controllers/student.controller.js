const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Get student dashboard
 * GET /api/students/dashboard
 * @access Student
 */
const getStudentDashboard = asyncHandler(async (req, res) => {
  const student_id = req.user.id;

  // Get enrolled subjects count
  const [enrollmentCount] = await pool.query(
    'SELECT COUNT(*) as count FROM enrollments WHERE student_id = ?',
    [student_id]
  );

  // Get total and completed lessons
  const [lessonStats] = await pool.query(
    `SELECT 
       COUNT(DISTINCT sp.lesson_id) as completed_lessons,
       (SELECT COUNT(DISTINCT l.id) 
        FROM lessons l 
        JOIN subjects s ON l.subject_id = s.id 
        JOIN enrollments e ON e.subject_id = s.id 
        WHERE e.student_id = ? AND l.is_published = true) as total_lessons
     FROM student_progress sp
     WHERE sp.student_id = ? AND sp.is_completed = true`,
    [student_id, student_id]
  );

  // Get quizzes taken count
  const [quizStats] = await pool.query(
    'SELECT COUNT(*) as count FROM quiz_attempts WHERE student_id = ? AND completed_at IS NOT NULL',
    [student_id]
  );

  // Get average quiz score
  const [avgScore] = await pool.query(
    `SELECT AVG((score / total_points) * 100) as average_score
     FROM quiz_attempts
     WHERE student_id = ? AND completed_at IS NOT NULL AND total_points > 0`,
    [student_id]
  );

  // Get recent activity
  const [recentActivity] = await pool.query(
    `SELECT 
       l.id as lesson_id,
       l.title as lesson_title,
       s.name as subject,
       sp.is_completed as completed,
       sp.last_accessed as date
     FROM student_progress sp
     JOIN lessons l ON sp.lesson_id = l.id
     JOIN subjects s ON l.subject_id = s.id
     WHERE sp.student_id = ?
     ORDER BY sp.last_accessed DESC
     LIMIT 10`,
    [student_id]
  );

  res.json({
    success: true,
    data: {
      enrolled_subjects: enrollmentCount[0].count,
      completed_lessons: lessonStats[0].completed_lessons || 0,
      total_lessons: lessonStats[0].total_lessons || 0,
      quizzes_taken: quizStats[0].count,
      average_score: avgScore[0].average_score ? Math.round(avgScore[0].average_score) : 0,
      recent_activity: recentActivity
    }
  });
});

/**
 * Get overall progress stats
 * GET /api/students/progress
 * @access Student
 */
const getStudentProgress = asyncHandler(async (req, res) => {
  const student_id = req.user.id;

  // Get progress by subject
  const [subjectProgress] = await pool.query(
    `SELECT 
       s.id as subject_id,
       s.name as subject_name,
       s.grade_level,
       COUNT(DISTINCT l.id) as total_lessons,
       COUNT(DISTINCT CASE WHEN sp.is_completed = true THEN sp.lesson_id END) as completed_lessons,
       AVG(CASE WHEN qa.completed_at IS NOT NULL THEN (qa.score / qa.total_points) * 100 END) as avg_quiz_score
     FROM enrollments e
     JOIN subjects s ON e.subject_id = s.id
     LEFT JOIN lessons l ON l.subject_id = s.id AND l.is_published = true
     LEFT JOIN student_progress sp ON sp.lesson_id = l.id AND sp.student_id = ?
     LEFT JOIN quizzes q ON q.lesson_id = l.id
     LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id AND qa.student_id = ? AND qa.completed_at IS NOT NULL
     WHERE e.student_id = ?
     GROUP BY s.id, s.name, s.grade_level
     ORDER BY s.name ASC`,
    [student_id, student_id, student_id]
  );

  // Calculate completion percentage for each subject
  const progressData = subjectProgress.map(subject => ({
    ...subject,
    completion_percentage: subject.total_lessons > 0 
      ? Math.round((subject.completed_lessons / subject.total_lessons) * 100)
      : 0,
    avg_quiz_score: subject.avg_quiz_score ? Math.round(subject.avg_quiz_score) : null
  }));

  res.json({
    success: true,
    data: {
      subjects: progressData
    }
  });
});

/**
 * Get enrolled subjects
 * GET /api/students/subjects
 * @access Student
 */
const getEnrolledSubjects = asyncHandler(async (req, res) => {
  const student_id = req.user.id;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const [subjects] = await pool.query(
    `SELECT 
       s.*,
       e.enrolled_at,
       (SELECT COUNT(*) FROM lessons WHERE subject_id = s.id AND is_published = true) as total_lessons,
       (SELECT COUNT(*) FROM student_progress sp 
        JOIN lessons l ON sp.lesson_id = l.id 
        WHERE l.subject_id = s.id AND sp.student_id = ? AND sp.is_completed = true) as completed_lessons
     FROM enrollments e
     JOIN subjects s ON e.subject_id = s.id
     WHERE e.student_id = ?
     ORDER BY e.enrolled_at DESC
     LIMIT ? OFFSET ?`,
    [student_id, student_id, parseInt(limit), parseInt(offset)]
  );

  // Get total count
  const [countResult] = await pool.query(
    'SELECT COUNT(*) as total FROM enrollments WHERE student_id = ?',
    [student_id]
  );

  const total = countResult[0].total;

  res.json({
    success: true,
    data: {
      subjects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

/**
 * Enroll in a subject
 * POST /api/students/enroll/:subjectId
 * @access Student
 */
const enrollInSubject = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;
  const student_id = req.user.id;

  // Check if subject exists
  const [subjects] = await pool.query(
    'SELECT * FROM subjects WHERE id = ?',
    [subjectId]
  );

  if (subjects.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found'
    });
  }

  // Check if already enrolled
  const [existingEnrollment] = await pool.query(
    'SELECT * FROM enrollments WHERE student_id = ? AND subject_id = ?',
    [student_id, subjectId]
  );

  if (existingEnrollment.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Already enrolled in this subject'
    });
  }

  // Create enrollment
  const query = `
    INSERT INTO enrollments (student_id, subject_id)
    VALUES (?, ?)
  `;

  await pool.query(query, [student_id, subjectId]);

  res.status(201).json({
    success: true,
    message: 'Enrolled successfully',
    data: {
      subject: subjects[0]
    }
  });
});

/**
 * Unenroll from a subject
 * DELETE /api/students/enroll/:subjectId
 * @access Student
 */
const unenrollFromSubject = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;
  const student_id = req.user.id;

  // Check if enrolled
  const [enrollments] = await pool.query(
    'SELECT * FROM enrollments WHERE student_id = ? AND subject_id = ?',
    [student_id, subjectId]
  );

  if (enrollments.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Not enrolled in this subject'
    });
  }

  // Delete enrollment
  await pool.query(
    'DELETE FROM enrollments WHERE student_id = ? AND subject_id = ?',
    [student_id, subjectId]
  );

  res.json({
    success: true,
    message: 'Unenrolled successfully'
  });
});

/**
 * Get quiz history
 * GET /api/students/quiz-history
 * @access Student
 */
const getQuizHistory = asyncHandler(async (req, res) => {
  const student_id = req.user.id;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const [attempts] = await pool.query(
    `SELECT 
       qa.*,
       q.title as quiz_title,
       q.passing_score,
       l.title as lesson_title,
       s.name as subject_name,
       CASE 
         WHEN qa.total_points > 0 THEN ROUND((qa.score / qa.total_points) * 100)
         ELSE 0
       END as percentage,
       CASE 
         WHEN qa.total_points > 0 AND (qa.score / qa.total_points) * 100 >= q.passing_score THEN true
         ELSE false
       END as passed
     FROM quiz_attempts qa
     JOIN quizzes q ON qa.quiz_id = q.id
     JOIN lessons l ON q.lesson_id = l.id
     JOIN subjects s ON l.subject_id = s.id
     WHERE qa.student_id = ? AND qa.completed_at IS NOT NULL
     ORDER BY qa.completed_at DESC
     LIMIT ? OFFSET ?`,
    [student_id, parseInt(limit), parseInt(offset)]
  );

  // Get total count
  const [countResult] = await pool.query(
    'SELECT COUNT(*) as total FROM quiz_attempts WHERE student_id = ? AND completed_at IS NOT NULL',
    [student_id]
  );

  const total = countResult[0].total;

  res.json({
    success: true,
    data: {
      attempts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

module.exports = {
  getStudentDashboard,
  getStudentProgress,
  getEnrolledSubjects,
  enrollInSubject,
  unenrollFromSubject,
  getQuizHistory
};
