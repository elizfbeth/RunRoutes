<template>
  <div class="bg-red-50 border border-red-200 rounded-lg p-4" :class="containerClass">
    <div class="flex items-start">
      <div class="flex-shrink-0">
        <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
      </div>
      <div class="ml-3 flex-1">
        <h3 class="text-sm font-medium text-red-800">
          {{ title }}
        </h3>
        <div class="mt-2 text-sm text-red-700">
          <p>{{ message }}</p>
          <p v-if="details" class="mt-1 text-xs text-red-600">{{ details }}</p>
        </div>
        <div v-if="showRetry" class="mt-4">
          <button
            @click="$emit('retry')"
            :disabled="retrying"
            class="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
          >
            {{ retrying ? 'Retrying...' : 'Try Again' }}
          </button>
        </div>
      </div>
      <div v-if="dismissible" class="ml-auto pl-3">
        <button
          @click="$emit('dismiss')"
          class="inline-flex text-red-400 hover:text-red-600 focus:outline-none"
        >
          <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: 'Error'
  },
  message: {
    type: String,
    required: true
  },
  details: {
    type: String,
    default: ''
  },
  showRetry: {
    type: Boolean,
    default: true
  },
  retrying: {
    type: Boolean,
    default: false
  },
  dismissible: {
    type: Boolean,
    default: true
  },
  containerClass: {
    type: String,
    default: ''
  }
})

defineEmits(['retry', 'dismiss'])
</script>

