<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import {
  Filter,
  RotateCcw,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  Calendar,
  Package,
  Warehouse,
  CheckCircle2,
  CreditCard,
  User,
  ArrowUpDown
} from 'lucide-vue-next'
import type {
  PurchaseReportFilterParams,
  PurchaseReportFilterOptions,
  PurchaseReportType
} from '../types/purchase-report.types'
import { getReportTypeLabel } from '../utils/purchase-report-export'

const props = defineProps<{
  initialFilters: PurchaseReportFilterParams
  filterOptions: PurchaseReportFilterOptions | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'apply', filters: PurchaseReportFilterParams): void
  (e: 'reset'): void
}>()

// Internal filter form state (buffered until user clicks "Tampilkan Laporan")
const form = reactive<PurchaseReportFilterParams>({
  ...props.initialFilters
})

// Sync when props change externally
watch(
  () => props.initialFilters,
  (val) => {
    Object.assign(form, val)
  },
  { deep: true }
)

const showAdvanced = ref(false)
const activeDatePreset = ref<string>('custom')

// Report Type Options
const reportTypeOptions: { value: PurchaseReportType; label: string }[] = [
  { value: 'summary', label: 'Ringkasan Pembelian' },
  { value: 'detail', label: 'Detail Pembelian' },
  { value: 'supplier', label: 'Pembelian per Supplier' },
  { value: 'material', label: 'Pembelian per Bahan Baku' },
  { value: 'status', label: 'Status Pembelian' },
  { value: 'po_vs_receipt', label: 'PO vs Penerimaan Barang' },
  { value: 'purchase_vs_payment', label: 'Pembelian vs Tagihan & Pembayaran' }
]

// Relevancy flags based on selected report type
const isMaterialFilterRelevant = computed(() => {
  return ['detail', 'material', 'po_vs_receipt', 'summary'].includes(form.report_type)
})

const isWarehouseFilterRelevant = computed(() => {
  return ['detail', 'supplier', 'material', 'po_vs_receipt', 'status'].includes(form.report_type)
})

const isReceiptStatusRelevant = computed(() => {
  return ['status', 'po_vs_receipt'].includes(form.report_type)
})

const isPaymentStatusRelevant = computed(() => {
  return ['purchase_vs_payment', 'supplier'].includes(form.report_type)
})

// Sort Options based on selected report type
const sortOptions = computed(() => {
  switch (form.report_type) {
    case 'summary':
      return [
        { value: 'tanggal', label: 'Tanggal PO' },
        { value: 'kode', label: 'Nomor PO' },
        { value: 'supplier_name', label: 'Supplier' },
        { value: 'total', label: 'Total Nominal' },
        { value: 'status', label: 'Status' }
      ]
    case 'detail':
      return [
        { value: 'tanggal', label: 'Tanggal PO' },
        { value: 'kode_po', label: 'Nomor PO' },
        { value: 'supplier_name', label: 'Supplier' },
        { value: 'nama_bahan', label: 'Nama Bahan' },
        { value: 'subtotal', label: 'Subtotal' }
      ]
    case 'supplier':
      return [
        { value: 'total_nilai_po', label: 'Total Nilai PO' },
        { value: 'nama_supplier', label: 'Nama Supplier' },
        { value: 'jumlah_po', label: 'Jumlah PO' },
        { value: 'total_nilai_diterima', label: 'Total Nilai Diterima' }
      ]
    case 'material':
      return [
        { value: 'total_nilai_pesan', label: 'Total Nilai Pesan' },
        { value: 'nama_bahan', label: 'Nama Bahan' },
        { value: 'total_qty_pesan', label: 'Total Qty Pesan' },
        { value: 'total_qty_terima', label: 'Total Qty Terima' }
      ]
    case 'status':
      return [
        { value: 'tanggal', label: 'Tanggal PO' },
        { value: 'nomor_po', label: 'Nomor PO' },
        { value: 'total_po', label: 'Total PO' },
        { value: 'sisa_qty', label: 'Sisa Qty' }
      ]
    case 'po_vs_receipt':
      return [
        { value: 'tanggal_po', label: 'Tanggal PO' },
        { value: 'nomor_po', label: 'Nomor PO' },
        { value: 'persentase', label: 'Persentase Penerimaan' },
        { value: 'sisa_qty', label: 'Sisa Qty' }
      ]
    case 'purchase_vs_payment':
      return [
        { value: 'tanggal_po', label: 'Tanggal PO' },
        { value: 'nomor_po', label: 'Nomor PO' },
        { value: 'nilai_po', label: 'Nilai PO' },
        { value: 'sisa_tagihan', label: 'Sisa Tagihan' }
      ]
    default:
      return [{ value: 'tanggal', label: 'Tanggal' }]
  }
})

