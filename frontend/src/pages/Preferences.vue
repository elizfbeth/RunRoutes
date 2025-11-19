<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Preferences</h1>
      <p class="mt-2 text-gray-600">Customize your experience</p>
    </div>

    <div class="bg-white rounded-lg shadow">
      <div class="p-6 space-y-8">
        <!-- Units Preference -->
        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Units</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Distance & Elevation Units
              </label>
              <div class="flex gap-4">
                <label class="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    v-model="localPrefs.units"
                    value="km"
                    class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span class="ml-2 text-sm text-gray-700">
                    Metric (km, m)
                  </span>
                </label>
                <label class="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    v-model="localPrefs.units"
                    value="miles"
                    class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span class="ml-2 text-sm text-gray-700">
                    Imperial (mi, ft)
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <hr class="border-gray-200" />

        <!-- Distance Preferences -->
        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Default Distance Settings</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Default Route Distance: {{ formatDistance(localPrefs.defaultDistance) }}
              </label>
              <input
                type="range"
                v-model.number="localPrefs.defaultDistance"
                min="1"
                max="100"
                step="0.5"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
              <div class="flex justify-between text-xs text-gray-500 mt-1">
                <span>{{ formatDistance(1) }}</span>
                <span>{{ formatDistance(100) }}</span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Distance
                </label>
                <input
                  type="number"
                  v-model.number="localPrefs.minDistance"
                  step="0.5"
                  min="0.5"
                  :max="localPrefs.maxDistance"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
                <p class="text-xs text-gray-500 mt-1">
                  {{ formatDistance(localPrefs.minDistance) }}
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Distance
                </label>
                <input
                  type="number"
                  v-model.number="localPrefs.maxDistance"
                  step="1"
                  :min="localPrefs.minDistance"
                  max="200"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
                <p class="text-xs text-gray-500 mt-1">
                  {{ formatDistance(localPrefs.maxDistance) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <hr class="border-gray-200" />

        <!-- Pace Preference -->
        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Running/Walking Pace</h3>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Average Pace: {{ localPrefs.pace }} {{ getPaceUnit(localPrefs.units) }}
            </label>
            <input
              type="range"
              v-model.number="localPrefs.pace"
              min="4"
              max="20"
              step="0.5"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>Fast (4 {{ getPaceUnit(localPrefs.units) }})</span>
              <span>Slow (20 {{ getPaceUnit(localPrefs.units) }})</span>
            </div>
            <p class="text-xs text-gray-500 mt-2">
              Used to estimate completion times for routes
            </p>
          </div>
        </div>

        <hr class="border-gray-200" />

        <!-- Terrain Preferences -->
        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Preferred Terrain Types</h3>
          <div class="space-y-2">
            <label
              v-for="terrain in terrainOptions"
              :key="terrain.value"
              class="flex items-center cursor-pointer p-3 rounded-md hover:bg-gray-50 transition"
            >
              <input
                type="checkbox"
                :value="terrain.value"
                v-model="localPrefs.preferredTerrains"
                class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <div class="ml-3">
                <span class="text-sm font-medium text-gray-900">{{ terrain.label }}</span>
                <p class="text-xs text-gray-500">{{ terrain.description }}</p>
              </div>
            </label>
          </div>
        </div>

        <hr class="border-gray-200" />

        <!-- Surface Preferences -->
        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Preferred Surface Types</h3>
          <div class="space-y-2">
            <label
              v-for="surface in surfaceOptions"
              :key="surface.value"
              class="flex items-center cursor-pointer p-3 rounded-md hover:bg-gray-50 transition"
            >
              <input
                type="checkbox"
                :value="surface.value"
                v-model="localPrefs.preferredSurfaces"
                class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <div class="ml-3">
                <span class="text-sm font-medium text-gray-900">{{ surface.label }}</span>
                <p class="text-xs text-gray-500">{{ surface.description }}</p>
              </div>
            </label>
          </div>
        </div>

        <hr class="border-gray-200" />

        <!-- Map Preferences -->
        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Map Settings</h3>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Default Map Style
            </label>
            <select
              v-model="localPrefs.mapStyle"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="roadmap">Roadmap (Default)</option>
              <option value="satellite">Satellite</option>
              <option value="terrain">Terrain</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="bg-gray-50 px-6 py-4 flex justify-between items-center rounded-b-lg">
        <button
          @click="handleReset"
          class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
        >
          Reset to Defaults
        </button>
        <div class="flex gap-3">
          <button
            @click="handleCancel"
            class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            @click="handleSave"
            :disabled="!hasChanges"
            class="px-6 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>

    <!-- Success Toast -->
    <div
      v-if="showSuccess"
      class="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in"
    >
      <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
      </svg>
      <span>Preferences saved successfully!</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePreferences } from '../composables/usePreferences'
import { formatDistance as formatDist, getPaceUnit } from '../utils/units'

const router = useRouter()
const { preferences, setPreferences, resetPreferences } = usePreferences()

// Local copy for editing
const localPrefs = ref({ ...preferences.value })
const showSuccess = ref(false)

// Terrain options
const terrainOptions = [
  { value: 'road', label: 'Road', description: 'Paved roads and streets' },
  { value: 'trail', label: 'Trail', description: 'Natural trails and paths' },
  { value: 'track', label: 'Track', description: 'Running tracks' },
  { value: 'mixed', label: 'Mixed', description: 'Combination of terrains' }
]

// Surface options
const surfaceOptions = [
  { value: 'paved', label: 'Paved', description: 'Asphalt or concrete' },
  { value: 'gravel', label: 'Gravel', description: 'Gravel or crushed stone' },
  { value: 'dirt', label: 'Dirt', description: 'Dirt or natural surface' },
  { value: 'grass', label: 'Grass', description: 'Grass or turf' },
  { value: 'mixed', label: 'Mixed', description: 'Various surfaces' }
]

// Check if preferences have changed
const hasChanges = computed(() => {
  return JSON.stringify(localPrefs.value) !== JSON.stringify(preferences.value)
})

// Format distance based on current unit preference
const formatDistance = (distance) => {
  return formatDist(distance, localPrefs.value.units, 1)
}

// Save preferences
const handleSave = () => {
  setPreferences(localPrefs.value)
  showSuccess.value = true
  setTimeout(() => {
    showSuccess.value = false
  }, 3000)
}

// Cancel changes
const handleCancel = () => {
  localPrefs.value = { ...preferences.value }
  router.push('/dashboard')
}

// Reset to defaults
const handleReset = () => {
  if (confirm('Are you sure you want to reset all preferences to default values?')) {
    resetPreferences()
    localPrefs.value = { ...preferences.value }
  }
}

// Watch for external preference changes
watch(preferences, (newPrefs) => {
  localPrefs.value = { ...newPrefs }
}, { deep: true })
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
</style>

