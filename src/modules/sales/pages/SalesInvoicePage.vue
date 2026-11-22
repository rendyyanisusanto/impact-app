<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Receipt, ArrowLeft, Plus, Eye, Printer, XCircle, CreditCard } from 'lucide-vue-next'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppSkeleton from '@/shared/components/ui/AppSkeleton.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import SalesInvoiceCreateModal from '../components/SalesInvoiceCreateModal.vue'
import SalesInvoiceDetailModal from '../components/SalesInvoiceDetailModal.vue'
import SalesInvoicePrintModal from '../components/SalesInvoicePrintModal.vue'
import SalesInvoicePaymentCreateModal from '../components/SalesInvoicePaymentCreateModal.vue'
import { salesInvoiceService } from '../services/sales-invoice.service'
import type { SalesInvoice, SalesOrderInvoiceSummary } from '../types/sales-invoice.types'
import { getVariantConfig, type SalesOrderVariantKey } from '../config/sales-order-variants'
import { formatCurrency } from '@/shared/utils/formatters'
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

const orderId = computed(() => Number(route.params.id))
const variantCfg = computed(() => getVariantConfig(props.variant))

const summary = ref<SalesOrderInvoiceSummary | null>(null)
const invoices = ref<SalesInvoice[]>([])
const isLoading = ref(true)

// Modals
const isCreateModalOpen = ref(false)
const isDetailModalOpen = ref(false)
const isPrintModalOpen = ref(false)
const isPaymentModalOpen = ref(false)
const selectedInvoice = ref<SalesInvoice | null>(null)
const selectedInvoiceForPayment = ref<SalesInvoice | null>(null)

// Cancel Invoice Dialog
const isCancelDialogOpen = ref(false)
const invoiceToCancel = ref<SalesInvoice | null>(null)
const isCancelling = ref(false)

