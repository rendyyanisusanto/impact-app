<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppDataTable from '@/shared/components/data/AppDataTable.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import BillPaymentStatusBadge from '../components/BillPaymentStatusBadge.vue'
import { billPaymentService } from '../services/bill-payment.service'
import { supplierService } from '@/modules/procurement/suppliers/services/supplier.service'
import { bankService } from '@/modules/settings/banks/services/bank.service'
import type { BillPaymentListItem, BillPaymentFilters } from '../types/bill-payment.types'
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
  History,
  AlertTriangle
} from 'lucide-vue-next'

const router = useRouter()
const { hasPermission } = usePermission()
const toast = useToast()

const canCreate = computed(() => hasPermission('procurement', 'create'))
const canUpdate = computed(() => hasPermission('procurement', 'update'))
const canDelete = computed(() => hasPermission('procurement', 'delete'))

// Data table state
const items = ref<BillPaymentListItem[]>([])
const selectedRows = ref<BillPaymentListItem[]>([])
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
  status: '' as string | number,
  startDate: '',
  endDate: ''
})

// Lookups
const supplierOptions = ref<Array<{ value: number; label: string }>>([])
const bankOptions = ref<Array<{ value: number; label: string }>>([])

// Delete dialog state
const isDeleteDialogOpen = ref(false)
const deleteTarget = ref<BillPaymentListItem | null>(null)
const deleteReason = ref('Pembatalan transaksi oleh pengguna')
const isDeleting = ref(false)

const columns: TableColumn<BillPaymentListItem>[] = [
  {
    key: 'kode',
    label: 'Kode PT',
    sortable: true,
    minWidth: '160px'
  },
  {
    key: 'tanggal',
    label: 'Tanggal',
    sortable: true,
    minWidth: '110px'
  },
  {
    key: 'no_tagihan',
    label: 'No. Tagihan',
    sortable: true,
    minWidth: '140px'
  },
  {
    key: 'nama_suplier',
    label: 'Supplier',
    sortable: true,
    minWidth: '180px'
  },
  {
    key: 'penagih',
    label: 'Penagih',
    sortable: true,
    minWidth: '130px'
  },
  {
    key: 'metode_pembayaran',
    label: 'Metode / Bank',
    sortable: false,
    minWidth: '160px'
  },
  {
    key: 'total',
    label: 'Total Tagihan',
    sortable: true,
    align: 'right',
    minWidth: '130px'
  },
  {
    key: 'total_bayar',
    label: 'Nominal Bayar',
    sortable: true,
    align: 'right',
    minWidth: '130px'
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    align: 'center',
    minWidth: '120px'
  }
]

onMounted(async () => {
  await Promise.all([loadDropdownOptions(), loadData()])
})

async function loadDropdownOptions() {
  try {
    const sups = supplierService.getRawItems()
    const banks = bankService.getRawItems()
    supplierOptions.value = sups.map(s => ({ value: s.id, label: s.nama }))
    bankOptions.value = banks.map(b => ({ value: b.id, label: b.bank || '' }))
  } catch (err) {
    console.error('Failed to load lookups:', err)
  }
}

