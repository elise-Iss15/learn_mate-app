const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Get all subjects with optional filtering
 * GET /api/subjects
 * Query params: grade_level, page, limit
 */
const getAllSubjects = asyncHandler(async (req, res) => {
  const { grade_level, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT s.*, 
           u.username as creator_username,
           u.first_name as creator_first_name,
           u.last_name as creator_last_name,
           (SELECT COUNT(*) FROM lessons WHERE subject_id = s.id AND is_published = true) as lesson_count
    FROM subjects s
    LEFT JOIN users u ON s.created_by = u.id
  `;

  const params = [];

  if (grade_level) {
    query += ' WHERE s.grade_level = ?';
    params.push(grade_level);
  }

  query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const [subjects] = await pool.query(query, params);

  // Get total count
  let countQuery = 'SELECT COUNT(*) as total FROM subjects';
  if (grade_level) {
    countQuery += ' WHERE grade_level = ?';
  }

  const [countResult] = await pool.query(
    countQuery,
    grade_level ? [grade_level] : []
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
 * Get subject by ID with lessons
 * GET /api/subjects/:id
 */
const getSubjectById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get subject details
  const [subjects] = await pool.query(
    `SELECT s.*, 
            u.username as creator_username,
            u.first_name as creator_first_name,
            u.last_name as creator_last_name
     FROM subjects s
     LEFT JOIN users u ON s.created_by = u.id
     WHERE s.id = ?`,
    [id]
  );

  if (subjects.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found'
    });
  }

  const subject = subjects[0];

  // Get lessons for this subject
  const [lessons] = await pool.query(
    `SELECT l.*,
            (SELECT COUNT(*) FROM quizzes WHERE lesson_id = l.id) as quiz_count
     FROM lessons l
     WHERE l.subject_id = ? AND l.is_published = true
     ORDER BY l.order_number ASC, l.created_at ASC`,
    [id]
  );

  subject.lessons = lessons;

  res.json({
    success: true,
    data: { subject }
  });
});

/**
 * Create new subject
 * POST /api/subjects
 * @access Teacher, Admin
 */
const createSubject = asyncHandler(async (req, res) => {
  const { name, description, grade_level } = req.body;
  const created_by = req.user.id;

  const query = `
    INSERT INTO subjects (name, description, grade_level, created_by)
    VALUES (?, ?, ?, ?)
  `;

  const [result] = await pool.query(query, [
    name,
    description || null,
    grade_level,
    created_by
  ]);

  // Fetch created subject
  const [subjects] = await pool.query(
    'SELECT * FROM subjects WHERE id = ?',
    [result.insertId]
  );

  res.status(201).json({
    success: true,
    message: 'Subject created successfully',
    data: { subject: subjects[0] }
  });
});

/**
 * Update subject
 * PUT /api/subjects/:id
 * @access Teacher (owner), Admin
 */
const updateSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, grade_level } = req.body;

  // Check if subject exists
  const [subjects] = await pool.query(
    'SELECT * FROM subjects WHERE id = ?',
    [id]
  );

  if (subjects.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found'
    });
  }

  const subject = subjects[0];

  // Check if user is owner or admin
  if (req.user.role !== 'admin' && subject.created_by !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'You can only update your own subjects'
    });
  }

  const query = `
    UPDATE subjects
    SET name = ?, description = ?, grade_level = ?
    WHERE id = ?
  `;

  await pool.query(query, [
    name || subject.name,
    description !== undefined ? description : subject.description,
    grade_level || subject.grade_level,
    id
  ]);

  // Fetch updated subject
  const [updatedSubjects] = await pool.query(
    'SELECT * FROM subjects WHERE id = ?',
    [id]
  );

  res.json({
    success: true,
    message: 'Subject updated successfully',
    data: { subject: updatedSubjects[0] }
  });
});

/**
 * Delete subject
 * DELETE /api/subjects/:id
 * @access Admin only
 */
const deleteSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if subject exists
  const [subjects] = await pool.query(
    'SELECT * FROM subjects WHERE id = ?',
    [id]
  );

  if (subjects.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found'
    });
  }

  // Delete subject (cascades to lessons, quizzes, etc.)
  await pool.query('DELETE FROM subjects WHERE id = ?', [id]);

  res.json({
    success: true,
    message: 'Subject deleted successfully'
  });
});

/**
 * Get subjects created by current teacher
 * GET /api/subjects/my-subjects
 * @access Teacher
 */
const getMySubjects = asyncHandler(async (req, res) => {
  const teacherId = req.user.id;
  const isAdmin = req.user.role === 'admin';
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const whereClause = isAdmin ? '' : 'WHERE s.created_by = ?';
  const whereParams = isAdmin ? [] : [teacherId];

  const query = `
    SELECT s.*,
           (SELECT COUNT(*) FROM lessons WHERE subject_id = s.id) as lesson_count,
           (SELECT COUNT(DISTINCT e.student_id) FROM enrollments e WHERE e.subject_id = s.id) as enrolled_students
    FROM subjects s
    ${whereClause}
    ORDER BY s.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const [subjects] = await pool.query(query, [
    ...whereParams,
    parseInt(limit),
    parseInt(offset)
  ]);

  const [countResult] = await pool.query(
    `SELECT COUNT(*) as total FROM subjects ${whereClause}`,
    whereParams
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

module.exports = {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  getMySubjects
};
