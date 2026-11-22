<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppDataTable from '@/shared/components/data/AppDataTable.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import PurchaseOrderStatusBadge from '../components/PurchaseOrderStatusBadge.vue'
import { purchaseOrderService } from '../services/purchase-order.service'
import type { PurchaseOrderListItem, PurchaseOrderFilters } from '../types/purchase-order.types'
import type { TableColumn } from '@/shared/types/table.types'
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
  Edit2,
  Trash2,
  RotateCcw,
  X
} from 'lucide-vue-next'

const router = useRouter()
const { hasPermission } = usePermission()
const toast = useToast()

const canCreate = computed(() => hasPermission('procurement', 'create'))
const canUpdate = computed(() => hasPermission('procurement', 'update'))
const canDelete = computed(() => hasPermission('procurement', 'delete'))

// Data table state
const items = ref<PurchaseOrderListItem[]>([])
const selectedRows = ref<PurchaseOrderListItem[]>([])
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
  status_transaksi_id: '' as string | number,
  status: '' as string | number,
  startDate: '',
  endDate: ''
})

// Options for dropdowns
const supplierOptions = ref<Array<{ value: number; label: string }>>([])
const statusTransaksiOptions = ref<Array<{ value: number; label: string }>>([])

// Modals state
const isDeleteDialogOpen = ref(false)
const deleteTarget = ref<PurchaseOrderListItem | null>(null)
const isDeleting = ref(false)

// Columns configuration
const columns: TableColumn<PurchaseOrderListItem>[] = [
  {
    key: 'kode',
    label: 'Kode PO',
    sortable: true,
    minWidth: '150px'
  },
  {
    key: 'tanggal',
    label: 'Tanggal',
    sortable: true,
    width: '110px'
  },
  {
    key: 'suplier_nama',
    label: 'Supplier',
    sortable: true,
    minWidth: '180px'
  },
  {
    key: 'subtotal',
    label: 'Subtotal',
    sortable: true,
    align: 'right',
    width: '130px'
  },
  {
    key: 'diskon',
    label: 'Diskon',
    sortable: true,
    align: 'right',
    width: '110px'
  },
  {
    key: 'total_ppn',
    label: 'PPN',
    sortable: true,
    align: 'right',
    width: '110px'
  },
  {
    key: 'total',
    label: 'Total',
    sortable: true,
    align: 'right',
    width: '140px'
  },
  {
    key: 'status_transaksi_nama',
    label: 'Transaksi',
    sortable: true,
    align: 'center',
    width: '120px'
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    align: 'center',
    width: '110px'
  }
]

async function loadData() {
  isLoading.value = true
  try {
    const query: PurchaseOrderFilters = {
      page: currentPage.value,
      pageSize: pageSize.value,
      sortField: sortBy.value,
      sortOrder: sortOrder.value,
      search: filters.search,
      suplier_id: filters.suplier_id !== '' ? Number(filters.suplier_id) : undefined,
      status_transaksi_id:
        filters.status_transaksi_id !== '' ? Number(filters.status_transaksi_id) : undefined,
      status: filters.status !== '' ? Number(filters.status) : undefined,
      startDate: filters.startDate,
      endDate: filters.endDate
    }

    const res = await purchaseOrderService.list(query)
    items.value = res.data
    totalItems.value = res.total
  } catch (err: unknown) {
    toast.error((err as Error).message || 'Gagal memuat daftar Purchase Order.')
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  const [suppliers, stList] = await Promise.all([
    purchaseOrderService.getSuppliers(),
    purchaseOrderService.getStatusTransaksiList()
  ])

  supplierOptions.value = suppliers.map(s => ({
    value: s.id,
    label: `${s.nama} (${s.kode || 'SUP'})`
  }))

  statusTransaksiOptions.value = stList.map(st => ({
    value: st.id,
    label: st.status_transaksi
  }))

  loadData()
})

function handleSort(sortState: { key: string; direction: 'asc' | 'desc' }) {
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
  filters.status_transaksi_id = ''
  filters.status = ''
  filters.startDate = ''
  filters.endDate = ''
  currentPage.value = 1
  loadData()
}

