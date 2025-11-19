<template>
  <div class="animate-pulse">
    <!-- Route Card Skeleton -->
    <div v-if="type === 'card'" class="bg-white rounded-lg shadow p-4 space-y-3">
      <div class="h-4 bg-gray-200 rounded w-3/4"></div>
      <div class="space-y-2">
        <div class="h-3 bg-gray-200 rounded w-1/2"></div>
        <div class="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>

    <!-- Map Skeleton -->
    <div v-else-if="type === 'map'" class="bg-gray-200 rounded-lg" :style="{ height: height }">
      <div class="h-full flex items-center justify-center">
        <div class="text-gray-400 text-center">
          <svg class="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p class="text-sm">Loading map...</p>
        </div>
      </div>
    </div>

    <!-- Text Skeleton -->
    <div v-else-if="type === 'text'" class="space-y-2">
      <div v-for="i in lines" :key="i" class="h-4 bg-gray-200 rounded" :class="i === lines ? 'w-2/3' : 'w-full'"></div>
    </div>

    <!-- List Skeleton -->
    <div v-else-if="type === 'list'" class="space-y-4">
      <div v-for="i in count" :key="i" class="bg-white rounded-lg shadow p-4 space-y-3">
        <div class="h-4 bg-gray-200 rounded w-3/4"></div>
        <div class="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'card', // card, map, text, list
    validator: (value) => ['card', 'map', 'text', 'list'].includes(value)
  },
  height: {
    type: String,
    default: '400px'
  },
  lines: {
    type: Number,
    default: 3
  },
  count: {
    type: Number,
    default: 3
  }
})
</script>

