<script setup lang="ts">
import AppSkeleton from '@/shared/components/ui/AppSkeleton.vue'

withDefaults(
  defineProps<{
    columnsCount?: number
    rowsCount?: number
    hasActions?: boolean
    hasCheckbox?: boolean
    density?: 'compact' | 'comfortable'
  }>(),
  {
    columnsCount: 6,
    rowsCount: 5,
    hasActions: true,
    hasCheckbox: false,
    density: 'compact'
  }
)
</script>

<template>
  <tbody
    class="divide-y divide-slate-100 text-xs bg-white"
    role="rowgroup"
    aria-busy="true"
    aria-label="Memuat data tabel..."
  >
    <tr
      v-for="rowIdx in rowsCount"
      :key="'skeleton-row-' + rowIdx"
      class="hover:bg-slate-50/50 transition-colors"
    >
      <!-- Optional Checkbox column -->
      <td
        v-if="hasCheckbox"
        class="w-10 text-center"
        :class="density === 'comfortable' ? 'px-4 py-3' : 'px-3.5 py-2'"
      >
        <div class="w-4 h-4 bg-slate-200 animate-pulse rounded mx-auto" />
      </td>

      <!-- Data Columns -->
      <td
        v-for="colIdx in columnsCount"
        :key="'skeleton-col-' + colIdx"
        :class="density === 'comfortable' ? 'px-4 py-3' : 'px-3.5 py-2'"
      >
        <AppSkeleton
          type="line"
          :height="density === 'comfortable' ? '16px' : '14px'"
          :width="colIdx === 1 ? '40%' : colIdx === 2 ? '75%' : '60%'"
        />
      </td>

      <!-- Action Column -->
      <td
        v-if="hasActions"
        class="text-right whitespace-nowrap"
        :class="density === 'comfortable' ? 'px-4 py-3' : 'px-3.5 py-2'"
      >
        <div class="flex items-center justify-end gap-1.5">
          <div class="w-6 h-6 bg-slate-200 animate-pulse rounded" />
          <div class="w-6 h-6 bg-slate-200 animate-pulse rounded" />
          <div class="w-6 h-6 bg-slate-200 animate-pulse rounded" />
        </div>
      </td>
    </tr>
  </tbody>
</template>
