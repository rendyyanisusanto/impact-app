<script setup lang="ts">
import { computed } from 'vue'
import AppCard from '@/shared/components/ui/AppCard.vue'
import AppSkeleton from '@/shared/components/ui/AppSkeleton.vue'
import {
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Minus,
  Package,
  AlertTriangle,
  BadgeDollarSign
} from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    title: string
    value: string | number
    unit?: string
    subtitle?: string
    trend?: {
      direction: 'up' | 'down' | 'neutral'
      text: string
    }
    iconName?: 'cart' | 'currency' | 'package' | 'alert'
    isMock?: boolean
    loading?: boolean
  }>(),
  {
    unit: '',
    subtitle: '',
    trend: undefined,
    iconName: 'cart',
    isMock: true,
    loading: false
  }
)

const iconComponent = computed(() => {
  switch (props.iconName) {
    case 'currency':
      return BadgeDollarSign
    case 'package':
      return Package
    case 'alert':
      return AlertTriangle
    case 'cart':
    default:
      return ShoppingCart
  }
})

const iconBgClass = computed(() => {
  switch (props.iconName) {
    case 'currency':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'package':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'alert':
      return 'bg-red-50 text-red-700 border-red-200'
    case 'cart':
    default:
      return 'bg-teal-50 text-teal-800 border-teal-200'
  }
})
</script>

<template>
  <AppCard padding="sm" class="relative overflow-hidden transition-all hover:shadow-md">
    <div class="flex items-start justify-between gap-3">
      <!-- Info Column -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5 flex-wrap">
          <p class="text-xs font-semibold text-slate-600 truncate">
            {{ title }}
          </p>
          <span
            v-if="isMock"
            class="inline-flex items-center px-1.5 py-0.2 text-[10px] font-medium text-slate-500 bg-slate-100 rounded border border-slate-200"
            title="Data ini disimulasikan untuk kerangka Sprint 1"
          >
            Mock
          </span>
        </div>

        <!-- Metric Value -->
        <div v-if="loading" class="mt-2 space-y-1">
          <AppSkeleton type="line" width="90px" height="24px" />
          <AppSkeleton type="line" width="60px" height="14px" />
        </div>
        <div v-else class="mt-1">
          <div class="flex items-baseline gap-1.5 flex-wrap">
            <span class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {{ value }}
            </span>
            <span v-if="unit" class="text-xs text-slate-500 font-normal">
              {{ unit }}
            </span>
          </div>

          <!-- Trend Indicator -->
          <div
            v-if="trend"
            class="flex items-center gap-1 mt-1 text-[11px] font-medium"
            :class="{
              'text-emerald-700': trend.direction === 'up',
              'text-rose-700': trend.direction === 'down',
              'text-slate-500': trend.direction === 'neutral'
            }"
          >
            <TrendingUp v-if="trend.direction === 'up'" class="w-3.5 h-3.5 shrink-0" />
            <TrendingDown v-else-if="trend.direction === 'down'" class="w-3.5 h-3.5 shrink-0" />
            <Minus v-else class="w-3.5 h-3.5 shrink-0" />
            <span>{{ trend.text }}</span>
          </div>

          <!-- Subtitle -->
          <p v-else-if="subtitle" class="text-[11px] text-slate-500 mt-1">
            {{ subtitle }}
          </p>
        </div>
      </div>

      <!-- Icon Box -->
      <div
        class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border"
        :class="iconBgClass"
      >
        <component :is="iconComponent" class="w-5 h-5" />
      </div>
    </div>
  </AppCard>
</template>
