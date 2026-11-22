<script setup lang="ts">
import { computed } from 'vue'

export interface AppBadgeProps {
  variant?: 'primary' | 'neutral' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'xs' | 'sm' | 'md'
  dot?: boolean
}

const props = withDefaults(defineProps<AppBadgeProps>(), {
  variant: 'neutral',
  size: 'sm',
  dot: false
})

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-teal-50 text-primary border border-teal-200'
    case 'success':
      return 'bg-green-50 text-semantic-success border border-green-200'
    case 'warning':
      return 'bg-amber-50 text-semantic-warning border border-amber-200'
    case 'danger':
      return 'bg-red-50 text-semantic-danger border border-red-200'
    case 'info':
      return 'bg-blue-50 text-semantic-info border border-blue-200'
    case 'neutral':
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200'
  }
})

const dotColorClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-primary'
    case 'success':
      return 'bg-semantic-success'
    case 'warning':
      return 'bg-semantic-warning'
    case 'danger':
      return 'bg-semantic-danger'
    case 'info':
      return 'bg-semantic-info'
    case 'neutral':
    default:
      return 'bg-slate-400'
  }
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'text-[10px] px-1.5 py-0.5 gap-1'
    case 'md':
      return 'text-xs px-2.5 py-1 gap-1.5'
    case 'sm':
    default:
      return 'text-xs px-2 py-0.5 gap-1'
  }
})
</script>

<template>
  <span
    class="inline-flex items-center font-medium rounded-full leading-none whitespace-nowrap"
    :class="[variantClasses, sizeClasses]"
  >
    <span v-if="dot" class="w-1.5 h-1.5 rounded-full" :class="dotColorClasses" />
    <slot />
  </span>
</template>
