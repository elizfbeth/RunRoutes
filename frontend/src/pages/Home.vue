<template>
  <div class="min-h-screen">
    <!-- Hero Section -->
    <div class="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div class="text-center">
          <h1 class="text-4xl md:text-6xl font-bold mb-6">
            Discover Your Perfect Running Routes
          </h1>
          <p class="text-xl md:text-2xl mb-8 text-primary-100">
            Find, generate, and customize routes tailored to your fitness goals
          </p>
          <div v-if="!authStore.user" class="space-x-4">
            <router-link
              to="/register"
              class="bg-white text-primary-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary-50 transition"
            >
              Get Started
            </router-link>
            <router-link
              to="/login"
              class="bg-primary-700 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary-600 transition"
            >
              Sign In
            </router-link>
          </div>
          <router-link
            v-else
            to="/dashboard"
            class="bg-white text-primary-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary-50 transition inline-block"
          >
            Go to Dashboard
          </router-link>
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h2 class="text-3xl font-bold text-center mb-12">Features</h2>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="text-center p-6">
          <div class="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2">Route Discovery</h3>
          <p class="text-gray-600">
            Search and discover routes based on distance, terrain, and your preferences
          </p>
        </div>
        <div class="text-center p-6">
          <div class="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2">Route Generation</h3>
          <p class="text-gray-600">
            Generate custom routes using Google Maps API with elevation data
          </p>
        </div>
        <div class="text-center p-6">
          <div class="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2">Save Favorites</h3>
          <p class="text-gray-600">
            Save your favorite routes and access them anytime
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
</script>

