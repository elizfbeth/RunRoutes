const { calculateDifficulty } = require('../../services/mapsService')

describe('Maps Service', () => {
  describe('calculateDifficulty', () => {
    it('should return "easy" for short flat routes', () => {
      const difficulty = calculateDifficulty(2, 10)
      expect(difficulty).toBe('easy')
    })

    it('should return "moderate" for medium routes with some elevation', () => {
      const difficulty = calculateDifficulty(10, 200)
      expect(difficulty).toBe('moderate')
    })

    it('should return "hard" for long routes with high elevation', () => {
      const difficulty = calculateDifficulty(20, 500)
      expect(difficulty).toBe('hard')
    })

    it('should return "challenging" for very long routes', () => {
      const difficulty = calculateDifficulty(40, 800)
      expect(difficulty).toBe('challenging')
    })

    it('should handle zero elevation', () => {
      const difficulty = calculateDifficulty(5, 0)
      expect(difficulty).toBe('easy')
    })

    it('should handle undefined elevation', () => {
      const difficulty = calculateDifficulty(5, undefined)
      expect(difficulty).toBeDefined()
    })

    it('should calculate based on distance when elevation is low', () => {
      const difficulty = calculateDifficulty(25, 50)
      expect(['moderate', 'hard']).toContain(difficulty)
    })

    it('should factor in high elevation gain', () => {
      const difficulty = calculateDifficulty(10, 1000)
      expect(['hard', 'challenging']).toContain(difficulty)
    })
  })
})

