const request = require('supertest');
const app = require('../server');
const pool = require('../config/database');
const jwt = require('jsonwebtoken');

describe('Routes API', () => {
  let authToken;
  let testUserId;
  let testRouteId;
  const testUser = {
    email: 'routetest@example.com',
    password: 'testpassword123',
    name: 'Route Test User'
  };

  beforeAll(async () => {
    // Create test user and get token
    await pool.query('DELETE FROM users WHERE email = $1', [testUser.email]);
    
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testUser.password, salt);
    
    const result = await pool.query(
      'INSERT INTO users (email, hashed_password, name) VALUES ($1, $2, $3) RETURNING id',
      [testUser.email, hashedPassword, testUser.name]
    );
    
    testUserId = result.rows[0].id;
    authToken = jwt.sign(
      { userId: testUserId, email: testUser.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '7d' }
    );
  });

  afterAll(async () => {
    await pool.query('DELETE FROM routes WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    await pool.end();
  });

  describe('POST /api/routes', () => {
    it('should create a new route', async () => {
      const routeData = {
        route_name: 'Test Route',
        distance: 5.5,
        estimated_time: 30,
        terrain_type: 'flat',
        elevation_gain: 50,
        waypoints: [
          { lat: 37.7749, lng: -122.4194 },
          { lat: 37.7849, lng: -122.4294 }
        ],
        visibility: 'public'
      };

      const res = await request(app)
        .post('/api/routes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(routeData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('route');
      expect(res.body.route.route_name).toBe(routeData.route_name);
      testRouteId = res.body.route.id;
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/routes')
        .send({ route_name: 'Test' });

      expect(res.statusCode).toBe(401);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/routes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ route_name: 'Test' });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/routes', () => {
    it('should get all routes', async () => {
      const res = await request(app)
        .get('/api/routes');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('routes');
      expect(Array.isArray(res.body.routes)).toBe(true);
    });

    it('should filter routes by user_id', async () => {
      const res = await request(app)
        .get(`/api/routes?user_id=${testUserId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.routes.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/routes/:id', () => {
    it('should get a single route', async () => {
      const res = await request(app)
        .get(`/api/routes/${testRouteId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('route');
      expect(res.body.route.id).toBe(testRouteId);
    });

    it('should return 404 for non-existent route', async () => {
      const res = await request(app)
        .get('/api/routes/99999');

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/routes/:id', () => {
    it('should update a route', async () => {
      const res = await request(app)
        .put(`/api/routes/${testRouteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ route_name: 'Updated Route Name' });

      expect(res.statusCode).toBe(200);
      expect(res.body.route.route_name).toBe('Updated Route Name');
    });

    it('should not allow updating other users routes', async () => {
      // Create another user
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      
      const otherUserResult = await pool.query(
        'INSERT INTO users (email, hashed_password, name) VALUES ($1, $2, $3) RETURNING id',
        ['other@example.com', hashedPassword, 'Other User']
      );
      
      const otherToken = jwt.sign(
        { userId: otherUserResult.rows[0].id, email: 'other@example.com' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '7d' }
      );

      const res = await request(app)
        .put(`/api/routes/${testRouteId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ route_name: 'Hacked Route' });

      expect(res.statusCode).toBe(403);

      // Cleanup
      await pool.query('DELETE FROM users WHERE id = $1', [otherUserResult.rows[0].id]);
    });
  });

  describe('DELETE /api/routes/:id', () => {
    it('should delete a route', async () => {
      const res = await request(app)
        .delete(`/api/routes/${testRouteId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Route deleted successfully');
    });
  });
});

