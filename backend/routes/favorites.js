const express = require('express');
const pool = require('../config/database');
const { getUserIdFromUid } = require('../utils/userHelper');

const router = express.Router();

/**
 * @route   GET /api/favorites
 * @desc    Get user's favorite routes
 * @access  Private (but allows development mode without auth)
 */
router.get('/', async (req, res) => {
  try {
    // Try to authenticate if token is provided
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let userId = null;

    if (token) {
      try {
        const firebaseConfig = require('../config/firebase');
        const admin = firebaseConfig.admin;
        if (admin.apps.length) {
          const decodedToken = await admin.auth().verifyIdToken(token);
          userId = await getUserIdFromUid(decodedToken.uid);
        }
      } catch (authError) {
        console.warn('Auth error (continuing anyway):', authError.message);
      }
    }

    // If no user found, use test user
    if (!userId) {
      const defaultUserResult = await pool.query(
        `SELECT id FROM users WHERE email = 'test@example.com' LIMIT 1`
      );
      if (defaultUserResult.rows.length > 0) {
        userId = defaultUserResult.rows[0].id;
      } else {
        return res.json({ favorites: [] });
      }
    }

    const result = await pool.query(
      `SELECT r.*, u.name as user_name
       FROM favorites f
       JOIN routes r ON f.route_id = r.id
       JOIN users u ON r.user_id = u.id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );

    const routes = result.rows.map(route => ({
      ...route,
      waypoints: typeof route.waypoints === 'string' ? JSON.parse(route.waypoints) : route.waypoints
    }));

    res.json({ favorites: routes });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/favorites/:routeId
 * @desc    Add a route to favorites
 * @access  Private
 */
router.post('/:routeId', async (req, res) => {
  try {
    // Try to authenticate if token is provided
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let userId = null;

    if (token) {
      try {
        const firebaseConfig = require('../config/firebase');
        const admin = firebaseConfig.admin;
        if (admin.apps.length) {
          const decodedToken = await admin.auth().verifyIdToken(token);
          userId = await getUserIdFromUid(decodedToken.uid);
        }
      } catch (authError) {
        console.warn('Auth error:', authError.message);
      }
    }

    // If no user found, use test user
    if (!userId) {
      const defaultUserResult = await pool.query(
        `SELECT id FROM users WHERE email = 'test@example.com' LIMIT 1`
      );
      if (defaultUserResult.rows.length > 0) {
        userId = defaultUserResult.rows[0].id;
      } else {
        return res.status(401).json({ message: 'Authentication required' });
      }
    }

    // Check if route exists
    const routeCheck = await pool.query(
      'SELECT id FROM routes WHERE id = $1',
      [req.params.routeId]
    );

    if (routeCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Route not found' });
    }

    // Check if already favorited
    const existing = await pool.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND route_id = $2',
      [userId, req.params.routeId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Route already in favorites' });
    }

    // Add to favorites
    await pool.query(
      'INSERT INTO favorites (user_id, route_id) VALUES ($1, $2)',
      [userId, req.params.routeId]
    );

    res.status(201).json({ message: 'Route added to favorites' });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/favorites/:routeId
 * @desc    Remove a route from favorites
 * @access  Private
 */
router.delete('/:routeId', async (req, res) => {
  try {
    // Try to authenticate if token is provided
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let userId = null;

    if (token) {
      try {
        const firebaseConfig = require('../config/firebase');
        const admin = firebaseConfig.admin;
        if (admin.apps.length) {
          const decodedToken = await admin.auth().verifyIdToken(token);
          userId = await getUserIdFromUid(decodedToken.uid);
        }
      } catch (authError) {
        console.warn('Auth error:', authError.message);
      }
    }

    // If no user found, use test user
    if (!userId) {
      const defaultUserResult = await pool.query(
        `SELECT id FROM users WHERE email = 'test@example.com' LIMIT 1`
      );
      if (defaultUserResult.rows.length > 0) {
        userId = defaultUserResult.rows[0].id;
      } else {
        return res.status(401).json({ message: 'Authentication required' });
      }
    }

    const result = await pool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND route_id = $2',
      [userId, req.params.routeId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    res.json({ message: 'Route removed from favorites' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

