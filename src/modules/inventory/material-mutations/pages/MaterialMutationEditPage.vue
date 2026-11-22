<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import MaterialMutationSpreadsheet from '../components/MaterialMutationSpreadsheet.vue'
import MaterialMutationStatusBadge from '../components/MaterialMutationStatusBadge.vue'
import { materialMutationService } from '../services/material-mutation.service'
import type { MaterialMutationDetailRow, SelectableMaterial } from '../types/material-mutation.types'
import { useToast } from '@/shared/composables/useToast'
import { formatCurrency, formatNumber } from '@/shared/utils/formatters'
import { ArrowLeft, Save, Send, AlertTriangle, Layers, FileText, Info } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const mutationId = Number(route.params.id)
const isLoading = ref(true)
const isSubmitting = ref(false)
const originalStatus = ref(0)

// Form state
const form = reactive({
  kode: '',
  tanggal: '',
  keterangan: '',
  status: 0
})

// Spreadsheet state
const rows = ref<MaterialMutationDetailRow[]>([])
const activeCell = ref<{ rowIndex: number; colKey: string } | null>(null)
let rowCounter = 1

function createEmptyRow(): MaterialMutationDetailRow {
  return {
    id: `row-${Date.now()}-${rowCounter++}`,
    bahan_id: null,
    kode_bahan: '',
    nama_bahan: '',
    gudang_id: null,
    nama_gudang: '',
    satuan_id: null,
    nama_satuan: '',
    stok_tersedia: 0,
    qty: null,
    harga_satuan: 0,
    subtotal: 0,
    keterangan: ''
  }
}

