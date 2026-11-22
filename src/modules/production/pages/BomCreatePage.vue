<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import BomSpreadsheet from '../components/BomSpreadsheet.vue'
import { bomService } from '../services/bom.service'
import type { BomMaterialRow } from '../types/bom.types'
import { useToast } from '@/shared/composables/useToast'
import { formatCurrency } from '@/shared/utils/formatters'
import { ArrowLeft, Save, FileText, Layers, Package, DollarSign } from 'lucide-vue-next'

interface SelectableMaterial {
  id: number
  kode: string
  nama: string
  satuan_id: number
  satuan_nama: string
  qty: number
  harga_satuan: number
  gudang_nama: string
}

interface SelectableProduct {
  id: number
  kode: string
  nama: string
  satuan_id: number
  satuan_nama: string
  harga: number
  kategori_nama: string
}

const router = useRouter()
const toast = useToast()

const isSubmitting = ref(false)
const autoCode = ref('')
const isDirty = ref(false)
const isLeaveConfirmOpen = ref(false)
const pendingNavigation = ref<string | null>(null)

// Form state
const form = reactive({
  kode: '',
  nama: '',
  produk_id: '' as string | number,
  status_aktif: 1
})

const productList = ref<SelectableProduct[]>([])
const productOptions = ref<Array<{ value: string | number; label: string }>>([])

// Spreadsheet state
const rows = ref<BomMaterialRow[]>([])
const activeCell = ref<{ rowIndex: number; colKey: string } | null>(null)
let rowCounter = 1

function createEmptyRow(): BomMaterialRow {
  return {
    id: `row-${Date.now()}-${rowCounter++}`,
    bahan_id: null,
    kode_bahan: '',
    nama_bahan: '',
    satuan_id: null,
    nama_satuan: '',
    stok_tersedia: 0,
    qty: null,
    harga_satuan: 0,
    subtotal_biaya: 0,
    keterangan: ''
  }
}

onMounted(async () => {
  try {
    autoCode.value = await bomService.generateTemplateCode()
    form.kode = autoCode.value

    productList.value = await bomService.getSelectableProducts()
    productOptions.value = productList.value.map(p => ({
      value: p.id,
      label: `[${p.kode}] ${p.nama}`
    }))
  } catch {
    form.kode = 'TPL-202611-001'
  }

  // Initialize with 10 empty rows for Excel-like feel
  rows.value = Array.from({ length: 10 }, () => createEmptyRow())
})

// Selected Product Details Context
const selectedProduct = computed(() => {
  if (!form.produk_id) return null
  return productList.value.find(p => p.id === Number(form.produk_id)) || null
})

// Auto-fill template name based on selected product if template name is empty
function onProductChange() {
  isDirty.value = true
  if (selectedProduct.value && (!form.nama || form.nama.trim() === '')) {
    form.nama = `Standar Komposisi ${selectedProduct.value.nama}`
  }
}

// Summary calculations
const validRows = computed(() => rows.value.filter(r => r.bahan_id && (r.qty || 0) > 0))
const totalItemsCount = computed(() => validRows.value.length)
const totalBiayaSum = computed(() => validRows.value.reduce((sum, r) => sum + r.subtotal_biaya, 0))

// Spreadsheet event handlers
function handleSetActiveCell(rowIndex: number, colKey: string) {
  activeCell.value = { rowIndex, colKey }
}

function handleAddRow(count = 1) {
  isDirty.value = true
  for (let i = 0; i < count; i++) {
    rows.value.push(createEmptyRow())
  }
}

function handleRemoveRow(index: number) {
  if (rows.value.length <= 1) return
  isDirty.value = true
  rows.value.splice(index, 1)
}

function handleUpdateCell(rowIndex: number, colKey: keyof BomMaterialRow, value: unknown) {
  const row = rows.value[rowIndex]
  if (!row) return
  isDirty.value = true

  if (colKey === 'qty') {
    row.qty = value as number | null
    row.subtotal_biaya = (row.qty || 0) * (row.harga_satuan || 0)
  } else if (colKey === 'keterangan') {
    row.keterangan = String(value || '')
  }
}

