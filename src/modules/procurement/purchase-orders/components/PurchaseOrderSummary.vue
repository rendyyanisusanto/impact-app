<script setup lang="ts">
import type { PurchaseOrderSummary } from '../types/purchase-order.types'
import { formatCurrency } from '@/shared/utils/formatters'

defineProps<{
  summary: PurchaseOrderSummary
  diskonPersen: number
  isPpn: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:diskon-persen', val: number): void
}>()

function onDiscountInput(event: Event) {
  const target = event.target as HTMLInputElement
  const val = Math.min(100, Math.max(0, parseFloat(target.value) || 0))
  emit('update:diskon-persen', val)
}
</script>

<template>
  <div class="flex justify-end mb-6">
    <div class="w-full md:w-96 bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-3">
      <!-- 1. Subtotal -->
      <div class="flex items-center justify-between text-xs text-slate-600">
        <span class="font-medium">Subtotal</span>
        <span class="font-mono font-semibold text-slate-800">
          {{ formatCurrency(summary.subtotal) }}
        </span>
      </div>

      <!-- 2. Diskon Global (%) -->
      <div class="flex items-center justify-between text-xs text-slate-600 gap-2">
        <div class="flex items-center gap-1.5 flex-1">
          <span class="font-medium">Diskon</span>
          <div class="w-16">
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              :value="diskonPersen"
              :disabled="disabled"
              class="w-full py-0.5 px-1.5 text-right font-mono text-xs border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
              @input="onDiscountInput"
            />
          </div>
          <span>%</span>
        </div>
        <span class="font-mono text-rose-600">
          - {{ formatCurrency(summary.diskon_nominal) }}
        </span>
      </div>

      <!-- 3. Total Sebelum PPN -->
      <div
        class="flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 pt-2"
      >
        <span class="font-medium">Total Sebelum PPN</span>
        <span class="font-mono font-semibold text-slate-800">
          {{ formatCurrency(summary.total_sebelum_ppn) }}
        </span>
      </div>

      <!-- 4. PPN -->
      <div class="flex items-center justify-between text-xs text-slate-600">
        <span class="font-medium">
          PPN {{ isPpn ? `(${summary.ppn_persen}%)` : '(Non PPN)' }}
        </span>
        <span class="font-mono" :class="isPpn ? 'text-teal-700 font-semibold' : 'text-slate-400'">
          {{ formatCurrency(summary.total_ppn) }}
        </span>
      </div>

      <!-- 5. Grand Total (Total Bayar) -->
      <div
        class="flex items-center justify-between text-sm border-t-2 border-slate-200 pt-3 bg-teal-50/50 -mx-4 -mb-4 p-4 rounded-b-lg"
      >
        <span class="font-bold text-slate-900 uppercase tracking-wide">Total Bayar</span>
        <span class="font-mono text-lg font-extrabold text-teal-800">
          {{ formatCurrency(summary.total) }}
        </span>
      </div>
    </div>
  </div>
</template>
