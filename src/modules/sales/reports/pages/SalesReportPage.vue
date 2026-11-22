<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import {
  FileSpreadsheet,
  FileText,
  Printer,
  SlidersHorizontal,
  Home,
  ChevronRight
} from 'lucide-vue-next'
import { salesReportService } from '../services/sales-report.service'
import type {
  SalesReportFilterParams,
  SalesReportFilterOptions,
  SalesReportPagination,
  SalesReportSummaryTotals,
  SalesReportType,
  ReportColumnConfig
} from '../types/sales-report.types'
import {
  exportSalesReportToExcel,
  exportSalesReportToPdf,
  getReportTypeLabel
} from '../utils/sales-report-export'
import SalesReportFilter from '../components/SalesReportFilter.vue'
import SalesReportTable from '../components/SalesReportTable.vue'
import SalesReportColumnModal from '../components/SalesReportColumnModal.vue'
import SalesReportPrintModal from '../components/SalesReportPrintModal.vue'
import { useToast } from '@/shared/composables/useToast'

const toast = useToast()

// Default Column Definitions per Report Type
const defaultColumnsMap: Record<SalesReportType, ReportColumnConfig[]> = {
  summary: [
    { key: 'no', label: 'No', width: 'w-10', align: 'center', visible: true, sortable: false },
    { key: 'tanggal', label: 'Tanggal SO', width: 'w-28', visible: true },
    { key: 'kode', label: 'Nomor SO', width: 'w-36', visible: true },
    { key: 'customer_name', label: 'Customer', visible: true },
    { key: 'item_count', label: 'Jml Item', align: 'right', visible: true },
    { key: 'total_qty', label: 'Total Qty', align: 'right', visible: true },
    { key: 'subtotal', label: 'Subtotal (Rp)', align: 'right', visible: true },
    { key: 'diskon', label: 'Diskon (Rp)', align: 'right', visible: true },
    { key: 'total_ppn', label: 'PPN (Rp)', align: 'right', visible: true },
    { key: 'total', label: 'Total SO (Rp)', align: 'right', visible: true },
    { key: 'status', label: 'Status SO', align: 'center', visible: true },
    { key: 'aksi', label: 'Aksi', align: 'center', visible: true, sortable: false }
  ],
  detail: [
    { key: 'no', label: 'No', width: 'w-10', align: 'center', visible: true, sortable: false },
    { key: 'tanggal', label: 'Tanggal SO', width: 'w-28', visible: true },
    { key: 'kode_so', label: 'Nomor SO', width: 'w-36', visible: true },
    { key: 'customer_name', label: 'Customer', visible: true },
    { key: 'kode_produk', label: 'Kode Produk', visible: true },
    { key: 'nama_produk', label: 'Nama Produk', visible: true },
    { key: 'satuan', label: 'Satuan', align: 'center', visible: true },
    { key: 'qty', label: 'Qty', align: 'right', visible: true },
    { key: 'harga', label: 'Harga Satuan', align: 'right', visible: true },
    { key: 'diskon', label: 'Diskon (%)', align: 'right', visible: true },
    { key: 'subtotal', label: 'Subtotal Item', align: 'right', visible: true },
    { key: 'status_so', label: 'Status SO', align: 'center', visible: true }
  ],
  customer: [
    { key: 'no', label: 'No', width: 'w-10', align: 'center', visible: true, sortable: false },
    { key: 'kode_customer', label: 'Kode Customer', visible: true },
    { key: 'nama_customer', label: 'Nama Customer', visible: true },
    { key: 'jumlah_so', label: 'Jumlah SO', align: 'right', visible: true },
    { key: 'total_qty', label: 'Total Qty Produk', align: 'right', visible: true },
    { key: 'subtotal_pesanan', label: 'Subtotal Pesanan', align: 'right', visible: true },
    { key: 'total_diskon', label: 'Total Diskon', align: 'right', visible: true },
    { key: 'total_ppn', label: 'Total PPN', align: 'right', visible: true },
    { key: 'total_nilai_so', label: 'Total Nilai SO', align: 'right', visible: true }
  ],
  product: [
    { key: 'no', label: 'No', width: 'w-10', align: 'center', visible: true, sortable: false },
    { key: 'kode_produk', label: 'Kode Produk', visible: true },
    { key: 'nama_produk', label: 'Nama Produk', visible: true },
    { key: 'satuan', label: 'Satuan', align: 'center', visible: true },
    { key: 'jumlah_so', label: 'Jumlah SO', align: 'right', visible: true },
    { key: 'total_qty_dipesan', label: 'Total Qty Dipesan', align: 'right', visible: true },
    { key: 'total_nilai_penjualan', label: 'Total Penjualan', align: 'right', visible: true },
    { key: 'harga_rata_rata', label: 'Harga Rata-rata', align: 'right', visible: true }
  ],
  status: [
    { key: 'no', label: 'No', width: 'w-10', align: 'center', visible: true, sortable: false },
    { key: 'tanggal', label: 'Tanggal SO', width: 'w-28', visible: true },
    { key: 'nomor_so', label: 'Nomor SO', width: 'w-36', visible: true },
    { key: 'customer_name', label: 'Customer', visible: true },
    { key: 'total_so', label: 'Total SO', align: 'right', visible: true },
    { key: 'status_so', label: 'Status SO', align: 'center', visible: true },
    { key: 'status_produksi', label: 'Status Produksi', align: 'center', visible: true },
    { key: 'status_pengiriman', label: 'Status Pengiriman', align: 'center', visible: true },
    { key: 'keterangan', label: 'Keterangan', visible: true }
  ],
  so_vs_delivery: [
    { key: 'no', label: 'No', width: 'w-10', align: 'center', visible: true, sortable: false },
    { key: 'nomor_so', label: 'Nomor SO', width: 'w-36', visible: true },
    { key: 'tanggal_so', label: 'Tanggal SO', width: 'w-28', visible: true },
    { key: 'customer_name', label: 'Customer', visible: true },
    { key: 'kode_produk', label: 'Kode Produk', visible: true },
    { key: 'nama_produk', label: 'Nama Produk', visible: true },
    { key: 'qty_pesanan', label: 'Qty Pesanan', align: 'right', visible: true },
    { key: 'qty_terkirim', label: 'Qty Terkirim', align: 'right', visible: true },
    { key: 'sisa_qty', label: 'Sisa Qty', align: 'right', visible: true },
    { key: 'persentase_pengiriman', label: 'Realisasi (%)', align: 'right', visible: true },
    { key: 'status_pengiriman', label: 'Status Pengiriman', align: 'center', visible: true }
  ],
  invoice: [
    { key: 'no', label: 'No', width: 'w-10', align: 'center', visible: true, sortable: false },
    { key: 'tanggal_invoice', label: 'Tanggal Invoice', width: 'w-28', visible: true },
    { key: 'nomor_invoice', label: 'Nomor Invoice', width: 'w-36', visible: true },
    { key: 'nomor_so', label: 'Nomor SO', width: 'w-36', visible: true },
    { key: 'customer_name', label: 'Customer', visible: true },
    { key: 'jenis_invoice', label: 'Jenis Invoice', align: 'center', visible: true },
    { key: 'subtotal', label: 'Subtotal (Rp)', align: 'right', visible: true },
    { key: 'diskon', label: 'Diskon (Rp)', align: 'right', visible: true },
    { key: 'total_ppn', label: 'PPN (Rp)', align: 'right', visible: true },
    { key: 'total_invoice', label: 'Total Invoice (Rp)', align: 'right', visible: true },
    { key: 'status_invoice', label: 'Status Invoice', align: 'center', visible: true }
  ],
  payment_receivable: [
    { key: 'no', label: 'No', width: 'w-10', align: 'center', visible: true, sortable: false },
    { key: 'nomor_invoice', label: 'Nomor Invoice', width: 'w-36', visible: true },
    { key: 'tanggal_invoice', label: 'Tanggal Invoice', width: 'w-28', visible: true },
    { key: 'nomor_so', label: 'Nomor SO', width: 'w-36', visible: true },
    { key: 'customer_name', label: 'Customer', visible: true },
    { key: 'jenis_invoice', label: 'Jenis Invoice', align: 'center', visible: true },
    { key: 'total_invoice', label: 'Total Tagihan (Rp)', align: 'right', visible: true },
    { key: 'total_pembayaran', label: 'Total Pembayaran (Rp)', align: 'right', visible: true },
    { key: 'sisa_tagihan', label: 'Sisa Tagihan (Rp)', align: 'right', visible: true },
    { key: 'status_pembayaran', label: 'Status Pembayaran', align: 'center', visible: true }
  ]
}

