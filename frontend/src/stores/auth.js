import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { auth } from '../config/firebase'
import api from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(true)

  const isAuthenticated = computed(() => !!user.value)

  // Token refresh interval
  let tokenRefreshInterval = null

  // Initialize auth state listener
  const init = () => {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Set basic user info immediately for fast UI update
        user.value = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName
        }
        loading.value = false

        // Get and store fresh token
        try {
          const idToken = await firebaseUser.getIdToken(true) // Force refresh
          localStorage.setItem('firebaseToken', idToken)

          // Set up automatic token refresh every 50 minutes (tokens expire after 60 minutes)
          if (tokenRefreshInterval) {
            clearInterval(tokenRefreshInterval)
          }

          tokenRefreshInterval = setInterval(async () => {
            try {
              const currentUser = auth.currentUser
              if (currentUser) {
                const freshToken = await currentUser.getIdToken(true)
                localStorage.setItem('firebaseToken', freshToken)
                console.log('🔄 Token refreshed automatically')
              }
            } catch (error) {
              console.error('Error refreshing token:', error)
            }
          }, 50 * 60 * 1000) // 50 minutes

          // Get user profile from backend (non-blocking)
          const response = await api.get('/users/profile', { timeout: 3000 })
          user.value = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            ...response.data.user
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
          // Keep the basic user info we already set
        }
      } else {
        user.value = null
        localStorage.removeItem('firebaseToken')
        loading.value = false

        // Clear token refresh interval
        if (tokenRefreshInterval) {
          clearInterval(tokenRefreshInterval)
          tokenRefreshInterval = null
        }
      }
    })
  }

  const register = async (email, password, name) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const idToken = await userCredential.user.getIdToken()
      localStorage.setItem('firebaseToken', idToken)

      // Create user profile in backend
      await api.post('/auth/register', {
        uid: userCredential.user.uid,
        email,
        name
      })

      // onAuthStateChanged will handle fetching the full profile
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Registration failed'
      }
    }
  }

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      // onAuthStateChanged will handle setting the user and fetching profile
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Login failed'
      }
    }
  }

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      const userCredential = await signInWithPopup(auth, provider)
      const idToken = await userCredential.user.getIdToken()
      localStorage.setItem('firebaseToken', idToken)

      // Register/login user in backend
      try {
        await api.post('/auth/register', {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          name: userCredential.user.displayName
        })
      } catch (error) {
        // User might already exist, that's okay
        console.log('User may already exist:', error.message)
      }

      // onAuthStateChanged will handle fetching the full profile
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Google sign-in failed'
      }
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      user.value = null
      localStorage.removeItem('firebaseToken')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return {
    user,
    loading,
    isAuthenticated,
    init,
    register,
    login,
    loginWithGoogle,
    logout
  }
})

