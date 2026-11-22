<script setup lang="ts">
import { computed } from 'vue'
import { Package, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-vue-next'
import type { DeliveryNoteItemInput } from '../types/delivery-note.types'

interface Props {
  modelValue: DeliveryNoteItemInput[]
  hasSelectedSo: boolean
  isReadOnly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isReadOnly: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: DeliveryNoteItemInput[]): void
}>()

const totalPemesanan = computed(() =>
  props.modelValue.reduce((sum, it) => sum + (Number(it.qty) || 0), 0)
)

const totalSudahDikirim = computed(() =>
  props.modelValue.reduce((sum, it) => sum + (Number(it.qty_sudah_dikirim) || 0), 0)
)

const totalSisa = computed(() =>
  props.modelValue.reduce((sum, it) => sum + (Number(it.sisa_qty) || 0), 0)
)

const totalPengiriman = computed(() =>
  props.modelValue.reduce((sum, it) => sum + (Number(it.qty_kirim) || 0), 0)
)

const fillAllRemaining = () => {
  const updated = props.modelValue.map(it => ({
    ...it,
    qty_kirim: it.sisa_qty !== undefined ? it.sisa_qty : it.qty - (it.qty_sudah_dikirim || 0)
  }))
  emit('update:modelValue', updated)
}

const resetAllToZero = () => {
  const updated = props.modelValue.map(it => ({
    ...it,
    qty_kirim: 0
  }))
  emit('update:modelValue', updated)
}

const updateRowQty = (index: number, val: number | string) => {
  const num = Number(val) || 0
  const updated = [...props.modelValue]
  const row = updated[index]
  if (row) {
    const maxVal =
      row.sisa_qty !== undefined ? row.sisa_qty : row.qty - (row.qty_sudah_dikirim || 0)
    const clamped = Math.max(0, Math.min(maxVal, num))
    updated[index] = { ...row, qty_kirim: clamped }
    emit('update:modelValue', updated)
  }
}

const updateRowNotes = (index: number, val: string) => {
  const updated = [...props.modelValue]
  const row = updated[index]
  if (row) {
    updated[index] = { ...row, keterangan: val }
    emit('update:modelValue', updated)
  }
}
</script>

