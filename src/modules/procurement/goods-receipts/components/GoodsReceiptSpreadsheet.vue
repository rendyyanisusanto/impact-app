<script setup lang="ts">
import type { GoodsReceiptDetailRow } from '../types/goods-receipt.types'
import { formatCurrency, formatNumber } from '@/shared/utils/formatters'
import { Package, AlertCircle, Inbox } from 'lucide-vue-next'

defineProps<{
  rows: GoodsReceiptDetailRow[]
  activeCell: { rowIndex: number; colKey: string } | null
  selectedRowIndex: number | null
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'set-active-cell', rowIndex: number, colKey: string): void
  (e: 'update-cell', rowIndex: number, colKey: keyof GoodsReceiptDetailRow, value: unknown): void
  (e: 'cell-keydown', event: KeyboardEvent, rowIndex: number, colKey: string): void
}>()

function onCellFocus(rowIndex: number, colKey: string) {
  emit('set-active-cell', rowIndex, colKey)
}

function onQtyTerimaInput(rowIndex: number, event: Event) {
  const target = event.target as HTMLInputElement
  const rawVal = target.value
  if (rawVal === '') {
    emit('update-cell', rowIndex, 'qty_terima', null)
    return
  }
  const parsed = parseInt(rawVal, 10)
  emit('update-cell', rowIndex, 'qty_terima', isNaN(parsed) ? 0 : parsed)
}

function onKeyDown(event: KeyboardEvent, rowIndex: number, colKey: string) {
  emit('cell-keydown', event, rowIndex, colKey)
}
</script>

