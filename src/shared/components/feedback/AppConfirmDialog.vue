<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted } from 'vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import AppButton from '@/shared/components/ui/AppButton.vue'
import {
  AlertTriangle as WarningIcon,
  AlertCircle as DangerIcon,
  HelpCircle as InfoIcon
} from 'lucide-vue-next'

export interface AppConfirmDialogProps {
  modelValue?: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  variant?: 'primary' | 'danger' | 'warning'
}

const props = withDefaults(defineProps<AppConfirmDialogProps>(), {
  modelValue: undefined,
  title: undefined,
  message: undefined,
  confirmText: undefined,
  cancelText: undefined,
  variant: undefined
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const { state, handleConfirm: storeConfirm, handleCancel: storeCancel } = useConfirm()

// If controlled via v-model, use props; otherwise use global confirm state
const isControlled = computed(() => props.modelValue !== undefined)
const isOpen = computed(() => (isControlled.value ? Boolean(props.modelValue) : state.value.isOpen))
const activeTitle = computed(() =>
  isControlled.value ? props.title || 'Konfirmasi' : state.value.title
)
const activeMessage = computed(() =>
  isControlled.value ? props.message || '' : state.value.message
)
const activeConfirmText = computed(() =>
  isControlled.value
    ? props.confirmText || 'Ya, Lanjutkan'
    : state.value.confirmText || 'Ya, Lanjutkan'
)
const activeCancelText = computed(() =>
  isControlled.value ? props.cancelText || 'Batal' : state.value.cancelText || 'Batal'
)
const activeVariant = computed(() =>
  isControlled.value ? props.variant || 'primary' : state.value.variant || 'primary'
)

function onConfirm() {
  if (isControlled.value) {
    emit('update:modelValue', false)
    emit('confirm')
  } else {
    storeConfirm()
  }
}

function onCancel() {
  if (isControlled.value) {
    emit('update:modelValue', false)
    emit('cancel')
  } else {
    storeCancel()
  }
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen.value) {
    onCancel()
  }
}

watch(isOpen, open => {
  if (typeof document !== 'undefined') {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
})

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeyDown)
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="activeTitle"
      >
        <div
          class="relative w-full max-w-md bg-surface rounded-modal shadow-modal border border-border p-5 text-left transform transition-all"
        >
          <div class="flex items-start gap-3.5">
            <div
              class="shrink-0 p-2 rounded-full"
              :class="{
                'bg-red-100 text-semantic-danger': activeVariant === 'danger',
                'bg-amber-100 text-semantic-warning': activeVariant === 'warning',
                'bg-teal-100 text-primary': activeVariant === 'primary'
              }"
            >
              <DangerIcon v-if="activeVariant === 'danger'" class="w-5 h-5" />
              <WarningIcon v-else-if="activeVariant === 'warning'" class="w-5 h-5" />
              <InfoIcon v-else class="w-5 h-5" />
            </div>

            <div class="grow min-w-0">
              <h3 class="text-sm font-semibold text-content-primary">
                {{ activeTitle }}
              </h3>
              <p class="mt-1 text-xs text-content-secondary leading-relaxed">
                {{ activeMessage }}
              </p>
            </div>
          </div>

          <div class="mt-5 flex items-center justify-end gap-2.5">
            <AppButton variant="secondary" size="sm" @click="onCancel">
              {{ activeCancelText }}
            </AppButton>
            <AppButton
              :variant="activeVariant === 'danger' ? 'danger' : 'primary'"
              size="sm"
              @click="onConfirm"
            >
              {{ activeConfirmText }}
            </AppButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