function navigateToCreate() {
  router.push('/procurement/purchase-orders/create')
}

function isDraft(item: PurchaseOrderListItem): boolean {
  return item.status !== 1 && item.status_aktif !== 0
}

function isApproved(item: PurchaseOrderListItem): boolean {
  return item.status === 1 && item.status_aktif !== 0
}

function navigateToEdit(item: PurchaseOrderListItem) {
  if (!isDraft(item)) {
    toast.warning('Hanya Purchase Order berstatus Draft yang dapat diedit.')
    return
  }
  router.push(`/procurement/purchase-orders/${item.id}/edit`)
}

function confirmDelete(item: PurchaseOrderListItem) {
  if (item.status_aktif === 0) return
  deleteTarget.value = item
  isDeleteDialogOpen.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  isDeleting.value = true
  try {
    await purchaseOrderService.delete(deleteTarget.value.id)
    toast.success(`Purchase Order ${deleteTarget.value.kode} berhasil dibatalkan/dihapus.`)
    isDeleteDialogOpen.value = false
    deleteTarget.value = null
    loadData()
  } catch (err: unknown) {
    toast.error((err as Error).message || 'Gagal menghapus Purchase Order.')
  } finally {
    isDeleting.value = false
  }
}

// Export actions
async function handleExportExcel() {
  try {
    toast.info('Menyiapkan ekspor Excel...')
    const query: PurchaseOrderFilters = {
      page: 1,
      perPage: 10000,
      search: filters.search,
      suplier_id: filters.suplier_id !== '' ? Number(filters.suplier_id) : undefined,
      status_transaksi_id:
        filters.status_transaksi_id !== '' ? Number(filters.status_transaksi_id) : undefined,
      status: filters.status !== '' ? Number(filters.status) : undefined,
      startDate: filters.startDate,
      endDate: filters.endDate
    }
    const res = await purchaseOrderService.list(query)

    exportToExcel({
      title: 'DAFTAR PURCHASE ORDER',
      filename: `Purchase_Orders_${new Date().toISOString().slice(0, 10)}`,
      columns: [
        { key: 'kode', label: 'Kode PO' },
        { key: 'tanggal', label: 'Tanggal' },
        { key: 'suplier_nama', label: 'Supplier' },
        { key: 'subtotal', label: 'Subtotal (Rp)', formatter: v => formatCurrency(Number(v) || 0) },
        { key: 'diskon', label: 'Diskon (Rp)', formatter: v => formatCurrency(Number(v) || 0) },
        { key: 'total_ppn', label: 'PPN (Rp)', formatter: v => formatCurrency(Number(v) || 0) },
        { key: 'total', label: 'Total Bayar (Rp)', formatter: v => formatCurrency(Number(v) || 0) },
        { key: 'status_transaksi_nama', label: 'Status Transaksi' },
        { key: 'status_label', label: 'Status Dokumen' },
        { key: 'keterangan', label: 'Keterangan' }
      ],
      data: res.data
    })
    toast.success('Ekspor Excel berhasil diunduh.')
  } catch (err: unknown) {
    toast.error((err as Error).message || 'Gagal mengekspor Excel.')
  }
}

