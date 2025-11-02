const { body, param, query } = require('express-validator');

/**
 * User Registration Validation
 */
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Username must be between 3 and 100 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('role')
    .optional()
    .isIn(['student', 'teacher', 'admin'])
    .withMessage('Role must be either student or teacher'),
  
  body('first_name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('First name must not exceed 100 characters'),
  
  body('last_name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Last name must not exceed 100 characters'),
  
  body('grade_level')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Grade level must be between 1 and 12'),
  
  body('preferred_language')
    .optional()
    .isIn(['en', 'ar'])
    .withMessage('Preferred language must be either en or ar')
];

/**
 * User Login Validation
 */
const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Subject Creation/Update Validation
 */
const subjectValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Subject name is required')
    .isLength({ max: 255 })
    .withMessage('Subject name must not exceed 255 characters'),
  
  body('description')
    .optional()
    .trim(),
  
  body('grade_level')
    .isInt({ min: 1, max: 12 })
    .withMessage('Grade level must be between 1 and 12')
];

/**
 * Lesson Creation/Update Validation
 */
const lessonValidation = [
  body('subject_id')
    .isInt({ min: 1 })
    .withMessage('Valid subject ID is required'),
  
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Lesson title is required')
    .isLength({ max: 255 })
    .withMessage('Lesson title must not exceed 255 characters'),
  
  body('content')
    .optional()
    .trim(),
  
  body('order_number')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Order number must be a positive integer'),
  
  body('language')
    .optional()
    .isIn(['en', 'ar'])
    .withMessage('Language must be either en or ar'),
  
  body('is_published')
    .optional()
    .isBoolean()
    .withMessage('is_published must be a boolean')
];

/**
 * Quiz Creation/Update Validation
 */
const quizValidation = [
  body('lesson_id')
    .isInt({ min: 1 })
    .withMessage('Valid lesson ID is required'),
  
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Quiz title is required')
    .isLength({ max: 255 })
    .withMessage('Quiz title must not exceed 255 characters'),
  
  body('description')
    .optional()
    .trim(),
  
  body('time_limit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Time limit must be a positive integer'),
  
  body('passing_score')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Passing score must be between 0 and 100'),
  
  body('max_attempts')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max attempts must be a positive integer')
];

/**
 * Question Creation Validation
 */
const questionValidation = [
  body('quiz_id')
    .isInt({ min: 1 })
    .withMessage('Valid quiz ID is required'),
  
  body('question_text')
    .trim()
    .notEmpty()
    .withMessage('Question text is required'),
  
  body('question_type')
    .isIn(['multiple_choice', 'true_false', 'short_answer'])
    .withMessage('Question type must be multiple_choice, true_false, or short_answer'),
  
  body('correct_answer')
    .optional()
    .trim(),
  
  body('points')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Points must be a positive integer'),
  
  body('order_number')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Order number must be a positive integer'),
  
  body('options')
    .optional()
    .isArray()
    .withMessage('Options must be an array')
];

/**
 * Quiz Submission Validation
 */
const quizSubmissionValidation = [
  body('answers')
    .isArray({ min: 1 })
    .withMessage('Answers array is required and must not be empty'),
  
  body('answers.*.question_id')
    .isInt({ min: 1 })
    .withMessage('Valid question ID is required for each answer'),
  
  body('answers.*.student_answer')
    .notEmpty()
    .withMessage('Student answer is required for each question')
];

/**
 * Progress Update Validation
 */
const progressValidation = [
  body('is_completed')
    .optional()
    .isBoolean()
    .withMessage('is_completed must be a boolean'),
  
  body('time_spent')
    .optional()
    .isInt({ min: 0 })
    .withMessage('time_spent must be a non-negative integer')
];

/**
 * Pagination Validation
 */
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

/**
 * ID Parameter Validation
 */
const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid ID is required')
];

module.exports = {
  registerValidation,
  loginValidation,
  subjectValidation,
  lessonValidation,
  quizValidation,
  questionValidation,
  quizSubmissionValidation,
  progressValidation,
  paginationValidation,
  idValidation
};
