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
import { purchaseReportService } from '../services/purchase-report.service'
import type {
  PurchaseReportFilterParams,
  PurchaseReportFilterOptions,
  PurchaseReportPagination,
  PurchaseReportSummaryTotals,
  PurchaseReportType,
  ReportColumnConfig
} from '../types/purchase-report.types'
import {
  exportPurchaseReportToExcel,
  exportPurchaseReportToPdf
} from '../utils/purchase-report-export'
import PurchaseReportFilter from '../components/PurchaseReportFilter.vue'
import PurchaseReportTable from '../components/PurchaseReportTable.vue'
import PurchaseReportColumnModal from '../components/PurchaseReportColumnModal.vue'
import PurchaseReportPrintModal from '../components/PurchaseReportPrintModal.vue'
import { useToast } from '@/shared/composables/useToast'

const toast = useToast()

// Default Column Definitions per Report Type
const defaultColumnsMap: Record<PurchaseReportType, ReportColumnConfig[]> = {
  summary: [
    { key: 'no', label: 'No', width: 'w-10', align: 'center', visible: true, sortable: false },
    { key: 'tanggal', label: 'Tanggal PO', width: 'w-28', visible: true },
    { key: 'kode', label: 'Nomor PO', width: 'w-36', visible: true },
    { key: 'supplier_name', label: 'Supplier', visible: true },
    { key: 'item_count', label: 'Jml Item', align: 'right', visible: true },
    { key: 'total_qty', label: 'Total Qty', align: 'right', visible: true },
    { key: 'subtotal', label: 'Subtotal (Rp)', align: 'right', visible: true },
    { key: 'total_ppn', label: 'PPN (Rp)', align: 'right', visible: true },
    { key: 'total', label: 'Total PO (Rp)', align: 'right', visible: true },
    { key: 'status', label: 'Status PO', align: 'center', visible: true },
    { key: 'status_transaksi_nama', label: 'Tipe Transaksi', visible: false }
  ],
  detail: [
    { key: 'no', label: 'No', width: 'w-10', align: 'center', visible: true, sortable: false },
    { key: 'tanggal', label: 'Tanggal PO', width: 'w-28', visible: true },
    { key: 'kode_po', label: 'Nomor PO', width: 'w-36', visible: true },
    { key: 'supplier_name', label: 'Supplier', visible: true },
    { key: 'kode_bahan', label: 'Kode Bahan', visible: true },
    { key: 'nama_bahan', label: 'Nama Bahan', visible: true },
    { key: 'satuan', label: 'Satuan', align: 'center', visible: true },
    { key: 'qty', label: 'Qty Pesan', align: 'right', visible: true },
    { key: 'harga', label: 'Harga Satuan', align: 'right', visible: true },
    { key: 'diskon', label: 'Diskon', align: 'right', visible: true },
    { key: 'subtotal', label: 'Subtotal Item', align: 'right', visible: true },
    { key: 'status_po', label: 'Status PO', align: 'center', visible: true }
  ],
  supplier: [
    { key: 'no', label: 'No', width: 'w-10', align: 'center', visible: true, sortable: false },
    { key: 'kode_supplier', label: 'Kode Supplier', visible: true },
    { key: 'nama_supplier', label: 'Nama Supplier', visible: true },
    { key: 'jumlah_po', label: 'Jumlah PO', align: 'right', visible: true },
    { key: 'total_nilai_po', label: 'Total Nilai PO', align: 'right', visible: true },
    { key: 'total_nilai_diterima', label: 'Total Nilai Diterima', align: 'right', visible: true },
    { key: 'total_tagihan', label: 'Total Tagihan', align: 'right', visible: true }
  ],
  material: [
    { key: 'no', label: 'No', width: 'w-10', align: 'center', visible: true, sortable: false },
    { key: 'kode_bahan', label: 'Kode Bahan', visible: true },
    { key: 'nama_bahan', label: 'Nama Bahan', visible: true },
    { key: 'satuan', label: 'Satuan', align: 'center', visible: true },
    { key: 'total_qty_pesan', label: 'Total Qty Pesan', align: 'right', visible: true },
    { key: 'total_nilai_pesan', label: 'Total Nilai Pesan', align: 'right', visible: true },
    { key: 'total_qty_terima', label: 'Total Qty Terima', align: 'right', visible: true },
    { key: 'total_nilai_terima', label: 'Total Nilai Terima', align: 'right', visible: true }
  ],
  status: [
    { key: 'no', label: 'No', width: 'w-10', align: 'center', visible: true, sortable: false },
    { key: 'nomor_po', label: 'Nomor PO', width: 'w-36', visible: true },
    { key: 'tanggal', label: 'Tanggal', width: 'w-28', visible: true },
    { key: 'supplier_name', label: 'Supplier', visible: true },
    { key: 'total_po', label: 'Total PO', align: 'right', visible: true },
    { key: 'qty_pesan', label: 'Qty Pesan', align: 'right', visible: true },
    { key: 'qty_terima', label: 'Qty Diterima', align: 'right', visible: true },
    { key: 'sisa_qty', label: 'Sisa Qty', align: 'right', visible: true },
    { key: 'status_penerimaan', label: 'Status Penerimaan', align: 'center', visible: true },
    { key: 'status_po', label: 'Status PO', align: 'center', visible: true }
  ],
  po_vs_receipt: [
    { key: 'no', label: 'No', width: 'w-10', align: 'center', visible: true, sortable: false },
    { key: 'nomor_po', label: 'Nomor PO', width: 'w-36', visible: true },
    { key: 'tanggal_po', label: 'Tanggal PO', width: 'w-28', visible: true },
    { key: 'supplier_name', label: 'Supplier', visible: true },
    { key: 'kode_bahan', label: 'Kode Bahan', visible: true },
    { key: 'nama_bahan', label: 'Nama Bahan', visible: true },
    { key: 'satuan', label: 'Satuan', align: 'center', visible: true },
    { key: 'qty_po', label: 'Qty PO', align: 'right', visible: true },
    { key: 'qty_terima', label: 'Qty Terima', align: 'right', visible: true },
    { key: 'sisa_qty', label: 'Sisa Qty', align: 'right', visible: true },
    { key: 'persentase', label: 'Realisasi (%)', align: 'right', visible: true },
    { key: 'status_penerimaan', label: 'Status Penerimaan', align: 'center', visible: true }
  ],
  purchase_vs_payment: [
    { key: 'no', label: 'No', width: 'w-10', align: 'center', visible: true, sortable: false },
    { key: 'nomor_po', label: 'Nomor PO', width: 'w-36', visible: true },
    { key: 'tanggal_po', label: 'Tanggal PO', width: 'w-28', visible: true },
    { key: 'supplier_name', label: 'Supplier', visible: true },
    { key: 'nilai_po', label: 'Nilai PO', align: 'right', visible: true },
    { key: 'nilai_penerimaan', label: 'Nilai Penerimaan', align: 'right', visible: true },
    { key: 'nomor_tagihan', label: 'Nomor Tagihan', visible: true },
    { key: 'nilai_tagihan', label: 'Nilai Tagihan', align: 'right', visible: true },
    { key: 'nilai_dibayar', label: 'Nilai Dibayar', align: 'right', visible: true },
    { key: 'sisa_tagihan', label: 'Sisa Tagihan', align: 'right', visible: true },
    { key: 'status_pembayaran', label: 'Status Pembayaran', align: 'center', visible: true }
  ]
}

