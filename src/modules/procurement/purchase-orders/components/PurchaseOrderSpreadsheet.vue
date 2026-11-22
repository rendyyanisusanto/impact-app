<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { PurchaseOrderDetailRow } from '../types/purchase-order.types'
import { purchaseOrderService } from '../services/purchase-order.service'
import PurchaseOrderMaterialPicker from './PurchaseOrderMaterialPicker.vue'
import { Plus, Trash2, HelpCircle } from 'lucide-vue-next'
import { formatCurrency } from '@/shared/utils/formatters'

defineProps<{
  rows: PurchaseOrderDetailRow[]
  activeCell: { rowIndex: number; colKey: string } | null
  selectedRowIndex: number | null
  isPickerOpen: boolean
  pickerAnchorRect: { top: number; left: number; width: number; height: number } | null
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:active-cell', val: { rowIndex: number; colKey: string } | null): void
  (e: 'set-active-cell', rowIndex: number, colKey: string): void
  (e: 'add-row', count?: number): void
  (e: 'remove-row', index?: number): void
  (e: 'open-picker', rowIndex: number, el: HTMLElement | null): void
  (e: 'close-picker'): void
  (
    e: 'select-material',
    material: {
      id: number
      kode: string
      nama: string
      qty: number
      satuan_beli_id: number | null
      satuan_beli_nama?: string
      harga_satuan: number | null
    }
  ): void
  (e: 'cell-keydown', event: KeyboardEvent, rowIndex: number, colKey: string): void
  (e: 'cell-double-click', rowIndex: number, colKey: string, el: HTMLElement | null): void
  (e: 'update-cell', rowIndex: number, colKey: keyof PurchaseOrderDetailRow, value: unknown): void
}>()

const unitOptions = ref<Array<{ id: number; nama: string }>>([])

onMounted(async () => {
  unitOptions.value = await purchaseOrderService.getPurchaseUnits()
})

function onCellClick(rowIndex: number, colKey: string) {
  emit('set-active-cell', rowIndex, colKey)
}

function onCellDblClick(rowIndex: number, colKey: string, event: MouseEvent) {
  const target = event.currentTarget as HTMLElement
  emit('cell-double-click', rowIndex, colKey, target)
}

function onKeyDown(event: KeyboardEvent, rowIndex: number, colKey: string) {
  emit('cell-keydown', event, rowIndex, colKey)
}

function onInputChange(rowIndex: number, colKey: keyof PurchaseOrderDetailRow, event: Event) {
  const target = event.target as HTMLInputElement
  let val: unknown = target.value

  if (colKey === 'qty') {
    val = target.value === '' ? null : parseInt(target.value, 10) || 0
  } else if (colKey === 'harga') {
    val = target.value === '' ? null : parseFloat(target.value) || 0
  } else if (colKey === 'diskon') {
    val = target.value === '' ? 0 : parseFloat(target.value) || 0
  }

  emit('update-cell', rowIndex, colKey, val)
}

function onUnitChange(rowIndex: number, event: Event) {
  const target = event.target as HTMLSelectElement
  const unitId = target.value ? Number(target.value) : null
  const unit = unitOptions.value.find(u => u.id === unitId)
  emit('update-cell', rowIndex, 'satuan_beli_id', unitId)
  emit('update-cell', rowIndex, 'nama_satuan', unit?.nama || '')
}
</script>

