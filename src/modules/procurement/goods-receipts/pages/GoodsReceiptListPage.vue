<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppDataTable from '@/shared/components/data/AppDataTable.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import GoodsReceiptStatusBadge from '../components/GoodsReceiptStatusBadge.vue'
import { goodsReceiptService } from '../services/goods-receipt.service'
import type { GoodsReceiptListItem, GoodsReceiptFilters } from '../types/goods-receipt.types'
import type { TableColumn, TableSortState } from '@/shared/types/table.types'
import { usePermission } from '@/shared/composables/usePermission'
import { useToast } from '@/shared/composables/useToast'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import { exportToExcel } from '@/shared/utils/excel-export'
import { exportToPdf } from '@/shared/utils/pdf-export'
import {
  Plus,
  Search,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Printer,
  Eye,
  Edit2,
  Trash2,
  RotateCcw,
  CheckCircle
} from 'lucide-vue-next'

const router = useRouter()
const { hasPermission } = usePermission()
const toast = useToast()

const canCreate = computed(() => hasPermission('procurement', 'create'))
const canUpdate = computed(() => hasPermission('procurement', 'update'))
const canDelete = computed(() => hasPermission('procurement', 'delete'))

// Data table state
const items = ref<GoodsReceiptListItem[]>([])
const selectedRows = ref<GoodsReceiptListItem[]>([])
const isLoading = ref(true)
const totalItems = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const sortBy = ref('tanggal')
const sortOrder = ref<'asc' | 'desc'>('desc')

// Filter state
const filters = reactive({
  search: '',
  suplier_id: '' as string | number,
  gudang_id: '' as string | number,
  status: '' as string | number,
  startDate: '',
  endDate: ''
})

// Options for dropdowns
const supplierOptions = ref<Array<{ value: number; label: string }>>([])
const warehouseOptions = ref<Array<{ value: number; label: string }>>([])

// Delete dialog state
const isDeleteDialogOpen = ref(false)
const deleteTarget = ref<GoodsReceiptListItem | null>(null)
const isDeleting = ref(false)

// Columns configuration
const columns: TableColumn<GoodsReceiptListItem>[] = [
  {
    key: 'kode',
    label: 'Kode PB',
    sortable: true,
    minWidth: '150px'
  },
  {
    key: 'tanggal',
    label: 'Tanggal',
    sortable: true,
    minWidth: '110px'
  },
  {
    key: 'kode_po',
    label: 'No. PO',
    sortable: true,
    minWidth: '150px'
  },
  {
    key: 'nama_suplier',
    label: 'Supplier',
    sortable: true,
    minWidth: '180px'
  },
  {
    key: 'no_surat_jalan',
    label: 'No Surat Jalan',
    sortable: true,
    minWidth: '140px'
  },
  {
    key: 'nama_gudang',
    label: 'Gudang',
    sortable: true,
    minWidth: '140px'
  },
  {
    key: 'nama_pengirim',
    label: 'Pengirim',
    sortable: true,
    minWidth: '140px'
  },
  {
    key: 'nilai_pb',
    label: 'Nilai PB',
    sortable: true,
    align: 'right',
    minWidth: '130px'
  },
  {
    key: 'total',
    label: 'Total Akhir',
    sortable: true,
    align: 'right',
    minWidth: '130px'
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    align: 'center',
    minWidth: '100px'
  }
]

onMounted(async () => {
  await Promise.all([loadDropdownOptions(), loadData()])
})

async function loadDropdownOptions() {
  try {
    const [sups, whs] = await Promise.all([
      goodsReceiptService.getSuppliers(),
      goodsReceiptService.getWarehouses()
    ])
    supplierOptions.value = sups.map(s => ({ value: s.id, label: s.nama }))
    warehouseOptions.value = whs.map(w => ({ value: w.id, label: w.nama || '' }))
  } catch (err) {
    console.error('Failed to load filter lookups:', err)
  }
}

async function loadData() {
  isLoading.value = true
  try {
    const query: GoodsReceiptFilters = {
      page: currentPage.value,
      pageSize: pageSize.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
      search: filters.search,
      suplier_id: filters.suplier_id,
      gudang_id: filters.gudang_id,
      status: filters.status,
      startDate: filters.startDate,
      endDate: filters.endDate
    }

    const res = await goodsReceiptService.list(query)
    items.value = res.data
    totalItems.value = res.total
  } catch (err: unknown) {
    toast.error((err as Error).message || 'Gagal memuat data Penerimaan Barang.')
  } finally {
    isLoading.value = false
  }
}

function handleSort(sortState: TableSortState) {
  sortBy.value = sortState.key
  sortOrder.value = sortState.direction
  currentPage.value = 1
  loadData()
}

function handlePageChange(page: number) {
  currentPage.value = page
  loadData()
}

function handlePageSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1
  loadData()
}

function resetFilters() {
  filters.search = ''
  filters.suplier_id = ''
  filters.gudang_id = ''
  filters.status = ''
  filters.startDate = ''
  filters.endDate = ''
  currentPage.value = 1
  loadData()
}

function navigateToCreate() {
  router.push('/procurement/goods-receipts/create')
}

function navigateToDetail(item: GoodsReceiptListItem) {
  router.push(`/procurement/goods-receipts/${item.id}`)
}

function navigateToEdit(item: GoodsReceiptListItem) {
  router.push(`/procurement/goods-receipts/${item.id}/edit`)
}

function confirmDelete(item: GoodsReceiptListItem) {
  deleteTarget.value = item
  isDeleteDialogOpen.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  isDeleting.value = true
  try {
    await goodsReceiptService.delete(deleteTarget.value.id)
    toast.success(`Penerimaan Barang ${deleteTarget.value.kode} berhasil dibatalkan.`)
    isDeleteDialogOpen.value = false
    deleteTarget.value = null
    loadData()
  } catch (err: unknown) {
    toast.error((err as Error).message || 'Gagal menghapus Penerimaan Barang.')
  } finally {
    isDeleting.value = false
  }
}

// Finalize dialog state
const isFinalizeDialogOpen = ref(false)
const finalizeTarget = ref<GoodsReceiptListItem | null>(null)
const isFinalizing = ref(false)

function confirmFinalize(item: GoodsReceiptListItem) {
  finalizeTarget.value = item
  isFinalizeDialogOpen.value = true
}

async function handleFinalize() {
  if (!finalizeTarget.value) return
  isFinalizing.value = true
  try {
    await goodsReceiptService.finalize(finalizeTarget.value.id)
    toast.success(`Penerimaan Barang ${finalizeTarget.value.kode} berhasil difinalisasi dan stok telah diposting.`)
    isFinalizeDialogOpen.value = false
    finalizeTarget.value = null
    loadData()
  } catch (err: unknown) {
    toast.error((err as Error).message || 'Gagal memfinalisasi Penerimaan Barang.')
  } finally {
    isFinalizing.value = false
  }
}

// Export actions
async function handleExportExcel() {
  try {
    toast.info('Menyiapkan ekspor Excel...')
    const query: GoodsReceiptFilters = {
      page: 1,
      pageSize: 1000,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
      search: filters.search,
      suplier_id: filters.suplier_id,
      gudang_id: filters.gudang_id,
      status: filters.status,
      startDate: filters.startDate,
      endDate: filters.endDate
    }

    const res = await goodsReceiptService.list(query)
    const exportData = res.data.map((item, idx) => ({
      no: idx + 1,
      kode: item.kode,
      tanggal: item.tanggal,
      kode_po: item.kode_po,
      supplier: item.nama_suplier,
      no_surat_jalan: item.no_surat_jalan,
      gudang: item.nama_gudang,
      pengirim: item.nama_pengirim,
      nilai_pb: item.nilai_pb,
      total: item.total,
      status: item.status_label
    }))

    const dateStr = new Date().toISOString().slice(0, 10)
    exportToExcel({
      title: 'DAFTAR PENERIMAAN BARANG',
      filename: `Laporan-Penerimaan-Barang-${dateStr}`,
      columns: [
        { label: 'No', key: 'no', width: 6 },
        { label: 'Kode PB', key: 'kode', width: 20 },
        { label: 'Tanggal', key: 'tanggal', width: 14 },
        { label: 'No. PO', key: 'kode_po', width: 20 },
        { label: 'Supplier', key: 'supplier', width: 25 },
        { label: 'No Surat Jalan', key: 'no_surat_jalan', width: 20 },
        { label: 'Gudang', key: 'gudang', width: 20 },
        { label: 'Pengirim', key: 'pengirim', width: 20 },
        { label: 'Nilai PB', key: 'nilai_pb', width: 18 },
        { label: 'Total Akhir', key: 'total', width: 18 },
        { label: 'Status', key: 'status', width: 14 }
      ],
      data: exportData
    })
    toast.success('File Excel berhasil diunduh.')
  } catch (err: unknown) {
    toast.error((err as Error).message || 'Gagal mengekspor data Excel.')
  }
}

