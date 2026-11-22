<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppDataTable from '@/shared/components/data/AppDataTable.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import StockAdjustmentStatusBadge from '../components/StockAdjustmentStatusBadge.vue'
import { stockAdjustmentService } from '../services/stock-adjustment.service'
import type {
  StockAdjustmentListItem,
  StockAdjustmentKpiSummary
} from '../types/stock-adjustment.types'
import type { TableColumn, TableSortState } from '@/shared/types/table.types'
import { usePermission } from '@/shared/composables/usePermission'
import { useToast } from '@/shared/composables/useToast'
import { formatDate, formatCurrency } from '@/shared/utils/formatters'
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
  Layers,
  CheckCircle2,
  Clock,
  Send,
  TrendingDown,
  TrendingUp
} from 'lucide-vue-next'

const router = useRouter()
const { hasPermission } = usePermission()
const toast = useToast()

const canCreate = computed(() => hasPermission('inventory', 'create'))
const canUpdate = computed(() => hasPermission('inventory', 'update'))
const canDelete = computed(() => hasPermission('inventory', 'delete'))

// Data table state
const items = ref<StockAdjustmentListItem[]>([])
const isLoading = ref(true)
const totalItems = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const sortBy = ref('id')
const sortOrder = ref<'asc' | 'desc'>('desc')

// Filter state
const filters = reactive({
  search: '',
  status: '' as string | number,
  startDate: '',
  endDate: ''
})

const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: '1', label: 'Selesai (Posted)' },
  { value: '0', label: 'Draft' }
]

// KPI state (dihitung dari database secara menyeluruh)
const kpiData = ref<StockAdjustmentKpiSummary>({
  total_penyesuaian: 0,
  total_posted: 0,
  total_draft: 0,
  net_selisih_qty: 0,
  total_item_bertambah: 0,
  total_item_berkurang: 0,
  total_item_cocok: 0,
  total_nilai_selisih: 0,
  selisih_per_satuan: []
})
const isKpiLoading = ref(false)

// Delete / Cancel Draft dialog state
const isDeleteDialogOpen = ref(false)
const deleteTarget = ref<StockAdjustmentListItem | null>(null)
const isDeleting = ref(false)

// Quick Posting modal state
const isPostDialogOpen = ref(false)
const postTarget = ref<StockAdjustmentListItem | null>(null)
const isPosting = ref(false)

const columns: TableColumn<StockAdjustmentListItem>[] = [
  {
    key: 'kode',
    label: 'Kode Penyesuaian',
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
    key: 'keterangan',
    label: 'Keterangan',
    sortable: true,
    minWidth: '200px'
  },
  {
    key: 'total_items',
    label: 'Jumlah Item',
    sortable: true,
    minWidth: '110px'
  },
  {
    key: 'net_selisih_qty',
    label: 'Net Selisih',
    sortable: true,
    minWidth: '110px'
  },
  {
    key: 'total_nilai_selisih',
    label: 'Nilai Selisih',
    sortable: true,
    minWidth: '130px'
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    minWidth: '110px'
  },
  {
    key: 'actions',
    label: 'Aksi',
    sortable: false,
    minWidth: '130px'
  }
]

async function loadKpi() {
  isKpiLoading.value = true
  try {
    const kpi = await stockAdjustmentService.getKpi({
      search: filters.search || undefined,
      status: filters.status === '' ? 'all' : filters.status,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined
    })
    kpiData.value = kpi
  } catch (err: unknown) {
    console.error('Failed to load KPI:', err)
  } finally {
    isKpiLoading.value = false
  }
}

async function loadData() {
  isLoading.value = true
  try {
    const res = await stockAdjustmentService.getAdjustments({
      search: filters.search || undefined,
      status: filters.status === '' ? 'all' : filters.status,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      page: currentPage.value,
      limit: pageSize.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    })
    items.value = res.data
    totalItems.value = res.total
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat daftar penyesuaian stok.'
    toast.error(message)
  } finally {
    isLoading.value = false
  }
}

function refreshAll() {
  loadData()
  loadKpi()
}

onMounted(() => {
  refreshAll()
})

function handleSearch() {
  currentPage.value = 1
  refreshAll()
}

