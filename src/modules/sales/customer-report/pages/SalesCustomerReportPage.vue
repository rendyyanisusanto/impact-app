<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  FileSpreadsheet,
  FileText,
  Printer,
  SlidersHorizontal,
  Home,
  ChevronRight,
  User
} from 'lucide-vue-next'
import { salesCustomerReportService } from '../services/sales-customer-report.service'
import type {
  CustomerReportFilterParams,
  SalesCustomerReportFilterOptions,
  CustomerReportPagination,
  CustomerReportSummaryTotals,
  CustomerReportCustomerMeta,
  CustomerReportItemRow,
  ReportColumnConfig
} from '../types/sales-customer-report.types'
import {
  exportCustomerReportToExcel,
  exportCustomerReportToPdf
} from '../utils/sales-customer-report-export'
import SalesCustomerReportFilter from '../components/SalesCustomerReportFilter.vue'
import SalesCustomerReportTable from '../components/SalesCustomerReportTable.vue'
import SalesCustomerReportColumnModal from '../components/SalesCustomerReportColumnModal.vue'
import SalesCustomerReportPrintModal from '../components/SalesCustomerReportPrintModal.vue'
import { useToast } from '@/shared/composables/useToast'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Default columns definition
const defaultColumns: ReportColumnConfig[] = [
  { key: 'no', label: 'No', width: 'w-10', align: 'center', visible: true, sortable: false },
  { key: 'tanggal', label: 'Tanggal', width: 'w-24', visible: true },
  { key: 'kode', label: 'Nomor SO', width: 'w-36', visible: true },
  { key: 'subtotal', label: 'Subtotal', width: 'w-32', align: 'right', visible: true },
  { key: 'total_ppn', label: 'PPN', width: 'w-28', align: 'right', visible: true },
  { key: 'diskon', label: 'Diskon', width: 'w-28', align: 'right', visible: true },
  { key: 'total', label: 'Total', width: 'w-32', align: 'right', visible: true },
  { key: 'status', label: 'Status', width: 'w-28', align: 'center', visible: true },
  { key: 'keterangan', label: 'Keterangan', visible: true },
  { key: 'creator_username', label: 'Dibuat Oleh', width: 'w-28', visible: false },
  { key: 'created_at', label: 'Tanggal Dibuat', width: 'w-36', visible: false },
  { key: 'updated_at', label: 'Terakhir Diperbarui', width: 'w-36', visible: false },
  { key: 'order_type', label: 'Tipe Order', width: 'w-24', align: 'center', visible: false },
  { key: 'aksi', label: 'Aksi', width: 'w-28', align: 'center', visible: true, sortable: false }
]

const columns = ref<ReportColumnConfig[]>(JSON.parse(JSON.stringify(defaultColumns)))
const showColumnModal = ref(false)
const showPrintModal = ref(false)

// Active filter state
const filters = reactive<CustomerReportFilterParams>({
  customer_id: route.query.customer_id ? Number(route.query.customer_id) : undefined,
  date_from: (route.query.date_from as string) || '',
  date_to: (route.query.date_to as string) || '',
  status: (route.query.status as any) || 'ALL',
  search: (route.query.search as string) || '',
  min_total: route.query.min_total ? Number(route.query.min_total) : null,
  max_total: route.query.max_total ? Number(route.query.max_total) : null,
  sort_by: (route.query.sort_by as string) || 'tanggal',
  sort_direction: ((route.query.sort_direction as string)?.toUpperCase() as 'ASC' | 'DESC') || 'DESC',
  page: route.query.page ? Number(route.query.page) : 1,
  per_page: route.query.per_page ? Number(route.query.per_page) : 25
})

