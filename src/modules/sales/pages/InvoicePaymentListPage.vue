<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  CreditCard,
  Plus,
  Search,
  FileSpreadsheet,
  FileText,
  Receipt,
  Eye,
  Edit2,
  Printer,
  XCircle,
  AlertCircle
} from 'lucide-vue-next'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppSkeleton from '@/shared/components/ui/AppSkeleton.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import SalesInvoiceDetailModal from '../components/SalesInvoiceDetailModal.vue'
import SalesInvoicePrintModal from '../components/SalesInvoicePrintModal.vue'
import SalesInvoicePaymentReceiptModal from '../components/SalesInvoicePaymentReceiptModal.vue'
import { salesPaymentService } from '../services/sales-payment.service'
import type { SalesPayment } from '../types/sales-payment.types'
import type { SalesInvoiceListItem } from '../types/sales-invoice.types'
import type { SalesOrderVariantKey } from '../config/sales-order-variants'
import { formatCurrency } from '@/shared/utils/formatters'
import { exportToExcel } from '@/shared/utils/excel-export'
import { exportToPdf } from '@/shared/utils/pdf-export'
import { useToast } from '@/shared/composables/useToast'
import { usePermission } from '@/shared/composables/usePermission'

const router = useRouter()
const toast = useToast()
const { hasPermission } = usePermission()

const canCreate = computed(() => hasPermission('sales', 'create'))
const canUpdate = computed(() => hasPermission('sales', 'update'))
const canDelete = computed(() => hasPermission('sales', 'delete'))

// Active Tab: 'invoices' (Mode A: Daftar Tagihan Invoice) | 'payments' (Mode B: Riwayat Transaksi Pembayaran)
const activeTab = ref<'invoices' | 'payments'>('invoices')

// Loading state
const isLoading = ref(true)

// ==========================================
// MODE A: DAFTAR INVOICE / TAGIHAN
// ==========================================
const invoices = ref<SalesInvoiceListItem[]>([])
const invoiceSearch = ref('')
const invoiceVariantFilter = ref<string>('ALL')
const invoiceStatusFilter = ref<string>('ALL')
const invoiceDateFrom = ref('')
const invoiceDateTo = ref('')
const selectedInvoiceIds = ref<number[]>([])

// Mode A Pagination
const invoicePage = ref(1)
const invoicePageSize = ref(10)

// Modals for Mode A
const isInvoiceDetailModalOpen = ref(false)
const isInvoicePrintModalOpen = ref(false)
const selectedInvoiceForModal = ref<SalesInvoiceListItem | null>(null)
const selectedInvoiceVariant = ref<SalesOrderVariantKey>('impact')

// ==========================================
// MODE B: RIWAYAT TRANSAKSI PEMBAYARAN
// ==========================================
const payments = ref<SalesPayment[]>([])
const paymentSearch = ref('')
const paymentMetodeFilter = ref<string>('ALL')
const paymentStatusFilter = ref<number>(-1)
const paymentDateFrom = ref('')
const paymentDateTo = ref('')

// Mode B Pagination
const paymentPage = ref(1)
const paymentPageSize = ref(10)

// Modals for Mode B
const isReceiptModalOpen = ref(false)
const selectedPaymentForReceipt = ref<SalesPayment | null>(null)
const isCancelModalOpen = ref(false)
const paymentToCancel = ref<SalesPayment | null>(null)
const cancelReason = ref('')
const isCancelling = ref(false)

