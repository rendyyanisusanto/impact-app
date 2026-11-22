import { ref } from 'vue'

export interface ConfirmDialogOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'primary' | 'danger' | 'warning'
}

interface DialogState extends ConfirmDialogOptions {
  isOpen: boolean
  resolve?: (value: boolean) => void
}

const state = ref<DialogState>({
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Konfirmasi',
  cancelText: 'Batal',
  variant: 'primary'
})

export function useConfirm() {
  function confirm(options: ConfirmDialogOptions): Promise<boolean> {
    return new Promise(resolve => {
      state.value = {
        isOpen: true,
        title: options.title,
        message: options.message,
        confirmText: options.confirmText ?? 'Konfirmasi',
        cancelText: options.cancelText ?? 'Batal',
        variant: options.variant ?? 'primary',
        resolve
      }
    })
  }

  function handleConfirm() {
    if (state.value.resolve) {
      state.value.resolve(true)
    }
    state.value.isOpen = false
  }

  function handleCancel() {
    if (state.value.resolve) {
      state.value.resolve(false)
    }
    state.value.isOpen = false
  }

  return {
    state,
    confirm,
    handleConfirm,
    handleCancel
  }
}
