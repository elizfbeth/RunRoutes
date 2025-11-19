<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Or
          <router-link to="/register" class="font-medium text-primary-600 hover:text-primary-500">
            create a new account
          </router-link>
        </p>
      </div>
      <form @submit.prevent="handleSubmit" class="mt-8 space-y-6">
        <!-- Error Message -->
        <ErrorMessage
          v-if="error"
          :message="error"
          title="Sign in failed"
          :show-retry="false"
          @dismiss="error = ''"
        />

        <div class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              id="email"
              v-model="email"
              name="email"
              type="email"
              autocomplete="email"
              @blur="validation.validateOnBlur('email', email, validation.validateEmail)"
              @input="validation.validateOnInput('email', email, validation.validateEmail)"
              :class="[
                'appearance-none relative block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary-500 focus:z-10 sm:text-sm',
                validation.errors.email && validation.isTouched('email')
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-gray-300 focus:border-primary-500'
              ]"
              placeholder="you@example.com"
            />
            <p v-if="validation.errors.email && validation.isTouched('email')" class="mt-1 text-sm text-red-600">
              {{ validation.errors.email }}
            </p>
          </div>
          
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              v-model="password"
              name="password"
              type="password"
              autocomplete="current-password"
              @blur="validation.validateOnBlur('password', password, (val) => validation.validateRequired(val, 'Password'))"
              @input="validation.validateOnInput('password', password, (val) => validation.validateRequired(val, 'Password'))"
              :class="[
                'appearance-none relative block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary-500 focus:z-10 sm:text-sm',
                validation.errors.password && validation.isTouched('password')
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-gray-300 focus:border-primary-500'
              ]"
              placeholder="Enter your password"
            />
            <p v-if="validation.errors.password && validation.isTouched('password')" class="mt-1 text-sm text-red-600">
              {{ validation.errors.password }}
            </p>
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {{ loading ? 'Signing in...' : 'Sign in' }}
          </button>
        </div>

        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-gray-50 text-gray-500">Or continue with</span>
          </div>
        </div>

        <div>
          <button
            type="button"
            @click="handleGoogleSignIn"
            :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            <span class="inline-flex items-center">
              <svg class="w-3 h-3 flex-shrink-0 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Sign in with Google</span>
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useFormValidation } from '../composables/useFormValidation'
import ErrorMessage from '../components/ErrorMessage.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const validation = useFormValidation()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

// Check for session expiration message
onMounted(() => {
  if (route.query.session_expired === 'true') {
    error.value = 'Your session has expired. Please sign in again.'
  }
})

const handleSubmit = async () => {
  // Validate all fields
  validation.touchField('email')
  validation.touchField('password')
  
  const emailError = validation.validateEmail(email.value)
  const passwordError = validation.validateRequired(password.value, 'Password')
  
  if (emailError) validation.setError('email', emailError)
  else validation.clearError('email')
  
  if (passwordError) validation.setError('password', passwordError)
  else validation.clearError('password')

  if (!validation.isValid.value) {
    error.value = 'Please fix the errors above'
    return
  }

  error.value = ''
  loading.value = true

  const result = await authStore.login(email.value, password.value)

  if (result.success) {
    router.push('/dashboard')
  } else {
    error.value = result.message
  }

  loading.value = false
}

const handleGoogleSignIn = async () => {
  error.value = ''
  loading.value = true

  const result = await authStore.loginWithGoogle()

  if (result.success) {
    router.push('/dashboard')
  } else {
    error.value = result.message
  }

  loading.value = false
}
</script>

