<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import StockAdjustmentSpreadsheet from '../components/StockAdjustmentSpreadsheet.vue'
import { stockAdjustmentService } from '../services/stock-adjustment.service'
import type {
  StockAdjustmentDetailRow,
  SelectableMaterial,
  StockConflictItem
} from '../types/stock-adjustment.types'
import { useToast } from '@/shared/composables/useToast'
import { formatCurrency } from '@/shared/utils/formatters'
import {
  ArrowLeft,
  Save,
  Send,
  Layers,
  FileText,
  AlertTriangle,
  RefreshCw,
  X
} from 'lucide-vue-next'

const router = useRouter()
const toast = useToast()

const isSubmitting = ref(false)
const autoCode = ref('')

// Form state
const form = reactive({
  kode: '',
  tanggal: new Date().toISOString().slice(0, 10),
  keterangan: '',
  status: 0 // 0 = Draft, 1 = Posting
})

// Spreadsheet state
const rows = ref<StockAdjustmentDetailRow[]>([])
const activeCell = ref<{ rowIndex: number; colKey: string } | null>(null)
let rowCounter = 1

// Posting Confirmation Modal state (Section 8.1)
const isPostingConfirmOpen = ref(false)

// Error Conflict Modal state (Section 14)
const isConflictModalOpen = ref(false)
const conflictItems = ref<StockConflictItem[]>([])
const conflictRequestId = ref<string>('')
const conflictErrorMessage = ref<string>('')
const isReloadingStock = ref(false)

function createEmptyRow(): StockAdjustmentDetailRow {
  return {
    id: `row-${Date.now()}-${rowCounter++}`,
    bahan_id: null,
    kode_bahan: '',
    nama_bahan: '',
    gudang_id: null,
    nama_gudang: '',
    satuan_id: null,
    nama_satuan: '',
    stok_awal: 0,
    stok_akhir: null,
    selisih: 0,
    harga_satuan: 0,
    nilai_selisih: 0,
    keterangan: ''
  }
}

async function fetchNextCode() {
  try {
    const code = await stockAdjustmentService.getNextAdjustmentCode(form.tanggal)
    autoCode.value = code
    form.kode = code
  } catch {
    const now = new Date()
    form.kode = `PS/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/1`
  }
}

onMounted(async () => {
  await fetchNextCode()
  rows.value = [createEmptyRow(), createEmptyRow()]
})

// Real-time Summary calculations
const validRows = computed(() => rows.value.filter(r => r.bahan_id && r.stok_akhir !== null))
const totalItemsCount = computed(() => validRows.value.length)
const totalPositifCount = computed(() => validRows.value.filter(r => r.selisih > 0).length)
const totalNegatifCount = computed(() => validRows.value.filter(r => r.selisih < 0).length)
const totalCocokCount = computed(() => validRows.value.filter(r => r.selisih === 0).length)
const netSelisihQtySum = computed(() => validRows.value.reduce((sum, r) => sum + r.selisih, 0))

const totalNilaiPositifSum = computed(() =>
  validRows.value.filter(r => r.nilai_selisih > 0).reduce((sum, r) => sum + r.nilai_selisih, 0)
)
const totalNilaiNegatifSum = computed(() =>
  validRows.value.filter(r => r.nilai_selisih < 0).reduce((sum, r) => sum + Math.abs(r.nilai_selisih), 0)
)
const totalNilaiSelisihSum = computed(() =>
  validRows.value.reduce((sum, r) => sum + r.nilai_selisih, 0)
)

// Spreadsheet event handlers
function handleSetActiveCell(rowIndex: number, colKey: string) {
  activeCell.value = { rowIndex, colKey }
}

function handleAddRow(count = 1) {
  for (let i = 0; i < count; i++) {
    rows.value.push(createEmptyRow())
  }
}

function handleRemoveRow(index: number) {
  if (rows.value.length <= 1) {
    rows.value = [createEmptyRow()]
    return
  }
  rows.value.splice(index, 1)
}