// Set active sort column when report type changes if current sort is not supported
watch(
  () => form.report_type,
  () => {
    const validSortKeys = sortOptions.value.map(s => s.value)
    if (!validSortKeys.includes(form.sort_by)) {
      form.sort_by = validSortKeys[0] || 'tanggal'
    }
  }
)

// Date Presets
function applyDatePreset(preset: 'today' | 'this_month' | 'last_month' | 'this_year' | 'all') {
  activeDatePreset.value = preset
  const now = new Date()

  if (preset === 'today') {
    const ymd = now.toISOString().slice(0, 10)
    form.date_from = ymd
    form.date_to = ymd
  } else if (preset === 'this_month') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    form.date_from = firstDay.toISOString().slice(0, 10)
    form.date_to = lastDay.toISOString().slice(0, 10)
  } else if (preset === 'last_month') {
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0)
    form.date_from = firstDay.toISOString().slice(0, 10)
    form.date_to = lastDay.toISOString().slice(0, 10)
  } else if (preset === 'this_year') {
    const firstDay = new Date(now.getFullYear(), 0, 1)
    const lastDay = new Date(now.getFullYear(), 11, 31)
    form.date_from = firstDay.toISOString().slice(0, 10)
    form.date_to = lastDay.toISOString().slice(0, 10)
  } else if (preset === 'all') {
    form.date_from = ''
    form.date_to = ''
  }
}

// Active Filter Chips computation
const activeChips = computed(() => {
  const chips: { key: string; label: string; valueText: string }[] = []

  if (form.date_from || form.date_to) {
    chips.push({
      key: 'date',
      label: 'Periode',
      valueText: `${form.date_from || 'Awal'} s/d ${form.date_to || 'Sekarang'}`
    })
  }

  if (form.status && form.status !== 'ALL') {
    const stLabel = props.filterOptions?.statuses.find(s => s.value === form.status)?.label || form.status
    chips.push({
      key: 'status',
      label: 'Status PO',
      valueText: stLabel
    })
  }

  if (form.supplier_id) {
    const sup = props.filterOptions?.suppliers.find(s => s.id === form.supplier_id)
    chips.push({
      key: 'supplier_id',
      label: 'Supplier',
      valueText: sup ? sup.nama : `ID #${form.supplier_id}`
    })
  }

  if (form.material_id && isMaterialFilterRelevant.value) {
    const mat = props.filterOptions?.materials.find(m => m.id === form.material_id)
    chips.push({
      key: 'material_id',
      label: 'Bahan Baku',
      valueText: mat ? mat.nama : `ID #${form.material_id}`
    })
  }

  if (form.warehouse_id && isWarehouseFilterRelevant.value) {
    const wh = props.filterOptions?.warehouses.find(w => w.id === form.warehouse_id)
    chips.push({
      key: 'warehouse_id',
      label: 'Gudang',
      valueText: wh ? wh.nama : `ID #${form.warehouse_id}`
    })
  }

  if (form.receipt_status && form.receipt_status !== 'ALL' && isReceiptStatusRelevant.value) {
    const rs = props.filterOptions?.receipt_statuses.find(r => r.value === form.receipt_status)?.label || form.receipt_status
    chips.push({
      key: 'receipt_status',
      label: 'Penerimaan',
      valueText: rs
    })
  }

  if (form.payment_status && form.payment_status !== 'ALL' && isPaymentStatusRelevant.value) {
    const ps = props.filterOptions?.payment_statuses.find(p => p.value === form.payment_status)?.label || form.payment_status
    chips.push({
      key: 'payment_status',
      label: 'Pembayaran',
      valueText: ps
    })
  }

  if (form.search && form.search.trim()) {
    chips.push({
      key: 'search',
      label: 'Pencarian',
      valueText: `"${form.search.trim()}"`
    })
  }

  if (form.min_amount) {
    chips.push({
      key: 'min_amount',
      label: 'Min Nominal',
      valueText: `Rp ${form.min_amount.toLocaleString('id-ID')}`
    })
  }

  if (form.max_amount) {
    chips.push({
      key: 'max_amount',
      label: 'Max Nominal',
      valueText: `Rp ${form.max_amount.toLocaleString('id-ID')}`
    })
  }

  if (form.created_by) {
    const usr = props.filterOptions?.users.find(u => u.id === form.created_by)
    chips.push({
      key: 'created_by',
      label: 'Dibuat Oleh',
      valueText: usr ? usr.username : `User #${form.created_by}`
    })
  }

  return chips
})

