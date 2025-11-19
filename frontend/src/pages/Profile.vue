<template>
  <div v-if="loading" class="flex items-center justify-center py-12">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>

  <div v-else class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">Profile Settings</h1>

    <form @submit.prevent="handleSubmit" class="bg-white rounded-lg shadow p-6 space-y-6">
      <div v-if="message" :class="[
        'p-4 rounded',
        message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
      ]">
        {{ message }}
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Name
        </label>
        <input
          v-model="profile.name"
          type="text"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Location
        </label>
        <input
          v-model="profile.location"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          placeholder="City, State"
        />
      </div>

      <div>
        <h2 class="text-lg font-semibold mb-4">Route Preferences</h2>
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Preferred Distance (km)
            </label>
            <input
              v-model.number="profile.preferences.distance"
              type="number"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="5"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Goal
            </label>
            <select
              v-model="profile.preferences.goal"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select...</option>
              <option value="training">Training</option>
              <option value="scenic">Scenic</option>
              <option value="casual">Casual</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Pace (min/km)
            </label>
            <input
              v-model.number="profile.preferences.pace"
              type="number"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="5"
            />
          </div>
        </div>
      </div>

      <div>
        <button
          type="submit"
          :disabled="saving"
          class="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50"
        >
          {{ saving ? 'Saving...' : 'Save Profile' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'

const profile = ref({
  name: '',
  location: '',
  preferences: {
    distance: '',
    goal: '',
    pace: ''
  }
})

const loading = ref(true)
const saving = ref(false)
const message = ref('')

const fetchProfile = async () => {
  try {
    const response = await api.get('/users/profile')
    const userData = response.data.user
    profile.value = {
      name: userData.name || '',
      location: userData.location || '',
      preferences: userData.preferences && typeof userData.preferences === 'object'
        ? userData.preferences
        : { distance: '', goal: '', pace: '' }
    }
  } catch (error) {
    console.error('Error fetching profile:', error)
    // Set default values even if fetch fails
    profile.value = {
      name: '',
      location: '',
      preferences: { distance: '', goal: '', pace: '' }
    }
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  saving.value = true
  message.value = ''

  try {
    await api.put('/users/profile', {
      name: profile.value.name,
      location: profile.value.location,
      preferences: profile.value.preferences
    })
    message.value = 'Profile updated successfully!'
  } catch (error) {
    message.value = 'Error updating profile: ' + (error.response?.data?.message || 'Unknown error')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchProfile()
})
</script>