// State
const loading = ref(false)
const exportLoading = ref(false)
const error = ref<string | null>(null)
const items = ref<any[]>([])
const filterOptions = ref<SalesReportFilterOptions | null>(null)

const activeFilters = reactive<SalesReportFilterParams>({
  report_type: 'summary',
  date_from: '',
  date_to: '',
  date_basis: 'so',
  customer_id: undefined,
  product_id: undefined,
  status: 'ALL',
  production_status: 'ALL',
  delivery_status: 'ALL',
  invoice_type: 'ALL',
  payment_status: 'ALL',
  order_type: 'ALL',
  search: '',
  min_amount: undefined,
  max_amount: undefined,
  created_by: undefined,
  sort_by: 'tanggal',
  sort_direction: 'DESC',
  page: 1,
  per_page: 25
})

const pagination = reactive<SalesReportPagination>({
  page: 1,
  per_page: 25,
  total_items: 0,
  total_pages: 1
})

const summaryTotals = ref<SalesReportSummaryTotals | undefined>(undefined)

// Column configuration state
const currentColumns = ref<ReportColumnConfig[]>([])

// Synchronize columns when report_type changes
watch(
  () => activeFilters.report_type,
  (newType) => {
    currentColumns.value = JSON.parse(JSON.stringify(defaultColumnsMap[newType] || defaultColumnsMap.summary))
  },
  { immediate: true }
)