function removeChip(key: string) {
  if (key === 'date') {
    form.date_from = ''
    form.date_to = ''
    activeDatePreset.value = 'all'
  } else if (key === 'status') {
    form.status = 'ALL'
  } else if (key === 'supplier_id') {
    form.supplier_id = undefined
  } else if (key === 'material_id') {
    form.material_id = undefined
  } else if (key === 'warehouse_id') {
    form.warehouse_id = undefined
  } else if (key === 'receipt_status') {
    form.receipt_status = 'ALL'
  } else if (key === 'payment_status') {
    form.payment_status = 'ALL'
  } else if (key === 'search') {
    form.search = ''
  } else if (key === 'min_amount') {
    form.min_amount = undefined
  } else if (key === 'max_amount') {
    form.max_amount = undefined
  } else if (key === 'created_by') {
    form.created_by = undefined
  }

  handleApply()
}

function handleApply() {
  form.page = 1
  emit('apply', { ...form })
}

function handleReset() {
  form.report_type = 'summary'
  form.date_from = ''
  form.date_to = ''
  form.supplier_id = undefined
  form.material_id = undefined
  form.warehouse_id = undefined
  form.status = 'ALL'
  form.receipt_status = 'ALL'
  form.payment_status = 'ALL'
  form.search = ''
  form.min_amount = undefined
  form.max_amount = undefined
  form.created_by = undefined
  form.sort_by = 'tanggal'
  form.sort_direction = 'DESC'
  form.page = 1
  activeDatePreset.value = 'all'
  emit('reset')
}
</script>

