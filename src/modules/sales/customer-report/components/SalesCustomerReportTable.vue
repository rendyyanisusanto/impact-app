<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  FileText,
  Printer,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Receipt,
  ExternalLink
} from 'lucide-vue-next'
import type {
  CustomerReportItemRow,
  CustomerReportPagination,
  CustomerReportSummaryTotals,
  ReportColumnConfig
} from '../types/sales-customer-report.types'
import { formatCurrency } from '@/shared/utils/formatters'
import { formatDateIndo, getStatusBadgeText } from '../utils/sales-customer-report-export'

const props = defineProps<{
  items: CustomerReportItemRow[]
  pagination: CustomerReportPagination
  summary: CustomerReportSummaryTotals
  columns: ReportColumnConfig[]
  loading: boolean
  error: string | null
  sortBy: string
  sortDirection: 'ASC' | 'DESC'
}>()

const emit = defineEmits<{
  (e: 'sort', colKey: string): void
  (e: 'page-change', page: number): void
  (e: 'per-page-change', perPage: number): void
  (e: 'preview-so', row: CustomerReportItemRow): void
}>()

const router = useRouter()

const visibleColumns = computed(() => props.columns.filter(c => c.visible))

function handleSort(col: ReportColumnConfig) {
  if (col.sortable !== false) {
    emit('sort', col.key)
  }
}

// Range text calculation: "Menampilkan 1–25 dari 245 transaksi"
const rangeText = computed(() => {
  if (props.pagination.total_items === 0) return 'Tidak ada data transaksi'
  const start = (props.pagination.page - 1) * props.pagination.per_page + 1
  const end = Math.min(
    props.pagination.page * props.pagination.per_page,
    props.pagination.total_items
  )
  return `Menampilkan ${start}–${end} dari ${props.pagination.total_items} transaksi`
})

// Resolve route prefix for Sales Order based on order_type
function getSoRoutePrefix(orderType?: string | null): string {
  switch (orderType) {
    case 'NON_PPN':
      return '/sales/so-pola'
    case 'NON_PPN_2':
      return '/sales/so-ks'
    case 'PPN':
    default:
      return '/sales/so-impact'
  }
}

function navigateToSoDetail(item: CustomerReportItemRow) {
  const prefix = getSoRoutePrefix(item.order_type)
  router.push(`${prefix}/${item.id}`)
}

function navigateToSoPrint(item: CustomerReportItemRow) {
  const prefix = getSoRoutePrefix(item.order_type)
  router.push(`${prefix}/${item.id}/print`)
}

function handlePreview(item: CustomerReportItemRow) {
  const prefix = getSoRoutePrefix(item.order_type)
  router.push(`${prefix}/${item.id}/nota`)
}

function getBadgeStyle(status: number, statusAktif: number) {
  if (statusAktif === 0) {
    return 'bg-rose-50 text-rose-700 border-rose-200'
  }
  if (status === 1) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }
  return 'bg-amber-50 text-amber-700 border-amber-200'
}
</script>

