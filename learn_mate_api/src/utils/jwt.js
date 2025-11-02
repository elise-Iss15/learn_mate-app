const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

/**
 * Generate access token
 * @param {Object} user - User object with id, email, username, role
 * @returns {string} JWT access token
 */
const generateAccessToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m'
  });
};

/**
 * Generate refresh token
 * @param {Object} user - User object with id
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (user) => {
  const payload = {
    id: user.id,
    type: 'refresh'
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  });
};

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User object
 * @returns {Object} Object containing accessToken and refreshToken
 */
const generateTokens = (user) => {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user)
  };
};

/**
 * Store refresh token in database
 * @param {number} userId - User ID
 * @param {string} token - Refresh token
 */
const storeRefreshToken = async (userId, token) => {
  try {
    // Decode token to get expiry date
    const decoded = jwt.decode(token);
    const expiresAt = new Date(decoded.exp * 1000);

    const query = `
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `;

    await pool.query(query, [userId, token, expiresAt]);
    return true;
  } catch (error) {
    console.error('Error storing refresh token:', error);
    return false;
  }
};

/**
 * Verify refresh token exists in database
 * @param {string} token - Refresh token to verify
 * @returns {boolean} True if token exists and is valid
 */
const verifyRefreshToken = async (token) => {
  try {
    const query = `
      SELECT * FROM refresh_tokens
      WHERE token = ? AND expires_at > NOW()
    `;

    const [rows] = await pool.query(query, [token]);
    return rows.length > 0;
  } catch (error) {
    console.error('Error verifying refresh token:', error);
    return false;
  }
};

/**
 * Delete refresh token from database (logout)
 * @param {string} token - Refresh token to delete
 */
const deleteRefreshToken = async (token) => {
  try {
    const query = 'DELETE FROM refresh_tokens WHERE token = ?';
    await pool.query(query, [token]);
    return true;
  } catch (error) {
    console.error('Error deleting refresh token:', error);
    return false;
  }
};

/**
 * Delete all refresh tokens for a user
 * @param {number} userId - User ID
 */
const deleteAllUserTokens = async (userId) => {
  try {
    const query = 'DELETE FROM refresh_tokens WHERE user_id = ?';
    await pool.query(query, [userId]);
    return true;
  } catch (error) {
    console.error('Error deleting user tokens:', error);
    return false;
  }
};

const cleanupExpiredTokens = async () => {
  try {
    const query = 'DELETE FROM refresh_tokens WHERE expires_at < NOW()';
    const [result] = await pool.query(query);
    console.log(`Cleaned up ${result.affectedRows} expired tokens`);
    return true;
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
    return false;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  storeRefreshToken,
  verifyRefreshToken,
  deleteRefreshToken,
  deleteAllUserTokens,
  cleanupExpiredTokens
};
