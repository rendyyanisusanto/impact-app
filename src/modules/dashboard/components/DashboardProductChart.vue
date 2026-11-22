<script setup lang="ts">
import { ref, computed } from 'vue'
import AppCard from '@/shared/components/ui/AppCard.vue'
import AppSkeleton from '@/shared/components/ui/AppSkeleton.vue'
import AppBadge from '@/shared/components/ui/AppBadge.vue'
import type { ProductChartPoint } from '../types/dashboard.types'
import { formatCurrency, formatNumber } from '@/shared/utils/formatters'
import { PieChart, Package, AlertCircle } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    products?: ProductChartPoint[]
    loading?: boolean
    error?: string | null
  }>(),
  {
    title: 'Grafik Produk Terlaris',
    subtitle: 'Distribusi kuantitas produk paling laris terjual',
    products: () => [],
    loading: false,
    error: null
  }
)

const hoveredIndex = ref<number | null>(null)
const showAccessibleTable = ref(false)

const totalQuantity = computed(() => {
  return (props.products || []).reduce((sum, p) => sum + p.quantity, 0)
})

const totalRevenue = computed(() => {
  return (props.products || []).reduce((sum, p) => sum + p.totalRevenue, 0)
})

// SVG Donut Calculations
const size = 180
const strokeWidth = 28
const radius = (size - strokeWidth) / 2
const circumference = 2 * Math.PI * radius
const center = size / 2

interface DonutSlice {
  product: ProductChartPoint
  dashArray: string
  dashOffset: number
  color: string
}

const slices = computed<DonutSlice[]>(() => {
  if (!props.products || props.products.length === 0 || totalQuantity.value === 0) return []

  let accumulatedPercent = 0
  return props.products.map(p => {
    const fraction = p.quantity / totalQuantity.value
    const dashLength = fraction * circumference
    const dashOffset = -accumulatedPercent * circumference
    accumulatedPercent += fraction

    return {
      product: p,
      dashArray: `${dashLength} ${circumference - dashLength}`,
      dashOffset,
      color: p.color || '#0F766E'
    }
  })
})
</script>

