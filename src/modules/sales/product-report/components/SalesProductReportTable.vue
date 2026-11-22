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
  ExternalLink,
  ChevronRightCircle
} from 'lucide-vue-next'
import { formatCurrency } from '@/shared/utils/formatters'
import { formatDateIndo, formatNumberIndo } from '../utils/sales-product-report-export'
import type {
  ProductReportMode,
  ReportColumnConfig,
  ProductReportSummaryTotals,
  ProductReportPagination,
  ProductReportSummaryRow,
  ProductReportDetailRow
} from '../types/sales-product-report.types'

const props = defineProps<{
  mode: ProductReportMode
  columns: ReportColumnConfig[]
  items: (ProductReportSummaryRow | ProductReportDetailRow)[]
  pagination: ProductReportPagination
  summaryTotals?: ProductReportSummaryTotals
  loading: boolean
  error: string | null
  sortBy?: string
  sortDirection?: 'ASC' | 'DESC'
}>()

const emit = defineEmits<{
  (e: 'sort', colKey: string): void
  (e: 'page-change', page: number): void
  (e: 'per-page-change', perPage: number): void
  (e: 'drilldown', customerId: number): void
  (e: 'retry'): void
}>()

const router = useRouter()

const visibleColumns = computed(() => props.columns.filter(c => c.visible))

function handleSort(col: ReportColumnConfig) {
  if (col.sortable !== false) {
    emit('sort', col.key)
  }
}

// Range text: "Menampilkan 1-25 dari 100 baris"
const rangeText = computed(() => {
  if (props.pagination.total_items === 0) return 'Tidak ada data'
  const start = (props.pagination.page - 1) * props.pagination.per_page + 1
  const end = Math.min(
    props.pagination.page * props.pagination.per_page,
    props.pagination.total_items
  )
  return `Menampilkan ${start}-${end} dari ${props.pagination.total_items} baris`
})

// Navigation to SO
function navigateToSo(soId?: number | null, orderType?: string | null) {
  if (!soId) return
  if (orderType === 'PPN') {
    router.push(`/sales/so-impact/${soId}`)
  } else if (orderType === 'NON_PPN_2') {
    router.push(`/sales/so-ks/${soId}`)
  } else {
    router.push(`/sales/so-pola/${soId}`)
  }
}

