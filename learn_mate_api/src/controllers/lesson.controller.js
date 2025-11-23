const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { uploadFile, deleteFile, getDownloadUrl } = require('../config/dropbox');
const fs = require('fs').promises;

/**
 * Get lesson by ID
 * GET /api/lessons/:id
 */
const getLessonById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user ? req.user.id : null;

  // Get lesson details
  const [lessons] = await pool.query(
    `SELECT l.*, 
            s.name as subject_name,
            s.grade_level,
            u.username as creator_username
     FROM lessons l
     JOIN subjects s ON l.subject_id = s.id
     LEFT JOIN users u ON l.created_by = u.id
     WHERE l.id = ?`,
    [id]
  );

  if (lessons.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Lesson not found'
    });
  }

  const lesson = lessons[0];

  // Get quizzes for this lesson
  const [quizzes] = await pool.query(
    `SELECT id, title, description, time_limit, passing_score, max_attempts
     FROM quizzes
     WHERE lesson_id = ?
     ORDER BY created_at ASC`,
    [id]
  );

  lesson.quizzes = quizzes;

  // If user is authenticated and is a student, get their progress
  if (userId && req.user.role === 'student') {
    const [progress] = await pool.query(
      `SELECT is_completed, time_spent, last_accessed
       FROM student_progress
       WHERE student_id = ? AND lesson_id = ?`,
      [userId, id]
    );

    lesson.user_progress = progress.length > 0 ? progress[0] : null;
  }

  // If lesson has a file, trigger download by setting appropriate headers
  if (lesson.content_file_url) {
    lesson.has_file = true;
    lesson.file_download_url = `/api/lessons/${id}/download`;
  }

  res.json({
    success: true,
    data: { lesson }
  });
});

/**
 * Create new lesson
 * POST /api/lessons
 * @access Teacher, Admin
 */