<template>
  <AppCard padding="none" class="flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <div class="p-4 border-b border-slate-100 flex items-start justify-between gap-3">
      <div>
        <div class="flex items-center gap-2">
          <h3 class="text-sm font-bold text-slate-800">
            {{ title }}
          </h3>
          <AppBadge variant="neutral" size="xs"> Top 5 </AppBadge>
        </div>
        <p class="text-xs text-slate-500 mt-0.5">
          {{ subtitle }}
        </p>
      </div>

      <div class="text-right shrink-0">
        <p class="text-xs font-semibold text-teal-800">{{ formatNumber(totalQuantity) }} Unit</p>
        <p class="text-[10px] text-slate-400">
          {{ formatCurrency(totalRevenue) }}
        </p>
      </div>
    </div>

    <!-- Chart Body -->
    <div class="p-4 flex-1 flex flex-col justify-center relative min-h-[260px]">
      <!-- Loading Skeleton -->
      <div v-if="loading" class="flex flex-col sm:flex-row items-center gap-6 py-4">
        <AppSkeleton type="circle" width="140px" height="140px" />
        <div class="flex-1 w-full space-y-2.5">
          <AppSkeleton type="line" width="100%" height="20px" />
          <AppSkeleton type="line" width="90%" height="20px" />
          <AppSkeleton type="line" width="80%" height="20px" />
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="flex flex-col items-center justify-center py-8 text-center text-rose-600 gap-2"
        role="alert"
      >
        <AlertCircle class="w-8 h-8 text-rose-500" />
        <p class="text-xs font-semibold">Gagal memuat grafik produk</p>
        <p class="text-[11px] text-slate-500">{{ error }}</p>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!products || products.length === 0"
        class="flex flex-col items-center justify-center py-10 text-center text-slate-400 gap-2"
      >
        <PieChart class="w-8 h-8 text-slate-300 stroke-1" />
        <p class="text-xs font-medium text-slate-600">Tidak ada produk terjual</p>
        <p class="text-[11px] text-slate-400 max-w-xs">
          Belum ada rekaman penjualan produk untuk periode ini.
        </p>
      </div>

      <!-- Donut Chart & Ranked List -->
      <div v-else class="flex flex-col sm:flex-row items-center gap-6">
        <!-- SVG Donut -->
        <div class="relative shrink-0 flex items-center justify-center">
          <svg
            :width="size"
            :height="size"
            class="transform -rotate-90 select-none overflow-visible"
            role="img"
            aria-label="Distribusi produk terlaris"
          >
            <!-- Background Ring -->
            <circle
              :cx="center"
              :cy="center"
              :r="radius"
              fill="transparent"
              stroke="#F1F5F9"
              :stroke-width="strokeWidth"
            />

            <!-- Slices -->
            <circle
              v-for="(slice, idx) in slices"
              :key="slice.product.productId"
              :cx="center"
              :cy="center"
              :r="radius"
              fill="transparent"
              :stroke="slice.color"
              :stroke-width="hoveredIndex === idx ? strokeWidth + 4 : strokeWidth"
              :stroke-dasharray="slice.dashArray"
              :stroke-dashoffset="slice.dashOffset"
              class="transition-all duration-200 cursor-pointer"
              @mouseenter="hoveredIndex = idx"
              @mouseleave="hoveredIndex = null"
            />
          </svg>

          <!-- Donut Center Text -->
          <div
            class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center"
          >
            <template v-if="hoveredIndex !== null && products[hoveredIndex]">
              <span class="text-xs font-bold text-slate-800 leading-tight">
                {{ products[hoveredIndex].percentage }}%
              </span>
              <span class="text-[9px] text-slate-500 uppercase tracking-tight">
                {{ products[hoveredIndex].category }}
              </span>
            </template>
            <template v-else>
              <Package class="w-5 h-5 text-teal-700 mb-0.5" />
              <span class="text-xs font-bold text-slate-800 leading-tight">
                {{ totalQuantity }}
              </span>
              <span class="text-[9px] text-slate-400">Total Unit</span>
            </template>
          </div>
        </div>

        <!-- Ranked Breakdown List -->
        <div class="flex-1 w-full space-y-2">
          <div
            v-for="(prod, idx) in products"
            :key="prod.productId"
            class="flex items-center justify-between gap-2 p-1.5 rounded-md transition-colors cursor-pointer text-xs"
            :class="{
              'bg-slate-50 ring-1 ring-teal-500/30': hoveredIndex === idx,
              'hover:bg-slate-50/70': hoveredIndex !== idx
            }"
            @mouseenter="hoveredIndex = idx"
            @mouseleave="hoveredIndex = null"
          >
            <!-- Product Info with Color Marker -->
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <span
                class="w-2.5 h-2.5 rounded-full shrink-0"
                :style="{ backgroundColor: prod.color }"
              />
              <div class="min-w-0 flex-1">
                <p class="font-semibold text-slate-800 truncate" :title="prod.productName">
                  {{ prod.productName }}
                </p>
                <p class="text-[10px] text-slate-400">
                  {{ prod.category }} &bull; {{ formatCurrency(prod.totalRevenue) }}
                </p>
              </div>
            </div>

            <!-- Quantity & Percentage -->
            <div class="text-right shrink-0">
              <span class="font-bold text-slate-700">
                {{ formatNumber(prod.quantity) }}
              </span>
              <span class="text-slate-400 text-[10px] ml-1"> ({{ prod.percentage }}%) </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Accessible Alternative Table -->
    <div class="px-4 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
      <button
        type="button"
        class="text-[11px] text-teal-700 hover:text-teal-900 font-medium underline cursor-pointer"
        @click="showAccessibleTable = !showAccessibleTable"
      >
        {{
          showAccessibleTable
            ? 'Sembunyikan Tabel Produk'
            : 'Tampilkan Tabel Produk (Aksesibilitas)'
        }}
      </button>
      <span class="text-[10px] text-slate-400"> Porsi Penjualan </span>
    </div>

    <div v-if="showAccessibleTable" class="p-3 border-t border-slate-200 bg-white overflow-x-auto">
      <table class="w-full text-left text-xs border-collapse">
        <thead>
          <tr class="border-b border-slate-200 text-slate-600 font-semibold">
            <th class="py-1 px-2">Produk</th>
            <th class="py-1 px-2">Kategori</th>
            <th class="py-1 px-2 text-right">Terjual</th>
            <th class="py-1 px-2 text-right">Total Nilai</th>
            <th class="py-1 px-2 text-right">Porsi</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in products"
            :key="p.productId"
            class="border-b border-slate-100 hover:bg-slate-50"
          >
            <td class="py-1 px-2 font-medium">{{ p.productName }}</td>
            <td class="py-1 px-2">{{ p.category }}</td>
            <td class="py-1 px-2 text-right">{{ p.quantity }} unit</td>
            <td class="py-1 px-2 text-right">{{ formatCurrency(p.totalRevenue) }}</td>
            <td class="py-1 px-2 text-right">{{ p.percentage }}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  </AppCard>
</template>
