<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  FileSearch,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-vue-next'
import { formatCurrency } from '@/shared/utils/formatters'
import { formatDateIndo } from '../utils/sales-report-export'
import type {
  SalesReportType,
  ReportColumnConfig,
  SalesReportSummaryTotals,
  SalesReportPagination
} from '../types/sales-report.types'

const props = defineProps<{
  reportType: SalesReportType
  columns: ReportColumnConfig[]
  items: any[]
  pagination: SalesReportPagination
  summaryTotals?: SalesReportSummaryTotals
  loading: boolean
  error: string | null
  sortBy: string
  sortDirection: 'ASC' | 'DESC'
}>()

const emit = defineEmits<{
  (e: 'sort', colKey: string): void
  (e: 'page-change', page: number): void
  (e: 'per-page-change', perPage: number): void
  (e: 'retry'): void
}>()

const router = useRouter()

const visibleColumns = computed(() => props.columns.filter(c => c.visible))

function handleSort(col: ReportColumnConfig) {
  if (col.sortable !== false) {
    emit('sort', col.key)
  }
}

// Range text calculation: "Menampilkan 1 - 25 dari 2859 data"
const rangeText = computed(() => {
  if (props.pagination.total_items === 0) return 'Tidak ada data'
  const start = (props.pagination.page - 1) * props.pagination.per_page + 1
  const end = Math.min(props.pagination.page * props.pagination.per_page, props.pagination.total_items)
  return `Menampilkan ${start} - ${end} dari ${props.pagination.total_items} data`
})

// Drill-down navigation
function navigateToSo(soId?: number | null) {
  if (!soId) return
  router.push(`/sales/orders/${soId}`)
}

function navigateToInvoice(invId?: number | null) {
  if (!invId) return
  router.push(`/sales/invoices`)
}