function handleUpdateCell(
  rowIndex: number,
  colKey: keyof StockAdjustmentDetailRow,
  value: unknown
) {
  const row = rows.value[rowIndex]
  if (!row) return

  if (colKey === 'stok_akhir') {
    row.stok_akhir = value as number | null
    if (row.stok_akhir !== null) {
      row.selisih = row.stok_akhir - row.stok_awal
      row.nilai_selisih = row.selisih * row.harga_satuan
    } else {
      row.selisih = 0
      row.nilai_selisih = 0
    }
  } else if (colKey === 'keterangan') {
    row.keterangan = String(value || '')
  }
}

function handleSelectMaterial(rowIndex: number, material: SelectableMaterial) {
  // Validasi: Cegah duplikasi bahan baku dalam satu dokumen (Section 5.2)
  const isDuplicate = rows.value.some((r, idx) => idx !== rowIndex && r.bahan_id === material.id)
  if (isDuplicate) {
    toast.error('Bahan ini sudah terdapat dalam dokumen penyesuaian.')
    return
  }

  const row = rows.value[rowIndex]
  if (!row) return

  row.bahan_id = material.id
  row.kode_bahan = material.kode
  row.nama_bahan = material.nama
  row.gudang_id = material.gudang_id
  row.nama_gudang = material.gudang_nama
  row.satuan_id = material.satuan_pakai_id
  row.nama_satuan = material.satuan_nama
  row.stok_awal = material.qty
  row.harga_satuan = material.harga_satuan

  // Default stok fisik disamakan dengan stok sistem awal
  if (row.stok_akhir === null) {
    row.stok_akhir = material.qty
    row.selisih = 0
    row.nilai_selisih = 0
  } else {
    row.selisih = row.stok_akhir - row.stok_awal
    row.nilai_selisih = row.selisih * row.harga_satuan
  }

  // Fokus otomatis ke input stok fisik (Section 5.1)
  activeCell.value = { rowIndex, colKey: 'stok_akhir' }
  nextTick(() => {
    const el = document.getElementById(`stok-akhir-input-${rowIndex}`) as HTMLInputElement | null
    if (el) {
      el.focus()
      el.select()
    }
  })
}

function handleCellKeydown(event: KeyboardEvent, rowIndex: number, colKey: string) {
  if (event.key === 'Tab') {
    event.preventDefault()
    if (colKey === 'stok_akhir') {
      activeCell.value = { rowIndex, colKey: 'keterangan' }
    } else if (colKey === 'keterangan') {
      if (rowIndex < rows.value.length - 1) {
        activeCell.value = { rowIndex: rowIndex + 1, colKey: 'stok_akhir' }
      } else {
        handleAddRow(1)
        activeCell.value = { rowIndex: rowIndex + 1, colKey: 'kode_bahan' }
      }
    }
  }
}

function handleCancel() {
  router.push('/inventory/stock-adjustments')
}

// Buka modal konfirmasi posting (Section 8.1)
function openPostingConfirm() {
  const itemsToSubmit = rows.value.filter(r => r.bahan_id !== null)
  if (itemsToSubmit.length === 0) {
    toast.error('Minimal harus menambahkan satu bahan baku untuk disesuaikan.')
    return
  }

  for (const item of itemsToSubmit) {
    if (item.stok_akhir === null || item.stok_akhir < 0) {
      toast.error('Stok fisik untuk setiap bahan wajib diisi dan tidak boleh bernilai negatif.')
      return
    }
  }

  isPostingConfirmOpen.value = true
}

