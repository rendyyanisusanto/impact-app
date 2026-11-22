<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppDataTable from '@/shared/components/data/AppDataTable.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import MaterialMutationStatusBadge from '../components/MaterialMutationStatusBadge.vue'
import { materialMutationService } from '../services/material-mutation.service'
import type { MaterialMutationListItem, MaterialMutationKpiSummary } from '../types/material-mutation.types'
import type { TableColumn, TableSortState } from '@/shared/types/table.types'
import { usePermission } from '@/shared/composables/usePermission'
import { useToast } from '@/shared/composables/useToast'
import { formatDate, formatNumber } from '@/shared/utils/formatters'
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
  Package,
  Layers,
  CheckCircle2,
  Clock
} from 'lucide-vue-next'

const router = useRouter()
const { hasPermission } = usePermission()
const toast = useToast()

const canCreate = computed(() => hasPermission('inventory', 'create'))
const canUpdate = computed(() => hasPermission('inventory', 'update'))
const canDelete = computed(() => hasPermission('inventory', 'delete'))

// Data table state
const items = ref<MaterialMutationListItem[]>([])
const selectedRows = ref<MaterialMutationListItem[]>([])
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

// Delete dialog state
const isDeleteDialogOpen = ref(false)
const deleteTarget = ref<MaterialMutationListItem | null>(null)
const isDeleting = ref(false)

const columns: TableColumn<MaterialMutationListItem>[] = [
  {
    key: 'kode',
    label: 'Kode Mutasi',
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
    minWidth: '220px'
  },
  {
    key: 'total_items',
    label: 'Jml Item',
    sortable: true,
    minWidth: '95px'
  },
  {
    key: 'total_qty',
    label: 'Total Qty',
    sortable: true,
    minWidth: '100px'
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    minWidth: '110px'
  },
  {
    key: 'created_by_name',
    label: 'Dibuat Oleh',
    sortable: true,
    minWidth: '130px'
  },
  {
    key: 'actions',
    label: 'Aksi',
    sortable: false,
    minWidth: '120px'
  }
]

// KPI state from database / service
const kpiData = ref<MaterialMutationKpiSummary>({
  total_mutasi: 0,
  total_posted: 0,
  total_draft: 0,
  total_qty_dimutasi: 0,
  total_nilai_dimutasi: 0,
  mutasi_per_satuan: []
})

const totalMutasiCount = computed(() => kpiData.value.total_mutasi || totalItems.value)
const postedCount = computed(() => kpiData.value.total_posted)
const draftCount = computed(() => kpiData.value.total_draft)
const totalQtySum = computed(() => kpiData.value.total_qty_dimutasi)

