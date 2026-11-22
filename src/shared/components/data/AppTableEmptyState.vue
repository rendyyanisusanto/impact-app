<script setup lang="ts">
import AppEmptyState from '@/shared/components/feedback/AppEmptyState.vue'

export interface AppTableEmptyStateProps {
  title?: string
  description?: string
}

withDefaults(defineProps<AppTableEmptyStateProps>(), {
  title: 'Data Tidak Ditemukan',
  description: 'Tidak ada baris data yang cocok dengan kriteria pencarian atau filter Anda.'
})
</script>

<template>
  <tr>
    <td colspan="100" class="p-0 border-b border-border bg-surface">
      <AppEmptyState :title="title" :description="description">
        <template v-if="$slots.action" #action>
          <slot name="action" />
        </template>
      </AppEmptyState>
    </td>
  </tr>
</template>