// Eksekusi submit (Draft atau Posting)
async function doSubmit(targetStatus: number) {
  const itemsToSubmit = rows.value
    .filter(r => r.bahan_id !== null)
    .map(r => ({
      bahan_id: r.bahan_id as number,
      stok_awal: r.stok_awal,
      stok_akhir: r.stok_akhir ?? r.stok_awal,
      keterangan: r.keterangan || undefined
    }))

  if (itemsToSubmit.length === 0) {
    toast.error('Minimal harus menambahkan satu bahan baku untuk disesuaikan.')
    return
  }

  for (const item of itemsToSubmit) {
    if (item.stok_akhir < 0) {
      toast.error('Stok fisik tidak boleh bernilai negatif.')
      return
    }
  }

  isSubmitting.value = true
  try {
    const created = await stockAdjustmentService.createAdjustment({
      kode: form.kode.trim() || undefined,
      tanggal: form.tanggal,
      keterangan: form.keterangan.trim() || undefined,
      status: targetStatus,
      items: itemsToSubmit
    })

    isPostingConfirmOpen.value = false

    const successMsg =
      targetStatus === 1
        ? `Penyesuaian stok ${created.kode} berhasil disimpan dan saldo stok langsung diperbarui.`
        : `Penyesuaian stok ${created.kode} berhasil disimpan sebagai Draft.`

    toast.success(successMsg)
    router.push('/inventory/stock-adjustments')
  } catch (err: any) {
    // Tangani kemungkinan error STOCK_CHANGED_CONFLICT (409)
    if (err?.code === 'STOCK_CHANGED_CONFLICT' || err?.status === 409 || err?.message?.includes('Stok sistem bahan telah berubah')) {
      isPostingConfirmOpen.value = false
      conflictErrorMessage.value = err?.message || 'Stok sistem bahan telah berubah sejak dokumen dibuat.'
      conflictRequestId.value = err?.requestId || (err?.response?.data?.requestId ?? 'REQ-' + Date.now())

      // Parse detail konflik jika ada
      const rawConflicts = err?.fieldErrors?.conflicts || []
      conflictItems.value = rawConflicts
        .map((cStr: string) => {
          try {
            return JSON.parse(cStr)
          } catch {
            return null
          }
        })
        .filter(Boolean)

      isConflictModalOpen.value = true
      return
    }

    const message = err?.message || 'Gagal menyimpan penyesuaian stok.'
    toast.error(message)
  } finally {
    isSubmitting.value = false
  }
}

// Muat Ulang Stok Sistem Tanpa Menghapus Input Stok Fisik Pengguna (Section 14)
async function handleReloadStock() {
  isReloadingStock.value = true
  try {
    const freshMaterials = await stockAdjustmentService.getSelectableMaterials()
    const freshMap = new Map(freshMaterials.map(m => [m.id, m]))

    let updatedCount = 0
    for (const row of rows.value) {
      if (row.bahan_id && freshMap.has(row.bahan_id)) {
        const fresh = freshMap.get(row.bahan_id)!
        if (row.stok_awal !== fresh.qty) {
          row.stok_awal = fresh.qty
          row.harga_satuan = fresh.harga_satuan
          if (row.stok_akhir !== null) {
            row.selisih = row.stok_akhir - row.stok_awal
            row.nilai_selisih = row.selisih * row.harga_satuan
          }
          updatedCount++
        }
      }
    }

    isConflictModalOpen.value = false
    toast.success(`Stok sistem berhasil diperbarui (${updatedCount} bahan diperbarui). Silakan verifikasi ulang selisih sebelum posting.`)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat ulang data stok sistem.'
    toast.error(message)
  } finally {
    isReloadingStock.value = false
  }
}
</script>

