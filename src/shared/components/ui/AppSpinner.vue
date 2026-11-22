<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    size?: 'xs' | 'sm' | 'md' | 'lg'
    color?: 'primary' | 'white' | 'gray'
  }>(),
  {
    size: 'md',
    color: 'primary'
  }
)

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'w-3.5 h-3.5 border-2'
    case 'sm':
      return 'w-4 h-4 border-2'
    case 'lg':
      return 'w-8 h-8 border-3'
    case 'md':
    default:
      return 'w-5 h-5 border-2'
  }
})

const colorClasses = computed(() => {
  switch (props.color) {
    case 'white':
      return 'border-white/30 border-t-white'
    case 'gray':
      return 'border-gray-200 border-t-gray-600'
    case 'primary':
    default:
      return 'border-teal-200 border-t-primary'
  }
})
</script>

<template>
  <div
    class="inline-block rounded-full animate-spin"
    :class="[sizeClasses, colorClasses]"
    role="status"
    aria-label="Memuat..."
  >
    <span class="sr-only">Memuat...</span>
  </div>
</template>
