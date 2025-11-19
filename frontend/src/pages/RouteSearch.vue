<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-6 flex justify-between items-center">
      <h1 class="text-3xl font-bold text-gray-900">Routes</h1>
      <button
        @click="showGenerateForm = !showGenerateForm"
        class="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition"
      >
        {{ showGenerateForm ? 'Cancel' : 'Generate New Route' }}
      </button>
    </div>

    <div v-if="showGenerateForm" class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Generate Route</h2>
      <form @submit.prevent="handleGenerateRoute" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Route Name
          </label>
          <input
            v-model="generateData.route_name"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="My Running Route"
          />
        </div>
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Target Distance (km)
            </label>
            <input
              v-model.number="generateData.min_distance"
              type="number"
              step="0.1"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="5.0"
            />
            <p class="text-xs text-gray-500 mt-1">For circular routes: set start = end point</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Max Distance (km) <span class="text-gray-400">(optional)</span>
            </label>
            <input
              v-model.number="generateData.max_distance"
              type="number"
              step="0.1"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="10.0"
            />
          </div>
        </div>
        <div>
          <div class="flex justify-between items-center mb-2">
            <p class="text-sm text-gray-600">
              Click on the map to set your starting point
            </p>
            <button
              v-if="generateData.start_point.lat && !generateData.end_point.lat"
              @click="makeCircularRoute"
              type="button"
              class="bg-blue-600 text-white px-4 py-1 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
            >
              Make Circular Route
            </button>
          </div>
          <p class="text-xs text-gray-500 mb-2">
            For circular routes: Click "Make Circular Route" button after setting start point
          </p>
          <p v-if="generateData.start_point.lat" class="text-sm text-green-600">
            Start: {{ generateData.start_point.lat.toFixed(4) }}, {{ generateData.start_point.lng.toFixed(4) }}
          </p>
          <p v-if="generateData.end_point.lat" class="text-sm text-green-600">
            End: {{ generateData.end_point.lat.toFixed(4) }}, {{ generateData.end_point.lng.toFixed(4) }}
            <span v-if="isCircularRoute" class="ml-2 text-blue-600 font-semibold">(Circular Route)</span>
          </p>
          <button
            v-if="generateData.start_point.lat || generateData.end_point.lat"
            @click="clearPoints"
            type="button"
            class="mt-2 text-sm text-red-600 hover:text-red-700"
          >
            Clear Points
          </button>
        </div>
        <button
          type="submit"
          :disabled="loading || !generateData.start_point.lat || !generateData.end_point.lat"
          class="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50"
        >
          {{ loading ? 'Generating...' : 'Generate Route' }}
        </button>
      </form>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
      <!-- Routes List -->
      <div>
        <h2 class="text-xl font-semibold mb-4">Available Routes ({{ routes.length }})</h2>
        <div v-if="loading" class="text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        </div>
        <div v-else-if="routes.length === 0" class="bg-white rounded-lg shadow p-6 text-center">
          <p class="text-gray-500">No routes found</p>
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="route in routes"
            :key="route.id"
            :class="[
              'bg-white rounded-lg shadow p-4 hover:shadow-lg transition',
              selectedRoute?.id === route.id ? 'ring-2 ring-primary-600' : ''
            ]"
          >
            <div class="flex justify-between items-start">
              <div class="flex-1 cursor-pointer" @click="loadRouteDirections(route)">
                <h3 class="font-semibold text-lg">{{ route.route_name }}</h3>
                <div class="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                  <span>{{ route.distance }} km</span>
                  <span v-if="route.elevation_gain > 0">{{ route.elevation_gain }}m elevation</span>
                  <span>~{{ calculateEstimatedTime(route.distance) }} min</span>
                </div>
              </div>
              <div class="flex items-center space-x-2 ml-2">
                <button
                  @click.stop="startRenaming(route)"
                  class="text-gray-400 hover:text-primary-600 transition"
                  title="Rename route"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  @click.stop="handleDeleteRoute(route)"
                  class="text-gray-400 hover:text-red-600 transition"
                  title="Delete route"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Map Container - Always rendered -->
      <div class="sticky top-4">
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <div v-if="!isMapLoaded" class="flex items-center justify-center" style="width: 100%; height: 600px;">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
          <div ref="mapContainer" style="width: 100%; height: 600px;" v-show="isMapLoaded"></div>
        </div>
      </div>
    </div>

    <!-- Rename Modal -->
    <div v-if="renamingRoute" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="cancelRenaming">
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
import { ref, computed, onMounted, nextTick } from 'vue'
import { Loader } from '@googlemaps/js-api-loader'
import api from '../services/api'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

