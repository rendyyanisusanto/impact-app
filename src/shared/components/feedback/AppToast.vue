<script setup lang="ts">
import { computed } from 'vue'
import type { ToastItem, ToastType } from '@/shared/types/ui.types'
import {
  CheckCircle2 as SuccessIcon,
  AlertCircle as DangerIcon,
  AlertTriangle as WarningIcon,
  Info as InfoIcon,
  X as CloseIcon
} from 'lucide-vue-next'

export interface AppToastProps {
  item?: ToastItem
  id?: string
  title?: string
  message?: string
  type?: ToastType | 'danger'
}

const props = withDefaults(defineProps<AppToastProps>(), {
  item: undefined,
  id: '',
  title: '',
  message: '',
  type: 'info'
})

const emit = defineEmits<{
  (e: 'dismiss', id: string): void
}>()

const activeId = computed(() => props.item?.id || props.id)
const activeTitle = computed(() => props.item?.title || props.title)
const activeMessage = computed(() => props.item?.message || props.message)
const activeType = computed(() => props.item?.type || props.type || 'info')

const iconComponent = computed(() => {
  switch (activeType.value) {
    case 'success':
      return SuccessIcon
    case 'danger':
    case 'error':
      return DangerIcon
    case 'warning':
      return WarningIcon
    case 'info':
    default:
      return InfoIcon
  }
})

const borderClasses = computed(() => {
  switch (activeType.value) {
    case 'success':
      return 'border-l-4 border-l-semantic-success text-slate-800'
    case 'danger':
    case 'error':
      return 'border-l-4 border-l-semantic-danger text-slate-800'
    case 'warning':
      return 'border-l-4 border-l-semantic-warning text-slate-800'
    case 'info':
    default:
      return 'border-l-4 border-l-semantic-info text-slate-800'
  }
})

const iconColorClasses = computed(() => {
  switch (activeType.value) {
    case 'success':
      return 'text-semantic-success'
    case 'danger':
    case 'error':
      return 'text-semantic-danger'
    case 'warning':
      return 'text-semantic-warning'
    case 'info':
    default:
      return 'text-semantic-info'
  }
})

function handleDismiss() {
  emit('dismiss', activeId.value)
}
</script>

<template>
  <div
    class="pointer-events-auto bg-surface border border-border shadow-dropdown rounded-card p-3.5 flex items-start gap-3 w-full"
    :class="borderClasses"
    role="status"
    aria-live="polite"
  >
    <component
      :is="iconComponent"
      class="w-5 h-5 shrink-0 mt-0.5"
      :class="iconColorClasses"
      aria-hidden="true"
    />

    <div class="grow min-w-0">
      <h6 v-if="activeTitle" class="text-xs font-semibold text-content-primary mb-0.5">
        {{ activeTitle }}
      </h6>
      <p class="text-xs text-content-secondary leading-snug">
        {{ activeMessage }}
      </p>
    </div>

    <button
      type="button"
      class="shrink-0 p-1 text-slate-400 hover:text-slate-700 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
      aria-label="Tutup notifikasi"
      @click="handleDismiss"
    >
      <CloseIcon class="w-3.5 h-3.5" />
    </button>
  </div>
</template>
