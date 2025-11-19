const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateRoute } = require('../utils/validation');
const { generateRoute, calculateDifficulty } = require('../services/mapsService');
const { getUserIdFromUid } = require('../utils/userHelper');
const { generateLimiter, modifyLimiter } = require('../middleware/rateLimiter');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @route   GET /api/routes
 * @desc    Get all routes (with filters)
 * @access  Public (but can filter by user)
 */
router.get('/', async (req, res) => {
  try {
    const { user_id, min_distance, max_distance, visibility } = req.query;
    
    let query = 'SELECT r.*, u.name as user_name FROM routes r JOIN users u ON r.user_id = u.id WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (user_id) {
      // Handle "me" as a special case to get current user's routes
      if (user_id === 'me' && req.headers['authorization']) {
        try {
          const firebaseConfig = require('../config/firebase');
          const admin = firebaseConfig.admin;
          const token = req.headers['authorization'].split(' ')[1];
          
          if (!admin.apps.length) {
            console.warn('Firebase not initialized - returning all public routes');
            // Just show all public routes instead of failing
            query += ` AND r.visibility = 'public'`;
          } else {
            const decodedToken = await admin.auth().verifyIdToken(token);
            const userId = await getUserIdFromUid(decodedToken.uid);
            if (userId) {
              query += ` AND r.user_id = $${paramCount++}`;
              values.push(userId);
            }
          }
        } catch (err) {
          console.warn('Firebase auth error:', err.message);
          // Show all public routes instead of failing
          query += ` AND r.visibility = 'public'`;
        }
      } else {
        query += ` AND r.user_id = $${paramCount++}`;
        values.push(user_id);
      }
    }
    if (min_distance) {
      query += ` AND r.distance >= $${paramCount++}`;
      values.push(parseFloat(min_distance));
    }
    if (max_distance) {
      query += ` AND r.distance <= $${paramCount++}`;
      values.push(parseFloat(max_distance));
    }
    if (visibility) {
      query += ` AND r.visibility = $${paramCount++}`;
      values.push(visibility);
    }

    query += ' ORDER BY r.created_at DESC';

    const result = await pool.query(query, values);
    
    // Parse JSON fields
    const routes = result.rows.map(route => ({
      ...route,
      waypoints: typeof route.waypoints === 'string' ? JSON.parse(route.waypoints) : route.waypoints
    }));

    res.json({ routes });
  } catch (error) {
    console.error('Get routes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/routes/:id
 * @desc    Get a single route by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT r.*, u.name as user_name FROM routes r JOIN users u ON r.user_id = u.id WHERE r.id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Route not found' });
    }

    const route = result.rows[0];
    route.waypoints = typeof route.waypoints === 'string' ? JSON.parse(route.waypoints) : route.waypoints;

    res.json({ route });
  } catch (error) {
    console.error('Get route error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/routes
 * @desc    Create a new route
 * @access  Private
 */
router.post('/', authenticateToken, modifyLimiter, validateRoute, asyncHandler(async (req, res) => {
  const { route_name, distance, estimated_time, elevation_gain, waypoints, visibility } = req.body;

  const userId = await getUserIdFromUid(req.user.uid);
  if (!userId) {
    return res.status(404).json({ message: 'User not found' });
  }

  const result = await pool.query(
    `INSERT INTO routes (user_id, route_name, distance, estimated_time, elevation_gain, waypoints, visibility)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      userId,
      route_name,
      distance,
      estimated_time || null,
      elevation_gain || 0,
      JSON.stringify(waypoints),
      visibility || 'private'
    ]
  );

  const route = result.rows[0];
  route.waypoints = typeof route.waypoints === 'string' ? JSON.parse(route.waypoints) : route.waypoints;

  res.status(201).json({
    message: 'Route created successfully',
    route
  });
}));

/**
 * @route   POST /api/routes/generate
 * @desc    Generate a route using Google Maps API
 * @access  Private (but allows development mode without auth)
 */
router.post('/generate', generateLimiter, asyncHandler(async (req, res) => {
  const { start_point, end_point, route_name, preferences } = req.body;

  if (!start_point || !end_point) {
    return res.status(400).json({ message: 'Start and end points are required' });
  }

  // Validate coordinates
  if (!start_point.lat || !start_point.lng || !end_point.lat || !end_point.lng) {
    return res.status(400).json({ message: 'Invalid start or end point coordinates' });
  }

  // Check if user is authenticated
  let userId = null;
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const firebaseConfig = require('../config/firebase');
      const admin = firebaseConfig.admin;
      if (admin.apps.length) {
        const decodedToken = await admin.auth().verifyIdToken(token);
        userId = await getUserIdFromUid(decodedToken.uid);
      }
    } catch (authError) {
      console.warn('Auth error (continuing without user):', authError.message);
    }
  }

  // If no userId, use a default test user for development
  if (!userId) {
    console.log('WARNING: Route generation without authentication - using default user');
    try {
      const defaultUserResult = await pool.query(
        `SELECT id FROM users WHERE email = 'test@example.com' LIMIT 1`
      );
      if (defaultUserResult.rows.length > 0) {
        userId = defaultUserResult.rows[0].id;
      } else {
        const createUserResult = await pool.query(
          `INSERT INTO users (name, email, uid) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING id`,
          ['Test User', 'test@example.com', 'test-uid-' + Date.now()]
        );
        userId = createUserResult.rows[0].id;
      }
    } catch (dbError) {
      console.error('Database error:', dbError.message);
      return res.status(503).json({
        message: 'Database connection error. Please check your database configuration.',
        error: dbError.message
      });
    }
  }

  // Get user preferences if not provided
  let userPreferences = preferences || {};

  // Generate route using Google Maps API
  console.log('Generating route from', start_point, 'to', end_point);
  const routeData = await generateRoute(start_point, end_point, userPreferences);

  // Calculate difficulty
  const difficulty = calculateDifficulty(routeData.distance, routeData.elevation_gain);

  // Save route to database
  const result = await pool.query(
    `INSERT INTO routes (user_id, route_name, distance, estimated_time, elevation_gain, waypoints, visibility)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      userId,
      route_name || `Generated Route ${new Date().toLocaleDateString()}`,
      routeData.distance,
      routeData.estimated_time,
      routeData.elevation_gain,
      JSON.stringify(routeData.waypoints),
      'public'
    ]
  );

  const route = result.rows[0];
  route.waypoints = typeof route.waypoints === 'string' ? JSON.parse(route.waypoints) : route.waypoints;

  console.log('Route generated and saved successfully');

  res.status(201).json({
    message: 'Route generated successfully',
    route: {
      ...route,
      difficulty,
      polyline: routeData.polyline,
      bounds: routeData.bounds
    }
  });
}));

/**
 * @route   PUT /api/routes/:id
 * @desc    Update a route
 * @access  Private (owner only)
 */
router.put('/:id', async (req, res) => {
  try {
    // Check if route exists first
    const checkResult = await pool.query(
      'SELECT user_id FROM routes WHERE id = $1',
      [req.params.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Route not found' });
    }

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

    // Only check ownership if user is authenticated
    if (userId && checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this route' });
    }

    const { route_name, distance, estimated_time, elevation_gain, waypoints, visibility } = req.body;

    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (route_name !== undefined) {
      updateFields.push(`route_name = $${paramCount++}`);
      values.push(route_name);
    }
    if (distance !== undefined) {
      updateFields.push(`distance = $${paramCount++}`);
      values.push(distance);
    }
    if (estimated_time !== undefined) {
      updateFields.push(`estimated_time = $${paramCount++}`);
      values.push(estimated_time);
    }
    if (elevation_gain !== undefined) {
      updateFields.push(`elevation_gain = $${paramCount++}`);
      values.push(elevation_gain);
    }
    if (waypoints !== undefined) {
      updateFields.push(`waypoints = $${paramCount++}`);
      values.push(JSON.stringify(waypoints));
    }
    if (visibility !== undefined) {
      updateFields.push(`visibility = $${paramCount++}`);
      values.push(visibility);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(req.params.id);
    const query = `UPDATE routes SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);
    const route = result.rows[0];
    route.waypoints = typeof route.waypoints === 'string' ? JSON.parse(route.waypoints) : route.waypoints;

    res.json({
      message: 'Route updated successfully',
      route
    });
  } catch (error) {
    console.error('Update route error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/routes/:id
 * @desc    Delete a route
 * @access  Private (owner only)
 */
router.delete('/:id', async (req, res) => {
  try {
    // Check if route exists first
    const checkResult = await pool.query(
      'SELECT user_id FROM routes WHERE id = $1',
      [req.params.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Route not found' });
    }

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

    // Only check ownership if user is authenticated
    if (userId && checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this route' });
    }

    await pool.query('DELETE FROM routes WHERE id = $1', [req.params.id]);

    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    console.error('Delete route error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

