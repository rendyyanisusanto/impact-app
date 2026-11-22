<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  FileSpreadsheet,
  FileText,
  Printer,
  SlidersHorizontal,
  Home,
  ChevronRight,
  ArrowLeft,
  Package,
  Calendar,
  User,
  Layers,
  Clock
} from 'lucide-vue-next'
import { salesProductReportService } from '../services/sales-product-report.service'
import type {
  ProductReportMode,
  ProductReportFilterParams,
  SalesProductReportFilterOptions,
  ProductReportPagination,
  ProductReportSummaryTotals,
  ProductReportProductMeta,
  ProductReportCustomerMeta,
  ProductReportSummaryRow,
  ProductReportDetailRow,
  ReportColumnConfig
} from '../types/sales-product-report.types'
import {
  exportProductReportToExcel,
  exportProductReportToPdf,
  formatDateIndo,
  formatNumberIndo
} from '../utils/sales-product-report-export'
import SalesProductReportFilter from '../components/SalesProductReportFilter.vue'
import SalesProductReportTable from '../components/SalesProductReportTable.vue'
import SalesProductReportColumnModal from '../components/SalesProductReportColumnModal.vue'
import SalesProductReportPrintModal from '../components/SalesProductReportPrintModal.vue'
import { useToast } from '@/shared/composables/useToast'

const route = useRoute()
const toast = useToast()

// Default column configurations per mode
const defaultColumnsMap: Record<ProductReportMode, ReportColumnConfig[]> = {
  summary: [
    { key: 'no', label: 'No', width: 'w-10', align: 'center', visible: true, sortable: false },
    { key: 'customer_code', label: 'Kode Customer', width: 'w-28', visible: true },
    { key: 'customer_name', label: 'Nama Customer', visible: true },
    { key: 'so_count', label: 'Jumlah SO', width: 'w-24', align: 'right', visible: true },
    { key: 'total_qty', label: 'Total Qty', width: 'w-24', align: 'right', visible: true },
    { key: 'qty_percentage', label: 'Kontribusi Qty', width: 'w-32', align: 'right', visible: true },
    { key: 'total_amount', label: 'Total Nilai (Rp)', width: 'w-36', align: 'right', visible: true },
    { key: 'last_purchase_date', label: 'Beli Terakhir', width: 'w-28', align: 'center', visible: true },
    { key: 'aksi', label: 'Aksi', width: 'w-20', align: 'center', visible: true, sortable: false }
  ],
  chronological: [
    { key: 'no', label: 'No', width: 'w-10', align: 'center', visible: true, sortable: false },
    { key: 'tanggal', label: 'Tanggal SO', width: 'w-24', visible: true },
    { key: 'nomor_so', label: 'Nomor SO', width: 'w-32', visible: true },
    { key: 'kode_produk', label: 'Kode Produk', width: 'w-24', visible: false },
    { key: 'nama_produk', label: 'Nama Produk', width: 'w-44', visible: false },
    { key: 'customer_name', label: 'Customer', visible: true },
    { key: 'item_keterangan', label: 'Keterangan Item', visible: true },
    { key: 'qty', label: 'Qty', width: 'w-20', align: 'right', visible: true },
    { key: 'harga', label: 'Harga Satuan (Rp)', width: 'w-28', align: 'right', visible: true },
    { key: 'diskon', label: 'Disc (%)', width: 'w-16', align: 'right', visible: true },
    { key: 'subtotal', label: 'Subtotal (Rp)', width: 'w-32', align: 'right', visible: true },
    { key: 'status_so', label: 'Status SO', width: 'w-24', align: 'center', visible: true },
    { key: 'aksi', label: 'Aksi', width: 'w-24', align: 'center', visible: true, sortable: false }
  ],
  customer_detail: [
    { key: 'no', label: 'No', width: 'w-10', align: 'center', visible: true, sortable: false },
    { key: 'tanggal', label: 'Tanggal SO', width: 'w-24', visible: true },
    { key: 'nomor_so', label: 'Nomor SO', width: 'w-32', visible: true },
    { key: 'customer_name', label: 'Customer', visible: true },
    { key: 'item_keterangan', label: 'Keterangan Item', visible: true },
    { key: 'qty', label: 'Qty', width: 'w-20', align: 'right', visible: true },
    { key: 'harga', label: 'Harga Satuan (Rp)', width: 'w-28', align: 'right', visible: true },
    { key: 'diskon', label: 'Disc (%)', width: 'w-16', align: 'right', visible: true },
    { key: 'subtotal', label: 'Subtotal (Rp)', width: 'w-32', align: 'right', visible: true },
    { key: 'status_so', label: 'Status SO', width: 'w-24', align: 'center', visible: true },
    { key: 'aksi', label: 'Aksi', width: 'w-20', align: 'center', visible: true, sortable: false }
  ]
}

