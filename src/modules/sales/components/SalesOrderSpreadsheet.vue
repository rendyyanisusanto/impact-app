<script setup lang="ts">
import { ref, computed } from 'vue'
import type { SalesOrderProductRow } from '../types/sales-order.types'
import type { Produk } from '@/modules/inventory/products/types/product.types'
import SalesOrderProductPicker from './SalesOrderProductPicker.vue'
import { Plus, Trash2, HelpCircle, Layers, Package } from 'lucide-vue-next'
import { formatNumber, formatCurrency } from '@/shared/utils/formatters'

const props = defineProps<{
  rows: SalesOrderProductRow[]
  activeCell: { rowIndex: number; colKey: string } | null
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'set-active-cell', rowIndex: number, colKey: string): void
  (e: 'add-row', count?: number): void
  (e: 'remove-row', index: number): void
  (e: 'update-cell', rowIndex: number, colKey: keyof SalesOrderProductRow, value: unknown): void
  (e: 'cell-keydown', event: KeyboardEvent, rowIndex: number, colKey: string): void
  (e: 'select-product', rowIndex: number, product: Produk): void
}>()

const isPickerOpen = ref(false)
const targetRowIndexForPicker = ref<number | null>(null)
const selectedRows = ref<Set<number>>(new Set())

const jenisStokOptions = [
  { value: 0, label: 'Ready Stock' },
  { value: 1, label: 'Produksi' }
]

function openPickerForRow(rowIndex: number) {
  if (props.disabled) return
  targetRowIndexForPicker.value = rowIndex
  isPickerOpen.value = true
}

function closePicker() {
  isPickerOpen.value = false
  targetRowIndexForPicker.value = null
}

function handleProductSelected(product: Produk) {
  if (targetRowIndexForPicker.value !== null) {
    emit('select-product', targetRowIndexForPicker.value, product)
  }
  closePicker()
}

function onCellClick(rowIndex: number, colKey: string) {
  if (props.disabled) return
  emit('set-active-cell', rowIndex, colKey)
}

function onCellDblClick(rowIndex: number, colKey: string) {
  if (props.disabled) return
  if (colKey === 'nama_produk' || colKey === 'kode_produk') {
    openPickerForRow(rowIndex)
  }
}

function onInputChange(rowIndex: number, colKey: keyof SalesOrderProductRow, event: Event) {
  const target = event.target as HTMLInputElement
  let val: unknown = target.value
  if (colKey === 'qty' || colKey === 'harga' || colKey === 'diskon') {
    val = target.value === '' ? 0 : Number(target.value)
  }
  emit('update-cell', rowIndex, colKey, val)
}

function onKeydown(event: KeyboardEvent, rowIndex: number, colKey: string) {
  if (colKey === 'nama_produk' && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault()
    openPickerForRow(rowIndex)
    return
  }
  emit('cell-keydown', event, rowIndex, colKey)
}

function toggleSelectRow(idx: number) {
  if (selectedRows.value.has(idx)) {
    selectedRows.value.delete(idx)
  } else {
    selectedRows.value.add(idx)
  }
}

function toggleSelectAll() {
  if (selectedRows.value.size === props.rows.length) {
    selectedRows.value.clear()
  } else {
    selectedRows.value = new Set(props.rows.map((_, i) => i))
  }
}

function removeSelectedRows() {
  if (selectedRows.value.size === 0) {
    if (props.activeCell && props.rows.length > 1) {
      emit('remove-row', props.activeCell.rowIndex)
    }
    return
  }

  const indices = Array.from(selectedRows.value).sort((a, b) => b - a)
  indices.forEach(idx => {
    emit('remove-row', idx)
  })
  selectedRows.value.clear()
}

const filledCount = computed(() => {
  return props.rows.filter(r => (r.produk_id || 0) > 0).length
})

const totalOrderQty = computed(() => {
  return props.rows.reduce((sum, r) => sum + (Number(r.qty) || 0), 0)
})
</script>

