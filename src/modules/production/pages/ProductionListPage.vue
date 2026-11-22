<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppDataTable from '@/shared/components/data/AppDataTable.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import { productionService } from '../services/production.service'
import type { ProductionListItem } from '../types/production.types'
import type { TableColumn, TableSortState } from '@/shared/types/table.types'
import { usePermission } from '@/shared/composables/usePermission'
import { useToast } from '@/shared/composables/useToast'
import { formatNumber } from '@/shared/utils/formatters'
import { exportProductionListExcel, exportProductionListPdf } from '../utils/production-export'
import {
  Plus,
  Search,
  FileSpreadsheet,
  FileText,
  Eye,
  Edit2,
  Trash2,
  Layers,
  Clock,
  PlayCircle,
  CheckCircle2
} from 'lucide-vue-next'

const router = useRouter()
const { hasPermission } = usePermission()
const toast = useToast()

const canCreate = computed(() => hasPermission('production', 'create'))
const canUpdate = computed(() => hasPermission('production', 'update'))
const canDelete = computed(() => hasPermission('production', 'delete'))

// Data table state
const items = ref<ProductionListItem[]>([])
const isLoading = ref(true)
const totalItems = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const sortBy = ref('id')
const sortOrder = ref<'asc' | 'desc'>('desc')

// Filter state
const filters = reactive({
  search: '',
  start_date: '',
  end_date: '',
  jenis_produksi: 'all',
  status_produksi: 'all'
})

const jenisOptions = [
  { value: 'all', label: 'Semua Jenis' },
  { value: '1', label: 'Pesanan' },
  { value: '0', label: 'Non Pesanan / Stok' }
]

const statusOptions = [
  { value: 'all', label: 'Semua Status' },
  { value: '0', label: 'Pending' },
  { value: '1', label: 'Proses' },
  { value: '2', label: 'Selesai' }
]

// Delete / Cancel dialog state
const isCancelDialogOpen = ref(false)
const cancelTarget = ref<ProductionListItem | null>(null)
const isCancelling = ref(false)

const columns: TableColumn<ProductionListItem>[] = [
  {
    key: 'kode',
    label: 'No Produksi',
    sortable: true,
    minWidth: '140px'
  },
  {
    key: 'tanggal',
    label: 'Tanggal',
    sortable: true,
    minWidth: '110px'
  },
  {
    key: 'jenis_label',
    label: 'Jenis',
    sortable: true,
    minWidth: '130px'
  },
  {
    key: 'status_produksi_label',
    label: 'Status Produksi',
    sortable: true,
    minWidth: '130px'
  },
  {
    key: 'status_label',
    label: 'Status Dokumen',
    sortable: true,
    minWidth: '120px'
  },
  {
    key: 'jumlah_jenis_produk',
    label: 'Jumlah Produk',
    sortable: true,
    minWidth: '110px'
  },
  {
    key: 'total_qty',
    label: 'Total Qty Target',
    sortable: true,
    minWidth: '130px'
  },
  {
    key: 'keterangan',
    label: 'Keterangan',
    sortable: false,
    minWidth: '180px'
  },
  {
    key: 'actions',
    label: 'Aksi',
    sortable: false,
    minWidth: '130px'
  }
]

// KPI metrics
const kpiTotalTransactions = computed(() => totalItems.value)
const kpiPendingCount = computed(() => {
  return items.value.filter(i => i.status_produksi === 0).length
})
const kpiInProcessCount = computed(() => {
  return items.value.filter(i => i.status_produksi === 1).length
})
const kpiCompletedCount = computed(() => {
  return items.value.filter(i => i.status_produksi === 2).length
})