// Modals
const showColumnModal = ref(false)
const showPrintModal = ref(false)

// Fetch Filter Options
async function loadFilterOptions() {
  try {
    const opts = await salesReportService.getFilterOptions()
    filterOptions.value = opts || null
  } catch (err: any) {
    console.error('Failed to load filter options:', err)
    filterOptions.value = null
  }
}

// Fetch Report Data
async function fetchReport() {
  loading.value = true
  error.value = null

  try {
    const res = await salesReportService.getReport(activeFilters)
    items.value = res?.items || []
    if (res?.pagination) {
      Object.assign(pagination, res.pagination)
    }
    summaryTotals.value = res?.summary_totals
  } catch (err: any) {
    console.error('Failed to load sales report:', err)
    error.value = err.message || 'Gagal memuat data laporan penjualan dari server'
    if (error.value) {
      toast.error(error.value)
    }
  } finally {
    loading.value = false
  }
}

// Filter apply & reset
function handleApplyFilters(newFilters: SalesReportFilterParams) {
  Object.assign(activeFilters, newFilters)
  fetchReport()
}

function handleResetFilters() {
  activeFilters.report_type = 'summary'
  activeFilters.date_from = ''
  activeFilters.date_to = ''
  activeFilters.date_basis = 'so'
  activeFilters.customer_id = undefined
  activeFilters.product_id = undefined
  activeFilters.status = 'ALL'
  activeFilters.production_status = 'ALL'
  activeFilters.delivery_status = 'ALL'
  activeFilters.invoice_type = 'ALL'
  activeFilters.payment_status = 'ALL'
  activeFilters.order_type = 'ALL'
  activeFilters.search = ''
  activeFilters.min_amount = undefined
  activeFilters.max_amount = undefined
  activeFilters.created_by = undefined
  activeFilters.sort_by = 'tanggal'
  activeFilters.sort_direction = 'DESC'
  activeFilters.page = 1
  fetchReport()
}

// Table sort & pagination
function handleSort(colKey: string) {
  if (activeFilters.sort_by === colKey) {
    activeFilters.sort_direction = activeFilters.sort_direction === 'ASC' ? 'DESC' : 'ASC'
  } else {
    activeFilters.sort_by = colKey
    activeFilters.sort_direction = 'DESC'
  }
  fetchReport()
}

function handlePageChange(newPage: number) {
  if (newPage < 1 || newPage > pagination.total_pages) return
  activeFilters.page = newPage
  fetchReport()
}

function handlePerPageChange(newPerPage: number) {
  activeFilters.per_page = newPerPage
  activeFilters.page = 1
  fetchReport()
}

// Column settings modal
function handleUpdateColumns(newCols: ReportColumnConfig[]) {
  currentColumns.value = newCols
  toast.success('Pengaturan kolom berhasil disimpan.')
}

function handleResetColumns() {
  currentColumns.value = JSON.parse(
    JSON.stringify(defaultColumnsMap[activeFilters.report_type] || defaultColumnsMap.summary)
  )
  toast.info('Pengaturan kolom dikembalikan ke default.')
}

// Export actions
function getFilterSummaryText(): string {
  const parts: string[] = []
  if (activeFilters.date_from || activeFilters.date_to) {
    parts.push(`Periode: ${activeFilters.date_from || 'Awal'} s/d ${activeFilters.date_to || 'Sekarang'}`)
  }
  if (activeFilters.status && activeFilters.status !== 'ALL') {
    parts.push(`Status: ${activeFilters.status}`)
  }
  if (activeFilters.customer_id) {
    const cust = filterOptions.value?.customers.find(c => c.id === activeFilters.customer_id)
    if (cust) parts.push(`Customer: ${cust.nama}`)
  }
  if (activeFilters.search) {
    parts.push(`Cari: "${activeFilters.search}"`)
  }
  return parts.join(' | ') || 'Semua Data'
}

async function handleExportExcel() {
  exportLoading.value = true
  try {
    const allData = await salesReportService.getAllReportData(activeFilters)
    exportSalesReportToExcel(
      activeFilters.report_type,
      allData,
      getFilterSummaryText(),
      summaryTotals.value
    )
    toast.success('File Excel berhasil diekspor.')
  } catch (err: any) {
    console.error('Export Excel failed:', err)
    toast.error('Gagal mengekspor file Excel.')
  } finally {
    exportLoading.value = false
  }
}

