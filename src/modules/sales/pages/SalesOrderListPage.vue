<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppDataTable from '@/shared/components/data/AppDataTable.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import SalesOrderActionsMenu from '../components/SalesOrderActionsMenu.vue'
import SalesOrderHistoryModal from '../components/SalesOrderHistoryModal.vue'
import SalesOrderEditDateModal from '../components/SalesOrderEditDateModal.vue'
import SalesOrderCodeTemplateModal from '../components/SalesOrderCodeTemplateModal.vue'
import { salesOrderTransactionService } from '../services/sales-order-transaction.service'
import { deliveryNoteService } from '@/modules/delivery/services/delivery-note.service'
import type {
  SalesOrderListItem,
  SalesOrderVariantKey,
  SalesPerson
} from '../types/sales-order.types'
import { getVariantConfig } from '../config/sales-order-variants'
import type { TableColumn, TableSortState } from '@/shared/types/table.types'
import { usePermission } from '@/shared/composables/usePermission'
import { useToast } from '@/shared/composables/useToast'
import { formatCurrency, formatDate, formatNumber } from '@/shared/utils/formatters'
import { exportSalesOrderListExcel, exportSalesOrderListPdf } from '../utils/sales-order-export'
import { formatPaymentStatusLabel, getPaymentStatusBadgeClass } from '../utils/sales-order-calculations'
import {
  Plus,
  Search,
  FileSpreadsheet,
  FileText,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Wallet,
  Settings
} from 'lucide-vue-next'

const props = defineProps<{
  variant?: SalesOrderVariantKey
}>()

const router = useRouter()
const route = useRoute()
const { hasPermission } = usePermission()
const toast = useToast()

// Determine active variant from props or route path
const currentVariant = computed<SalesOrderVariantKey>(() => {
  if (props.variant) return props.variant
  const path = route.path
  if (path.includes('so-pola') || path.includes('/orders/pola')) return 'pola'
  if (path.includes('so-ks') || path.includes('/orders/ks')) return 'ks'
  return 'impact'
})

const cfg = computed(() => getVariantConfig(currentVariant.value))

const canCreate = computed(() => hasPermission('sales', 'create'))

// Data table state
const items = ref<SalesOrderListItem[]>([])
const salesPersons = ref<SalesPerson[]>([])
const isLoading = ref(true)
const totalItems = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const sortBy = ref('created_at')
const sortOrder = ref<'asc' | 'desc'>('desc')
const isCodeTemplateModalOpen = ref(false)

// Filter state
const filters = reactive({
  search: '',
  sales_id: 'all',
  status: 'all',
  payment_status: 'all',
  start_date: '',
  end_date: ''
})

// Metrics computation
const totalOrdersCount = computed(() => items.value.length)
const totalTransactionsValue = computed(() =>
  items.value.reduce((sum, item) => sum + item.total, 0)
)
const draftCount = computed(() => items.value.filter(i => i.status === 0).length)
const succeededCount = computed(() => items.value.filter(i => i.status === 1).length)

// Columns definition
const columns = computed<TableColumn<SalesOrderListItem>[]>(() => {
  const cols: TableColumn<SalesOrderListItem>[] = [
    {
      key: 'kode',
      label: 'No. Sales Order',
      sortable: true,
      minWidth: '150px'
    }
  ]

  if (cfg.value.hasTax) {
    cols.push({
      key: 'no_faktur_pajak',
      label: 'No. Faktur Pajak',
      sortable: true,
      minWidth: '150px'
    })
  }

  cols.push(
    {
      key: 'tanggal',
      label: 'Tanggal',
      sortable: true,
      minWidth: '120px'
    },
    {
      key: 'customer_nama',
      label: 'Customer',
      sortable: true,
      minWidth: '170px'
    },
    {
      key: 'sales_nama',
      label: 'Salesman',
      sortable: true,
      minWidth: '130px'
    },
    {
      key: 'total',
      label: 'Total Nilai',
      sortable: true,
      align: 'right',
      minWidth: '140px'
    },
    {
      key: 'payment_status',
      label: 'Pembayaran',
      sortable: true,
      minWidth: '120px'
    },
    {
      key: 'status',
      label: 'Status Dokumen',
      sortable: true,
      minWidth: '130px'
    },
    {
      key: 'actions',
      label: 'Aksi',
      align: 'right',
      minWidth: '180px'
    }
  )

  return cols
})

// Delete Dialog State
const isDeleteDialogOpen = ref(false)
const selectedOrder = ref<SalesOrderListItem | null>(null)
const isDeleting = ref(false)