// Active Mode State
const activeMode = ref<ProductReportMode>('summary')

// Column configurations
const columnsConfig = reactive<Record<ProductReportMode, ReportColumnConfig[]>>({
  summary: JSON.parse(JSON.stringify(defaultColumnsMap.summary)),
  chronological: JSON.parse(JSON.stringify(defaultColumnsMap.chronological)),
  customer_detail: JSON.parse(JSON.stringify(defaultColumnsMap.customer_detail))
})

const currentColumns = computed(() => columnsConfig[activeMode.value])

// Initial Filter Dates: 1 year default or current month
const now = new Date()
const defaultDateFrom = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10)
const defaultDateTo = now.toISOString().slice(0, 10)

// Main Filters State
const filters = reactive<ProductReportFilterParams>({
  product_id: 0,
  date_from: defaultDateFrom,
  date_to: defaultDateTo,
  customer_id: undefined,
  so_status: '1',
  sort_by: 'total_qty',
  sort_direction: 'DESC',
  page: 1,
  per_page: 25,
  search: '',
  mode: 'summary'
})

// Backup state to preserve Mode 1 pagination/filter when drilling down
const summaryBackupState = reactive({
  page: 1,
  per_page: 25,
  sort_by: 'total_qty',
  sort_direction: 'DESC' as 'ASC' | 'DESC',
  customer_id: undefined as number | undefined
})

// Data state
const filterOptions = ref<SalesProductReportFilterOptions | null>(null)
const items = ref<(ProductReportSummaryRow | ProductReportDetailRow)[]>([])
const productMeta = ref<ProductReportProductMeta | null>(null)
const customerMeta = ref<ProductReportCustomerMeta | null>(null)
const summaryTotals = ref<ProductReportSummaryTotals>({
  total_rows: 0,
  total_so: 0,
  total_customers: 0,
  total_qty: 0,
  total_amount: 0
})
const pagination = ref<ProductReportPagination>({
  page: 1,
  per_page: 25,
  total_items: 0,
  total_pages: 1
})

const loading = ref(false)
const error = ref<string | null>(null)
const isExporting = ref(false)

// Modals
const showColumnModal = ref(false)
const showPrintModal = ref(false)

// Load Filter Options & initial product
async function loadFilterOptions() {
  try {
    const opts = await salesProductReportService.getFilterOptions()
    filterOptions.value = opts

    // If query param has product_id, use it
    if (route.query.product_id) {
      filters.product_id = Number(route.query.product_id)
    } else if (opts.products.length > 0) {
      // Pick first product (or product 184 if available)
      const defaultProd = opts.products.find(p => p.id === 184) || opts.products[0]
      filters.product_id = defaultProd.id
    }

    if (route.query.customer_id) {
      filters.customer_id = Number(route.query.customer_id)
      activeMode.value = 'customer_detail'
      filters.mode = 'customer_detail'
    }

    if (route.query.date_from) filters.date_from = String(route.query.date_from)
    if (route.query.date_to) filters.date_to = String(route.query.date_to)

    if (filters.product_id) {
      fetchReport()
    }
  } catch (err) {
    toast.error('Gagal memuat opsi master produk')
  }
}