// State
const loading = ref(false)
const exportLoading = ref(false)
const error = ref<string | null>(null)
const items = ref<any[]>([])
const filterOptions = ref<PurchaseReportFilterOptions | null>(null)

const activeFilters = reactive<PurchaseReportFilterParams>({
  report_type: 'summary',
  date_from: '',
  date_to: '',
  date_basis: 'po',
  supplier_id: undefined,
  material_id: undefined,
  warehouse_id: undefined,
  status: 'ALL',
  payment_status: 'ALL',
  receipt_status: 'ALL',
  search: '',
  min_amount: undefined,
  max_amount: undefined,
  created_by: undefined,
  sort_by: 'tanggal',
  sort_direction: 'DESC',
  page: 1,
  per_page: 25
})

const pagination = reactive<PurchaseReportPagination>({
  page: 1,
  per_page: 25,
  total_items: 0,
  total_pages: 1
})

const summaryTotals = ref<PurchaseReportSummaryTotals | undefined>(undefined)

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
const printableItems = ref<any[]>([])

// Fetch Filter Options
async function loadFilterOptions() {
  try {
    filterOptions.value = await purchaseReportService.getFilterOptions()
  } catch (err: any) {
    console.error('Failed to load filter options:', err)
  }
}

// Fetch Report Data
async function fetchReport() {
  loading.value = true
  error.value = null

  try {
    const res = await purchaseReportService.getReport(activeFilters)
    items.value = res.items || []
    Object.assign(pagination, res.pagination)
    summaryTotals.value = res.summary
  } catch (err: any) {
    console.error('Failed to load purchase report:', err)
    error.value = err.message || 'Gagal memuat data laporan pembelian dari server'
    if (error.value) {
      toast.error(error.value)
    }
  } finally {
    loading.value = false
  }
}

// Filter apply & reset
function handleApplyFilters(newFilters: PurchaseReportFilterParams) {
  Object.assign(activeFilters, newFilters)
  fetchReport()
}

function handleResetFilters() {
  activeFilters.report_type = 'summary'
  activeFilters.date_from = ''
  activeFilters.date_to = ''
  activeFilters.supplier_id = undefined
  activeFilters.material_id = undefined
  activeFilters.warehouse_id = undefined
  activeFilters.status = 'ALL'
  activeFilters.payment_status = 'ALL'
  activeFilters.receipt_status = 'ALL'
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
  if (activeFilters.supplier_id) {
    const sup = filterOptions.value?.suppliers.find(s => s.id === activeFilters.supplier_id)
    if (sup) parts.push(`Supplier: ${sup.nama}`)
  }
  if (activeFilters.search) {
    parts.push(`Cari: "${activeFilters.search}"`)
  }
  return parts.join(' | ') || 'Semua Data'
}

