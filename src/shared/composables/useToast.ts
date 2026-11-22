import { ref } from 'vue'
import type { ToastItem, ToastType } from '@/shared/types/ui.types'

const toasts = ref<ToastItem[]>([])

export function useToast() {
  function show(options: { title?: string; message: string; type?: ToastType; duration?: number }) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const duration = options.duration ?? 4000
    const item: ToastItem = {
      id,
      title: options.title,
      message: options.message,
      type: options.type ?? 'info',
      duration
    }

    toasts.value.push(item)

    if (duration > 0) {
      setTimeout(() => {
        dismiss(id)
      }, duration)
    }

    return id
  }

  function success(message: string, title?: string, duration?: number) {
    return show({ message, title, type: 'success', duration })
  }

  function error(message: string, title?: string, duration?: number) {
    return show({ message, title, type: 'danger', duration })
  }

  function warning(message: string, title?: string, duration?: number) {
    return show({ message, title, type: 'warning', duration })
  }

  function info(message: string, title?: string, duration?: number) {
    return show({ message, title, type: 'info', duration })
  }

  function dismiss(id: string) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  function clearAll() {
    toasts.value = []
  }

  return {
    toasts,
    show,
    success,
    error,
    warning,
    info,
    dismiss,
    clearAll
  }
}
