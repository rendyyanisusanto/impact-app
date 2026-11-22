<script setup lang="ts">
import { Inbox as EmptyIcon } from 'lucide-vue-next'

export interface AppEmptyStateProps {
  title?: string
  description?: string
  icon?: unknown
}

withDefaults(defineProps<AppEmptyStateProps>(), {
  title: 'Tidak Ada Data',
  description: 'Belum ada data yang tersedia pada tabel atau modul ini.',
  icon: undefined
})
</script>

<template>
  <div class="py-10 px-4 text-center flex flex-col items-center justify-center">
    <div
      class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3"
    >
      <slot name="icon">
        <component :is="icon || EmptyIcon" class="w-6 h-6" />
      </slot>
    </div>
    <h4 class="text-sm font-semibold text-content-primary">
      {{ title }}
    </h4>
    <p class="text-xs text-content-secondary max-w-sm mt-1">
      {{ description }}
    </p>
    <div v-if="$slots.action" class="mt-4">
      <slot name="action" />
    </div>
  </div>
</template>