function getSoStatusBadge(status: number, statusAktif: number) {
  if (statusAktif === 0) {
    return { text: 'Dibatalkan', class: 'bg-rose-50 text-rose-700 border-rose-200' }
  }
  if (status === 1) {
    return { text: 'Disetujui', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  }
  return { text: 'Draft', class: 'bg-amber-50 text-amber-700 border-amber-200' }
}
</script>

<template>
  <div class="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
    <!-- Table Container with Horizontal Scroll & Sticky Header -->
    <div class="relative overflow-x-auto min-h-[300px] max-h-[620px]">
      <table class="w-full text-left text-xs border-collapse">
        <!-- Sticky Header -->
        <thead class="sticky top-0 z-10 bg-slate-100 text-slate-700 uppercase tracking-wider font-bold text-[11px] shadow-sm select-none border-b border-slate-200">
          <tr>
            <th
              v-for="col in visibleColumns"
              :key="col.key"
              class="py-2.5 px-3 transition"
              :class="[
                col.width || '',
                col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                col.sortable !== false ? 'cursor-pointer hover:bg-slate-200/70' : ''
              ]"
              @click="handleSort(col)"
            >
              <div
                class="inline-flex items-center gap-1.5"
                :class="{
                  'justify-end': col.align === 'right',
                  'justify-center': col.align === 'center'
                }"
              >
                <span>{{ col.label }}</span>
                <span v-if="col.sortable !== false" class="text-slate-400">
                  <ArrowUp v-if="sortBy === col.key && sortDirection === 'ASC'" class="w-3.5 h-3.5 text-primary-600" />
                  <ArrowDown v-else-if="sortBy === col.key && sortDirection === 'DESC'" class="w-3.5 h-3.5 text-primary-600" />
                  <ArrowUpDown v-else class="w-3 h-3 text-slate-400 opacity-60" />
                </span>
              </div>
            </th>
          </tr>
        </thead>

        <!-- Loading Skeleton -->
        <tbody v-if="loading" class="divide-y divide-slate-100">
          <tr v-for="n in 6" :key="n" class="animate-pulse">
            <td v-for="col in visibleColumns" :key="col.key" class="py-3 px-3">
              <div class="h-3.5 bg-slate-200/70 rounded w-full"></div>
            </td>
          </tr>
        </tbody>

        <!-- Error State -->
        <tbody v-else-if="error">
          <tr>
            <td :colspan="visibleColumns.length" class="py-12 text-center">
              <div class="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto text-rose-600">
                <AlertCircle class="w-8 h-8 text-rose-500" />
                <span class="font-semibold text-sm">{{ error }}</span>
                <p class="text-xs text-slate-500">Gagal mengambil data dari server. Silakan coba kembali.</p>
                <button
                  type="button"
                  class="mt-2 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition"
                  @click="emit('retry')"
                >
                  Coba Lagi
                </button>
              </div>
            </td>
          </tr>
        </tbody>

        <!-- Empty State -->
        <tbody v-else-if="items.length === 0">
          <tr>
            <td :colspan="visibleColumns.length" class="py-16 text-center">
              <div class="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto text-slate-400">
                <FileSearch class="w-10 h-10 text-slate-300 stroke-[1.5]" />
                <span class="font-semibold text-sm text-slate-700">Data Tidak Ditemukan</span>
                <p class="text-xs text-slate-500">
                  Tidak ada transaksi yang sesuai dengan parameter produk dan filter yang dipilih.
                </p>
              </div>
            </td>
          </tr>
        </tbody>

        <!-- Data Rows -->
        <tbody v-else class="divide-y divide-slate-100/90 text-slate-700">
          <!-- MODE 1: SUMMARY ROWS -->
          <template v-if="mode === 'summary'">
            <tr
              v-for="(row, idx) in (items as ProductReportSummaryRow[])"
              :key="row.customer_id"
              class="even:bg-slate-50/40 hover:bg-blue-50/40 transition group"
            >
              <td
                v-for="col in visibleColumns"
                :key="col.key"
                class="py-2.5 px-3 whitespace-nowrap"
                :class="[
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                ]"
              >
                <!-- No -->
                <span v-if="col.key === 'no'" class="text-slate-400 font-mono text-[11px]">
                  {{ (pagination.page - 1) * pagination.per_page + idx + 1 }}
                </span>

                <!-- Customer Code -->
                <span v-else-if="col.key === 'customer_code'" class="font-mono text-slate-600">
                  {{ row.customer_code || '-' }}
                </span>

                <!-- Customer Name -->
                <span
                  v-else-if="col.key === 'customer_name'"
                  class="font-semibold text-slate-800 hover:text-primary-600 cursor-pointer inline-flex items-center gap-1"
                  @click="emit('drilldown', row.customer_id)"
                >
                  {{ row.customer_name }}
                  <ChevronRightCircle class="w-3.5 h-3.5 text-primary-400 opacity-0 group-hover:opacity-100 transition" />
                </span>

                <!-- Jumlah SO -->
                <span v-else-if="col.key === 'so_count'" class="font-medium text-slate-700">
                  {{ formatNumberIndo(row.so_count) }}
                </span>

                <!-- Total Qty -->
                <span v-else-if="col.key === 'total_qty'" class="font-bold text-slate-900">
                  {{ formatNumberIndo(row.total_qty) }}
                </span>

                <!-- Kontribusi Persentase Qty -->
                <div v-else-if="col.key === 'qty_percentage'" class="inline-flex items-center gap-1.5 justify-end">
                  <span class="font-semibold text-primary-700">{{ row.qty_percentage }}%</span>
                  <div class="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                    <div
                      class="h-full bg-primary-500 rounded-full"
                      :style="{ width: `${Math.min(100, row.qty_percentage)}%` }"
                    ></div>
                  </div>
                </div>

                <!-- Total Nilai Nominal -->
                <span v-else-if="col.key === 'total_amount'" class="font-medium text-slate-700">
                  {{ formatCurrency(row.total_amount) }}
                </span>

                <!-- Tanggal Pembelian Terakhir -->
                <span v-else-if="col.key === 'last_purchase_date'" class="text-slate-600 text-[11px]">
                  {{ formatDateIndo(row.last_purchase_date) }}
                </span>

                <!-- Action Button: Detail -->
                <div v-else-if="col.key === 'aksi'" class="flex items-center justify-center">
                  <button
                    type="button"
                    class="px-2.5 py-1 rounded bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200/80 font-semibold text-[11px] transition shadow-2xs"
                    @click="emit('drilldown', row.customer_id)"
                  >
                    Detail
                  </button>
                </div>
              </td>
            </tr>
          </template>

          <!-- MODE 2 & 3: DETAIL ROWS (CHRONOLOGICAL & CUSTOMER DETAIL) -->
          <template v-else>
            <tr
              v-for="(row, idx) in (items as ProductReportDetailRow[])"
              :key="row.detail_id"
              class="even:bg-slate-50/40 hover:bg-blue-50/40 transition group"
            >
              <td
                v-for="col in visibleColumns"
                :key="col.key"
                class="py-2.5 px-3 whitespace-nowrap"
                :class="[
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                ]"
              >
                <!-- No -->
                <span v-if="col.key === 'no'" class="text-slate-400 font-mono text-[11px]">
                  {{ (pagination.page - 1) * pagination.per_page + idx + 1 }}
                </span>

                <!-- Tanggal SO -->
                <span v-else-if="col.key === 'tanggal'" class="text-slate-700 font-mono text-[11px]">
                  {{ formatDateIndo(row.tanggal) }}
                </span>

                <!-- Nomor SO -->
                <button
                  v-else-if="col.key === 'nomor_so'"
                  type="button"
                  class="font-mono font-medium text-primary-600 hover:text-primary-800 hover:underline inline-flex items-center gap-1"
                  @click="navigateToSo(row.sales_order_id, row.order_type)"
                >
                  {{ row.nomor_so }}
                  <ExternalLink class="w-3 h-3 text-primary-400" />
                </button>

                <!-- Kode Produk -->
                <span v-else-if="col.key === 'kode_produk'" class="font-mono text-slate-600">
                  {{ row.kode_produk || '-' }}
                </span>

                <!-- Nama Produk -->
                <span v-else-if="col.key === 'nama_produk'" class="font-medium text-slate-800">
                  {{ row.nama_produk }}
                </span>

                <!-- Customer -->
                <span
                  v-else-if="col.key === 'customer_name'"
                  class="font-medium text-slate-800"
                  :class="mode === 'chronological' ? 'hover:text-primary-600 cursor-pointer' : ''"
                  @click="mode === 'chronological' && row.customer_id ? emit('drilldown', row.customer_id) : null"
                >
                  {{ row.customer_name }}
                </span>

                <!-- Keterangan Item -->
                <span v-else-if="col.key === 'item_keterangan'" class="text-slate-600 italic max-w-xs truncate block" :title="row.item_keterangan || ''">
                  {{ row.item_keterangan || '-' }}
                </span>

                <!-- Qty -->
                <span v-else-if="col.key === 'qty'" class="font-bold text-slate-900">
                  {{ formatNumberIndo(row.qty) }}
                  <span v-if="row.satuan" class="text-[10px] text-slate-400 font-normal ml-0.5">{{ row.satuan }}</span>
                </span>

                <!-- Harga Satuan -->
                <span v-else-if="col.key === 'harga'" class="font-medium text-slate-700">
                  {{ formatCurrency(row.harga) }}
                </span>

                <!-- Diskon -->
                <span v-else-if="col.key === 'diskon'" class="text-slate-600">
                  {{ row.diskon }}%
                </span>

                <!-- Subtotal Item -->
                <span v-else-if="col.key === 'subtotal'" class="font-semibold text-slate-900">
                  {{ formatCurrency(row.subtotal) }}
                </span>

                <!-- Status SO Badge -->
                <div v-else-if="col.key === 'status_so'" class="inline-flex justify-center">
                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                    :class="getSoStatusBadge(row.so_status, row.so_status_aktif).class"
                  >
                    {{ getSoStatusBadge(row.so_status, row.so_status_aktif).text }}
                  </span>
                </div>

                <!-- Aksi -->
                <div v-else-if="col.key === 'aksi'" class="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    class="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-medium text-[10px] transition"
                    @click="navigateToSo(row.sales_order_id, row.order_type)"
                  >
                    Lihat SO
                  </button>
                  <button
                    v-if="mode === 'chronological' && row.customer_id"
                    type="button"
                    class="px-2 py-0.5 rounded bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200 font-medium text-[10px] transition"
                    @click="emit('drilldown', row.customer_id)"
                  >
                    Detail
                  </button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>

        <!-- Table Footer Summary Row (Reconciled totals across full filter) -->
        <tfoot v-if="items.length > 0 && summaryTotals" class="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300">
          <!-- Summary Mode Footer -->
          <tr v-if="mode === 'summary'">
            <td colspan="3" class="py-2.5 px-3 text-center text-xs text-slate-700">
              TOTAL KESELURUHAN ({{ summaryTotals.total_customers }} Customer)
            </td>
            <td class="py-2.5 px-3 text-right font-bold text-slate-900">
              {{ formatNumberIndo(summaryTotals.total_so) }} SO
            </td>
            <td class="py-2.5 px-3 text-right font-extrabold text-primary-700 text-sm">
              {{ formatNumberIndo(summaryTotals.total_qty) }}
            </td>
            <td class="py-2.5 px-3 text-right font-bold text-primary-700">
              100%
            </td>
            <td class="py-2.5 px-3 text-right font-bold text-slate-900">
              {{ formatCurrency(summaryTotals.total_amount) }}
            </td>
            <td colspan="2"></td>
          </tr>

          <!-- Chronological & Customer Detail Footer -->
          <tr v-else>
            <td colspan="4" class="py-2.5 px-3 text-center text-xs text-slate-700">
              TOTAL ({{ summaryTotals.total_so }} SO{{ mode === 'chronological' ? `, ${summaryTotals.total_customers} Customer` : '' }})
            </td>
            <td></td>
            <td class="py-2.5 px-3 text-right font-extrabold text-primary-700 text-sm">
              {{ formatNumberIndo(summaryTotals.total_qty) }}
            </td>
            <td colspan="2"></td>
            <td class="py-2.5 px-3 text-right font-bold text-slate-900">
              {{ formatCurrency(summaryTotals.total_amount) }}
            </td>
            <td colspan="2"></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Pagination & Range Bar -->
    <div class="px-4 py-3 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
      <!-- Left: Total Metrics & Range -->
      <div class="flex flex-wrap items-center gap-3 text-slate-600">
        <span class="font-medium">{{ rangeText }}</span>
        <span class="text-slate-300">|</span>
        <div class="flex items-center gap-1.5">
          <span>Baris per halaman:</span>
          <select
            :value="pagination.per_page"
            class="text-xs rounded border border-slate-300 bg-white px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500 font-medium"
            @change="emit('per-page-change', Number(($event.target as HTMLSelectElement).value))"
          >
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </div>
      </div>

      <!-- Right: Pagination Buttons -->
      <div v-if="pagination.total_pages > 1" class="flex items-center gap-1">
        <button
          type="button"
          class="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          :disabled="pagination.page <= 1"
          @click="emit('page-change', pagination.page - 1)"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>

        <span class="px-2 font-medium text-slate-700">
          {{ pagination.page }} / {{ pagination.total_pages }}
        </span>

        <button
          type="button"
          class="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          :disabled="pagination.page >= pagination.total_pages"
          @click="emit('page-change', pagination.page + 1)"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
