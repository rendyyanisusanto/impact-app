<script setup lang="ts">
import { computed } from 'vue'
import AppSpinner from './AppSpinner.vue'

export interface AppIconButtonProps {
  label: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const props = withDefaults(defineProps<AppIconButtonProps>(), {
  variant: 'ghost',
  size: 'md',
  disabled: false,
  loading: false,
  type: 'button'
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-primary text-white hover:bg-primary-hover focus:ring-primary/40'
    case 'secondary':
      return 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 focus:ring-slate-400/40'
    case 'outline':
      return 'bg-white text-slate-700 hover:bg-slate-50 border border-border focus:ring-primary/40'
    case 'danger':
      return 'bg-semantic-danger text-white hover:bg-red-700 focus:ring-red-500/40'
    case 'ghost':
    default:
      return 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-400/40'
  }
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'w-6 h-6 p-1 text-xs'
    case 'sm':
      return 'w-8 h-8 p-1.5 text-sm'
    case 'lg':
      return 'w-11 h-11 p-2.5 text-base'
    case 'md':
    default:
      return 'w-9 h-9 p-2 text-sm'
  }
})

function handleClick(event: MouseEvent) {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-label="label"
    :title="label"
    class="inline-flex items-center justify-center rounded-btn transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
    :class="[variantClasses, sizeClasses]"
    @click="handleClick"
  >
    <AppSpinner
      v-if="loading"
      :size="size === 'lg' ? 'sm' : 'xs'"
      :color="variant === 'primary' || variant === 'danger' ? 'white' : 'primary'"
    />
    <slot v-else />
  </button>
</template>
