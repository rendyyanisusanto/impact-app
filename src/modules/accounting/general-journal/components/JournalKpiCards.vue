<script setup lang="ts">
import { computed } from 'vue'
import type { JournalKpiSummary } from '../types/journal.types'
import { BookOpen, FileEdit, CheckCircle2, DollarSign } from 'lucide-vue-next'
import { formatCurrency } from '@/shared/utils/formatters'

const props = defineProps<{
  kpi: JournalKpiSummary | null
  loading?: boolean
}>()

const cards = computed(() => [
  {
    title: 'Total Jurnal',
    value: props.kpi ? props.kpi.total_count.toLocaleString('id-ID') : '0',
    subtitle: 'Semua transaksi jurnal',
    icon: BookOpen,
    bgClass: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    borderClass: 'border-blue-100 dark:border-blue-800'
  },
  {
    title: 'Draft',
    value: props.kpi ? props.kpi.draft_count.toLocaleString('id-ID') : '0',
    subtitle: 'Menunggu diverifikasi / posting',
    icon: FileEdit,
    bgClass: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    borderClass: 'border-amber-100 dark:border-amber-800'
  },
  {
    title: 'Posted',
    value: props.kpi ? props.kpi.posted_count.toLocaleString('id-ID') : '0',
    subtitle: 'Telah dibukukan ke ledger',
    icon: CheckCircle2,
    bgClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    borderClass: 'border-emerald-100 dark:border-emerald-800'
  },
  {
    title: 'Total Nilai Jurnal',
    value: props.kpi ? formatCurrency(props.kpi.total_value) : 'Rp 0',
    subtitle: 'Total debit jurnal seimbang',
    icon: DollarSign,
    bgClass: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
    borderClass: 'border-teal-100 dark:border-teal-800'
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

      <div class="mt-3">
        <div v-if="loading" class="h-8 bg-slate-200 dark:bg-slate-700 animate-pulse rounded w-28 my-1" />
        <div v-else class="text-2xl font-bold text-slate-800 dark:text-slate-100 font-mono tracking-tight">
          {{ card.value }}
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {{ card.subtitle }}
        </p>
      </div>
    </div>
  </div>
</template>