function handleSelectMaterial(rowIndex: number, material: SelectableMaterial) {
  const row = rows.value[rowIndex]
  if (!row) return
  isDirty.value = true

  row.bahan_id = material.id
  row.kode_bahan = material.kode
  row.nama_bahan = material.nama
  row.satuan_id = material.satuan_id
  row.nama_satuan = material.satuan_nama
  row.stok_tersedia = material.qty
  row.harga_satuan = material.harga_satuan
  row.subtotal_biaya = (row.qty || 0) * material.harga_satuan

  // Auto focus next column: qty
  activeCell.value = { rowIndex, colKey: 'qty' }
}

function handleCellKeydown(event: KeyboardEvent, rowIndex: number, colKey: string) {
  if (event.key === 'Tab') {
    event.preventDefault()
    if (colKey === 'qty') {
      activeCell.value = { rowIndex, colKey: 'keterangan' }
    } else if (colKey === 'keterangan') {
      if (rowIndex < rows.value.length - 1) {
        activeCell.value = { rowIndex: rowIndex + 1, colKey: 'qty' }
      } else {
        handleAddRow(1)
        activeCell.value = { rowIndex: rowIndex + 1, colKey: 'kode_bahan' }
      }
    }
  }
}

function handleCancel() {
  if (isDirty.value) {
    pendingNavigation.value = '/production/bom'
    isLeaveConfirmOpen.value = true
  } else {
    router.push('/production/bom')
  }
}

function handleConfirmLeave() {
  isDirty.value = false
  isLeaveConfirmOpen.value = false
  if (pendingNavigation.value) {
    router.push(pendingNavigation.value)
  }
}

onBeforeRouteLeave((to, _from, next) => {
  if (isDirty.value) {
    pendingNavigation.value = to.fullPath
    isLeaveConfirmOpen.value = true
    next(false)
  } else {
    next()
  }
})

