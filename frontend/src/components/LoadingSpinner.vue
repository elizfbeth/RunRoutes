<template>
  <div class="flex items-center justify-center" :class="containerClass">
    <div 
      class="animate-spin rounded-full border-b-2"
      :class="[sizeClass, colorClass]"
    ></div>
    <span v-if="text" class="ml-3 text-gray-600">{{ text }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: {
    type: String,
    default: 'md', // xs, sm, md, lg, xl
    validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
  },
  color: {
    type: String,
    default: 'primary' // primary, white, gray
  },
  text: {
    type: String,
    default: ''
  },
  containerClass: {
    type: String,
    default: 'py-12'
  }
})

const sizeClass = computed(() => {
  const sizes = {
    xs: 'h-4 w-4',
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-20 w-20'
  }
  return sizes[props.size]
})

const colorClass = computed(() => {
  const colors = {
    primary: 'border-primary-600',
    white: 'border-white',
    gray: 'border-gray-600'
  }
  return colors[props.color]
})
</script>