// Fetch Report Data
async function fetchReport() {
  if (!filters.product_id) return

  loading.value = true
  error.value = null

  try {
    const payload = await salesProductReportService.getReport({
      ...filters,
      mode: activeMode.value
    })

    items.value = payload.items || []
    productMeta.value = payload.product || null
    customerMeta.value = payload.customer || null
    summaryTotals.value = payload.summary || {
      total_rows: 0,
      total_so: 0,
      total_customers: 0,
      total_qty: 0,
      total_amount: 0
    }
    pagination.value = payload.pagination || {
      page: 1,
      per_page: filters.per_page || 25,
      total_items: payload.items?.length || 0,
      total_pages: 1
    }
  } catch (err: any) {
    error.value = err?.message || 'Data laporan gagal dimuat. Silakan coba kembali.'
  } finally {
    loading.value = false
  }
}

// Tab Switch Handler
function switchMode(newMode: ProductReportMode) {
  if (activeMode.value === newMode) return

  if (activeMode.value === 'summary') {
    // Save summary pagination & sorting
    summaryBackupState.page = filters.page || 1
    summaryBackupState.per_page = filters.per_page || 25
    summaryBackupState.sort_by = filters.sort_by || 'total_qty'
    summaryBackupState.sort_direction = filters.sort_direction || 'DESC'
  }

  activeMode.value = newMode
  filters.mode = newMode

  // Adjust default sorting based on mode
  if (newMode === 'summary') {
    filters.sort_by = summaryBackupState.sort_by || 'total_qty'
    filters.sort_direction = summaryBackupState.sort_direction || 'DESC'
    filters.page = summaryBackupState.page || 1
  } else {
    filters.sort_by = 'tanggal'
    filters.sort_direction = 'DESC'
    filters.page = 1
  }

  // If entering customer_detail mode without customer, prompt or pick first
  if (newMode === 'customer_detail' && !filters.customer_id) {
    if (items.value.length > 0 && 'customer_id' in items.value[0]) {
      const first = items.value[0] as ProductReportSummaryRow
      filters.customer_id = first.customer_id
    }
  }

  fetchReport()
}

// Drill-down from Summary or Chronological to Customer Detail
function handleDrilldown(customerId: number) {
  // Save summary state
  summaryBackupState.page = filters.page || 1
  summaryBackupState.per_page = filters.per_page || 25
  summaryBackupState.sort_by = filters.sort_by || 'total_qty'
  summaryBackupState.sort_direction = filters.sort_direction || 'DESC'

  filters.customer_id = customerId
  activeMode.value = 'customer_detail'
  filters.mode = 'customer_detail'
  filters.page = 1
  filters.sort_by = 'tanggal'
  filters.sort_direction = 'DESC'

  fetchReport()
}

// Back to Summary Button
function handleBackToSummary() {
  activeMode.value = 'summary'
  filters.mode = 'summary'
  filters.customer_id = undefined
  customerMeta.value = null

  // Restore previous filters/sorting/page
  filters.page = summaryBackupState.page
  filters.per_page = summaryBackupState.per_page
  filters.sort_by = summaryBackupState.sort_by
  filters.sort_direction = summaryBackupState.sort_direction

  fetchReport()
}

// Filter Apply Handler
function handleApplyFilter(newFilters: ProductReportFilterParams) {
  Object.assign(filters, newFilters)
  filters.mode = activeMode.value
  fetchReport()
}

// Reset Handler
function handleResetFilter() {
  filters.customer_id = undefined
  filters.so_status = '1'
  filters.search = ''
  filters.page = 1
  filters.mode = activeMode.value
  customerMeta.value = null
  fetchReport()
}

// Sorting Handler
function handleSort(colKey: string) {
  if (filters.sort_by === colKey) {
    filters.sort_direction = filters.sort_direction === 'ASC' ? 'DESC' : 'ASC'
  } else {
    filters.sort_by = colKey
    filters.sort_direction = 'DESC'
  }
  filters.page = 1
  fetchReport()
}

