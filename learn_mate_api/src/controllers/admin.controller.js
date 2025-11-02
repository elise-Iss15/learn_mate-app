const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const bcrypt = require('bcrypt');

const getAllUsers = asyncHandler(async (req, res) => {
  const { role, grade_level, page = 1, limit = 20, search } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT id, username, email, role, first_name, last_name, grade_level, preferred_language, created_at FROM users WHERE 1=1';
  const params = [];

  if (role) {
    query += ' AND role = ?';
    params.push(role);
  }

  if (grade_level) {
    query += ' AND grade_level = ?';
    params.push(grade_level);
  }

  if (search) {
    query += ' AND (username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const [users] = await pool.query(query, params);

  // Get total count
  let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
  const countParams = [];

  if (role) {
    countQuery += ' AND role = ?';
    countParams.push(role);
  }

  if (grade_level) {
    countQuery += ' AND grade_level = ?';
    countParams.push(grade_level);
  }

  if (search) {
    countQuery += ' AND (username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
    const searchTerm = `%${search}%`;
    countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  const [countResult] = await pool.query(countQuery, countParams);
  const total = countResult[0].total;

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [users] = await pool.query(
    'SELECT id, username, email, role, first_name, last_name, grade_level, preferred_language, created_at, updated_at FROM users WHERE id = ?',
    [id]
  );

  if (users.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const user = users[0];

  // Get additional stats based on role
  if (user.role === 'student') {
    const [enrollmentCount] = await pool.query(
      'SELECT COUNT(*) as count FROM enrollments WHERE student_id = ?',
      [id]
    );

    const [completedLessons] = await pool.query(
      'SELECT COUNT(*) as count FROM student_progress WHERE student_id = ? AND is_completed = true',
      [id]
    );

    const [quizAttempts] = await pool.query(
      'SELECT COUNT(*) as count FROM quiz_attempts WHERE student_id = ? AND completed_at IS NOT NULL',
      [id]
    );

    user.stats = {
      enrolled_subjects: enrollmentCount[0].count,
      completed_lessons: completedLessons[0].count,
      quiz_attempts: quizAttempts[0].count
    };
  } else if (user.role === 'teacher') {
    const [subjectCount] = await pool.query(
      'SELECT COUNT(*) as count FROM subjects WHERE created_by = ?',
      [id]
    );

    const [lessonCount] = await pool.query(
      'SELECT COUNT(*) as count FROM lessons WHERE created_by = ?',
      [id]
    );

    const [quizCount] = await pool.query(
      'SELECT COUNT(*) as count FROM quizzes WHERE created_by = ?',
      [id]
    );

    user.stats = {
      subjects_created: subjectCount[0].count,
      lessons_created: lessonCount[0].count,
      quizzes_created: quizCount[0].count
    };
  }

  res.json({
    success: true,
    data: { user }
  });
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['student', 'teacher', 'admin'].includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role. Must be student, teacher, or admin'
    });
  }

  // Check if user exists
  const [users] = await pool.query(
    'SELECT * FROM users WHERE id = ?',
    [id]
  );

  if (users.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Prevent admin from changing their own role
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({
      success: false,
      message: 'You cannot change your own role'
    });
  }

  // Update role
  await pool.query(
    'UPDATE users SET role = ? WHERE id = ?',
    [role, id]
  );

  res.json({
    success: true,
    message: 'User role updated successfully',
    data: {
      user_id: parseInt(id),
      new_role: role
    }
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if user exists
  const [users] = await pool.query(
    'SELECT * FROM users WHERE id = ?',
    [id]
  );

  if (users.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Prevent admin from deleting themselves
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({
      success: false,
      message: 'You cannot delete your own account'
    });
  }

  // Delete user (cascades to related records)
  await pool.query('DELETE FROM users WHERE id = ?', [id]);

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

const getPlatformAnalytics = asyncHandler(async (req, res) => {
  // Get user counts by role
  const [userCounts] = await pool.query(
    `SELECT 
       role,
       COUNT(*) as count
     FROM users
     GROUP BY role`
  );

  // Get total subjects, lessons, quizzes
  const [contentCounts] = await pool.query(
    `SELECT 
       (SELECT COUNT(*) FROM subjects) as total_subjects,
       (SELECT COUNT(*) FROM lessons) as total_lessons,
       (SELECT COUNT(*) FROM quizzes) as total_quizzes,
       (SELECT COUNT(*) FROM enrollments) as total_enrollments`
  );

  // Get quiz statistics
  const [quizStats] = await pool.query(
    `SELECT 
       COUNT(*) as total_attempts,
       AVG(CASE WHEN total_points > 0 THEN (score / total_points) * 100 ELSE NULL END) as avg_score
     FROM quiz_attempts
     WHERE completed_at IS NOT NULL`
  );

  // Get recent activity (last 7 days)
  const [recentActivity] = await pool.query(
    `SELECT 
       DATE(created_at) as date,
       COUNT(*) as new_users
     FROM users
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
     GROUP BY DATE(created_at)
     ORDER BY date DESC`
  );

  // Get most popular subjects
  const [popularSubjects] = await pool.query(
    `SELECT 
       s.id,
       s.name,
       s.grade_level,
       COUNT(e.id) as enrollment_count
     FROM subjects s
     LEFT JOIN enrollments e ON e.subject_id = s.id
     GROUP BY s.id, s.name, s.grade_level
     ORDER BY enrollment_count DESC
     LIMIT 10`
  );

  // Get active students (students with activity in last 7 days)
  const [activeStudents] = await pool.query(
    `SELECT COUNT(DISTINCT student_id) as count
     FROM (
       SELECT student_id FROM student_progress WHERE last_accessed >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       UNION
       SELECT student_id FROM quiz_attempts WHERE started_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
     ) as active`
  );

  res.json({
    success: true,
    data: {
      user_statistics: {
        total_users: userCounts.reduce((sum, role) => sum + role.count, 0),
        by_role: userCounts,
        active_students_7days: activeStudents[0].count
      },
      content_statistics: {
        total_subjects: contentCounts[0].total_subjects,
        total_lessons: contentCounts[0].total_lessons,
        total_quizzes: contentCounts[0].total_quizzes,
        total_enrollments: contentCounts[0].total_enrollments
      },
      quiz_statistics: {
        total_attempts: quizStats[0].total_attempts,
        average_score: quizStats[0].avg_score ? Math.round(quizStats[0].avg_score) : 0
      },
      recent_activity: recentActivity,
      popular_subjects: popularSubjects
    }
  });
});

const createUser = asyncHandler(async (req, res) => {
  const {
    username,
    email,
    password,
    role,
    first_name,
    last_name,
    grade_level,
    preferred_language = 'en'
  } = req.body;

  // Check if user already exists
  const [existingUsers] = await pool.query(
    'SELECT id FROM users WHERE email = ? OR username = ?',
    [email, username]
  );

  if (existingUsers.length > 0) {
    return res.status(409).json({
      success: false,
      message: 'User with this email or username already exists'
    });
  }

  // Hash password
  const saltRounds = 10;
  const password_hash = await bcrypt.hash(password, saltRounds);

  // Insert new user
  const query = `
    INSERT INTO users (username, email, password_hash, role, first_name, last_name, grade_level, preferred_language)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await pool.query(query, [
    username,
    email,
    password_hash,
    role,
    first_name || null,
    last_name || null,
    grade_level || null,
    preferred_language
  ]);

  // Fetch created user
  const [users] = await pool.query(
    'SELECT id, username, email, role, first_name, last_name, grade_level, preferred_language, created_at FROM users WHERE id = ?',
    [result.insertId]
  );

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: { user: users[0] }
  });
});

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getPlatformAnalytics,
  createUser
};
