<script setup lang="ts">
import { computed } from 'vue'
import type { OtherExpenseKpiSummary } from '../types/other-expense.types'
import { Receipt, CheckCircle2, Clock, DollarSign } from 'lucide-vue-next'
import { formatCurrency } from '@/shared/utils/formatters'

const props = defineProps<{
  kpi: OtherExpenseKpiSummary | null
  loading?: boolean
}>()

const cards = computed(() => [
  {
    title: 'Total Transaksi',
    value: props.kpi ? props.kpi.total_count.toLocaleString('id-ID') : '0',
    subtitle: 'Semua transaksi pengeluaran',
    icon: Receipt,
    bgClass: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    borderClass: 'border-blue-100 dark:border-blue-800'
  },
  {
    title: 'Total Pengeluaran Posted',
    value: props.kpi ? formatCurrency(props.kpi.posted_total_amount) : 'Rp 0',
    subtitle: 'Pengeluaran operasional final',
    icon: DollarSign,
    bgClass: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
    borderClass: 'border-teal-100 dark:border-teal-800'
  },
  {
    title: 'Selesai (Posted)',
    value: props.kpi ? props.kpi.posted_count.toLocaleString('id-ID') : '0',
    subtitle: 'Tercatat di ledger akuntansi',
    icon: CheckCircle2,
    bgClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    borderClass: 'border-emerald-100 dark:border-emerald-800'
  },
  {
    title: 'Draft',
    value: props.kpi ? props.kpi.draft_count.toLocaleString('id-ID') : '0',
    subtitle: 'Menunggu review / posting',
    icon: Clock,
    bgClass: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    borderClass: 'border-amber-100 dark:border-amber-800'
  }
])
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <div
      v-for="card in cards"
      :key="card.title"
      class="bg-white dark:bg-slate-800 rounded-xl p-4 border shadow-sm transition-all duration-200 hover:shadow-md"
      :class="card.borderClass"
    >
      <div class="flex items-center justify-between">
        <span class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {{ card.title }}
        </span>
        <div class="p-2 rounded-lg" :class="card.bgClass">
          <component :is="card.icon" class="w-5 h-5" />
        </div>
      </div>

      <div class="mt-2">
        <div v-if="loading" class="h-8 w-24 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
        <div v-else class="text-2xl font-bold text-slate-800 dark:text-white font-mono">
          {{ card.value }}
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {{ card.subtitle }}
        </p>
      </div>
    </div>
  </div>
</template>
