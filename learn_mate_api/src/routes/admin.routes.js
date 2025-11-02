const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { registerValidation, paginationValidation, idValidation } = require('../utils/validators');
const { validate } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');
const { body, query } = require('express-validator');

/**
 * @route   GET /api/admin/analytics
 * @desc    Platform-wide analytics
 * @access  Private (Admin)
 */
router.get('/analytics', authenticateToken, isAdmin, adminController.getPlatformAnalytics);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filters
 * @access  Private (Admin)
 */
router.get('/users', authenticateToken, isAdmin, [
  ...paginationValidation,
  query('role').optional().isIn(['student', 'teacher', 'admin']).withMessage('Invalid role'),
  query('grade_level').optional().isInt({ min: 1, max: 12 }).withMessage('Invalid grade level'),
  query('search').optional().trim()
], validate, adminController.getAllUsers);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user by ID with stats
 * @access  Private (Admin)
 */
router.get('/users/:id', authenticateToken, isAdmin, idValidation, validate, adminController.getUserById);

/**
 * @route   POST /api/admin/users
 * @desc    Create new user (by admin)
 * @access  Private (Admin)
 */
router.post('/users', authenticateToken, isAdmin, registerValidation, validate, adminController.createUser);

/**
 * @route   PUT /api/admin/users/:id/role
 * @desc    Update user role
 * @access  Private (Admin)
 */
router.put('/users/:id/role', authenticateToken, isAdmin, [
  ...idValidation,
  body('role').isIn(['student', 'teacher', 'admin']).withMessage('Invalid role')
], validate, adminController.updateUserRole);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user
 * @access  Private (Admin)
 */
router.delete('/users/:id', authenticateToken, isAdmin, idValidation, validate, adminController.deleteUser);

module.exports = router;
