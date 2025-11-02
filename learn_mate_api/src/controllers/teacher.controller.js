const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Get teacher dashboard
 * GET /api/teachers/dashboard
 * @access Teacher
 */
const getTeacherDashboard = asyncHandler(async (req, res) => {
  const teacher_id = req.user.id;

  // Get subjects created
  const [subjectCount] = await pool.query(
    'SELECT COUNT(*) as count FROM subjects WHERE created_by = ?',
    [teacher_id]
  );

  // Get total lessons created
  const [lessonCount] = await pool.query(
    'SELECT COUNT(*) as count FROM lessons WHERE created_by = ?',
    [teacher_id]
  );

  // Get total quizzes created
  const [quizCount] = await pool.query(
    'SELECT COUNT(*) as count FROM quizzes WHERE created_by = ?',
    [teacher_id]
  );

  // Get total enrolled students across all subjects
  const [studentCount] = await pool.query(
    `SELECT COUNT(DISTINCT e.student_id) as count
     FROM enrollments e
     JOIN subjects s ON e.subject_id = s.id
     WHERE s.created_by = ?`,
    [teacher_id]
  );

  // Get recent quiz submissions
  const [recentSubmissions] = await pool.query(
    `SELECT 
       qa.id,
       qa.score,
       qa.total_points,
       qa.completed_at,
       u.username as student_name,
       u.first_name,
       u.last_name,
       q.title as quiz_title,
       l.title as lesson_title,
       s.name as subject_name
     FROM quiz_attempts qa
     JOIN users u ON qa.student_id = u.id
     JOIN quizzes q ON qa.quiz_id = q.id
     JOIN lessons l ON q.lesson_id = l.id
     JOIN subjects s ON l.subject_id = s.id
     WHERE s.created_by = ? AND qa.completed_at IS NOT NULL
     ORDER BY qa.completed_at DESC
     LIMIT 10`,
    [teacher_id]
  );

  // Get subject performance overview
  const [subjectPerformance] = await pool.query(
    `SELECT 
       s.id,
       s.name,
       COUNT(DISTINCT e.student_id) as enrolled_students,
       COUNT(DISTINCT l.id) as total_lessons,
       AVG(CASE 
         WHEN qa.total_points > 0 THEN (qa.score / qa.total_points) * 100 
         ELSE NULL 
       END) as avg_quiz_score
     FROM subjects s
     LEFT JOIN enrollments e ON e.subject_id = s.id
     LEFT JOIN lessons l ON l.subject_id = s.id
     LEFT JOIN quizzes q ON q.lesson_id = l.id
     LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id AND qa.completed_at IS NOT NULL
     WHERE s.created_by = ?
     GROUP BY s.id, s.name
     ORDER BY enrolled_students DESC
     LIMIT 5`,
    [teacher_id]
  );

  res.json({
    success: true,
    data: {
      total_subjects: subjectCount[0].count,
      total_lessons: lessonCount[0].count,
      total_quizzes: quizCount[0].count,
      total_students: studentCount[0].count,
      recent_submissions: recentSubmissions,
      top_subjects: subjectPerformance.map(s => ({
        ...s,
        avg_quiz_score: s.avg_quiz_score ? Math.round(s.avg_quiz_score) : null
      }))
    }
  });
});

/**
 * Get subjects created by teacher
 * GET /api/teachers/subjects
 * @access Teacher
 */
