<template>
  <div v-if="loading" class="flex items-center justify-center min-h-screen">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>

  <div v-else-if="!route" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <p>Route not found</p>
    <router-link to="/routes" class="text-primary-600">Back to Routes</router-link>
  </div>

  <div v-else class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-6">
      <router-link to="/routes" class="text-primary-600 hover:text-primary-700 mb-4 inline-block">
        Back to Routes
      </router-link>
      <div class="flex justify-between items-start">
        <div class="flex items-center gap-3">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">{{ route.route_name }}</h1>
            <p class="text-gray-600 mt-2">Created by {{ route.user_name }}</p>
          </div>
          <button
            @click="startRenaming"
            class="text-gray-400 hover:text-primary-600 transition"
            title="Rename route"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
        <div class="flex space-x-2">
          <button
            @click="toggleFavorite"
            :class="[
              'px-4 py-2 rounded-lg font-semibold transition',
              isFavorite
                ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            ]"
          >
            {{ isFavorite ? 'Favorited' : 'Favorite' }}
          </button>
          <button
            @click="handleDelete"
            class="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <div class="grid md:grid-cols-2 gap-6 mb-6">
      <!-- Route Stats -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Route Details</h2>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-600">Distance</p>
            <p class="text-2xl font-bold">{{ route.distance }} km</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Elevation Gain</p>
            <p class="text-2xl font-bold">{{ route.elevation_gain || 0 }} m</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Estimated Time</p>
            <p class="text-2xl font-bold">{{ calculateEstimatedTime(route.distance) }} min</p>
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Quick Stats</h2>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-600">Created</p>
            <p class="text-lg font-bold">{{ new Date(route.created_at).toLocaleDateString() }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Created By</p>
            <p class="text-lg font-bold">{{ route.user_name }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Map Container -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div v-if="!isMapLoaded" class="flex items-center justify-center" style="width: 100%; height: 500px;">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
      <div ref="mapContainer" style="width: 100%; height: 500px;" v-show="isMapLoaded"></div>
    </div>

    <!-- Rename Modal -->
    <div v-if="isRenaming" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="cancelRenaming">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold mb-4">Rename Route</h3>
        <input
          v-model="newRouteName"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
          placeholder="Enter new route name"
          @keyup.enter="saveRename"
          @keyup.esc="cancelRenaming"
          ref="renameInput"
        />
        <div class="flex justify-end space-x-2">
          <button
            @click="cancelRenaming"
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            @click="saveRename"
            class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Loader } from '@googlemaps/js-api-loader'
import api from '../services/api'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const routeParams = useRoute()
const router = useRouter()
const routeId = routeParams.params.id

const routeData = ref(null)
const loading = ref(true)
const isMapLoaded = ref(false)
const isFavorite = ref(false)
const mapContainer = ref(null)
const isRenaming = ref(false)
const newRouteName = ref('')
const renameInput = ref(null)
let map = null
let directionsRenderer = null

const route = computed(() => routeData.value)

const userPace = computed(() => {
  return authStore.user?.preferences?.pace || 6
})

const calculateEstimatedTime = (distance) => {
  const timeInMinutes = distance * userPace.value
  return Math.round(timeInMinutes)
}

onMounted(async () => {
  // First fetch the route data
  await fetchRoute()
  await checkFavorite()
  // Then load the map with the route data
  await loadGoogleMaps()
})

const loadGoogleMaps = async () => {
  // Don't load map until we have route data
  if (!route.value) {
    console.log('⏳ Waiting for route data before loading map...')
    return
  }

  try {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

    if (!apiKey || apiKey === 'your-google-maps-api-key') {
      console.error('ERROR: Google Maps API key not configured')
      alert('Google Maps API key is not configured. Please check your .env file.')
      return
    }

    console.log('Loading Google Maps with API key:', apiKey.substring(0, 10) + '...')

    const loader = new Loader({
      apiKey: apiKey,
      version: 'weekly',
      libraries: ['places']
    })

    await loader.load()
    console.log('Google Maps loaded successfully')

    // Wait for DOM to be ready - use multiple nextTick calls
    await nextTick()
    await nextTick()
    await nextTick()

    // Additional retry logic with timeout
    let retries = 0
    const maxRetries = 20
    while (!mapContainer.value && retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 100))
      await nextTick()
      retries++
    }

    if (!mapContainer.value) {
      console.error('ERROR: Map container element not found after', retries, 'retries')
      throw new Error('Map container element not found. The DOM element may not be rendered yet.')
    }

    console.log('Map container found:', mapContainer.value)

    const center = route.value?.waypoints?.[0]
      ? { lat: route.value.waypoints[0].lat, lng: route.value.waypoints[0].lng }
      : { lat: 37.7749, lng: -122.4194 }

    map = new google.maps.Map(mapContainer.value, {
      center,
      zoom: 13,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true
    })

    directionsRenderer = new google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: false
    })

    isMapLoaded.value = true
    console.log('Map initialized successfully')

    // Load route directions immediately
    if (route.value) {
      loadDirections(route.value)
    }
  } catch (error) {
    console.error('ERROR: Error loading Google Maps:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? 'Set' : 'Not set'
    })
    alert(`Google Maps failed to load: ${error.message}\n\nCheck:\n1. API key is correct\n2. Maps JavaScript API is enabled\n3. API key restrictions allow localhost\n4. Billing is enabled on your Google Cloud project`)
  }
}

