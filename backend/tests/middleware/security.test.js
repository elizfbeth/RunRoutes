const { sanitizeData, requestLimits } = require('../../middleware/security')

describe('Security Middleware', () => {
  describe('sanitizeData', () => {
    it('should be a function', () => {
      expect(typeof sanitizeData).toBe('function')
    })

    it('should pass through clean data', () => {
      const req = {
        body: {
          name: 'Test User',
          email: 'test@example.com'
        }
      }
      const res = {}
      const next = jest.fn()

      sanitizeData(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(req.body.name).toBe('Test User')
    })
  })

  describe('requestLimits', () => {
    it('should have json limit', () => {
      expect(requestLimits.json).toBeDefined()
      expect(requestLimits.json.limit).toBeDefined()
    })

    it('should have urlencoded limit', () => {
      expect(requestLimits.urlencoded).toBeDefined()
      expect(requestLimits.urlencoded.limit).toBeDefined()
    })
  })
})