async function loadData() {
  isLoading.value = true
  try {
    const query: BillPaymentFilters = {
      page: currentPage.value,
      pageSize: pageSize.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
      search: filters.search,
      suplier_id: filters.suplier_id,
      status: filters.status,
      startDate: filters.startDate,
      endDate: filters.endDate
    }

    const res = await billPaymentService.list(query)
    items.value = res.data
    totalItems.value = res.total
  } catch (err: unknown) {
    toast.error((err as Error).message || 'Gagal memuat daftar Pembayaran Tagihan.')
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
  filters.status = ''
  filters.startDate = ''
  filters.endDate = ''
  currentPage.value = 1
  loadData()
}

function navigateToCreate() {
  router.push('/procurement/bill-payments/create')
}

function navigateToDetail(item: BillPaymentListItem) {
  router.push(`/procurement/bill-payments/${item.id}`)
}

function navigateToEdit(item: BillPaymentListItem) {
  router.push(`/procurement/bill-payments/${item.id}/edit`)
}

function navigateToAudit(item: BillPaymentListItem) {
  router.push({ path: '/system/audit-trail', query: { search: item.kode } })
}

function confirmDelete(item: BillPaymentListItem) {
  deleteTarget.value = item
  deleteReason.value = 'Pembatalan transaksi oleh pengguna'
  isDeleteDialogOpen.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  if (!deleteReason.value.trim() || deleteReason.value.trim().length < 3) {
    toast.error('Alasan pembatalan minimal 3 karakter.')
    return
  }

  isDeleting.value = true
  try {
    await billPaymentService.delete(deleteTarget.value.id, deleteReason.value.trim())
    toast.success(`Pembayaran Tagihan ${deleteTarget.value.kode} berhasil dibatalkan.`)
    isDeleteDialogOpen.value = false
    deleteTarget.value = null
    loadData()
  } catch (err: unknown) {
    toast.error((err as Error).message || 'Gagal membatalkan Pembayaran Tagihan.')
  } finally {
    isDeleting.value = false
  }
}

async function handleExportExcel() {
  try {
    toast.info('Menyiapkan ekspor Excel...')
    const query: BillPaymentFilters = {
      page: 1,
      pageSize: 1000,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
      search: filters.search,
      suplier_id: filters.suplier_id,
      status: filters.status,
      startDate: filters.startDate,
      endDate: filters.endDate
    }

    const res = await billPaymentService.list(query)
    const exportData = res.data.map((item, idx) => ({
      no: idx + 1,
      kode: item.kode,
      tanggal: item.tanggal,
      no_tagihan: item.no_tagihan,
      supplier: item.nama_suplier,
      penagih: item.penagih || '-',
      metode_bank: item.metode_pembayaran ? `${item.metode_pembayaran} (${item.bank_nama})` : '-',
      total: item.total || 0,
      total_bayar: item.total_bayar || 0,
      status: item.status_label
    }))

    const dateStr = new Date().toISOString().slice(0, 10)
    exportToExcel({
      title: 'DAFTAR PEMBAYARAN TAGIHAN SUPPLIER',
      filename: `Laporan-Pembayaran-Tagihan-${dateStr}`,
      columns: [
        { label: 'No', key: 'no', width: 6 },
        { label: 'Kode PT', key: 'kode', width: 18 },
        { label: 'Tanggal', key: 'tanggal', width: 14 },
        { label: 'No Tagihan', key: 'no_tagihan', width: 18 },
        { label: 'Supplier', key: 'supplier', width: 25 },
        { label: 'Penagih', key: 'penagih', width: 18 },
        { label: 'Metode & Bank', key: 'metode_bank', width: 24 },
        { label: 'Total Tagihan', key: 'total', width: 18 },
        { label: 'Nominal Bayar', key: 'total_bayar', width: 18 },
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
    const query: BillPaymentFilters = {
      page: 1,
      pageSize: 1000,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
      search: filters.search,
      suplier_id: filters.suplier_id,
      status: filters.status,
      startDate: filters.startDate,
      endDate: filters.endDate
    }

    const res = await billPaymentService.list(query)
    const exportData = res.data.map((item, idx) => ({
      no: idx + 1,
      kode: item.kode,
      tanggal: item.tanggal,
      no_tagihan: item.no_tagihan,
      supplier: item.nama_suplier,
      metode: item.metode_pembayaran,
      total: formatCurrency(item.total || 0),
      total_bayar: formatCurrency(item.total_bayar || 0),
      status: item.status_label
    }))

    const dateStr = new Date().toISOString().slice(0, 10)
    exportToPdf({
      title: 'LAPORAN PEMBAYARAN TAGIHAN SUPPLIER',
      filename: `Laporan-Pembayaran-Tagihan-${dateStr}.pdf`,
      columns: [
        { label: 'No', key: 'no' },
        { label: 'Kode PT', key: 'kode' },
        { label: 'Tanggal', key: 'tanggal' },
        { label: 'No. Tagihan', key: 'no_tagihan' },
        { label: 'Supplier', key: 'supplier' },
        { label: 'Metode', key: 'metode' },
        { label: 'Total Tagihan', key: 'total' },
        { label: 'Nominal Bayar', key: 'total_bayar' },
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
  <div class="space-y-4">
    <!-- Page Header & Action Toolbar -->
    <AppPageHeader
      title="Pembayaran Tagihan"
      description="Kelola pencatatan dan alokasi pembayaran faktur tagihan supplier dari dokumen Penerimaan Barang (PB)."
      :breadcrumbs="[
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Pengadaan', to: '/procurement/purchase-orders' },
        { label: 'Pembayaran Tagihan' }
      ]"
    >
      <template #actions>
        <div class="flex items-center gap-2">
          <!-- Tambah Pembayaran Button -->
          <AppButton
            v-if="canCreate"
            variant="primary"
            size="md"
            data-test="create-button"
            @click="navigateToCreate"
          >
            <Plus class="w-4 h-4 mr-1.5" />
            <span>Tambah Pembayaran</span>
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
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
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
              placeholder="Cari Kode PT, No Tagihan, Penagih..."
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

        <!-- Status Filter -->
        <div>
          <label
            class="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1"
          >
            Status Pembayaran
          </label>
          <AppSelect
            v-model="filters.status"
            :options="[
              { value: '', label: 'Semua Status' },
              { value: 0, label: 'Belum Lunas' },
              { value: 1, label: 'Lunas' }
            ]"
            @change="loadData"
          />
        </div>

        <!-- Reset Button -->
        <div class="flex items-end gap-2">
          <AppButton variant="primary" size="sm" class="w-full" @click="loadData">
            Terapkan
          </AppButton>
          <AppButton variant="outline" size="sm" title="Reset Filter" @click="resetFilters">
            <RotateCcw class="w-3.5 h-3.5" />
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
      <!-- Cell: Kode PT -->
      <template #cell-kode="{ row }">
        <div class="flex items-center gap-1.5">
          <span
            class="font-medium font-mono text-teal-700 cursor-pointer hover:underline"
            @click="navigateToDetail(row)"
          >
            {{ row.kode }}
          </span>
          <span
            v-if="row.pb_count && row.pb_count > 1"
            class="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold"
            title="Jumlah PB terkait"
          >
            {{ row.pb_count }} PB
          </span>
        </div>
      </template>

      <!-- Cell: Tanggal -->
      <template #cell-tanggal="{ row }">
        <span class="text-slate-700 whitespace-nowrap">{{ formatDate(row.tanggal) }}</span>
      </template>

      <!-- Cell: No. Tagihan -->
      <template #cell-no_tagihan="{ row }">
        <span class="font-mono text-slate-800 font-medium">{{ row.no_tagihan }}</span>
      </template>

      <!-- Cell: Supplier -->
      <template #cell-nama_suplier="{ row }">
        <span class="font-medium text-slate-900">{{ row.nama_suplier }}</span>
      </template>

      <!-- Cell: Penagih -->
      <template #cell-penagih="{ row }">
        <span class="text-slate-600">{{ row.penagih || '-' }}</span>
      </template>

      <!-- Cell: Metode & Bank -->
      <template #cell-metode_pembayaran="{ row }">
        <div class="text-xs">
          <div class="font-medium text-slate-800">{{ row.metode_pembayaran }}</div>
          <div v-if="row.bank_nama !== '-'" class="text-[11px] text-slate-500">
            {{ row.bank_nama }}
          </div>
        </div>
      </template>

      <!-- Cell: Total Tagihan -->
      <template #cell-total="{ row }">
        <span class="font-mono text-slate-700">{{ formatCurrency(row.total || 0) }}</span>
      </template>

      <!-- Cell: Nominal Bayar -->
      <template #cell-total_bayar="{ row }">
        <span class="font-mono font-semibold text-emerald-700">
          {{ formatCurrency(row.total_bayar || 0) }}
        </span>
      </template>

      <!-- Cell: Status -->
      <template #cell-status="{ row }">
        <BillPaymentStatusBadge :status="row.status" :status-aktif="row.status_aktif" />
      </template>

      <!-- Cell: Actions -->
      <template #actions="{ row }">
        <div class="flex items-center justify-end gap-1">
          <!-- Detail Button -->
          <button
            type="button"
            class="p-1 text-slate-400 hover:text-teal-600 hover:bg-slate-100 rounded transition-colors"
            title="Lihat Detail Pembayaran"
            @click="navigateToDetail(row)"
          >
            <Eye class="w-4 h-4" />
          </button>

          <!-- Edit Button -->
          <button
            v-if="canUpdate && row.status_aktif === 1"
            type="button"
            class="p-1 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded transition-colors"
            title="Edit Pembayaran"
            @click="navigateToEdit(row)"
          >
            <Edit2 class="w-4 h-4" />
          </button>

          <!-- Audit Trail Button -->
          <button
            type="button"
            class="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
            title="Lihat Audit Trail"
            @click="navigateToAudit(row)"
          >
            <History class="w-4 h-4" />
          </button>

          <!-- Cancel/Delete Button -->
          <button
            v-if="canDelete && row.status_aktif === 1"
            type="button"
            class="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors"
            title="Batalkan Pembayaran"
            @click="confirmDelete(row)"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </template>
    </AppDataTable>

    <!-- Cancel Confirmation Modal with Reason Input -->
    <AppModal
      v-model="isDeleteDialogOpen"
      title="Batalkan Pembayaran Tagihan?"
      size="md"
    >
      <div class="space-y-4">
        <div class="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
          <AlertTriangle class="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <div class="font-semibold text-rose-950 mb-1">Peringatan Pembatalan Transaksi</div>
            <div>
              Apakah Anda yakin ingin membatalkan pembayaran <strong>{{ deleteTarget?.kode }}</strong>? Dokumen yang dibatalkan tidak akan diperhitungkan dalam saldo pembayaran dan jurnal akuntansi terkait akan dinonaktifkan secara otomatis.
            </div>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Alasan Pembatalan <span class="text-rose-500">*</span>
          </label>
          <textarea
            v-model="deleteReason"
            rows="3"
            class="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-rose-500 focus:outline-none"
            placeholder="Tuliskan alasan pembatalan pembayaran (minimal 3 karakter)..."
          ></textarea>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <AppButton
            variant="outline"
            size="md"
            :disabled="isDeleting"
            @click="isDeleteDialogOpen = false"
          >
            Kembali
          </AppButton>
          <AppButton
            variant="danger"
            size="md"
            :loading="isDeleting"
            :disabled="!deleteReason.trim() || deleteReason.trim().length < 3"
            @click="handleDelete"
          >
            Ya, Batalkan
          </AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