const fetchRoute = async () => {
  try {
    const response = await api.get(`/routes/${routeId}`)
    routeData.value = response.data.route
    console.log('Route data loaded:', routeData.value)
  } catch (error) {
    console.error('Error fetching route:', error)
    router.push('/routes')
  } finally {
    loading.value = false
  }
}

const checkFavorite = async () => {
  try {
    const response = await api.get('/favorites')
    const favorites = response.data.favorites
    console.log('Checking if route', routeId, 'is in favorites:', favorites.map(f => f.id))
    isFavorite.value = favorites.some(fav => fav.id === parseInt(routeId))
    console.log('Is favorited:', isFavorite.value)
  } catch (error) {
    console.error('Error checking favorite:', error)
    console.error('Error details:', error.response?.data)
  }
}

const loadDirections = (routeData) => {
  if (!routeData.waypoints || routeData.waypoints.length < 2) return

  const directionsService = new google.maps.DirectionsService()
  const origin = `${routeData.waypoints[0].lat},${routeData.waypoints[0].lng}`
  const destination = `${routeData.waypoints[routeData.waypoints.length - 1].lat},${routeData.waypoints[routeData.waypoints.length - 1].lng}`

  // Include intermediate waypoints for accurate route display
  const intermediateWaypoints = []
  if (routeData.waypoints.length > 2) {
    for (let i = 1; i < routeData.waypoints.length - 1; i++) {
      intermediateWaypoints.push({
        location: new google.maps.LatLng(routeData.waypoints[i].lat, routeData.waypoints[i].lng),
        stopover: true
      })
    }
  }

  console.log(`Loading route with ${routeData.waypoints.length} total waypoints (${intermediateWaypoints.length} intermediate)`)

  directionsService.route(
    {
      origin,
      destination,
      waypoints: intermediateWaypoints,
      travelMode: google.maps.TravelMode.WALKING
    },
    (result, status) => {
      if (status === 'OK') {
        directionsRenderer.setDirections(result)

        // Center and zoom map to show the entire route
        const bounds = new google.maps.LatLngBounds()
        const routePath = result.routes[0].overview_path
        routePath.forEach(point => bounds.extend(point))
        map.fitBounds(bounds)

        console.log('Route displayed successfully on map')
      } else {
        console.error('Directions request failed:', status)
      }
    }
  )
}

const toggleFavorite = async () => {
  try {
    if (isFavorite.value) {
      await api.delete(`/favorites/${routeId}`)
      isFavorite.value = false
      console.log('Route removed from favorites')
    } else {
      await api.post(`/favorites/${routeId}`)
      isFavorite.value = true
      console.log('Route added to favorites')
    }
  } catch (error) {
    console.error('Error toggling favorite:', error)
    console.error('Error details:', error.response?.data)

    // If error says already favorited, update state to reflect that
    if (error.response?.data?.message === 'Route already in favorites') {
      isFavorite.value = true
    }
    // If error says not found, update state to reflect that
    else if (error.response?.data?.message === 'Favorite not found') {
      isFavorite.value = false
    }
    else {
      alert('Error updating favorite: ' + (error.response?.data?.message || 'Unknown error'))
    }
  }
}

const handleDelete = async () => {
  if (!window.confirm('Are you sure you want to delete this route?')) return

  try {
    await api.delete(`/routes/${routeId}`)
    router.push('/routes')
  } catch (error) {
    console.error('Error deleting route:', error)
    alert('Error deleting route')
  }
}

const startRenaming = () => {
  isRenaming.value = true
  newRouteName.value = route.value.route_name
  nextTick(() => {
    renameInput.value?.focus()
  })
}

const cancelRenaming = () => {
  isRenaming.value = false
  newRouteName.value = ''
}

const saveRename = async () => {
  if (!newRouteName.value.trim()) return

  try {
    await api.put(`/routes/${routeId}`, {
      route_name: newRouteName.value.trim()
    })

    // Update the route name locally
    routeData.value.route_name = newRouteName.value.trim()

    cancelRenaming()
  } catch (error) {
    console.error('Error renaming route:', error)
    alert('Error renaming route: ' + (error.response?.data?.message || 'Unknown error'))
  }
}
</script>