<template>
  <div class="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-6">
    <!-- Toolbar above spreadsheet -->
    <div
      class="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3"
    >
      <div class="flex items-center gap-2">
        <button
          type="button"
          :disabled="disabled"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-300 rounded hover:bg-teal-100 disabled:opacity-50 transition-colors"
          @click="emit('add-row', 1)"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Tambah Baris</span>
        </button>

        <button
          type="button"
          :disabled="disabled || rows.length <= 1"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-300 rounded hover:bg-rose-100 disabled:opacity-50 transition-colors"
          @click="emit('remove-row')"
        >
          <Trash2 class="w-3.5 h-3.5" />
          <span>Hapus Baris</span>
        </button>
      </div>

      <div class="flex items-center gap-1.5 text-xs text-slate-500">
        <HelpCircle class="w-4 h-4 text-teal-600" />
        <span
          >Double-click pada cell <strong>Nama Bahan</strong> untuk memilih bahan. Gunakan tombol
          <strong>Tab / Enter</strong> untuk navigasi.</span
        >
      </div>
    </div>

    <!-- Spreadsheet Table Container -->
    <div class="overflow-x-auto relative">
      <table class="w-full text-xs border-collapse border border-slate-200 font-sans">
        <!-- Table Header -->
        <thead
          class="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300 select-none"
        >
          <tr>
            <th
              class="w-12 py-2 px-2 border-r border-slate-300 text-center uppercase tracking-wider"
            >
              No
            </th>
            <th
              class="min-w-[240px] py-2 px-3 border-r border-slate-300 text-left uppercase tracking-wider"
            >
              Nama Bahan <span class="text-rose-500">*</span>
            </th>
            <th class="w-32 py-2 px-2 border-r border-slate-300 text-left uppercase tracking-wider">
              Satuan
            </th>
            <th
              class="w-24 py-2 px-3 border-r border-slate-300 text-right uppercase tracking-wider"
            >
              Stok
            </th>
            <th
              class="w-24 py-2 px-2 border-r border-slate-300 text-right uppercase tracking-wider"
            >
              Qty <span class="text-rose-500">*</span>
            </th>
            <th
              class="w-36 py-2 px-2 border-r border-slate-300 text-right uppercase tracking-wider"
            >
              Harga (Rp) <span class="text-rose-500">*</span>
            </th>
            <th
              class="w-24 py-2 px-2 border-r border-slate-300 text-right uppercase tracking-wider"
            >
              Diskon (%)
            </th>
            <th
              class="w-36 py-2 px-3 border-r border-slate-300 text-right uppercase tracking-wider"
            >
              Subtotal (Rp)
            </th>
            <th class="min-w-[200px] py-2 px-3 text-left uppercase tracking-wider">Keterangan</th>
          </tr>
        </thead>

        <!-- Table Body (Spreadsheet Rows) -->
        <tbody class="divide-y divide-slate-200 bg-white">
          <tr
            v-for="(row, rIdx) in rows"
            :key="row.row_id"
            class="hover:bg-slate-50/80 transition-colors"
            :class="{ 'bg-teal-50/30': selectedRowIndex === rIdx }"
          >
            <!-- 1. No (Read-Only) -->
            <td
              class="py-1 px-2 text-center text-slate-500 font-mono bg-slate-50/60 border-r border-slate-200 select-none cursor-pointer"
              @click="onCellClick(rIdx, 'no')"
            >
              {{ rIdx + 1 }}
            </td>

            <!-- 2. Nama Bahan (Double-Click triggers picker) -->
            <td
              :data-cell-id="`${rIdx}-nama_bahan`"
              class="py-1 px-2 border-r border-slate-200 relative cursor-pointer"
              :class="[
                activeCell?.rowIndex === rIdx && activeCell?.colKey === 'nama_bahan'
                  ? 'ring-2 ring-teal-500 z-10'
                  : '',
                row.errors?.bahan_id ? 'bg-rose-50 border-rose-300' : ''
              ]"
              tabindex="0"
              @click="onCellClick(rIdx, 'nama_bahan')"
              @dblclick="onCellDblClick(rIdx, 'nama_bahan', $event)"
              @keydown="onKeyDown($event, rIdx, 'nama_bahan')"
            >
              <div class="flex items-center justify-between min-h-[26px]">
                <span v-if="row.nama_bahan" class="font-medium text-slate-900">
                  {{ row.nama_bahan }}
                </span>
                <span v-else class="text-slate-400 italic text-[11px]">
                  Double-click untuk pilih bahan...
                </span>
                <span
                  v-if="!disabled"
                  class="text-[10px] text-teal-600 bg-teal-50 px-1 py-0.5 rounded border border-teal-200 ml-1"
                >
                  Pilih
                </span>
              </div>
              <p v-if="row.errors?.bahan_id" class="text-[10px] text-rose-600 mt-0.5">
                {{ row.errors.bahan_id }}
              </p>
            </td>

            <!-- 3. Satuan (Dropdown / Select) -->
            <td
              :data-cell-id="`${rIdx}-nama_satuan`"
              class="py-1 px-1 border-r border-slate-200"
              :class="[
                activeCell?.rowIndex === rIdx && activeCell?.colKey === 'nama_satuan'
                  ? 'ring-2 ring-teal-500 z-10'
                  : ''
              ]"
              @click="onCellClick(rIdx, 'nama_satuan')"
            >
              <select
                :value="row.satuan_beli_id"
                :disabled="disabled || !row.bahan_id"
                class="w-full py-1 px-1 text-xs bg-transparent border-0 rounded focus:ring-1 focus:ring-teal-500 text-slate-800 disabled:opacity-60"
                @change="onUnitChange(rIdx, $event)"
                @keydown="onKeyDown($event, rIdx, 'nama_satuan')"
              >
                <option :value="null">- Pilih -</option>
                <option v-for="u in unitOptions" :key="u.id" :value="u.id">
                  {{ u.nama }}
                </option>
              </select>
            </td>

            <!-- 4. Stok (Read-Only from Master Bahan) -->
            <td
              class="py-1 px-3 text-right font-mono bg-slate-50/40 text-slate-600 border-r border-slate-200 select-none"
            >
              {{ row.bahan_id ? row.stok : '-' }}
            </td>

            <!-- 5. Qty (Editable Number) -->
            <td
              :data-cell-id="`${rIdx}-qty`"
              class="py-1 px-1 border-r border-slate-200"
              :class="[
                activeCell?.rowIndex === rIdx && activeCell?.colKey === 'qty'
                  ? 'ring-2 ring-teal-500 z-10'
                  : '',
                row.errors?.qty ? 'bg-rose-50' : ''
              ]"
              @click="onCellClick(rIdx, 'qty')"
            >
              <input
                type="number"
                min="1"
                step="1"
                :value="row.qty ?? ''"
                :disabled="disabled || !row.bahan_id"
                placeholder="0"
                class="w-full py-1 px-2 text-right font-mono text-xs bg-transparent border-0 rounded focus:ring-1 focus:ring-teal-500 text-slate-900 placeholder:text-slate-300 disabled:opacity-50"
                @input="onInputChange(rIdx, 'qty', $event)"
                @keydown="onKeyDown($event, rIdx, 'qty')"
              />
              <p v-if="row.errors?.qty" class="text-[10px] text-rose-600 px-1">
                {{ row.errors.qty }}
              </p>
            </td>

            <!-- 6. Harga (Editable Currency Number) -->
            <td
              :data-cell-id="`${rIdx}-harga`"
              class="py-1 px-1 border-r border-slate-200"
              :class="[
                activeCell?.rowIndex === rIdx && activeCell?.colKey === 'harga'
                  ? 'ring-2 ring-teal-500 z-10'
                  : '',
                row.errors?.harga ? 'bg-rose-50' : ''
              ]"
              @click="onCellClick(rIdx, 'harga')"
            >
              <input
                type="number"
                min="0"
                step="100"
                :value="row.harga ?? ''"
                :disabled="disabled || !row.bahan_id"
                placeholder="0"
                class="w-full py-1 px-2 text-right font-mono text-xs bg-transparent border-0 rounded focus:ring-1 focus:ring-teal-500 text-slate-900 placeholder:text-slate-300 disabled:opacity-50"
                @input="onInputChange(rIdx, 'harga', $event)"
                @keydown="onKeyDown($event, rIdx, 'harga')"
              />
              <p v-if="row.errors?.harga" class="text-[10px] text-rose-600 px-1">
                {{ row.errors.harga }}
              </p>
            </td>

            <!-- 7. Diskon (%) (Editable Number 0-100) -->
            <td
              :data-cell-id="`${rIdx}-diskon`"
              class="py-1 px-1 border-r border-slate-200"
              :class="[
                activeCell?.rowIndex === rIdx && activeCell?.colKey === 'diskon'
                  ? 'ring-2 ring-teal-500 z-10'
                  : '',
                row.errors?.diskon ? 'bg-rose-50' : ''
              ]"
              @click="onCellClick(rIdx, 'diskon')"
            >
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                :value="row.diskon ?? 0"
                :disabled="disabled || !row.bahan_id"
                class="w-full py-1 px-2 text-right font-mono text-xs bg-transparent border-0 rounded focus:ring-1 focus:ring-teal-500 text-slate-900 disabled:opacity-50"
                @input="onInputChange(rIdx, 'diskon', $event)"
                @keydown="onKeyDown($event, rIdx, 'diskon')"
              />
              <p v-if="row.errors?.diskon" class="text-[10px] text-rose-600 px-1">
                {{ row.errors.diskon }}
              </p>
            </td>

            <!-- 8. Subtotal (Read-Only Calculated) -->
            <td
              class="py-1 px-3 text-right font-mono font-semibold bg-slate-50/50 text-slate-800 border-r border-slate-200 select-none"
            >
              {{ row.bahan_id ? formatCurrency(row.subtotal || 0) : '-' }}
            </td>

            <!-- 9. Keterangan -->
            <td
              :data-cell-id="`${rIdx}-keterangan`"
              class="py-1 px-2"
              :class="[
                activeCell?.rowIndex === rIdx && activeCell?.colKey === 'keterangan'
                  ? 'ring-2 ring-teal-500 z-10'
                  : ''
              ]"
              @click="onCellClick(rIdx, 'keterangan')"
            >
              <input
                type="text"
                maxlength="255"
                :value="row.keterangan || ''"
                :disabled="disabled || !row.bahan_id"
                placeholder="Catatan item..."
                class="w-full py-1 px-2 text-xs bg-transparent border-0 rounded focus:ring-1 focus:ring-teal-500 text-slate-800 placeholder:text-slate-300 disabled:opacity-50"
                @input="onInputChange(rIdx, 'keterangan', $event)"
                @keydown="onKeyDown($event, rIdx, 'keterangan')"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Floating Material Selector Modal / Popup -->
    <PurchaseOrderMaterialPicker
      :is-open="isPickerOpen"
      :anchor-rect="pickerAnchorRect"
      @select="emit('select-material', $event)"
      @close="emit('close-picker')"
    />
  </div>
</template>
