<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
      <p class="mt-2 text-gray-600">Manage your routes and discover new ones</p>
    </div>

    <div class="mb-8">
      <router-link
        to="/routes"
        class="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition inline-block"
      >
        Generate New Route
      </router-link>
    </div>

    <!-- Error Message -->
    <ErrorMessage
      v-if="error && !loading"
      :message="error"
      title="Failed to load dashboard"
      :retrying="retrying"
      @retry="handleRetry"
      @dismiss="error = null"
      container-class="mb-6"
    />

    <!-- Loading State -->
    <div v-if="loading" class="grid md:grid-cols-2 gap-8">
      <div>
        <h2 class="text-2xl font-semibold mb-4">My Routes</h2>
        <SkeletonLoader type="list" :count="3" />
      </div>
      <div>
        <h2 class="text-2xl font-semibold mb-4">Favorites</h2>
        <SkeletonLoader type="list" :count="3" />
      </div>
    </div>

    <div v-else class="grid md:grid-cols-2 gap-8">
      <!-- My Routes -->
      <div>
        <h2 class="text-2xl font-semibold mb-4">My Routes</h2>
        
        <!-- Empty State -->
        <EmptyState
          v-if="routes.length === 0"
          icon="map"
          title="No routes yet"
          description="Start your journey by creating your first route. Choose from circular routes, point-to-point paths, or let us generate a route for you!"
          action-text="Create Your First Route"
          link-to="/routes"
          link-text="Explore route options →"
          @action="$router.push('/routes')"
        />
        
        <!-- Routes List -->
        <div v-else class="space-y-4">
          <router-link
            v-for="route in routes.slice(0, 5)"
            :key="route.id"
            :to="`/routes/${route.id}`"
            class="block bg-white rounded-lg shadow p-4 hover:shadow-lg transition"
          >
            <h3 class="font-semibold text-lg">{{ route.route_name }}</h3>
            <div class="mt-2 flex items-center space-x-4 text-sm text-gray-600">
              <span>{{ route.distance }} km</span>
              <span v-if="route.elevation_gain > 0">{{ route.elevation_gain }}m elevation</span>
              <span>~{{ calculateEstimatedTime(route.distance) }} min</span>
            </div>
          </router-link>
          <router-link
            v-if="routes.length > 5"
            to="/routes"
            class="block text-center text-primary-600 hover:text-primary-700 font-medium py-2"
          >
            View all {{ routes.length }} routes →
          </router-link>
        </div>
      </div>

      <!-- Favorites -->
      <div>
        <h2 class="text-2xl font-semibold mb-4">Favorites</h2>
        
        <!-- Empty State -->
        <EmptyState
          v-if="favorites.length === 0"
          icon="heart"
          title="No favorites yet"
          description="Save your favorite routes to access them quickly. Click the heart icon on any route to add it to your favorites!"
          :show-action="false"
          link-to="/routes"
          link-text="Browse routes →"
        />
        
        <!-- Favorites List -->
        <div v-else class="space-y-4">
          <router-link
            v-for="route in favorites.slice(0, 5)"
            :key="route.id"
            :to="`/routes/${route.id}`"
            class="block bg-white rounded-lg shadow p-4 hover:shadow-lg transition"
          >
            <h3 class="font-semibold text-lg">{{ route.route_name }}</h3>
            <div class="mt-2 flex items-center space-x-4 text-sm text-gray-600">
              <span>{{ route.distance }} km</span>
              <span v-if="route.elevation_gain > 0">{{ route.elevation_gain }}m elevation</span>
              <span>~{{ calculateEstimatedTime(route.distance) }} min</span>
            </div>
          </router-link>
          <router-link
            v-if="favorites.length > 5"
            to="/routes"
            class="block text-center text-primary-600 hover:text-primary-700 font-medium py-2"
          >
            View all {{ favorites.length }} favorites →
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'
import { useAuthStore } from '../stores/auth'
import { apiCache } from '../utils/cache'
import EmptyState from '../components/EmptyState.vue'
import SkeletonLoader from '../components/SkeletonLoader.vue'
import ErrorMessage from '../components/ErrorMessage.vue'

const authStore = useAuthStore()

const routes = ref([])
const favorites = ref([])
const loading = ref(true)
const error = ref(null)
const retrying = ref(false)

const userPace = computed(() => {
  return authStore.user?.preferences?.pace || 6
})

const calculateEstimatedTime = (distance) => {
  const timeInMinutes = distance * userPace.value
  return Math.round(timeInMinutes)
}

const fetchRoutes = async (useCache = true) => {
  try {
    error.value = null
    
    // Check cache first
    if (useCache) {
      const cached = apiCache.get('dashboard-routes')
      if (cached) {
        routes.value = cached
        return
      }
    }

    const response = await api.get('/routes?user_id=me')
    routes.value = response.data.routes || []
    
    // Cache for 5 minutes
    apiCache.set('dashboard-routes', routes.value, 5 * 60 * 1000)
  } catch (err) {
    console.error('Error fetching routes:', err)
    error.value = err.response?.data?.message || 'Failed to load your routes. Please try again.'
    routes.value = []
  } finally {
    loading.value = false
    retrying.value = false
  }
}

const fetchFavorites = async (useCache = true) => {
  try {
    // Check cache first
    if (useCache) {
      const cached = apiCache.get('dashboard-favorites')
      if (cached) {
        favorites.value = cached
        return
      }
    }

    const response = await api.get('/favorites')
    favorites.value = response.data.favorites || []
    
    // Cache for 5 minutes
    apiCache.set('dashboard-favorites', favorites.value, 5 * 60 * 1000)
  } catch (err) {
    console.error('Error fetching favorites:', err)
    favorites.value = []
  }
}

const handleRetry = async () => {
  retrying.value = true
  loading.value = true
  await fetchRoutes(false) // Don't use cache on retry
  await fetchFavorites(false)
}

onMounted(async () => {
  await fetchRoutes()
  fetchFavorites()
})
</script>

