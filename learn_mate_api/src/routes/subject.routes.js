const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subject.controller');
const { subjectValidation, idValidation, paginationValidation } = require('../utils/validators');
const { validate } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const { isTeacherOrAdmin, isAdmin } = require('../middleware/roleCheck');

/**
 * @route   GET /api/subjects
 * @desc    Get all subjects (with optional grade_level filter)
 * @access  Public
 */
router.get('/', paginationValidation, validate, subjectController.getAllSubjects);

/**
 * @route   GET /api/subjects/my-subjects
 * @desc    Get subjects created by current teacher
 * @access  Private (Teacher)
 */
router.get('/my-subjects', authenticateToken, isTeacherOrAdmin, paginationValidation, validate, subjectController.getMySubjects);

/**
 * @route   GET /api/subjects/:id
 * @desc    Get specific subject with lessons
 * @access  Public
 */
router.get('/:id', idValidation, validate, subjectController.getSubjectById);

/**
 * @route   POST /api/subjects
 * @desc    Create new subject
 * @access  Private (Teacher, Admin)
 */
router.post('/', authenticateToken, isTeacherOrAdmin, subjectValidation, validate, subjectController.createSubject);

/**
 * @route   PUT /api/subjects/:id
 * @desc    Update subject
 * @access  Private (Teacher-owner, Admin)
 */
router.put('/:id', authenticateToken, isTeacherOrAdmin, [...idValidation, ...subjectValidation], validate, subjectController.updateSubject);

/**
 * @route   DELETE /api/subjects/:id
 * @desc    Delete subject
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticateToken, isAdmin, idValidation, validate, subjectController.deleteSubject);

module.exports = router;