<template>
  <div class="w-full bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
    <!-- TABLE CONTAINER (Excel-Like Data Grid) -->
    <div class="w-full overflow-x-auto min-h-[420px] max-h-[calc(100vh-270px)] relative scrollbar-thin scrollbar-thumb-slate-200">
      <table class="w-full text-left text-xs border-collapse">
        <!-- Sticky Header -->
        <thead class="sticky top-0 z-20 bg-slate-50 text-slate-700 uppercase tracking-wider font-semibold border-b border-slate-200 shadow-xs">
          <tr>
            <th
              v-for="col in visibleColumns"
              :key="col.key"
              class="px-3 py-2.5 select-none transition-colors border-r border-slate-200/60 last:border-r-0"
              :class="[
                col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                col.sortable !== false ? 'cursor-pointer hover:bg-slate-100/90' : '',
                col.width ? col.width : ''
              ]"
              @click="handleSort(col)"
            >
              <div
                class="inline-flex items-center gap-1.5"
                :class="col.align === 'right' ? 'justify-end w-full' : col.align === 'center' ? 'justify-center w-full' : ''"
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
          <!-- Loading Skeletons -->
          <template v-if="loading">
            <tr v-for="n in 8" :key="`skel-${n}`" class="animate-pulse">
              <td
                v-for="col in visibleColumns"
                :key="`skel-cell-${col.key}`"
                class="px-3 py-3 border-r border-slate-100 last:border-r-0"
              >
                <div class="h-3.5 bg-slate-200/80 rounded" :class="col.align === 'right' ? 'ml-auto w-20' : 'w-24'"></div>
              </td>
            </tr>
          </template>

          <!-- Empty State -->
          <template v-else-if="items.length === 0">
            <tr>
              <td :colspan="visibleColumns.length" class="py-16 text-center">
                <div class="flex flex-col items-center justify-center max-w-sm mx-auto">
                  <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
                    <Receipt class="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <h4 class="text-sm font-semibold text-slate-800 mb-1">
                    Tidak Ada Transaksi Ditemukan
                  </h4>
                  <p class="text-xs text-slate-500">
                    Tidak ditemukan riwayat Sales Order untuk kriteria filter ini. Coba sesuaikan periode atau status transaksi.
                  </p>
                </div>
              </td>
            </tr>
          </template>

          <!-- Normal Data Rows (1 SO ID = 1 Row) -->
          <template v-else>
            <tr
              v-for="(item, index) in items"
              :key="item.id"
              class="hover:bg-teal-50/40 transition-colors duration-75 group border-b border-slate-100"
            >
              <td
                v-for="col in visibleColumns"
                :key="col.key"
                class="px-3 py-2.5 border-r border-slate-100 last:border-r-0"
                :class="[
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                ]"
              >
                <!-- Row Number -->
                <template v-if="col.key === 'no'">
                  <span class="text-slate-400 font-mono text-[11px]">
                    {{ (pagination.page - 1) * pagination.per_page + index + 1 }}
                  </span>
                </template>

                <!-- Tanggal -->
                <template v-else-if="col.key === 'tanggal'">
                  <span class="text-slate-700 whitespace-nowrap">
                    {{ formatDateIndo(item.tanggal) }}
                  </span>
                </template>

                <!-- Nomor SO (Drill-Down Link) -->
                <template v-else-if="col.key === 'kode'">
                  <button
                    type="button"
                    class="font-semibold text-teal-700 hover:text-teal-900 hover:underline inline-flex items-center gap-1 transition"
                    title="Buka detail Sales Order"
                    @click="navigateToSoDetail(item)"
                  >
                    <span>{{ item.kode }}</span>
                    <ExternalLink class="w-3 h-3 opacity-60 group-hover:opacity-100 shrink-0" />
                  </button>
                </template>

                <!-- Currency fields -->
                <template v-else-if="['subtotal', 'total_ppn', 'diskon', 'total'].includes(col.key)">
                  <span
                    class="font-medium font-mono"
                    :class="col.key === 'total' ? 'text-slate-900 font-semibold' : 'text-slate-700'"
                  >
                    {{ formatCurrency(Number(item[col.key as keyof CustomerReportItemRow]) || 0) }}
                  </span>
                </template>

                <!-- Status Badge -->
                <template v-else-if="col.key === 'status'">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border tracking-wider"
                    :class="getBadgeStyle(item.status, item.status_aktif)"
                  >
                    {{ getStatusBadgeText(item.status, item.status_aktif) }}
                  </span>
                </template>

                <!-- Keterangan -->
                <template v-else-if="col.key === 'keterangan'">
                  <span class="text-slate-600 line-clamp-1" :title="item.keterangan || '-'">
                    {{ item.keterangan || '-' }}
                  </span>
                </template>

                <!-- Optional: Dibuat Oleh -->
                <template v-else-if="col.key === 'creator_username'">
                  <span class="text-slate-600">
                    {{ item.creator_username || '-' }}
                  </span>
                </template>

                <!-- Optional: Tanggal Dibuat / Diperbarui -->
                <template v-else-if="col.key === 'created_at' || col.key === 'updated_at'">
                  <span class="text-slate-500 text-[11px]">
                    {{ item[col.key] ? new Date(item[col.key]!).toLocaleString('id-ID') : '-' }}
                  </span>
                </template>

                <!-- Optional: Tipe Order -->
                <template v-else-if="col.key === 'order_type'">
                  <span class="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                    {{ item.order_type || 'NON_PPN' }}
                  </span>
                </template>

                <!-- Aksi (Detail, Preview, Print) -->
                <template v-else-if="col.key === 'aksi'">
                  <div class="flex items-center justify-center gap-1">
                    <!-- Lihat Detail -->
                    <button
                      type="button"
                      class="p-1 rounded text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition"
                      title="Lihat Detail SO"
                      @click="navigateToSoDetail(item)"
                    >
                      <Eye class="w-4 h-4" />
                    </button>

                    <!-- Preview Dokumen / Nota -->
                    <button
                      type="button"
                      class="p-1 rounded text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition"
                      title="Preview Nota SO"
                      @click="handlePreview(item)"
                    >
                      <FileText class="w-4 h-4" />
                    </button>

                    <!-- Cetak Faktur SO -->
                    <button
                      type="button"
                      class="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                      title="Cetak Faktur SO"
                      @click="navigateToSoPrint(item)"
                    >
                      <Printer class="w-4 h-4" />
                    </button>
                  </div>
                </template>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- COMPACT SUMMARY FOOTER (Calculated across entire filtered dataset) -->
    <div
      v-if="!loading && items.length > 0"
      class="bg-slate-50/90 border-t border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-4 text-xs"
    >
      <div class="flex items-center gap-2 font-medium text-slate-600">
        <span>Rekapitulasi:</span>
        <span class="bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded text-[11px]">
          {{ summary.total_orders }} Transaksi
        </span>
      </div>

      <div class="flex flex-wrap items-center gap-4 sm:gap-6 text-slate-700 font-mono">
        <div>
          <span class="text-slate-500 mr-1.5 font-sans">Subtotal:</span>
          <span class="font-semibold text-slate-900">{{ formatCurrency(summary.subtotal) }}</span>
        </div>
        <div>
          <span class="text-slate-500 mr-1.5 font-sans">Diskon:</span>
          <span class="font-semibold text-slate-900">{{ formatCurrency(summary.discount) }}</span>
        </div>
        <div>
          <span class="text-slate-500 mr-1.5 font-sans">PPN:</span>
          <span class="font-semibold text-slate-900">{{ formatCurrency(summary.tax) }}</span>
        </div>
        <div class="pl-3 border-l border-slate-300">
          <span class="text-slate-600 mr-1.5 font-sans font-semibold">Grand Total:</span>
          <span class="font-bold text-teal-800 text-sm">{{ formatCurrency(summary.grand_total) }}</span>
        </div>
      </div>
    </div>

    <!-- PAGINATION FOOTER -->
    <div
      class="border-t border-slate-200 px-4 py-3 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600"
    >
      <div class="flex items-center gap-3">
        <span>{{ rangeText }}</span>
        <div class="flex items-center gap-1.5">
          <span class="text-slate-400">|</span>
          <label class="text-slate-500">Per Halaman:</label>
          <select
            :value="pagination.per_page"
            class="rounded border border-slate-300 px-2 py-1 bg-white text-xs outline-none focus:ring-1 focus:ring-teal-500"
            @change="emit('per-page-change', Number(($event.target as HTMLSelectElement).value))"
          >
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </div>
      </div>

      <!-- Page navigation buttons -->
      <div class="flex items-center gap-1">
        <button
          type="button"
          class="p-1 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          :disabled="pagination.page <= 1"
          title="Halaman Pertama"
          @click="emit('page-change', 1)"
        >
          <ChevronsLeft class="w-4 h-4" />
        </button>
        <button
          type="button"
          class="p-1 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          :disabled="pagination.page <= 1"
          title="Halaman Sebelumnya"
          @click="emit('page-change', pagination.page - 1)"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>

        <span class="px-2 font-medium text-slate-700">
          Hal. {{ pagination.page }} dari {{ pagination.total_pages || 1 }}
        </span>

        <button
          type="button"
          class="p-1 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          :disabled="pagination.page >= pagination.total_pages"
          title="Halaman Berikutnya"
          @click="emit('page-change', pagination.page + 1)"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
        <button
          type="button"
          class="p-1 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          :disabled="pagination.page >= pagination.total_pages"
          title="Halaman Terakhir"
          @click="emit('page-change', pagination.total_pages)"
        >
          <ChevronsRight class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
