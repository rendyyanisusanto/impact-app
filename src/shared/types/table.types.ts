import type { SortDirection } from './api.types'

export interface TableColumn<T = Record<string, unknown>> {
  key: string
  label: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  width?: string
  minWidth?: string
  headerClass?: string
  cellClass?: string
  formatter?: (value: unknown, row: T) => string
}

export interface TableSortState {
  key: string
  direction: SortDirection
}
