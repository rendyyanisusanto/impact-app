<script setup lang="ts">
import type { GoodsReceiptSummary } from '../types/goods-receipt.types'
import { formatCurrency } from '@/shared/utils/formatters'

defineProps<{
  summary: GoodsReceiptSummary
  isPpn: boolean
  disabled?: boolean
}>()
</script>

<template>
  <div class="flex justify-end mb-6">
    <div class="w-full md:w-96 bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-3">
      <!-- 1. Nilai Barang Diterima (Subtotal) -->
      <div class="flex items-center justify-between text-xs text-slate-600">
        <span class="font-medium">Nilai Barang Diterima</span>
        <span class="font-mono font-semibold text-slate-800">
          {{ formatCurrency(summary.subtotal) }}
        </span>
      </div>

      <!-- 2. Total Sebelum PPN -->
      <div
        class="flex items-center justify-between text-xs text-slate-600 border-t border-dashed border-slate-200 pt-2"
      >
        <span class="font-medium">Total Sebelum PPN</span>
        <span class="font-mono font-semibold text-slate-800">
          {{ formatCurrency(summary.total_sebelum_ppn) }}
        </span>
      </div>

      <!-- 3. PPN -->
      <div class="flex items-center justify-between text-xs text-slate-600">
        <span class="font-medium">
          PPN {{ isPpn ? `(${summary.ppn_persen}%)` : '(Non PPN)' }}
        </span>
        <span class="font-mono" :class="isPpn ? 'text-teal-700 font-semibold' : 'text-slate-400'">
          {{ formatCurrency(summary.total_ppn) }}
        </span>
      </div>

      <!-- 4. Total Nilai PB (Grand Total) -->
      <div
        class="flex items-center justify-between text-sm border-t-2 border-slate-200 pt-3 bg-teal-50/50 -mx-4 -mb-4 p-4 rounded-b-lg"
      >
        <span class="font-bold text-slate-900 uppercase tracking-wide">Total Nilai PB</span>
        <span class="font-mono text-lg font-extrabold text-teal-800">
          {{ formatCurrency(summary.total) }}
        </span>
      </div>
    </div>
  </div>
</template>
