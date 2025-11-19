import { ref, computed, watch } from 'vue'
import { localStorage as storage } from '../utils/cache'

const PREFERENCES_KEY = 'user_preferences'

// Default preferences
const defaultPreferences = {
  units: 'km', // 'km' or 'miles'
  defaultDistance: 5, // in km
  minDistance: 1,
  maxDistance: 50,
  preferredTerrains: [], // ['road', 'trail', 'mixed']
  preferredSurfaces: [], // ['paved', 'gravel', 'dirt', 'mixed']
  pace: 6, // minutes per km
  theme: 'light', // 'light' or 'dark'
  mapStyle: 'roadmap' // 'roadmap', 'satellite', 'terrain'
}

// Reactive preferences store
const preferences = ref(loadPreferences())

/**
 * Load preferences from localStorage
 * @returns {Object} User preferences
 */
function loadPreferences() {
  const stored = storage.get(PREFERENCES_KEY)
  if (stored) {
    return { ...defaultPreferences, ...stored }
  }
  return { ...defaultPreferences }
}

/**
 * Save preferences to localStorage
 * @param {Object} prefs - Preferences to save
 */
function savePreferences(prefs) {
  storage.set(PREFERENCES_KEY, prefs, null) // No expiry for preferences
}

/**
 * Composable for managing user preferences
 */
export function usePreferences() {
  /**
   * Update preference
   * @param {string} key - Preference key
   * @param {any} value - Preference value
   */
  const setPreference = (key, value) => {
    preferences.value[key] = value
    savePreferences(preferences.value)
  }

  /**
   * Update multiple preferences at once
   * @param {Object} updates - Object with preference updates
   */
  const setPreferences = (updates) => {
    preferences.value = { ...preferences.value, ...updates }
    savePreferences(preferences.value)
  }

  /**
   * Reset preferences to defaults
   */
  const resetPreferences = () => {
    preferences.value = { ...defaultPreferences }
    savePreferences(preferences.value)
  }

  /**
   * Get preference value
   * @param {string} key - Preference key
   * @returns {any} Preference value
   */
  const getPreference = (key) => {
    return preferences.value[key]
  }

  // Computed values for common preferences
  const units = computed(() => preferences.value.units)
  const isMetric = computed(() => preferences.value.units === 'km')
  const isImperial = computed(() => preferences.value.units === 'miles')
  const defaultDistance = computed(() => preferences.value.defaultDistance)
  const pace = computed(() => preferences.value.pace)
  const preferredTerrains = computed(() => preferences.value.preferredTerrains)
  const preferredSurfaces = computed(() => preferences.value.preferredSurfaces)

  return {
    preferences,
    units,
    isMetric,
    isImperial,
    defaultDistance,
    pace,
    preferredTerrains,
    preferredSurfaces,
    setPreference,
    setPreferences,
    resetPreferences,
    getPreference
  }
}

