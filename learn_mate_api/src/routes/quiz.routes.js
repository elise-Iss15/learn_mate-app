const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quiz.controller');
const { quizValidation, idValidation, quizSubmissionValidation } = require('../utils/validators');
const { validate } = require('../middleware/validation');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { isTeacherOrAdmin, isStudent } = require('../middleware/roleCheck');
const { body } = require('express-validator');

/**
 * @route   GET /api/quizzes/:id
 * @desc    Get quiz with questions
 * @access  Public (with optional auth for attempts)
 */
router.get('/:id', optionalAuth, idValidation, validate, quizController.getQuizById);

/**
 * @route   POST /api/quizzes
 * @desc    Create new quiz
 * @access  Private (Teacher, Admin)
 */
router.post('/', authenticateToken, isTeacherOrAdmin, quizValidation, validate, quizController.createQuiz);

/**
 * @route   PUT /api/quizzes/:id
 * @desc    Update quiz
 * @access  Private (Teacher-owner, Admin)
 */
router.put('/:id', authenticateToken, isTeacherOrAdmin, [...idValidation, ...quizValidation], validate, quizController.updateQuiz);

/**
 * @route   DELETE /api/quizzes/:id
 * @desc    Delete quiz
 * @access  Private (Teacher-owner, Admin)
 */
router.delete('/:id', authenticateToken, isTeacherOrAdmin, idValidation, validate, quizController.deleteQuiz);

/**
 * @route   POST /api/quizzes/:id/start
 * @desc    Start a new quiz attempt
 * @access  Private (Student)
 */
router.post('/:id/start', authenticateToken, isStudent, idValidation, validate, quizController.startQuizAttempt);

/**
 * @route   POST /api/quizzes/:id/submit
 * @desc    Submit quiz answers
 * @access  Private (Student)
 */
router.post('/:id/submit', authenticateToken, isStudent, [
  ...idValidation,
  body('attempt_id').isInt({ min: 1 }).withMessage('Valid attempt ID is required'),
  ...quizSubmissionValidation
], validate, quizController.submitQuiz);

/**
 * @route   GET /api/quizzes/:id/attempts
 * @desc    Get student's quiz attempts
 * @access  Private (Student)
 */
router.get('/:id/attempts', authenticateToken, isStudent, idValidation, validate, quizController.getQuizAttempts);

module.exports = router;
