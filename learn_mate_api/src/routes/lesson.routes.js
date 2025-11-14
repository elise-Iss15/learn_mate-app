const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lesson.controller');
const { lessonValidation, idValidation, progressValidation } = require('../utils/validators');
const { validate } = require('../middleware/validation');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { isTeacherOrAdmin, isStudent } = require('../middleware/roleCheck');
const upload = require('../middleware/fileUpload');

/**
 * @route   GET /api/lessons/subject/:subjectId
 * @desc    Get all lessons for a subject
 * @access  Public
 */
router.get('/subject/:subjectId', lessonController.getLessonsBySubject);

/**
 * @route   GET /api/lessons/:id/download
 * @desc    Download lesson PDF file
 * @access  Public
 */
router.get('/:id/download', lessonController.downloadLessonFile);

/**
 * @route   GET /api/lessons/:id
 * @desc    Get specific lesson content
 * @access  Public (with optional auth for progress)
 */
router.get('/:id', optionalAuth, idValidation, validate, lessonController.getLessonById);

/**
 * @route   POST /api/lessons
 * @desc    Create new lesson with optional PDF upload
 * @access  Private (Teacher, Admin)
 */
router.post('/', authenticateToken, isTeacherOrAdmin, upload.single('file'), lessonValidation, validate, lessonController.createLesson);

/**
 * @route   PUT /api/lessons/:id
 * @desc    Update lesson with optional PDF upload
 * @access  Private (Teacher-owner, Admin)
 */
router.put('/:id', authenticateToken, isTeacherOrAdmin, upload.single('file'), [...idValidation, ...lessonValidation], validate, lessonController.updateLesson);

/**
 * @route   DELETE /api/lessons/:id
 * @desc    Delete lesson
 * @access  Private (Teacher-owner, Admin)
 */
router.delete('/:id', authenticateToken, isTeacherOrAdmin, idValidation, validate, lessonController.deleteLesson);

/**
 * @route   POST /api/lessons/:id/progress
 * @desc    Mark lesson as viewed/completed
 * @access  Private (Student)
 */
router.post('/:id/progress', authenticateToken, isStudent, [...idValidation, ...progressValidation], validate, lessonController.updateLessonProgress);

module.exports = router;