const routes = ref([])
const loading = ref(false)
const isMapLoaded = ref(false)
const mapContainer = ref(null)
let map = null
let directionsRenderer = null
let markers = []

const userPace = computed(() => {
  return authStore.user?.preferences?.pace || 6
})

const calculateEstimatedTime = (distance) => {
  const timeInMinutes = distance * userPace.value
  return Math.round(timeInMinutes)
}

const showGenerateForm = ref(false)
const generateData = ref({
  start_point: { lat: null, lng: null },
  end_point: { lat: null, lng: null },
  route_name: '',
  min_distance: null,
  max_distance: null
})

const selectedRoute = ref(null)
const directions = ref(null)
const renamingRoute = ref(null)
const newRouteName = ref('')
const renameInput = ref(null)

const isCircularRoute = computed(() => {
  return generateData.value.start_point.lat === generateData.value.end_point.lat &&
         generateData.value.start_point.lng === generateData.value.end_point.lng
})

const mapCenter = { lat: 1.3521, lng: 103.8198 } // Singapore

onMounted(async () => {
  await loadGoogleMaps()
  fetchRoutes()
})

const loadGoogleMaps = async () => {
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

    map = new google.maps.Map(mapContainer.value, {
      center: mapCenter,
      zoom: 13,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true
    })

    directionsRenderer = new google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: false
    })

    map.addListener('click', (e) => {
      if (!showGenerateForm.value) return

      const lat = e.latLng.lat()
      const lng = e.latLng.lng()

      if (!generateData.value.start_point.lat) {
        generateData.value.start_point = { lat, lng }
        addMarker({ lat, lng }, 'S', '#10b981')
      } else if (!generateData.value.end_point.lat) {
        generateData.value.end_point = { lat, lng }
        addMarker({ lat, lng }, 'E', '#ef4444')
      }
    })

    isMapLoaded.value = true
    console.log('Map initialized successfully')
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

const addMarker = (position, label, color) => {
  const marker = new google.maps.Marker({
    position,
    map,
    label,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: color,
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: '#fff'
    }
  })
  markers.push(marker)
}

const fetchRoutes = async () => {
  loading.value = true
  try {
    const response = await api.get('/routes?visibility=public')
    routes.value = response.data.routes
  } catch (error) {
    console.error('Error fetching routes:', error)
  } finally {
    loading.value = false
  }
}

const handleGenerateRoute = async () => {
  if (!generateData.value.start_point.lat || !generateData.value.end_point.lat) {
    alert('Please select start and end points on the map')
    return
  }

  loading.value = true
  try {
    const preferences = {}
    if (generateData.value.min_distance) {
      preferences.min_distance = generateData.value.min_distance
    }
    if (generateData.value.max_distance) {
      preferences.max_distance = generateData.value.max_distance
    }

    const response = await api.post('/routes/generate', {
      start_point: generateData.value.start_point,
      end_point: generateData.value.end_point,
      route_name: generateData.value.route_name || `Route ${new Date().toLocaleDateString()}`,
      preferences
    })

    const newRoute = response.data.route
    routes.value = [newRoute, ...routes.value]
    showGenerateForm.value = false
    generateData.value = {
      start_point: { lat: null, lng: null },
      end_point: { lat: null, lng: null },
      route_name: '',
      min_distance: null,
      max_distance: null
    }

    // Clear markers
    markers.forEach(m => m.setMap(null))
    markers = []

    // Automatically display the generated route on the map
    await loadRouteDirections(newRoute)

    alert('Route generated successfully!')
  } catch (error) {
    console.error('Error generating route:', error)
    alert('Error generating route: ' + (error.response?.data?.message || 'Unknown error'))
  } finally {
    loading.value = false
  }
}

