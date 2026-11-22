<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus,
  FileSpreadsheet,
  FileText,
  Printer,
  Search,
  RotateCcw,
  Eye,
  Edit,
  Send,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-vue-next'
import { otherExpenseService } from '../services/other-expense.service'
import type {
  OtherExpenseHeader,
  OtherExpenseKpiSummary,
  OtherExpenseFilterParams
} from '../types/other-expense.types'
import OtherExpenseKpiCards from '../components/OtherExpenseKpiCards.vue'
import OtherExpensePostingModal from '../components/OtherExpensePostingModal.vue'
import OtherExpenseReversalModal from '../components/OtherExpenseReversalModal.vue'
import OtherExpensePrintModal from '../components/OtherExpensePrintModal.vue'
import { exportOtherExpenseListToExcel, exportOtherExpenseListToPdf } from '../utils/other-expense-export'
import { formatCurrency } from '@/shared/utils/formatters'
import { useToast } from '@/shared/composables/useToast'
import AppButton from '@/shared/components/ui/AppButton.vue'

const router = useRouter()
const toast = useToast()

// State
const loading = ref(false)
const kpiLoading = ref(false)
const items = ref<OtherExpenseHeader[]>([])
const kpi = ref<OtherExpenseKpiSummary | null>(null)
const totalItems = ref(0)
const totalPages = ref(1)

const filters = reactive<OtherExpenseFilterParams>({
  search: '',
  start_date: '',
  end_date: '',
  status: 'ALL',
  akun_beban: undefined,
  akun_kas: undefined,
  page: 1,
  limit: 20,
  sort_by: 'id',
  sort_dir: 'DESC'
})

// Modals
const showPostingModal = ref(false)
const showReversalModal = ref(false)
const showPrintModal = ref(false)
const selectedExpense = ref<OtherExpenseHeader | null>(null)
const actionLoading = ref(false)

async function fetchKpi() {
  kpiLoading.value = true
  try {
    kpi.value = await otherExpenseService.getKpi(filters)
  } catch (err) {
    console.error('Failed to load KPI:', err)
  } finally {
    kpiLoading.value = false
  }
}

