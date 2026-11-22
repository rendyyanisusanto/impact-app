<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency, formatNumber } from '@/shared/utils/formatters'
import type { SalesOrderVariantKey } from '../config/sales-order-variants'
import { getVariantConfig } from '../config/sales-order-variants'

const props = withDefaults(
  defineProps<{
    variant: SalesOrderVariantKey
    itemsSubtotal: number
    discount?: number
    totalSebelumPpn?: number
    totalAdditionalCosts: number
    totalPpn: number
    grandTotal: number
    ppnRate: number
    distinctProductsCount: number
    totalQty: number
    editableDiscount?: boolean
    disabled?: boolean
  }>(),
  {
    discount: 0,
    totalSebelumPpn: undefined,
    editableDiscount: true,
    disabled: false
  }
)

const emit = defineEmits<{
  (e: 'update:discount', val: number): void
}>()

const cfg = getVariantConfig(props.variant)

const computedTotalSebelumPpn = computed(() => {
  if (props.totalSebelumPpn !== undefined && props.totalSebelumPpn !== null) {
    return props.totalSebelumPpn
  }
  return Math.max(0, props.itemsSubtotal - (props.discount || 0))
})

function handleDiscountInput(event: Event) {
  const target = event.target as HTMLInputElement
  const raw = Number(target.value) || 0
  const clamped = Math.max(0, Math.min(raw, props.itemsSubtotal))
  emit('update:discount', clamped)
}
</script>

<template>
  <div
    class="sales-order-summary-card bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4"
  >
    <div class="flex items-center justify-between border-b border-slate-100 pb-3">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Ringkasan Nilai Transaksi
      </h3>
      <span class="text-xs text-slate-400">
        {{ distinctProductsCount }} Jenis Produk • {{ formatNumber(totalQty) }} Total Unit
      </span>
    </div>

    <div class="space-y-2.5 text-xs">
      <!-- 1. Subtotal Produk -->
      <div class="flex items-center justify-between text-slate-600">
        <span>Subtotal Produk</span>
        <span class="font-mono font-medium text-slate-800">
          {{ formatCurrency(itemsSubtotal) }}
        </span>
      </div>

      <!-- 2. Diskon Transaksi (Mengurangi Subtotal) -->
      <div class="flex items-center justify-between text-slate-600">
        <span class="flex items-center gap-1 text-slate-700 font-medium">
          <span>Diskon Penjualan</span>
          <span v-if="discount && discount > 0" class="text-[10px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
            -{{ formatCurrency(discount) }}
          </span>
        </span>
        <div v-if="editableDiscount" class="flex items-center gap-1.5 w-44">
          <span class="text-slate-400 text-xs font-mono">Rp</span>
          <input
            type="number"
            min="0"
            :max="itemsSubtotal"
            :value="discount"
            :disabled="disabled"
            placeholder="0"
            class="w-full text-right py-1 px-2.5 text-xs font-mono font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800 disabled:opacity-50"
            @input="handleDiscountInput"
          />
        </div>
        <span v-else class="font-mono font-medium text-amber-600">
          -{{ formatCurrency(discount || 0) }}
        </span>
      </div>

      <!-- 3. Total Sebelum PPN (Khusus SO Impact atau jika ada diskon) -->
      <div
        v-if="cfg.hasTax"
        class="flex items-center justify-between text-slate-700 font-semibold pt-1 border-t border-slate-100"
      >
        <span>Total Sebelum PPN</span>
        <span class="font-mono text-slate-900">
          {{ formatCurrency(computedTotalSebelumPpn) }}
        </span>
      </div>

      <!-- 4. Biaya Tambahan (if any) -->
      <div v-if="totalAdditionalCosts > 0" class="flex items-center justify-between text-slate-600">
        <span>Biaya Tambahan / Ongkir</span>
        <span class="font-mono font-medium text-slate-800">
          {{ formatCurrency(totalAdditionalCosts) }}
        </span>
      </div>

      <!-- 5. PPN (Only for SO Impact) -->
      <div
        v-if="cfg.hasTax"
        class="flex items-center justify-between text-slate-600 pt-1 border-t border-dashed border-slate-100"
      >
        <span class="flex items-center gap-1.5">
          <span>PPN ({{ ppnRate }}%)</span>
          <span
            class="px-1.5 py-0.2 bg-teal-50 text-teal-700 text-[10px] rounded font-semibold border border-teal-200"
          >
            Aktif
          </span>
        </span>
        <span class="font-mono font-medium text-teal-700">{{ formatCurrency(totalPpn) }}</span>
      </div>

      <!-- 5b. Non-PPN Note for Pola & KS -->
      <div
        v-else
        class="flex items-center justify-between text-slate-400 pt-1 border-t border-dashed border-slate-100 text-[11px]"
      >
        <span>Pajak Pertambahan Nilai (PPN)</span>
        <span class="italic">Non-PPN (0%)</span>
      </div>

      <!-- 6. Grand Total / Total Bayar -->
      <div
        class="flex items-center justify-between text-sm font-bold text-slate-900 pt-3 border-t border-slate-200"
      >
        <span class="text-slate-800">TOTAL BAYAR / NET</span>
        <span class="font-mono text-base text-teal-700 font-bold">
          {{ formatCurrency(grandTotal) }}
        </span>
      </div>
    </div>
  </div>
</template>
