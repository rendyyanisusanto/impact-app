<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { NAVIGATION_ITEMS } from '@/app/navigation/navigation.config'
import { generateBreadcrumbData } from '@/app/navigation/navigation.utils'
import type { BreadcrumbItem } from '@/app/navigation/navigation.types'
import { ChevronRight as ChevronRightIcon, Home as HomeIcon } from 'lucide-vue-next'

const route = useRoute()

const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  return generateBreadcrumbData(NAVIGATION_ITEMS, route.path)
})
</script>

<template>
  <nav
    v-if="breadcrumbs.length > 0"
    aria-label="Breadcrumb"
    class="py-2 px-3 sm:px-5 lg:px-6 w-full max-w-[1920px] mx-auto border-b border-[#D9E0E7] bg-[#F8FAFC]"
  >
    <ol class="flex items-center flex-wrap gap-1.5 text-xs text-[#64748B]">
      <template v-for="(item, index) in breadcrumbs" :key="index">
        <li class="inline-flex items-center gap-1.5">
          <!-- Separator between items -->
          <ChevronRightIcon
            v-if="index > 0"
            class="w-3.5 h-3.5 text-slate-400 shrink-0"
            aria-hidden="true"
          />

          <!-- First item with Home Icon -->
          <RouterLink
            v-if="index === 0 && item.to && !item.current"
            :to="item.to"
            class="inline-flex items-center gap-1 text-[#64748B] hover:text-[#0F766E] transition-colors"
          >
            <HomeIcon class="w-3.5 h-3.5 text-slate-400" />
            <span>{{ item.label }}</span>
          </RouterLink>

          <!-- Middle ancestor link -->
          <RouterLink
            v-else-if="item.to && !item.current"
            :to="item.to"
            class="hover:text-[#0F766E] hover:underline transition-colors truncate max-w-[180px] sm:max-w-none"
          >
            {{ item.label }}
          </RouterLink>

          <!-- Current active page (Non-clickable, bold) -->
          <span
            v-else-if="item.current"
            aria-current="page"
            class="font-semibold text-[#1F2937] truncate max-w-[220px] sm:max-w-none"
          >
            {{ item.label }}
          </span>

          <!-- Non-clickable label without route (e.g. parent category) -->
          <span v-else class="text-[#64748B] truncate max-w-[180px] sm:max-w-none">
            {{ item.label }}
          </span>
        </li>
      </template>
    </ol>
  </nav>
</template>