async function loadData() {
  isLoading.value = true
  try {
    const res = await productionService.getProductions({
      page: currentPage.value,
      limit: pageSize.value,
      search: filters.search,
      start_date: filters.start_date || undefined,
      end_date: filters.end_date || undefined,
      jenis_produksi: filters.jenis_produksi === 'all' ? undefined : Number(filters.jenis_produksi),
      status_produksi:
        filters.status_produksi === 'all' ? undefined : Number(filters.status_produksi),
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    })
    items.value = res.data
    totalItems.value = res.total
  } catch (err: unknown) {
    toast.error('Gagal memuat data transaksi produksi', (err as Error).message)
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

function handleFilterChange() {
  currentPage.value = 1
  loadData()
}

function handleSort(sort: TableSortState) {
  sortBy.value = sort.key
  sortOrder.value = sort.direction || 'desc'
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

function openCreatePage() {
  router.push('/production/orders/create')
}

function openDetailPage(item: ProductionListItem) {
  router.push(`/production/orders/${item.id}`)
}

function openEditPage(item: ProductionListItem) {
  if (item.is_posted) {
    toast.warning('Transaksi Sudah Selesai', 'Transaksi yang telah diposting tidak dapat diubah.')
    return
  }
  router.push(`/production/orders/${item.id}/edit`)
}

function confirmCancel(item: ProductionListItem) {
  cancelTarget.value = item
  isCancelDialogOpen.value = true
}

async function handleCancelConfirm() {
  if (!cancelTarget.value) return
  isCancelling.value = true
  try {
    await productionService.deleteProduction(cancelTarget.value.id)
    toast.success(
      'Transaksi Dibatalkan',
      `Produksi ${cancelTarget.value.kode} berhasil dibatalkan dan saldo stok telah disesuaikan.`
    )
    isCancelDialogOpen.value = false
    cancelTarget.value = null
    loadData()
  } catch (err: unknown) {
    toast.error('Gagal membatalkan transaksi', (err as Error).message)
  } finally {
    isCancelling.value = false
  }
}

function handleExportExcel() {
  exportProductionListExcel(items.value)
  toast.success('Ekspor Excel Berhasil', 'Data transaksi produksi telah diunduh.')
}

function handleExportPdf() {
  exportProductionListPdf(items.value)
  toast.success('Ekspor PDF Berhasil', 'Dokumen PDF daftar transaksi produksi telah siap.')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <AppPageHeader
      title="Proses Produksi"
      subtitle="Kelola pesanan kerja produksi furniture, pemantauan status pengerjaan, dan pencatatan barang jadi"
      :breadcrumbs="[{ label: 'Produksi' }, { label: 'Proses Produksi' }]"
    >
      <template #actions>
        <div class="flex items-center gap-2.5">
          <AppButton
            variant="outline"
            size="sm"
            class="flex items-center gap-1.5"
            @click="handleExportExcel"
          >
            <FileSpreadsheet class="w-4 h-4 text-emerald-600" />
            <span>Ekspor Excel</span>
          </AppButton>

          <AppButton
            variant="outline"
            size="sm"
            class="flex items-center gap-1.5"
            @click="handleExportPdf"
          >
            <FileText class="w-4 h-4 text-rose-600" />
            <span>Ekspor PDF</span>
          </AppButton>

          <AppButton
            v-if="canCreate"
            variant="primary"
            size="sm"
            class="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
            @click="openCreatePage"
          >
            <Plus class="w-4 h-4" />
            <span>Tambah Produksi</span>
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <!-- KPI Metric Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3"
      >
        <div class="p-3 bg-teal-50 text-teal-700 rounded-lg">
          <Layers class="w-5 h-5" />
        </div>
        <div>
          <p class="text-xs text-slate-500 font-medium">Total Produksi</p>
          <p class="text-lg font-bold text-slate-800">{{ kpiTotalTransactions }} Transaksi</p>
        </div>
      </div>

      <div
        class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3"
      >
        <div class="p-3 bg-amber-50 text-amber-700 rounded-lg">
          <Clock class="w-5 h-5" />
        </div>
        <div>
          <p class="text-xs text-slate-500 font-medium">Produksi Pending</p>
          <p class="text-lg font-bold text-slate-800">{{ kpiPendingCount }} Dokumen</p>
        </div>
      </div>

      <div
        class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3"
      >
        <div class="p-3 bg-blue-50 text-blue-700 rounded-lg">
          <PlayCircle class="w-5 h-5" />
        </div>
        <div>
          <p class="text-xs text-slate-500 font-medium">Dalam Pengerjaan</p>
          <p class="text-lg font-bold text-slate-800">{{ kpiInProcessCount }} Batch</p>
        </div>
      </div>

      <div
        class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3"
      >
        <div class="p-3 bg-emerald-50 text-emerald-700 rounded-lg">
          <CheckCircle2 class="w-5 h-5" />
        </div>
        <div>
          <p class="text-xs text-slate-500 font-medium">Selesai (Posted)</p>
          <p class="text-lg font-bold text-slate-800">{{ kpiCompletedCount }} Transaksi</p>
        </div>
      </div>
    </div>

    <!-- Filter Toolbar -->
    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <!-- Search -->
        <div class="lg:col-span-2 relative">
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            v-model="filters.search"
            type="text"
            placeholder="Cari nomor produksi atau keterangan..."
            class="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800 placeholder-slate-400"
            @keyup.enter="handleSearch"
          />
        </div>

        <!-- Filter Jenis -->
        <div>
          <AppSelect
            v-model="filters.jenis_produksi"
            :options="jenisOptions"
            placeholder="Pilih Jenis"
            @change="handleFilterChange"
          />
        </div>

        <!-- Filter Status Produksi -->
        <div>
          <AppSelect
            v-model="filters.status_produksi"
            :options="statusOptions"
            placeholder="Pilih Status"
            @change="handleFilterChange"
          />
        </div>

        <!-- Date Range Filter -->
        <div class="flex items-center gap-1.5">
          <input
            v-model="filters.start_date"
            type="date"
            title="Tanggal Mulai"
            class="w-1/2 py-2 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            @change="handleFilterChange"
          />
          <span class="text-xs text-slate-400">-</span>
          <input
            v-model="filters.end_date"
            type="date"
            title="Tanggal Selesai"
            class="w-1/2 py-2 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            @change="handleFilterChange"
          />
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
      :client-sort="false"
      :client-pagination="false"
      :selectable="true"
      @sort="handleSort"
      @update:current-page="handlePageChange"
      @update:page-size="handlePageSizeChange"
    >
      <!-- Column: kode -->
      <template #cell-kode="{ row }">
        <button
          type="button"
          class="font-mono font-semibold text-teal-700 hover:text-teal-900 hover:underline text-xs"
          @click="openDetailPage(row)"
        >
          {{ row.kode }}
        </button>
      </template>

      <!-- Column: tanggal -->
      <template #cell-tanggal="{ row }">
        <span class="text-slate-600 font-mono text-xs">{{ row.tanggal }}</span>
      </template>

      <!-- Column: jenis_label -->
      <template #cell-jenis_label="{ row }">
        <div class="flex flex-col gap-0.5">
          <span
            class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold w-fit"
            :class="[
              row.jenis_produksi === 1
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            ]"
          >
            {{ row.jenis_label }}
          </span>
          <span v-if="row.so_kode" class="text-[10px] font-mono text-teal-700 font-medium">
            SO: {{ row.so_kode }}
          </span>
        </div>
      </template>

      <!-- Column: status_produksi_label -->
      <template #cell-status_produksi_label="{ row }">
        <span
          class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
          :class="[
            row.status_produksi === 2
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : row.status_produksi === 1
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
          ]"
        >
          <span
            class="w-1.5 h-1.5 rounded-full"
            :class="[
              row.status_produksi === 2
                ? 'bg-emerald-500'
                : row.status_produksi === 1
                  ? 'bg-blue-500'
                  : 'bg-amber-500'
            ]"
          />
          {{ row.status_produksi_label }}
        </span>
      </template>

      <!-- Column: status_label -->
      <template #cell-status_label="{ row }">
        <span
          class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium"
          :class="[
            row.is_posted
              ? 'bg-teal-50 text-teal-700 border border-teal-200'
              : 'bg-slate-100 text-slate-600'
          ]"
        >
          {{ row.is_posted ? 'Posted (Selesai)' : 'Draft' }}
        </span>
      </template>

      <!-- Column: jumlah_jenis_produk -->
      <template #cell-jumlah_jenis_produk="{ row }">
        <span class="text-slate-700 font-medium text-xs">{{ row.jumlah_jenis_produk }} produk</span>
      </template>

      <!-- Column: total_qty -->
      <template #cell-total_qty="{ row }">
        <span class="font-mono font-semibold text-slate-800 text-xs"
          >{{ formatNumber(row.total_qty) }} Unit</span
        >
      </template>

      <!-- Column: keterangan -->
      <template #cell-keterangan="{ row }">
        <span class="text-slate-500 text-xs line-clamp-1">{{ row.keterangan || '-' }}</span>
      </template>

      <!-- Column: actions -->
      <template #cell-actions="{ row }">
        <div class="flex items-center gap-1">
          <button
            type="button"
            class="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded transition-colors"
            title="Lihat Detail"
            @click="openDetailPage(row)"
          >
            <Eye class="w-4 h-4" />
          </button>

          <button
            v-if="canUpdate && !row.is_posted"
            type="button"
            class="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded transition-colors"
            title="Edit Transaksi"
            @click="openEditPage(row)"
          >
            <Edit2 class="w-4 h-4" />
          </button>

          <button
            v-if="canDelete"
            type="button"
            class="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-slate-100 rounded transition-colors"
            title="Batalkan Transaksi"
            @click="confirmCancel(row)"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </template>
    </AppDataTable>

    <!-- Cancel / Delete Dialog -->
    <AppConfirmDialog
      :is-open="isCancelDialogOpen"
      title="Batalkan Transaksi Produksi"
      :message="`Apakah Anda yakin ingin membatalkan transaksi produksi nomor '${cancelTarget?.kode}'? ${
        cancelTarget?.is_posted
          ? 'Perhatian: Transaksi ini telah diposting. Pembatalan akan membalikkan penambahan stok produk dan mengembalikan saldo bahan baku (reversal).'
          : 'Data yang dibatalkan tidak akan diproses lebih lanjut.'
      }`"
      confirm-text="Ya, Batalkan Transaksi"
      cancel-text="Kembali"
      confirm-variant="danger"
      :is-loading="isCancelling"
      @confirm="handleCancelConfirm"
      @cancel="isCancelDialogOpen = false"
    />
  </div>
</template>