async function loadData(): Promise<void> {
  isLoading.value = true
  try {
    const [ordersResult, salesList] = await Promise.all([
      salesOrderTransactionService.getAll({
        variant: currentVariant.value,
        search: filters.search || undefined,
        sales_id: filters.sales_id !== 'all' ? Number(filters.sales_id) : undefined,
        status: filters.status !== 'all' ? Number(filters.status) : undefined,
        payment_status: filters.payment_status !== 'all' ? filters.payment_status : undefined,
        startDate: filters.start_date || undefined,
        endDate: filters.end_date || undefined,
        page: currentPage.value,
        limit: pageSize.value,
        sortBy: sortBy.value,
        sortOrder: sortOrder.value
      }),
      salesOrderTransactionService.getSalesPersons()
    ])

    items.value = ordersResult.data
    totalItems.value = ordersResult.total
    salesPersons.value = salesList
  } catch (error) {
    toast.error('Gagal memuat daftar Sales Order.')
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

watch(
  () => currentVariant.value,
  () => {
    currentPage.value = 1
    loadData()
  }
)

function handleSortChange(sort: TableSortState): void {
  sortBy.value = sort.key
  sortOrder.value = sort.direction || 'desc'
  loadData()
}

function handlePageChange(page: number): void {
  currentPage.value = page
  loadData()
}

function handlePageSizeChange(size: number): void {
  pageSize.value = size
  currentPage.value = 1
  loadData()
}

function resetFilters(): void {
  filters.search = ''
  filters.sales_id = 'all'
  filters.status = 'all'
  filters.payment_status = 'all'
  filters.start_date = ''
  filters.end_date = ''
  currentPage.value = 1
  loadData()
}

function openCreate(): void {
  router.push(`${cfg.value.routePrefix}/create`)
}

function openDetail(id: number): void {
  router.push(`${cfg.value.routePrefix}/${id}`)
}

function openEdit(id: number): void {
  router.push(`${cfg.value.routePrefix}/${id}/edit`)
}

// Actions Modals State
const isHistoryModalOpen = ref(false)
const isEditDateModalOpen = ref(false)
const selectedOrderForModal = ref<SalesOrderListItem | null>(null)

function handleHistory(order: SalesOrderListItem): void {
  selectedOrderForModal.value = order
  isHistoryModalOpen.value = true
}

function handleEditDate(order: SalesOrderListItem): void {
  selectedOrderForModal.value = order
  isEditDateModalOpen.value = true
}

function handleView(order: SalesOrderListItem): void {
  openDetail(order.id)
}

function handleInvoice(order: SalesOrderListItem): void {
  router.push(`${cfg.value.routePrefix}/${order.id}/invoices`)
}

async function handlePrintDelivery(order: SalesOrderListItem): Promise<void> {
  try {
    const deliveries = await deliveryNoteService.getDeliveryNotesByOrderId(order.id)
    if (deliveries.length > 0) {
      router.push(`/delivery/notes/${deliveries[0].id}/print`)
    } else {
      router.push(`/delivery/notes/create?soId=${order.id}`)
    }
  } catch (err) {
    console.error(err)
    router.push(`/delivery/notes/create?soId=${order.id}`)
  }
}

function handleEdit(order: SalesOrderListItem): void {
  openEdit(order.id)
}

function promptDelete(order: SalesOrderListItem): void {
  selectedOrder.value = order
  isDeleteDialogOpen.value = true
}

async function confirmDelete(): Promise<void> {
  if (!selectedOrder.value) return
  isDeleting.value = true
  try {
    const success = await salesOrderTransactionService.cancelOrder(
      selectedOrder.value.id,
      selectedOrder.value.variant,
      'Dibatalkan melalui menu aksi daftar Sales Order'
    )
    if (success) {
      toast.success(`Transaksi Sales Order ${selectedOrder.value.kode} berhasil dibatalkan.`)
      isDeleteDialogOpen.value = false
      selectedOrder.value = null
      loadData()
    } else {
      toast.error('Gagal membatalkan Sales Order.')
    }
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan saat membatalkan.')
  } finally {
    isDeleting.value = false
  }
}

function handleExportExcel(): void {
  try {
    exportSalesOrderListExcel(items.value, currentVariant.value)
    toast.success('Daftar Sales Order berhasil diekspor ke Excel.')
  } catch (error) {
    toast.error('Gagal mengekspor data ke Excel.')
    console.error(error)
  }
}

function handleExportPdf(): void {
  try {
    exportSalesOrderListPdf(items.value, currentVariant.value)
    toast.success('Daftar Sales Order berhasil diekspor ke PDF.')
  } catch (error) {
    toast.error('Gagal mengekspor data ke PDF.')
    console.error(error)
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header with Dynamic Title & Actions -->
    <AppPageHeader :title="cfg.label" :subtitle="cfg.subTitle">
      <template #breadcrumb>
        <div class="flex items-center gap-2 text-xs text-slate-500">
          <span>Penjualan</span>
          <span>/</span>
          <span class="font-medium text-slate-700">{{ cfg.shortLabel }}</span>
        </div>
      </template>

      <template #actions>
        <div class="flex flex-wrap items-center gap-2">
          <AppButton
            variant="outline"
            size="sm"
            :disabled="isLoading || items.length === 0"
            @click="handleExportExcel"
          >
            <template #iconLeft>
              <FileSpreadsheet class="w-4 h-4 text-emerald-600" />
            </template>
            Export Excel
          </AppButton>

          <AppButton
            variant="outline"
            size="sm"
            :disabled="isLoading || items.length === 0"
            @click="handleExportPdf"
          >
            <template #iconLeft>
              <FileText class="w-4 h-4 text-rose-600" />
            </template>
            Export PDF
          </AppButton>

          <AppButton
            variant="outline"
            size="sm"
            @click="isCodeTemplateModalOpen = true"
          >
            <template #iconLeft>
              <Settings class="w-4 h-4 text-slate-600" />
            </template>
            Template Kode
          </AppButton>

          <AppButton v-if="canCreate" variant="primary" size="sm" @click="openCreate">
            <template #iconLeft>
              <Plus class="w-4 h-4" />
            </template>
            Tambah {{ cfg.shortLabel }}
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <!-- KPI Metric Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4"
      >
        <div
          class="w-12 h-12 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0"
        >
          <ShoppingBag class="w-6 h-6 text-teal-600" />
        </div>
        <div>
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Pesanan</p>
          <p class="text-xl font-bold text-slate-800 mt-0.5">
            {{ formatNumber(totalOrdersCount) }}
            <span class="text-xs font-normal text-slate-400">SO</span>
          </p>
        </div>
      </div>

      <div
        class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4"
      >
        <div
          class="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0"
        >
          <Wallet class="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Nilai Transaksi</p>
          <p class="text-xl font-bold text-slate-800 mt-0.5 font-mono">
            {{ formatCurrency(totalTransactionsValue) }}
          </p>
        </div>
      </div>

      <div
        class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4"
      >
        <div
          class="w-12 h-12 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0"
        >
          <Clock class="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Draft / Belum Post
          </p>
          <p class="text-xl font-bold text-slate-800 mt-0.5">
            {{ formatNumber(draftCount) }}
            <span class="text-xs font-normal text-slate-400">Dokumen</span>
          </p>
        </div>
      </div>

      <div
        class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4"
      >
        <div
          class="w-12 h-12 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0"
        >
          <CheckCircle2 class="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Succeeded / Posted
          </p>
          <p class="text-xl font-bold text-slate-800 mt-0.5">
            {{ formatNumber(succeededCount) }}
            <span class="text-xs font-normal text-slate-400">Dokumen</span>
          </p>
        </div>
      </div>
    </div>

    <!-- Filter Card -->
    <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <!-- Search -->
        <div class="lg:col-span-2">
          <label class="block text-xs font-medium text-slate-600 mb-1"
            >Cari No. SO / Customer</label
          >
          <div class="relative">
            <input
              v-model="filters.search"
              type="text"
              placeholder="Ketik nomor SO atau customer..."
              class="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 pl-9 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
              @keyup.enter="loadData"
            />
            <Search class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <!-- Salesman Filter -->
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Salesman</label>
          <select
            v-model="filters.sales_id"
            class="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
            @change="loadData"
          >
            <option value="all">Semua Salesman</option>
            <option value="0">Tanpa Sales</option>
            <option v-for="s in salesPersons" :key="s.id" :value="String(s.id)">
              {{ s.nama }}
            </option>
          </select>
        </div>

        <!-- Payment Status Filter -->
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Status Bayar</label>
          <select
            v-model="filters.payment_status"
            class="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
            @change="loadData"
          >
            <option value="all">Semua Status</option>
            <option value="Belum Bayar">Belum Bayar</option>
            <option value="Terbayar Sebagian">Terbayar Sebagian</option>
            <option value="Terbayar">Terbayar</option>
          </select>
        </div>

        <!-- Document Status Filter -->
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Status Dokumen</label>
          <select
            v-model="filters.status"
            class="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
            @change="loadData"
          >
            <option value="all">Semua Dokumen</option>
            <option value="0">Draft</option>
            <option value="1">Succeeded</option>
          </select>
        </div>

        <!-- Reset Button -->
        <div class="flex items-end">
          <AppButton variant="ghost" size="sm" class="w-full text-slate-600" @click="resetFilters">
            Reset Filter
          </AppButton>
        </div>
      </div>
    </div>

    <!-- Data Table Card -->
    <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <AppDataTable
        :columns="columns"
        :data="items"
        :loading="isLoading"
        :paginated="true"
        :current-page="currentPage"
        :page-size="pageSize"
        :total-items="totalItems"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        :client-sort="false"
        :client-pagination="false"
        empty-title="Belum Ada Transaksi Sales Order"
        :empty-description="`Belum ada data untuk varian ${cfg.label}. Silakan tambah data baru.`"
        @sort="handleSortChange"
        @sort-change="handleSortChange"
        @update:current-page="handlePageChange"
        @update:page-size="handlePageSizeChange"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      >
        <!-- Kode SO Column -->
        <template #cell-kode="{ row }">
          <button
            class="font-mono font-bold text-xs text-teal-700 hover:text-teal-900 hover:underline text-left"
            @click="openDetail(row.id)"
          >
            {{ row.kode }}
          </button>
        </template>

        <!-- No Faktur Pajak Column -->
        <template #cell-no_faktur_pajak="{ row }">
          <span class="font-mono text-xs text-slate-600">
            {{ row.no_faktur_pajak || '-' }}
          </span>
        </template>

        <!-- Tanggal Column -->
        <template #cell-tanggal="{ row }">
          <span class="text-xs text-slate-600">{{ formatDate(row.tanggal) }}</span>
        </template>

        <!-- Customer Column -->
        <template #cell-customer_nama="{ row }">
          <span class="text-xs font-medium text-slate-800">{{ row.customer_nama }}</span>
        </template>

        <!-- Salesman Column -->
        <template #cell-sales_nama="{ row }">
          <span class="text-xs text-slate-600">{{ row.sales_nama }}</span>
        </template>

        <!-- Total Column -->
        <template #cell-total="{ row }">
          <span class="text-xs font-mono font-bold text-slate-800">
            {{ formatCurrency(row.total) }}
          </span>
        </template>

        <!-- Status Pembayaran Column -->
        <template #cell-payment_status="{ row }">
          <span
            class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium"
            :class="getPaymentStatusBadgeClass(row.payment_status)"
          >
            {{ formatPaymentStatusLabel(row.payment_status) }}
          </span>
        </template>

        <!-- Status Dokumen Column -->
        <template #cell-status="{ row }">
          <span
            class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium"
            :class="{
              'bg-emerald-100 text-emerald-800': row.status === 1,
              'bg-slate-100 text-slate-700': row.status === 0
            }"
          >
            {{ row.status === 1 ? 'Succeeded' : 'Draft' }}
          </span>
        </template>

        <!-- Actions Column (Dropdown matching legacy screenshot) -->
        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end">
            <SalesOrderActionsMenu
              :order="row"
              @history="handleHistory"
              @edit-date="handleEditDate"
              @view="handleView"
              @invoice="handleInvoice"
              @print-delivery="handlePrintDelivery"
              @edit="handleEdit"
              @cancel="promptDelete"
            />
          </div>
        </template>
      </AppDataTable>
    </div>

    <!-- History Sales Order Modal -->
    <SalesOrderHistoryModal v-model:is-open="isHistoryModalOpen" :order="selectedOrderForModal" />

    <!-- Edit Tanggal Modal -->
    <SalesOrderEditDateModal
      v-model:is-open="isEditDateModalOpen"
      :order="selectedOrderForModal"
      @success="loadData"
    />

    <!-- Code Templates Settings Modal -->
    <SalesOrderCodeTemplateModal
      v-model="isCodeTemplateModalOpen"
      @saved="loadData"
    />

    <!-- Confirm Cancel Transaction Dialog -->
    <AppConfirmDialog
      v-model:is-open="isDeleteDialogOpen"
      title="Batalkan Transaksi Sales Order"
      :message="`Apakah Anda yakin ingin membatalkan transaksi ${selectedOrder?.kode}? Transaksi yang dibatalkan tidak akan dapat diproses ke tahap produksi atau invoice.`"
      confirm-text="Batalkan Transaksi"
      cancel-text="Tutup"
      variant="danger"
      :loading="isDeleting"
      @confirm="confirmDelete"
    />
  </div>
</template>
