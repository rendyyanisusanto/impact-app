<script setup lang="ts">
import type { BreadcrumbItem } from '@/shared/types/navigation.types'
import { ChevronRight as ChevronIcon } from 'lucide-vue-next'

export interface AppBreadcrumbProps {
  items: BreadcrumbItem[]
}

defineProps<AppBreadcrumbProps>()
</script>

<template>
  <nav aria-label="Breadcrumb" class="flex items-center text-xs text-content-secondary">
    <ol class="flex items-center flex-wrap gap-1.5">
      <li v-for="(item, index) in items" :key="index" class="flex items-center gap-1.5">
        <ChevronIcon
          v-if="index > 0"
          class="w-3.5 h-3.5 text-slate-400 shrink-0"
          aria-hidden="true"
        />

        <RouterLink
          v-if="item.to && index < items.length - 1"
          :to="item.to"
          class="hover:text-primary transition-colors hover:underline"
        >
          {{ item.label }}
        </RouterLink>

        <span
          v-else
          class="font-medium text-content-primary"
          :aria-current="index === items.length - 1 ? 'page' : undefined"
        >
          {{ item.label }}
        </span>
      </li>
    </ol>
  </nav>
</template>