<template>
  <div
    class="sales-order-spreadsheet-container flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs"
  >
    <!-- Spreadsheet Toolbar -->
    <div
      class="px-5 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3"
    >
      <div class="flex items-center gap-2">
        <span
          class="text-xs font-semibold uppercase tracking-wider text-slate-500 mr-2 flex items-center gap-1.5"
        >
          <Layers class="w-3.5 h-3.5 text-slate-400" />
          Rincian Produk Pesanan (Sales Order)
        </span>

        <button
          type="button"
          :disabled="disabled"
          class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-teal-700 hover:border-teal-300 disabled:opacity-50 transition-all shadow-xs"
          @click="emit('add-row', 1)"
        >
          <Plus class="w-3.5 h-3.5 text-teal-600" />
          <span>Tambah Baris</span>
        </button>

        <button
          type="button"
          :disabled="disabled"
          class="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-all shadow-xs"
          title="Tambah 5 Baris Sekaligus"
          @click="emit('add-row', 5)"
        >
          <span>+5 Baris</span>
        </button>

        <button
          type="button"
          :disabled="disabled || rows.length <= 1"
          class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 disabled:opacity-50 transition-all shadow-xs"
          @click="removeSelectedRows"
        >
          <Trash2 class="w-3.5 h-3.5 text-rose-500" />
          <span>Hapus Baris {{ selectedRows.size > 0 ? `(${selectedRows.size})` : '' }}</span>
        </button>
      </div>

      <div class="flex items-center gap-4 text-xs text-slate-500">
        <div class="flex items-center gap-1 text-[11px] text-slate-400">
          <HelpCircle class="w-3.5 h-3.5" />
          <span
            >Double-click / Enter pada cell <b>Nama Produk</b> untuk membuka Product Picker</span
          >
        </div>
        <div class="hidden md:flex items-center gap-3 pl-3 border-l border-slate-200 font-medium">
          <span
            >Produk Terisi: <b class="text-slate-800">{{ filledCount }}</b></span
          >
          <span
            >Total Qty: <b class="text-teal-700">{{ formatNumber(totalOrderQty) }}</b> Unit</span
          >
        </div>
      </div>
    </div>

    <!-- Excel-like Grid Spreadsheet -->
    <div class="overflow-x-auto relative">
      <table class="w-full border-collapse text-left text-xs min-w-[960px]">
        <thead>
          <tr
            class="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-semibold tracking-wider select-none"
          >
            <th class="w-10 p-2 text-center border-r border-slate-200">
              <input
                type="checkbox"
                class="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                :checked="selectedRows.size === rows.length && rows.length > 0"
                :disabled="disabled"
                @change="toggleSelectAll"
              />
            </th>
            <th class="w-12 p-2 text-center border-r border-slate-200">No</th>
            <th class="min-w-[240px] p-2 px-3 border-r border-slate-200">
              Nama Produk <span class="text-rose-500">*</span>
            </th>
            <th class="w-24 p-2 px-3 text-right border-r border-slate-200 bg-slate-50">Stok</th>
            <th class="w-24 p-2 px-3 text-right border-r border-slate-200">
              Qty <span class="text-rose-500">*</span>
            </th>
            <th class="w-32 p-2 px-3 border-r border-slate-200">Jenis Stok</th>
            <th class="w-32 p-2 px-3 text-right border-r border-slate-200">Harga (Rp)</th>
            <th class="w-24 p-2 px-3 text-right border-r border-slate-200">Diskon (%)</th>
            <th class="w-36 p-2 px-3 text-right border-r border-slate-200 bg-slate-50">Subtotal</th>
            <th class="min-w-[160px] p-2 px-3 border-r border-slate-200">Keterangan</th>
            <th class="w-12 p-2 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 bg-white">
          <tr
            v-for="(row, idx) in rows"
            :key="row.rowId || idx"
            class="transition-colors group"
            :class="[
              selectedRows.has(idx) ? 'bg-teal-50/40' : 'hover:bg-slate-50/60',
              activeCell?.rowIndex === idx ? 'bg-blue-50/20' : ''
            ]"
          >
            <!-- Checkbox Selection -->
            <td class="p-1.5 text-center border-r border-slate-200">
              <input
                type="checkbox"
                class="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                :checked="selectedRows.has(idx)"
                :disabled="disabled"
                @change="toggleSelectRow(idx)"
              />
            </td>

            <!-- Read-only Row Index -->
            <td
              class="p-2 text-center text-slate-400 font-mono text-[11px] border-r border-slate-200 select-none"
            >
              {{ idx + 1 }}
            </td>

            <!-- Nama Produk (Interactive Picker Cell) -->
            <td
              class="p-1 px-2 border-r border-slate-200 cursor-pointer relative"
              :class="
                activeCell?.rowIndex === idx && activeCell?.colKey === 'nama_produk'
                  ? 'ring-2 ring-teal-500 ring-inset'
                  : ''
              "
              @click="onCellClick(idx, 'nama_produk')"
              @dblclick="onCellDblClick(idx, 'nama_produk')"
              @keydown="onKeydown($event, idx, 'nama_produk')"
            >
              <div v-if="row.produk_id" class="flex items-center justify-between gap-1.5">
                <div class="truncate">
                  <span class="font-medium text-slate-800">{{ row.nama_produk }}</span>
                  <span v-if="row.kode_produk" class="text-[11px] font-mono text-slate-400 ml-1.5">
                    ({{ row.kode_produk }})
                  </span>
                </div>
                <button
                  type="button"
                  class="text-[11px] text-teal-600 hover:text-teal-800 font-medium shrink-0"
                  :disabled="disabled"
                  @click.stop="openPickerForRow(idx)"
                >
                  Ubah
                </button>
              </div>
              <div
                v-else
                class="text-slate-400 italic text-[11px] flex items-center justify-between py-1"
              >
                <span>Double-click untuk memilih produk...</span>
                <Package class="w-3.5 h-3.5 text-slate-300" />
              </div>
            </td>

            <!-- Stok Saat Ini (Read-only) -->
            <td
              class="p-2 px-3 text-right font-mono text-slate-600 border-r border-slate-200 bg-slate-50/50 select-none text-[11px]"
            >
              <span v-if="row.produk_id">
                {{ formatNumber(row.stok_saat_ini) }} {{ row.satuan_nama || 'Pcs' }}
              </span>
              <span v-else class="text-slate-300">-</span>
            </td>

            <!-- Qty (Inline Editable) -->
            <td
              class="p-0 border-r border-slate-200"
              :class="
                activeCell?.rowIndex === idx && activeCell?.colKey === 'qty'
                  ? 'ring-2 ring-teal-500 ring-inset'
                  : ''
              "
            >
              <input
                :value="row.qty"
                type="number"
                min="0"
                step="1"
                :disabled="disabled"
                placeholder="0"
                class="w-full h-full py-2 px-3 text-right font-mono font-medium bg-transparent focus:outline-none text-slate-800"
                @focus="onCellClick(idx, 'qty')"
                @input="onInputChange(idx, 'qty', $event)"
                @keydown="onKeydown($event, idx, 'qty')"
              />
            </td>

            <!-- Jenis Stok (Dropdown: Ready Stock vs Produksi) -->
            <td
              class="p-0 border-r border-slate-200"
              :class="
                activeCell?.rowIndex === idx && activeCell?.colKey === 'status_produksi'
                  ? 'ring-2 ring-teal-500 ring-inset'
                  : ''
              "
            >
              <select
                :value="row.status_produksi"
                :disabled="disabled"
                class="w-full h-full py-2 px-2 text-xs bg-transparent focus:outline-none text-slate-800 cursor-pointer"
                @focus="onCellClick(idx, 'status_produksi')"
                @change="
                  emit(
                    'update-cell',
                    idx,
                    'status_produksi',
                    Number(($event.target as HTMLSelectElement).value)
                  )
                "
              >
                <option v-for="opt in jenisStokOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </td>

            <!-- Harga (Inline Editable) -->
            <td
              class="p-0 border-r border-slate-200"
              :class="
                activeCell?.rowIndex === idx && activeCell?.colKey === 'harga'
                  ? 'ring-2 ring-teal-500 ring-inset'
                  : ''
              "
            >
              <input
                :value="row.harga"
                type="number"
                min="0"
                step="1000"
                :disabled="disabled"
                placeholder="0"
                class="w-full h-full py-2 px-3 text-right font-mono font-medium bg-transparent focus:outline-none text-slate-800"
                @focus="onCellClick(idx, 'harga')"
                @input="onInputChange(idx, 'harga', $event)"
                @keydown="onKeydown($event, idx, 'harga')"
              />
            </td>

            <!-- Diskon % (Inline Editable) -->
            <td
              class="p-0 border-r border-slate-200"
              :class="
                activeCell?.rowIndex === idx && activeCell?.colKey === 'diskon'
                  ? 'ring-2 ring-teal-500 ring-inset'
                  : ''
              "
            >
              <input
                :value="row.diskon"
                type="number"
                min="0"
                max="100"
                step="1"
                :disabled="disabled"
                placeholder="0"
                class="w-full h-full py-2 px-3 text-right font-mono font-medium bg-transparent focus:outline-none text-slate-800"
                @focus="onCellClick(idx, 'diskon')"
                @input="onInputChange(idx, 'diskon', $event)"
                @keydown="onKeydown($event, idx, 'diskon')"
              />
            </td>

            <!-- Subtotal (Calculated Read-only) -->
            <td
              class="p-2 px-3 text-right font-mono font-semibold text-slate-800 border-r border-slate-200 bg-slate-50/50 select-none text-xs"
            >
              {{ formatCurrency(row.subtotal) }}
            </td>

            <!-- Keterangan (Inline Editable) -->
            <td
              class="p-0 border-r border-slate-200"
              :class="
                activeCell?.rowIndex === idx && activeCell?.colKey === 'keterangan'
                  ? 'ring-2 ring-teal-500 ring-inset'
                  : ''
              "
            >
              <input
                :value="row.keterangan"
                type="text"
                :disabled="disabled"
                maxlength="150"
                placeholder="Catatan item (warna, model)..."
                class="w-full h-full py-2 px-3 text-xs bg-transparent focus:outline-none text-slate-800 placeholder-slate-300"
                @focus="onCellClick(idx, 'keterangan')"
                @input="onInputChange(idx, 'keterangan', $event)"
                @keydown="onKeydown($event, idx, 'keterangan')"
              />
            </td>

            <!-- Action: Delete single row -->
            <td class="p-1 text-center">
              <button
                type="button"
                :disabled="disabled || rows.length <= 1"
                class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors disabled:opacity-30"
                title="Hapus baris ini"
                @click="emit('remove-row', idx)"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Product Picker Modal -->
    <SalesOrderProductPicker
      :is-open="isPickerOpen"
      @close="closePicker"
      @select="handleProductSelected"
    />
  </div>
</template>
