<template>
  <div class="w-full">
    <div v-if="showLabel" class="flex justify-between mb-1">
      <span class="text-sm font-medium text-gray-700">{{ label }}</span>
      <span class="text-sm font-medium text-gray-700">{{ progress }}%</span>
    </div>
    <div class="w-full bg-gray-200 rounded-full h-2.5">
      <div 
        class="h-2.5 rounded-full transition-all duration-300 ease-in-out"
        :class="colorClass"
        :style="{ width: `${progress}%` }"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  progress: {
    type: Number,
    required: true,
    validator: (value) => value >= 0 && value <= 100
  },
  label: {
    type: String,
    default: 'Progress'
  },
  showLabel: {
    type: Boolean,
    default: true
  },
  color: {
    type: String,
    default: 'primary', // primary, success, warning, danger
    validator: (value) => ['primary', 'success', 'warning', 'danger'].includes(value)
  }
})

const colorClass = computed(() => {
  const colors = {
    primary: 'bg-primary-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600'
  }
  return colors[props.color]
})
</script>