const loadRouteDirections = async (route) => {
  if (!route.waypoints) {
    console.error('No waypoints in route')
    return
  }

  try {
    const directionsService = new google.maps.DirectionsService()

    // Parse waypoints - handle both string and array formats
    const waypoints = typeof route.waypoints === 'string'
      ? JSON.parse(route.waypoints)
      : route.waypoints

    console.log('📍 Parsed waypoints:', waypoints)

    if (!waypoints || waypoints.length < 2) {
      console.error('Not enough waypoints:', waypoints)
      return
    }

    const origin = `${waypoints[0].lat},${waypoints[0].lng}`
    const destination = `${waypoints[waypoints.length - 1].lat},${waypoints[waypoints.length - 1].lng}`

    // Include intermediate waypoints for circular routes
    const intermediateWaypoints = []
    if (waypoints.length > 2) {
      for (let i = 1; i < waypoints.length - 1; i++) {
        intermediateWaypoints.push({
          location: new google.maps.LatLng(waypoints[i].lat, waypoints[i].lng),
          stopover: true
        })
      }
    }

    console.log(`🗺️ Loading route: ${waypoints.length} total waypoints (${intermediateWaypoints.length} intermediate)`)
    console.log(`   Origin: ${origin}`)
    console.log(`   Destination: ${destination}`)

    directionsService.route(
      {
        origin,
        destination,
        waypoints: intermediateWaypoints,
        travelMode: google.maps.TravelMode.WALKING
      },
      (result, status) => {
        if (status === 'OK') {
          directions.value = result
          directionsRenderer.setDirections(result)
          selectedRoute.value = route

          // Center and zoom map to show the entire route
          const bounds = new google.maps.LatLngBounds()
          const routePath = result.routes[0].overview_path
          routePath.forEach(point => bounds.extend(point))
          map.fitBounds(bounds)

          console.log('Route displayed on map')
          console.log('Route starts at:', routePath[0].toString())
          console.log('Route ends at:', routePath[routePath.length - 1].toString())
          console.log('Total waypoints in path:', routePath.length)
        } else {
          console.error('ERROR: Directions request failed:', status)
        }
      }
    )
  } catch (error) {
    console.error('Error loading directions:', error)
  }
}

const startRenaming = (route) => {
  renamingRoute.value = route
  newRouteName.value = route.route_name
  nextTick(() => {
    renameInput.value?.focus()
  })
}

const cancelRenaming = () => {
  renamingRoute.value = null
  newRouteName.value = ''
}

const saveRename = async () => {
  if (!newRouteName.value.trim() || !renamingRoute.value) return

  try {
    await api.put(`/routes/${renamingRoute.value.id}`, {
      route_name: newRouteName.value.trim()
    })

    // Update the route in the list
    const index = routes.value.findIndex(r => r.id === renamingRoute.value.id)
    if (index !== -1) {
      routes.value[index].route_name = newRouteName.value.trim()
    }

    cancelRenaming()
  } catch (error) {
    console.error('Error renaming route:', error)
    alert('Error renaming route: ' + (error.response?.data?.message || 'Unknown error'))
  }
}

const handleDeleteRoute = async (route) => {
  if (!window.confirm(`Are you sure you want to delete "${route.route_name}"?`)) return

  try {
    await api.delete(`/routes/${route.id}`)

    // Remove from the routes list
    routes.value = routes.value.filter(r => r.id !== route.id)

    // Clear the map if this was the selected route
    if (selectedRoute.value?.id === route.id) {
      selectedRoute.value = null
      if (directionsRenderer) {
        directionsRenderer.setDirections({ routes: [] })
      }
    }
  } catch (error) {
    console.error('Error deleting route:', error)
    alert('Error deleting route: ' + (error.response?.data?.message || 'Unknown error'))
  }
}

const makeCircularRoute = () => {
  if (!generateData.value.start_point.lat) return

  // Set end point to exactly match start point for circular route
  generateData.value.end_point = {
    lat: generateData.value.start_point.lat,
    lng: generateData.value.start_point.lng
  }

  // Add a marker at the same location with label 'E'
  addMarker(generateData.value.end_point, 'E', '#ef4444')

  console.log('🔄 Created circular route - start and end are identical')
}

const clearPoints = () => {
  generateData.value.start_point = { lat: null, lng: null }
  generateData.value.end_point = { lat: null, lng: null }

  // Clear markers from map
  markers.forEach(m => m.setMap(null))
  markers = []

  console.log('🗑️ Cleared all points')
}
</script>

