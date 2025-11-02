const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { paginationValidation } = require('../utils/validators');
const { validate } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const { isStudent } = require('../middleware/roleCheck');

/**
 * @route   GET /api/students/dashboard
 * @desc    Get student dashboard data
 * @access  Private (Student)
 */
router.get('/dashboard', authenticateToken, isStudent, studentController.getStudentDashboard);

/**
 * @route   GET /api/students/progress
 * @desc    Get overall progress stats
 * @access  Private (Student)
 */
router.get('/progress', authenticateToken, isStudent, studentController.getStudentProgress);

/**
 * @route   GET /api/students/subjects
 * @desc    Get enrolled subjects
 * @access  Private (Student)
 */
router.get('/subjects', authenticateToken, isStudent, paginationValidation, validate, studentController.getEnrolledSubjects);

/**
 * @route   GET /api/students/quiz-history
 * @desc    Get quiz attempt history
 * @access  Private (Student)
 */
router.get('/quiz-history', authenticateToken, isStudent, paginationValidation, validate, studentController.getQuizHistory);

/**
 * @route   POST /api/students/enroll/:subjectId
 * @desc    Enroll in a subject
 * @access  Private (Student)
 */
router.post('/enroll/:subjectId', authenticateToken, isStudent, studentController.enrollInSubject);

/**
 * @route   DELETE /api/students/enroll/:subjectId
 * @desc    Unenroll from subject
 * @access  Private (Student)
 */
router.delete('/enroll/:subjectId', authenticateToken, isStudent, studentController.unenrollFromSubject);

module.exports = router;