// ==========================================
// DATA FETCHING
// ==========================================
const loadData = async () => {
  isLoading.value = true
  try {
    const [invList, payList] = await Promise.all([
      salesPaymentService.getAllInvoicesForListing(),
      salesPaymentService.getAllPayments()
    ])
    invoices.value = invList
    payments.value = payList
  } catch (err) {
    console.error('Failed to load invoice payment data:', err)
    toast.error('Gagal memuat data pembayaran invoice.')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

// ==========================================
// COMPUTED & FILTERS: MODE A (INVOICES)
// ==========================================
const filteredInvoices = computed(() => {
  return invoices.value.filter(inv => {
    // Search
    if (invoiceSearch.value.trim()) {
      const q = invoiceSearch.value.toLowerCase().trim()
      const match =
        inv.kode.toLowerCase().includes(q) ||
        inv.so_kode.toLowerCase().includes(q) ||
        inv.customer_nama.toLowerCase().includes(q)
      if (!match) return false
    }

    // Variant
    if (invoiceVariantFilter.value !== 'ALL' && inv.so_variant !== invoiceVariantFilter.value) {
      return false
    }

    // Status Pembayaran
    if (
      invoiceStatusFilter.value !== 'ALL' &&
      inv.status_pembayaran !== invoiceStatusFilter.value
    ) {
      return false
    }

    // Dates
    if (invoiceDateFrom.value && inv.tanggal < invoiceDateFrom.value) return false
    if (invoiceDateTo.value && inv.tanggal > invoiceDateTo.value) return false

    return true
  })
})

const paginatedInvoices = computed(() => {
  const start = (invoicePage.value - 1) * invoicePageSize.value
  return filteredInvoices.value.slice(start, start + invoicePageSize.value)
})

const totalInvoicePages = computed(() => {
  return Math.max(1, Math.ceil(filteredInvoices.value.length / invoicePageSize.value))
})

const invoiceKpi = computed(() => {
  const active = invoices.value.filter(i => i.status === 1)
  const totalTagihan = active.reduce((s, i) => s + i.total, 0)
  const totalTerbayar = active.reduce((s, i) => s + (i.terbayar || 0), 0)
  const totalSisa = active.reduce((s, i) => s + Math.max(0, i.sisa_pembayaran), 0)
  const countBelumLunas = active.filter(i => i.status_pembayaran !== 'LUNAS').length

  return { totalTagihan, totalTerbayar, totalSisa, countBelumLunas }
})

// Bulk Checkbox Mode A
const isAllInvoicesSelected = computed(() => {
  return (
    paginatedInvoices.value.length > 0 &&
    paginatedInvoices.value.every(i => selectedInvoiceIds.value.includes(i.id))
  )
})

const toggleSelectAllInvoices = () => {
  if (isAllInvoicesSelected.value) {
    selectedInvoiceIds.value = selectedInvoiceIds.value.filter(
      id => !paginatedInvoices.value.some(i => i.id === id)
    )
  } else {
    const pageIds = paginatedInvoices.value.map(i => i.id)
    selectedInvoiceIds.value = Array.from(new Set([...selectedInvoiceIds.value, ...pageIds]))
  }
}

// ==========================================
// COMPUTED & FILTERS: MODE B (PAYMENTS)
// ==========================================
const filteredPayments = computed(() => {
  return payments.value.filter(p => {
    // Search
    if (paymentSearch.value.trim()) {
      const q = paymentSearch.value.toLowerCase().trim()
      const match =
        p.kode.toLowerCase().includes(q) ||
        p.invoice_kode.toLowerCase().includes(q) ||
        p.so_kode.toLowerCase().includes(q) ||
        p.customer_nama.toLowerCase().includes(q) ||
        (p.bukti_bayar && p.bukti_bayar.toLowerCase().includes(q))
      if (!match) return false
    }

    // Metode
    if (paymentMetodeFilter.value !== 'ALL' && p.metode_pembayaran !== paymentMetodeFilter.value) {
      return false
    }

    // Status
    if (paymentStatusFilter.value !== -1 && p.status !== paymentStatusFilter.value) {
      return false
    }

    // Dates
    if (paymentDateFrom.value && p.tanggal < paymentDateFrom.value) return false
    if (paymentDateTo.value && p.tanggal > paymentDateTo.value) return false

    return true
  })
})

const paginatedPayments = computed(() => {
  const start = (paymentPage.value - 1) * paymentPageSize.value
  return filteredPayments.value.slice(start, start + paymentPageSize.value)
})

const totalPaymentPages = computed(() => {
  return Math.max(1, Math.ceil(filteredPayments.value.length / paymentPageSize.value))
})

const paymentKpi = computed(() => {
  const activePayments = payments.value.filter(p => p.status === 1)
  const totalMasuk = activePayments.reduce((s, p) => s + p.jumlah, 0)
  const countBerhasil = activePayments.length
  const countBatal = payments.value.filter(p => p.status === 0).length
  const rataRata = countBerhasil > 0 ? Math.round(totalMasuk / countBerhasil) : 0

  return { totalMasuk, countBerhasil, countBatal, rataRata }
})

// ==========================================
// ACTIONS: NAVIGATION & MODALS
// ==========================================
const handleGoToCreatePayment = (invoiceId?: number) => {
  if (invoiceId) {
    router.push({
      path: '/sales/invoice-payments/create',
      query: { invoiceId: String(invoiceId) }
    })
  } else {
    router.push('/sales/invoice-payments/create')
  }
}

const handleViewInvoicePayments = (inv: SalesInvoiceListItem) => {
  router.push(`/sales/invoices/${inv.id}/payments`)
}

const handleOpenInvoiceDetail = (inv: SalesInvoiceListItem) => {
  selectedInvoiceForModal.value = inv
  selectedInvoiceVariant.value = inv.so_variant || 'impact'
  isInvoiceDetailModalOpen.value = true
}

const handleOpenInvoicePrint = (inv: SalesInvoiceListItem) => {
  selectedInvoiceForModal.value = inv
  selectedInvoiceVariant.value = inv.so_variant || 'impact'
  isInvoicePrintModalOpen.value = true
}

const handleViewPaymentDetail = (paymentId: number) => {
  router.push(`/sales/invoice-payments/${paymentId}`)
}

const handleEditPayment = (paymentId: number) => {
  router.push(`/sales/invoice-payments/${paymentId}/edit`)
}

const handleOpenReceipt = (payment: SalesPayment) => {
  selectedPaymentForReceipt.value = payment
  isReceiptModalOpen.value = true
}

const handleInitiateCancel = (payment: SalesPayment) => {
  paymentToCancel.value = payment
  cancelReason.value = ''
  isCancelModalOpen.value = true
}

const handleConfirmCancel = async () => {
  if (!paymentToCancel.value) return
  isCancelling.value = true
  try {
    await salesPaymentService.cancelPayment(paymentToCancel.value.id, cancelReason.value)
    toast.success(`Pembayaran ${paymentToCancel.value.kode} berhasil dibatalkan.`)
    isCancelModalOpen.value = false
    paymentToCancel.value = null
    await loadData()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal membatalkan pembayaran'
    toast.error(msg)
  } finally {
    isCancelling.value = false
  }
}

// ==========================================
// EXPORTS: EXCEL & PDF
// ==========================================
const handleExportExcel = () => {
  if (activeTab.value === 'invoices') {
    const dataToExport = filteredInvoices.value.map((inv, idx) => ({
      no: idx + 1,
      kode_invoice: inv.kode,
      so_kode: inv.so_kode,
      variant: inv.so_variant?.toUpperCase() || 'IMPACT',
      customer: inv.customer_nama,
      tanggal: inv.tanggal,
      total: inv.total,
      terbayar: inv.terbayar || 0,
      sisa: inv.sisa_pembayaran,
      status: inv.status_pembayaran
    }))

    exportToExcel({
      filename: `Daftar_Tagihan_Invoice_${new Date().toISOString().split('T')[0]}`,
      title: 'Daftar Tagihan Sales Invoice',
      columns: [
        { key: 'no', label: 'No' },
        { key: 'kode_invoice', label: 'No Invoice' },
        { key: 'so_kode', label: 'No Sales Order' },
        { key: 'variant', label: 'Jenis SO' },
        { key: 'customer', label: 'Customer' },
        { key: 'tanggal', label: 'Tanggal Invoice' },
        { key: 'total', label: 'Total Tagihan' },
        { key: 'terbayar', label: 'Sudah Dibayar' },
        { key: 'sisa', label: 'Sisa Tagihan' },
        { key: 'status', label: 'Status' }
      ],
      data: dataToExport
    })
  } else {
    const dataToExport = filteredPayments.value.map((p, idx) => ({
      no: idx + 1,
      kode_pembayaran: p.kode,
      tanggal: p.tanggal,
      invoice: p.invoice_kode,
      so: p.so_kode,
      customer: p.customer_nama,
      metode: p.metode_pembayaran,
      bank: p.bank_nama || 'Kas Tunai',
      nominal: p.jumlah,
      status: p.status === 1 ? 'Aktif' : 'Dibatalkan'
    }))

    exportToExcel({
      filename: `Riwayat_Transaksi_Pembayaran_${new Date().toISOString().split('T')[0]}`,
      title: 'Riwayat Transaksi Pembayaran Invoice',
      columns: [
        { key: 'no', label: 'No' },
        { key: 'kode_pembayaran', label: 'Kode Bayar' },
        { key: 'tanggal', label: 'Tanggal Bayar' },
        { key: 'invoice', label: 'No Invoice' },
        { key: 'so', label: 'No SO' },
        { key: 'customer', label: 'Customer' },
        { key: 'metode', label: 'Metode' },
        { key: 'bank', label: 'Bank / Kas' },
        { key: 'nominal', label: 'Nominal' },
        { key: 'status', label: 'Status' }
      ],
      data: dataToExport
    })
  }
}

const handleExportPdf = () => {
  if (activeTab.value === 'invoices') {
    const dataToExport = filteredInvoices.value.map((inv, idx) => ({
      no: idx + 1,
      kode_invoice: inv.kode,
      so_kode: inv.so_kode,
      customer: inv.customer_nama,
      tanggal: inv.tanggal,
      total: formatCurrency(inv.total),
      sisa: formatCurrency(inv.sisa_pembayaran),
      status: inv.status_pembayaran
    }))

    exportToPdf({
      title: 'Laporan Daftar Tagihan Sales Invoice',
      filename: `Laporan_Tagihan_Invoice_${new Date().toISOString().split('T')[0]}.pdf`,
      columns: [
        { key: 'no', label: 'No' },
        { key: 'kode_invoice', label: 'No Invoice' },
        { key: 'so_kode', label: 'No SO' },
        { key: 'customer', label: 'Customer' },
        { key: 'tanggal', label: 'Tanggal' },
        { key: 'total', label: 'Total' },
        { key: 'sisa', label: 'Sisa' },
        { key: 'status', label: 'Status' }
      ],
      data: dataToExport
    })
  } else {
    const dataToExport = filteredPayments.value.map((p, idx) => ({
      no: idx + 1,
      kode_pembayaran: p.kode,
      tanggal: p.tanggal,
      invoice: p.invoice_kode,
      customer: p.customer_nama,
      metode: p.metode_pembayaran,
      nominal: formatCurrency(p.jumlah),
      status: p.status === 1 ? 'Aktif' : 'Batal'
    }))

    exportToPdf({
      title: 'Laporan Riwayat Transaksi Pembayaran Invoice',
      filename: `Laporan_Transaksi_Pembayaran_${new Date().toISOString().split('T')[0]}.pdf`,
      columns: [
        { key: 'no', label: 'No' },
        { key: 'kode_pembayaran', label: 'Kode Bayar' },
        { key: 'tanggal', label: 'Tanggal' },
        { key: 'invoice', label: 'Invoice' },
        { key: 'customer', label: 'Customer' },
        { key: 'metode', label: 'Metode' },
        { key: 'nominal', label: 'Nominal' },
        { key: 'status', label: 'Status' }
      ],
      data: dataToExport
    })
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <AppPageHeader
      title="Pembayaran Sales Invoice"
      description="Pusat pengelolaan tagihan dan transaksi pembayaran invoice pelanggan"
      :breadcrumbs="[
        { label: 'Beranda', to: '/' },
        { label: 'Penjualan', to: '/sales/orders/impact' },
        { label: 'Pembayaran Invoice' }
      ]"
    >
      <template #actions>
        <div class="flex items-center gap-3">
          <AppButton
            variant="outline"
            size="sm"
            data-test="btn-export-excel"
            @click="handleExportExcel"
          >
            <template #icon>
              <FileSpreadsheet class="w-4 h-4 text-emerald-600" />
            </template>
            Excel
          </AppButton>

          <AppButton
            variant="outline"
            size="sm"
            data-test="btn-export-pdf"
            @click="handleExportPdf"
          >
            <template #icon>
              <FileText class="w-4 h-4 text-rose-600" />
            </template>
            PDF
          </AppButton>

          <AppButton
            v-if="canCreate"
            variant="primary"
            size="sm"
            data-test="btn-create-payment"
            class="bg-teal-600 hover:bg-teal-700 text-white"
            @click="() => handleGoToCreatePayment()"
          >
            <template #icon>
              <Plus class="w-4 h-4" />
            </template>
            Catat Pembayaran
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <!-- Navigation Sub-Tabs (Mode Switcher) -->
    <div class="border-b border-slate-200">
      <nav class="-mb-px flex space-x-8" aria-label="Tabs">
        <button
          type="button"
          data-test="tab-mode-invoices"
          :class="[
            'whitespace-nowrap py-3 px-1 border-b-2 font-bold text-sm flex items-center gap-2 transition-colors',
            activeTab === 'invoices'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          ]"
          @click="activeTab = 'invoices'"
        >
          <Receipt class="w-4 h-4" />
          Daftar Tagihan Invoice (Mode A)
          <span
            class="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold"
            :class="
              activeTab === 'invoices' ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-600'
            "
          >
            {{ invoices.length }}
          </span>
        </button>

        <button
          type="button"
          data-test="tab-mode-payments"
          :class="[
            'whitespace-nowrap py-3 px-1 border-b-2 font-bold text-sm flex items-center gap-2 transition-colors',
            activeTab === 'payments'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          ]"
          @click="activeTab = 'payments'"
        >
          <CreditCard class="w-4 h-4" />
          Riwayat Transaksi Pembayaran (Mode B)
          <span
            class="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold"
            :class="
              activeTab === 'payments' ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-600'
            "
          >
            {{ payments.length }}
          </span>
        </button>
      </nav>
    </div>

    <!-- ========================================================================= -->
    <!-- TAB 1: MODE A - DAFTAR TAGIHAN INVOICE (DEFAULT)                          -->
    <!-- ========================================================================= -->
    <div v-if="activeTab === 'invoices'" class="space-y-6 animate-in fade-in duration-150">
      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs font-semibold text-slate-500 uppercase block">Total Tagihan</span>
          <div class="text-xl font-extrabold text-slate-900 mt-1">
            {{ formatCurrency(invoiceKpi.totalTagihan) }}
          </div>
          <span class="text-[11px] text-slate-400 mt-1 block">Akumulasi seluruh invoice aktif</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs font-semibold text-slate-500 uppercase block">Sudah Dibayar</span>
          <div class="text-xl font-extrabold text-emerald-600 mt-1">
            {{ formatCurrency(invoiceKpi.totalTerbayar) }}
          </div>
          <span class="text-[11px] text-slate-400 mt-1 block">Penerimaan pembayaran riil</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs font-semibold text-slate-500 uppercase block">Sisa Tagihan</span>
          <div class="text-xl font-extrabold text-rose-600 mt-1">
            {{ formatCurrency(invoiceKpi.totalSisa) }}
          </div>
          <span class="text-[11px] text-slate-400 mt-1 block">Piutang yang belum dilunasi</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs font-semibold text-slate-500 uppercase block"
            >Invoice Belum Lunas</span
          >
          <div class="text-xl font-extrabold text-amber-600 mt-1">
            {{ invoiceKpi.countBelumLunas }}
            <span class="text-xs font-normal text-slate-400">Invoice</span>
          </div>
          <span class="text-[11px] text-slate-400 mt-1 block">Perlu tindak lanjut penagihan</span>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <!-- Search -->
          <div class="relative md:col-span-2">
            <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              v-model="invoiceSearch"
              type="text"
              data-test="input-search-invoice"
              placeholder="Cari No Invoice, No SO, Customer..."
              class="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          <!-- Variant Filter -->
          <div>
            <select
              v-model="invoiceVariantFilter"
              data-test="select-filter-variant"
              class="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
            >
              <option value="ALL">Semua Jenis SO</option>
              <option value="impact">SO Impact (PPN)</option>
              <option value="pola">SO Pola (Non-PPN)</option>
              <option value="ks">SO KS (Non-PPN)</option>
            </select>
          </div>

          <!-- Status Pembayaran Filter -->
          <div>
            <select
              v-model="invoiceStatusFilter"
              data-test="select-filter-status"
              class="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
            >
              <option value="ALL">Semua Status Pembayaran</option>
              <option value="BELUM_BAYAR">Belum Bayar</option>
              <option value="SEBAGIAN">Dibayar Sebagian</option>
              <option value="LUNAS">Lunas</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Mode A: 13-Column DataTable -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div v-if="isLoading" class="p-8 space-y-4">
          <AppSkeleton height="40px" />
          <AppSkeleton height="40px" />
          <AppSkeleton height="40px" />
        </div>

        <div v-else-if="filteredInvoices.length === 0" class="p-12 text-center">
          <AlertCircle class="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 class="text-sm font-bold text-slate-700">Tidak ada tagihan invoice ditemukan</h3>
          <p class="text-xs text-slate-400 mt-1">
            Ubah filter pencarian Anda atau buat invoice baru pada modul Sales Order.
          </p>
        </div>

        <div v-else class="overflow-x-auto">
          <table data-test="table-invoices" class="w-full text-left border-collapse text-xs">
            <thead>
              <tr
                class="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider"
              >
                <th class="py-3 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    :checked="isAllInvoicesSelected"
                    class="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    @change="toggleSelectAllInvoices"
                  />
                </th>
                <th class="py-3 px-2 w-10 text-center">No</th>
                <th class="py-3 px-3">Kode Invoice</th>
                <th class="py-3 px-3">No. SO</th>
                <th class="py-3 px-3">Jenis SO</th>
                <th class="py-3 px-3">Customer</th>
                <th class="py-3 px-3">Tanggal</th>
                <th class="py-3 px-3 text-right">Total Tagihan</th>
                <th class="py-3 px-3 text-right">Sudah Dibayar</th>
                <th class="py-3 px-3 text-right">Sisa Tagihan</th>
                <th class="py-3 px-3 text-center">Status</th>
                <th class="py-3 px-2 text-center">Jml Bayar</th>
                <th class="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-normal text-slate-700">
              <tr
                v-for="(inv, idx) in paginatedInvoices"
                :key="inv.id"
                class="hover:bg-slate-50/80 transition-colors"
                :class="{ 'opacity-60 bg-slate-50': inv.status === 0 }"
              >
                <!-- 1. Checkbox -->
                <td class="py-3 px-3 text-center">
                  <input
                    v-model="selectedInvoiceIds"
                    type="checkbox"
                    :value="inv.id"
                    class="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                </td>

                <!-- 2. No -->
                <td class="py-3 px-2 text-center text-slate-400 font-mono">
                  {{ (invoicePage - 1) * invoicePageSize + idx + 1 }}
                </td>

                <!-- 3. Kode Invoice -->
                <td class="py-3 px-3 font-bold text-slate-900 font-mono">
                  {{ inv.kode }}
                </td>

                <!-- 4. No SO -->
                <td class="py-3 px-3 font-mono text-slate-600">
                  {{ inv.so_kode }}
                </td>

                <!-- 5. Jenis SO -->
                <td class="py-3 px-3">
                  <span
                    :class="[
                      'px-2 py-0.5 text-[10px] font-bold rounded-full',
                      inv.so_variant === 'impact'
                        ? 'bg-teal-50 text-teal-700 border border-teal-200'
                        : inv.so_variant === 'pola'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                    ]"
                  >
                    {{
                      inv.so_variant === 'impact'
                        ? 'SO Impact'
                        : inv.so_variant === 'pola'
                          ? 'SO Pola'
                          : 'SO KS'
                    }}
                  </span>
                </td>

                <!-- 6. Customer -->
                <td class="py-3 px-3 font-semibold text-slate-800 max-w-[160px] truncate">
                  {{ inv.customer_nama }}
                </td>

                <!-- 7. Tanggal -->
                <td class="py-3 px-3 text-slate-500">
                  {{ inv.tanggal }}
                </td>

                <!-- 8. Total Tagihan -->
                <td class="py-3 px-3 text-right font-medium text-slate-900">
                  {{ formatCurrency(inv.total) }}
                </td>

                <!-- 9. Sudah Dibayar -->
                <td class="py-3 px-3 text-right font-semibold text-emerald-600">
                  {{ formatCurrency(inv.terbayar || 0) }}
                </td>

                <!-- 10. Sisa Tagihan -->
                <td
                  class="py-3 px-3 text-right font-bold"
                  :class="inv.sisa_pembayaran > 0 ? 'text-rose-600' : 'text-slate-400'"
                >
                  {{ formatCurrency(inv.sisa_pembayaran) }}
                </td>

                <!-- 11. Status Pembayaran -->
                <td class="py-3 px-3 text-center">
                  <span
                    :class="[
                      'px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase inline-block',
                      inv.status_pembayaran === 'LUNAS'
                        ? 'bg-emerald-100 text-emerald-800'
                        : inv.status_pembayaran === 'SEBAGIAN'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                    ]"
                  >
                    {{
                      inv.status_pembayaran === 'LUNAS'
                        ? 'Lunas'
                        : inv.status_pembayaran === 'SEBAGIAN'
                          ? 'Sebagian'
                          : 'Belum Bayar'
                    }}
                  </span>
                </td>

                <!-- 12. Jumlah Pembayaran (Count) -->
                <td class="py-3 px-2 text-center">
                  <span
                    class="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700"
                  >
                    {{ inv.payment_count || 0 }}x
                  </span>
                </td>

                <!-- 13. Aksi -->
                <td class="py-3 px-4 text-center">
                  <div class="flex items-center justify-center gap-1.5">
                    <!-- Bayar Button -->
                    <button
                      v-if="canCreate && inv.status === 1 && inv.sisa_pembayaran > 0"
                      type="button"
                      data-test="btn-pay-invoice"
                      title="Bayar Tagihan"
                      class="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
                      @click="() => handleGoToCreatePayment(inv.id)"
                    >
                      <CreditCard class="w-3 h-3" />
                      Bayar
                    </button>

                    <!-- Riwayat Pembayaran -->
                    <button
                      type="button"
                      data-test="btn-history-payments"
                      title="Lihat Riwayat Pembayaran"
                      class="p-1 text-slate-600 hover:text-teal-600 hover:bg-slate-100 rounded transition-colors"
                      @click="() => handleViewInvoicePayments(inv)"
                    >
                      <Receipt class="w-4 h-4" />
                    </button>

                    <!-- Detail Invoice -->
                    <button
                      type="button"
                      data-test="btn-detail-invoice"
                      title="Lihat Detail Invoice"
                      class="p-1 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                      @click="() => handleOpenInvoiceDetail(inv)"
                    >
                      <Eye class="w-4 h-4" />
                    </button>

                    <!-- Cetak Invoice -->
                    <button
                      type="button"
                      data-test="btn-print-invoice"
                      title="Cetak Invoice"
                      class="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                      @click="() => handleOpenInvoicePrint(inv)"
                    >
                      <Printer class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mode A Pagination -->
        <div
          class="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500"
        >
          <div>
            Menampilkan {{ (invoicePage - 1) * invoicePageSize + 1 }} -
            {{ Math.min(invoicePage * invoicePageSize, filteredInvoices.length) }} dari
            {{ filteredInvoices.length }} tagihan invoice
          </div>
          <div class="flex items-center gap-2">
            <button
              :disabled="invoicePage <= 1"
              class="px-2.5 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40"
              @click="invoicePage--"
            >
              Sebelumnya
            </button>
            <span class="font-bold text-slate-700"
              >{{ invoicePage }} / {{ totalInvoicePages }}</span
            >
            <button
              :disabled="invoicePage >= totalInvoicePages"
              class="px-2.5 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40"
              @click="invoicePage++"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- TAB 2: MODE B - RIWAYAT TRANSAKSI PEMBAYARAN                              -->
    <!-- ========================================================================= -->
    <div v-else class="space-y-6 animate-in fade-in duration-150">
      <!-- Mode B KPI Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs font-semibold text-slate-500 uppercase block">Total Penerimaan</span>
          <div class="text-xl font-extrabold text-emerald-600 mt-1">
            {{ formatCurrency(paymentKpi.totalMasuk) }}
          </div>
          <span class="text-[11px] text-slate-400 mt-1 block">Akumulasi pembayaran berhasil</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs font-semibold text-slate-500 uppercase block"
            >Transaksi Berhasil</span
          >
          <div class="text-xl font-extrabold text-slate-900 mt-1">
            {{ paymentKpi.countBerhasil }}
            <span class="text-xs font-normal text-slate-400">Transaksi</span>
          </div>
          <span class="text-[11px] text-slate-400 mt-1 block">Status aktif / terposting</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs font-semibold text-slate-500 uppercase block"
            >Transaksi Dibatalkan</span
          >
          <div class="text-xl font-extrabold text-rose-600 mt-1">
            {{ paymentKpi.countBatal }}
            <span class="text-xs font-normal text-slate-400">Transaksi</span>
          </div>
          <span class="text-[11px] text-slate-400 mt-1 block"
            >Reversal / pembatalan pembayaran</span
          >
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs font-semibold text-slate-500 uppercase block"
            >Rata-rata Pembayaran</span
          >
          <div class="text-xl font-extrabold text-teal-700 mt-1">
            {{ formatCurrency(paymentKpi.rataRata) }}
          </div>
          <span class="text-[11px] text-slate-400 mt-1 block">Rata-rata nominal per transaksi</span>
        </div>
      </div>

      <!-- Mode B Filter Bar -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <!-- Search -->
          <div class="relative md:col-span-2">
            <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              v-model="paymentSearch"
              type="text"
              data-test="input-search-payment"
              placeholder="Cari No Bayar, No Invoice, Customer, No Bukti..."
              class="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          <!-- Metode Filter -->
          <div>
            <select
              v-model="paymentMetodeFilter"
              data-test="select-filter-payment-metode"
              class="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
            >
              <option value="ALL">Semua Metode Pembayaran</option>
              <option value="TRANSFER">Transfer Bank</option>
              <option value="TUNAI">Tunai / Kas</option>
              <option value="CEK/GIRO">Cek / Bilyet Giro</option>
            </select>
          </div>

          <!-- Status Filter -->
          <div>
            <select
              v-model="paymentStatusFilter"
              data-test="select-filter-payment-status"
              class="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
            >
              <option :value="-1">Semua Status</option>
              <option :value="1">Berhasil / Aktif</option>
              <option :value="0">Dibatalkan</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Mode B: 10-Column DataTable -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div v-if="isLoading" class="p-8 space-y-4">
          <AppSkeleton height="40px" />
          <AppSkeleton height="40px" />
        </div>

        <div v-else-if="filteredPayments.length === 0" class="p-12 text-center">
          <AlertCircle class="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 class="text-sm font-bold text-slate-700">Belum ada riwayat transaksi pembayaran</h3>
          <p class="text-xs text-slate-400 mt-1">
            Transaksi pembayaran yang telah dicatat akan tampil secara lengkap di sini.
          </p>
        </div>

        <div v-else class="overflow-x-auto">
          <table data-test="table-payments" class="w-full text-left border-collapse text-xs">
            <thead>
              <tr
                class="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider"
              >
                <th class="py-3 px-3 w-10 text-center">No</th>
                <th class="py-3 px-3">Kode Bayar</th>
                <th class="py-3 px-3">Tanggal Bayar</th>
                <th class="py-3 px-3">Kode Invoice</th>
                <th class="py-3 px-3">Customer</th>
                <th class="py-3 px-3 text-center">Metode</th>
                <th class="py-3 px-3">Bank / Kas</th>
                <th class="py-3 px-3 text-right">Nominal</th>
                <th class="py-3 px-3 text-center">Status</th>
                <th class="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-normal text-slate-700">
              <tr
                v-for="(p, idx) in paginatedPayments"
                :key="p.id"
                class="hover:bg-slate-50/80 transition-colors"
                :class="{ 'opacity-60 bg-slate-50': p.status === 0 }"
              >
                <!-- 1. No -->
                <td class="py-3 px-3 text-center text-slate-400 font-mono">
                  {{ (paymentPage - 1) * paymentPageSize + idx + 1 }}
                </td>

                <!-- 2. Kode Bayar -->
                <td class="py-3 px-3 font-bold text-slate-900 font-mono">
                  {{ p.kode }}
                </td>

                <!-- 3. Tanggal -->
                <td class="py-3 px-3 text-slate-600 font-mono">
                  {{ p.tanggal }}
                </td>

                <!-- 4. Kode Invoice -->
                <td class="py-3 px-3 font-mono text-slate-700">
                  {{ p.invoice_kode }}
                </td>

                <!-- 5. Customer -->
                <td class="py-3 px-3 font-medium text-slate-900 max-w-[160px] truncate">
                  {{ p.customer_nama }}
                </td>

                <!-- 6. Metode -->
                <td class="py-3 px-3 text-center">
                  <span
                    :class="[
                      'px-2 py-0.5 text-[10px] font-bold rounded-full uppercase',
                      p.metode_pembayaran === 'TRANSFER'
                        ? 'bg-blue-100 text-blue-800'
                        : p.metode_pembayaran === 'TUNAI'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-purple-100 text-purple-800'
                    ]"
                  >
                    {{ p.metode_pembayaran }}
                  </span>
                </td>

                <!-- 7. Bank / Kas -->
                <td class="py-3 px-3 text-slate-600">
                  {{ p.bank_nama ? `${p.bank_nama} (${p.bank_rekening || '-'})` : 'Kas Tunai' }}
                </td>

                <!-- 8. Nominal -->
                <td class="py-3 px-3 text-right font-extrabold text-slate-900">
                  {{ formatCurrency(p.jumlah) }}
                </td>

                <!-- 9. Status -->
                <td class="py-3 px-3 text-center">
                  <span
                    :class="[
                      'px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase inline-block',
                      p.status === 1
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    ]"
                  >
                    {{ p.status === 1 ? 'Berhasil' : 'Dibatalkan' }}
                  </span>
                </td>

                <!-- 10. Aksi -->
                <td class="py-3 px-4 text-center">
                  <div class="flex items-center justify-center gap-1.5">
                    <!-- Detail -->
                    <button
                      type="button"
                      data-test="btn-detail-payment"
                      title="Lihat Detail Pembayaran"
                      class="p-1 text-slate-600 hover:text-teal-600 hover:bg-slate-100 rounded transition-colors"
                      @click="() => handleViewPaymentDetail(p.id)"
                    >
                      <Eye class="w-4 h-4" />
                    </button>

                    <!-- Edit -->
                    <button
                      v-if="canUpdate && p.status === 1 && !p.is_posted_to_finance"
                      type="button"
                      data-test="btn-edit-payment"
                      title="Edit Pembayaran"
                      class="p-1 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                      @click="() => handleEditPayment(p.id)"
                    >
                      <Edit2 class="w-4 h-4" />
                    </button>

                    <!-- Cetak Kuitansi -->
                    <button
                      type="button"
                      data-test="btn-receipt-payment"
                      title="Cetak Kuitansi"
                      class="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                      @click="() => handleOpenReceipt(p)"
                    >
                      <Printer class="w-4 h-4" />
                    </button>

                    <!-- Batal -->
                    <button
                      v-if="canDelete && p.status === 1 && !p.is_posted_to_finance"
                      type="button"
                      data-test="btn-cancel-payment"
                      title="Batalkan Pembayaran"
                      class="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      @click="() => handleInitiateCancel(p)"
                    >
                      <XCircle class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mode B Pagination -->
        <div
          class="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500"
        >
          <div>
            Menampilkan {{ (paymentPage - 1) * paymentPageSize + 1 }} -
            {{ Math.min(paymentPage * paymentPageSize, filteredPayments.length) }} dari
            {{ filteredPayments.length }} transaksi pembayaran
          </div>
          <div class="flex items-center gap-2">
            <button
              :disabled="paymentPage <= 1"
              class="px-2.5 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40"
              @click="paymentPage--"
            >
              Sebelumnya
            </button>
            <span class="font-bold text-slate-700"
              >{{ paymentPage }} / {{ totalPaymentPages }}</span
            >
            <button
              :disabled="paymentPage >= totalPaymentPages"
              class="px-2.5 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40"
              @click="paymentPage++"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODALS -->
    <!-- Invoice Detail Modal -->
    <SalesInvoiceDetailModal
      :is-open="isInvoiceDetailModalOpen"
      :invoice="selectedInvoiceForModal"
      :so-kode="selectedInvoiceForModal?.so_kode"
      :customer-nama="selectedInvoiceForModal?.customer_nama"
      @update:is-open="isInvoiceDetailModalOpen = $event"
    />

    <!-- Invoice Print Modal -->
    <SalesInvoicePrintModal
      :is-open="isInvoicePrintModalOpen"
      :invoice="selectedInvoiceForModal"
      :so-kode="selectedInvoiceForModal?.so_kode"
      :customer-nama="selectedInvoiceForModal?.customer_nama"
      :variant="selectedInvoiceVariant"
      @update:is-open="isInvoicePrintModalOpen = $event"
    />

    <!-- Receipt Modal -->
    <SalesInvoicePaymentReceiptModal
      v-model="isReceiptModalOpen"
      :payment="selectedPaymentForReceipt"
    />

    <!-- Cancellation Confirm Dialog -->
    <AppConfirmDialog
      v-model="isCancelModalOpen"
      title="Batalkan Transaksi Pembayaran"
      variant="danger"
      confirm-text="Ya, Batalkan Pembayaran"
      cancel-text="Kembali"
      @cancel="isCancelModalOpen = false"
      @confirm="handleConfirmCancel"
    >
      <div class="space-y-3 text-xs text-slate-600">
        <p>
          Apakah Anda yakin ingin membatalkan pembayaran dengan nomor
          <strong class="font-mono text-slate-900">{{ paymentToCancel?.kode }}</strong>
          sebesar
          <strong class="text-rose-600">{{ formatCurrency(paymentToCancel?.jumlah || 0) }}</strong
          >?
        </p>
        <p class="text-slate-500">
          Saldo tagihan pada Invoice
          <strong class="font-mono">{{ paymentToCancel?.invoice_kode }}</strong>
          dan Sales Order akan dipulihkan secara otomatis.
        </p>

        <div>
          <label class="block text-slate-700 font-semibold mb-1">
            Alasan Pembatalan <span class="text-rose-500">*</span>
          </label>
          <textarea
            v-model="cancelReason"
            rows="2"
            required
            placeholder="Ketik alasan pembatalan pembayaran ini..."
            class="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none resize-none"
          />
        </div>
      </div>
    </AppConfirmDialog>
  </div>
</template>