<template>
  <div class="space-y-6 pb-28">
    <!-- Header -->
    <AppPageHeader
      title="Tambah Penyesuaian Stok Bahan"
      subtitle="Input Berita Acara Stock Opname & Penyesuaian Saldo Bahan Baku"
      :breadcrumbs="[
        { label: 'Persediaan', to: '/inventory/materials' },
        { label: 'Penyesuaian Stok Bahan', to: '/inventory/stock-adjustments' },
        { label: 'Tambah Data' }
      ]"
    >
      <template #actions>
        <AppButton
          variant="outline"
          size="sm"
          class="text-slate-600 bg-white border-slate-300 hover:bg-slate-50"
          @click="handleCancel"
        >
          <ArrowLeft class="w-4 h-4 mr-1.5" />
          Kembali ke Daftar
        </AppButton>
      </template>
    </AppPageHeader>

    <!-- Header Form Card -->
    <div class="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
      <h3
        class="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2"
      >
        <FileText class="w-4 h-4 text-teal-600" />
        Informasi Dokumen Penyesuaian
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Nomor Penyesuaian -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Nomor Penyesuaian <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="form.kode"
            type="text"
            placeholder="Otomatis dari backend"
            class="w-full px-3 py-2 text-xs font-mono font-medium border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 bg-slate-50/50"
          />
          <p class="text-[11px] text-slate-400 mt-1">
            Format: <span class="font-mono">PS/YYYY/MM/NNNN</span> (Nomor dibangkitkan backend)
          </p>
        </div>

        <!-- Tanggal Opname -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Tanggal Opname <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="form.tanggal"
            type="date"
            class="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
            @change="fetchNextCode"
          />
        </div>

        <!-- Keterangan / Keperluan Opname -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Keterangan / Keperluan Opname
          </label>
          <input
            v-model="form.keterangan"
            type="text"
            placeholder="Contoh: Stock Opname Rutin Akhir Bulan..."
            class="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
      </div>
    </div>

    <!-- Ringkasan Dokumen (Real-time Spreadsheet Summary) -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <div class="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <p class="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Item</p>
        <p class="text-lg font-bold font-mono text-slate-800">{{ totalItemsCount }}</p>
      </div>

      <div class="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <p class="text-[11px] font-medium text-emerald-600 uppercase tracking-wider">Bertambah (+)</p>
        <p class="text-lg font-bold font-mono text-emerald-700">+{{ totalPositifCount }}</p>
      </div>

      <div class="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <p class="text-[11px] font-medium text-rose-600 uppercase tracking-wider">Berkurang (-)</p>
        <p class="text-lg font-bold font-mono text-rose-700">-{{ totalNegatifCount }}</p>
      </div>

      <div class="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <p class="text-[11px] font-medium text-slate-600 uppercase tracking-wider">Cocok (=)</p>
        <p class="text-lg font-bold font-mono text-slate-700">{{ totalCocokCount }}</p>
      </div>

      <div class="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <p class="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Net Selisih Qty</p>
        <p
          :class="[
            'text-lg font-bold font-mono',
            netSelisihQtySum > 0
              ? 'text-emerald-700'
              : netSelisihQtySum < 0
                ? 'text-rose-700'
                : 'text-slate-700'
          ]"
        >
          {{ netSelisihQtySum > 0 ? `+${netSelisihQtySum}` : netSelisihQtySum }}
        </p>
      </div>

      <div class="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <p class="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Nilai Selisih</p>
        <p
          :class="[
            'text-sm font-bold font-mono truncate',
            totalNilaiSelisihSum > 0
              ? 'text-emerald-700'
              : totalNilaiSelisihSum < 0
                ? 'text-rose-700'
                : 'text-slate-700'
          ]"
          :title="formatCurrency(totalNilaiSelisihSum)"
        >
          {{ formatCurrency(totalNilaiSelisihSum) }}
        </p>
      </div>
    </div>

    <!-- Detail Spreadsheet Form -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <h3
          class="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2"
        >
          <Layers class="w-4 h-4 text-teal-600" />
          Rincian Bahan Baku & Perhitungan Selisih
        </h3>
        <p class="text-xs text-slate-500 italic">
          * Dobel klik pada kolom Kode/Nama Bahan untuk mencari bahan baku
        </p>
      </div>

      <StockAdjustmentSpreadsheet
        :rows="rows"
        :active-cell="activeCell"
        :disabled="isSubmitting"
        @set-active-cell="handleSetActiveCell"
        @add-row="handleAddRow"
        @remove-row="handleRemoveRow"
        @update-cell="handleUpdateCell"
        @cell-keydown="handleCellKeydown"
        @select-material="handleSelectMaterial"
      />
    </div>

    <!-- Sticky Footer Actions (Excel/Desktop Experience) -->
    <div
      class="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3.5 shadow-lg z-30 flex items-center justify-between"
    >
      <div class="flex items-center gap-4 text-xs text-slate-600">
        <span class="font-medium">Total Item: <strong class="font-mono text-slate-800 ml-0.5">{{ totalItemsCount }}</strong></span>
        <span class="text-slate-300">|</span>
        <span class="font-medium">Positif / Negatif: <strong class="font-mono text-emerald-700 ml-0.5">+{{ totalPositifCount }}</strong> / <strong class="font-mono text-rose-700">-{{ totalNegatifCount }}</strong></span>
        <span class="text-slate-300">|</span>
        <span class="font-medium">Net Selisih: <strong :class="netSelisihQtySum >= 0 ? 'text-emerald-700' : 'text-rose-700'" class="font-mono ml-0.5">{{ netSelisihQtySum > 0 ? `+${netSelisihQtySum}` : netSelisihQtySum }}</strong></span>
        <span class="text-slate-300">|</span>
        <span class="font-medium">
          Nilai Selisih:
          <strong
            :class="totalNilaiSelisihSum >= 0 ? 'text-emerald-700' : 'text-rose-700'"
            class="font-mono text-sm ml-1"
          >
            {{ formatCurrency(totalNilaiSelisihSum) }}
          </strong>
        </span>
      </div>

      <div class="flex items-center gap-2.5">
        <AppButton
          variant="outline"
          size="sm"
          class="text-slate-700 border-slate-300 hover:bg-slate-100"
          :disabled="isSubmitting"
          @click="handleCancel"
        >
          Batalkan
        </AppButton>

        <!-- Simpan Draft -->
        <AppButton
          variant="outline"
          size="sm"
          class="border-teal-600 text-teal-700 hover:bg-teal-50"
          :disabled="isSubmitting"
          @click="doSubmit(0)"
        >
          <Save class="w-4 h-4 mr-1.5" />
          Simpan sebagai Draft
        </AppButton>

        <!-- Simpan & Posting Stok Langsung -->
        <AppButton
          variant="primary"
          size="sm"
          class="bg-teal-600 hover:bg-teal-700 text-white font-medium"
          :disabled="isSubmitting"
          @click="openPostingConfirm"
        >
          <Send class="w-4 h-4 mr-1.5" />
          Simpan & Posting Stok
        </AppButton>
      </div>
    </div>

    <!-- Modal Konfirmasi Posting (Section 8.1) -->
    <div
      v-if="isPostingConfirmOpen"
      class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        class="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        @click.stop
      >
        <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div class="flex items-center gap-2 text-teal-800 font-semibold text-sm">
            <Send class="w-5 h-5 text-teal-600" />
            Konfirmasi Posting Penyesuaian
          </div>
          <button
            type="button"
            class="text-slate-400 hover:text-slate-600 p-1"
            @click="isPostingConfirmOpen = false"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="p-5 space-y-4">
          <div class="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-start gap-2.5">
            <AlertTriangle class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p class="font-semibold">Perhatian Posting Saldo Stok:</p>
              <p class="mt-0.5 text-slate-700">
                Posting akan memperbarui saldo stok bahan dan tidak dapat diedit langsung setelah selesai.
              </p>
            </div>
          </div>

          <div class="space-y-2 text-xs">
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-500">Nomor Dokumen:</span>
              <span class="font-mono font-bold text-slate-800">{{ form.kode || autoCode }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-500">Tanggal Opname:</span>
              <span class="font-medium text-slate-800">{{ form.tanggal }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-500">Jumlah Bahan Disesuaikan:</span>
              <span class="font-mono font-medium text-slate-800">{{ totalItemsCount }} item</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-500">Jumlah Bahan Bertambah:</span>
              <span class="font-mono font-bold text-emerald-600">+{{ totalPositifCount }} item</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-500">Jumlah Bahan Berkurang:</span>
              <span class="font-mono font-bold text-rose-600">-{{ totalNegatifCount }} item</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-500">Jumlah Bahan Tanpa Selisih:</span>
              <span class="font-mono font-medium text-slate-600">{{ totalCocokCount }} item</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-500">Nilai Selisih Positif:</span>
              <span class="font-mono text-emerald-700">+{{ formatCurrency(totalNilaiPositifSum) }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-500">Nilai Selisih Negatif:</span>
              <span class="font-mono text-rose-700">-{{ formatCurrency(totalNilaiNegatifSum) }}</span>
            </div>
          </div>
        </div>

        <div class="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <AppButton
            variant="outline"
            size="sm"
            class="text-slate-700 border-slate-300 hover:bg-slate-100 text-xs"
            :disabled="isSubmitting"
            @click="isPostingConfirmOpen = false"
          >
            Batal
          </AppButton>
          <AppButton
            variant="primary"
            size="sm"
            class="bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs"
            :disabled="isSubmitting"
            @click="doSubmit(1)"
          >
            <Send class="w-3.5 h-3.5 mr-1.5" />
            {{ isSubmitting ? 'Memproses Posting...' : 'Konfirmasi Posting' }}
          </AppButton>
        </div>
      </div>
    </div>

    <!-- Error Modal User-Friendly jika Stok Sistem Berubah / Conflict (Section 14) -->
    <div
      v-if="isConflictModalOpen"
      class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        class="bg-white rounded-xl shadow-2xl border border-rose-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        @click.stop
      >
        <div class="px-5 py-4 border-b border-rose-100 flex items-center justify-between bg-rose-50/70">
          <div class="flex items-center gap-2.5 text-rose-800 font-bold text-sm">
            <AlertTriangle class="w-5 h-5 text-rose-600" />
            Posting Penyesuaian Gagal
          </div>
          <button
            type="button"
            class="text-slate-400 hover:text-slate-600 p-1"
            @click="isConflictModalOpen = false"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="p-5 space-y-4">
          <div>
            <h4 class="text-xs font-bold text-slate-800 mb-1">Stok bahan telah berubah</h4>
            <p class="text-xs text-slate-600">
              {{ conflictErrorMessage }}
            </p>
          </div>

          <!-- Rincian bahan konflik -->
          <div v-if="conflictItems.length > 0" class="border border-slate-200 rounded-lg overflow-hidden">
            <table class="w-full text-left text-xs border-collapse">
              <thead class="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th class="p-2">Bahan Baku</th>
                  <th class="p-2 text-right">Stok Buka Form</th>
                  <th class="p-2 text-right">Stok Sistem Terbaru</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="c in conflictItems" :key="c.bahan_id" class="hover:bg-slate-50">
                  <td class="p-2 font-medium text-slate-800">
                    <span class="font-mono text-teal-700 font-bold mr-1">{{ c.kode_bahan }}</span>
                    {{ c.nama_bahan }}
                  </td>
                  <td class="p-2 text-right font-mono text-slate-500">
                    {{ c.stok_saat_buka }} {{ c.satuan }}
                  </td>
                  <td class="p-2 text-right font-mono font-bold text-rose-600 bg-rose-50/50">
                    {{ c.stok_terkini }} {{ c.satuan }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p class="text-xs text-slate-600 italic bg-amber-50 p-2.5 rounded border border-amber-200">
            "Silakan periksa ulang hasil stock opname sebelum melanjutkan. Input stok fisik Anda tidak akan terhapus saat memuat ulang stok sistem."
          </p>

          <p v-if="conflictRequestId" class="text-[11px] font-mono text-slate-400">
            Request ID Pelacakan: {{ conflictRequestId }}
          </p>
        </div>

        <div class="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <AppButton
            variant="outline"
            size="sm"
            class="text-xs text-slate-700 border-slate-300 hover:bg-slate-100"
            @click="isConflictModalOpen = false"
          >
            Tutup
          </AppButton>
          <AppButton
            variant="primary"
            size="sm"
            class="text-xs bg-teal-600 hover:bg-teal-700 text-white font-medium"
            :disabled="isReloadingStock"
            @click="handleReloadStock"
          >
            <RefreshCw :class="['w-3.5 h-3.5 mr-1.5', isReloadingStock ? 'animate-spin' : '']" />
            {{ isReloadingStock ? 'Memperbarui...' : 'Muat Ulang Stok' }}
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>
