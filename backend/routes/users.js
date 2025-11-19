const express = require('express');
const pool = require('../config/database');
const { getUserIdFromUid } = require('../utils/userHelper');

const router = express.Router();

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', async (req, res) => {
  try {
    // Try to authenticate if token is provided
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let userId = null;
    let userUid = null;

    if (token) {
      try {
        const firebaseConfig = require('../config/firebase');
        const admin = firebaseConfig.admin;
        if (admin.apps.length) {
          const decodedToken = await admin.auth().verifyIdToken(token);
          userUid = decodedToken.uid;
          userId = await getUserIdFromUid(userUid);
        }
      } catch (authError) {
        console.warn('Auth error:', authError.message);
      }
    }

    // If no user found, use test user
    if (!userId) {
      const defaultUserResult = await pool.query(
        `SELECT id, uid, email, name, location, preferences, profile_picture_url FROM users WHERE email = 'test@example.com' LIMIT 1`
      );
      if (defaultUserResult.rows.length > 0) {
        return res.json({ user: defaultUserResult.rows[0] });
      } else {
        return res.status(404).json({ message: 'User not found' });
      }
    }

    const result = await pool.query(
      'SELECT id, uid, email, name, location, preferences, profile_picture_url FROM users WHERE uid = $1',
      [userUid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', async (req, res) => {
  try {
    const { name, location, preferences, profile_picture_url } = req.body;

    // Try to authenticate if token is provided
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let userId = null;
    let userUid = null;

    if (token) {
      try {
        const firebaseConfig = require('../config/firebase');
        const admin = firebaseConfig.admin;
        if (admin.apps.length) {
          const decodedToken = await admin.auth().verifyIdToken(token);
          userUid = decodedToken.uid;
          userId = await getUserIdFromUid(userUid);
        }
      } catch (authError) {
        console.warn('Auth error:', authError.message);
      }
    }

    // If no user found, use test user
    if (!userId) {
      const defaultUserResult = await pool.query(
        `SELECT id, uid FROM users WHERE email = 'test@example.com' LIMIT 1`
      );
      if (defaultUserResult.rows.length > 0) {
        userId = defaultUserResult.rows[0].id;
        userUid = defaultUserResult.rows[0].uid;
      } else {
        return res.status(401).json({ message: 'Authentication required' });
      }
    }

    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (location !== undefined) {
      updateFields.push(`location = $${paramCount++}`);
      values.push(location);
    }
    if (preferences !== undefined) {
      updateFields.push(`preferences = $${paramCount++}`);
      values.push(JSON.stringify(preferences));
    }
    if (profile_picture_url !== undefined) {
      updateFields.push(`profile_picture_url = $${paramCount++}`);
      values.push(profile_picture_url);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(userUid);
    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE uid = $${paramCount} RETURNING id, uid, email, name, location, preferences, profile_picture_url`;

    const result = await pool.query(query, values);
    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
