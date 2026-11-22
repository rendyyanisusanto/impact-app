<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  CreditCard,
  ArrowLeft,
  Printer,
  Edit2,
  XCircle,
  FileText,
  Building2,
  AlertCircle,
  CheckCircle2,
  Layers
} from 'lucide-vue-next'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppSkeleton from '@/shared/components/ui/AppSkeleton.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import SalesInvoicePaymentReceiptModal from '../components/SalesInvoicePaymentReceiptModal.vue'
import { salesPaymentService } from '../services/sales-payment.service'
import type { SalesPayment, SalesInvoicePaymentSummary } from '../types/sales-payment.types'
import { formatCurrency } from '@/shared/utils/formatters'
import { terbilangRupiah } from '../utils/sales-payment-calculations'
import { useToast } from '@/shared/composables/useToast'
import { usePermission } from '@/shared/composables/usePermission'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { hasPermission } = usePermission()

const canUpdate = computed(() => hasPermission('sales', 'update'))
const canDelete = computed(() => hasPermission('sales', 'delete'))

const paymentId = computed(() => Number(route.params.id))
const payment = ref<SalesPayment | null>(null)
const invoiceSummary = ref<SalesInvoicePaymentSummary | null>(null)
const isLoading = ref(true)

// Modals
const isReceiptModalOpen = ref(false)
const isCancelModalOpen = ref(false)
const cancelReason = ref('')
const isCancelling = ref(false)

const loadPaymentDetail = async () => {
  isLoading.value = true
  try {
    const p = await salesPaymentService.getPaymentById(paymentId.value)
    if (!p) {
      toast.error('Data pembayaran tidak ditemukan.')
      router.push('/sales/invoice-payments')
      return
    }
    payment.value = p

    // Load related invoice payment summary
    const summary = await salesPaymentService.getInvoicePaymentSummary(p.invoice_id)
    invoiceSummary.value = summary
  } catch (err: unknown) {
    console.error('Failed to load payment detail:', err)
    const msg = err instanceof Error ? err.message : 'Gagal memuat rincian pembayaran.'
    toast.error(msg)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadPaymentDetail()
})

const terbilangText = computed(() => {
  if (!payment.value) return ''
  return terbilangRupiah(payment.value.jumlah)
})

const handleEdit = () => {
  if (payment.value) {
    router.push(`/sales/invoice-payments/${payment.value.id}/edit`)
  }
}

const handleOpenReceipt = () => {
  isReceiptModalOpen.value = true
}

const handleInitiateCancel = () => {
  cancelReason.value = ''
  isCancelModalOpen.value = true
}

const handleConfirmCancel = async () => {
  if (!payment.value) return
  isCancelling.value = true
  try {
    await salesPaymentService.cancelPayment(payment.value.id, cancelReason.value)
    toast.success(`Pembayaran ${payment.value.kode} berhasil dibatalkan.`)
    isCancelModalOpen.value = false
    await loadPaymentDetail()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal membatalkan pembayaran.'
    toast.error(msg)
  } finally {
    isCancelling.value = false
  }
}

const handleViewInvoicePayments = () => {
  if (payment.value) {
    router.push(`/sales/invoices/${payment.value.invoice_id}/payments`)
  }
}

