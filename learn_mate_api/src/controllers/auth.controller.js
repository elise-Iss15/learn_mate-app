const bcrypt = require('bcrypt');
const { pool } = require('../config/database');
const { 
  generateTokens, 
  storeRefreshToken, 
  verifyRefreshToken,
  deleteRefreshToken,
  deleteAllUserTokens
} = require('../utils/jwt');
const { asyncHandler } = require('../middleware/errorHandler');

const register = asyncHandler(async (req, res) => {
  const {
    username,
    email,
    password,
    role = 'student',
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

  const user = users[0];

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user);
  
  // Store refresh token
  await storeRefreshToken(user.id, refreshToken);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        grade_level: user.grade_level,
        preferred_language: user.preferred_language
      },
      accessToken,
      refreshToken
    }
  });
});

/**
 * Login user
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const [users] = await pool.query(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );

  if (users.length === 0) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  const user = users[0];

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user);
  
  // Store refresh token
  await storeRefreshToken(user.id, refreshToken);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        grade_level: user.grade_level,
        preferred_language: user.preferred_language
      },
      accessToken,
      refreshToken
    }
  });
});

const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token is required'
    });
  }

  // Verify refresh token exists in database
  const isValid = await verifyRefreshToken(refreshToken);

  if (!isValid) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }

  const userId = req.user.id;

  // Fetch user details
  const [users] = await pool.query(
    'SELECT id, username, email, role, first_name, last_name FROM users WHERE id = ?',
    [userId]
  );

  if (users.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const user = users[0];

  const tokens = generateTokens(user);
  
  await deleteRefreshToken(refreshToken);
  
  await storeRefreshToken(user.id, tokens.refreshToken);

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    }
  });
});


const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    await deleteRefreshToken(refreshToken);
  } else if (req.user) {
    await deleteAllUserTokens(req.user.id);
  }

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [users] = await pool.query(
    'SELECT id, username, email, role, first_name, last_name, grade_level, preferred_language, created_at FROM users WHERE id = ?',
    [userId]
  );

  if (users.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: {
      user: users[0]
    }
  });
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser
};