async function handleExportPdf() {
  try {
    toast.info('Menyiapkan file PDF...')
    const query: GoodsReceiptFilters = {
      page: 1,
      pageSize: 1000,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
      search: filters.search,
      suplier_id: filters.suplier_id,
      gudang_id: filters.gudang_id,
      status: filters.status,
      startDate: filters.startDate,
      endDate: filters.endDate
    }

    const res = await goodsReceiptService.list(query)
    const exportData = res.data.map((item, idx) => ({
      no: idx + 1,
      kode: item.kode,
      tanggal: item.tanggal,
      kode_po: item.kode_po,
      supplier: item.nama_suplier,
      no_surat_jalan: item.no_surat_jalan,
      gudang: item.nama_gudang,
      nilai_pb: formatCurrency(item.nilai_pb),
      total: formatCurrency(item.total),
      status: item.status_label
    }))

    const dateStr = new Date().toISOString().slice(0, 10)
    exportToPdf({
      title: 'LAPORAN PENERIMAAN BARANG',
      filename: `Laporan-Penerimaan-Barang-${dateStr}.pdf`,
      columns: [
        { label: 'No', key: 'no' },
        { label: 'Kode PB', key: 'kode' },
        { label: 'Tanggal', key: 'tanggal' },
        { label: 'No PO', key: 'kode_po' },
        { label: 'Supplier', key: 'supplier' },
        { label: 'No SJ', key: 'no_surat_jalan' },
        { label: 'Gudang', key: 'gudang' },
        { label: 'Nilai PB', key: 'nilai_pb' },
        { label: 'Total', key: 'total' },
        { label: 'Status', key: 'status' }
      ],
      data: exportData
    })
    toast.success('File PDF berhasil dibuat.')
  } catch (err: unknown) {
    toast.error((err as Error).message || 'Gagal membuat file PDF.')
  }
}