async function handleSubmit() {
  if (!form.produk_id) {
    toast.error('Pilih produk furniture terlebih dahulu.')
    return
  }

  if (!form.nama || form.nama.trim() === '') {
    toast.error('Nama template produk tidak boleh kosong.')
    return
  }

  const itemsToSubmit = rows.value
    .filter(r => r.bahan_id !== null && (r.qty || 0) > 0)
    .map(r => ({
      bahan_id: r.bahan_id as number,
      satuan_id: r.satuan_id as number,
      qty: r.qty as number,
      keterangan: r.keterangan || undefined
    }))

  if (itemsToSubmit.length === 0) {
    toast.error('Minimal harus menambahkan satu bahan baku dengan kuantitas > 0.')
    return
  }

  // Check duplicate material
  const bahanIds = new Set<number>()
  for (const item of itemsToSubmit) {
    if (bahanIds.has(item.bahan_id)) {
      toast.error('Terdapat bahan baku yang sama berulang kali. Silakan gabungkan.')
      return
    }
    bahanIds.add(item.bahan_id)
  }

  isSubmitting.value = true
  try {
    const created = await bomService.createTemplate({
      kode: form.kode.trim() || undefined,
      nama: form.nama.trim(),
      produk_id: Number(form.produk_id),
      status_aktif: Number(form.status_aktif),
      items: itemsToSubmit
    })

    toast.success(`Template produk '${created.nama}' berhasil disimpan.`)
    isDirty.value = false
    router.push(`/production/bom/${created.id}`)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menyimpan template produk.'
    toast.error(message)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6 pb-28">
    <!-- Header -->
    <AppPageHeader
      title="Tambah Template Produk (BoM)"
      subtitle="Susun Komposisi Bahan Baku & Resep Perakitan Furniture"
      :breadcrumbs="[
        { label: 'Produksi', to: '/production/bom' },
        { label: 'Template Produk (BoM)', to: '/production/bom' },
        { label: 'Tambah Template' }
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

    <!-- Two-Column Information Card -->
    <div class="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
      <h3
        class="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2"
      >
        <FileText class="w-4 h-4 text-teal-600" />
        Informasi Header Template
      </h3>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Left Column -->
        <div class="space-y-4">
          <!-- Kode Template -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Nomor / Kode Template <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="form.kode"
              type="text"
              placeholder="Otomatis (contoh: TPL-202611-001)"
              class="w-full px-3 py-2 text-xs font-mono font-medium border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 bg-slate-50/50"
              @input="isDirty = true"
            />
            <p class="text-[11px] text-slate-400 mt-1 font-mono">
              Format default legacy: Template-{rand} / TPL-{YYYYMM}-{SEQ}
            </p>
          </div>

          <!-- Pilih Produk -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Pilih Produk Furniture <span class="text-rose-500">*</span>
            </label>
            <AppSelect
              v-model="form.produk_id"
              :options="productOptions"
              placeholder="Pilih Produk Furniture..."
              class="text-xs"
              @change="onProductChange"
            />
          </div>

          <!-- Nama Template -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Nama Template / Resep <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="form.nama"
              type="text"
              placeholder="Contoh: Standar Perakitan Kursi Kantor Mesh V2"
              class="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
              @input="isDirty = true"
            />
          </div>
        </div>

        <!-- Right Column (Product Context & Status) -->
        <div class="space-y-4">
          <!-- Status Aktif -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Status Template</label>
            <select
              v-model="form.status_aktif"
              class="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
              @change="isDirty = true"
            >
              <option :value="1">Aktif (Dapat digunakan untuk proses produksi)</option>
              <option :value="0">Nonaktif (Diarsipkan)</option>
            </select>
          </div>

          <!-- Product Card Context -->
          <div
            v-if="selectedProduct"
            class="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-2"
          >
            <div class="flex items-center gap-2 text-teal-800 font-semibold">
              <Package class="w-4 h-4 text-teal-600" />
              <span>Detail Produk Terpilih:</span>
            </div>
            <div class="grid grid-cols-2 gap-2 text-slate-600 text-[11px]">
              <div>
                <span class="text-slate-400 block">Kode Produk:</span>
                <span class="font-mono font-bold text-slate-800">{{ selectedProduct.kode }}</span>
              </div>
              <div>
                <span class="text-slate-400 block">Satuan Produk:</span>
                <span class="font-semibold text-slate-800">{{ selectedProduct.satuan_nama }}</span>
              </div>
              <div>
                <span class="text-slate-400 block">Kategori:</span>
                <span class="text-slate-800">{{ selectedProduct.kategori_nama }}</span>
              </div>
              <div>
                <span class="text-slate-400 block">Estimasi Harga Jual:</span>
                <span class="font-mono font-semibold text-slate-800">{{
                  formatCurrency(selectedProduct.harga)
                }}</span>
              </div>
            </div>
          </div>
          <div
            v-else
            class="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-4 text-xs text-slate-400 text-center"
          >
            Pilih produk furniture untuk melihat informasi satuan dan spesifikasinya.
          </div>
        </div>
      </div>
    </div>

    <!-- Spreadsheet Section -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <h3
          class="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2"
        >
          <Layers class="w-4 h-4 text-teal-600" />
          Komposisi Bahan Baku (Spreadsheet Editor)
        </h3>
        <span class="text-xs text-slate-500">
          Kuantitas di bawah adalah kebutuhan per <strong>1 unit</strong> produk jadi
        </span>
      </div>

      <BomSpreadsheet
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

        <!-- Live Total Indicator container -->
        <div
          class="flex items-center gap-3 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200 text-xs"
        >
          <div class="flex items-center gap-1.5 text-slate-600">
            <span class="font-medium text-slate-500">Komposisi:</span>
            <span class="font-bold text-slate-800 font-mono"
              >{{ totalItemsCount }} jenis bahan</span
            >
          </div>

          <span class="text-slate-300">|</span>

          <div class="flex items-center gap-1.5 text-slate-600">
            <DollarSign class="w-3.5 h-3.5 text-teal-600" />
            <span class="font-medium text-slate-500">Est. Biaya Bahan per Unit:</span>
            <span class="font-bold text-teal-800 font-mono">{{
              formatCurrency(totalBiayaSum)
            }}</span>
          </div>
        </div>
      </div>

      <!-- Right side: Save button -->
      <div class="flex items-center gap-2.5">
        <AppButton
          variant="primary"
          size="sm"
          class="bg-teal-600 hover:bg-teal-700 text-white font-medium"
          :loading="isSubmitting"
          @click="handleSubmit"
        >
          <Save class="w-4 h-4 mr-1.5" />
          Simpan Template BoM
        </AppButton>
      </div>
    </div>

    <!-- Unsaved Changes Confirm Dialog -->
    <AppConfirmDialog
      v-model="isLeaveConfirmOpen"
      title="Perubahan Belum Disimpan"
      message="Anda memiliki perubahan pada template produk yang belum disimpan. Apakah Anda yakin ingin meninggalkan halaman ini?"
      confirm-text="Tinggalkan Halaman"
      cancel-text="Tetap di Sini"
      variant="warning"
      @confirm="handleConfirmLeave"
    />
  </div>
</template>
