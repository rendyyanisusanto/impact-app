<script setup lang="ts" generic="T extends Record<string, unknown>">
import { ref, computed } from 'vue'
import type { TableColumn, TableSortState } from '@/shared/types/table.types'
import AppPagination from '@/shared/components/navigation/AppPagination.vue'
import AppCheckbox from '@/shared/components/ui/AppCheckbox.vue'
import AppSkeleton from '@/shared/components/ui/AppSkeleton.vue'
import AppTableEmptyState from './AppTableEmptyState.vue'
import {
  ArrowUpDown as SortDefaultIcon,
  ArrowUp as SortAscIcon,
  ArrowDown as SortDescIcon
} from 'lucide-vue-next'

export interface AppDataTableProps<R extends Record<string, unknown>> {
  columns: TableColumn<R>[]
  data: R[]
  rowKey?: string
  loading?: boolean
  selectable?: boolean
  selectedRows?: R[]
  density?: 'compact' | 'comfortable'
  // Sorting
  sortable?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  clientSort?: boolean
  // Pagination
  paginated?: boolean
  currentPage?: number
  pageSize?: number
  totalItems?: number
  clientPagination?: boolean
  // Empty state
  emptyTitle?: string
  emptyDescription?: string
}

const props = withDefaults(defineProps<AppDataTableProps<T>>(), {
  rowKey: 'id',
  loading: false,
  selectable: false,
  selectedRows: () => [],
  density: 'compact',
  sortable: true,
  sortBy: '',
  sortOrder: 'asc',
  clientSort: true,
  paginated: true,
  currentPage: 1,
  pageSize: 10,
  totalItems: undefined,
  clientPagination: true,
  emptyTitle: 'Tidak Ada Data',
  emptyDescription: 'Belum ada data untuk ditampilkan saat ini.'
})

const emit = defineEmits<{
  (e: 'update:selectedRows', rows: T[]): void
  (e: 'update:currentPage', page: number): void
  (e: 'update:pageSize', size: number): void
  (e: 'sort', sortState: TableSortState): void
  (e: 'row-click', row: T, index: number): void
}>()

// Internal sort state for clientSort
const internalSort = ref<TableSortState>({
  key: props.sortBy,
  direction: props.sortOrder
})

// Internal page state for clientPagination
const internalCurrentPage = ref(props.currentPage)
const internalPageSize = ref(props.pageSize)

// Density classes
const cellPaddingClass = computed(() => {
  return props.density === 'comfortable' ? 'px-4 py-3' : 'px-3.5 py-2'
})
const headerPaddingClass = computed(() => {
  return props.density === 'comfortable' ? 'px-4 py-3' : 'px-3.5 py-2.5'
})

// Client-side sorting
const sortedData = computed<T[]>(() => {
  if (!props.clientSort || !internalSort.value.key) {
    return props.data
  }

  const key = internalSort.value.key
  const dir = internalSort.value.direction === 'asc' ? 1 : -1

  return [...props.data].sort((a, b) => {
    const valA = a[key]
    const valB = b[key]

    if (valA === valB) return 0
    if (valA === null || valA === undefined) return 1
    if (valB === null || valB === undefined) return -1

    if (typeof valA === 'number' && typeof valB === 'number') {
      return (valA - valB) * dir
    }

    return String(valA).localeCompare(String(valB)) * dir
  })
})

// Total count
const effectiveTotal = computed(() => {
  if (props.totalItems !== undefined) return props.totalItems
  return props.data.length
})

// Current page and size
const activePage = computed(() =>
  props.clientPagination ? internalCurrentPage.value : props.currentPage
)
const activePageSize = computed(() =>
  props.clientPagination ? internalPageSize.value : props.pageSize
)

// Paginated slice
const displayData = computed<T[]>(() => {
  if (!props.clientPagination || !props.paginated) {
    return sortedData.value
  }

  const start = (activePage.value - 1) * activePageSize.value
  const end = start + activePageSize.value
  return sortedData.value.slice(start, end)
})

