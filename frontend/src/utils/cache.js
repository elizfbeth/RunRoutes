/**
 * Simple in-memory cache with TTL (Time To Live) support
 */
class Cache {
  constructor() {
    this.cache = new Map()
  }

  /**
   * Set a cache entry
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
   */
  set(key, value, ttl = 5 * 60 * 1000) {
    const expiry = Date.now() + ttl
    this.cache.set(key, { value, expiry })
  }

  /**
   * Get a cache entry
   * @param {string} key - Cache key
   * @returns {any|null} - Cached value or null if not found/expired
   */
  get(key) {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return null
    }

    return entry.value
  }

  /**
   * Check if cache has a valid entry
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null
  }

  /**
   * Delete a cache entry
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key)
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear()
  }

  /**
   * Get cache size
   * @returns {number}
   */
  size() {
    return this.cache.size
  }
}

// Export singleton instance
export const apiCache = new Cache()

/**
 * LocalStorage cache utilities
 */
export const localStorage = {
  /**
   * Set item in localStorage with expiry
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @param {number} ttl - Time to live in milliseconds
   */
  set(key, value, ttl = null) {
    const item = {
      value,
      expiry: ttl ? Date.now() + ttl : null
    }
    window.localStorage.setItem(key, JSON.stringify(item))
  },

  /**
   * Get item from localStorage
   * @param {string} key - Storage key
   * @returns {any|null} - Stored value or null if not found/expired
   */
  get(key) {
    const itemStr = window.localStorage.getItem(key)
    
    if (!itemStr) {
      return null
    }

    try {
      const item = JSON.parse(itemStr)
      
      // Check if expired
      if (item.expiry && Date.now() > item.expiry) {
        window.localStorage.removeItem(key)
        return null
      }

      return item.value
    } catch (error) {
      console.error('Error parsing localStorage item:', error)
      return null
    }
  },

  /**
   * Remove item from localStorage
   * @param {string} key - Storage key
   */
  remove(key) {
    window.localStorage.removeItem(key)
  },

  /**
   * Clear all items from localStorage
   */
  clear() {
    window.localStorage.clear()
  }
}

