const { getUserIdFromUid } = require('../../utils/userHelper')
const pool = require('../../config/database')

// Mock the database pool
jest.mock('../../config/database', () => ({
  query: jest.fn()
}))

describe('User Helper', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getUserIdFromUid', () => {
    it('should return user ID when user exists', async () => {
      pool.query.mockResolvedValue({
        rows: [{ id: 123 }]
      })

      const userId = await getUserIdFromUid('test-uid-123')

      expect(userId).toBe(123)
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT id FROM users WHERE uid = $1',
        ['test-uid-123']
      )
    })

    it('should return null when user does not exist', async () => {
      pool.query.mockResolvedValue({
        rows: []
      })

      const userId = await getUserIdFromUid('nonexistent-uid')

      expect(userId).toBeNull()
    })

    it('should return null on database error', async () => {
      pool.query.mockRejectedValue(new Error('Database error'))

      const userId = await getUserIdFromUid('test-uid')

      expect(userId).toBeNull()
    })

    it('should handle undefined UID', async () => {
      const userId = await getUserIdFromUid(undefined)

      expect(userId).toBeNull()
      expect(pool.query).not.toHaveBeenCalled()
    })

    it('should handle null UID', async () => {
      const userId = await getUserIdFromUid(null)

      expect(userId).toBeNull()
      expect(pool.query).not.toHaveBeenCalled()
    })
  })
})

