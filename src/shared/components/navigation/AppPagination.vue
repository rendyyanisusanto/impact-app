<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft as PrevIcon, ChevronRight as NextIcon } from 'lucide-vue-next'

export interface AppPaginationProps {
  currentPage: number
  totalItems: number
  pageSize: number
  pageSizeOptions?: number[]
}

const props = withDefaults(defineProps<AppPaginationProps>(), {
  pageSizeOptions: () => [10, 25, 50, 100]
})

const emit = defineEmits<{
  (e: 'update:currentPage', page: number): void
  (e: 'update:pageSize', size: number): void
  (e: 'change', payload: { page: number; pageSize: number }): void
}>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.totalItems / props.pageSize)))

const startItem = computed(() => {
  if (props.totalItems === 0) return 0
  return (props.currentPage - 1) * props.pageSize + 1
})

const endItem = computed(() => {
  return Math.min(props.totalItems, props.currentPage * props.pageSize)
})

const visiblePages = computed<(number | 'ellipsis')[]>(() => {
  const total = totalPages.value
  const current = props.currentPage

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | 'ellipsis')[] = [1]

  if (current > 3) {
    pages.push('ellipsis')
  }

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < total - 2) {
    pages.push('ellipsis')
  }

  pages.push(total)
  return pages
})

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value && page !== props.currentPage) {
    emit('update:currentPage', page)
    emit('change', { page, pageSize: props.pageSize })
  }
}

function handlePageSizeChange(event: Event) {
  const target = event.target as HTMLSelectElement
  const newSize = parseInt(target.value, 10)
  emit('update:pageSize', newSize)
  emit('update:currentPage', 1)
  emit('change', { page: 1, pageSize: newSize })
}
</script>

<template>
  <div
    class="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-content-secondary py-2 select-none"
  >
    <div class="flex items-center gap-3">
      <span>
        Menampilkan <strong class="text-content-primary">{{ startItem }}</strong> -
        <strong class="text-content-primary">{{ endItem }}</strong> dari
        <strong class="text-content-primary">{{ totalItems }}</strong> data
      </span>

      <div class="flex items-center gap-1.5 pl-2 border-l border-border">
        <span>Baris per halaman:</span>
        <select
          :value="pageSize"
          class="rounded-input border border-border bg-surface px-2 py-1 text-xs text-content-primary focus:outline-none focus:ring-1 focus:ring-primary"
          @change="handlePageSizeChange"
        >
          <option v-for="opt in pageSizeOptions" :key="opt" :value="opt">
            {{ opt }}
          </option>
        </select>
      </div>
    </div>

    <nav aria-label="Navigasi Halaman" class="flex items-center gap-1">
      <button
        type="button"
        :disabled="currentPage <= 1"
        class="p-1.5 rounded-btn border border-border bg-surface text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-primary"
        aria-label="Halaman Sebelumnya"
        @click="goToPage(currentPage - 1)"
      >
        <PrevIcon class="w-4 h-4" />
      </button>

      <template v-for="(page, idx) in visiblePages" :key="idx">
        <span v-if="page === 'ellipsis'" class="px-2 py-1 text-slate-400"> ... </span>
        <button
          v-else
          type="button"
          :aria-current="currentPage === page ? 'page' : undefined"
          class="min-w-7 h-7 px-2 flex items-center justify-center rounded-btn text-xs font-medium border transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
          :class="[
            currentPage === page
              ? 'bg-primary text-white border-primary'
              : 'bg-surface text-slate-700 border-border hover:bg-slate-50'
          ]"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
      </template>

      <button
        type="button"
        :disabled="currentPage >= totalPages"
        class="p-1.5 rounded-btn border border-border bg-surface text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-primary"
        aria-label="Halaman Berikutnya"
        @click="goToPage(currentPage + 1)"
      >
        <NextIcon class="w-4 h-4" />
      </button>
    </nav>
  </div>
</template>