function handlePageChange(newPage: number) {
  filters.page = newPage
  fetchReport()
}

function handlePerPageChange(newPerPage: number) {
  filters.per_page = newPerPage
  filters.page = 1
  fetchReport()
}

// Column Visibility Management
function handleUpdateColumns(newCols: ReportColumnConfig[]) {
  columnsConfig[activeMode.value] = newCols
}

function handleResetColumns() {
  columnsConfig[activeMode.value] = JSON.parse(JSON.stringify(defaultColumnsMap[activeMode.value]))
}

// Export Excel
async function handleExportExcel() {
  if (!productMeta.value) {
    toast.error('Pilih produk terlebih dahulu')
    return
  }
  isExporting.value = true
  try {
    const allData = await salesProductReportService.getAllReportData({
      ...filters,
      mode: activeMode.value
    })
    exportProductReportToExcel(
      activeMode.value,
      productMeta.value,
      allData,
      filters.date_from,
      filters.date_to,
      summaryTotals.value,
      customerMeta.value
    )
    toast.success('Laporan Excel berhasil diunduh')
  } catch (err) {
    toast.error('Gagal mengunduh file Excel')
  } finally {
    isExporting.value = false
  }
}

// Export PDF
async function handleExportPdf() {
  if (!productMeta.value) {
    toast.error('Pilih produk terlebih dahulu')
    return
  }
  isExporting.value = true
  try {
    const allData = await salesProductReportService.getAllReportData({
      ...filters,
      mode: activeMode.value
    })
    exportProductReportToPdf(
      activeMode.value,
      productMeta.value,
      allData,
      filters.date_from,
      filters.date_to,
      summaryTotals.value,
      customerMeta.value
    )
    toast.success('Laporan PDF berhasil diunduh')
  } catch (err) {
    toast.error('Gagal mengunduh file PDF')
  } finally {
    isExporting.value = false
  }
}

onMounted(() => {
  loadFilterOptions()
})
</script>