async function loadData(): Promise<void> {
  if (!orderId.value) return

  isLoading.value = true
  try {
    const [summaryRes, invoiceList] = await Promise.all([
      salesInvoiceService.getInvoiceSummary(orderId.value, props.variant),
      salesInvoiceService.getInvoicesByOrderId(orderId.value)
    ])
    summary.value = summaryRes
    invoices.value = invoiceList
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Gagal memuat data invoice.')
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

function handleBack(): void {
  router.push(variantCfg.value.routePrefix)
}

function openCreateModal(): void {
  isCreateModalOpen.value = true
}

function openPaymentModal(inv: SalesInvoice): void {
  selectedInvoiceForPayment.value = inv
  isPaymentModalOpen.value = true
}

function navigateToPayments(inv: SalesInvoice): void {
  router.push(
    `${variantCfg.value.routePrefix}/${summary.value?.order_id || orderId.value}/invoices/${inv.id}/payments`
  )
}

function openDetailModal(inv: SalesInvoice): void {
  selectedInvoice.value = inv
  isDetailModalOpen.value = true
}

function openPrintModal(inv: SalesInvoice): void {
  selectedInvoice.value = inv
  isPrintModalOpen.value = true
  void salesInvoiceService.recordPrint(inv.id)
  inv.count_print = (inv.count_print || 0) + 1
}

function promptCancelInvoice(inv: SalesInvoice): void {
  invoiceToCancel.value = inv
  isCancelDialogOpen.value = true
}

async function confirmCancelInvoice(): Promise<void> {
  if (!invoiceToCancel.value) return

  isCancelling.value = true
  try {
    const success = await salesInvoiceService.cancelInvoice(
      invoiceToCancel.value.id,
      'Dibatalkan oleh pengguna via halaman Sales Invoice'
    )
    if (success) {
      toast.success(`Invoice ${invoiceToCancel.value.kode} berhasil dibatalkan.`)
      isCancelDialogOpen.value = false
      invoiceToCancel.value = null
      await loadData()
    }
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Gagal membatalkan invoice.')
  } finally {
    isCancelling.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <AppPageHeader
      title="Sales Invoice"
      :subtitle="`Daftar Invoice untuk ${summary?.order_kode || '...'} · ${summary?.customer_nama || '...'}`"
    >
      <template #breadcrumb>
        <div class="flex items-center gap-2 text-xs text-slate-500">
          <span>Penjualan</span>
          <span>/</span>
          <router-link :to="variantCfg.routePrefix" class="hover:text-teal-700 transition-colors">
            {{ variantCfg.shortLabel }}
          </router-link>
          <span>/</span>
          <span class="font-mono">{{ summary?.order_kode || '...' }}</span>
          <span>/</span>
          <span class="font-medium text-slate-800">Invoice</span>
        </div>
      </template>

      <template #actions>
        <div class="flex items-center gap-2">
          <AppButton variant="outline" size="sm" @click="handleBack">
            <template #iconLeft>
              <ArrowLeft class="w-4 h-4" />
            </template>
            Kembali
          </AppButton>

          <AppButton
            v-if="canCreate"
            variant="primary"
            size="sm"
            data-testid="btn-create-invoice"
            :disabled="isLoading || (summary?.sisa_invoice || 0) <= 0"
            @click="openCreateModal"
          >
            <template #iconLeft>
              <Plus class="w-4 h-4" />
            </template>
            Buat Invoice
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="space-y-6">
      <AppSkeleton class="h-44 w-full rounded-xl" />
      <AppSkeleton class="h-64 w-full rounded-xl" />
    </div>

    <div v-else-if="summary" class="space-y-6">
      <!-- Section 1: Informasi Sales Order (2 Columns matching Screenshot 1) -->
      <div class="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div
          class="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between"
        >
          <div class="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Receipt class="w-4 h-4 text-teal-600" />
            <span>Informasi Sales Order</span>
          </div>
          <span
            class="px-2.5 py-0.5 text-xs font-semibold rounded-full uppercase"
            :class="{
              'bg-emerald-100 text-emerald-800': summary.invoice_status === 'Sudah Invoice',
              'bg-amber-100 text-amber-800': summary.invoice_status === 'Sebagian Invoice',
              'bg-rose-100 text-rose-800': summary.invoice_status === 'Belum Invoice'
            }"
          >
            {{ summary.invoice_status }}
          </span>
        </div>

        <div class="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <!-- Kolom Kiri -->
          <div class="space-y-2.5">
            <div class="flex items-center justify-between py-1 border-b border-slate-100">
              <span class="text-slate-500">No. Sales Order:</span>
              <span class="font-mono font-bold text-slate-800 text-sm">{{
                summary.order_kode
              }}</span>
            </div>
            <div class="flex items-center justify-between py-1 border-b border-slate-100">
              <span class="text-slate-500">Tipe SO:</span>
              <span class="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{{
                variantCfg.label
              }}</span>
            </div>
            <div class="flex items-center justify-between py-1 border-b border-slate-100">
              <span class="text-slate-500">Tanggal Transaksi:</span>
              <span class="font-mono text-slate-700">{{ summary.tanggal }}</span>
            </div>
            <div class="flex items-center justify-between py-1 border-b border-slate-100">
              <span class="text-slate-500">Customer:</span>
              <span class="font-bold text-slate-900">{{ summary.customer_nama }}</span>
            </div>
            <div class="flex items-center justify-between py-1">
              <span class="text-slate-500">Salesman:</span>
              <span class="font-medium text-slate-800">{{ summary.sales_nama }}</span>
            </div>
          </div>

          <!-- Kolom Kanan (Financial Calculations) -->
          <div class="space-y-2.5 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            <div class="flex items-center justify-between">
              <span class="text-slate-600">Total DPP:</span>
              <span class="font-mono text-slate-800 font-medium">{{
                formatCurrency(summary.total_dpp)
              }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-600">
                Total PPN {{ summary.is_ppn === 1 ? `(${summary.ppn_rate}%)` : '(Non-PPN)' }}:
              </span>
              <span
                class="font-mono font-medium"
                :class="summary.is_ppn === 1 ? 'text-teal-700' : 'text-slate-500'"
              >
                {{ formatCurrency(summary.total_ppn) }}
              </span>
            </div>
            <div
              class="flex items-center justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900"
            >
              <span>Total SO:</span>
              <span class="font-mono text-teal-800">{{ formatCurrency(summary.total_so) }}</span>
            </div>
            <div class="flex items-center justify-between text-emerald-700 font-medium">
              <span>Sudah Invoice:</span>
              <span class="font-mono font-bold">{{ formatCurrency(summary.sudah_invoice) }}</span>
            </div>
            <div
              class="flex items-center justify-between text-amber-800 font-bold pt-1 border-t border-slate-200"
            >
              <span>Sisa Invoice:</span>
              <span class="font-mono text-sm">{{ formatCurrency(summary.sisa_invoice) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 2: Daftar Invoice (Matching Screenshot 1) -->
      <div class="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div
          class="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between"
        >
          <div class="flex items-center gap-2 font-bold text-slate-800 text-sm">
            <span>Daftar Invoice</span>
            <span
              class="text-xs bg-teal-100 text-teal-800 font-semibold px-2 py-0.5 rounded-full font-mono"
            >
              {{ invoices.length }}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <AppButton
              v-if="canCreate"
              variant="primary"
              size="xs"
              :disabled="(summary?.sisa_invoice || 0) <= 0"
              @click="openCreateModal"
            >
              <template #iconLeft>
                <Plus class="w-3.5 h-3.5" />
              </template>
              Tambah Invoice
            </AppButton>
          </div>
        </div>

        <!-- Table Container -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                class="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider"
              >
                <th class="py-2.5 px-3 text-center w-12">No</th>
                <th class="py-2.5 px-3 whitespace-nowrap">Kode Invoice</th>
                <th class="py-2.5 px-3 whitespace-nowrap">Tanggal</th>
                <th class="py-2.5 px-3 whitespace-nowrap">Jenis</th>
                <th class="py-2.5 px-3 text-right whitespace-nowrap">DPP</th>
                <th class="py-2.5 px-3 text-right whitespace-nowrap">PPN</th>
                <th class="py-2.5 px-3 text-right whitespace-nowrap">Nominal</th>
                <th class="py-2.5 px-3 whitespace-nowrap">No. Faktur Pajak</th>
                <th class="py-2.5 px-3 text-right whitespace-nowrap">Terbayar</th>
                <th class="py-2.5 px-3 text-center whitespace-nowrap">Status Pembayaran</th>
                <th class="py-2.5 px-3 text-center whitespace-nowrap">Status</th>
                <th class="py-2.5 px-3 text-center whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <!-- Empty State -->
              <tr v-if="invoices.length === 0">
                <td colspan="12" class="py-12 text-center text-slate-500">
                  <Receipt class="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p class="font-medium text-slate-700">Belum ada invoice untuk Sales Order ini.</p>
                  <p class="text-xs text-slate-400 mt-1">
                    Klik tombol "Buat Invoice" untuk menerbitkan tagihan pertama.
                  </p>
                </td>
              </tr>

              <!-- Rows -->
              <tr
                v-for="(inv, idx) in invoices"
                :key="inv.id"
                class="hover:bg-slate-50/80 transition-colors"
                :class="{ 'opacity-60 bg-rose-50/30': inv.status === 0 }"
              >
                <!-- 1. No -->
                <td class="py-2.5 px-3 text-center text-slate-500 font-mono">{{ idx + 1 }}</td>

                <!-- 2. Kode Invoice -->
                <td class="py-2.5 px-3 font-mono font-bold text-slate-800">{{ inv.kode }}</td>

                <!-- 3. Tanggal -->
                <td class="py-2.5 px-3 font-mono text-slate-700">{{ inv.tanggal }}</td>

                <!-- 4. Jenis -->
                <td class="py-2.5 px-3">
                  <span
                    class="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200"
                  >
                    {{ inv.jenis }}
                  </span>
                </td>

                <!-- 5. DPP -->
                <td class="py-2.5 px-3 text-right font-mono text-slate-700">
                  {{ formatCurrency(inv.subtotal) }}
                </td>

                <!-- 6. PPN -->
                <td
                  class="py-2.5 px-3 text-right font-mono"
                  :class="inv.total_ppn > 0 ? 'text-teal-700' : 'text-slate-500'"
                >
                  {{ formatCurrency(inv.total_ppn) }}
                </td>

                <!-- 7. Nominal (Total Invoice) -->
                <td class="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                  {{ formatCurrency(inv.total) }}
                </td>

                <!-- 8. No. Faktur Pajak -->
                <td class="py-2.5 px-3 font-mono text-slate-600">
                  {{ inv.no_faktur_pajak || '-' }}
                </td>

                <!-- 9. Terbayar -->
                <td class="py-2.5 px-3 text-right font-mono text-emerald-600 font-medium">
                  {{ formatCurrency(inv.terbayar) }}
                </td>

                <!-- 10. Status Pembayaran -->
                <td class="py-2.5 px-3 text-center">
                  <span
                    class="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold"
                    :class="{
                      'bg-emerald-100 text-emerald-800': inv.status_pembayaran === 'LUNAS',
                      'bg-amber-100 text-amber-800': inv.status_pembayaran === 'SEBAGIAN',
                      'bg-rose-100 text-rose-800': inv.status_pembayaran === 'BELUM_BAYAR'
                    }"
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

                <!-- 11. Status (Aktif / Batal) -->
                <td class="py-2.5 px-3 text-center">
                  <span
                    class="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold"
                    :class="
                      inv.status === 1
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    "
                  >
                    {{ inv.status === 1 ? 'Aktif' : 'Batal' }}
                  </span>
                </td>

                <!-- 12. Actions -->
                <td class="py-2.5 px-3 text-center">
                  <div class="inline-flex items-center gap-1">
                    <!-- Bayar (Payment) -->
                    <button
                      v-if="canCreate"
                      type="button"
                      :disabled="inv.status === 0 || inv.status_pembayaran === 'LUNAS'"
                      :title="
                        inv.status === 0
                          ? 'Invoice telah dibatalkan'
                          : inv.status_pembayaran === 'LUNAS'
                            ? 'Invoice telah LUNAS'
                            : 'Bayar Tagihan Invoice'
                      "
                      class="p-1 rounded transition-colors"
                      :class="
                        inv.status === 0 || inv.status_pembayaran === 'LUNAS'
                          ? 'text-slate-300 cursor-not-allowed'
                          : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'
                      "
                      @click="openPaymentModal(inv)"
                    >
                      <CreditCard class="w-3.5 h-3.5" />
                    </button>

                    <!-- Lihat Riwayat Pembayaran -->
                    <button
                      type="button"
                      title="Lihat Riwayat Pembayaran Invoice"
                      class="p-1 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors"
                      @click="navigateToPayments(inv)"
                    >
                      <Receipt class="w-3.5 h-3.5" />
                    </button>

                    <!-- Lihat -->
                    <button
                      type="button"
                      title="Lihat Detail Invoice"
                      class="p-1 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded transition-colors"
                      @click="openDetailModal(inv)"
                    >
                      <Eye class="w-3.5 h-3.5" />
                    </button>

                    <!-- Cetak -->
                    <button
                      type="button"
                      title="Cetak Invoice"
                      class="p-1 text-slate-500 hover:text-indigo-700 hover:bg-slate-100 rounded transition-colors"
                      @click="openPrintModal(inv)"
                    >
                      <Printer class="w-3.5 h-3.5" />
                    </button>

                    <!-- Batalkan Invoice -->
                    <button
                      v-if="canDelete && inv.status === 1 && inv.terbayar === 0"
                      type="button"
                      title="Batalkan Invoice"
                      class="p-1 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                      @click="promptCancelInvoice(inv)"
                    >
                      <XCircle class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Section 2 Footer (Screenshot 1 Match) -->
        <div
          class="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3"
        >
          <div class="font-medium">
            Jumlah Invoice: <strong class="text-slate-800 font-mono">{{ invoices.length }}</strong>
          </div>

          <div class="flex items-center gap-2">
            <AppButton variant="outline" size="sm" @click="handleBack"> Kembali </AppButton>
            <AppButton
              v-if="canCreate"
              variant="primary"
              size="sm"
              :disabled="(summary?.sisa_invoice || 0) <= 0"
              @click="openCreateModal"
            >
              <template #iconLeft>
                <Plus class="w-4 h-4" />
              </template>
              Buat Invoice
            </AppButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <SalesInvoiceCreateModal
      v-model:is-open="isCreateModalOpen"
      :summary="summary"
      :variant="variant"
      @success="loadData"
    />

    <SalesInvoiceDetailModal
      v-model:is-open="isDetailModalOpen"
      :invoice="selectedInvoice"
      :so-kode="summary?.order_kode"
      :customer-nama="summary?.customer_nama"
      @print="openPrintModal"
    />

    <SalesInvoicePrintModal
      v-model:is-open="isPrintModalOpen"
      :invoice="selectedInvoice"
      :so-kode="summary?.order_kode"
      :customer-nama="summary?.customer_nama"
      :customer-alamat="summary?.customer_alamat"
      :customer-telepon="summary?.customer_telepon"
      :variant="variant"
    />

    <!-- Quick Payment Modal -->
    <SalesInvoicePaymentCreateModal
      v-model="isPaymentModalOpen"
      :invoice="selectedInvoiceForPayment"
      @saved="loadData"
    />

    <!-- Cancel Invoice Confirmation Dialog -->
    <AppConfirmDialog
      v-model="isCancelDialogOpen"
      title="Batalkan Invoice"
      :message="`Apakah Anda yakin ingin membatalkan tagihan invoice ${invoiceToCancel?.kode}? Sisa tagihan Sales Order akan dikembalikan.`"
      confirm-text="Batalkan Invoice"
      cancel-text="Tutup"
      variant="danger"
      @confirm="confirmCancelInvoice"
    />
  </div>
</template>