async function handleExportPdf() {
  try {
    toast.info('Menyiapkan ekspor PDF...')
    const query: PurchaseOrderFilters = {
      page: 1,
      perPage: 10000,
      search: filters.search,
      suplier_id: filters.suplier_id !== '' ? Number(filters.suplier_id) : undefined,
      status_transaksi_id:
        filters.status_transaksi_id !== '' ? Number(filters.status_transaksi_id) : undefined,
      status: filters.status !== '' ? Number(filters.status) : undefined,
      startDate: filters.startDate,
      endDate: filters.endDate
    }
    const res = await purchaseOrderService.list(query)

    exportToPdf({
      title: 'DAFTAR PURCHASE ORDER',
      subtitle: 'Sistem ERP Impact Furniture v2 — Modul Pengadaan',
      filename: `Purchase_Orders_${new Date().toISOString().slice(0, 10)}`,
      orientation: 'landscape',
      columns: [
        { key: 'kode', label: 'Kode PO' },
        { key: 'tanggal', label: 'Tanggal' },
        { key: 'suplier_nama', label: 'Supplier' },
        { key: 'subtotal', label: 'Subtotal (Rp)', formatter: v => formatCurrency(Number(v) || 0) },
        { key: 'diskon', label: 'Diskon (Rp)', formatter: v => formatCurrency(Number(v) || 0) },
        { key: 'total_ppn', label: 'PPN (Rp)', formatter: v => formatCurrency(Number(v) || 0) },
        { key: 'total', label: 'Total (Rp)', formatter: v => formatCurrency(Number(v) || 0) },
        { key: 'status_transaksi_nama', label: 'Transaksi' },
        { key: 'status_label', label: 'Status' }
      ],
      data: res.data
    })
    toast.success('Ekspor PDF berhasil dibuat.')
  } catch (err: unknown) {
    toast.error((err as Error).message || 'Gagal mengekspor PDF.')
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header & Action Buttons -->
    <AppPageHeader
      title="Purchase Order"
      description="Kelola pesanan pembelian bahan baku dan logistik pengadaan manufaktur."
      :breadcrumbs="[
        { label: 'Home', to: '/dashboard' },
        { label: 'Pengadaan', to: '/procurement/purchase-orders' },
        { label: 'Purchase Order' }
      ]"
    >
      <template #actions>
        <div class="flex flex-wrap items-center gap-2">
          <!-- Tambah PO -->
          <AppButton v-if="canCreate" variant="primary" size="md" @click="navigateToCreate">
            <Plus class="w-4 h-4 mr-1.5" />
            <span>Tambah PO</span>
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
              placeholder="Cari Kode PO, Supplier, Catatan..."
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

        <!-- Status Transaksi Filter -->
        <div>
          <label
            class="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1"
          >
            Transaksi
          </label>
          <AppSelect
            v-model="filters.status_transaksi_id"
            :options="[{ value: '', label: 'Semua Transaksi' }, ...statusTransaksiOptions]"
            @change="loadData"
          />
        </div>

        <!-- Business Status Filter -->
        <div>
          <label
            class="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1"
          >
            Status Dokumen
          </label>
          <AppSelect
            v-model="filters.status"
            :options="[
              { value: '', label: 'Semua Status' },
              { value: 0, label: 'Draft' },
              { value: 1, label: 'Disetujui' }
            ]"
            @change="loadData"
          />
        </div>

        <!-- Reset & Filter Trigger Button -->
        <div class="flex items-end gap-2">
          <AppButton variant="primary" size="sm" class="w-full" @click="loadData">
            Terapkan
          </AppButton>
          <AppButton variant="outline" size="sm" title="Reset Filter" @click="resetFilters">
            <RotateCcw class="w-3.5 h-3.5" />
          </AppButton>
        </div>
      </div>

      <!-- Date Range Filter Row -->
      <div class="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100 text-xs">
        <span class="font-semibold text-slate-600">Rentang Tanggal:</span>
        <div class="flex items-center gap-2">
          <input
            v-model="filters.startDate"
            type="date"
            class="py-1 px-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
            @change="loadData"
          />
          <span class="text-slate-400">s/d</span>
          <input
            v-model="filters.endDate"
            type="date"
            class="py-1 px-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
            @change="loadData"
          />
        </div>
      </div>
    </div>

    <!-- Data Table Card -->
    <AppDataTable
      v-model:selected-rows="selectedRows"
      :columns="columns"
      :data="items"
      :loading="isLoading"
      :selectable="true"
      :sortable="true"
      :sort-by="sortBy"
      :sort-order="sortOrder"
      :client-sort="false"
      :paginated="true"
      :current-page="currentPage"
      :page-size="pageSize"
      :total-items="totalItems"
      :client-pagination="false"
      @sort="handleSort"
      @update:current-page="handlePageChange"
      @update:page-size="handlePageSizeChange"
    >
      <!-- Cell: Kode PO -->
      <template #cell-kode="{ row }">
        <div class="font-bold text-teal-800 flex items-center gap-1.5">
          <span>{{ row.kode }}</span>
          <span
            v-if="row.items_count"
            class="text-[10px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-normal"
          >
            {{ row.items_count }} item
          </span>
        </div>
      </template>

      <!-- Cell: Tanggal -->
      <template #cell-tanggal="{ row }">
        <span class="text-slate-700 whitespace-nowrap">{{ formatDate(row.tanggal) }}</span>
      </template>

      <!-- Cell: Supplier -->
      <template #cell-suplier_nama="{ row }">
        <div class="font-medium text-slate-900">{{ row.suplier_nama }}</div>
      </template>

      <!-- Cell: Subtotal -->
      <template #cell-subtotal="{ row }">
        <span class="font-mono text-slate-700">{{ formatCurrency(row.subtotal || 0) }}</span>
      </template>

      <!-- Cell: Diskon -->
      <template #cell-diskon="{ row }">
        <span class="font-mono text-rose-600">
          {{ row.diskon ? `- ${formatCurrency(row.diskon)}` : '-' }}
        </span>
      </template>

      <!-- Cell: PPN -->
      <template #cell-total_ppn="{ row }">
        <span class="font-mono text-slate-600">
          {{ row.is_ppn ? formatCurrency(row.total_ppn || 0) : '-' }}
        </span>
      </template>

      <!-- Cell: Total -->
      <template #cell-total="{ row }">
        <span class="font-mono font-bold text-teal-800">{{ formatCurrency(row.total || 0) }}</span>
      </template>

      <!-- Cell: Status Transaksi -->
      <template #cell-status_transaksi_nama="{ row }">
        <PurchaseOrderStatusBadge type="transaksi" :status-transaksi="row.status_transaksi_nama" />
      </template>

      <!-- Cell: Status Dokumen -->
      <template #cell-status="{ row }">
        <PurchaseOrderStatusBadge type="status" :status="row.status" />
      </template>

      <!-- Actions -->
      <template #actions="{ row }">
        <div class="flex items-center justify-end gap-1">
          <!-- Edit (hanya Draft) -->
          <button
            v-if="canUpdate && isDraft(row)"
            type="button"
            class="p-1 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded transition-colors"
            title="Edit Purchase Order"
            @click="navigateToEdit(row)"
          >
            <Edit2 class="w-3.5 h-3.5" />
          </button>

          <!-- Hapus (hanya Draft) -->
          <button
            v-if="canDelete && isDraft(row)"
            type="button"
            class="p-1 text-slate-500 hover:text-rose-700 hover:bg-slate-100 rounded transition-colors"
            title="Hapus Purchase Order"
            @click="confirmDelete(row)"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>

          <!-- Batalkan (Disetujui) -->
          <button
            v-if="canDelete && isApproved(row)"
            type="button"
            class="p-1 text-slate-500 hover:text-rose-700 hover:bg-slate-100 rounded transition-colors"
            title="Batalkan Purchase Order"
            @click="confirmDelete(row)"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
      </template>
    </AppDataTable>

    <!-- Delete / Cancel Confirmation Dialog -->
    <AppConfirmDialog
      :is-open="isDeleteDialogOpen"
      :title="deleteTarget?.status === 1 ? 'Batalkan Purchase Order' : 'Hapus Purchase Order'"
      :message="deleteTarget?.status === 1 ? `Apakah Anda yakin ingin membatalkan dokumen Purchase Order ${deleteTarget?.kode}?` : `Apakah Anda yakin ingin menghapus dokumen Purchase Order ${deleteTarget?.kode}?`"
      :confirm-text="deleteTarget?.status === 1 ? 'Ya, Batalkan' : 'Ya, Hapus'"
      cancel-text="Batal"
      variant="danger"
      :is-loading="isDeleting"
      @confirm="handleDelete"
      @cancel="isDeleteDialogOpen = false"
    />
  </div>
</template>
