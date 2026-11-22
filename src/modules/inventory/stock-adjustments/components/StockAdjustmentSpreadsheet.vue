<script setup lang="ts">
import { ref } from 'vue'
import type { StockAdjustmentDetailRow } from '../types/stock-adjustment.types'
import StockAdjustmentMaterialPicker from './StockAdjustmentMaterialPicker.vue'
import { Plus, Trash2, HelpCircle, Search, Inbox } from 'lucide-vue-next'
import { formatNumber, formatCurrency } from '@/shared/utils/formatters'

interface SelectableMaterial {
  id: number
  kode: string
  nama: string
  qty: number
  gudang_id: number | null
  gudang_nama: string
  satuan_pakai_id: number | null
  satuan_nama: string
  harga_satuan: number
}

defineProps<{
  rows: StockAdjustmentDetailRow[]
  activeCell: { rowIndex: number; colKey: string } | null
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'set-active-cell', rowIndex: number, colKey: string): void
  (e: 'add-row', count?: number): void
  (e: 'remove-row', index: number): void
  (e: 'update-cell', rowIndex: number, colKey: keyof StockAdjustmentDetailRow, value: unknown): void
  (e: 'cell-keydown', event: KeyboardEvent, rowIndex: number, colKey: string): void
  (e: 'select-material', rowIndex: number, material: SelectableMaterial): void
}>()

const isPickerOpen = ref(false)
const targetRowIndexForPicker = ref<number | null>(null)

function openPickerForRow(rowIndex: number) {
  targetRowIndexForPicker.value = rowIndex
  isPickerOpen.value = true
}

function closePicker() {
  isPickerOpen.value = false
  targetRowIndexForPicker.value = null
}

function handleMaterialSelected(material: SelectableMaterial) {
  if (targetRowIndexForPicker.value !== null) {
    emit('select-material', targetRowIndexForPicker.value, material)
  }
  closePicker()
}

function onCellClick(rowIndex: number, colKey: string) {
  emit('set-active-cell', rowIndex, colKey)
}

function onStokAkhirInput(rowIndex: number, event: Event) {
  const target = event.target as HTMLInputElement
  const raw = target.value.trim()
  if (raw === '') {
    emit('update-cell', rowIndex, 'stok_akhir', null)
    return
  }
  const val = parseInt(raw, 10)
  emit('update-cell', rowIndex, 'stok_akhir', isNaN(val) ? 0 : Math.max(0, val))
}

function onKeteranganInput(rowIndex: number, event: Event) {
  const target = event.target as HTMLInputElement
  emit('update-cell', rowIndex, 'keterangan', target.value)
}