const handleBack = () => {
  router.push('/sales/invoice-payments')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <AppPageHeader
      :title="`Detail Pembayaran ${payment?.kode || ''}`"
      description="Rincian transaksi pembayaran invoice dan status pembukuan"
      :breadcrumbs="[
        { label: 'Beranda', to: '/' },
        { label: 'Penjualan', to: '/sales/orders/impact' },
        { label: 'Pembayaran Invoice', to: '/sales/invoice-payments' },
        { label: 'Detail Pembayaran' }
      ]"
    >
      <template #actions>
        <div class="flex items-center gap-2">
          <AppButton variant="outline" size="sm" data-test="btn-back" @click="handleBack">
            <template #icon>
              <ArrowLeft class="w-4 h-4" />
            </template>
            Kembali
          </AppButton>

          <AppButton
            v-if="payment"
            variant="outline"
            size="sm"
            data-test="btn-print-receipt"
            @click="handleOpenReceipt"
          >
            <template #icon>
              <Printer class="w-4 h-4 text-slate-700" />
            </template>
            Cetak Kuitansi
          </AppButton>

          <AppButton
            v-if="canUpdate && payment && payment.status === 1 && !payment.is_posted_to_finance"
            variant="outline"
            size="sm"
            data-test="btn-edit-detail"
            class="text-blue-700 hover:text-blue-800 border-blue-200"
            @click="handleEdit"
          >
            <template #icon>
              <Edit2 class="w-4 h-4" />
            </template>
            Edit Pembayaran
          </AppButton>

          <AppButton
            v-if="canDelete && payment && payment.status === 1 && !payment.is_posted_to_finance"
            variant="outline"
            size="sm"
            data-test="btn-cancel-detail"
            class="text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50"
            @click="handleInitiateCancel"
          >
            <template #icon>
              <XCircle class="w-4 h-4" />
            </template>
            Batalkan Pembayaran
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <div v-if="isLoading" class="space-y-4">
      <AppSkeleton height="100px" />
      <AppSkeleton height="300px" />
    </div>

    <div v-else-if="payment" class="space-y-6">
      <!-- Status Banner -->
      <div
        v-if="payment.status === 0"
        data-test="banner-cancelled"
        class="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3"
      >
        <AlertCircle class="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 class="text-sm font-bold text-rose-900">Transaksi Pembayaran Telah Dibatalkan</h4>
          <p class="text-xs text-rose-700 mt-0.5">
            Alasan pembatalan:
            <strong>{{ payment.alasan_batal || 'Dibatalkan oleh pengguna' }}</strong>
          </p>
          <span class="text-[11px] text-rose-500 mt-1 block">
            Waktu pembatalan: {{ payment.updated_at || '-' }}
          </span>
        </div>
      </div>

      <div
        v-else
        data-test="banner-active"
        class="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <CheckCircle2 class="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <h4 class="text-sm font-bold text-emerald-900">Pembayaran Sah & Aktif</h4>
            <p class="text-xs text-emerald-700">
              Transaksi tercatat pada histori jurnal transaksi dan mengurangi sisa tagihan invoice.
            </p>
          </div>
        </div>

        <span
          class="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full uppercase"
        >
          Berhasil
        </span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- VOUCHER PEMBAYARAN CARD (2 cols on lg) -->
        <div
          class="lg:col-span-2 bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden"
        >
          <div
            class="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between"
          >
            <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
              <CreditCard class="w-4 h-4 text-teal-600" />
              Bukti Penerimaan Kas / Bank
            </h3>
            <span class="text-xs font-mono font-bold text-slate-600">
              {{ payment.kode }}
            </span>
          </div>

          <div class="p-6 space-y-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div>
                <span class="text-slate-400 font-semibold block uppercase">Tanggal Pembayaran</span>
                <span class="text-sm font-bold text-slate-900 mt-0.5 block font-mono">
                  {{ payment.tanggal }}
                </span>
              </div>

              <div>
                <span class="text-slate-400 font-semibold block uppercase">Metode Pembayaran</span>
                <span class="text-sm font-bold text-slate-900 mt-0.5 block">
                  {{
                    payment.metode_pembayaran === 'TRANSFER'
                      ? 'Transfer Bank'
                      : payment.metode_pembayaran === 'TUNAI'
                        ? 'Tunai / Kas'
                        : 'Cek / Bilyet Giro'
                  }}
                </span>
              </div>

              <div>
                <span class="text-slate-400 font-semibold block uppercase"
                  >Rekening Bank Tujuan</span
                >
                <span class="text-sm font-bold text-slate-900 mt-0.5 block">
                  {{
                    payment.bank_nama
                      ? `${payment.bank_nama} (${payment.bank_rekening || '-'})`
                      : 'Kas Kantor'
                  }}
                </span>
              </div>

              <div>
                <span class="text-slate-400 font-semibold block uppercase"
                  >Nomor Bukti / Referensi</span
                >
                <span class="text-sm font-bold text-slate-900 mt-0.5 block font-mono">
                  {{ payment.bukti_bayar || '-' }}
                </span>
              </div>
            </div>

            <!-- Nominal Box -->
            <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span class="text-xs font-bold text-slate-500 uppercase block"
                >Jumlah Pembayaran</span
              >
              <div class="text-2xl font-extrabold text-slate-900">
                {{ formatCurrency(payment.jumlah) }}
              </div>
              <div
                class="text-xs text-slate-600 italic bg-white p-2.5 rounded border border-slate-200"
              >
                <span class="font-semibold text-slate-500 not-italic">Terbilang: </span>
                <span class="text-teal-700 capitalize font-medium">{{ terbilangText }}</span>
              </div>
            </div>

            <!-- Notes & Audit -->
            <div class="space-y-3 text-xs">
              <div>
                <span class="text-slate-400 font-semibold block uppercase mb-1"
                  >Catatan / Keterangan</span
                >
                <p class="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {{ payment.keterangan || 'Tidak ada catatan tambahan.' }}
                </p>
              </div>

              <div
                class="pt-3 border-t border-slate-100 flex items-center justify-between text-slate-400"
              >
                <span
                  >Dicatat oleh: <strong>{{ payment.created_by_nama }}</strong></span
                >
                <span>Waktu entri: {{ payment.created_at }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: Related Invoice & Sales Order -->
        <div class="space-y-6">
          <!-- Related Invoice Card -->
          <div
            v-if="invoiceSummary"
            class="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden"
          >
            <div
              class="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between"
            >
              <h3 class="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                <FileText class="w-4 h-4 text-teal-600" />
                Faktur Tagihan Terkait
              </h3>
              <button
                type="button"
                data-test="btn-goto-invoice-payments"
                class="text-[11px] font-bold text-teal-600 hover:text-teal-700"
                @click="handleViewInvoicePayments"
              >
                Lihat Pembayaran
              </button>
            </div>

            <div class="p-5 space-y-4 text-xs">
              <div class="flex items-center justify-between">
                <span class="text-slate-500">Kode Invoice:</span>
                <span class="font-mono font-bold text-slate-900">{{
                  invoiceSummary.invoice_kode
                }}</span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-slate-500">Tanggal Terbit:</span>
                <span class="font-medium text-slate-700">{{ invoiceSummary.tanggal_invoice }}</span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-slate-500">Jenis Tagihan:</span>
                <span class="font-medium text-slate-700">{{ invoiceSummary.jenis_invoice }}</span>
              </div>

              <div class="flex items-center justify-between border-t border-slate-100 pt-2">
                <span class="text-slate-500">Total Invoice:</span>
                <span class="font-bold text-slate-900">{{
                  formatCurrency(invoiceSummary.total_invoice)
                }}</span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-slate-500">Total Terbayar:</span>
                <span class="font-bold text-emerald-600">{{
                  formatCurrency(invoiceSummary.sudah_dibayar)
                }}</span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-slate-500">Sisa Tagihan:</span>
                <span class="font-extrabold text-rose-600">{{
                  formatCurrency(invoiceSummary.sisa_pembayaran)
                }}</span>
              </div>

              <div class="flex items-center justify-between border-t border-slate-100 pt-2">
                <span class="text-slate-500">Status Tagihan:</span>
                <span
                  :class="[
                    'px-2 py-0.5 rounded-full font-bold uppercase text-[10px]',
                    invoiceSummary.status_pembayaran === 'LUNAS'
                      ? 'bg-emerald-100 text-emerald-800'
                      : invoiceSummary.status_pembayaran === 'SEBAGIAN'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                  ]"
                >
                  {{
                    invoiceSummary.status_pembayaran === 'LUNAS'
                      ? 'Lunas'
                      : invoiceSummary.status_pembayaran === 'SEBAGIAN'
                        ? 'Sebagian'
                        : 'Belum Bayar'
                  }}
                </span>
              </div>
            </div>
          </div>

          <!-- Related Sales Order Card -->
          <div
            v-if="invoiceSummary"
            class="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden"
          >
            <div class="px-5 py-3.5 bg-slate-50 border-b border-slate-200">
              <h3 class="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                <Building2 class="w-4 h-4 text-teal-600" />
                Customer & Sales Order
              </h3>
            </div>

            <div class="p-5 space-y-3 text-xs">
              <div>
                <span class="text-slate-400 block text-[11px]">No. Sales Order</span>
                <span class="font-mono font-bold text-slate-800 text-xs">{{
                  invoiceSummary.so_kode
                }}</span>
              </div>

              <div>
                <span class="text-slate-400 block text-[11px]">Nama Customer</span>
                <span class="font-bold text-slate-900 text-xs">{{
                  invoiceSummary.customer_nama
                }}</span>
              </div>

              <div>
                <span class="text-slate-400 block text-[11px]">Alamat & Kontak</span>
                <p class="text-slate-600 text-xs">
                  {{ invoiceSummary.customer_alamat || '-' }}
                </p>
                <p class="text-slate-500 text-[11px] mt-0.5">
                  Telp: {{ invoiceSummary.customer_telepon || '-' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- MULTI-INVOICE ALLOCATION TABLE (Desktop ERP Breakdown) -->
      <div
        v-if="payment.details && payment.details.length > 1"
        data-test="multi-invoice-allocation-card"
        class="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden"
      >
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Layers class="w-4 h-4 text-teal-600" />
            <h3 class="text-sm font-bold text-slate-800">
              Rincian Alokasi Multi-Invoice
            </h3>
            <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
              {{ payment.details.length }} Faktur Tagihan
            </span>
          </div>
          <span class="text-xs text-slate-500">
            Total Alokasi: <strong class="text-teal-700 font-mono">{{ formatCurrency(payment.jumlah) }}</strong>
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left border-collapse">
            <thead>
              <tr class="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                <th class="py-2.5 px-3 text-center w-12">No.</th>
                <th class="py-2.5 px-3">No. Invoice</th>
                <th class="py-2.5 px-3">Jenis</th>
                <th class="py-2.5 px-3">No. Sales Order</th>
                <th class="py-2.5 px-3">Customer</th>
                <th class="py-2.5 px-3 text-right">Nominal Alokasi</th>
                <th class="py-2.5 px-3">Keterangan / Ref</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-mono">
              <tr
                v-for="(detail, idx) in payment.details"
                :key="detail.id"
                class="hover:bg-slate-50 transition-colors"
              >
                <td class="py-2.5 px-3 text-center text-slate-400 font-sans">{{ idx + 1 }}</td>
                <td class="py-2.5 px-3 font-bold text-slate-800">
                  <router-link
                    :to="`/sales/invoices/${detail.sales_invoice_id}/payments`"
                    class="text-teal-600 hover:text-teal-800 hover:underline flex items-center gap-1"
                  >
                    <span>{{ detail.invoice_kode }}</span>
                  </router-link>
                </td>
                <td class="py-2.5 px-3 font-sans">
                  <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                    {{ detail.invoice_jenis || 'INVOICE' }}
                  </span>
                </td>
                <td class="py-2.5 px-3 text-slate-600">{{ detail.so_kode }}</td>
                <td class="py-2.5 px-3 text-slate-700 font-sans">{{ detail.customer_nama || payment.customer_nama }}</td>
                <td class="py-2.5 px-3 text-right font-bold text-teal-700">
                  {{ formatCurrency(detail.jumlah ?? detail.nominal ?? 0) }}
                </td>
                <td class="py-2.5 px-3 text-slate-500 font-sans text-[11px]">
                  {{ detail.keterangan || '-' }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="bg-slate-50/80 font-bold border-t border-slate-200 text-slate-800">
                <td colspan="5" class="py-3 px-3 text-right font-sans text-xs">Total Pembayaran Terdistribusi:</td>
                <td class="py-3 px-3 text-right font-mono text-sm text-teal-700 font-extrabold">
                  {{ formatCurrency(payment.jumlah) }}
                </td>
                <td class="py-3 px-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <SalesInvoicePaymentReceiptModal v-model="isReceiptModalOpen" :payment="payment" />

    <AppConfirmDialog
      v-model="isCancelModalOpen"
      title="Batalkan Transaksi Pembayaran"
      variant="danger"
      confirm-text="Ya, Batalkan Pembayaran"
      cancel-text="Batal"
      @cancel="isCancelModalOpen = false"
      @confirm="handleConfirmCancel"
    >
      <div class="space-y-3 text-xs text-slate-600">
        <p>
          Apakah Anda yakin ingin membatalkan transaksi pembayaran
          <strong class="font-mono text-slate-900">{{ payment?.kode }}</strong>
          sebesar
          <strong class="text-rose-600">{{ formatCurrency(payment?.jumlah || 0) }}</strong
          >?
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