// Selection
function isRowSelected(row: T): boolean {
  const key = props.rowKey as keyof T
  return props.selectedRows.some(r => r[key] === row[key])
}

const isAllSelected = computed(() => {
  if (displayData.value.length === 0) return false
  const key = props.rowKey as keyof T
  return displayData.value.every(row => props.selectedRows.some(r => r[key] === row[key]))
})

const isIndeterminate = computed(() => {
  if (displayData.value.length === 0) return false
  const key = props.rowKey as keyof T
  const selectedCount = displayData.value.filter(row =>
    props.selectedRows.some(r => r[key] === row[key])
  ).length
  return selectedCount > 0 && selectedCount < displayData.value.length
})

function toggleSelectAll() {
  const key = props.rowKey as keyof T
  if (isAllSelected.value) {
    const currentKeys = new Set(displayData.value.map(r => r[key]))
    emit(
      'update:selectedRows',
      props.selectedRows.filter(r => !currentKeys.has(r[key]))
    )
  } else {
    const newSelected = [...props.selectedRows]
    for (const row of displayData.value) {
      if (!newSelected.some(r => r[key] === row[key])) {
        newSelected.push(row)
      }
    }
    emit('update:selectedRows', newSelected)
  }
}

function toggleSelectRow(row: T) {
  const key = props.rowKey as keyof T
  const exists = props.selectedRows.some(r => r[key] === row[key])
  if (exists) {
    emit(
      'update:selectedRows',
      props.selectedRows.filter(r => r[key] !== row[key])
    )
  } else {
    emit('update:selectedRows', [...props.selectedRows, row])
  }
}

// Sorting handler
function handleSort(col: TableColumn<T>) {
  if (!props.sortable || col.sortable === false) return

  let nextDir: 'asc' | 'desc' = 'asc'
  if (internalSort.value.key === col.key) {
    nextDir = internalSort.value.direction === 'asc' ? 'desc' : 'asc'
  }

  internalSort.value = {
    key: col.key,
    direction: nextDir
  }

  emit('sort', { key: col.key, direction: nextDir })
}

// Pagination handler
function handlePageChange(newPage: number) {
  internalCurrentPage.value = newPage
  emit('update:currentPage', newPage)
}

function handlePageSizeChange(newSize: number) {
  internalPageSize.value = newSize
  internalCurrentPage.value = 1
  emit('update:pageSize', newSize)
  emit('update:currentPage', 1)
}
</script>

