<script setup lang="ts">
import { computed } from 'vue'
import {
  FileText,
  CheckCircle2,
  Clock,
  TrendingUp,
  Loader2
} from 'lucide-vue-next'
import type { OtherIncomeKpiSummary } from '../types/other-income.types'
import { formatCurrency } from '@/shared/utils/formatters'

const props = defineProps<{
  kpi: OtherIncomeKpiSummary | null
  loading?: boolean
}>()

const cards = computed(() => [
  {
    title: 'Total Transaksi',
    value: props.kpi?.total_count ?? 0,
    isCurrency: false,
    subtitle: 'Seluruh penerimaan kas/bank',
    icon: FileText,
    iconBg: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
  },
  {
    title: 'Total Pemasukan Posted',
    value: props.kpi?.posted_total_amount ?? 0,
    isCurrency: true,
    subtitle: 'Nominal neto terealisasi kas/bank',
    icon: TrendingUp,
    iconBg: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
  },
  {
    title: 'Selesai (Posted)',
    value: props.kpi?.posted_count ?? 0,
    isCurrency: false,
    subtitle: 'Tercatat di ledger & buku besar',
    icon: CheckCircle2,
    iconBg: 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400'
  },
  {
    title: 'Draft',
    value: props.kpi?.draft_count ?? 0,
    isCurrency: false,
    subtitle: 'Menunggu verifikasi / posting',
    icon: Clock,
    iconBg: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
  }
])
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <div
      v-for="(card, idx) in cards"
      :key="idx"
      class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow transition-shadow"
    >
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {{ card.title }}
        </span>
        <div :class="['w-9 h-9 rounded-xl flex items-center justify-center shrink-0', card.iconBg]">
          <component :is="card.icon" class="w-5 h-5" />
        </div>
      </div>

      <div class="mt-3">
        <div v-if="loading" class="flex items-center gap-2 py-1">
          <Loader2 class="w-5 h-5 animate-spin text-slate-400" />
          <span class="text-xs text-slate-400">Memuat data...</span>
        </div>
        <div v-else class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {{ card.isCurrency ? formatCurrency(Number(card.value)) : card.value.toLocaleString('id-ID') }}
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {{ card.subtitle }}
        </p>
      </div>
    </div>
  </div>
</template>
