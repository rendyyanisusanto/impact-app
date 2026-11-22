<script setup lang="ts">
import { computed } from 'vue'
import {
  Info as InfoIcon,
  CheckCircle2 as SuccessIcon,
  AlertTriangle as WarningIcon,
  AlertCircle as DangerIcon,
  X as CloseIcon
} from 'lucide-vue-next'

export interface AppAlertProps {
  variant?: 'info' | 'success' | 'warning' | 'danger'
  title?: string
  dismissible?: boolean
}

const props = withDefaults(defineProps<AppAlertProps>(), {
  variant: 'info',
  title: '',
  dismissible: false
})

const emit = defineEmits<{
  (e: 'dismiss'): void
}>()

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'success':
      return 'bg-green-50/80 border-green-200 text-green-900'
    case 'warning':
      return 'bg-amber-50/80 border-amber-200 text-amber-900'
    case 'danger':
      return 'bg-red-50/80 border-red-200 text-red-900'
    case 'info':
    default:
      return 'bg-blue-50/80 border-blue-200 text-blue-900'
  }
})

const iconComponent = computed(() => {
  switch (props.variant) {
    case 'success':
      return SuccessIcon
    case 'warning':
      return WarningIcon
    case 'danger':
      return DangerIcon
    case 'info':
    default:
      return InfoIcon
  }
})

const iconColorClasses = computed(() => {
  switch (props.variant) {
    case 'success':
      return 'text-semantic-success'
    case 'warning':
      return 'text-semantic-warning'
    case 'danger':
      return 'text-semantic-danger'
    case 'info':
    default:
      return 'text-semantic-info'
  }
})
</script>

<template>
  <div
    class="border rounded-card p-3 sm:p-3.5 flex items-start gap-3 text-sm transition-all"
    :class="variantClasses"
    role="alert"
  >
    <component
      :is="iconComponent"
      class="w-5 h-5 shrink-0 mt-0.5"
      :class="iconColorClasses"
      aria-hidden="true"
    />
    <div class="grow min-w-0">
      <h5 v-if="title" class="font-semibold text-xs sm:text-sm mb-0.5">
        {{ title }}
      </h5>
      <div class="text-xs sm:text-sm leading-relaxed opacity-90">
        <slot />
      </div>
    </div>
    <button
      v-if="dismissible"
      type="button"
      class="shrink-0 p-1 rounded hover:bg-black/5 text-slate-500 hover:text-slate-800 transition-colors"
      aria-label="Tutup pemberitahuan"
      @click="emit('dismiss')"
    >
      <CloseIcon class="w-4 h-4" />
    </button>
  </div>
</template>
