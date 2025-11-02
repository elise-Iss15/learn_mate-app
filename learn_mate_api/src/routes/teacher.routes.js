const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacher.controller');
const { paginationValidation } = require('../utils/validators');
const { validate } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const { isTeacher, isTeacherOrAdmin } = require('../middleware/roleCheck');

/**
 * @route   GET /api/teachers/dashboard
 * @desc    Get teacher dashboard analytics
 * @access  Private (Teacher, Admin)
 */
router.get('/dashboard', authenticateToken, isTeacherOrAdmin, teacherController.getTeacherDashboard);

/**
 * @route   GET /api/teachers/subjects
 * @desc    Get subjects created by teacher
 * @access  Private (Teacher, Admin)
 */
router.get('/subjects', authenticateToken, isTeacherOrAdmin, paginationValidation, validate, teacherController.getTeacherSubjects);

/**
 * @route   GET /api/teachers/students/:subjectId
 * @desc    Get enrolled students for subject
 * @access  Private (Teacher, Admin)
 */
router.get('/students/:subjectId', authenticateToken, isTeacherOrAdmin, teacherController.getEnrolledStudents);

/**
 * @route   GET /api/teachers/analytics/:subjectId
 * @desc    Get subject performance analytics
 * @access  Private (Teacher, Admin)
 */
router.get('/analytics/:subjectId', authenticateToken, isTeacherOrAdmin, teacherController.getSubjectAnalytics);

/**
 * @route   GET /api/teachers/quiz-results/:quizId
 * @desc    Get all student results for quiz
 * @access  Private (Teacher, Admin)
 */
router.get('/quiz-results/:quizId', authenticateToken, isTeacherOrAdmin, teacherController.getQuizResults);

module.exports = router;