<template>
  <div class="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-4">
    <!-- Header Filter Section -->
    <div class="flex items-center justify-between pb-3 border-b border-slate-100">
      <div class="flex items-center gap-2">
        <Filter class="w-4 h-4 text-teal-600" />
        <h2 class="text-sm font-semibold text-slate-800 uppercase tracking-wider">
          Parameter Laporan
        </h2>
        <span class="text-xs text-slate-400">
          — {{ getReportTypeLabel(form.report_type) }}
        </span>
      </div>

      <div class="flex items-center gap-1.5">
        <button
          type="button"
          class="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
          @click="showAdvanced = !showAdvanced"
        >
          <span>{{ showAdvanced ? 'Tutup Filter Lanjutan' : 'Filter Lanjutan' }}</span>
          <component :is="showAdvanced ? ChevronUp : ChevronDown" class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Date Presets Bar -->
    <div class="flex items-center flex-wrap gap-1.5 pt-0.5">
      <span class="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
        <Calendar class="w-3.5 h-3.5" /> Periode:
      </span>
      <button
        type="button"
        class="text-xs px-2.5 py-1 rounded-md transition-all font-medium"
        :class="activeDatePreset === 'all' ? 'bg-teal-50 text-teal-700 border border-teal-200 font-semibold' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'"
        @click="applyDatePreset('all')"
      >
        Semua
      </button>
      <button
        type="button"
        class="text-xs px-2.5 py-1 rounded-md transition-all font-medium"
        :class="activeDatePreset === 'today' ? 'bg-teal-50 text-teal-700 border border-teal-200 font-semibold' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'"
        @click="applyDatePreset('today')"
      >
        Hari Ini
      </button>
      <button
        type="button"
        class="text-xs px-2.5 py-1 rounded-md transition-all font-medium"
        :class="activeDatePreset === 'this_month' ? 'bg-teal-50 text-teal-700 border border-teal-200 font-semibold' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'"
        @click="applyDatePreset('this_month')"
      >
        Bulan Ini
      </button>
      <button
        type="button"
        class="text-xs px-2.5 py-1 rounded-md transition-all font-medium"
        :class="activeDatePreset === 'last_month' ? 'bg-teal-50 text-teal-700 border border-teal-200 font-semibold' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'"
        @click="applyDatePreset('last_month')"
      >
        Bulan Lalu
      </button>
      <button
        type="button"
        class="text-xs px-2.5 py-1 rounded-md transition-all font-medium"
        :class="activeDatePreset === 'this_year' ? 'bg-teal-50 text-teal-700 border border-teal-200 font-semibold' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'"
        @click="applyDatePreset('this_year')"
      >
        Tahun Ini
      </button>
    </div>

    <!-- PRIMARY FILTERS GRID (Responsive 4 or 6 columns) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- 1. Jenis Laporan -->
      <div>
        <label class="block text-xs font-medium text-slate-700 mb-1">
          Jenis Laporan <span class="text-rose-500">*</span>
        </label>
        <select
          v-model="form.report_type"
          class="w-full text-xs rounded-lg border-slate-200 focus:border-teal-500 focus:ring-teal-500 bg-white py-2 px-2.5 text-slate-800 font-medium shadow-sm transition"
        >
          <option v-for="opt in reportTypeOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <!-- 2. Rentang Tanggal Mulai - Akhir -->
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1">
            Tanggal Mulai
          </label>
          <input
            v-model="form.date_from"
            type="date"
            class="w-full text-xs rounded-lg border-slate-200 focus:border-teal-500 focus:ring-teal-500 bg-white py-2 px-2 text-slate-800 shadow-sm transition"
            @change="activeDatePreset = 'custom'"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1">
            Tanggal Akhir
          </label>
          <input
            v-model="form.date_to"
            type="date"
            class="w-full text-xs rounded-lg border-slate-200 focus:border-teal-500 focus:ring-teal-500 bg-white py-2 px-2 text-slate-800 shadow-sm transition"
            @change="activeDatePreset = 'custom'"
          />
        </div>
      </div>

      <!-- 3. Supplier -->
      <div>
        <label class="block text-xs font-medium text-slate-700 mb-1">
          Supplier
        </label>
        <select
          v-model="form.supplier_id"
          class="w-full text-xs rounded-lg border-slate-200 focus:border-teal-500 focus:ring-teal-500 bg-white py-2 px-2.5 text-slate-800 shadow-sm transition"
        >
          <option :value="undefined">-- Semua Supplier --</option>
          <option
            v-for="sup in filterOptions?.suppliers || []"
            :key="sup.id"
            :value="sup.id"
          >
            {{ sup.kode ? `[${sup.kode}] ` : '' }}{{ sup.nama }}
          </option>
        </select>
      </div>

      <!-- 4. Status Transaksi / PO -->
      <div>
        <label class="block text-xs font-medium text-slate-700 mb-1">
          Status PO
        </label>
        <select
          v-model="form.status"
          class="w-full text-xs rounded-lg border-slate-200 focus:border-teal-500 focus:ring-teal-500 bg-white py-2 px-2.5 text-slate-800 shadow-sm transition"
        >
          <option
            v-for="st in filterOptions?.statuses || []"
            :key="st.value"
            :value="st.value"
          >
            {{ st.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- COLLAPSIBLE ADVANCED FILTERS -->
    <div
      v-if="showAdvanced"
      class="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-lg border border-dashed border-slate-200"
    >
      <!-- Bahan Baku (Relevan jika Detail/Material/PO vs PB) -->
      <div v-if="isMaterialFilterRelevant">
        <label class="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
          <Package class="w-3.5 h-3.5 text-slate-400" /> Bahan Baku
        </label>
        <select
          v-model="form.material_id"
          class="w-full text-xs rounded-lg border-slate-200 focus:border-teal-500 focus:ring-teal-500 bg-white py-2 px-2.5 text-slate-800 shadow-sm"
        >
          <option :value="undefined">-- Semua Bahan --</option>
          <option
            v-for="m in filterOptions?.materials || []"
            :key="m.id"
            :value="m.id"
          >
            {{ m.kode ? `[${m.kode}] ` : '' }}{{ m.nama }}
          </option>
        </select>
      </div>

      <!-- Gudang (Relevan jika melibatkan penerimaan / gudang) -->
      <div v-if="isWarehouseFilterRelevant">
        <label class="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
          <Warehouse class="w-3.5 h-3.5 text-slate-400" /> Gudang
        </label>
        <select
          v-model="form.warehouse_id"
          class="w-full text-xs rounded-lg border-slate-200 focus:border-teal-500 focus:ring-teal-500 bg-white py-2 px-2.5 text-slate-800 shadow-sm"
        >
          <option :value="undefined">-- Semua Gudang --</option>
          <option
            v-for="w in filterOptions?.warehouses || []"
            :key="w.id"
            :value="w.id"
          >
            {{ w.nama }}
          </option>
        </select>
      </div>

      <!-- Status Penerimaan -->
      <div v-if="isReceiptStatusRelevant">
        <label class="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
          <CheckCircle2 class="w-3.5 h-3.5 text-slate-400" /> Status Penerimaan
        </label>
        <select
          v-model="form.receipt_status"
          class="w-full text-xs rounded-lg border-slate-200 focus:border-teal-500 focus:ring-teal-500 bg-white py-2 px-2.5 text-slate-800 shadow-sm"
        >
          <option
            v-for="rs in filterOptions?.receipt_statuses || []"
            :key="rs.value"
            :value="rs.value"
          >
            {{ rs.label }}
          </option>
        </select>
      </div>

      <!-- Status Pembayaran -->
      <div v-if="isPaymentStatusRelevant">
        <label class="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
          <CreditCard class="w-3.5 h-3.5 text-slate-400" /> Status Pembayaran
        </label>
        <select
          v-model="form.payment_status"
          class="w-full text-xs rounded-lg border-slate-200 focus:border-teal-500 focus:ring-teal-500 bg-white py-2 px-2.5 text-slate-800 shadow-sm"
        >
          <option
            v-for="ps in filterOptions?.payment_statuses || []"
            :key="ps.value"
            :value="ps.value"
          >
            {{ ps.label }}
          </option>
        </select>
      </div>

      <!-- Nomor Dokumen / Keyword -->
      <div>
        <label class="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
          <Search class="w-3.5 h-3.5 text-slate-400" /> No. Dokumen / Kata Kunci
        </label>
        <input
          v-model="form.search"
          type="text"
          placeholder="Cari PO, Surat Jalan, dll..."
          class="w-full text-xs rounded-lg border-slate-200 focus:border-teal-500 focus:ring-teal-500 bg-white py-2 px-2.5 text-slate-800 shadow-sm"
          @keyup.enter="handleApply"
        />
      </div>

      <!-- Rentang Nominal (Min & Max) -->
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1">
            Min Nominal (Rp)
          </label>
          <input
            v-model.number="form.min_amount"
            type="number"
            min="0"
            placeholder="0"
            class="w-full text-xs rounded-lg border-slate-200 focus:border-teal-500 focus:ring-teal-500 bg-white py-2 px-2 text-slate-800 shadow-sm"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1">
            Max Nominal (Rp)
          </label>
          <input
            v-model.number="form.max_amount"
            type="number"
            min="0"
            placeholder="Tanpa batas"
            class="w-full text-xs rounded-lg border-slate-200 focus:border-teal-500 focus:ring-teal-500 bg-white py-2 px-2 text-slate-800 shadow-sm"
          />
        </div>
      </div>

      <!-- Dibuat Oleh -->
      <div>
        <label class="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
          <User class="w-3.5 h-3.5 text-slate-400" /> Dibuat Oleh
        </label>
        <select
          v-model="form.created_by"
          class="w-full text-xs rounded-lg border-slate-200 focus:border-teal-500 focus:ring-teal-500 bg-white py-2 px-2.5 text-slate-800 shadow-sm"
        >
          <option :value="undefined">-- Semua User --</option>
          <option
            v-for="u in filterOptions?.users || []"
            :key="u.id"
            :value="u.id"
          >
            {{ u.username }}
          </option>
        </select>
      </div>

      <!-- Urutan Kolom & Direction -->
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
            <ArrowUpDown class="w-3.5 h-3.5 text-slate-400" /> Urutkan
          </label>
          <select
            v-model="form.sort_by"
            class="w-full text-xs rounded-lg border-slate-200 focus:border-teal-500 focus:ring-teal-500 bg-white py-2 px-2 text-slate-800 shadow-sm"
          >
            <option
              v-for="s in sortOptions"
              :key="s.value"
              :value="s.value"
            >
              {{ s.label }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1">
            Arah
          </label>
          <select
            v-model="form.sort_direction"
            class="w-full text-xs rounded-lg border-slate-200 focus:border-teal-500 focus:ring-teal-500 bg-white py-2 px-2 text-slate-800 shadow-sm"
          >
            <option value="DESC">Menurun (Z-A / Baru)</option>
            <option value="ASC">Menaik (A-Z / Lama)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- ACTION BUTTONS ROW -->
    <div class="flex items-center justify-between pt-2">
      <div class="text-xs text-slate-400 italic">
        * Klik "Tampilkan Laporan" untuk memproses data sesuai parameter aktif.
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors shadow-sm"
          @click="handleReset"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          Reset
        </button>

        <button
          type="button"
          :disabled="loading"
          class="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 rounded-lg transition-colors shadow-sm"
          @click="handleApply"
        >
          <Search class="w-3.5 h-3.5" />
          {{ loading ? 'Memuat...' : 'Tampilkan Laporan' }}
        </button>
      </div>
    </div>

    <!-- ACTIVE FILTER CHIPS -->
    <div v-if="activeChips.length > 0" class="pt-2 border-t border-slate-100 flex items-center flex-wrap gap-1.5">
      <span class="text-xs text-slate-400 font-medium mr-1">Filter Aktif:</span>
      <span
        v-for="chip in activeChips"
        :key="chip.key"
        class="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700 border border-slate-200/80 font-medium"
      >
        <span class="text-slate-400">{{ chip.label }}:</span>
        <span class="text-teal-700 font-semibold">{{ chip.valueText }}</span>
        <button
          type="button"
          class="ml-0.5 text-slate-400 hover:text-rose-500 rounded-full hover:bg-slate-200 p-0.5 transition-colors"
          @click="removeChip(chip.key)"
        >
          <X class="w-3 h-3" />
        </button>
      </span>
      <button
        type="button"
        class="text-xs text-rose-600 hover:text-rose-700 underline font-medium ml-1"
        @click="handleReset"
      >
        Hapus Semua
      </button>
    </div>
  </div>
</template>