// Status Badges
function getSoStatusBadge(status: number, statusAktif: number) {
  if (statusAktif === 0) {
    return { text: 'Dibatalkan', class: 'bg-rose-50 text-rose-700 border-rose-200' }
  }
  if (status === 1) {
    return { text: 'Disetujui', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  }
  return { text: 'Draft', class: 'bg-amber-50 text-amber-700 border-amber-200' }
}

function getDeliveryStatusBadge(statusStr: string) {
  switch (statusStr) {
    case 'Selesai':
      return { text: 'Selesai', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    case 'Parsial':
      return { text: 'Parsial', class: 'bg-blue-50 text-blue-700 border-blue-200' }
    default:
      return { text: 'Belum Kirim', class: 'bg-slate-100 text-slate-600 border-slate-200' }
  }
}

function getPaymentStatusBadge(statusStr: string) {
  switch (statusStr) {
    case 'Lunas':
      return { text: 'Lunas', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    case 'Sebagian':
      return { text: 'Sebagian', class: 'bg-blue-50 text-blue-700 border-blue-200' }
    default:
      return { text: 'Belum Bayar', class: 'bg-amber-50 text-amber-700 border-amber-200' }
  }
}
</script>

<template>
  <div class="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
    <!-- TABLE CONTAINER with Horizontal & Sticky scrolling -->
    <div class="overflow-x-auto min-h-[380px] max-h-[640px] relative scrollbar-thin scrollbar-thumb-slate-200">
      <table class="w-full text-left text-xs border-collapse">
        <!-- Sticky Header -->
        <thead class="sticky top-0 z-20 bg-slate-50 text-slate-700 uppercase tracking-wider font-semibold border-b border-slate-200 shadow-sm">
          <tr>
            <th
              v-for="col in visibleColumns"
              :key="col.key"
              class="px-3.5 py-3 select-none transition-colors"
              :class="[
                col.align === 'right' ? 'text-right' : (col.align === 'center' ? 'text-center' : 'text-left'),
                col.sortable !== false ? 'cursor-pointer hover:bg-slate-100/90' : '',
                col.width ? col.width : ''
              ]"
              @click="handleSort(col)"
            >
              <div
                class="inline-flex items-center gap-1.5"
                :class="col.align === 'right' ? 'justify-end w-full' : (col.align === 'center' ? 'justify-center w-full' : '')"
              >
                <span>{{ col.label }}</span>
                <span v-if="col.sortable !== false" class="text-slate-400">
                  <ArrowUp v-if="sortBy === col.key && sortDirection === 'ASC'" class="w-3.5 h-3.5 text-teal-600 stroke-[2.5]" />
                  <ArrowDown v-else-if="sortBy === col.key && sortDirection === 'DESC'" class="w-3.5 h-3.5 text-teal-600 stroke-[2.5]" />
                  <ArrowUpDown v-else class="w-3 h-3 opacity-40 hover:opacity-100" />
                </span>
              </div>
            </th>
          </tr>
        </thead>

        <!-- Table Body -->
        <tbody class="divide-y divide-slate-100 text-slate-700">
          <!-- 1. Loading Skeleton -->
          <template v-if="loading">
            <tr v-for="n in 6" :key="`skel-${n}`" class="animate-pulse">
              <td
                v-for="col in visibleColumns"
                :key="col.key"
                class="px-3.5 py-3"
              >
                <div class="h-3.5 bg-slate-200/70 rounded w-3/4"></div>
              </td>
            </tr>
          </template>

          <!-- 2. Error State -->
          <template v-else-if="error">
            <tr>
              <td :colspan="visibleColumns.length" class="py-16 text-center">
                <div class="flex flex-col items-center justify-center max-w-sm mx-auto">
                  <div class="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-3">
                    <AlertCircle class="w-6 h-6" />
                  </div>
                  <h4 class="text-sm font-bold text-slate-800">Gagal Memuat Data Laporan</h4>
                  <p class="text-xs text-slate-500 mt-1 mb-4">{{ error }}</p>
                  <button
                    type="button"
                    class="px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition"
                    @click="emit('retry')"
                  >
                    Coba Lagi
                  </button>
                </div>
              </td>
            </tr>
          </template>

          <!-- 3. Empty State -->
          <template v-else-if="items.length === 0">
            <tr>
              <td :colspan="visibleColumns.length" class="py-16 text-center">
                <div class="flex flex-col items-center justify-center max-w-md mx-auto">
                  <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                    <FileSearch class="w-6 h-6" />
                  </div>
                  <h4 class="text-sm font-bold text-slate-800">Tidak Ada Data Ditemukan</h4>
                  <p class="text-xs text-slate-500 mt-1">
                    Tidak ada transaksi penjualan yang cocok dengan filter yang dipilih. Silakan sesuaikan tanggal atau pilihan filter Anda.
                  </p>
                </div>
              </td>
            </tr>
          </template>

          <!-- 4. Actual Data Rows -->
          <template v-else>
            <tr
              v-for="(item, index) in items"
              :key="item.id || item.detail_id || item.customer_id || item.produk_id || item.invoice_id || index"
              class="hover:bg-slate-50/80 transition-colors group"
            >
              <td
                v-for="col in visibleColumns"
                :key="col.key"
                class="px-3.5 py-2.5 font-normal whitespace-nowrap"
                :class="[
                  col.align === 'right' ? 'text-right font-mono' : (col.align === 'center' ? 'text-center' : 'text-left')
                ]"
              >
                <!-- Column No -->
                <template v-if="col.key === 'no'">
                  <span class="text-slate-400 font-mono text-[11px]">
                    {{ (pagination.page - 1) * pagination.per_page + index + 1 }}
                  </span>
                </template>

                <!-- Dates -->
                <template v-else-if="['tanggal', 'tanggal_so', 'tanggal_invoice'].includes(col.key)">
                  <span class="text-slate-600">
                    {{ formatDateIndo(item[col.key]) }}
                  </span>
                </template>

                <!-- Sales Order Document Codes (Drill-down link) -->
                <template v-else-if="['kode', 'kode_so', 'nomor_so'].includes(col.key)">
                  <button
                    type="button"
                    class="font-semibold text-teal-700 hover:text-teal-900 hover:underline inline-flex items-center gap-1 transition"
                    @click="navigateToSo(item.id || item.so_id || item.sales_order_id)"
                  >
                    <span>{{ item[col.key] || '-' }}</span>
                    <ExternalLink class="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                  </button>
                </template>

                <!-- Invoice Document Code (Drill-down link) -->
                <template v-else-if="col.key === 'nomor_invoice'">
                  <button
                    type="button"
                    class="font-semibold text-teal-700 hover:text-teal-900 hover:underline inline-flex items-center gap-1 transition"
                    @click="navigateToInvoice(item.id || item.invoice_id)"
                  >
                    <span>{{ item[col.key] || '-' }}</span>
                    <ExternalLink class="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                  </button>
                </template>

                <!-- Currency fields -->
                <template v-else-if="[
                  'total', 'subtotal', 'total_ppn', 'harga', 'total_nilai_so', 'subtotal_pesanan',
                  'total_nilai_penjualan', 'harga_rata_rata', 'total_so', 'total_invoice',
                  'total_pembayaran', 'sisa_tagihan'
                ].includes(col.key)">
                  <span class="font-medium text-slate-800">
                    {{ formatCurrency(Number(item[col.key]) || 0) }}
                  </span>
                </template>

                <!-- Discount -->
                <template v-else-if="col.key === 'diskon' || col.key === 'total_diskon'">
                  <span class="text-slate-600 font-mono">
                    {{ reportType === 'detail' ? `${Number(item[col.key]) || 0}%` : formatCurrency(Number(item[col.key]) || 0) }}
                  </span>
                </template>

                <!-- Percentage fields -->
                <template v-else-if="col.key === 'persentase_pengiriman'">
                  <span
                    class="font-semibold font-mono"
                    :class="Number(item[col.key]) >= 100 ? 'text-emerald-600' : 'text-slate-700'"
                  >
                    {{ Number(item[col.key]) || 0 }}%
                  </span>
                </template>

                <!-- SO Status Badge -->
                <template v-else-if="col.key === 'status' || col.key === 'status_so'">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                    :class="getSoStatusBadge(Number(item[col.key]), item.status_aktif ?? 1).class"
                  >
                    {{ getSoStatusBadge(Number(item[col.key]), item.status_aktif ?? 1).text }}
                  </span>
                </template>

                <!-- Production Status -->
                <template v-else-if="col.key === 'status_produksi'">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                    :class="item.status_produksi === 1 ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-slate-100 text-slate-600 border-slate-200'"
                  >
                    {{ item.status_produksi === 1 ? 'Selesai/Dalam' : 'Belum' }}
                  </span>
                </template>

                <!-- Delivery Status -->
                <template v-else-if="col.key === 'status_pengiriman'">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                    :class="getDeliveryStatusBadge(item.status_pengiriman).class"
                  >
                    {{ getDeliveryStatusBadge(item.status_pengiriman).text }}
                  </span>
                </template>

                <!-- Payment Status -->
                <template v-else-if="col.key === 'status_pembayaran'">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                    :class="getPaymentStatusBadge(item.status_pembayaran).class"
                  >
                    {{ getPaymentStatusBadge(item.status_pembayaran).text }}
                  </span>
                </template>

                <!-- Invoice Type Badge -->
                <template v-else-if="col.key === 'jenis' || col.key === 'jenis_invoice'">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                    {{ item[col.key] }}
                  </span>
                </template>

                <!-- Action / Drilldown Column -->
                <template v-else-if="col.key === 'aksi'">
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 text-[11px] text-teal-600 hover:text-teal-800 font-semibold transition hover:underline"
                    @click="navigateToSo(item.id || item.so_id || item.sales_order_id)"
                  >
                    Detail
                    <ExternalLink class="w-3 h-3" />
                  </button>
                </template>

                <!-- Fallback Text -->
                <template v-else>
                  <span class="text-slate-700">{{ item[col.key] ?? '-' }}</span>
                </template>
              </td>
            </tr>
          </template>
        </tbody>

        <!-- Table Footer / Summary Totals -->
        <tfoot v-if="!loading && items.length > 0 && summaryTotals" class="bg-slate-100/90 text-slate-800 font-bold border-t-2 border-slate-300">
          <tr>
            <td
              v-for="(col, cIdx) in visibleColumns"
              :key="`tot-${col.key}`"
              class="px-3.5 py-3 whitespace-nowrap text-xs"
              :class="[
                col.align === 'right' ? 'text-right font-mono' : (col.align === 'center' ? 'text-center' : 'text-left')
              ]"
            >
              <!-- First text cell: summary title -->
              <span v-if="cIdx === 0" class="text-slate-500 uppercase tracking-wider text-[11px]">
                TOTAL
              </span>

              <!-- Overall SO Count label -->
              <span v-else-if="['kode', 'nomor_so', 'nama_customer', 'nama_produk'].includes(col.key)" class="text-slate-600 text-[11px]">
                {{ summaryTotals.total_rows }} Baris
              </span>

              <!-- Total Amounts & Subtotals -->
              <span v-else-if="['total', 'total_nilai_so', 'total_nilai_penjualan', 'total_so', 'total_invoice'].includes(col.key)" class="text-teal-800 font-bold">
                {{ formatCurrency(summaryTotals.total_amount || 0) }}
              </span>

              <span v-else-if="['subtotal', 'subtotal_pesanan'].includes(col.key)">
                {{ formatCurrency(summaryTotals.total_subtotal || 0) }}
              </span>

              <span v-else-if="col.key === 'total_ppn'">
                {{ formatCurrency(summaryTotals.total_ppn || 0) }}
              </span>

              <span v-else-if="col.key === 'total_diskon'">
                {{ formatCurrency(summaryTotals.total_diskon || 0) }}
              </span>

              <!-- Total Quantities -->
              <span v-else-if="['total_qty', 'qty', 'total_qty_dipesan', 'qty_pesanan'].includes(col.key)">
                {{ summaryTotals.total_qty || 0 }}
              </span>

              <!-- Total Payments & Receivables -->
              <span v-else-if="col.key === 'total_pembayaran'" class="text-emerald-700">
                {{ formatCurrency(summaryTotals.total_pembayaran || 0) }}
              </span>

              <span v-else-if="col.key === 'sisa_tagihan'" class="text-rose-700">
                {{ formatCurrency(summaryTotals.total_sisa_tagihan || 0) }}
              </span>

              <!-- Empty cells -->
              <span v-else>-</span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- PAGINATION BAR -->
    <div class="px-5 py-3 border-t border-slate-200/80 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
      <!-- Left: Rows Per Page & Range info -->
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1.5">
          <span class="text-slate-500">Tampilkan:</span>
          <select
            :value="pagination.per_page"
            class="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500"
            @change="emit('per-page-change', Number(($event.target as HTMLSelectElement).value))"
          >
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
          <span class="text-slate-500">baris</span>
        </div>
        <span class="text-slate-300">|</span>
        <span class="font-medium text-slate-600">{{ rangeText }}</span>
      </div>

      <!-- Right: Page Navigation -->
      <div class="flex items-center gap-1.5">
        <button
          type="button"
          class="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
          :disabled="pagination.page <= 1"
          @click="emit('page-change', pagination.page - 1)"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>

        <div class="flex items-center gap-1 px-1">
          <span class="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">
            {{ pagination.page }}
          </span>
          <span class="text-xs text-slate-400">dari</span>
          <span class="text-xs font-medium text-slate-600 px-1">
            {{ pagination.total_pages || 1 }}
          </span>
        </div>

        <button
          type="button"
          class="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
          :disabled="pagination.page >= pagination.total_pages"
          @click="emit('page-change', pagination.page + 1)"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