// Data state
const filterOptions = ref<SalesCustomerReportFilterOptions | null>(null)
const currentCustomer = ref<CustomerReportCustomerMeta | null>(null)
const items = ref<CustomerReportItemRow[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const exportLoading = ref(false)

const pagination = reactive<CustomerReportPagination>({
  page: 1,
  per_page: 25,
  total_items: 0,
  total_pages: 1
})

const summary = reactive<CustomerReportSummaryTotals>({
  total_orders: 0,
  subtotal: 0,
  discount: 0,
  tax: 0,
  grand_total: 0
})

// URL Sync: Keep browser URL query parameters synchronized with filter state
function syncUrlParams() {
  const query: Record<string, string> = {}
  if (filters.customer_id) query.customer_id = String(filters.customer_id)
  if (filters.date_from) query.date_from = filters.date_from
  if (filters.date_to) query.date_to = filters.date_to
  if (filters.status && filters.status !== 'ALL') query.status = filters.status
  if (filters.search) query.search = filters.search
  if (filters.min_total !== null && filters.min_total !== undefined) query.min_total = String(filters.min_total)
  if (filters.max_total !== null && filters.max_total !== undefined) query.max_total = String(filters.max_total)
  if (filters.sort_by && filters.sort_by !== 'tanggal') query.sort_by = filters.sort_by
  if (filters.sort_direction && filters.sort_direction !== 'DESC') query.sort_direction = filters.sort_direction
  if (filters.page && filters.page > 1) query.page = String(filters.page)
  if (filters.per_page && filters.per_page !== 25) query.per_page = String(filters.per_page)

  router.replace({ query })
}

// Load data
async function loadData() {
  if (!filters.customer_id) {
    items.value = []
    currentCustomer.value = null
    summary.total_orders = 0
    summary.subtotal = 0
    summary.discount = 0
    summary.tax = 0
    summary.grand_total = 0
    pagination.total_items = 0
    pagination.total_pages = 1
    return
  }

  loading.value = true
  error.value = null

  try {
    syncUrlParams()
    const res = await salesCustomerReportService.getReport(filters)
    items.value = res.items || []
    currentCustomer.value = res.customer || null
    Object.assign(pagination, res.pagination)
    Object.assign(summary, res.summary)
  } catch (err: any) {
    console.error('Failed to load customer report', err)
    error.value = err.message || 'Data laporan gagal dimuat. Silakan coba kembali.'
    toast.error(error.value || 'Data laporan gagal dimuat. Silakan coba kembali.')
  } finally {
    loading.value = false
  }
}

// Load filter options (customers list, etc)
async function loadFilterOptions() {
  try {
    const opts = await salesCustomerReportService.getFilterOptions()
    filterOptions.value = opts
  } catch (err) {
    console.error('Failed to load filter options', err)
  }
}

// Handlers
function handleFilterApply(newFilters: CustomerReportFilterParams) {
  Object.assign(filters, newFilters)
  filters.page = 1
  loadData()
}

function handleFilterReset() {
  filters.date_from = ''
  filters.date_to = ''
  filters.status = 'ALL'
  filters.search = ''
  filters.min_total = null
  filters.max_total = null
  filters.sort_by = 'tanggal'
  filters.sort_direction = 'DESC'
  filters.page = 1
  loadData()
}

function handleSort(colKey: string) {
  if (filters.sort_by === colKey) {
    filters.sort_direction = filters.sort_direction === 'ASC' ? 'DESC' : 'ASC'
  } else {
    filters.sort_by = colKey
    filters.sort_direction = 'DESC'
  }
  filters.page = 1
  loadData()
}

function handlePageChange(newPage: number) {
  filters.page = newPage
  loadData()
}

function handlePerPageChange(newPerPage: number) {
  filters.per_page = newPerPage
  filters.page = 1
  loadData()
}

function handleColumnUpdate(newCols: ReportColumnConfig[]) {
  columns.value = newCols
}

function handleColumnReset() {
  columns.value = JSON.parse(JSON.stringify(defaultColumns))
}

// Export Excel
async function handleExportExcel() {
  if (!filters.customer_id || !currentCustomer.value) {
    toast.error('Pilih pelanggan terlebih dahulu')
    return
  }

  exportLoading.value = true
  try {
    toast.info('Menyiapkan file Excel...')
    const allData = await salesCustomerReportService.getAllReportData(filters)

    const statusLabel =
      filters.status === '0'
        ? 'Terbuka'
        : filters.status === '1'
          ? 'Tertutup'
          : filters.status === 'cancelled'
            ? 'Dibatalkan'
            : 'Semua Status'

    exportCustomerReportToExcel(
      currentCustomer.value,
      allData,
      filters.date_from,
      filters.date_to,
      statusLabel,
      summary
    )
    toast.success('File Excel berhasil diunduh')
  } catch (err: any) {
    console.error('Export Excel failed', err)
    toast.error('Gagal mengekspor data ke Excel')
  } finally {
    exportLoading.value = false
  }
}

// Export PDF
async function handleExportPdf() {
  if (!filters.customer_id || !currentCustomer.value) {
    toast.error('Pilih pelanggan terlebih dahulu')
    return
  }

  exportLoading.value = true
  try {
    toast.info('Menyiapkan dokumen PDF...')
    const allData = await salesCustomerReportService.getAllReportData(filters)

    const statusLabel =
      filters.status === '0'
        ? 'Terbuka'
        : filters.status === '1'
          ? 'Tertutup'
          : filters.status === 'cancelled'
            ? 'Dibatalkan'
            : 'Semua Status'

    exportCustomerReportToPdf(
      currentCustomer.value,
      allData,
      filters.date_from,
      filters.date_to,
      statusLabel,
      summary
    )
    toast.success('Dokumen PDF berhasil diunduh')
  } catch (err: any) {
    console.error('Export PDF failed', err)
    toast.error('Gagal mengekspor data ke PDF')
  } finally {
    exportLoading.value = false
  }
}

// Print Modal URL
const printModalUrl = computed(() => {
  return salesCustomerReportService.getPrintUrl(filters)
})

onMounted(async () => {
  await loadFilterOptions()
  if (filters.customer_id) {
    await loadData()
  }
})
</script>

<template>
  <div class="space-y-6 pb-12 w-full">
    <!-- BREADCRUMB & HEADER -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <!-- Breadcrumb -->
        <nav class="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
          <router-link to="/dashboard" class="flex items-center gap-1 hover:text-slate-700 transition">
            <Home class="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </router-link>
          <ChevronRight class="w-3.5 h-3.5 text-slate-400" />
          <span class="hover:text-slate-700 transition">Laporan</span>
          <ChevronRight class="w-3.5 h-3.5 text-slate-400" />
          <span class="text-teal-700 font-medium">Laporan Per Customer</span>
        </nav>

        <!-- Title & Subtitle -->
        <h1 class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Laporan Per Customer
        </h1>
        <p class="text-xs sm:text-sm text-slate-500 mt-0.5">
          Riwayat transaksi dan nilai penjualan berdasarkan pelanggan.
        </p>
      </div>

        <!-- ACTION TOOLBAR -->
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Atur Kolom -->
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition active:scale-[0.98]"
            title="Kustomisasi kolom tabel"
            @click="showColumnModal = true"
          >
            <SlidersHorizontal class="w-3.5 h-3.5 text-slate-500" />
            <span>Atur Kolom</span>
          </button>

          <!-- Export Excel -->
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition active:scale-[0.98] disabled:opacity-50"
            :disabled="!filters.customer_id || exportLoading || loading"
            title="Unduh format spreadsheet XLSX"
            @click="handleExportExcel"
          >
            <FileSpreadsheet class="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>

          <!-- Export PDF -->
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition active:scale-[0.98] disabled:opacity-50"
            :disabled="!filters.customer_id || exportLoading || loading"
            title="Unduh dokumen PDF"
            @click="handleExportPdf"
          >
            <FileText class="w-3.5 h-3.5 text-rose-600" />
            <span>PDF</span>
          </button>

          <!-- Cetak Laporan -->
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition active:scale-[0.98] disabled:opacity-50"
            :disabled="!filters.customer_id || loading"
            title="Pratinjau cetak laporan"
            @click="showPrintModal = true"
          >
            <Printer class="w-3.5 h-3.5" />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      <!-- FILTER CARD -->
      <SalesCustomerReportFilter
        :initial-filters="filters"
        :filter-options="filterOptions"
        :loading="loading"
        @apply="handleFilterApply"
        @reset="handleFilterReset"
      />

      <!-- MAIN CONTENT: TABLE OR PROMPT -->
      <div v-if="!filters.customer_id" class="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
        <div class="w-14 h-14 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto mb-4 text-teal-600">
          <User class="w-7 h-7" />
        </div>
        <h3 class="text-base font-bold text-slate-800 mb-1">
          Pilih Pelanggan Terlebih Dahulu
        </h3>
        <p class="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Silakan gunakan pencarian pelanggan di atas untuk melihat seluruh riwayat Sales Order, subtotal, diskon, PPN, dan grand total penjualan pelanggan.
        </p>
      </div>

      <!-- DATA TABLE -->
      <SalesCustomerReportTable
        v-else
        :items="items"
        :pagination="pagination"
        :summary="summary"
        :columns="columns"
        :loading="loading"
        :error="error"
        :sort-by="filters.sort_by || 'tanggal'"
        :sort-direction="filters.sort_direction || 'DESC'"
        @sort="handleSort"
        @page-change="handlePageChange"
        @per-page-change="handlePerPageChange"
      />

    <!-- MODAL: ATUR KOLOM -->
    <SalesCustomerReportColumnModal
      :show="showColumnModal"
      :columns="columns"
      @close="showColumnModal = false"
      @update="handleColumnUpdate"
      @reset="handleColumnReset"
    />

    <!-- MODAL: PREVIEW CETAK LAPORAN -->
    <SalesCustomerReportPrintModal
      :show="showPrintModal"
      :print-url="printModalUrl"
      :title="`Cetak Laporan: ${currentCustomer?.kode || ''} - ${currentCustomer?.nama || ''}`"
      @close="showPrintModal = false"
      @export-pdf="handleExportPdf"
    />
  </div>
</template>
