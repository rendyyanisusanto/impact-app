<script setup lang="ts">
import { computed } from 'vue'
import AppSpinner from './AppSpinner.vue'

export interface AppButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  block?: boolean
}

const props = withDefaults(defineProps<AppButtonProps>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  block: false
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'secondary':
      return 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300 focus:ring-slate-400/40'
    case 'outline':
      return 'bg-white text-primary hover:bg-teal-50 border border-primary focus:ring-primary/40'
    case 'ghost':
      return 'bg-transparent text-slate-700 hover:bg-slate-100 border border-transparent focus:ring-slate-400/40'
    case 'danger':
      return 'bg-semantic-danger text-white hover:bg-red-700 border border-transparent focus:ring-red-500/40'
    case 'success':
      return 'bg-emerald-600 text-white hover:bg-emerald-700 border border-transparent focus:ring-emerald-500/40'
    case 'primary':
    default:
      return 'bg-primary text-white hover:bg-primary-hover border border-transparent focus:ring-primary/40'
  }
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'text-xs px-2.5 py-1 gap-1.5'
    case 'sm':
      return 'text-xs font-medium px-3 py-1.5 gap-1.5'
    case 'lg':
      return 'text-base font-medium px-5 py-2.5 gap-2.5'
    case 'md':
    default:
      return 'text-sm font-medium px-4 py-2 gap-2'
  }
})

const spinnerColor = computed(() => {
  if (props.variant === 'primary' || props.variant === 'danger' || props.variant === 'success') {
    return 'white'
  }
  return 'primary'
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
    class="inline-flex items-center justify-center rounded-btn transition-colors duration-150 select-none font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
    :class="[variantClasses, sizeClasses, block ? 'w-full' : '']"
    @click="handleClick"
  >
    <AppSpinner v-if="loading" :size="size === 'lg' ? 'md' : 'xs'" :color="spinnerColor" />
    <slot v-else name="left-icon" />
    <slot />
    <slot v-if="!loading" name="right-icon" />
  </button>
</template>