async function fetchExpenses() {
  loading.value = true
  try {
    const res = await otherExpenseService.getExpenses(filters)
    items.value = res.items
    totalItems.value = res.total
    totalPages.value = res.totalPages
  } catch (err: any) {
    console.error('Failed to load other expenses:', err)
    toast.error(err.message || 'Gagal memuat daftar pengeluaran')
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  filters.page = 1
  fetchExpenses()
  fetchKpi()
}

function resetFilters() {
  filters.search = ''
  filters.start_date = ''
  filters.end_date = ''
  filters.status = 'ALL'
  filters.akun_beban = undefined
  filters.akun_kas = undefined
  filters.page = 1
  applyFilters()
}

function handlePageChange(newPage: number) {
  if (newPage < 1 || newPage > totalPages.value) return
  filters.page = newPage
  fetchExpenses()
}

// Actions
function openPostingModal(expense: OtherExpenseHeader) {
  selectedExpense.value = expense
  showPostingModal.value = true
}

async function handleConfirmPosting() {
  if (!selectedExpense.value) return
  actionLoading.value = true
  try {
    const posted = await otherExpenseService.postExpense(selectedExpense.value.id)
    toast.success(`Pengeluaran ${posted.trans_code} berhasil diposting. Jurnal: ${posted.journal_number}`)
    showPostingModal.value = false
    fetchExpenses()
    fetchKpi()
  } catch (err: any) {
    toast.error(err.message || 'Gagal memposting pengeluaran')
  } finally {
    actionLoading.value = false
  }
}

function openReversalModal(expense: OtherExpenseHeader) {
  selectedExpense.value = expense
  showReversalModal.value = true
}

async function handleConfirmReversal(data: { reason: string; reversal_date: string }) {
  if (!selectedExpense.value) return
  actionLoading.value = true
  try {
    const rev = await otherExpenseService.reverseExpense(selectedExpense.value.id, data)
    toast.success(`Pengeluaran ${rev.trans_code} berhasil direversal.`)
    showReversalModal.value = false
    fetchExpenses()
    fetchKpi()
  } catch (err: any) {
    toast.error(err.message || 'Gagal mereversal pengeluaran')
  } finally {
    actionLoading.value = false
  }
}

async function handleCancelDraft(expense: OtherExpenseHeader) {
  if (!confirm(`Batalkan draft pengeluaran ${expense.trans_code}?`)) return
  try {
    await otherExpenseService.cancelDraft(expense.id)
    toast.success(`Draft pengeluaran ${expense.trans_code} berhasil dibatalkan.`)
    fetchExpenses()
    fetchKpi()
  } catch (err: any) {
    toast.error(err.message || 'Gagal membatalkan draft')
  }
}

function openPrintModal(expense: OtherExpenseHeader) {
  selectedExpense.value = expense
  showPrintModal.value = true
}

function handleExportExcel() {
  exportOtherExpenseListToExcel(items.value, filters.status !== 'ALL' ? `Status: ${filters.status}` : undefined)
}

function handleExportPdf() {
  exportOtherExpenseListToPdf(items.value, filters.status !== 'ALL' ? `Status: ${filters.status}` : undefined)
}

onMounted(() => {
  fetchExpenses()
  fetchKpi()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
          Pengeluaran Lain
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Kelola pengeluaran operasional dan pembayaran kas/bank secara terintegrasi.
        </p>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <AppButton
          variant="outline"
          size="sm"
          class="border-slate-300 dark:border-slate-700"
          @click="handleExportExcel"
        >
          <FileSpreadsheet class="w-4 h-4 mr-1.5 text-emerald-600" />
          Export Excel
        </AppButton>

        <AppButton
          variant="outline"
          size="sm"
          class="border-slate-300 dark:border-slate-700"
          @click="handleExportPdf"
        >
          <FileText class="w-4 h-4 mr-1.5 text-rose-600" />
          Export PDF
        </AppButton>

        <AppButton
          variant="primary"
          size="sm"
          class="bg-teal-600 hover:bg-teal-700 text-white font-medium"
          @click="router.push('/accounting/other-expenses/create')"
        >
          <Plus class="w-4 h-4 mr-1.5" />
          Tambah Pengeluaran
        </AppButton>
      </div>
    </div>

    <!-- KPI Summary Cards -->
    <OtherExpenseKpiCards :kpi="kpi" :loading="kpiLoading" />

    <!-- Filter Bar -->
    <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <!-- Search -->
        <div class="relative md:col-span-2">
          <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            v-model="filters.search"
            type="text"
            placeholder="Cari kode pengeluaran, keperluan, nomor nota..."
            class="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white"
            @keyup.enter="applyFilters"
          />
        </div>

        <!-- Status Filter -->
        <div>
          <select
            v-model="filters.status"
            class="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white"
            @change="applyFilters"
          >
            <option value="ALL">Semua Status</option>
            <option value="DRAFT">Draft</option>
            <option value="POSTED">Selesai (Posted)</option>
            <option value="REVERSED">Reversed</option>
            <option value="CANCELLED">Dibatalkan</option>
          </select>
        </div>

        <!-- Date Range Filter -->
        <div class="flex items-center gap-1.5">
          <input
            v-model="filters.start_date"
            type="date"
            class="w-1/2 px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white"
            @change="applyFilters"
          />
          <span class="text-slate-400 text-xs">-</span>
          <input
            v-model="filters.end_date"
            type="date"
            class="w-1/2 px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white"
            @change="applyFilters"
          />
        </div>
      </div>

      <!-- Action filter buttons -->
      <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/50 text-xs">
        <span class="text-slate-400">
          Menampilkan {{ items.length }} dari {{ totalItems }} transaksi
        </span>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
            @click="resetFilters"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            Reset Filter
          </button>
          <AppButton
            variant="outline"
            size="sm"
            class="bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800"
            @click="applyFilters"
          >
            <Filter class="w-3.5 h-3.5 mr-1" />
            Terapkan Filter
          </AppButton>
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
              <th class="py-3 px-4">Kode Transaksi</th>
              <th class="py-3 px-4">Tanggal</th>
              <th class="py-3 px-4 min-w-[200px]">Keperluan / Keterangan</th>
              <th class="py-3 px-4">Akun Beban</th>
              <th class="py-3 px-4">Sumber Dana</th>
              <th class="py-3 px-4 text-right">Total (Rp)</th>
              <th class="py-3 px-4 text-center">Status</th>
              <th class="py-3 px-4">Dibuat Oleh</th>
              <th class="py-3 px-4 text-center">Aksi</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60">
            <!-- Loading State -->
            <tr v-if="loading">
              <td colspan="9" class="py-12 text-center text-slate-400">
                <div class="flex flex-col items-center justify-center gap-2">
                  <div class="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                  <span class="text-xs">Memuat data pengeluaran operasional...</span>
                </div>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-else-if="items.length === 0">
              <td colspan="9" class="py-16 text-center text-slate-400">
                <div class="max-w-xs mx-auto space-y-2">
                  <p class="text-sm font-semibold text-slate-600 dark:text-slate-300">Belum ada transaksi pengeluaran</p>
                  <p class="text-xs text-slate-400">Silakan buat pengeluaran operasional baru dengan tombol Tambah Pengeluaran.</p>
                </div>
              </td>
            </tr>

            <!-- Data Rows -->
            <tr
              v-for="item in items"
              :key="item.id"
              class="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors"
            >
              <!-- Kode -->
              <td class="py-3 px-4 font-mono font-bold text-slate-800 dark:text-white whitespace-nowrap">
                <button
                  type="button"
                  class="text-teal-600 hover:text-teal-700 hover:underline cursor-pointer"
                  @click="router.push(`/accounting/other-expenses/${item.id}`)"
                >
                  {{ item.trans_code }}
                </button>
              </td>

              <!-- Tanggal -->
              <td class="py-3 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                {{ item.tanggal }}
              </td>

              <!-- Keterangan -->
              <td class="py-3 px-4 text-slate-700 dark:text-slate-200">
                <div class="line-clamp-2">
                  {{ item.keterangan }}
                </div>
                <span v-if="item.reference_number" class="text-[10px] text-slate-400 font-mono">
                  Ref: {{ item.reference_number }}
                </span>
              </td>

              <!-- Akun Beban -->
              <td class="py-3 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                <div class="font-medium text-xs">{{ item.nama_akun_beban }}</div>
                <div class="text-[10px] text-slate-400 font-mono">{{ item.kode_akun_beban }}</div>
              </td>

              <!-- Sumber Dana -->
              <td class="py-3 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                <div class="font-medium text-xs">{{ item.nama_akun_kas }}</div>
                <div class="text-[10px] text-slate-400 font-mono">{{ item.kode_akun_kas }}</div>
              </td>

              <!-- Total Nominal -->
              <td class="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                {{ formatCurrency(item.total) }}
              </td>

              <!-- Status Badge -->
              <td class="py-3 px-4 text-center whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase"
                  :class="{
                    'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300': item.status === 'DRAFT',
                    'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300': item.status === 'POSTED',
                    'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300': item.status === 'REVERSED',
                    'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300': item.status === 'CANCELLED'
                  }"
                >
                  {{ item.status }}
                </span>
              </td>

              <!-- Dibuat Oleh -->
              <td class="py-3 px-4 text-slate-500 whitespace-nowrap text-xs">
                {{ item.creator_name || '-' }}
              </td>

              <!-- Aksi -->
              <td class="py-3 px-4 text-center whitespace-nowrap">
                <div class="flex items-center justify-center gap-1">
                  <!-- Detail -->
                  <button
                    type="button"
                    class="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    title="Lihat Detail"
                    @click="router.push(`/accounting/other-expenses/${item.id}`)"
                  >
                    <Eye class="w-4 h-4" />
                  </button>

                  <!-- Edit (Draft only) -->
                  <button
                    v-if="item.status === 'DRAFT'"
                    type="button"
                    class="p-1.5 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
                    title="Edit Draft"
                    @click="router.push(`/accounting/other-expenses/${item.id}/edit`)"
                  >
                    <Edit class="w-4 h-4" />
                  </button>

                  <!-- Posting (Draft only) -->
                  <button
                    v-if="item.status === 'DRAFT'"
                    type="button"
                    class="p-1.5 rounded-lg text-teal-600 hover:text-teal-800 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors"
                    title="Posting ke Jurnal"
                    @click="openPostingModal(item)"
                  >
                    <Send class="w-4 h-4" />
                  </button>

                  <!-- Reversal (Posted only) -->
                  <button
                    v-if="item.status === 'POSTED'"
                    type="button"
                    class="p-1.5 rounded-lg text-purple-600 hover:text-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                    title="Reversal Transaksi"
                    @click="openReversalModal(item)"
                  >
                    <RotateCcw class="w-4 h-4" />
                  </button>

                  <!-- Cancel (Draft only) -->
                  <button
                    v-if="item.status === 'DRAFT'"
                    type="button"
                    class="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                    title="Batalkan Draft"
                    @click="handleCancelDraft(item)"
                  >
                    <XCircle class="w-4 h-4" />
                  </button>

                  <!-- Cetak Voucher -->
                  <button
                    type="button"
                    class="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    title="Cetak Bukti Pengeluaran"
                    @click="openPrintModal(item)"
                  >
                    <Printer class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="px-6 py-3.5 border-t border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div class="flex items-center gap-2 text-slate-500">
          <span>Baris per halaman:</span>
          <select
            v-model="filters.limit"
            class="px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
            @change="applyFilters"
          >
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-slate-500">
            Halaman {{ filters.page }} dari {{ totalPages }}
          </span>

          <div class="flex items-center gap-1">
            <button
              type="button"
              class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="filters.page! <= 1"
              @click="handlePageChange(filters.page! - 1)"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
            <button
              type="button"
              class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="filters.page! >= totalPages"
              @click="handlePageChange(filters.page! + 1)"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <OtherExpensePostingModal
      v-model="showPostingModal"
      :expense="selectedExpense"
      :loading="actionLoading"
      @confirm="handleConfirmPosting"
    />

    <OtherExpenseReversalModal
      v-model="showReversalModal"
      :expense="selectedExpense"
      :loading="actionLoading"
      @confirm="handleConfirmReversal"
    />

    <OtherExpensePrintModal
      v-model="showPrintModal"
      :expense="selectedExpense"
    />
  </div>
</template>