async function handleExportExcel() {
  exportLoading.value = true
  try {
    // Fetch complete dataset across all pages for export accuracy
    const allData = await purchaseReportService.getAllReportData(activeFilters)
    exportPurchaseReportToExcel(
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
    const allData = await purchaseReportService.getAllReportData(activeFilters)
    exportPurchaseReportToPdf(
      activeFilters.report_type,
      allData,
      getFilterSummaryText(),
      summaryTotals.value
    )
    toast.success('File PDF berhasil dibuat dan diunduh.')
  } catch (err: any) {
    console.error('Export PDF failed:', err)
    toast.error('Gagal mengekspor file PDF.')
  } finally {
    exportLoading.value = false
  }
}

async function handlePrintPreview() {
  exportLoading.value = true
  try {
    const allData = await purchaseReportService.getAllReportData(activeFilters)
    printableItems.value = allData
    showPrintModal.value = true
  } catch (err: any) {
    console.error('Print preview failed:', err)
    toast.error('Gagal menyiapkan pratinjau cetak.')
  } finally {
    exportLoading.value = false
  }
}

onMounted(() => {
  loadFilterOptions()
  fetchReport()
})
</script>

<template>
  <div class="space-y-5 pb-10">
    <!-- Breadcrumb Navigation -->
    <nav class="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
      <router-link to="/dashboard" class="flex items-center gap-1 hover:text-slate-800 transition">
        <Home class="w-3.5 h-3.5 text-slate-400" />
        Dashboard
      </router-link>
      <ChevronRight class="w-3.5 h-3.5 text-slate-300" />
      <span class="text-slate-400">Laporan</span>
      <ChevronRight class="w-3.5 h-3.5 text-slate-300" />
      <span class="text-teal-700 font-semibold">Laporan Pembelian</span>
    </nav>

    <!-- Header Section with Action Toolbar -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">
          Laporan Pembelian
        </h1>
        <p class="text-xs text-slate-500 mt-1">
          Laporan dan rekapitulasi transaksi pembelian, penerimaan barang, serta tagihan supplier.
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center flex-wrap gap-2">
        <!-- Atur Kolom -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-lg shadow-xs transition"
          @click="showColumnModal = true"
        >
          <SlidersHorizontal class="w-3.5 h-3.5 text-slate-500" />
          Atur Kolom
        </button>

        <!-- Export Excel -->
        <button
          type="button"
          :disabled="exportLoading"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 rounded-lg shadow-xs disabled:opacity-50 transition"
          @click="handleExportExcel"
        >
          <FileSpreadsheet class="w-3.5 h-3.5 text-emerald-600" />
          Excel
        </button>

        <!-- Export PDF -->
        <button
          type="button"
          :disabled="exportLoading"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/80 rounded-lg shadow-xs disabled:opacity-50 transition"
          @click="handleExportPdf"
        >
          <FileText class="w-3.5 h-3.5 text-rose-600" />
          PDF
        </button>

        <!-- Cetak -->
        <button
          type="button"
          :disabled="exportLoading"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-lg shadow-xs disabled:opacity-50 transition"
          @click="handlePrintPreview"
        >
          <Printer class="w-3.5 h-3.5 text-slate-600" />
          Cetak
        </button>
      </div>
    </div>

    <!-- PARAMETER LAPORAN / FILTER -->
    <PurchaseReportFilter
      :initial-filters="activeFilters"
      :filter-options="filterOptions"
      :loading="loading"
      @apply="handleApplyFilters"
      @reset="handleResetFilters"
    />

    <!-- TABEL HASIL LAPORAN -->
    <PurchaseReportTable
      :report-type="activeFilters.report_type"
      :columns="currentColumns"
      :items="items"
      :pagination="pagination"
      :summary-totals="summaryTotals"
      :loading="loading"
      :error="error"
      :sort-by="activeFilters.sort_by"
      :sort-direction="activeFilters.sort_direction"
      @sort="handleSort"
      @page-change="handlePageChange"
      @per-page-change="handlePerPageChange"
      @retry="fetchReport"
    />

    <!-- MODAL ATUR KOLOM -->
    <PurchaseReportColumnModal
      :show="showColumnModal"
      :columns="currentColumns"
      @close="showColumnModal = false"
      @update="handleUpdateColumns"
      @reset="handleResetColumns"
    />

    <!-- MODAL PRINT PREVIEW -->
    <PurchaseReportPrintModal
      :show="showPrintModal"
      :report-type="activeFilters.report_type"
      :items="printableItems"
      :summary-totals="summaryTotals"
      :filter-info="getFilterSummaryText()"
      @close="showPrintModal = false"
    />
  </div>
</template>
