<template>
  <div class="bg-white rounded-lg shadow p-8 text-center" :class="containerClass">
    <!-- Icon -->
    <div class="mx-auto w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-gray-100">
      <component :is="iconComponent" class="h-8 w-8 text-gray-400" />
    </div>

    <!-- Title -->
    <h3 class="text-lg font-medium text-gray-900 mb-2">
      {{ title }}
    </h3>

    <!-- Description -->
    <p class="text-gray-500 mb-6 max-w-md mx-auto">
      {{ description }}
    </p>

    <!-- Action Button -->
    <button
      v-if="showAction"
      @click="$emit('action')"
      class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
    >
      {{ actionText }}
    </button>

    <!-- Secondary Link -->
    <router-link
      v-if="linkTo"
      :to="linkTo"
      class="block mt-3 text-sm text-primary-600 hover:text-primary-700"
    >
      {{ linkText }}
    </router-link>
  </div>
</template>

<script setup>
import { computed, h } from 'vue'

const props = defineProps({
  icon: {
    type: String,
    default: 'map', // map, heart, route, folder
    validator: (value) => ['map', 'heart', 'route', 'folder'].includes(value)
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  actionText: {
    type: String,
    default: 'Get Started'
  },
  showAction: {
    type: Boolean,
    default: true
  },
  linkTo: {
    type: String,
    default: ''
  },
  linkText: {
    type: String,
    default: ''
  },
  containerClass: {
    type: String,
    default: ''
  }
})

defineEmits(['action'])

const iconComponent = computed(() => {
  const icons = {
    map: {
      render() {
        return h('svg', {
          fill: 'none',
          viewBox: '0 0 24 24',
          stroke: 'currentColor'
        }, [
          h('path', {
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            'stroke-width': '2',
            d: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7'
          })
        ])
      }
    },
    heart: {
      render() {
        return h('svg', {
          fill: 'none',
          viewBox: '0 0 24 24',
          stroke: 'currentColor'
        }, [
          h('path', {
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            'stroke-width': '2',
            d: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
          })
        ])
      }
    },
    route: {
      render() {
        return h('svg', {
          fill: 'none',
          viewBox: '0 0 24 24',
          stroke: 'currentColor'
        }, [
          h('path', {
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            'stroke-width': '2',
            d: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
          }),
          h('path', {
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            'stroke-width': '2',
            d: 'M15 11a3 3 0 11-6 0 3 3 0 016 0z'
          })
        ])
      }
    },
    folder: {
      render() {
        return h('svg', {
          fill: 'none',
          viewBox: '0 0 24 24',
          stroke: 'currentColor'
        }, [
          h('path', {
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            'stroke-width': '2',
            d: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z'
          })
        ])
      }
    }
  }
  return icons[props.icon]
})
</script>

