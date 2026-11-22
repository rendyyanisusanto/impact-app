<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ProductionProductRow, SelectableProduct } from '../types/production.types'
import ProductionProductPicker from './ProductionProductPicker.vue'
import { Plus, Trash2, HelpCircle, Search, Layers, Inbox } from 'lucide-vue-next'
import { formatNumber } from '@/shared/utils/formatters'

const props = defineProps<{
  rows: ProductionProductRow[]
  activeCell: { rowIndex: number; colKey: string } | null
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'set-active-cell', rowIndex: number, colKey: string): void
  (e: 'add-row', count?: number): void
  (e: 'remove-row', index: number): void
  (e: 'update-cell', rowIndex: number, colKey: keyof ProductionProductRow, value: unknown): void
  (e: 'cell-keydown', event: KeyboardEvent, rowIndex: number, colKey: string): void
  (e: 'select-product', rowIndex: number, product: SelectableProduct): void
}>()

const isPickerOpen = ref(false)
const targetRowIndexForPicker = ref<number | null>(null)
const selectedRows = ref<Set<number>>(new Set())

function openPickerForRow(rowIndex: number) {
  if (props.disabled) return
  targetRowIndexForPicker.value = rowIndex
  isPickerOpen.value = true
}

function closePicker() {
  isPickerOpen.value = false
  targetRowIndexForPicker.value = null
}

