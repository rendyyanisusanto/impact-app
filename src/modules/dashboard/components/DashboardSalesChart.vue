<script setup lang="ts">
import { ref, computed } from 'vue'
import AppCard from '@/shared/components/ui/AppCard.vue'
import AppSkeleton from '@/shared/components/ui/AppSkeleton.vue'
import AppBadge from '@/shared/components/ui/AppBadge.vue'
import type { SalesChartPoint } from '../types/dashboard.types'
import { formatCurrency, formatNumber } from '@/shared/utils/formatters'
import { BarChart3, AlertCircle } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    points?: SalesChartPoint[]
    loading?: boolean
    error?: string | null
  }>(),
  {
    title: 'Grafik Penjualan',
    subtitle: 'Tren nilai transaksi penjualan periode terpilih',
    points: () => [],
    loading: false,
    error: null
  }
)

const hoveredIndex = ref<number | null>(null)
const showAccessibleTable = ref(false)

const width = 600
const height = 240
const padLeft = 65
const padRight = 25
const padTop = 25
const padBottom = 40

const chartWidth = width - padLeft - padRight
const chartHeight = height - padTop - padBottom

const maxAmount = computed(() => {
  if (!props.points || props.points.length === 0) return 10000000
  const max = Math.max(...props.points.map(p => p.amount))
  if (max === 0) return 10000000
  // Round up to nice number
  const magnitude = Math.pow(10, Math.floor(Math.log10(max)))
  return Math.ceil(max / magnitude) * magnitude
})

const yTicks = computed(() => {
  const count = 4
  const step = maxAmount.value / count
  return Array.from({ length: count + 1 }, (_, i) => {
    const val = i * step
    const y = padTop + chartHeight - (val / maxAmount.value) * chartHeight
    let label = '0'
    if (val >= 1000000) {
      label = `${Math.round(val / 1000000)} jt`
    } else if (val > 0) {
      label = `${Math.round(val / 1000)} rb`
    }
    return { val, y, label }
  })
})

const coordinates = computed(() => {
  if (!props.points || props.points.length === 0) return []
  const n = props.points.length

  return props.points.map((pt, i) => {
    const x = n === 1 ? padLeft + chartWidth / 2 : padLeft + (i / (n - 1)) * chartWidth
    const y = padTop + chartHeight - (pt.amount / maxAmount.value) * chartHeight
    return {
      x,
      y,
      point: pt
    }
  })
})

