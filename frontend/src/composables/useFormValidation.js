import { ref, computed } from 'vue'

/**
 * Form validation composable
 */
export function useFormValidation() {
  const errors = ref({})
  const touched = ref({})

  /**
   * Validate email format
   * @param {string} email
   * @returns {string|null} - Error message or null if valid
   */
  const validateEmail = (email) => {
    if (!email) {
      return 'Email is required'
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address'
    }
    return null
  }

  /**
   * Validate password strength
   * @param {string} password
   * @returns {Object} - { error: string|null, strength: string, score: number }
   */
  const validatePassword = (password) => {
    if (!password) {
      return { error: 'Password is required', strength: 'weak', score: 0 }
    }

    if (password.length < 6) {
      return { error: 'Password must be at least 6 characters', strength: 'weak', score: 1 }
    }

    let score = 0
    let strength = 'weak'

    // Check password strength criteria
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++

    if (score >= 4) {
      strength = 'strong'
    } else if (score >= 2) {
      strength = 'medium'
    }

    return {
      error: null,
      strength,
      score: Math.min(score, 5)
    }
  }

  /**
   * Validate required field
   * @param {any} value
   * @param {string} fieldName
   * @returns {string|null}
   */
  const validateRequired = (value, fieldName = 'This field') => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`
    }
    return null
  }

  /**
   * Validate minimum length
   * @param {string} value
   * @param {number} minLength
   * @param {string} fieldName
   * @returns {string|null}
   */
  const validateMinLength = (value, minLength, fieldName = 'This field') => {
    if (value && value.length < minLength) {
      return `${fieldName} must be at least ${minLength} characters`
    }
    return null
  }

  /**
   * Validate number range
   * @param {number} value
   * @param {number} min
   * @param {number} max
   * @param {string} fieldName
   * @returns {string|null}
   */
  const validateRange = (value, min, max, fieldName = 'This field') => {
    if (value < min || value > max) {
      return `${fieldName} must be between ${min} and ${max}`
    }
    return null
  }

  /**
   * Set error for a field
   * @param {string} field
   * @param {string|null} error
   */
  const setError = (field, error) => {
    errors.value[field] = error
  }

  /**
   * Clear error for a field
   * @param {string} field
   */
  const clearError = (field) => {
    delete errors.value[field]
  }

  /**
   * Clear all errors
   */
  const clearAllErrors = () => {
    errors.value = {}
  }

  /**
   * Mark field as touched
   * @param {string} field
   */
  const touchField = (field) => {
    touched.value[field] = true
  }

  /**
   * Check if field has been touched
   * @param {string} field
   * @returns {boolean}
   */
  const isTouched = (field) => {
    return touched.value[field] === true
  }

  /**
   * Check if form is valid (no errors)
   */
  const isValid = computed(() => {
    return Object.keys(errors.value).length === 0
  })

  /**
   * Validate field on blur
   * @param {string} field
   * @param {any} value
   * @param {Function} validator
   */
  const validateOnBlur = (field, value, validator) => {
    touchField(field)
    const error = validator(value)
    if (error) {
      setError(field, error)
    } else {
      clearError(field)
    }
  }

  /**
   * Validate field on input (real-time)
   * @param {string} field
   * @param {any} value
   * @param {Function} validator
   */
  const validateOnInput = (field, value, validator) => {
    if (isTouched(field)) {
      const error = validator(value)
      if (error) {
        setError(field, error)
      } else {
        clearError(field)
      }
    }
  }

  return {
    errors,
    touched,
    isValid,
    validateEmail,
    validatePassword,
    validateRequired,
    validateMinLength,
    validateRange,
    setError,
    clearError,
    clearAllErrors,
    touchField,
    isTouched,
    validateOnBlur,
    validateOnInput
  }
}