function handleResetFilters() {
  filters.search = ''
  filters.status = ''
  filters.startDate = ''
  filters.endDate = ''
  currentPage.value = 1
  refreshAll()
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

function handleSort(sort: TableSortState) {
  sortBy.value = sort.key
  sortOrder.value = sort.direction
  loadData()
}

function handleViewDetail(item: StockAdjustmentListItem) {
  router.push(`/inventory/stock-adjustments/${item.id}`)
}

function handleEdit(item: StockAdjustmentListItem) {
  if (item.status === 1) {
    toast.warning('Dokumen yang sudah di-posting tidak dapat diedit langsung.')
    return
  }
  router.push(`/inventory/stock-adjustments/${item.id}/edit`)
}

function openPostDialog(item: StockAdjustmentListItem) {
  postTarget.value = item
  isPostDialogOpen.value = true
}

async function handleConfirmPost() {
  if (!postTarget.value) return
  isPosting.value = true
  try {
    await stockAdjustmentService.postAdjustment(postTarget.value.id)
    toast.success(`Dokumen ${postTarget.value.kode} berhasil di-posting dan saldo stok bahan telah diperbarui.`)
    isPostDialogOpen.value = false
    postTarget.value = null
    refreshAll()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal mem-posting penyesuaian stok.'
    toast.error(message)
  } finally {
    isPosting.value = false
  }
}

function openDeleteDialog(item: StockAdjustmentListItem) {
  if (item.status === 1) {
    toast.warning('Dokumen yang telah berstatus Selesai (Posted) tidak dapat dihapus.')
    return
  }
  deleteTarget.value = item
  isDeleteDialogOpen.value = true
}

async function handleConfirmDelete() {
  if (!deleteTarget.value) return
  isDeleting.value = true
  try {
    await stockAdjustmentService.deleteAdjustment(deleteTarget.value.id)
    toast.success(`Draft penyesuaian ${deleteTarget.value.kode} berhasil dibatalkan.`)
    isDeleteDialogOpen.value = false
    deleteTarget.value = null
    refreshAll()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menghapus draft penyesuaian stok.'
    toast.error(message)
  } finally {
    isDeleting.value = false
  }
}

async function handleExportExcel() {
  try {
    // Ambil data sesuai filter aktif tanpa pembatasan pagination
    const allFiltered = await stockAdjustmentService.getAdjustments({
      search: filters.search || undefined,
      status: filters.status === '' ? 'all' : filters.status,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      page: 1,
      limit: 1000,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    })

    if (allFiltered.data.length === 0) {
      toast.warning('Tidak ada data penyesuaian stok yang sesuai dengan filter untuk diekspor.')
      return
    }

    exportToExcel<StockAdjustmentListItem>({
      filename: `Penyesuaian_Stok_${new Date().toISOString().slice(0, 10)}`,
      title: 'LAPORAN PENYESUAIAN STOK BAHAN BAKU',
      columns: [
        { key: 'kode', label: 'Kode Penyesuaian' },
        { key: 'tanggal', label: 'Tanggal', formatter: val => formatDate(String(val)) },
        { key: 'keterangan', label: 'Keterangan', formatter: val => String(val || '-') },
        { key: 'total_items', label: 'Jumlah Item' },
        {
          key: 'net_selisih_qty',
          label: 'Net Selisih',
          formatter: val => (Number(val) > 0 ? `+${val}` : String(val))
        },
        {
          key: 'total_nilai_selisih',
          label: 'Nilai Selisih',
          formatter: val => formatCurrency(Number(val) || 0)
        },
        {
          key: 'status',
          label: 'Status',
          formatter: val => (Number(val) === 1 ? 'Selesai (Posted)' : 'Draft')
        }
      ],
      data: allFiltered.data
    })
    toast.success('Daftar penyesuaian stok berhasil diekspor ke Excel.')
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal mengekspor data ke Excel.'
    toast.error(message)
  }
}

async function handleExportPdf() {
  try {
    const allFiltered = await stockAdjustmentService.getAdjustments({
      search: filters.search || undefined,
      status: filters.status === '' ? 'all' : filters.status,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      page: 1,
      limit: 1000,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    })

    if (allFiltered.data.length === 0) {
      toast.warning('Tidak ada data penyesuaian stok yang sesuai dengan filter untuk diekspor.')
      return
    }

    exportToPdf<StockAdjustmentListItem>({
      filename: `Penyesuaian_Stok_${new Date().toISOString().slice(0, 10)}`,
      title: 'LAPORAN PENYESUAIAN STOK BAHAN BAKU',
      subtitle: 'Hasil Stock Opname & Koreksi Saldo Persediaan Bahan Baku',
      orientation: 'landscape',
      filterInfo: filters.search ? `Pencarian: "${filters.search}"` : undefined,
      columns: [
        { key: 'no', label: 'No' },
        { key: 'kode', label: 'Kode Penyesuaian' },
        { key: 'tanggal', label: 'Tanggal', formatter: val => formatDate(String(val)) },
        { key: 'keterangan', label: 'Keterangan', formatter: val => String(val || '-') },
        { key: 'total_items', label: 'Jumlah Item' },
        {
          key: 'net_selisih_qty',
          label: 'Net Selisih',
          formatter: val => (Number(val) > 0 ? `+${val}` : String(val))
        },
        {
          key: 'total_nilai_selisih',
          label: 'Nilai Selisih',
          formatter: val => formatCurrency(Number(val) || 0)
        },
        {
          key: 'status',
          label: 'Status',
          formatter: val => (Number(val) === 1 ? 'Selesai' : 'Draft')
        }
      ],
      data: allFiltered.data
    })
    toast.success('Daftar penyesuaian stok berhasil diekspor ke PDF.')
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal mengekspor data ke PDF.'
    toast.error(message)
  }
}

function handlePrint() {
  window.print()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <AppPageHeader
      title="Penyesuaian Stok Bahan"
      subtitle="Stock Opname & Koreksi Saldo Stok Bahan Baku."
      :breadcrumbs="[
        { label: 'Persediaan', to: '/inventory/materials' },
        { label: 'Penyesuaian Stok Bahan' }
      ]"
    >
      <template #actions>
        <div class="flex items-center gap-2">
          <!-- Export Excel -->
          <AppButton
            variant="outline"
            size="sm"
            class="text-slate-700 border-slate-300 hover:bg-slate-50"
            @click="handleExportExcel"
          >
            <FileSpreadsheet class="w-4 h-4 mr-1.5 text-emerald-600" />
            Export Excel
          </AppButton>

          <!-- Export PDF -->
          <AppButton
            variant="outline"
            size="sm"
            class="text-slate-700 border-slate-300 hover:bg-slate-50"
            @click="handleExportPdf"
          >
            <FileText class="w-4 h-4 mr-1.5 text-rose-600" />
            Export PDF
          </AppButton>

          <!-- Print -->
          <AppButton
            variant="outline"
            size="sm"
            class="text-slate-700 border-slate-300 hover:bg-slate-50"
            @click="handlePrint"
          >
            <Printer class="w-4 h-4 mr-1.5 text-slate-600" />
            Cetak
          </AppButton>

          <!-- Add Button -->
          <AppButton
            v-if="canCreate"
            variant="primary"
            size="sm"
            class="bg-teal-600 hover:bg-teal-700 text-white font-medium"
            @click="router.push('/inventory/stock-adjustments/create')"
          >
            <Plus class="w-4 h-4 mr-1.5" />
            Tambah Penyesuaian
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <!-- KPI Cards (Data Asli Database Berdasarkan Filter Aktif) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- 1. Total Penyesuaian -->
      <div class="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex items-center gap-4">
        <div class="p-3 bg-teal-50 rounded-lg text-teal-600">
          <Layers class="w-6 h-6" />
        </div>
        <div>
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total Penyesuaian
          </p>
          <p class="text-xl font-bold text-slate-800">
            {{ isKpiLoading ? '...' : kpiData.total_penyesuaian }}
          </p>
        </div>
      </div>

      <!-- 2. Selesai (Posted) -->
      <div class="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex items-center gap-4">
        <div class="p-3 bg-emerald-50 rounded-lg text-emerald-600">
          <CheckCircle2 class="w-6 h-6" />
        </div>
        <div>
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Selesai (Posted)
          </p>
          <p class="text-xl font-bold text-emerald-700">
            {{ isKpiLoading ? '...' : kpiData.total_posted }}
          </p>
        </div>
      </div>

      <!-- 3. Draft -->
      <div class="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex items-center gap-4">
        <div class="p-3 bg-amber-50 rounded-lg text-amber-600">
          <Clock class="w-6 h-6" />
        </div>
        <div>
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Draft</p>
          <p class="text-xl font-bold text-amber-600">
            {{ isKpiLoading ? '...' : kpiData.total_draft }}
          </p>
        </div>
      </div>

      <!-- 4. Net Selisih Qty & Rincian Satuan -->
      <div class="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex items-center gap-4">
        <div
          :class="[
            'p-3 rounded-lg',
            kpiData.net_selisih_qty >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          ]"
        >
          <component :is="kpiData.net_selisih_qty >= 0 ? TrendingUp : TrendingDown" class="w-6 h-6" />
        </div>
        <div class="min-w-0">
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Net Selisih Qty</p>
          <div class="flex items-baseline gap-1.5 flex-wrap">
            <span
              :class="[
                'text-lg font-bold font-mono',
                kpiData.net_selisih_qty >= 0 ? 'text-emerald-700' : 'text-rose-700'
              ]"
            >
              {{ isKpiLoading ? '...' : (kpiData.net_selisih_qty > 0 ? `+${kpiData.net_selisih_qty}` : kpiData.net_selisih_qty) }}
            </span>
            <span class="text-[11px] text-slate-500">
              ({{ kpiData.total_item_bertambah }} bertambah, {{ kpiData.total_item_berkurang }} berkurang)
            </span>
          </div>
          <!-- Ringkasan per satuan agar tidak menyesatkan -->
          <div v-if="kpiData.selisih_per_satuan && kpiData.selisih_per_satuan.length > 0" class="mt-1 flex flex-wrap gap-1">
            <span
              v-for="s in kpiData.selisih_per_satuan.slice(0, 3)"
              :key="s.satuan"
              class="inline-block text-[10px] px-1.5 py-0.2 bg-slate-100 rounded text-slate-600 font-mono"
            >
              {{ s.satuan }}: {{ s.net_selisih > 0 ? `+${s.net_selisih}` : s.net_selisih }}
            </span>
            <span v-if="kpiData.selisih_per_satuan.length > 3" class="text-[10px] text-slate-400">
              +{{ kpiData.selisih_per_satuan.length - 3 }} lainnya
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <!-- Search -->
        <div class="lg:col-span-2 relative">
          <label class="block text-xs font-medium text-slate-700 mb-1">Pencarian</label>
          <div class="relative">
            <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              v-model="filters.search"
              type="text"
              placeholder="Cari kode atau keterangan..."
              class="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
              @keydown.enter="handleSearch"
            />
          </div>
        </div>

        <!-- Status -->
        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1">Status</label>
          <AppSelect
            v-model="filters.status"
            :options="statusOptions"
            placeholder="Semua Status"
            class="text-xs"
            @change="handleSearch"
          />
        </div>

        <!-- Tanggal Mulai -->
        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1">Tanggal Mulai</label>
          <input
            v-model="filters.startDate"
            type="date"
            class="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
            @change="handleSearch"
          />
        </div>

        <!-- Tanggal Akhir -->
        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1">Tanggal Akhir</label>
          <input
            v-model="filters.endDate"
            type="date"
            class="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
            @change="handleSearch"
          />
        </div>
      </div>

      <div class="mt-3 flex items-center justify-end gap-2">
        <AppButton
          variant="outline"
          size="sm"
          class="text-xs text-slate-600 border-slate-200 hover:bg-slate-50"
          @click="handleResetFilters"
        >
          <RefreshCw class="w-3.5 h-3.5 mr-1" />
          Reset Filter
        </AppButton>
        <AppButton
          variant="primary"
          size="sm"
          class="text-xs bg-teal-600 hover:bg-teal-700 text-white"
          @click="handleSearch"
        >
          Terapkan Filter
        </AppButton>
      </div>
    </div>

    <!-- Data Table -->
    <div class="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <AppDataTable
        :columns="columns"
        :data="items"
        :loading="isLoading"
        :total="totalItems"
        :page="currentPage"
        :per-page="pageSize"
        @update:page="handlePageChange"
        @update:per-page="handlePageSizeChange"
        @sort="handleSort"
      >
        <!-- Column: Kode -->
        <template #cell-kode="{ row }">
          <button
            type="button"
            class="font-mono text-xs font-bold text-teal-700 hover:underline hover:text-teal-800"
            @click="handleViewDetail(row)"
          >
            {{ row.kode }}
          </button>
        </template>

        <!-- Column: Tanggal -->
        <template #cell-tanggal="{ row }">
          <span class="text-xs text-slate-700">{{ formatDate(row.tanggal) }}</span>
        </template>

        <!-- Column: Keterangan -->
        <template #cell-keterangan="{ row }">
          <span class="text-xs text-slate-600 line-clamp-1" :title="row.keterangan || '-'">
            {{ row.keterangan || '-' }}
          </span>
        </template>

        <!-- Column: Jml Item -->
        <template #cell-total_items="{ row }">
          <span class="text-xs font-mono font-medium text-slate-700">
            {{ row.total_items }} item
          </span>
        </template>

        <!-- Column: Net Selisih Qty -->
        <template #cell-net_selisih_qty="{ row }">
          <span
            :class="[
              'inline-block px-1.5 py-0.5 rounded text-[11px] font-mono font-bold',
              row.net_selisih_qty > 0
                ? 'text-emerald-700 bg-emerald-50'
                : row.net_selisih_qty < 0
                  ? 'text-rose-700 bg-rose-50'
                  : 'text-slate-600 bg-slate-100'
            ]"
          >
            {{ row.net_selisih_qty > 0 ? `+${row.net_selisih_qty}` : row.net_selisih_qty }}
          </span>
        </template>

        <!-- Column: Nilai Selisih -->
        <template #cell-total_nilai_selisih="{ row }">
          <span
            :class="[
              'text-xs font-mono font-medium',
              row.total_nilai_selisih > 0
                ? 'text-emerald-700'
                : row.total_nilai_selisih < 0
                  ? 'text-rose-700'
                  : 'text-slate-500'
            ]"
          >
            {{ formatCurrency(row.total_nilai_selisih) }}
          </span>
        </template>

        <!-- Column: Status -->
        <template #cell-status="{ row }">
          <StockAdjustmentStatusBadge :status="row.status" size="sm" />
        </template>

        <!-- Column: Actions (Per Rule: Draft -> Lihat, Edit, Posting, Hapus; Posted -> Lihat, Cetak, Export) -->
        <template #cell-actions="{ row }">
          <div class="flex items-center gap-1">
            <!-- Lihat: Semua status -->
            <button
              type="button"
              class="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded transition-colors"
              title="Lihat Detail Dokumen"
              @click="handleViewDetail(row)"
            >
              <Eye class="w-4 h-4" />
            </button>

            <!-- Aksi KHUSUS DRAFT (status === 0) -->
            <template v-if="row.status === 0">
              <!-- Posting Sekarang -->
              <button
                v-if="canUpdate"
                type="button"
                class="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                title="Posting Penyesuaian Stok Sekarang"
                @click="openPostDialog(row)"
              >
                <Send class="w-4 h-4" />
              </button>

              <!-- Edit Draft -->
              <button
                v-if="canUpdate"
                type="button"
                class="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors"
                title="Edit Draft Penyesuaian"
                @click="handleEdit(row)"
              >
                <Edit2 class="w-4 h-4" />
              </button>

              <!-- Hapus/Batalkan Draft -->
              <button
                v-if="canDelete"
                type="button"
                class="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                title="Hapus Draft Dokumen"
                @click="openDeleteDialog(row)"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </template>

            <!-- Aksi KHUSUS POSTED (status === 1): Cetak / Export Berita Acara -->
            <template v-else>
              <button
                type="button"
                class="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                title="Cetak Berita Acara"
                @click="handleViewDetail(row)"
              >
                <Printer class="w-4 h-4" />
              </button>
            </template>
          </div>
        </template>
      </AppDataTable>
    </div>

    <!-- Confirm Delete Draft Dialog -->
    <AppConfirmDialog
      v-model="isDeleteDialogOpen"
      title="Hapus Draft Penyesuaian Stok"
      :message="`Apakah Anda yakin ingin membatalkan dan menghapus draft penyesuaian '${deleteTarget?.kode}'? Tindakan ini tidak dapat dikembalikan.`"
      confirm-text="Ya, Hapus Draft"
      variant="danger"
      @confirm="handleConfirmDelete"
    />

    <!-- Quick Posting Confirmation Dialog -->
    <AppConfirmDialog
      v-model="isPostDialogOpen"
      title="Konfirmasi Posting Penyesuaian Stok"
      :message="`Posting dokumen '${postTarget?.kode}' akan langsung memperbarui saldo stok bahan di gudang dan mencatat histori stok. Dokumen tidak dapat diedit langsung setelah selesai diposting. Lanjutkan?`"
      confirm-text="Konfirmasi & Posting Stok"
      variant="warning"
      @confirm="handleConfirmPost"
    />
  </div>
</template>