const getTeacherSubjects = asyncHandler(async (req, res) => {
  const teacher_id = req.user.id;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const [subjects] = await pool.query(
    `SELECT 
       s.*,
       (SELECT COUNT(*) FROM lessons WHERE subject_id = s.id) as lesson_count,
       (SELECT COUNT(*) FROM enrollments WHERE subject_id = s.id) as student_count
     FROM subjects s
     WHERE s.created_by = ?
     ORDER BY s.created_at DESC
     LIMIT ? OFFSET ?`,
    [teacher_id, parseInt(limit), parseInt(offset)]
  );

  const [countResult] = await pool.query(
    'SELECT COUNT(*) as total FROM subjects WHERE created_by = ?',
    [teacher_id]
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
 * Get enrolled students for a subject
 * GET /api/teachers/students/:subjectId
 * @access Teacher
 */
const getEnrolledStudents = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;
  const teacher_id = req.user.id;

  // Verify teacher owns the subject
  const [subjects] = await pool.query(
    'SELECT * FROM subjects WHERE id = ? AND created_by = ?',
    [subjectId, teacher_id]
  );

  if (subjects.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found or you do not have permission'
    });
  }

  // Get enrolled students with their progress
  const [students] = await pool.query(
    `SELECT 
       u.id,
       u.username,
       u.email,
       u.first_name,
       u.last_name,
       u.grade_level,
       e.enrolled_at,
       COUNT(DISTINCT sp.lesson_id) as lessons_completed,
       (SELECT COUNT(*) FROM lessons WHERE subject_id = ? AND is_published = true) as total_lessons,
       AVG(CASE 
         WHEN qa.total_points > 0 THEN (qa.score / qa.total_points) * 100 
         ELSE NULL 
       END) as avg_quiz_score
     FROM enrollments e
     JOIN users u ON e.student_id = u.id
     LEFT JOIN lessons l ON l.subject_id = e.subject_id
     LEFT JOIN student_progress sp ON sp.lesson_id = l.id AND sp.student_id = u.id AND sp.is_completed = true
     LEFT JOIN quizzes q ON q.lesson_id = l.id
     LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id AND qa.student_id = u.id AND qa.completed_at IS NOT NULL
     WHERE e.subject_id = ?
     GROUP BY u.id, u.username, u.email, u.first_name, u.last_name, u.grade_level, e.enrolled_at
     ORDER BY e.enrolled_at DESC`,
    [subjectId, subjectId]
  );

  const studentsWithProgress = students.map(student => ({
    ...student,
    completion_rate: student.total_lessons > 0 
      ? Math.round((student.lessons_completed / student.total_lessons) * 100)
      : 0,
    avg_quiz_score: student.avg_quiz_score ? Math.round(student.avg_quiz_score) : null
  }));

  res.json({
    success: true,
    data: {
      subject: subjects[0],
      students: studentsWithProgress,
      total_students: students.length
    }
  });
});

/**
 * Get subject performance analytics
 * GET /api/teachers/analytics/:subjectId
 * @access Teacher
 */
const getSubjectAnalytics = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;
  const teacher_id = req.user.id;

  // Verify teacher owns the subject
  const [subjects] = await pool.query(
    'SELECT * FROM subjects WHERE id = ? AND created_by = ?',
    [subjectId, teacher_id]
  );

  if (subjects.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found or you do not have permission'
    });
  }

  const subject = subjects[0];

  // Get total students
  const [studentCount] = await pool.query(
    'SELECT COUNT(*) as count FROM enrollments WHERE subject_id = ?',
    [subjectId]
  );

  // Get total lessons
  const [lessonCount] = await pool.query(
    'SELECT COUNT(*) as count FROM lessons WHERE subject_id = ? AND is_published = true',
    [subjectId]
  );

  // Get completion rate
  const [completionStats] = await pool.query(
    `SELECT 
       COUNT(DISTINCT sp.student_id) as students_with_progress,
       AVG(CASE 
         WHEN lesson_total.total > 0 
         THEN (completed_count.completed / lesson_total.total) * 100 
         ELSE 0 
       END) as avg_completion_rate
     FROM enrollments e
     LEFT JOIN (
       SELECT student_id, COUNT(*) as completed
       FROM student_progress sp
       JOIN lessons l ON sp.lesson_id = l.id
       WHERE l.subject_id = ? AND sp.is_completed = true
       GROUP BY student_id
     ) as completed_count ON e.student_id = completed_count.student_id
     CROSS JOIN (
       SELECT COUNT(*) as total FROM lessons WHERE subject_id = ? AND is_published = true
     ) as lesson_total
     WHERE e.subject_id = ?`,
    [subjectId, subjectId, subjectId]
  );

  // Get average quiz score
  const [quizStats] = await pool.query(
    `SELECT 
       AVG(CASE 
         WHEN qa.total_points > 0 THEN (qa.score / qa.total_points) * 100 
         ELSE NULL 
       END) as avg_quiz_score,
       COUNT(DISTINCT qa.id) as total_attempts
     FROM quizzes q
     JOIN lessons l ON q.lesson_id = l.id
     LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id AND qa.completed_at IS NOT NULL
     WHERE l.subject_id = ?`,
    [subjectId]
  );

  // Get top performers (top 5 students)
  const [topPerformers] = await pool.query(
    `SELECT 
       u.id,
       u.username,
       u.first_name,
       u.last_name,
       AVG(CASE 
         WHEN qa.total_points > 0 THEN (qa.score / qa.total_points) * 100 
         ELSE NULL 
       END) as average_score
     FROM enrollments e
     JOIN users u ON e.student_id = u.id
     LEFT JOIN quiz_attempts qa ON qa.student_id = u.id
     LEFT JOIN quizzes q ON qa.quiz_id = q.id
     LEFT JOIN lessons l ON q.lesson_id = l.id
     WHERE e.subject_id = ? AND l.subject_id = ? AND qa.completed_at IS NOT NULL
     GROUP BY u.id, u.username, u.first_name, u.last_name
     HAVING average_score IS NOT NULL
     ORDER BY average_score DESC
     LIMIT 5`,
    [subjectId, subjectId]
  );

  // Get struggling students (bottom 5 students)
  const [strugglingStudents] = await pool.query(
    `SELECT 
       u.id,
       u.username,
       u.first_name,
       u.last_name,
       AVG(CASE 
         WHEN qa.total_points > 0 THEN (qa.score / qa.total_points) * 100 
         ELSE NULL 
       END) as average_score
     FROM enrollments e
     JOIN users u ON e.student_id = u.id
     LEFT JOIN quiz_attempts qa ON qa.student_id = u.id
     LEFT JOIN quizzes q ON qa.quiz_id = q.id
     LEFT JOIN lessons l ON q.lesson_id = l.id
     WHERE e.subject_id = ? AND l.subject_id = ? AND qa.completed_at IS NOT NULL
     GROUP BY u.id, u.username, u.first_name, u.last_name
     HAVING average_score IS NOT NULL
     ORDER BY average_score ASC
     LIMIT 5`,
    [subjectId, subjectId]
  );

  res.json({
    success: true,
    data: {
      subject_name: subject.name,
      total_students: studentCount[0].count,
      total_lessons: lessonCount[0].count,
      completion_rate: completionStats[0].avg_completion_rate 
        ? Math.round(completionStats[0].avg_completion_rate)
        : 0,
      average_quiz_score: quizStats[0].avg_quiz_score 
        ? Math.round(quizStats[0].avg_quiz_score)
        : null,
      total_quiz_attempts: quizStats[0].total_attempts,
      top_performers: topPerformers.map(s => ({
        ...s,
        average_score: Math.round(s.average_score),
        student_name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.username
      })),
      struggling_students: strugglingStudents.map(s => ({
        ...s,
        average_score: Math.round(s.average_score),
        student_name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.username
      }))
    }
  });
});

