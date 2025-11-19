import axios from 'axios'
import { auth } from '../config/firebase'

// ============================================
// API CONFIGURATION
// ============================================
// Backend API runs on PORT 5001
// Set VITE_API_URL in .env file: http://localhost:5001/api
// ============================================
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add Firebase token to requests (with automatic refresh)
api.interceptors.request.use(
  async (config) => {
    try {
      // Try to get a fresh token from Firebase Auth
      const currentUser = auth.currentUser
      if (currentUser) {
        const token = await currentUser.getIdToken()
        localStorage.setItem('firebaseToken', token)
        config.headers.Authorization = `Bearer ${token}`
      } else {
        // Fallback to stored token if user is not loaded yet
        const storedToken = localStorage.getItem('firebaseToken')
        if (storedToken) {
          config.headers.Authorization = `Bearer ${storedToken}`
        }
      }
    } catch (error) {
      console.warn('Error getting auth token:', error)
      // Continue without token - let the API decide if it needs auth
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle 401 errors (unauthorized) with retry logic
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Only handle 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't logout for these endpoints - they might not require auth
      const publicEndpoints = ['/routes', '/auth/register', '/auth/login']
      const isPublicEndpoint = publicEndpoints.some(endpoint =>
        originalRequest.url?.includes(endpoint)
      )

      if (isPublicEndpoint) {
        return Promise.reject(error)
      }

      // If we're already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return axios(originalRequest)
        }).catch(err => {
          return Promise.reject(err)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      // Try to refresh the token
      try {
        const currentUser = auth.currentUser
        if (currentUser) {
          const freshToken = await currentUser.getIdToken(true) // Force refresh
          localStorage.setItem('firebaseToken', freshToken)

          // Update the failed request with new token
          originalRequest.headers.Authorization = `Bearer ${freshToken}`

          // Process queued requests
          processQueue(null, freshToken)
          isRefreshing = false

          // Retry the original request
          return axios(originalRequest)
        } else {
          throw new Error('No authenticated user')
        }
      } catch (refreshError) {
        processQueue(refreshError, null)
        isRefreshing = false

        // Only logout if this is a protected endpoint and refresh failed
        console.error('Token refresh failed, logging out')
        localStorage.removeItem('firebaseToken')

        // Don't redirect if we're already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login?session_expired=true'
        }

        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