function onKeyDown(event: KeyboardEvent, rowIndex: number, colKey: string) {
  if (
    (colKey === 'kode_bahan' || colKey === 'nama_bahan') &&
    (event.key === 'Enter' || event.key === ' ')
  ) {
    event.preventDefault()
    openPickerForRow(rowIndex)
    return
  }
  emit('cell-keydown', event, rowIndex, colKey)
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
          @click="emit('remove-row', rows.length - 1)"
        >
          <Trash2 class="w-3.5 h-3.5" />
          <span>Hapus Baris Terakhir</span>
        </button>
      </div>

      <div class="flex items-center gap-1.5 text-xs text-slate-500">
        <HelpCircle class="w-4 h-4 text-teal-600" />
        <span>
          Double-click pada <strong>Kode</strong> atau <strong>Nama Bahan</strong> untuk memilih.
          Ketik <strong>Stok Fisik</strong> dan sistem otomatis menghitung <strong>Selisih</strong>.
        </span>
      </div>
    </div>

    <!-- Table Container -->
    <div class="overflow-x-auto min-h-[240px]">
      <table class="w-full border-collapse text-left text-xs">
        <thead
          class="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300 sticky top-0 z-10 select-none"
        >
          <tr>
            <th class="w-10 px-2 py-2 text-center border-r border-slate-200">No</th>
            <th class="w-28 px-3 py-2 border-r border-slate-200">Kode Bahan</th>
            <th class="min-w-[200px] px-3 py-2 border-r border-slate-200">Nama Bahan Baku</th>
            <th class="w-32 px-2 py-2 border-r border-slate-200">Gudang</th>
            <th class="w-16 px-2 py-2 text-center border-r border-slate-200">Satuan</th>
            <th
              class="w-24 px-2 py-2 text-right border-r border-slate-200 bg-slate-50 text-slate-700"
            >
              Stok Sistem
            </th>
            <th
              class="w-28 px-2 py-2 text-right border-r border-slate-200 bg-amber-50/70 text-amber-900 font-bold"
            >
              Stok Fisik *
            </th>
            <th class="w-24 px-2 py-2 text-right border-r border-slate-200 font-bold">Selisih</th>
            <th class="w-32 px-2 py-2 text-right border-r border-slate-200">Nilai Selisih</th>
            <th class="min-w-[160px] px-3 py-2 border-r border-slate-200">Keterangan / Alasan</th>
            <th class="w-12 px-2 py-2 text-center">Aksi</th>
          </tr>
        </thead>

        <tbody class="divide-y divide-slate-200">
          <tr v-if="rows.length === 0">
            <td colspan="11" class="py-12 text-center text-slate-400 bg-slate-50/40">
              <div class="flex flex-col items-center justify-center space-y-2">
                <Inbox class="w-8 h-8 text-slate-300 stroke-[1.5]" />
                <p class="text-xs font-medium text-slate-500">Belum ada baris bahan.</p>
                <button
                  type="button"
                  class="text-xs text-teal-600 hover:text-teal-700 font-semibold"
                  @click="emit('add-row', 1)"
                >
                  + Klik untuk tambah baris
                </button>
              </div>
            </td>
          </tr>

          <tr
            v-for="(row, idx) in rows"
            :key="row.id"
            :class="[
              'hover:bg-slate-50/70 transition-colors',
              activeCell?.rowIndex === idx ? 'bg-teal-50/20' : ''
            ]"
          >
            <!-- No -->
            <td
              class="px-2 py-1.5 text-center font-mono text-slate-500 border-r border-slate-200 bg-slate-50/40"
            >
              {{ idx + 1 }}
            </td>

            <!-- Kode Bahan -->
            <td
              :class="[
                'px-2 py-1.5 border-r border-slate-200 cursor-pointer font-mono font-semibold',
                activeCell?.rowIndex === idx && activeCell?.colKey === 'kode_bahan'
                  ? 'ring-2 ring-inset ring-teal-500 bg-teal-50/40'
                  : ''
              ]"
              tabindex="0"
              @click="onCellClick(idx, 'kode_bahan')"
              @dblclick="openPickerForRow(idx)"
              @keydown="onKeyDown($event, idx, 'kode_bahan')"
            >
              <div class="flex items-center justify-between text-slate-700">
                <span v-if="row.kode_bahan">{{ row.kode_bahan }}</span>
                <button
                  v-else
                  type="button"
                  :disabled="disabled"
                  class="text-[11px] text-slate-400 hover:text-teal-600 italic flex items-center gap-1"
                  @click.stop="openPickerForRow(idx)"
                >
                  <Search class="w-3 h-3 text-slate-400" />
                  <span>Pilih...</span>
                </button>
              </div>
            </td>

            <!-- Nama Bahan -->
            <td
              :class="[
                'px-2 py-1.5 border-r border-slate-200 cursor-pointer',
                activeCell?.rowIndex === idx && activeCell?.colKey === 'nama_bahan'
                  ? 'ring-2 ring-inset ring-teal-500 bg-teal-50/40'
                  : ''
              ]"
              tabindex="0"
              @click="onCellClick(idx, 'nama_bahan')"
              @dblclick="openPickerForRow(idx)"
              @keydown="onKeyDown($event, idx, 'nama_bahan')"
            >
              <div class="flex items-center justify-between gap-1.5">
                <template v-if="row.nama_bahan">
                  <span
                    class="font-medium text-slate-800 truncate"
                    :title="row.nama_bahan"
                  >
                    {{ row.nama_bahan }}
                  </span>
                  <button
                    type="button"
                    :disabled="disabled"
                    class="p-1 rounded text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors shrink-0"
                    title="Ganti Bahan Baku"
                    @click.stop="openPickerForRow(idx)"
                  >
                    <Search class="w-3.5 h-3.5" />
                  </button>
                </template>

                <template v-else>
                  <button
                    type="button"
                    :disabled="disabled"
                    class="w-full text-left inline-flex items-center justify-between px-2.5 py-1 text-xs text-slate-600 hover:text-teal-700 bg-slate-50 hover:bg-teal-50 border border-slate-300 hover:border-teal-400 rounded transition-colors group"
                    @click.stop="openPickerForRow(idx)"
                  >
                    <span class="flex items-center gap-1.5">
                      <Search class="w-3.5 h-3.5 text-teal-600" />
                      <span class="font-medium">Pilih Bahan Baku...</span>
                    </span>
                    <span class="text-[10px] text-slate-400 group-hover:text-teal-600">Klik / Enter</span>
                  </button>
                </template>
              </div>
            </td>

            <!-- Gudang -->
            <td class="px-2 py-1.5 border-r border-slate-200 text-slate-600">
              {{ row.nama_gudang || '—' }}
            </td>

            <!-- Satuan -->
            <td class="px-2 py-1.5 text-center border-r border-slate-200 text-slate-600 font-mono">
              {{ row.nama_satuan || '—' }}
            </td>

            <!-- Stok Sistem (Read-only) -->
            <td
              class="px-2 py-1.5 text-right font-mono border-r border-slate-200 bg-slate-50/50 text-slate-700"
            >
              <span v-if="row.bahan_id" class="font-medium">
                {{ formatNumber(row.stok_awal) }}
              </span>
              <span v-else class="text-slate-400">—</span>
            </td>

            <!-- Stok Fisik (Editable Number Input) -->
            <td
              :class="[
                'px-1 py-1 border-r border-slate-200 text-right',
                activeCell?.rowIndex === idx && activeCell?.colKey === 'stok_akhir'
                  ? 'ring-2 ring-inset ring-teal-500 bg-amber-50/60'
                  : 'bg-amber-50/30'
              ]"
            >
              <input
                :id="'stok-akhir-input-' + idx"
                type="number"
                min="0"
                :value="row.stok_akhir ?? ''"
                :disabled="disabled || !row.bahan_id"
                placeholder="0"
                class="w-full text-right font-mono font-bold text-xs py-1 px-2 border-0 bg-transparent focus:outline-none focus:ring-0 text-slate-900 placeholder:text-slate-300"
                @focus="onCellClick(idx, 'stok_akhir')"
                @input="onStokAkhirInput(idx, $event)"
                @keydown="onKeyDown($event, idx, 'stok_akhir')"
              />
            </td>

            <!-- Selisih (Calculated) -->
            <td class="px-2 py-1.5 text-right font-mono border-r border-slate-200">
              <template v-if="row.bahan_id && row.stok_akhir !== null">
                <span
                  v-if="row.selisih > 0"
                  class="inline-block px-1.5 py-0.5 rounded text-[11px] font-bold text-emerald-700 bg-emerald-50"
                  title="Stok fisik lebih banyak (+)"
                >
                  +{{ formatNumber(row.selisih) }}
                </span>
                <span
                  v-else-if="row.selisih < 0"
                  class="inline-block px-1.5 py-0.5 rounded text-[11px] font-bold text-rose-700 bg-rose-50"
                  title="Stok fisik lebih sedikit (-)"
                >
                  {{ formatNumber(row.selisih) }}
                </span>
                <span
                  v-else
                  class="inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold text-slate-600 bg-slate-100"
                  title="Cocok (tidak ada selisih)"
                >
                  0
                </span>
              </template>
              <span v-else class="text-slate-400">—</span>
            </td>

            <!-- Nilai Selisih -->
            <td class="px-2 py-1.5 text-right font-mono border-r border-slate-200">
              <template v-if="row.bahan_id && row.stok_akhir !== null">
                <span
                  :class="[
                    'text-[11px] font-medium',
                    row.nilai_selisih > 0
                      ? 'text-emerald-700'
                      : row.nilai_selisih < 0
                        ? 'text-rose-700'
                        : 'text-slate-500'
                  ]"
                >
                  {{ formatCurrency(row.nilai_selisih) }}
                </span>
              </template>
              <span v-else class="text-slate-400">—</span>
            </td>

            <!-- Keterangan / Alasan -->
            <td
              :class="[
                'px-1 py-1 border-r border-slate-200',
                activeCell?.rowIndex === idx && activeCell?.colKey === 'keterangan'
                  ? 'ring-2 ring-inset ring-teal-500'
                  : ''
              ]"
            >
              <input
                type="text"
                :value="row.keterangan"
                :disabled="disabled"
                placeholder="Alasan selisih..."
                class="w-full text-xs py-1 px-2 border-0 bg-transparent focus:outline-none focus:ring-0 text-slate-800 placeholder:text-slate-300"
                @focus="onCellClick(idx, 'keterangan')"
                @input="onKeteranganInput(idx, $event)"
                @keydown="onKeyDown($event, idx, 'keterangan')"
              />
            </td>

            <!-- Aksi -->
            <td class="px-2 py-1 text-center">
              <button
                type="button"
                :disabled="disabled || rows.length <= 1"
                class="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30"
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

    <!-- Material Picker Modal on double-click -->
    <StockAdjustmentMaterialPicker
      :is-open="isPickerOpen"
      @select="handleMaterialSelected"
      @close="closePicker"
    />
  </div>
</template>
