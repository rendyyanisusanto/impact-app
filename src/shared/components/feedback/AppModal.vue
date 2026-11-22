<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { X as CloseIcon } from 'lucide-vue-next'

export interface AppModalProps {
  modelValue: boolean
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
}

const props = withDefaults(defineProps<AppModalProps>(), {
  title: '',
  description: '',
  size: 'md',
  closeOnBackdrop: true,
  closeOnEscape: true,
  showCloseButton: true
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}>()

const modalRef = ref<HTMLElement | null>(null)
let previousActiveElement: HTMLElement | null = null

const titleId = computed(() => `modal-title-${Math.random().toString(36).substring(2, 9)}`)
const descId = computed(() => `modal-desc-${Math.random().toString(36).substring(2, 9)}`)

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'max-w-sm'
    case 'lg':
      return 'max-w-lg'
    case 'xl':
      return 'max-w-2xl'
    case 'md':
    default:
      return 'max-w-md'
  }
})

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function handleBackdropClick(event: MouseEvent) {
  if (props.closeOnBackdrop && event.target === event.currentTarget) {
    close()
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.closeOnEscape) {
    event.preventDefault()
    close()
    return
  }

  // Focus trap
  if (event.key === 'Tab' && modalRef.value) {
    const focusable = modalRef.value.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusable.length === 0) return

    const firstElement = focusable[0]
    const lastElement = focusable[focusable.length - 1]

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }
  }
}

watch(
  () => props.modelValue,
  async isOpen => {
    if (typeof window === 'undefined') return

    if (isOpen) {
      previousActiveElement = document.activeElement as HTMLElement | null
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeydown)

      await nextTick()
      if (modalRef.value) {
        const firstFocusable = modalRef.value.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (firstFocusable) {
          firstFocusable.focus()
        } else {
          modalRef.value.focus()
        }
      }
    } else {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeydown)
      if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus()
      }
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    document.body.style.overflow = ''
    window.removeEventListener('keydown', handleKeydown)
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
        role="presentation"
        @click="handleBackdropClick"
      >
        <div
          ref="modalRef"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="title ? titleId : undefined"
          :aria-describedby="description ? descId : undefined"
          tabindex="-1"
          class="relative w-full rounded-card bg-surface shadow-modal border border-border flex flex-col max-h-[90vh] overflow-hidden focus:outline-none"
          :class="sizeClasses"
          @click.stop
        >
          <!-- Header -->
          <div
            v-if="title || $slots.header || showCloseButton"
            class="px-5 py-4 border-b border-border flex items-center justify-between shrink-0"
          >
            <slot name="header">
              <div>
                <h3 v-if="title" :id="titleId" class="text-base font-semibold text-content-primary">
                  {{ title }}
                </h3>
                <p v-if="description" :id="descId" class="text-xs text-content-secondary mt-0.5">
                  {{ description }}
                </p>
              </div>
            </slot>

            <button
              v-if="showCloseButton"
              type="button"
              class="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary ml-auto"
              aria-label="Tutup dialog"
              @click="close"
            >
              <CloseIcon class="w-4 h-4" />
            </button>
          </div>

          <!-- Body -->
          <div class="px-5 py-4 overflow-y-auto grow">
            <slot />
          </div>

          <!-- Footer -->
          <div
            v-if="$slots.footer"
            class="px-5 py-3.5 bg-surface-muted border-t border-border flex items-center justify-end gap-2 shrink-0"
          >
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
