<script setup lang="ts">
import { Search as SearchIcon } from 'lucide-vue-next'
import AppInput from '@/shared/components/ui/AppInput.vue'

export interface AppTableToolbarProps {
  searchQuery?: string
  searchPlaceholder?: string
  showSearch?: boolean
}

withDefaults(defineProps<AppTableToolbarProps>(), {
  searchQuery: '',
  searchPlaceholder: 'Cari data...',
  showSearch: true
})

defineEmits<{
  (e: 'update:searchQuery', query: string): void
}>()
</script>

<template>
  <div
    class="p-3 sm:p-4 border-b border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface"
  >
    <div class="flex items-center gap-2.5 flex-1 max-w-md">
      <AppInput
        v-if="showSearch"
        :model-value="searchQuery"
        :placeholder="searchPlaceholder"
        size="sm"
        clearable
        @update:model-value="$emit('update:searchQuery', String($event))"
      >
        <template #prefix>
          <SearchIcon class="w-4 h-4 text-slate-400" />
        </template>
      </AppInput>

      <slot name="filters" />
    </div>

    <div v-if="$slots.actions" class="flex items-center gap-2 self-end sm:self-auto">
      <slot name="actions" />
    </div>
  </div>
</template>