const linePath = computed(() => {
  const coords = coordinates.value
  if (coords.length === 0) return ''
  return coords.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`
  }, '')
})

const areaPath = computed(() => {
  const coords = coordinates.value
  if (coords.length === 0) return ''
  const first = coords[0]
  const last = coords[coords.length - 1]
  const bottomY = padTop + chartHeight
  return `${linePath.value} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`
})

const totalSalesInPeriod = computed(() => {
  return (props.points || []).reduce((acc, p) => acc + p.amount, 0)
})

const totalTransactionsCount = computed(() => {
  return (props.points || []).reduce((acc, p) => acc + p.count, 0)
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
          <AppBadge variant="info" size="xs"> Tren </AppBadge>
        </div>
        <p class="text-xs text-slate-500 mt-0.5">
          {{ subtitle }}
        </p>
      </div>

      <div class="text-right shrink-0">
        <p class="text-xs font-semibold text-teal-800">
          {{ formatCurrency(totalSalesInPeriod) }}
        </p>
        <p class="text-[10px] text-slate-400">
          {{ formatNumber(totalTransactionsCount) }} transaksi
        </p>
      </div>
    </div>

    <!-- Chart Body -->
    <div class="p-4 flex-1 flex flex-col justify-center relative min-h-[260px]">
      <!-- Loading Skeleton -->
      <div v-if="loading" class="space-y-3 py-4">
        <AppSkeleton type="line" width="100%" height="160px" />
        <div class="flex justify-between">
          <AppSkeleton type="line" width="60px" height="14px" />
          <AppSkeleton type="line" width="60px" height="14px" />
          <AppSkeleton type="line" width="60px" height="14px" />
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="flex flex-col items-center justify-center py-8 text-center text-rose-600 gap-2"
        role="alert"
      >
        <AlertCircle class="w-8 h-8 text-rose-500" />
        <p class="text-xs font-semibold">Gagal memuat grafik penjualan</p>
        <p class="text-[11px] text-slate-500">{{ error }}</p>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!points || points.length === 0"
        class="flex flex-col items-center justify-center py-10 text-center text-slate-400 gap-2"
      >
        <BarChart3 class="w-8 h-8 text-slate-300 stroke-1" />
        <p class="text-xs font-medium text-slate-600">Tidak ada data penjualan</p>
        <p class="text-[11px] text-slate-400 max-w-xs">
          Belum ada transaksi pada rentang periode yang dipilih. Coba pilih preset rentang lain.
        </p>
      </div>

      <!-- SVG Chart -->
      <div v-else class="relative w-full select-none">
        <svg
          :viewBox="`0 0 ${width} ${height}`"
          class="w-full h-auto overflow-visible"
          role="img"
          :aria-label="`${title} - Visualisasi nilai transaksi`"
        >
          <defs>
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#0F766E" stop-opacity="0.25" />
              <stop offset="100%" stop-color="#0F766E" stop-opacity="0.0" />
            </linearGradient>
          </defs>

          <!-- Grid Lines & Y Axis Labels -->
          <g class="grid-lines" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="3,3">
            <line
              v-for="tick in yTicks"
              :key="tick.val"
              :x1="padLeft"
              :y1="tick.y"
              :x2="width - padRight"
              :y2="tick.y"
            />
          </g>

          <!-- Y Axis Text -->
          <g class="y-labels text-[10px] fill-slate-400 font-sans" text-anchor="end">
            <text v-for="tick in yTicks" :key="tick.val" :x="padLeft - 8" :y="tick.y + 3">
              {{ tick.label }}
            </text>
          </g>

          <!-- Area Gradient -->
          <path :d="areaPath" fill="url(#salesGrad)" />

          <!-- Main Line -->
          <path
            :d="linePath"
            fill="none"
            stroke="#0F766E"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          <!-- Data Points & Interactive Columns -->
          <g v-for="(coord, idx) in coordinates" :key="idx" class="cursor-pointer">
            <!-- Invisible wide target column for mouse hover -->
            <rect
              :x="coord.x - chartWidth / coordinates.length / 2"
              :y="padTop"
              :width="chartWidth / coordinates.length"
              :height="chartHeight"
              fill="transparent"
              @mouseenter="hoveredIndex = idx"
              @mouseleave="hoveredIndex = null"
            />

            <!-- Vertical guide line on hover -->
            <line
              v-if="hoveredIndex === idx"
              :x1="coord.x"
              :y1="padTop"
              :x2="coord.x"
              :y2="padTop + chartHeight"
              stroke="#0F766E"
              stroke-width="1"
              stroke-dasharray="2,2"
            />

            <!-- Point circle -->
            <circle
              :cx="coord.x"
              :cy="coord.y"
              :r="hoveredIndex === idx ? 5.5 : 3.5"
              :fill="hoveredIndex === idx ? '#0F766E' : '#FFFFFF'"
              stroke="#0F766E"
              :stroke-width="hoveredIndex === idx ? 2.5 : 2"
              class="transition-all duration-150"
            />

            <!-- X Axis Label -->
            <text
              :x="coord.x"
              :y="padTop + chartHeight + 18"
              text-anchor="middle"
              class="text-[10px] fill-slate-500 font-sans"
              :class="{ 'font-bold fill-teal-800': hoveredIndex === idx }"
            >
              {{ coord.point.date }}
            </text>
          </g>
        </svg>

        <!-- Floating Tooltip -->
        <div
          v-if="hoveredIndex !== null && coordinates[hoveredIndex]"
          class="absolute z-20 pointer-events-none bg-slate-900 text-white text-xs rounded-md px-2.5 py-1.5 shadow-lg border border-slate-700/80 -translate-x-1/2 -translate-y-full transition-all duration-100"
          :style="{
            left: `${(coordinates[hoveredIndex].x / width) * 100}%`,
            top: `${(coordinates[hoveredIndex].y / height) * 100 - 4}%`
          }"
        >
          <p class="text-[10px] text-slate-300 font-medium">
            {{ coordinates[hoveredIndex].point.fullDate }}
          </p>
          <p class="font-bold text-teal-300 text-xs">
            {{ formatCurrency(coordinates[hoveredIndex].point.amount) }}
          </p>
          <p class="text-[10px] text-slate-300">
            {{ coordinates[hoveredIndex].point.count }} transaksi
          </p>
        </div>
      </div>
    </div>

    <!-- Accessible Alternative Table (Screen Readers & Toggle) -->
    <div class="px-4 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
      <button
        type="button"
        class="text-[11px] text-teal-700 hover:text-teal-900 font-medium underline cursor-pointer"
        @click="showAccessibleTable = !showAccessibleTable"
      >
        {{
          showAccessibleTable ? 'Sembunyikan Tabel Data' : 'Tampilkan Tabel Data (Aksesibilitas)'
        }}
      </button>
      <span class="text-[10px] text-slate-400"> Satuan: Rupiah (IDR) </span>
    </div>

    <div v-if="showAccessibleTable" class="p-3 border-t border-slate-200 bg-white overflow-x-auto">
      <table class="w-full text-left text-xs border-collapse">
        <thead>
          <tr class="border-b border-slate-200 text-slate-600 font-semibold">
            <th class="py-1 px-2">Tanggal</th>
            <th class="py-1 px-2 text-right">Nilai Penjualan</th>
            <th class="py-1 px-2 text-right">Jumlah Transaksi</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="pt in points"
            :key="pt.fullDate"
            class="border-b border-slate-100 hover:bg-slate-50"
          >
            <td class="py-1 px-2 font-medium">{{ pt.fullDate }}</td>
            <td class="py-1 px-2 text-right">{{ formatCurrency(pt.amount) }}</td>
            <td class="py-1 px-2 text-right">{{ pt.count }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </AppCard>
</template>