function handleProductSelected(product: SelectableProduct) {
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

function onInputChange(rowIndex: number, colKey: keyof ProductionProductRow, event: Event) {
  const target = event.target as HTMLInputElement
  let val: unknown = target.value
  if (colKey === 'qty') {
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
    // If none checked, remove active row
    if (props.activeCell && props.rows.length > 1) {
      emit('remove-row', props.activeCell.rowIndex)
    }
    return
  }

  // Remove sorted descending
  const indices = Array.from(selectedRows.value).sort((a, b) => b - a)
  for (const idx of indices) {
    if (props.rows.length > 1) {
      emit('remove-row', idx)
    }
  }
  selectedRows.value.clear()
}

const filledCount = computed(() => {
  return props.rows.filter(r => r.produk_id && r.qty > 0).length
})

const totalProductionQty = computed(() => {
  return props.rows.reduce((sum, r) => sum + (Number(r.qty) || 0), 0)
})
</script>

<template>
  <div
    class="production-spreadsheet-container flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
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
          Rincian Produk Jadi
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
            >Total Target Qty:
            <b class="text-teal-700">{{ formatNumber(totalProductionQty) }}</b> Unit</span
          >
        </div>
      </div>
    </div>

    <!-- Excel-like Grid Spreadsheet -->
    <div class="overflow-x-auto relative">
      <table class="w-full border-collapse text-left text-xs min-w-[760px]">
        <thead>
          <tr
            class="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-semibold tracking-wider select-none"
          >
            <th class="w-10 p-2 text-center border-r border-slate-200">
              <input
                type="checkbox"
                class="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                :checked="selectedRows.size === rows.length && rows.length > 0"
                :disabled="disabled"
                @change="toggleSelectAll"
              />
            </th>
            <th class="w-12 p-2 text-center border-r border-slate-200">No</th>
            <th class="min-w-[280px] p-2 px-3 border-r border-slate-200">
              Nama Produk <span class="text-rose-500">*</span>
            </th>
            <th class="w-36 p-2 px-3 text-right border-r border-slate-200 bg-slate-50">
              Stok Saat Ini
            </th>
            <th class="w-36 p-2 px-3 text-right border-r border-slate-200">
              Qty Target <span class="text-rose-500">*</span>
            </th>
            <th class="min-w-[200px] p-2 px-3 border-r border-slate-200">Keterangan</th>
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

            <!-- Nama Produk (Double click opens picker) -->
            <td
              class="p-0 border-r border-slate-200 relative cursor-pointer"
              :class="{
                'ring-2 ring-teal-500 ring-inset bg-teal-50/30':
                  activeCell?.rowIndex === idx && activeCell?.colKey === 'nama_produk'
              }"
              @click="onCellClick(idx, 'nama_produk')"
              @dblclick="onCellDblClick(idx, 'nama_produk')"
            >
              <div class="flex items-center justify-between px-3 py-2 w-full h-full min-h-[36px]">
                <div v-if="row.produk_id" class="flex flex-col truncate pr-2">
                  <span class="font-medium text-slate-800 truncate">{{ row.nama_produk }}</span>
                  <span class="text-[10px] font-mono text-slate-400"
                    >Kode: {{ row.kode_produk }}</span
                  >
                </div>
                <div v-else class="text-slate-400 italic text-xs flex items-center gap-1.5">
                  <Search class="w-3.5 h-3.5 text-slate-300" />
                  <span>Double-click untuk memilih produk...</span>
                </div>

                <button
                  v-if="!disabled"
                  type="button"
                  tabindex="-1"
                  class="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-teal-600 rounded transition-opacity"
                  title="Pilih Produk Furniture"
                  @click.stop="openPickerForRow(idx)"
                >
                  <Search class="w-3.5 h-3.5" />
                </button>
              </div>
            </td>

            <!-- Stok Riil Gudang (Read-only) -->
            <td
              class="p-2 px-3 text-right border-r border-slate-200 bg-slate-50/50 font-mono text-xs select-none"
              :class="[
                row.produk_id && row.stok > 0 ? 'text-slate-700 font-semibold' : 'text-slate-400'
              ]"
            >
              <span v-if="row.produk_id">
                {{ formatNumber(row.stok) }}
                <span class="text-[10px] text-slate-400">{{ row.satuan_nama || 'Pcs' }}</span>
              </span>
              <span v-else class="text-slate-300">-</span>
            </td>

            <!-- Qty Target Produksi (Editable Number) -->
            <td
              class="p-0 border-r border-slate-200 relative"
              :class="{
                'ring-2 ring-teal-500 ring-inset bg-teal-50/30':
                  activeCell?.rowIndex === idx && activeCell?.colKey === 'qty'
              }"
              @click="onCellClick(idx, 'qty')"
            >
              <input
                type="number"
                min="1"
                step="1"
                :value="row.qty || ''"
                :disabled="disabled || !row.produk_id"
                placeholder="0"
                class="w-full h-full py-2 px-3 text-right font-mono text-xs font-semibold focus:outline-none bg-transparent transition-colors text-slate-800 disabled:bg-slate-50/50 disabled:text-slate-400"
                :class="[
                  row.produk_id && (row.qty <= 0 || isNaN(row.qty))
                    ? 'border-b-2 border-rose-500 text-rose-600 bg-rose-50/20'
                    : ''
                ]"
                @input="onInputChange(idx, 'qty', $event)"
                @keydown="onKeydown($event, idx, 'qty')"
              />
            </td>

            <!-- Keterangan (Editable Text) -->
            <td
              class="p-0 border-r border-slate-200 relative"
              :class="{
                'ring-2 ring-teal-500 ring-inset bg-teal-50/30':
                  activeCell?.rowIndex === idx && activeCell?.colKey === 'keterangan'
              }"
              @click="onCellClick(idx, 'keterangan')"
            >
              <input
                type="text"
                maxlength="255"
                :value="row.keterangan || ''"
                :disabled="disabled"
                placeholder="Catatan pengerjaan / spesifikasi..."
                class="w-full h-full py-2 px-3 text-xs focus:outline-none bg-transparent text-slate-700 placeholder-slate-300 disabled:bg-slate-50/50"
                @input="onInputChange(idx, 'keterangan', $event)"
                @keydown="onKeydown($event, idx, 'keterangan')"
              />
            </td>

            <!-- Action Delete Row -->
            <td class="p-1 text-center">
              <button
                type="button"
                :disabled="disabled || rows.length <= 1"
                class="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
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

    <!-- Empty Table Fallback (should not normally happen with minimum 1 row) -->
    <div v-if="rows.length === 0" class="p-10 text-center text-slate-400 bg-slate-50">
      <Inbox class="w-10 h-10 mx-auto mb-2 text-slate-300" />
      <p class="text-sm font-medium text-slate-600">Tidak ada baris produk</p>
      <button
        type="button"
        class="mt-3 px-3 py-1.5 text-xs font-medium text-teal-700 bg-white border border-teal-300 rounded-lg shadow-xs hover:bg-teal-50"
        @click="emit('add-row', 1)"
      >
        Tambah Baris Pertama
      </button>
    </div>

    <!-- Product Picker Modal -->
    <ProductionProductPicker
      :is-open="isPickerOpen"
      @close="closePicker"
      @select="handleProductSelected"
    />
  </div>
</template>

<style scoped>
/* Chrome, Safari, Edge, Opera: remove number arrows for clean spreadsheet look */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
/* Firefox */
input[type='number'] {
  -moz-appearance: textfield;
}
</style>