async function handleExportPdf() {
  exportLoading.value = true
  try {
    const allData = await salesReportService.getAllReportData(activeFilters)
    exportSalesReportToPdf(
      activeFilters.report_type,
      allData,
      getFilterSummaryText(),
      summaryTotals.value
    )
    toast.success('File PDF berhasil dibuat.')
  } catch (err: any) {
    console.error('Export PDF failed:', err)
    toast.error('Gagal mengekspor file PDF.')
  } finally {
    exportLoading.value = false
  }
}

function handleOpenPrint() {
  showPrintModal.value = true
}

onMounted(() => {
  loadFilterOptions()
  fetchReport()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Breadcrumb & Header Title -->
    <div>
      <div class="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5 font-medium">
        <router-link to="/dashboard" class="hover:text-teal-600 transition flex items-center gap-1">
          <Home class="w-3.5 h-3.5" />
          Dashboard
        </router-link>
        <ChevronRight class="w-3.5 h-3.5 text-slate-300" />
        <span>Laporan</span>
        <ChevronRight class="w-3.5 h-3.5 text-slate-300" />
        <span class="text-teal-700 font-semibold">Laporan Penjualan</span>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold text-slate-800 tracking-tight">
            Laporan Penjualan
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">
            Laporan transaksi penjualan, invoice, pengiriman, dan pembayaran pelanggan.
          </p>
        </div>
      </div>
    </div>

    <!-- Parameter Filter Box -->
    <SalesReportFilter
      :initial-filters="activeFilters"
      :filter-options="filterOptions"
      :loading="loading"
      @apply="handleApplyFilters"
      @reset="handleResetFilters"
    />

    <!-- Section Result & Table Controls -->
    <div class="space-y-3">
      <!-- Result Bar & Action Buttons -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700">
            HASIL LAPORAN PENJUALAN
          </h3>
          <p class="text-xs text-slate-500 mt-0.5">
            Periode: <span class="font-medium text-slate-700">{{ activeFilters.date_from || 'Semua' }} — {{ activeFilters.date_to || 'Semua' }}</span> &bull;
            Jenis: <span class="font-semibold text-teal-700">{{ getReportTypeLabel(activeFilters.report_type) }}</span>
          </p>
        </div>

        <!-- Toolbar Buttons: Atur Kolom, Excel, PDF, Cetak -->
        <div class="flex items-center gap-2">
          <!-- Atur Kolom -->
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-sm transition"
            @click="showColumnModal = true"
          >
            <SlidersHorizontal class="w-3.5 h-3.5 text-slate-500" />
            Atur Kolom
          </button>

          <!-- Export Excel -->
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg shadow-sm transition disabled:opacity-50"
            :disabled="exportLoading || loading || items.length === 0"
            @click="handleExportExcel"
          >
            <FileSpreadsheet class="w-3.5 h-3.5 text-emerald-600" />
            Excel
          </button>

          <!-- Export PDF -->
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg shadow-sm transition disabled:opacity-50"
            :disabled="exportLoading || loading || items.length === 0"
            @click="handleExportPdf"
          >
            <FileText class="w-3.5 h-3.5 text-rose-600" />
            PDF
          </button>

          <!-- Cetak Langsung -->
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition disabled:opacity-50"
            :disabled="loading || items.length === 0"
            @click="handleOpenPrint"
          >
            <Printer class="w-3.5 h-3.5" />
            Cetak
          </button>
        </div>
      </div>

      <!-- Data Table -->
      <SalesReportTable
        :report-type="activeFilters.report_type"
        :columns="currentColumns"
        :items="items"
        :pagination="pagination"
        :summary-totals="summaryTotals"
        :loading="loading"
        :error="error"
        :sort-by="activeFilters.sort_by || 'tanggal'"
        :sort-direction="activeFilters.sort_direction || 'DESC'"
        @sort="handleSort"
        @page-change="handlePageChange"
        @per-page-change="handlePerPageChange"
        @retry="fetchReport"
      />
    </div>

    <!-- Column Visibility Modal -->
    <SalesReportColumnModal
      :show="showColumnModal"
      :columns="currentColumns"
      @close="showColumnModal = false"
      @update="handleUpdateColumns"
      @reset="handleResetColumns"
    />

    <!-- Print Preview Modal -->
    <SalesReportPrintModal
      :show="showPrintModal"
      :report-type="activeFilters.report_type"
      :items="items"
      :summary-totals="summaryTotals"
      :filter-info="getFilterSummaryText()"
      @close="showPrintModal = false"
    />
  </div>
</template>
