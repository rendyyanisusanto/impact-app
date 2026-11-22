<script setup lang="ts">
import { computed } from 'vue'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  FileSearch,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next'
import { formatCurrency } from '@/shared/utils/formatters'
import { formatDateIndo } from '../utils/purchase-report-export'
import type {
  PurchaseReportType,
  ReportColumnConfig,
  PurchaseReportSummaryTotals,
  PurchaseReportPagination
} from '../types/purchase-report.types'

const props = defineProps<{
  reportType: PurchaseReportType
  columns: ReportColumnConfig[]
  items: any[]
  pagination: PurchaseReportPagination
  summaryTotals?: PurchaseReportSummaryTotals
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

const visibleColumns = computed(() => props.columns.filter(c => c.visible))

function handleSort(col: ReportColumnConfig) {
  if (col.sortable !== false) {
    emit('sort', col.key)
  }
}

// Range text calculation: "Menampilkan 1 - 10 dari 19 data"
const rangeText = computed(() => {
  if (props.pagination.total_items === 0) return 'Tidak ada data'
  const start = (props.pagination.page - 1) * props.pagination.per_page + 1
  const end = Math.min(props.pagination.page * props.pagination.per_page, props.pagination.total_items)
  return `Menampilkan ${start} - ${end} dari ${props.pagination.total_items} data`
})

// Badges
function getPoStatusBadge(status: number, statusAktif: number) {
  if (statusAktif === 0) {
    return { text: 'Dibatalkan', class: 'bg-rose-50 text-rose-700 border-rose-200' }
  }
  if (status === 1) {
    return { text: 'Disetujui', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  }
  return { text: 'Draft', class: 'bg-amber-50 text-amber-700 border-amber-200' }
}

function getReceiptStatusBadge(statusStr: string) {
  switch (statusStr) {
    case 'Selesai':
      return { text: 'Selesai', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    case 'Parsial':
      return { text: 'Parsial', class: 'bg-blue-50 text-blue-700 border-blue-200' }
    case 'Over':
      return { text: 'Lebih (Over)', class: 'bg-purple-50 text-purple-700 border-purple-200' }
    default:
      return { text: 'Belum Diterima', class: 'bg-slate-100 text-slate-600 border-slate-200' }
  }
}

function getPaymentStatusBadge(statusStr: string) {
  switch (statusStr) {
    case 'Lunas':
      return { text: 'Lunas', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    case 'Bayar Sebagian':
      return { text: 'Sebagian', class: 'bg-blue-50 text-blue-700 border-blue-200' }
    case 'Belum Bayar':
      return { text: 'Belum Bayar', class: 'bg-amber-50 text-amber-700 border-amber-200' }
    default:
      return { text: 'Belum Ditagih', class: 'bg-slate-100 text-slate-500 border-slate-200' }
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
                    Tidak ada transaksi yang cocok dengan parameter filter yang dipilih. Silakan sesuaikan tanggal atau pilihan filter Anda.
                  </p>
                </div>
              </td>
            </tr>
          </template>

          <!-- 4. Actual Data Rows -->
          <template v-else>
            <tr
              v-for="(item, index) in items"
              :key="item.id || item.detail_id || item.supplier_id || item.bahan_id || item.po_id || index"
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
                <template v-else-if="col.key === 'tanggal' || col.key === 'tanggal_po'">
                  <span class="text-slate-600">
                    {{ formatDateIndo(item[col.key]) }}
                  </span>
                </template>

                <!-- Document Codes (Bold) -->
                <template v-else-if="col.key === 'kode' || col.key === 'kode_po' || col.key === 'nomor_po'">
                  <span class="font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">
                    {{ item[col.key] || '-' }}
                  </span>
                </template>

                <!-- Currency fields -->
                <template v-else-if="[
                  'total', 'subtotal', 'total_ppn', 'harga', 'total_nilai_po', 'total_nilai_diterima',
                  'total_tagihan', 'total_nilai_pesan', 'total_nilai_terima', 'total_po', 'nilai_po',
                  'nilai_penerimaan', 'nilai_tagihan', 'nilai_dibayar', 'sisa_tagihan'
                ].includes(col.key)">
                  <span class="font-medium text-slate-800">
                    {{ formatCurrency(Number(item[col.key]) || 0) }}
                  </span>
                </template>

                <!-- Discount percentage -->
                <template v-else-if="col.key === 'diskon'">
                  <span class="text-slate-600">
                    {{ Number(item[col.key]) || 0 }}%
                  </span>
                </template>

                <!-- Receipt percentage -->
                <template v-else-if="col.key === 'persentase'">
                  <span
                    class="font-semibold"
                    :class="Number(item[col.key]) >= 100 ? 'text-emerald-600' : 'text-slate-700'"
                  >
                    {{ Number(item[col.key]) || 0 }}%
                  </span>
                </template>

                <!-- PO Status Badge -->
                <template v-else-if="col.key === 'status' || col.key === 'status_po'">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                    :class="getPoStatusBadge(Number(item[col.key]), item.status_aktif ?? 1).class"
                  >
                    {{ getPoStatusBadge(Number(item[col.key]), item.status_aktif ?? 1).text }}
                  </span>
                </template>

                <!-- Receipt Status Badge -->
                <template v-else-if="col.key === 'status_penerimaan'">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                    :class="getReceiptStatusBadge(item[col.key]).class"
                  >
                    {{ getReceiptStatusBadge(item[col.key]).text }}
                  </span>
                </template>

                <!-- Payment Status Badge -->
                <template v-else-if="col.key === 'status_pembayaran'">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                    :class="getPaymentStatusBadge(item[col.key]).class"
                  >
                    {{ getPaymentStatusBadge(item[col.key]).text }}
                  </span>
                </template>

                <!-- Standard text -->
                <template v-else>
                  {{ item[col.key] !== null && item[col.key] !== undefined && item[col.key] !== '' ? item[col.key] : '-' }}
                </template>
              </td>
            </tr>
          </template>
        </tbody>

        <!-- STICKY TABLE FOOTER WITH CALCULATED GRAND TOTALS -->
        <tfoot
          v-if="!loading && items.length > 0 && summaryTotals"
          class="sticky bottom-0 z-10 bg-slate-100/95 backdrop-blur-sm border-t-2 border-slate-300 text-slate-800 font-bold shadow-sm"
        >
          <!-- Summary Totals Row -->
          <tr>
            <td
              v-for="(col, cIdx) in visibleColumns"
              :key="`tot-${col.key}`"
              class="px-3.5 py-3 whitespace-nowrap"
              :class="[
                col.align === 'right' ? 'text-right font-mono' : (col.align === 'center' ? 'text-center' : 'text-left')
              ]"
            >
              <!-- First column label -->
              <template v-if="cIdx === 0">
                <span class="text-xs uppercase tracking-wider text-slate-600 font-bold">TOTAL</span>
              </template>

              <!-- Document / Entity count -->
              <template v-else-if="cIdx === 1 || (col.key === 'kode' || col.key === 'kode_po' || col.key === 'nomor_po')">
                <span class="text-xs text-teal-800">
                  ({{ summaryTotals.total_rows }} Baris)
                </span>
              </template>

              <!-- Total PO Amount -->
              <template v-else-if="col.key === 'total' || col.key === 'total_po' || col.key === 'total_nilai_po' || col.key === 'nilai_po'">
                <span class="text-teal-900 font-bold text-xs">
                  {{ formatCurrency(summaryTotals.total_po_amount || 0) }}
                </span>
              </template>

              <!-- Total Item Subtotal -->
              <template v-else-if="col.key === 'subtotal'">
                <span class="text-teal-900 font-bold text-xs">
                  {{ formatCurrency(summaryTotals.total_item_subtotal || 0) }}
                </span>
              </template>

              <!-- Total Received Amount -->
              <template v-else-if="col.key === 'total_nilai_diterima' || col.key === 'total_nilai_terima' || col.key === 'nilai_penerimaan'">
                <span class="text-emerald-800 font-bold text-xs">
                  {{ formatCurrency(summaryTotals.total_received_amount || 0) }}
                </span>
              </template>

              <!-- Total Billed Amount -->
              <template v-else-if="col.key === 'total_tagihan' || col.key === 'nilai_tagihan'">
                <span class="text-blue-800 font-bold text-xs">
                  {{ formatCurrency(summaryTotals.total_billed_amount || 0) }}
                </span>
              </template>

              <!-- Total Paid Amount -->
              <template v-else-if="col.key === 'nilai_dibayar'">
                <span class="text-emerald-800 font-bold text-xs">
                  {{ formatCurrency(summaryTotals.total_paid_amount || 0) }}
                </span>
              </template>

              <!-- Total Remaining Bill -->
              <template v-else-if="col.key === 'sisa_tagihan'">
                <span class="text-rose-800 font-bold text-xs">
                  {{ formatCurrency(summaryTotals.total_remaining_bill || 0) }}
                </span>
              </template>

              <!-- Total Qty Pesan -->
              <template v-else-if="col.key === 'qty' || col.key === 'total_qty' || col.key === 'qty_pesan' || col.key === 'total_qty_pesan' || col.key === 'qty_po'">
                <span class="text-slate-800 font-bold text-xs">
                  {{ (summaryTotals.total_qty_pesan || 0).toLocaleString('id-ID') }}
                </span>
              </template>

              <!-- Total Qty Terima -->
              <template v-else-if="col.key === 'qty_terima' || col.key === 'total_qty_terima'">
                <span class="text-emerald-800 font-bold text-xs">
                  {{ (summaryTotals.total_qty_terima || 0).toLocaleString('id-ID') }}
                </span>
              </template>

              <!-- Total Sisa Qty -->
              <template v-else-if="col.key === 'sisa_qty'">
                <span class="text-amber-800 font-bold text-xs">
                  {{ (summaryTotals.total_sisa_qty || 0).toLocaleString('id-ID') }}
                </span>
              </template>

              <!-- Empty space for others -->
              <template v-else></template>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- PAGINATION & METRIC FOOTER BAR -->
    <div class="px-5 py-3 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
      <!-- Data Info & Per-Page Selector -->
      <div class="flex items-center gap-3">
        <span class="text-slate-600 font-medium">
          {{ rangeText }}
        </span>
        <span class="text-slate-300">|</span>
        <div class="flex items-center gap-1.5">
          <span class="text-slate-500">Tampilkan:</span>
          <select
            :value="pagination.per_page"
            class="text-xs rounded border-slate-200 bg-white py-1 px-2 text-slate-700 font-medium shadow-xs"
            @change="emit('per-page-change', Number(($event.target as HTMLSelectElement).value))"
          >
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
          <span class="text-slate-500">baris</span>
        </div>
      </div>

      <!-- Page Navigation Buttons -->
      <div class="flex items-center gap-1">
        <button
          type="button"
          :disabled="pagination.page <= 1 || loading"
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-600 transition"
          @click="emit('page-change', pagination.page - 1)"
        >
          <ChevronLeft class="w-3.5 h-3.5" />
          Sebelumnya
        </button>

        <span class="px-2 text-slate-600 font-semibold">
          Hal. {{ pagination.page }} / {{ pagination.total_pages }}
        </span>

        <button
          type="button"
          :disabled="pagination.page >= pagination.total_pages || loading"
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-600 transition"
          @click="emit('page-change', pagination.page + 1)"
        >
          Berikutnya
          <ChevronRight class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>