<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
  >
    <!-- Header & Quick Actions -->
    <div
      class="px-5 py-3.5 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50 dark:bg-gray-800/50"
    >
      <div class="flex items-center gap-2">
        <Package class="w-4 h-4 text-primary-600 dark:text-primary-400" />
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
          Detail Produk & QTY Pengiriman
        </h3>
        <span
          v-if="hasSelectedSo"
          class="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full"
        >
          {{ modelValue.length }} item
        </span>
      </div>

      <div v-if="hasSelectedSo && !isReadOnly" class="flex items-center gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300 bg-primary-50/50 dark:bg-primary-950/30 hover:bg-primary-100 transition-colors"
          data-test="btn-kirim-semua"
          @click="fillAllRemaining"
        >
          <CheckCircle2 class="w-3.5 h-3.5" />
          Kirim Semua Sisa
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          data-test="btn-reset-qty"
          @click="resetAllToZero"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          Kosongkan
        </button>
      </div>
    </div>

    <!-- Empty State: No SO Selected -->
    <div v-if="!hasSelectedSo" class="py-12 px-4 text-center" data-test="empty-so-placeholder">
      <AlertCircle class="w-10 h-10 mx-auto text-amber-500/80 mb-2" />
      <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
        Pilih No. Sales Order Terlebih Dahulu
      </p>
      <p class="text-xs text-gray-400 mt-1 max-w-md mx-auto">
        Silakan klik tombol pencarian Sales Order di atas untuk memuat daftar produk dan sisa
        kuantitas pengiriman.
      </p>
    </div>

    <!-- Spreadsheet Table -->
    <div v-else class="overflow-x-auto">
      <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr
            class="border-b border-gray-200 dark:border-gray-700 bg-gray-100/75 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300 font-semibold uppercase tracking-wider"
          >
            <th class="py-3 px-3 w-12 text-center">No</th>
            <th class="py-3 px-4 min-w-[240px]">Nama Produk</th>
            <th class="py-3 px-3 w-28 text-center">QTY Pemesanan</th>
            <th class="py-3 px-3 w-28 text-center">Sudah Dikirim</th>
            <th class="py-3 px-3 w-28 text-center">Sisa QTY</th>
            <th class="py-3 px-3 w-36 text-center">QTY Pengiriman</th>
            <th class="py-3 px-4 min-w-[180px]">Keterangan</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700/60 bg-white dark:bg-gray-800">
          <tr
            v-for="(item, index) in modelValue"
            :key="item.produk_id"
            class="hover:bg-gray-50/70 dark:hover:bg-gray-700/30 transition-colors"
            :class="item.qty_kirim > 0 ? 'bg-primary-50/20 dark:bg-primary-950/10' : ''"
            data-test="delivery-item-row"
          >
            <td class="py-3 px-3 text-center text-gray-500 font-medium">
              {{ index + 1 }}
            </td>

            <td class="py-3 px-4">
              <div class="font-medium text-gray-900 dark:text-white">
                {{ item.nama_produk || 'Produk #' + item.produk_id }}
              </div>
              <div
                class="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5"
              >
                <span class="font-mono">{{ item.kode_produk || '-' }}</span>
                <span>• Satuan: {{ item.satuan_nama || 'Unit' }}</span>
                <span
                  v-if="item.stok_saat_ini !== undefined"
                  :class="(item.stok_saat_ini ?? 0) <= 0 ? 'text-red-500 font-semibold' : ''"
                >
                  • Stok: {{ item.stok_saat_ini ?? 0 }}
                </span>
              </div>
            </td>

            <td class="py-3 px-3 text-center font-semibold text-gray-700 dark:text-gray-300">
              {{ item.qty }}
            </td>

            <td class="py-3 px-3 text-center text-gray-500 dark:text-gray-400">
              {{ item.qty_sudah_dikirim ?? 0 }}
            </td>

            <td class="py-3 px-3 text-center">
              <span
                class="px-2 py-0.5 rounded text-[11px] font-semibold"
                :class="
                  (item.sisa_qty ?? 0) > 0
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                "
              >
                {{ item.sisa_qty ?? 0 }}
              </span>
            </td>

            <td class="py-2.5 px-3">
              <div v-if="isReadOnly" class="text-center font-bold text-gray-900 dark:text-white">
                {{ item.qty_kirim }}
              </div>
              <div v-else class="flex flex-col items-center justify-center">
                <input
                  type="number"
                  min="0"
                  :max="item.sisa_qty ?? item.qty"
                  :value="item.qty_kirim"
                  class="w-24 px-2.5 py-1.5 text-center text-sm font-semibold rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  :class="[
                    item.stok_saat_ini !== undefined && item.qty_kirim > item.stok_saat_ini
                      ? 'border-red-500 text-red-600 font-bold ring-1 ring-red-500'
                      : item.qty_kirim > 0
                        ? 'border-primary-500 text-primary-600 font-bold'
                        : ''
                  ]"
                  data-test="input-qty-kirim"
                  @input="e => updateRowQty(index, (e.target as HTMLInputElement).value)"
                />
                <span
                  v-if="item.stok_saat_ini !== undefined && item.qty_kirim > item.stok_saat_ini"
                  class="text-[10px] text-red-600 dark:text-red-400 font-medium mt-0.5"
                >
                  Stok: {{ item.stok_saat_ini }}
                </span>
              </div>
            </td>

            <td class="py-2.5 px-4">
              <span v-if="isReadOnly" class="text-gray-600 dark:text-gray-400">
                {{ item.keterangan || '-' }}
              </span>
              <input
                v-else
                type="text"
                :value="item.keterangan || ''"
                placeholder="cth. Koli 1 / Catatan packing..."
                class="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                data-test="input-item-keterangan"
                @input="e => updateRowNotes(index, (e.target as HTMLInputElement).value)"
              />
            </td>
          </tr>
        </tbody>

        <!-- Footer Summary -->
        <tfoot
          class="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/60 font-semibold text-gray-900 dark:text-white"
        >
          <tr>
            <td
              colspan="2"
              class="py-3 px-4 text-right uppercase text-[11px] tracking-wider text-gray-600 dark:text-gray-400"
            >
              Total Keseluruhan:
            </td>
            <td class="py-3 px-3 text-center text-sm">
              {{ totalPemesanan }}
            </td>
            <td class="py-3 px-3 text-center text-sm text-gray-500">
              {{ totalSudahDikirim }}
            </td>
            <td class="py-3 px-3 text-center text-sm text-amber-600 dark:text-amber-400">
              {{ totalSisa }}
            </td>
            <td
              class="py-3 px-3 text-center text-sm text-primary-600 dark:text-primary-400 font-bold"
            >
              {{ totalPengiriman }}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>