<template>
  <div class="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
    <!-- Grid Container with horizontal scroll -->
    <div class="overflow-x-auto min-h-[220px]">
      <table class="w-full border-collapse text-left text-xs">
        <!-- Table Header -->
        <thead
          class="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300 sticky top-0 z-10 select-none"
        >
          <tr>
            <th class="w-10 px-2 py-2 text-center border-r border-slate-200">No</th>
            <th class="min-w-[220px] px-3 py-2 border-r border-slate-200">Nama Bahan Baku</th>
            <th class="w-20 px-2 py-2 text-center border-r border-slate-200">Satuan</th>
            <th class="w-24 px-2 py-2 text-right border-r border-slate-200">Stok Gudang</th>
            <th class="w-24 px-2 py-2 text-right border-r border-slate-200 bg-slate-200/40">
              Qty Pesan
            </th>
            <th class="w-24 px-2 py-2 text-right border-r border-slate-200 text-slate-500">
              Sdh Terima
            </th>
            <th class="w-24 px-2 py-2 text-right border-r border-slate-200 text-teal-700 font-bold">
              Sisa PO
            </th>
            <th
              class="w-28 px-2 py-2 text-right border-r border-slate-200 bg-amber-50/70 text-amber-900 font-bold"
            >
              Qty Terima *
            </th>
            <th class="w-28 px-2 py-2 text-right border-r border-slate-200">Harga (Rp)</th>
            <th class="w-32 px-3 py-2 text-right">Subtotal (Rp)</th>
          </tr>
        </thead>

        <!-- Table Body -->
        <tbody class="divide-y divide-slate-200">
          <!-- Empty State when no PO items loaded -->
          <tr v-if="rows.length === 0">
            <td colspan="10" class="py-12 text-center text-slate-400 bg-slate-50/40">
              <div class="flex flex-col items-center justify-center space-y-2">
                <Inbox class="w-8 h-8 text-slate-300 stroke-[1.5]" />
                <p class="text-xs font-medium text-slate-500">Belum ada item bahan yang dimuat.</p>
                <p class="text-[11px] text-slate-400 max-w-sm">
                  Silakan pilih Purchase Order di formulir bagian atas untuk mengisi daftar pesanan
                  bahan secara otomatis.
                </p>
              </div>
            </td>
          </tr>

          <!-- Rows -->
          <tr
            v-for="(row, idx) in rows"
            :key="row.row_id"
            class="transition-colors group hover:bg-slate-50/80"
            :class="{
              'bg-teal-50/30': selectedRowIndex === idx,
              'bg-rose-50/20': row.errors && Object.keys(row.errors).length > 0
            }"
          >
            <!-- 1. Index -->
            <td
              class="px-2 py-1.5 text-center font-mono text-[11px] text-slate-400 border-r border-slate-200"
            >
              {{ idx + 1 }}
            </td>

            <!-- 2. Nama Bahan -->
            <td class="px-3 py-1.5 border-r border-slate-200">
              <div class="flex items-center gap-1.5">
                <Package class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span class="font-medium text-slate-800">{{ row.nama_bahan }}</span>
              </div>
              <span v-if="row.kode_bahan" class="text-[10px] font-mono text-slate-400 pl-5 block">
                {{ row.kode_bahan }}
              </span>
            </td>

            <!-- 3. Satuan -->
            <td
              class="px-2 py-1.5 text-center border-r border-slate-200 font-medium text-slate-600"
            >
              <span class="px-1.5 py-0.5 bg-slate-100 rounded text-[11px]">
                {{ row.nama_satuan || '-' }}
              </span>
            </td>

            <!-- 4. Stok Saat Ini -->
            <td class="px-2 py-1.5 text-right font-mono text-slate-600 border-r border-slate-200">
              {{ formatNumber(row.stok) }}
            </td>

            <!-- 5. Qty Pesan (from PO) -->
            <td
              class="px-2 py-1.5 text-right font-mono font-semibold text-slate-800 bg-slate-50 border-r border-slate-200"
            >
              {{ formatNumber(row.qty_pesan) }}
            </td>

            <!-- 6. Sudah Diterima -->
            <td class="px-2 py-1.5 text-right font-mono text-slate-500 border-r border-slate-200">
              {{ formatNumber(row.already_received_qty) }}
            </td>

            <!-- 7. Sisa Pesanan -->
            <td
              class="px-2 py-1.5 text-right font-mono font-bold border-r border-slate-200"
              :class="row.remaining_qty > 0 ? 'text-teal-700' : 'text-slate-400'"
            >
              {{ formatNumber(row.remaining_qty) }}
            </td>

            <!-- 8. Qty Terima (Editable Cell) -->
            <td
              class="p-0 border-r border-slate-200 relative bg-amber-50/30"
              :class="{
                'ring-2 ring-inset ring-teal-500':
                  activeCell?.rowIndex === idx && activeCell?.colKey === 'qty_terima',
                'bg-rose-50 ring-1 ring-inset ring-rose-400': row.errors?.qty_terima
              }"
            >
              <input
                type="number"
                min="0"
                :max="row.remaining_qty"
                step="1"
                :value="row.qty_terima ?? ''"
                :disabled="disabled || row.remaining_qty === 0"
                placeholder="0"
                class="w-full h-full py-1.5 px-2 text-right font-mono text-xs font-bold text-amber-900 bg-transparent focus:outline-none disabled:opacity-50"
                @focus="onCellFocus(idx, 'qty_terima')"
                @input="onQtyTerimaInput(idx, $event)"
                @keydown="onKeyDown($event, idx, 'qty_terima')"
              />
              <span
                v-if="row.errors?.qty_terima"
                class="absolute right-1 top-1 text-rose-500"
                :title="row.errors.qty_terima"
              >
                <AlertCircle class="w-3 h-3" />
              </span>
            </td>

            <!-- 9. Harga Satuan (from PO) -->
            <td
              class="p-0 border-r border-slate-200 relative"
              :class="{
                'ring-2 ring-inset ring-teal-500':
                  activeCell?.rowIndex === idx && activeCell?.colKey === 'harga_satuan',
                'bg-rose-50 ring-1 ring-inset ring-rose-400': row.errors?.harga_satuan
              }"
            >
              <input
                type="number"
                min="0"
                step="1000"
                :value="row.harga_satuan ?? 0"
                :disabled="disabled"
                readonly
                class="w-full h-full py-1.5 px-2 text-right font-mono text-xs bg-slate-50/50 text-slate-700 focus:outline-none cursor-default"
                @focus="onCellFocus(idx, 'harga_satuan')"
                @keydown="onKeyDown($event, idx, 'harga_satuan')"
              />
            </td>

            <!-- 10. Subtotal (Calculated UI-only) -->
            <td
              class="px-3 py-1.5 text-right font-mono font-semibold text-slate-800 bg-slate-50/50"
            >
              {{ formatCurrency(row.subtotal || 0) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Spreadsheet Help Footer -->
    <div
      class="px-4 py-2 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500"
    >
      <div class="flex items-center gap-4">
        <span
          >💡 Gunakan tombol
          <kbd class="px-1 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]"
            >Tab</kbd
          >
          atau
          <kbd class="px-1 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]"
            >↑/↓</kbd
          >
          untuk berpindah antar baris input.</span
        >
      </div>
      <div class="font-medium text-slate-600">
        Total Item: {{ rows.length }} bahan | Item Diterima:
        {{ rows.filter(r => (r.qty_terima || 0) > 0).length }}
      </div>
    </div>
  </div>
</template>