async function loadData() {
  isLoading.value = true
  try {
    const filterParam = {
      search: filters.search,
      status: filters.status !== '' ? Number(filters.status) : 'all',
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined
    }

    const [res, kpiRes] = await Promise.all([
      materialMutationService.getMutations({
        page: currentPage.value,
        limit: pageSize.value,
        sortBy: sortBy.value,
        sortOrder: sortOrder.value,
        ...filterParam
      }),
      materialMutationService.getKpi(filterParam)
    ])

    items.value = res.data
    totalItems.value = res.total
    if (kpiRes) {
      kpiData.value = kpiRes
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat data mutasi bahan.'
    toast.error(message)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

function handleSearch() {
  currentPage.value = 1
  loadData()
}

function handleResetFilters() {
  filters.search = ''
  filters.status = ''
  filters.startDate = ''
  filters.endDate = ''
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

function handleSortChange(sort: TableSortState) {
  sortBy.value = sort.key
  sortOrder.value = sort.direction || 'asc'
  loadData()
}

function handleCreate() {
  router.push('/inventory/material-mutations/create')
}

function handleView(item: MaterialMutationListItem) {
  router.push(`/inventory/material-mutations/${item.id}`)
}

function handleEdit(item: MaterialMutationListItem) {
  router.push(`/inventory/material-mutations/${item.id}/edit`)
}

function confirmDelete(item: MaterialMutationListItem) {
  deleteTarget.value = item
  isDeleteDialogOpen.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  isDeleting.value = true
  try {
    const targetId = deleteTarget.value.id
    const targetKode = deleteTarget.value.kode
    await materialMutationService.deleteMutation(targetId)
    toast.success(`Mutasi bahan ${targetKode} berhasil dihapus/dibatalkan.`)
    isDeleteDialogOpen.value = false
    deleteTarget.value = null
    loadData()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menghapus mutasi bahan.'
    toast.error(message)
  } finally {
    isDeleting.value = false
  }
}

function handleExportExcel() {
  if (items.value.length === 0) {
    toast.warning('Tidak ada data untuk diekspor.')
    return
  }

  exportToExcel<MaterialMutationListItem>({
    filename: `Mutasi_Bahan_${new Date().toISOString().slice(0, 10)}`,
    title: 'LAPORAN MUTASI BAHAN',
    columns: [
      { key: 'kode', label: 'Kode Mutasi' },
      { key: 'tanggal', label: 'Tanggal', formatter: val => formatDate(String(val)) },
      { key: 'keterangan', label: 'Keterangan' },
      { key: 'total_items', label: 'Jumlah Item' },
      { key: 'total_qty', label: 'Total Qty' },
      {
        key: 'status',
        label: 'Status',
        formatter: val => (Number(val) === 1 ? 'Selesai' : 'Draft')
      },
      { key: 'created_by_name', label: 'Dibuat Oleh' }
    ],
    data: items.value
  })

  toast.success('File Excel berhasil diunduh.')
}

function handleExportPdf() {
  if (items.value.length === 0) {
    toast.warning('Tidak ada data untuk diekspor.')
    return
  }

  exportToPdf<MaterialMutationListItem>({
    filename: `Mutasi_Bahan_${new Date().toISOString().slice(0, 10)}`,
    title: 'LAPORAN MUTASI BAHAN',
    subtitle: 'Daftar Pengeluaran & Mutasi Bahan Baku',
    orientation: 'landscape',
    filterInfo: filters.search ? `Pencarian: "${filters.search}"` : undefined,
    columns: [
      { key: 'no', label: 'No' },
      { key: 'kode', label: 'Kode Mutasi' },
      { key: 'tanggal', label: 'Tanggal', formatter: val => formatDate(String(val)) },
      { key: 'keterangan', label: 'Keterangan' },
      { key: 'total_items', label: 'Jml Item' },
      { key: 'total_qty', label: 'Total Qty' },
      {
        key: 'status',
        label: 'Status',
        formatter: val => (Number(val) === 1 ? 'Selesai' : 'Draft')
      },
      { key: 'created_by_name', label: 'Dibuat Oleh' }
    ],
    data: items.value
  })

  toast.success('File PDF berhasil diunduh.')
}

function handlePrint() {
  window.print()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <AppPageHeader
      title="Mutasi Bahan"
      description="Kelola perpindahan dan pengeluaran bahan baku dari gudang untuk divisi produksi atau kebutuhan lainnya"
      :breadcrumbs="[
        { label: 'Persediaan', href: '/inventory/materials' },
        { label: 'Mutasi Bahan', current: true }
      ]"
    >
      <template #actions>
        <div class="flex items-center gap-2">
          <AppButton
            variant="outline"
            size="sm"
            class="text-slate-700 bg-white border-slate-300 hover:bg-slate-50"
            @click="handleExportExcel"
          >
            <FileSpreadsheet class="w-4 h-4 mr-1.5 text-emerald-600" />
            Excel
          </AppButton>

          <AppButton
            variant="outline"
            size="sm"
            class="text-slate-700 bg-white border-slate-300 hover:bg-slate-50"
            @click="handleExportPdf"
          >
            <FileText class="w-4 h-4 mr-1.5 text-rose-600" />
            PDF
          </AppButton>

          <AppButton
            variant="outline"
            size="sm"
            class="text-slate-700 bg-white border-slate-300 hover:bg-slate-50 hidden sm:inline-flex"
            @click="handlePrint"
          >
            <Printer class="w-4 h-4 mr-1.5 text-slate-600" />
            Cetak
          </AppButton>

          <AppButton
            v-if="canCreate"
            variant="primary"
            size="sm"
            class="bg-teal-600 hover:bg-teal-700 text-white font-medium"
            @click="handleCreate"
          >
            <Plus class="w-4 h-4 mr-1.5" />
            Tambah Mutasi
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <!-- KPI Summary Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div
        class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3"
      >
        <div class="p-2.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-100">
          <Layers class="w-5 h-5" />
        </div>
        <div>
          <div class="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Total Mutasi
          </div>
          <div class="text-lg font-bold text-slate-800">{{ totalMutasiCount }}</div>
        </div>
      </div>

      <div
        class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3"
      >
        <div class="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
          <CheckCircle2 class="w-5 h-5" />
        </div>
        <div>
          <div class="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Selesai (Posted)
          </div>
          <div class="text-lg font-bold text-emerald-700">{{ postedCount }}</div>
        </div>
      </div>

      <div
        class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3"
      >
        <div class="p-2.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
          <Clock class="w-5 h-5" />
        </div>
        <div>
          <div class="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Draft</div>
          <div class="text-lg font-bold text-amber-700">{{ draftCount }}</div>
        </div>
      </div>

      <div
        class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3"
      >
        <div class="p-2.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
          <Package class="w-5 h-5" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Total Qty Dimutasi
          </div>
          <div class="text-lg font-bold text-indigo-700">{{ formatNumber(totalQtySum) }}</div>
          <div
            v-if="kpiData.mutasi_per_satuan && kpiData.mutasi_per_satuan.length > 0"
            class="text-[10px] text-slate-500 truncate mt-0.5"
            :title="kpiData.mutasi_per_satuan.map(u => `${formatNumber(u.total_qty)} ${u.satuan}`).join(', ')"
          >
            {{ kpiData.mutasi_per_satuan.map(u => `${formatNumber(u.total_qty)} ${u.satuan}`).join(' • ') }}
          </div>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <!-- Search Input -->
        <div class="lg:col-span-2 relative">
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            v-model="filters.search"
            type="text"
            placeholder="Cari kode, keterangan, atau pembuat..."
            class="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
            @keyup.enter="handleSearch"
          />
        </div>

        <!-- Status Filter -->
        <div>
          <AppSelect
            v-model="filters.status"
            :options="statusOptions"
            placeholder="Semua Status"
            class="w-full"
            @update:model-value="handleSearch"
          />
        </div>

        <!-- Start Date -->
        <div>
          <input
            v-model="filters.startDate"
            type="date"
            class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
            placeholder="Dari Tanggal"
            @change="handleSearch"
          />
        </div>

        <!-- End Date -->
        <div>
          <input
            v-model="filters.endDate"
            type="date"
            class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
            placeholder="Sampai Tanggal"
            @change="handleSearch"
          />
        </div>
      </div>

      <div class="flex items-center justify-between pt-2 border-t border-slate-100">
        <div class="text-xs text-slate-500">
          Menampilkan <span class="font-semibold text-slate-700">{{ items.length }}</span> dari
          <span class="font-semibold text-slate-700">{{ totalItems }}</span> mutasi
        </div>
        <div class="flex items-center gap-2">
          <AppButton
            variant="ghost"
            size="sm"
            class="text-xs text-slate-600 hover:text-slate-900"
            @click="handleResetFilters"
          >
            <RefreshCw class="w-3.5 h-3.5 mr-1" />
            Reset Filter
          </AppButton>
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <AppDataTable
      :columns="columns"
      :data="items"
      :loading="isLoading"
      :total-items="totalItems"
      :current-page="currentPage"
      :page-size="pageSize"
      :selected-rows="selectedRows"
      selectable
      @update:selected-rows="selectedRows = $event"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
      @sort-change="handleSortChange"
    >
      <!-- Kode Slot -->
      <template #cell-kode="{ row }">
        <button
          type="button"
          class="font-mono font-semibold text-teal-600 hover:text-teal-800 hover:underline text-left text-xs"
          @click="handleView(row)"
        >
          {{ row.kode }}
        </button>
      </template>

      <!-- Tanggal Slot -->
      <template #cell-tanggal="{ row }">
        <span class="text-slate-700 text-xs">{{ formatDate(row.tanggal) }}</span>
      </template>

      <!-- Keterangan Slot -->
      <template #cell-keterangan="{ row }">
        <span class="text-slate-600 text-xs line-clamp-1" :title="row.keterangan">
          {{ row.keterangan || '-' }}
        </span>
      </template>

      <!-- Jml Item Slot -->
      <template #cell-total_items="{ row }">
        <span class="font-mono text-slate-700 text-xs">{{ row.total_items }} item</span>
      </template>

      <!-- Total Qty Slot -->
      <template #cell-total_qty="{ row }">
        <span class="font-mono font-bold text-slate-800 text-xs">{{
          formatNumber(row.total_qty)
        }}</span>
      </template>

      <!-- Status Slot -->
      <template #cell-status="{ row }">
        <MaterialMutationStatusBadge :status="row.status" size="sm" />
      </template>

      <!-- Dibuat Oleh Slot -->
      <template #cell-created_by_name="{ row }">
        <span class="text-slate-600 text-xs">{{ row.created_by_name || 'Admin' }}</span>
      </template>

      <!-- Aksi Slot -->
      <template #cell-actions="{ row }">
        <div class="flex items-center gap-1">
          <button
            type="button"
            class="p-1 rounded text-slate-400 hover:text-teal-600 hover:bg-slate-100 transition-colors"
            title="Lihat Detail"
            @click="handleView(row)"
          >
            <Eye class="w-4 h-4" />
          </button>

          <button
            v-if="canUpdate && row.status === 0"
            type="button"
            class="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-slate-100 transition-colors"
            title="Edit Draft Mutasi"
            @click="handleEdit(row)"
          >
            <Edit2 class="w-4 h-4" />
          </button>

          <button
            v-if="canDelete && row.status === 0"
            type="button"
            class="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
            title="Hapus / Batalkan Draft"
            @click="confirmDelete(row)"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </template>
    </AppDataTable>

    <!-- Delete Confirmation Dialog -->
    <AppConfirmDialog
      v-model="isDeleteDialogOpen"
      title="Hapus / Batalkan Mutasi Bahan"
      :message="`Apakah Anda yakin ingin menghapus mutasi ${deleteTarget?.kode || ''}? Jika mutasi telah berstatus Selesai, stok bahan yang telah dipotong akan secara otomatis dikembalikan ke gudang.`"
      confirm-text="Ya, Hapus Mutasi"
      cancel-text="Batal"
      variant="danger"
      @confirm="handleDelete"
      @cancel="isDeleteDialogOpen = false"
    />
  </div>
</template>