const createLesson = asyncHandler(async (req, res) => {
  const {
    subject_id,
    title,
    content,
    order_number,
    language = 'en',
    is_published = true
  } = req.body;
  const created_by = req.user.id;

  const [subjects] = await pool.query(
    'SELECT id, created_by FROM subjects WHERE id = ?',
    [subject_id]
  );

  if (subjects.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found'
    });
  }

  if (req.user.role !== 'admin' && subjects[0].created_by !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'You can only create lessons for your own subjects'
    });
  }

  let fileData = null;
  
  if (req.file) {
    try {
      fileData = await uploadFile(req.file.path, '/learnmate/lessons', req.file.originalname);
      
      await fs.unlink(req.file.path);
    } catch (error) {
      if (req.file && req.file.path) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  const query = `
    INSERT INTO lessons (subject_id, title, content, content_file_url, content_file_public_id, 
                        content_file_name, order_number, language, created_by, is_published)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await pool.query(query, [
    subject_id,
    title,
    content || null,
    fileData ? fileData.url : null,
    fileData ? fileData.path : null,
    req.file ? req.file.originalname : null,
    order_number || null,
    language,
    created_by,
    is_published
  ]);

  const [lessons] = await pool.query(
    'SELECT * FROM lessons WHERE id = ?',
    [result.insertId]
  );

  res.status(201).json({
    success: true,
    message: 'Lesson created successfully',
    data: { lesson: lessons[0] }
  });
});

/**
 * Update lesson
 * PUT /api/lessons/:id
 * @access Teacher (owner), Admin
 */
const updateLesson = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, content, order_number, language, is_published } = req.body;

  // Get lesson and subject info
  const [lessons] = await pool.query(
    `SELECT l.*, s.created_by as subject_creator
     FROM lessons l
     JOIN subjects s ON l.subject_id = s.id
     WHERE l.id = ?`,
    [id]
  );

  if (lessons.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Lesson not found'
    });
  }

  const lesson = lessons[0];

  // Check if user is owner or admin
  if (req.user.role !== 'admin' && lesson.subject_creator !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'You can only update lessons in your own subjects'
    });
  }

  let fileData = null;
  
  // Handle file upload if present
  if (req.file) {
    try {
      // Delete old file from Dropbox if exists
      if (lesson.content_file_public_id) {
        await deleteFile(lesson.content_file_public_id);
      }
      
      fileData = await uploadFile(req.file.path, '/learnmate/lessons', req.file.originalname);
      
      // Delete temporary file
      await fs.unlink(req.file.path);
    } catch (error) {
      // Clean up temp file on error
      if (req.file && req.file.path) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  const query = `
    UPDATE lessons
    SET title = ?, 
        content = ?, 
        content_file_url = ?,
        content_file_public_id = ?,
        content_file_name = ?,
        order_number = ?, 
        language = ?, 
        is_published = ?
    WHERE id = ?
  `;

  await pool.query(query, [
    title || lesson.title,
    content !== undefined ? content : lesson.content,
    fileData ? fileData.url : lesson.content_file_url,
    fileData ? fileData.path : lesson.content_file_public_id,
    req.file ? req.file.originalname : lesson.content_file_name,
    order_number !== undefined ? order_number : lesson.order_number,
    language || lesson.language,
    is_published !== undefined ? is_published : lesson.is_published,
    id
  ]);

  // Fetch updated lesson
  const [updatedLessons] = await pool.query(
    'SELECT * FROM lessons WHERE id = ?',
    [id]
  );

  res.json({
    success: true,
    message: 'Lesson updated successfully',
    data: { lesson: updatedLessons[0] }
  });
});

/**
 * Delete lesson
 * DELETE /api/lessons/:id
 * @access Teacher (owner), Admin
 */
const deleteLesson = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [lessons] = await pool.query(
    `SELECT l.*, s.created_by as subject_creator
     FROM lessons l
     JOIN subjects s ON l.subject_id = s.id
     WHERE l.id = ?`,
    [id]
  );

  if (lessons.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Lesson not found'
    });
  }

  const lesson = lessons[0];

  if (req.user.role !== 'admin' && lesson.subject_creator !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'You can only delete lessons in your own subjects'
    });
  }

  if (lesson.content_file_public_id) {
    try {
      await deleteFile(lesson.content_file_public_id);
    } catch (error) {
      console.error('Failed to delete file from Dropbox:', error);
    }
  }

  await pool.query('DELETE FROM lessons WHERE id = ?', [id]);

  res.json({
    success: true,
    message: 'Lesson deleted successfully'
  });
});

/**
 * Mark lesson progress
 * POST /api/lessons/:id/progress
 * @access Student
 */
const updateLessonProgress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { is_completed, time_spent } = req.body;
  const student_id = req.user.id;

  const [lessons] = await pool.query(
    'SELECT id FROM lessons WHERE id = ? AND is_published = true',
    [id]
  );

  if (lessons.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Lesson not found or not published'
    });
  }

  const [existingProgress] = await pool.query(
    'SELECT * FROM student_progress WHERE student_id = ? AND lesson_id = ?',
    [student_id, id]
  );

  if (existingProgress.length > 0) {
    const currentProgress = existingProgress[0];
    const query = `
      UPDATE student_progress
      SET is_completed = ?, time_spent = ?, last_accessed = CURRENT_TIMESTAMP
      WHERE student_id = ? AND lesson_id = ?
    `;

    await pool.query(query, [
      is_completed !== undefined ? is_completed : currentProgress.is_completed,
      time_spent !== undefined ? time_spent : currentProgress.time_spent,
      student_id,
      id
    ]);
  } else {
    const query = `
      INSERT INTO student_progress (student_id, lesson_id, is_completed, time_spent)
      VALUES (?, ?, ?, ?)
    `;

    await pool.query(query, [
      student_id,
      id,
      is_completed || false,
      time_spent || 0
    ]);
  }

  const [progress] = await pool.query(
    'SELECT * FROM student_progress WHERE student_id = ? AND lesson_id = ?',
    [student_id, id]
  );

  res.json({
    success: true,
    message: 'Progress updated successfully',
    data: { progress: progress[0] }
  });
});

/**
 * Get lessons by subject
 * GET /api/lessons/subject/:subjectId
 */
const getLessonsBySubject = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;

  const [lessons] = await pool.query(
    `SELECT l.*,
            (SELECT COUNT(*) FROM quizzes WHERE lesson_id = l.id) as quiz_count
     FROM lessons l
     WHERE l.subject_id = ? AND l.is_published = true
     ORDER BY l.order_number ASC, l.created_at ASC`,
    [subjectId]
  );

  res.json({
    success: true,
    data: { lessons }
  });
});

/**
 * Download lesson file
 * GET /api/lessons/:id/download
 */
const downloadLessonFile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [lessons] = await pool.query(
    'SELECT content_file_url, content_file_name, content_file_public_id FROM lessons WHERE id = ? AND is_published = true',
    [id]
  );

  if (lessons.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Lesson not found or not published'
    });
  }

  const lesson = lessons[0];

  if (!lesson.content_file_url) {
    return res.status(404).json({
      success: false,
      message: 'No file attached to this lesson'
    });
  }

  res.redirect(lesson.content_file_url);
});

module.exports = {
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
  updateLessonProgress,
  getLessonsBySubject,
  downloadLessonFile
};