/**
 * Get all student results for a specific quiz
 * GET /api/teachers/quiz-results/:quizId
 * @access Teacher
 */
const getQuizResults = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const teacher_id = req.user.id;

  // Verify teacher owns the quiz
  const [quizzes] = await pool.query(
    `SELECT q.*, s.created_by
     FROM quizzes q
     JOIN lessons l ON q.lesson_id = l.id
     JOIN subjects s ON l.subject_id = s.id
     WHERE q.id = ? AND s.created_by = ?`,
    [quizId, teacher_id]
  );

  if (quizzes.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Quiz not found or you do not have permission'
    });
  }

  const quiz = quizzes[0];

  // Get all student attempts
  const [attempts] = await pool.query(
    `SELECT 
       qa.*,
       u.username,
       u.first_name,
       u.last_name,
       u.email,
       CASE 
         WHEN qa.total_points > 0 THEN ROUND((qa.score / qa.total_points) * 100)
         ELSE 0
       END as percentage
     FROM quiz_attempts qa
     JOIN users u ON qa.student_id = u.id
     WHERE qa.quiz_id = ? AND qa.completed_at IS NOT NULL
     ORDER BY qa.completed_at DESC`,
    [quizId]
  );

  // Calculate statistics
  const totalAttempts = attempts.length;
  const avgScore = totalAttempts > 0
    ? attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / totalAttempts
    : 0;
  const passedCount = attempts.filter(a => a.percentage >= quiz.passing_score).length;

  res.json({
    success: true,
    data: {
      quiz: {
        id: quiz.id,
        title: quiz.title,
        passing_score: quiz.passing_score
      },
      statistics: {
        total_attempts: totalAttempts,
        average_score: Math.round(avgScore),
        passed: passedCount,
        failed: totalAttempts - passedCount,
        pass_rate: totalAttempts > 0 
          ? Math.round((passedCount / totalAttempts) * 100)
          : 0
      },
      attempts: attempts.map(a => ({
        ...a,
        student_name: `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.username
      }))
    }
  });
});

module.exports = {
  getTeacherDashboard,
  getTeacherSubjects,
  getEnrolledStudents,
  getSubjectAnalytics,
  getQuizResults
};