function handlePrint() {
  window.print()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header & Action Buttons -->
    <AppPageHeader
      title="Penerimaan Barang"
      description="Kelola verifikasi penerimaan fisik bahan baku dari Purchase Order ke gudang penyimpanan."
      :breadcrumbs="[
        { label: 'Home', to: '/dashboard' },
        { label: 'Pengadaan', to: '/procurement/purchase-orders' },
        { label: 'Penerimaan Barang' }
      ]"
    >
      <template #actions>
        <div class="flex flex-wrap items-center gap-2">
          <!-- Tambah Penerimaan Barang -->
          <AppButton v-if="canCreate" variant="primary" size="md" @click="navigateToCreate">
            <Plus class="w-4 h-4 mr-1.5" />
            <span>Tambah Penerimaan</span>
          </AppButton>

          <!-- Export Excel -->
          <AppButton variant="outline" size="md" @click="handleExportExcel">
            <FileSpreadsheet class="w-4 h-4 mr-1.5 text-emerald-600" />
            <span>Ekspor Excel</span>
          </AppButton>

          <!-- Export PDF -->
          <AppButton variant="outline" size="md" @click="handleExportPdf">
            <FileText class="w-4 h-4 mr-1.5 text-rose-600" />
            <span>Ekspor PDF</span>
          </AppButton>

          <!-- Print -->
          <AppButton variant="outline" size="md" title="Cetak Daftar" @click="handlePrint">
            <Printer class="w-4 h-4 text-slate-600" />
          </AppButton>

          <!-- Refresh -->
          <AppButton variant="outline" size="md" title="Refresh Data" @click="loadData">
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <!-- Filters Section Card -->
    <div class="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-3">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <!-- Search Input -->
        <div class="lg:col-span-2">
          <label
            class="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1"
          >
            Pencarian
          </label>
          <div class="relative">
            <Search class="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              v-model="filters.search"
              type="text"
              placeholder="Cari Kode PB, No PO, No SJ, Pengirim..."
              class="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none"
              @keyup.enter="loadData"
            />
          </div>
        </div>

        <!-- Supplier Filter -->
        <div>
          <label
            class="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1"
          >
            Supplier
          </label>
          <AppSelect
            v-model="filters.suplier_id"
            :options="[{ value: '', label: 'Semua Supplier' }, ...supplierOptions]"
            @change="loadData"
          />
        </div>

        <!-- Warehouse Filter -->
        <div>
          <label
            class="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1"
          >
            Gudang
          </label>
          <AppSelect
            v-model="filters.gudang_id"
            :options="[{ value: '', label: 'Semua Gudang' }, ...warehouseOptions]"
            @change="loadData"
          />
        </div>

        <!-- Status Filter -->
        <div>
          <label
            class="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1"
          >
            Status
          </label>
          <AppSelect
            v-model="filters.status"
            :options="[
              { value: '', label: 'Semua Status' },
              { value: 1, label: 'Diterima' },
              { value: 0, label: 'Draft' }
            ]"
            @change="loadData"
          />
        </div>

        <!-- Reset Button -->
        <div class="flex items-end">
          <AppButton
            variant="ghost"
            size="sm"
            class="w-full text-slate-600 hover:text-slate-900 border border-slate-200"
            @click="resetFilters"
          >
            <RotateCcw class="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            <span>Reset Filter</span>
          </AppButton>
        </div>
      </div>

      <!-- Date Range Row -->
      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100"
      >
        <div>
          <label
            class="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1"
          >
            Mulai Tanggal
          </label>
          <input
            v-model="filters.startDate"
            type="date"
            class="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none"
            @change="loadData"
          />
        </div>
        <div>
          <label
            class="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1"
          >
            Sampai Tanggal
          </label>
          <input
            v-model="filters.endDate"
            type="date"
            class="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none"
            @change="loadData"
          />
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <AppDataTable
      v-model:selected-rows="selectedRows"
      :data="items"
      :columns="columns"
      :loading="isLoading"
      :total-items="totalItems"
      :current-page="currentPage"
      :page-size="pageSize"
      :sort-by="sortBy"
      :sort-order="sortOrder"
      :selectable="true"
      :sortable="true"
      :client-sort="false"
      :paginated="true"
      :client-pagination="false"
      @sort="handleSort"
      @update:current-page="handlePageChange"
      @update:page-size="handlePageSizeChange"
    >
      <!-- Cell: Kode PB -->
      <template #cell-kode="{ row }">
        <div
          class="font-medium font-mono text-teal-700 cursor-pointer hover:underline"
          @click="navigateToDetail(row)"
        >
          {{ row.kode }}
        </div>
      </template>

      <!-- Cell: Tanggal -->
      <template #cell-tanggal="{ row }">
        <span class="text-slate-600">{{ formatDate(row.tanggal) }}</span>
      </template>

      <!-- Cell: Kode PO -->
      <template #cell-kode_po="{ row }">
        <span class="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
          {{ row.kode_po }}
        </span>
      </template>

      <!-- Cell: Nilai PB -->
      <template #cell-nilai_pb="{ row }">
        <span class="font-mono font-medium text-slate-700">
          {{ formatCurrency(row.nilai_pb) }}
        </span>
      </template>

      <!-- Cell: Total -->
      <template #cell-total="{ row }">
        <span class="font-mono font-bold text-teal-800">
          {{ formatCurrency(row.total) }}
        </span>
      </template>

      <!-- Cell: Status Dokumen -->
      <template #cell-status="{ row }">
        <GoodsReceiptStatusBadge type="status" :status="row.status" />
      </template>

      <!-- Actions -->
      <template #actions="{ row }">
        <div class="flex items-center justify-end gap-1">
          <!-- Finalize (Only for Draft status 0) -->
          <button
            v-if="canUpdate && row.status === 0"
            type="button"
            class="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-colors"
            title="Finalisasi Penerimaan (Posting Stok & Jurnal)"
            @click="confirmFinalize(row)"
          >
            <CheckCircle class="w-3.5 h-3.5" />
          </button>

          <!-- Detail -->
          <button
            type="button"
            class="p-1 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded transition-colors"
            title="Lihat Detail Penerimaan"
            @click="navigateToDetail(row)"
          >
            <Eye class="w-3.5 h-3.5" />
          </button>

          <!-- Edit -->
          <button
            v-if="canUpdate"
            type="button"
            class="p-1 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            :disabled="row.status === 1"
            :title="row.status === 1 ? 'Dokumen sudah Succeeded (Diterima Final) dan tidak dapat diedit' : 'Edit Penerimaan Barang'"
            @click="navigateToEdit(row)"
          >
            <Edit2 class="w-3.5 h-3.5" />
          </button>

          <!-- Delete / Cancel -->
          <button
            v-if="canDelete"
            type="button"
            class="p-1 text-slate-500 hover:text-rose-700 hover:bg-slate-100 rounded transition-colors"
            title="Batalkan Penerimaan Barang"
            @click="confirmDelete(row)"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </template>
    </AppDataTable>

    <!-- Delete / Cancel Confirmation Dialog -->
    <AppConfirmDialog
      v-model="isDeleteDialogOpen"
      title="Batalkan Penerimaan Barang"
      :message="`Apakah Anda yakin ingin membatalkan dokumen Penerimaan Barang ${deleteTarget?.kode}?`"
      confirm-text="Ya, Batalkan"
      cancel-text="Batal"
      variant="danger"
      :is-loading="isDeleting"
      @confirm="handleDelete"
      @cancel="isDeleteDialogOpen = false"
    />

    <!-- Finalize Confirmation Dialog -->
    <AppConfirmDialog
      v-model="isFinalizeDialogOpen"
      title="Finalisasi Penerimaan Barang"
      :message="`Apakah Anda yakin ingin memfinalisasi dokumen Penerimaan Barang ${finalizeTarget?.kode}? Stok fisik akan langsung diposting ke gudang dan jurnal umum akan dicatat otomatis. Dokumen yang sudah difinalisasi tidak dapat diedit kembali.`"
      confirm-text="Ya, Finalisasi Dokumen"
      cancel-text="Batal"
      variant="primary"
      @confirm="handleFinalize"
      @cancel="isFinalizeDialogOpen = false"
    />
  </div>
</template>