<template>
  <div class="space-y-5 pb-12">
    <!-- Breadcrumb -->
    <div class="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
      <router-link to="/dashboard" class="flex items-center gap-1 hover:text-slate-800 transition">
        <Home class="w-3.5 h-3.5 text-slate-400" />
        Dashboard
      </router-link>
      <ChevronRight class="w-3 h-3 text-slate-400" />
      <span class="text-slate-500">Laporan</span>
      <ChevronRight class="w-3 h-3 text-slate-400" />
      <span class="text-slate-800 font-semibold">Penjualan Per Produk</span>
    </div>

    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">
          Penjualan Per Produk
        </h1>
        <p class="text-xs sm:text-sm text-slate-500 mt-0.5">
          Analisis pembelian produk berdasarkan pelanggan, tanggal, dan riwayat transaksi.
        </p>
      </div>
    </div>

    <!-- Filter Component -->
    <SalesProductReportFilter
      :initial-filters="filters"
      :filter-options="filterOptions"
      :active-mode="activeMode"
      :loading="loading"
      @apply="handleApplyFilter"
      @reset="handleResetFilter"
    />

    <!-- Reporting Tabs -->
    <div class="flex items-center gap-2 border-b border-slate-200">
      <button
        type="button"
        class="inline-flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 transition -mb-px"
        :class="activeMode === 'summary' ? 'border-primary-600 text-primary-700 bg-primary-50/40 rounded-t-lg' : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'"
        @click="switchMode('summary')"
      >
        <Layers class="w-4 h-4" />
        Ringkasan Customer
      </button>

      <button
        type="button"
        class="inline-flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 transition -mb-px"
        :class="activeMode === 'chronological' ? 'border-primary-600 text-primary-700 bg-primary-50/40 rounded-t-lg' : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'"
        @click="switchMode('chronological')"
      >
        <Clock class="w-4 h-4" />
        Urut Tanggal
      </button>

      <button
        type="button"
        class="inline-flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 transition -mb-px"
        :class="activeMode === 'customer_detail' ? 'border-primary-600 text-primary-700 bg-primary-50/40 rounded-t-lg' : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'"
        @click="switchMode('customer_detail')"
      >
        <User class="w-4 h-4" />
        Detail Customer
        <span
          v-if="customerMeta"
          class="ml-1 px-1.5 py-0.2 rounded bg-primary-100 text-primary-800 text-[10px] font-semibold max-w-[120px] truncate"
        >
          {{ customerMeta.nama }}
        </span>
      </button>
    </div>

    <!-- Active Result Information Header & Action Toolbar -->
    <div class="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <!-- Active Metadata Info -->
      <div class="space-y-1">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">HASIL LAPORAN:</span>
          <span v-if="productMeta" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800">
            <Package class="w-3.5 h-3.5 text-primary-600" />
            {{ productMeta.kode }} — {{ productMeta.nama }}
          </span>
          <span v-if="customerMeta && activeMode === 'customer_detail'" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-xs font-bold text-blue-800">
            <User class="w-3.5 h-3.5 text-blue-600" />
            {{ customerMeta.kode ? `${customerMeta.kode} — ` : '' }}{{ customerMeta.nama }}
          </span>
        </div>
        <div class="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Calendar class="w-3.5 h-3.5 text-slate-400" />
          <span>Periode: {{ formatDateIndo(filters.date_from) }} s/d {{ formatDateIndo(filters.date_to) }}</span>
          <span class="text-slate-300">|</span>
          <span class="font-semibold text-slate-700">Total: {{ formatNumberIndo(summaryTotals.total_qty) }} Qty</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center gap-2 self-end md:self-auto">
        <!-- Back to Summary (Mode 3 only) -->
        <button
          v-if="activeMode === 'customer_detail'"
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition"
          @click="handleBackToSummary"
        >
          <ArrowLeft class="w-3.5 h-3.5 text-slate-500" />
          Kembali ke Ringkasan
        </button>

        <!-- Atur Kolom -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition"
          @click="showColumnModal = true"
        >
          <SlidersHorizontal class="w-3.5 h-3.5 text-slate-500" />
          Atur Kolom
        </button>

        <!-- Excel -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold shadow-2xs transition disabled:opacity-50"
          :disabled="isExporting || items.length === 0"
          @click="handleExportExcel"
        >
          <FileSpreadsheet class="w-3.5 h-3.5 text-emerald-600" />
          Excel
        </button>

        <!-- PDF -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-semibold shadow-2xs transition disabled:opacity-50"
          :disabled="isExporting || items.length === 0"
          @click="handleExportPdf"
        >
          <FileText class="w-3.5 h-3.5 text-rose-600" />
          PDF
        </button>

        <!-- Cetak -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs transition disabled:opacity-50"
          :disabled="items.length === 0"
          @click="showPrintModal = true"
        >
          <Printer class="w-3.5 h-3.5 text-slate-600" />
          Cetak
        </button>
      </div>
    </div>

    <!-- Data Grid Table Component -->
    <SalesProductReportTable
      :mode="activeMode"
      :columns="currentColumns"
      :items="items"
      :pagination="pagination"
      :summary-totals="summaryTotals"
      :loading="loading"
      :error="error"
      :sort-by="filters.sort_by"
      :sort-direction="filters.sort_direction"
      @sort="handleSort"
      @page-change="handlePageChange"
      @per-page-change="handlePerPageChange"
      @drilldown="handleDrilldown"
      @retry="fetchReport"
    />

    <!-- Column Visibility Modal -->
    <SalesProductReportColumnModal
      :show="showColumnModal"
      :columns="currentColumns"
      @close="showColumnModal = false"
      @update="handleUpdateColumns"
      @reset="handleResetColumns"
    />

    <!-- Print Modal -->
    <SalesProductReportPrintModal
      v-if="showPrintModal"
      :show="showPrintModal"
      :filters="{ ...filters, mode: activeMode }"
      @close="showPrintModal = false"
    />
  </div>
</template>
