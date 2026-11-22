<script setup lang="ts">
import { computed } from 'vue'

export interface AppSkeletonProps {
  type?: 'line' | 'circle' | 'rect'
  width?: string
  height?: string
  count?: number
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
}

const props = withDefaults(defineProps<AppSkeletonProps>(), {
  type: 'line',
  width: '100%',
  height: undefined,
  count: 1,
  rounded: 'md'
})

const defaultHeight = computed(() => {
  if (props.height) return props.height
  if (props.type === 'circle') return '40px'
  if (props.type === 'rect') return '120px'
  return '16px'
})

const defaultWidth = computed(() => {
  if (props.type === 'circle' && !props.width) return '40px'
  return props.width
})

const roundedClass = computed(() => {
  if (props.type === 'circle') return 'rounded-full'
  switch (props.rounded) {
    case 'none':
      return 'rounded-none'
    case 'sm':
      return 'rounded'
    case 'lg':
      return 'rounded-lg'
    case 'full':
      return 'rounded-full'
    case 'md':
    default:
      return 'rounded-md'
  }
})
</script>

<template>
  <div class="space-y-2 w-full">
    <div
      v-for="i in count"
      :key="i"
      class="animate-pulse bg-slate-200"
      :class="roundedClass"
      :style="{ width: defaultWidth, height: defaultHeight }"
      aria-hidden="true"
    />
  </div>
</template>
