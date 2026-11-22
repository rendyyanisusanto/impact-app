export type ComponentVariant =
  'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning' | 'info'

export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg'

export type ToastType = 'info' | 'success' | 'warning' | 'danger' | 'error'

export interface ToastItem {
  id: string
  title?: string
  message: string
  type: ToastType
  duration?: number
}
