const express = require('express');
const pool = require('../config/database');
const { validateRegister } = require('../utils/validation');
const { authLimiter } = require('../middleware/rateLimiter');
const { asyncHandler } = require('../middleware/errorHandler');
const { logSecurityEvent, LOG_LEVELS } = require('../middleware/securityLogger');

const router = express.Router();

// Apply strict rate limiting to auth endpoints
router.use(authLimiter);

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (creates user profile in database)
 * @access  Public (Firebase handles authentication)
 * @note    This endpoint is called after Firebase creates the user
 */
router.post('/register', validateRegister, asyncHandler(async (req, res) => {
  const { uid, email, name } = req.body;

  if (!uid) {
    logSecurityEvent(req, 'REGISTRATION_FAILED', { reason: 'Missing UID' }, LOG_LEVELS.WARNING);
    return res.status(400).json({ message: 'UID is required' });
  }

  // Check if user already exists
  const existingUser = await pool.query(
    'SELECT id FROM users WHERE uid = $1 OR email = $2',
    [uid, email]
  );

  if (existingUser.rows.length > 0) {
    logSecurityEvent(req, 'REGISTRATION_FAILED', { 
      reason: 'User already exists',
      email: email 
    }, LOG_LEVELS.INFO);
    return res.status(400).json({ message: 'User already exists' });
  }

  // Insert user profile
  const result = await pool.query(
    'INSERT INTO users (uid, email, name) VALUES ($1, $2, $3) RETURNING id, email, name',
    [uid, email, name]
  );

  const user = result.rows[0];

  // Log successful registration
  logSecurityEvent(req, 'USER_REGISTERED', { 
    userId: user.id,
    email: user.email 
  }, LOG_LEVELS.INFO);

  res.status(201).json({
    message: 'User profile created successfully',
    user: {
      id: user.id,
      uid: uid,
      email: user.email,
      name: user.name
    }
  });
}));

module.exports = router;
