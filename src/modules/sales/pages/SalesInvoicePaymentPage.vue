<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  CreditCard,
  ArrowLeft,
  Plus,
  Eye,
  Printer,
  XCircle,
  FileSpreadsheet,
  FileText,
  Search
} from 'lucide-vue-next'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import AppSkeleton from '@/shared/components/ui/AppSkeleton.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import SalesInvoicePaymentCreateModal from '../components/SalesInvoicePaymentCreateModal.vue'
import SalesInvoicePaymentDetailModal from '../components/SalesInvoicePaymentDetailModal.vue'
import SalesInvoicePaymentReceiptModal from '../components/SalesInvoicePaymentReceiptModal.vue'
import { salesPaymentService } from '../services/sales-payment.service'
import { salesInvoiceService } from '../services/sales-invoice.service'
import type { SalesPayment, SalesInvoicePaymentSummary } from '../types/sales-payment.types'
import type { SalesInvoice } from '../types/sales-invoice.types'
import { getVariantConfig, type SalesOrderVariantKey } from '../config/sales-order-variants'
import { formatCurrency } from '@/shared/utils/formatters'
import { exportToExcel } from '@/shared/utils/excel-export'
import { exportToPdf } from '@/shared/utils/pdf-export'
import { useToast } from '@/shared/composables/useToast'
import { usePermission } from '@/shared/composables/usePermission'

const props = withDefaults(
  defineProps<{
    variant?: SalesOrderVariantKey
  }>(),
  {
    variant: 'impact'
  }
)

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { hasPermission } = usePermission()

const canCreate = computed(() => hasPermission('sales', 'create'))
const canDelete = computed(() => hasPermission('sales', 'delete'))

const invoiceId = computed(() => Number(route.params.invoiceId || route.params.id))
const variantCfg = computed(() => getVariantConfig(props.variant))

const summary = ref<SalesInvoicePaymentSummary | null>(null)
const invoiceObj = ref<SalesInvoice | null>(null)
const payments = ref<SalesPayment[]>([])
const isLoading = ref(true)

// Filters
const searchKeyword = ref('')
const statusFilter = ref<string>('')

// Modals
const isCreateModalOpen = ref(false)
const isDetailModalOpen = ref(false)
const isReceiptModalOpen = ref(false)
const selectedPayment = ref<SalesPayment | null>(null)

// Cancel Dialog
const isCancelDialogOpen = ref(false)
const paymentToCancel = ref<SalesPayment | null>(null)
const cancelReason = ref('')
const isCancelling = ref(false)

const filteredPayments = computed(() => {
  return payments.value.filter(p => {
    // Search filter
    if (searchKeyword.value) {
      const q = searchKeyword.value.toLowerCase()
      const matchKode = p.kode.toLowerCase().includes(q)
      const matchMetode = p.metode_pembayaran.toLowerCase().includes(q)
      const matchBank = p.bank_nama?.toLowerCase().includes(q) || false
      const matchKet = p.keterangan?.toLowerCase().includes(q) || false
      const matchBukti = p.bukti_bayar?.toLowerCase().includes(q) || false
      if (!matchKode && !matchMetode && !matchBank && !matchKet && !matchBukti) return false
    }

    // Status filter
    if (statusFilter.value !== '') {
      if (p.status !== Number(statusFilter.value)) return false
    }

    return true
  })
})