onMounted(async () => {
  isLoading.value = true
  try {
    const data = await materialMutationService.getMutationById(mutationId)
    if (!data) {
      toast.error('Mutasi bahan tidak ditemukan.')
      router.push('/inventory/material-mutations')
      return
    }

    if (data.status === 1) {
      toast.warning('Dokumen mutasi yang sudah berstatus Selesai (Posted) tidak dapat diedit.')
      router.replace(`/inventory/material-mutations/${mutationId}`)
      return
    }

    form.kode = data.kode
    form.tanggal = data.tanggal
    form.keterangan = data.keterangan || ''
    form.status = data.status
    originalStatus.value = data.status

    // Load available materials to get up-to-date available stock
    const availableMaterials = await materialMutationService.getSelectableMaterials()

    rows.value = data.items.map(i => {
      const liveMat = availableMaterials.find(m => m.id === i.bahan_id)
      return {
        id: `row-item-${i.id}`,
        bahan_id: i.bahan_id,
        kode_bahan: i.kode_bahan,
        nama_bahan: i.nama_bahan,
        gudang_id: i.gudang_id,
        nama_gudang: i.nama_gudang,
        satuan_id: i.satuan_id,
        nama_satuan: i.nama_satuan,
        stok_tersedia: liveMat?.qty ?? 0,
        qty: i.qty,
        harga_satuan: i.harga_satuan,
        subtotal: i.subtotal,
        keterangan: i.keterangan_detail
      }
    })

    if (rows.value.length === 0) {
      rows.value = [createEmptyRow()]
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat data mutasi bahan.'
    toast.error(message)
    router.push('/inventory/material-mutations')
  } finally {
    isLoading.value = false
  }
})

// Summary calculations
const totalItemsCount = computed(
  () => rows.value.filter(r => r.bahan_id && (r.qty || 0) > 0).length
)
const totalQtySum = computed(() =>
  rows.value.reduce((sum, r) => sum + (r.bahan_id ? r.qty || 0 : 0), 0)
)
const totalNilaiSum = computed(() =>
  rows.value.reduce((sum, r) => sum + (r.bahan_id ? (r.qty || 0) * (r.harga_satuan || 0) : 0), 0)
)

const hasStockExceeded = computed(() =>
  rows.value.some(r => r.bahan_id && r.qty && r.qty > r.stok_tersedia)
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
  if (rows.value.length <= 1) return
  rows.value.splice(index, 1)
}

function handleUpdateCell(
  rowIndex: number,
  colKey: keyof MaterialMutationDetailRow,
  value: unknown
) {
  const row = rows.value[rowIndex]
  if (!row) return

  if (colKey === 'qty') {
    row.qty = value as number | null
    row.subtotal = (row.qty || 0) * (row.harga_satuan || 0)
  } else if (colKey === 'keterangan') {
    row.keterangan = String(value || '')
  }
}

function handleSelectMaterial(
  rowIndex: number,
  material: SelectableMaterial
) {
  const row = rows.value[rowIndex]
  if (!row) return

  row.bahan_id = material.id
  row.kode_bahan = material.kode
  row.nama_bahan = material.nama
  row.gudang_id = material.gudang_id
  row.nama_gudang = material.gudang_nama
  row.satuan_id = material.satuan_pakai_id ?? material.satuan_id ?? null
  row.nama_satuan = material.satuan_nama
  row.stok_tersedia = material.qty
  row.harga_satuan = material.harga_satuan
  row.subtotal = (row.qty || 0) * material.harga_satuan

  activeCell.value = { rowIndex, colKey: 'qty' }
}

function handleCellKeydown(event: KeyboardEvent, rowIndex: number, colKey: string) {
  if (event.key === 'Tab') {
    if (colKey === 'qty' && !event.shiftKey) {
      event.preventDefault()
      activeCell.value = { rowIndex, colKey: 'keterangan' }
    } else if (colKey === 'keterangan' && !event.shiftKey) {
      if (rowIndex < rows.value.length - 1) {
        event.preventDefault()
        activeCell.value = { rowIndex: rowIndex + 1, colKey: 'kode_bahan' }
      }
    }
  }
}

function handleCancel() {
  router.push(`/inventory/material-mutations/${mutationId}`)
}

async function handleSubmit(targetStatus: number) {
  const validRows = rows.value.filter(r => r.bahan_id && (r.qty || 0) > 0)
  if (validRows.length === 0) {
    toast.error('Harap pilih minimal satu bahan baku dengan jumlah mutasi (qty) > 0.')
    return
  }

  const selectedBahanIds = validRows.map(r => r.bahan_id)
  const uniqueIds = new Set(selectedBahanIds)
  if (uniqueIds.size !== selectedBahanIds.length) {
    toast.error('Terdapat bahan baku duplikat pada baris input. Gabungkan kuantitas dalam satu baris.')
    return
  }

  if (targetStatus === 1 && hasStockExceeded.value) {
    toast.error('Kuantitas mutasi melebihi stok yang tersedia di gudang. Harap sesuaikan kuantitas.')
    return
  }

  isSubmitting.value = true
  try {
    await materialMutationService.updateMutation(mutationId, {
      kode: form.kode,
      tanggal: form.tanggal,
      keterangan: form.keterangan,
      status: targetStatus,
      items: validRows.map(r => ({
        bahan_id: r.bahan_id as number,
        qty: r.qty as number,
        satuan_beli_id: r.satuan_id,
        keterangan: r.keterangan
      }))
    })

    toast.success('Perubahan mutasi bahan berhasil disimpan.')
    router.push(`/inventory/material-mutations/${mutationId}`)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal mengupdate mutasi bahan.'
    toast.error(message)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6 pb-24">
    <!-- Header -->
    <AppPageHeader
      title="Edit Mutasi Bahan"
      :description="`Perbarui dokumen mutasi ${form.kode}`"
      :breadcrumbs="[
        { label: 'Persediaan', href: '/inventory/materials' },
        { label: 'Mutasi Bahan', href: '/inventory/material-mutations' },
        { label: form.kode || 'Edit Mutasi', current: true }
      ]"
    >
      <template #actions>
        <AppButton
          variant="outline"
          size="sm"
          class="text-slate-700 bg-white border-slate-300 hover:bg-slate-50"
          @click="handleCancel"
        >
          <ArrowLeft class="w-4 h-4 mr-1.5" />
          Batal & Kembali
        </AppButton>
      </template>
    </AppPageHeader>

    <!-- Posted Notice Banner -->
    <div
      v-if="originalStatus === 1"
      class="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3"
    >
      <Info class="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
      <div class="text-xs text-blue-900 space-y-1">
        <div class="font-bold">Dokumen Berstatus Selesai (Posted)</div>
        <p>
          Dokumen ini sebelumnya telah memotong stok gudang. Jika Anda mengubah baris item bahan
          atau kuantitas, sistem akan membalikkan catatan stok lama dan menyesuaikan dengan data
          terbaru secara otomatis.
        </p>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div
      v-if="isLoading"
      class="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center text-xs text-slate-400"
    >
      Memuat dokumen mutasi bahan...
    </div>

    <template v-else>
      <!-- Header Form Card -->
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div
            class="flex items-center gap-2 font-semibold text-xs text-slate-700 uppercase tracking-wider"
          >
            <FileText class="w-4 h-4 text-teal-600" />
            <span>Informasi Dokumen Mutasi</span>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-500">Status Saat Ini:</span>
            <MaterialMutationStatusBadge :status="form.status" size="sm" />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Kode Mutasi -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Nomor Mutasi <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="form.kode"
              type="text"
              class="w-full px-3 py-2 text-xs font-mono font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 text-slate-800"
            />
          </div>

          <!-- Tanggal Mutasi -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Tanggal Mutasi <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="form.tanggal"
              type="date"
              class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
            />
          </div>

          <!-- Keterangan Umum -->
          <div class="md:col-span-2">
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Keterangan / Keperluan Umum
            </label>
            <input
              v-model="form.keterangan"
              type="text"
              placeholder="Contoh: Pengeluaran bahan untuk Meja Direktur..."
              class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
            />
          </div>
        </div>
      </div>

      <!-- Spreadsheet Section -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <div
            class="flex items-center gap-2 font-semibold text-xs text-slate-700 uppercase tracking-wider"
          >
            <Layers class="w-4 h-4 text-teal-600" />
            <span>Daftar Bahan Yang Dimutasi</span>
          </div>

          <div
            v-if="hasStockExceeded"
            class="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200"
          >
            <AlertTriangle class="w-4 h-4" />
            <span>Sebagian bahan memiliki Qty lebih tinggi daripada stok fisik saat ini.</span>
          </div>
        </div>

        <MaterialMutationSpreadsheet
          :rows="rows"
          :active-cell="activeCell"
          :disabled="isSubmitting"
          @set-active-cell="handleSetActiveCell"
          @add-row="handleAddRow"
          @remove-row="handleRemoveRow"
          @update-cell="handleUpdateCell"
          @select-material="handleSelectMaterial"
          @cell-keydown="handleCellKeydown"
        />
      </div>
    </template>

    <!-- Sticky Bottom Action Bar with Total Indicator next to "Batalkan" -->
    <div
      class="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-3.5 shadow-lg flex flex-wrap items-center justify-between gap-4"
    >
      <!-- Left side: Batal button + Total Summary Indicator right next to it -->
      <div class="flex items-center gap-4 flex-wrap">
        <AppButton
          variant="outline"
          size="sm"
          class="text-slate-600 bg-white border-slate-300 hover:bg-slate-100"
          :disabled="isSubmitting"
          @click="handleCancel"
        >
          Batalkan
        </AppButton>

        <!-- Total indicator container (Requested: Di samping batal tunjukkan totalnya) -->
        <div
          class="flex items-center gap-3 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200 text-xs"
        >
          <div class="flex items-center gap-1.5 text-slate-600">
            <span class="font-medium text-slate-500">Total Item:</span>
            <span class="font-bold text-slate-800 font-mono">{{ totalItemsCount }} baris</span>
          </div>

          <span class="text-slate-300">|</span>

          <div class="flex items-center gap-1.5 text-slate-600">
            <span class="font-medium text-slate-500">Total Qty:</span>
            <span class="font-bold text-teal-700 font-mono"
              >{{ formatNumber(totalQtySum) }} unit</span
            >
          </div>

          <span class="text-slate-300">|</span>

          <div class="flex items-center gap-1.5 text-slate-600">
            <span class="font-medium text-slate-500">Estimasi Nilai:</span>
            <span class="font-bold text-slate-900 font-mono">{{
              formatCurrency(totalNilaiSum)
            }}</span>
          </div>
        </div>
      </div>

      <!-- Right side: Save buttons -->
      <div class="flex items-center gap-2.5">
        <AppButton
          variant="outline"
          size="sm"
          class="text-slate-700 border-slate-300 hover:bg-slate-100"
          :disabled="isSubmitting"
          @click="handleSubmit(0)"
        >
          <Save class="w-4 h-4 mr-1.5 text-amber-600" />
          Simpan sebagai Draft
        </AppButton>

        <AppButton
          variant="primary"
          size="sm"
          class="bg-teal-600 hover:bg-teal-700 text-white font-medium"
          :loading="isSubmitting"
          @click="handleSubmit(1)"
        >
          <Send class="w-4 h-4 mr-1.5" />
          Simpan & Posting Stok
        </AppButton>
      </div>
    </div>
  </div>
</template>
