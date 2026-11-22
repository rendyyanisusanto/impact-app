<script setup lang="ts">
import AppCard from '@/shared/components/ui/AppCard.vue'
import AppSkeleton from '@/shared/components/ui/AppSkeleton.vue'
import AppBadge from '@/shared/components/ui/AppBadge.vue'
import { LineChart, BarChart3, PieChart } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    chartType?: 'line' | 'bar' | 'donut'
    badgeLabel?: string
    description?: string
    loading?: boolean
  }>(),
  {
    subtitle: '',
    chartType: 'line',
    badgeLabel: 'Sprint 2 Scope',
    description: '',
    loading: false
  }
)
</script>

<template>
  <AppCard :title="title" :subtitle="subtitle" class="h-full flex flex-col">
    <template #actions>
      <AppBadge variant="neutral" size="xs">
        {{ badgeLabel }}
      </AppBadge>
    </template>

    <div v-if="loading" class="py-6 space-y-3">
      <AppSkeleton type="rect" height="180px" />
      <div class="flex justify-between">
        <AppSkeleton type="line" width="60px" />
        <AppSkeleton type="line" width="60px" />
        <AppSkeleton type="line" width="60px" />
      </div>
    </div>

    <div
      v-else
      class="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50/70 rounded-lg border border-dashed border-slate-200 text-center min-h-[220px]"
    >
      <!-- Line Chart Visual Skeleton -->
      <div v-if="chartType === 'line'" class="w-full max-w-sm mb-3 opacity-60">
        <svg
          class="w-full h-24 stroke-teal-600"
          viewBox="0 0 300 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <!-- Grid lines -->
          <line x1="0" y1="20" x2="300" y2="20" stroke="#E2E8F0" stroke-dasharray="4 4" />
          <line x1="0" y1="40" x2="300" y2="40" stroke="#E2E8F0" stroke-dasharray="4 4" />
          <line x1="0" y1="60" x2="300" y2="60" stroke="#E2E8F0" stroke-dasharray="4 4" />
          <!-- Trend curve -->
          <path
            d="M 10 65 Q 60 50 100 55 T 180 30 T 250 35 T 290 15"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
          />
          <!-- Trend area -->
          <path
            d="M 10 65 Q 60 50 100 55 T 180 30 T 250 35 T 290 15 L 290 75 L 10 75 Z"
            fill="#0F766E"
            fill-opacity="0.08"
          />
        </svg>
      </div>

      <!-- Bar Chart Visual Skeleton -->
      <div
        v-else-if="chartType === 'bar'"
        class="w-full max-w-xs mb-3 flex items-end justify-center gap-3 h-20 opacity-60"
      >
        <div class="w-6 bg-slate-300 rounded-t h-1/3" />
        <div class="w-6 bg-teal-600/70 rounded-t h-2/3" />
        <div class="w-6 bg-slate-300 rounded-t h-1/2" />
        <div class="w-6 bg-teal-700 rounded-t h-full" />
        <div class="w-6 bg-slate-300 rounded-t h-3/4" />
        <div class="w-6 bg-teal-600/70 rounded-t h-4/5" />
      </div>

      <!-- Donut Chart Visual Skeleton -->
      <div v-else class="mb-3 opacity-60">
        <svg class="w-20 h-20" viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="20" r="15.915" fill="transparent" stroke="#E2E8F0" stroke-width="5" />
          <circle
            cx="20"
            cy="20"
            r="15.915"
            fill="transparent"
            stroke="#0F766E"
            stroke-width="5"
            stroke-dasharray="45 55"
            stroke-dashoffset="25"
          />
          <circle
            cx="20"
            cy="20"
            r="15.915"
            fill="transparent"
            stroke="#0284C7"
            stroke-width="5"
            stroke-dasharray="25 75"
            stroke-dashoffset="80"
          />
        </svg>
      </div>

      <!-- Description & Sprint 2 Notice -->
      <div class="space-y-1">
        <h4 class="text-xs font-semibold text-slate-800">Kerangka Visual {{ title }}</h4>
        <p class="text-[11px] text-slate-500 max-w-xs leading-relaxed">
          {{
            description ||
            'Visualisasi analitik interaktif akan dihubungkan dengan data riil pada implementasi Sprint 2.'
          }}
        </p>
      </div>

      <div class="mt-3 flex items-center gap-2">
        <span class="inline-flex items-center gap-1 text-[10px] text-slate-500 font-medium">
          <component
            :is="chartType === 'line' ? LineChart : chartType === 'bar' ? BarChart3 : PieChart"
            class="w-3.5 h-3.5 text-teal-700"
          />
          Chart Engine Placeholder
        </span>
      </div>
    </div>
  </AppCard>
</template>