async function loadData(): Promise<void> {
  if (!invoiceId.value) return

  isLoading.value = true
  try {
    const [summaryRes, paymentList, invoiceRes] = await Promise.all([
      salesPaymentService.getInvoicePaymentSummary(invoiceId.value),
      salesPaymentService.getPaymentsByInvoiceId(invoiceId.value),
      salesInvoiceService.getInvoiceById(invoiceId.value)
    ])
    summary.value = summaryRes
    payments.value = paymentList
    invoiceObj.value = invoiceRes
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Gagal memuat data pembayaran invoice.')
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

function handleBack(): void {
  if (summary.value) {
    router.push(`${variantCfg.value.routePrefix}/${summary.value.so_id}/invoices`)
  } else {
    router.push(variantCfg.value.routePrefix)
  }
}

function openCreateModal(): void {
  isCreateModalOpen.value = true
}

function openDetailModal(payment: SalesPayment): void {
  selectedPayment.value = payment
  isDetailModalOpen.value = true
}

function openReceiptModal(payment: SalesPayment): void {
  selectedPayment.value = payment
  isReceiptModalOpen.value = true
}

function promptCancelPayment(payment: SalesPayment): void {
  paymentToCancel.value = payment
  cancelReason.value = ''
  isCancelDialogOpen.value = true
}

async function confirmCancelPayment(): Promise<void> {
  if (!paymentToCancel.value) return

  isCancelling.value = true
  try {
    const success = await salesPaymentService.cancelPayment(
      paymentToCancel.value.id,
      cancelReason.value || 'Dibatalkan oleh pengguna'
    )
    if (success) {
      toast.success(
        `Pembayaran ${paymentToCancel.value.kode} berhasil dibatalkan. Saldo tagihan dipulihkan.`
      )
      isCancelDialogOpen.value = false
      paymentToCancel.value = null
      await loadData()
    }
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Gagal membatalkan pembayaran.')
  } finally {
    isCancelling.value = false
  }
}

function handleExportExcel(): void {
  if (!summary.value) return
  toast.info('Menyiapkan file Excel...')
  try {
    const exportData = filteredPayments.value.map((p, idx) => ({
      no: idx + 1,
      kode_pembayaran: p.kode,
      tanggal: p.tanggal,
      invoice: p.invoice_kode,
      sales_order: p.so_kode,
      customer: p.customer_nama,
      metode: p.metode_pembayaran,
      bank: p.bank_nama ? `${p.bank_nama} (${p.bank_rekening || '-'})` : '-',
      nominal: p.jumlah,
      bukti_bayar: p.bukti_bayar || '-',
      keterangan: p.keterangan || '-',
      status: p.status === 1 ? 'Aktif' : 'Dibatalkan'
    }))

    exportToExcel({
      filename: `Pembayaran_${summary.value.invoice_kode.replace(/[/\\?%*:|"<>]/g, '-')}`,
      title: `Riwayat Pembayaran Invoice ${summary.value.invoice_kode}`,
      columns: [
        { key: 'no', label: 'No' },
        { key: 'kode_pembayaran', label: 'Kode Pembayaran' },
        { key: 'tanggal', label: 'Tanggal' },
        { key: 'invoice', label: 'Invoice' },
        { key: 'sales_order', label: 'Sales Order' },
        { key: 'customer', label: 'Customer' },
        { key: 'metode', label: 'Metode' },
        { key: 'bank', label: 'Bank' },
        { key: 'nominal', label: 'Nominal (Rp)' },
        { key: 'bukti_bayar', label: 'Bukti Bayar' },
        { key: 'keterangan', label: 'Keterangan' },
        { key: 'status', label: 'Status' }
      ],
      data: exportData
    })
    toast.success('File Excel berhasil diunduh.')
  } catch {
    toast.error('Gagal mengekspor data Excel.')
  }
}

function handleExportPdf(): void {
  if (!summary.value) return
  toast.info('Menyiapkan dokumen PDF...')
  try {
    const exportData = filteredPayments.value.map((p, idx) => ({
      no: idx + 1,
      kode_pembayaran: p.kode,
      tanggal: p.tanggal,
      metode: p.metode_pembayaran,
      bank: p.bank_nama || '-',
      nominal: formatCurrency(p.jumlah),
      status: p.status === 1 ? 'Aktif' : 'Batal',
      keterangan: p.keterangan || '-'
    }))

    exportToPdf({
      title: `Riwayat Pembayaran Invoice ${summary.value.invoice_kode}`,
      filename: `Pembayaran_${summary.value.invoice_kode.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`,
      columns: [
        { key: 'no', label: 'No' },
        { key: 'kode_pembayaran', label: 'Kode Bayar' },
        { key: 'tanggal', label: 'Tanggal' },
        { key: 'metode', label: 'Metode' },
        { key: 'bank', label: 'Bank' },
        { key: 'nominal', label: 'Nominal' },
        { key: 'status', label: 'Status' },
        { key: 'keterangan', label: 'Keterangan' }
      ],
      data: exportData
    })
    toast.success('File PDF berhasil diunduh.')
  } catch {
    toast.error('Gagal mengekspor data PDF.')
  }
}

onMounted(() => {
  loadData()
})

watch(invoiceId, () => {
  loadData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <AppPageHeader
      title="Pembayaran Sales Invoice"
      :subtitle="`Penerimaan dan Riwayat Pembayaran Tagihan ${summary?.invoice_kode || '...'} · ${summary?.customer_nama || '...'}`"
    >
      <template #breadcrumb>
        <div class="flex items-center gap-2 text-xs text-slate-500">
          <span>Penjualan</span>
          <span>/</span>
          <router-link :to="variantCfg.routePrefix" class="hover:text-teal-700 transition-colors">
            {{ variantCfg.shortLabel }}
          </router-link>
          <span>/</span>
          <router-link
            v-if="summary"
            :to="`${variantCfg.routePrefix}/${summary.so_id}/invoices`"
            class="hover:text-teal-700 font-mono transition-colors"
          >
            {{ summary.so_kode }} (Invoices)
          </router-link>
          <span>/</span>
          <span class="font-mono">{{ summary?.invoice_kode || '...' }}</span>
          <span>/</span>
          <span class="font-medium text-slate-800">Pembayaran</span>
        </div>
      </template>

      <template #actions>
        <div class="flex items-center gap-2">
          <!-- Back button -->
          <AppButton variant="outline" size="sm" @click="handleBack">
            <template #iconLeft>
              <ArrowLeft class="w-4 h-4" />
            </template>
            Kembali ke Daftar Invoice
          </AppButton>

          <!-- Add Payment Button -->
          <AppButton
            v-if="canCreate"
            variant="primary"
            size="sm"
            :disabled="(summary?.sisa_pembayaran || 0) <= 0"
            @click="openCreateModal"
          >
            <template #iconLeft>
              <Plus class="w-4 h-4" />
            </template>
            + Tambah Pembayaran
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="space-y-4">
      <AppSkeleton height="160px" class="rounded-xl" />
      <AppSkeleton height="280px" class="rounded-xl" />
    </div>

    <!-- Main Content -->
    <div v-else-if="summary" class="space-y-6">
      <!-- Section 1: Summary KPI Header (Matching Section 4) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Card 1: Identitas Invoice -->
        <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
          <div class="flex items-center justify-between border-b border-slate-100 pb-2">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Identitas Invoice
            </span>
            <span
              class="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-100 text-teal-800 font-mono uppercase"
            >
              {{ summary.jenis_invoice }}
            </span>
          </div>

          <div class="space-y-1.5 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-slate-500">Kode Invoice:</span>
              <span class="font-mono font-bold text-slate-900">{{ summary.invoice_kode }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-500">Tanggal Invoice:</span>
              <span class="font-mono text-slate-700">{{ summary.tanggal_invoice }}</span>
            </div>
            <div class="flex items-center justify-between pt-1 border-t border-slate-100">
              <span class="text-slate-500">Status Pembayaran:</span>
              <span
                class="inline-flex px-2 py-0.5 rounded text-[11px] font-bold"
                :class="{
                  'bg-emerald-100 text-emerald-800': summary.status_pembayaran === 'LUNAS',
                  'bg-amber-100 text-amber-800': summary.status_pembayaran === 'SEBAGIAN',
                  'bg-rose-100 text-rose-800': summary.status_pembayaran === 'BELUM_BAYAR'
                }"
              >
                {{
                  summary.status_pembayaran === 'LUNAS'
                    ? 'LUNAS'
                    : summary.status_pembayaran === 'SEBAGIAN'
                      ? 'SEBAGIAN BAYAR'
                      : 'BELUM BAYAR'
                }}
              </span>
            </div>
          </div>
        </div>

        <!-- Card 2: Referensi Sales Order -->
        <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
          <div class="flex items-center justify-between border-b border-slate-100 pb-2">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Referensi Sales Order
            </span>
            <span
              class="px-2 py-0.5 rounded text-[10px] font-semibold text-white uppercase tracking-wider"
              :class="
                props.variant === 'impact'
                  ? 'bg-teal-700'
                  : props.variant === 'pola'
                    ? 'bg-indigo-700'
                    : 'bg-amber-700'
              "
            >
              {{ variantCfg.shortLabel }}
            </span>
          </div>

          <div class="space-y-1.5 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-slate-500">Kode Sales Order:</span>
              <router-link
                :to="`${variantCfg.routePrefix}/${summary.so_id}`"
                class="font-mono font-bold text-teal-700 hover:underline"
              >
                {{ summary.so_kode }}
              </router-link>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-500">Customer:</span>
              <span class="font-medium text-slate-800">{{ summary.customer_nama }}</span>
            </div>
            <div class="flex items-center justify-between pt-1 border-t border-slate-100">
              <span class="text-slate-500">Total SO:</span>
              <span class="font-mono font-medium text-slate-700">
                {{ formatCurrency(summary.total_so) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Card 3: Status Finansial Tagihan Invoice -->
        <div
          class="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 text-white shadow-xs space-y-3"
        >
          <div class="flex items-center justify-between border-b border-slate-700/80 pb-2">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Finansial Tagihan
            </span>
            <span class="text-[11px] text-slate-400 font-mono">
              {{ summary.count_payments }} Pembayaran
            </span>
          </div>

          <div class="space-y-1.5 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-slate-300">Total Tagihan:</span>
              <span class="font-mono font-bold text-sm text-teal-300">
                {{ formatCurrency(summary.total_invoice) }}
              </span>
            </div>
            <div class="flex items-center justify-between text-emerald-400">
              <span>Sudah Dibayar:</span>
              <span class="font-mono font-bold">{{ formatCurrency(summary.sudah_dibayar) }}</span>
            </div>
            <div
              class="flex items-center justify-between pt-1 border-t border-slate-700/80 font-bold"
              :class="summary.sisa_pembayaran === 0 ? 'text-emerald-400' : 'text-amber-300'"
            >
              <span>Sisa Pembayaran:</span>
              <span class="font-mono text-sm">
                {{ formatCurrency(summary.sisa_pembayaran) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 2: DataTable Riwayat Pembayaran (Matching Section 8) -->
      <div class="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <!-- Table Toolbar -->
        <div
          class="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3"
        >
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-800 text-sm">Riwayat Pembayaran Invoice</span>
            <span
              class="text-xs bg-teal-100 text-teal-800 font-semibold px-2 py-0.5 rounded-full font-mono"
            >
              {{ filteredPayments.length }}
            </span>
          </div>

          <!-- Filters & Exports -->
          <div class="flex items-center gap-2 flex-wrap">
            <!-- Search -->
            <div class="relative w-48">
              <AppInput
                v-model="searchKeyword"
                placeholder="Cari bukti / bank..."
                class="text-xs py-1.5 pl-7"
              />
              <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
            </div>

            <!-- Status Filter -->
            <div class="w-32">
              <AppSelect
                v-model="statusFilter"
                :options="[
                  { value: '', label: 'Semua Status' },
                  { value: '1', label: 'Aktif' },
                  { value: '0', label: 'Dibatalkan' }
                ]"
                class="text-xs"
              />
            </div>

            <!-- Export Buttons -->
            <AppButton variant="outline" size="xs" title="Ekspor Excel" @click="handleExportExcel">
              <template #iconLeft>
                <FileSpreadsheet class="w-3.5 h-3.5 text-emerald-600" />
              </template>
              Excel
            </AppButton>

            <AppButton variant="outline" size="xs" title="Ekspor PDF" @click="handleExportPdf">
              <template #iconLeft>
                <FileText class="w-3.5 h-3.5 text-rose-600" />
              </template>
              PDF
            </AppButton>
          </div>
        </div>

        <!-- 8-Column DataTable -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                class="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider"
              >
                <th class="py-2.5 px-3 text-center w-12">No</th>
                <th class="py-2.5 px-3 whitespace-nowrap">Kode Pembayaran</th>
                <th class="py-2.5 px-3 whitespace-nowrap">Tanggal</th>
                <th class="py-2.5 px-3 whitespace-nowrap">Metode</th>
                <th class="py-2.5 px-3 whitespace-nowrap">Bank / Akun</th>
                <th class="py-2.5 px-3 text-right whitespace-nowrap">Nominal</th>
                <th class="py-2.5 px-3 whitespace-nowrap">Keterangan</th>
                <th class="py-2.5 px-3 text-center whitespace-nowrap">Status</th>
                <th class="py-2.5 px-3 text-center whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <!-- Empty State -->
              <tr v-if="filteredPayments.length === 0">
                <td colspan="9" class="py-12 text-center text-slate-500">
                  <CreditCard class="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p class="font-medium text-slate-700">
                    Belum ada riwayat pembayaran untuk invoice ini.
                  </p>
                  <p class="text-xs text-slate-400 mt-1">
                    Klik tombol "+ Tambah Pembayaran" untuk mencatat pembayaran pertama.
                  </p>
                </td>
              </tr>

              <!-- Payment Rows -->
              <tr
                v-for="(p, idx) in filteredPayments"
                :key="p.id"
                class="hover:bg-slate-50/80 transition-colors"
                :class="{ 'opacity-60 bg-rose-50/30': p.status === 0 }"
              >
                <!-- 1. No -->
                <td class="py-2.5 px-3 text-center text-slate-500 font-mono">{{ idx + 1 }}</td>

                <!-- 2. Kode Pembayaran -->
                <td class="py-2.5 px-3 font-mono font-bold text-slate-800">{{ p.kode }}</td>

                <!-- 3. Tanggal -->
                <td class="py-2.5 px-3 font-mono text-slate-700">{{ p.tanggal }}</td>

                <!-- 4. Metode -->
                <td class="py-2.5 px-3">
                  <span
                    class="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold"
                    :class="{
                      'bg-sky-50 text-sky-800 border border-sky-200':
                        p.metode_pembayaran === 'TRANSFER',
                      'bg-emerald-50 text-emerald-800 border border-emerald-200':
                        p.metode_pembayaran === 'TUNAI',
                      'bg-purple-50 text-purple-800 border border-purple-200':
                        p.metode_pembayaran === 'CEK/GIRO'
                    }"
                  >
                    {{ p.metode_pembayaran }}
                  </span>
                </td>

                <!-- 5. Bank / Akun -->
                <td class="py-2.5 px-3 text-slate-700">
                  <div v-if="p.bank_nama">
                    <span class="font-medium text-slate-800">{{ p.bank_nama }}</span>
                    <span v-if="p.bank_rekening" class="text-[11px] text-slate-400 block font-mono">
                      {{ p.bank_rekening }}
                    </span>
                  </div>
                  <span v-else class="text-slate-400">-</span>
                </td>

                <!-- 6. Nominal -->
                <td class="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                  {{ formatCurrency(p.jumlah) }}
                </td>

                <!-- 7. Keterangan -->
                <td class="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                  <span :title="p.keterangan || undefined">{{ p.keterangan || '-' }}</span>
                  <span v-if="p.bukti_bayar" class="text-[11px] text-slate-400 block font-mono">
                    Ref: {{ p.bukti_bayar }}
                  </span>
                </td>

                <!-- 8. Status (Aktif / Batal) -->
                <td class="py-2.5 px-3 text-center">
                  <span
                    class="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold"
                    :class="
                      p.status === 1
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    "
                  >
                    {{ p.status === 1 ? 'Aktif' : 'Dibatalkan' }}
                  </span>
                </td>

                <!-- 9. Actions -->
                <td class="py-2.5 px-3 text-center">
                  <div class="inline-flex items-center gap-1">
                    <!-- Detail -->
                    <button
                      type="button"
                      title="Lihat Detail Pembayaran"
                      class="p-1 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded transition-colors"
                      @click="openDetailModal(p)"
                    >
                      <Eye class="w-3.5 h-3.5" />
                    </button>

                    <!-- Cetak Kwitansi -->
                    <button
                      type="button"
                      title="Cetak Kwitansi Pembayaran"
                      class="p-1 text-slate-500 hover:text-indigo-700 hover:bg-slate-100 rounded transition-colors"
                      @click="openReceiptModal(p)"
                    >
                      <Printer class="w-3.5 h-3.5" />
                    </button>

                    <!-- Batalkan Pembayaran (Reversal) -->
                    <button
                      v-if="canDelete && p.status === 1"
                      type="button"
                      title="Batalkan Pembayaran (Reversal)"
                      class="p-1 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                      @click="promptCancelPayment(p)"
                    >
                      <XCircle class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Table Footer Summary -->
        <div
          class="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600"
        >
          <span>
            Menampilkan <strong class="text-slate-900">{{ filteredPayments.length }}</strong> dari
            {{ payments.length }} transaksi pembayaran
          </span>
          <div class="flex items-center gap-4 font-mono">
            <span>
              Total Diterima:
              <strong class="text-emerald-700 font-bold">
                {{ formatCurrency(summary.sudah_dibayar) }}
              </strong>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <!-- Create Payment Modal -->
    <SalesInvoicePaymentCreateModal
      v-model="isCreateModalOpen"
      :invoice="invoiceObj"
      @saved="loadData"
    />

    <!-- Detail Payment Modal -->
    <SalesInvoicePaymentDetailModal
      v-model="isDetailModalOpen"
      :payment="selectedPayment"
      @print="openReceiptModal"
    />

    <!-- Printable Receipt Modal -->
    <SalesInvoicePaymentReceiptModal v-model="isReceiptModalOpen" :payment="selectedPayment" />

    <!-- Cancel Payment Confirm Dialog -->
    <AppConfirmDialog
      v-model="isCancelDialogOpen"
      title="Batalkan Pembayaran"
      :message="`Apakah Anda yakin ingin membatalkan transaksi pembayaran '${paymentToCancel?.kode}' sebesar ${formatCurrency(paymentToCancel?.jumlah || 0)}? Saldo sisa tagihan invoice akan dipulihkan secara otomatis.`"
      confirm-text="Ya, Batalkan Pembayaran"
      cancel-text="Kembali"
      variant="danger"
      @confirm="confirmCancelPayment"
    />
  </div>
</template>