<template>
  <div class="w-full bg-surface border border-border rounded-card overflow-hidden shadow-card">
    <!-- Optional Toolbar Slot -->
    <slot name="toolbar" />

    <!-- Table Horizontal Scroll Container -->
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <!-- Header -->
        <thead>
          <tr
            class="bg-surface-muted border-b border-border text-[11px] font-semibold text-content-secondary uppercase tracking-wider"
          >
            <!-- Select All Checkbox -->
            <th v-if="selectable" class="w-10 text-center" :class="headerPaddingClass">
              <AppCheckbox
                :model-value="isAllSelected"
                :indeterminate="isIndeterminate"
                @update:model-value="toggleSelectAll"
              />
            </th>

            <!-- Columns -->
            <th
              v-for="col in columns"
              :key="col.key"
              class="whitespace-nowrap"
              :class="[
                headerPaddingClass,
                col.align === 'center'
                  ? 'text-center'
                  : col.align === 'right'
                    ? 'text-right'
                    : 'text-left',
                col.headerClass || '',
                props.sortable && col.sortable !== false
                  ? 'cursor-pointer select-none hover:text-content-primary'
                  : ''
              ]"
              :style="{ width: col.width, minWidth: col.minWidth }"
              @click="handleSort(col)"
            >
              <div
                class="inline-flex items-center gap-1.5"
                :class="[
                  col.align === 'center'
                    ? 'justify-center'
                    : col.align === 'right'
                      ? 'justify-end'
                      : 'justify-start'
                ]"
              >
                <span>{{ col.label }}</span>
                <span v-if="props.sortable && col.sortable !== false" class="text-slate-400">
                  <SortAscIcon
                    v-if="internalSort.key === col.key && internalSort.direction === 'asc'"
                    class="w-3.5 h-3.5 text-primary"
                  />
                  <SortDescIcon
                    v-else-if="internalSort.key === col.key && internalSort.direction === 'desc'"
                    class="w-3.5 h-3.5 text-primary"
                  />
                  <SortDefaultIcon v-else class="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                </span>
              </div>
            </th>

            <!-- Actions Header -->
            <th
              v-if="$slots.actions"
              class="text-right whitespace-nowrap w-24"
              :class="headerPaddingClass"
            >
              Aksi
            </th>
          </tr>
        </thead>

        <!-- Body -->
        <tbody class="divide-y divide-border text-xs text-content-primary bg-surface">
          <!-- Loading State -->
          <template v-if="loading">
            <tr
              v-for="idx in activePageSize || 5"
              :key="'skeleton-' + idx"
              class="hover:bg-slate-50/50"
            >
              <td v-if="selectable" class="text-center" :class="cellPaddingClass">
                <div class="w-4 h-4 bg-slate-200 animate-pulse rounded mx-auto" />
              </td>
              <td v-for="col in columns" :key="col.key" :class="cellPaddingClass">
                <AppSkeleton type="line" height="14px" />
              </td>
              <td v-if="$slots.actions" class="text-right" :class="cellPaddingClass">
                <AppSkeleton type="line" height="14px" width="40px" class="ml-auto" />
              </td>
            </tr>
          </template>

          <!-- Empty State -->
          <template v-else-if="displayData.length === 0">
            <AppTableEmptyState :title="emptyTitle" :description="emptyDescription" />
          </template>

          <!-- Data Rows -->
          <template v-else>
            <tr
              v-for="(row, rIdx) in displayData"
              :key="String(row[rowKey as keyof T] ?? rIdx)"
              class="hover:bg-slate-50 transition-colors cursor-default"
              :class="{ 'bg-teal-50/40': isRowSelected(row) }"
              @click="$emit('row-click', row, rIdx)"
            >
              <!-- Row Selection Checkbox -->
              <td v-if="selectable" class="text-center" :class="cellPaddingClass" @click.stop>
                <AppCheckbox
                  :model-value="isRowSelected(row)"
                  @update:model-value="toggleSelectRow(row)"
                />
              </td>

              <!-- Row Cells -->
              <td
                v-for="col in columns"
                :key="col.key"
                :class="[
                  cellPaddingClass,
                  col.align === 'center'
                    ? 'text-center'
                    : col.align === 'right'
                      ? 'text-right'
                      : 'text-left',
                  col.cellClass || ''
                ]"
              >
                <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]" :index="rIdx">
                  <span v-if="col.formatter">
                    {{ col.formatter(row[col.key], row) }}
                  </span>
                  <span v-else>
                    {{ row[col.key] !== null && row[col.key] !== undefined ? row[col.key] : '-' }}
                  </span>
                </slot>
              </td>

              <!-- Actions Cell -->
              <td
                v-if="$slots.actions"
                :class="[cellPaddingClass, 'text-right whitespace-nowrap']"
                @click.stop
              >
                <slot name="actions" :row="row" :index="rIdx" />
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Pagination Footer -->
    <div
      v-if="paginated && effectiveTotal > 0"
      class="px-4 py-2.5 border-t border-border bg-surface-muted"
    >
      <AppPagination
        :current-page="activePage"
        :total-items="effectiveTotal"
        :page-size="activePageSize"
        @update:current-page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </div>
  </div>
</template>
