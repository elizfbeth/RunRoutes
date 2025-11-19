const { validateRegister, validateRoute } = require('../../utils/validation')

describe('Validation Middleware', () => {
  describe('validateRegister', () => {
    it('should pass with valid registration data', async () => {
      const req = {
        body: {
          uid: 'test-uid-123',
          email: 'test@example.com',
          name: 'Test User'
        }
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      }
      const next = jest.fn()

      await validateRegister[validateRegister.length - 1](req, res, next)

      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
    })

    it('should fail with invalid email', async () => {
      const req = {
        body: {
          uid: 'test-uid-123',
          email: 'invalid-email',
          name: 'Test User'
        }
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      }
      const next = jest.fn()

      await validateRegister[validateRegister.length - 1](req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(next).not.toHaveBeenCalled()
    })

    it('should fail with missing required fields', async () => {
      const req = {
        body: {
          email: 'test@example.com'
          // Missing uid and name
        }
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      }
      const next = jest.fn()

      await validateRegister[validateRegister.length - 1](req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('validateRoute', () => {
    it('should pass with valid route data', async () => {
      const req = {
        body: {
          route_name: 'Test Route',
          distance: 5.5,
          waypoints: [
            { lat: 37.7749, lng: -122.4194 },
            { lat: 37.7750, lng: -122.4195 }
          ]
        }
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      }
      const next = jest.fn()

      await validateRoute[validateRoute.length - 1](req, res, next)

      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
    })

    it('should fail with invalid distance', async () => {
      const req = {
        body: {
          route_name: 'Test Route',
          distance: -5,
          waypoints: [{ lat: 37.7749, lng: -122.4194 }]
        }
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      }
      const next = jest.fn()

      await validateRoute[validateRoute.length - 1](req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should fail with empty waypoints', async () => {
      const req = {
        body: {
          route_name: 'Test Route',
          distance: 5.5,
          waypoints: []
        }
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      }
      const next = jest.fn()

      await validateRoute[validateRoute.length - 1](req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })
})

