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
import { otherIncomeService } from '../services/other-income.service'
import type {
  OtherIncomeHeader,
  OtherIncomeKpiSummary,
  OtherIncomeFilterParams
} from '../types/other-income.types'
import OtherIncomeKpiCards from '../components/OtherIncomeKpiCards.vue'
import OtherIncomePostingModal from '../components/OtherIncomePostingModal.vue'
import OtherIncomeReversalModal from '../components/OtherIncomeReversalModal.vue'
import OtherIncomePrintModal from '../components/OtherIncomePrintModal.vue'
import { exportOtherIncomeListToExcel, exportOtherIncomeListToPdf } from '../utils/other-income-export'
import { formatCurrency } from '@/shared/utils/formatters'
import { useToast } from '@/shared/composables/useToast'
import AppButton from '@/shared/components/ui/AppButton.vue'

const router = useRouter()
const toast = useToast()

// State
const loading = ref(false)
const kpiLoading = ref(false)
const items = ref<OtherIncomeHeader[]>([])
const kpi = ref<OtherIncomeKpiSummary | null>(null)
const totalItems = ref(0)
const totalPages = ref(1)

const filters = reactive<OtherIncomeFilterParams>({
  search: '',
  start_date: '',
  end_date: '',
  status: 'ALL',
  akun_sumber: undefined,
  akun_kas: undefined,
  received_from: '',
  page: 1,
  limit: 20,
  sort_by: 'id',
  sort_dir: 'DESC'
})

// Modals
const showPostingModal = ref(false)
const showReversalModal = ref(false)
const showPrintModal = ref(false)
const selectedIncome = ref<OtherIncomeHeader | null>(null)

async function fetchKpi() {
  kpiLoading.value = true
  try {
    kpi.value = await otherIncomeService.getKpi(filters)
  } catch (err) {
    console.error('Failed to load KPI:', err)
  } finally {
    kpiLoading.value = false
  }
}

async function fetchIncomes() {
  loading.value = true
  try {
    const res = await otherIncomeService.getIncomes(filters)
    items.value = res.items
    totalItems.value = res.total
    totalPages.value = res.totalPages
  } catch (err: any) {
    console.error('Failed to load other incomes:', err)
    toast.error(err.message || 'Gagal memuat daftar pemasukan')
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  filters.page = 1
  fetchIncomes()
  fetchKpi()
}

function resetFilters() {
  filters.search = ''
  filters.start_date = ''
  filters.end_date = ''
  filters.status = 'ALL'
  filters.akun_sumber = undefined
  filters.akun_kas = undefined
  filters.received_from = ''
  filters.page = 1
  fetchIncomes()
  fetchKpi()
}

function goToPage(p: number) {
  if (p < 1 || p > totalPages.value) return
  filters.page = p
  fetchIncomes()
}

function openCreatePage() {
  router.push('/accounting/other-income/create')
}

function openDetailPage(id: number) {
  router.push(`/accounting/other-income/${id}`)
}

function openEditPage(id: number) {
  router.push(`/accounting/other-income/${id}/edit`)
}

function openPostingModal(item: OtherIncomeHeader) {
  selectedIncome.value = item
  showPostingModal.value = true
}

function openReversalModal(item: OtherIncomeHeader) {
  selectedIncome.value = item
  showReversalModal.value = true
}

function openPrintModal(item: OtherIncomeHeader) {
  selectedIncome.value = item
  showPrintModal.value = true
}

async function handleCancelDraft(item: OtherIncomeHeader) {
  if (!confirm(`Batalkan draft pemasukan ${item.trans_code}?`)) return
  try {
    await otherIncomeService.cancelDraft(item.id)
    toast.success(`Draft pemasukan ${item.trans_code} berhasil dibatalkan.`)
    fetchIncomes()
    fetchKpi()
  } catch (err: any) {
    toast.error(err.message || 'Gagal membatalkan draft')
  }
}

function handleExportExcel() {
  exportOtherIncomeListToExcel(items.value, `Periode: ${filters.start_date || 'Semua'} s/d ${filters.end_date || 'Semua'}`)
}

function handleExportPdf() {
  exportOtherIncomeListToPdf(items.value, `Periode: ${filters.start_date || 'Semua'} s/d ${filters.end_date || 'Semua'}`)
}

function handleBatchPrint() {
  window.print()
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'POSTED':
      return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
    case 'DRAFT':
      return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
    case 'REVERSED':
      return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
    case 'CANCELLED':
      return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

onMounted(() => {
  fetchIncomes()
  fetchKpi()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header Page -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Pemasukan Lain
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Kelola penerimaan kas dan bank di luar transaksi penjualan utama.
        </p>
      </div>

      <!-- Header Actions -->
      <div class="flex items-center flex-wrap gap-2.5">
        <AppButton
          variant="secondary"
          size="sm"
          class="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
          @click="handleExportExcel"
        >
          <FileSpreadsheet class="w-4 h-4 mr-1.5 text-emerald-600" />
          Export Excel
        </AppButton>
        <AppButton
          variant="secondary"
          size="sm"
          class="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
          @click="handleExportPdf"
        >
          <FileText class="w-4 h-4 mr-1.5 text-rose-600" />
          Export PDF
        </AppButton>
        <AppButton
          variant="secondary"
          size="sm"
          class="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
          @click="handleBatchPrint"
        >
          <Printer class="w-4 h-4 mr-1.5 text-slate-600 dark:text-slate-400" />
          Cetak
        </AppButton>
        <AppButton
          variant="primary"
          size="sm"
          class="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
          @click="openCreatePage"
        >
          <Plus class="w-4 h-4 mr-1.5" />
          Tambah Pemasukan
        </AppButton>
      </div>
    </div>

    <!-- KPI Summary Cards -->
    <OtherIncomeKpiCards :kpi="kpi" :loading="kpiLoading" />

    <!-- Filter & Search Bar -->
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Search Input -->
        <div class="sm:col-span-2 relative">
          <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Pencarian Cepat
          </label>
          <div class="relative">
            <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              v-model="filters.search"
              type="text"
              placeholder="Cari kode pemasukan, keterangan, diterima dari..."
              class="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
              @keyup.enter="applyFilters"
            />
          </div>
        </div>

        <!-- Filter Status -->
        <div>
          <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Status Dokumen
          </label>
          <select
            v-model="filters.status"
            class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 dark:text-slate-100"
            @change="applyFilters"
          >
            <option value="ALL">Semua Status</option>
            <option value="DRAFT">Draft</option>
            <option value="POSTED">Posted (Final)</option>
            <option value="REVERSED">Reversed</option>
            <option value="CANCELLED">Dibatalkan</option>
          </select>
        </div>

        <!-- Filter Tanggal Mulai -->
        <div>
          <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Tanggal Mulai
          </label>
          <input
            v-model="filters.start_date"
            type="date"
            class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 dark:text-slate-100"
            @change="applyFilters"
          />
        </div>

        <!-- Filter Tanggal Akhir -->
        <div>
          <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Tanggal Akhir
          </label>
          <input
            v-model="filters.end_date"
            type="date"
            class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 dark:text-slate-100"
            @change="applyFilters"
          />
        </div>
      </div>

      <!-- Action Buttons for Filter -->
      <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <AppButton
          variant="secondary"
          size="sm"
          class="text-xs"
          @click="resetFilters"
        >
          <RotateCcw class="w-3.5 h-3.5 mr-1.5" />
          Reset Filter
        </AppButton>
        <AppButton
          variant="primary"
          size="sm"
          class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
          @click="applyFilters"
        >
          <Filter class="w-3.5 h-3.5 mr-1.5" />
          Terapkan Filter
        </AppButton>
      </div>
    </div>

    <!-- Table Section -->
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <th class="py-3 px-4 w-12 text-center">#</th>
              <th class="py-3 px-4">Kode Pemasukan</th>
              <th class="py-3 px-4">Tanggal</th>
              <th class="py-3 px-4">Keterangan</th>
              <th class="py-3 px-4">Diterima Dari</th>
              <th class="py-3 px-4">Akun Sumber</th>
              <th class="py-3 px-4">Kas/Bank Penerima</th>
              <th class="py-3 px-4 text-right">Total (Rp)</th>
              <th class="py-3 px-4 text-center">Status</th>
              <th class="py-3 px-4">Dibuat Oleh</th>
              <th class="py-3 px-4 text-center w-32">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
            <!-- Loading State -->
            <tr v-if="loading">
              <td colspan="11" class="py-12 text-center text-slate-400">
                <div class="flex items-center justify-center gap-2">
                  <div class="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Memuat data pemasukan...</span>
                </div>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-else-if="items.length === 0">
              <td colspan="11" class="py-12 text-center text-slate-400">
                <FileText class="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p class="font-medium text-sm text-slate-600 dark:text-slate-300">
                  Belum ada transaksi pemasukan lain
                </p>
                <p class="text-xs text-slate-400 mt-0.5">
                  Klik tombol "Tambah Pemasukan" untuk membuat penerimaan kas/bank baru.
                </p>
              </td>
            </tr>

            <!-- Data Rows -->
            <tr
              v-for="(row, idx) in items"
              v-else
              :key="row.id"
              class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
            >
              <td class="py-3 px-4 text-center text-slate-400 font-mono">
                {{ ((filters.page || 1) - 1) * (filters.limit || 20) + idx + 1 }}
              </td>
              <td class="py-3 px-4">
                <span class="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer" @click="openDetailPage(row.id)">
                  {{ row.trans_code }}
                </span>
                <span v-if="row.journal_number" class="block text-[10px] text-slate-400 font-mono">
                  Ref Jurnal: {{ row.journal_number }}
                </span>
              </td>
              <td class="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                {{ row.tanggal }}
              </td>
              <td class="py-3 px-4 max-w-xs truncate" :title="row.keterangan">
                {{ row.keterangan }}
              </td>
              <td class="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                {{ row.received_from || '-' }}
              </td>
              <td class="py-3 px-4">
                <div class="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]" :title="row.nama_akun_sumber || '-'">
                  {{ row.nama_akun_sumber || '-' }}
                </div>
                <span class="text-[10px] text-slate-400 font-mono">{{ row.kode_akun_sumber || '' }}</span>
              </td>
              <td class="py-3 px-4">
                <div class="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]" :title="row.nama_akun_kas || '-'">
                  {{ row.nama_akun_kas || '-' }}
                </div>
                <span class="text-[10px] text-slate-400 font-mono">{{ row.kode_akun_kas || '' }}</span>
              </td>
              <td class="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                {{ formatCurrency(row.total) }}
              </td>
              <td class="py-3 px-4 text-center whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide"
                  :class="getStatusBadgeClass(row.status)"
                >
                  {{ row.status }}
                </span>
              </td>
              <td class="py-3 px-4 text-slate-500 whitespace-nowrap">
                {{ row.creator_name || '-' }}
              </td>
              <td class="py-3 px-4 text-center whitespace-nowrap">
                <div class="flex items-center justify-center gap-1">
                  <!-- Detail -->
                  <button
                    type="button"
                    title="Lihat Detail"
                    class="p-1 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
                    @click="openDetailPage(row.id)"
                  >
                    <Eye class="w-4 h-4" />
                  </button>

                  <!-- Edit (Draft only) -->
                  <button
                    v-if="row.status === 'DRAFT'"
                    type="button"
                    title="Edit Draft"
                    class="p-1 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                    @click="openEditPage(row.id)"
                  >
                    <Edit class="w-4 h-4" />
                  </button>

                  <!-- Posting (Draft only) -->
                  <button
                    v-if="row.status === 'DRAFT'"
                    type="button"
                    title="Posting ke Jurnal"
                    class="p-1 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
                    @click="openPostingModal(row)"
                  >
                    <Send class="w-4 h-4" />
                  </button>

                  <!-- Reverse (Posted only) -->
                  <button
                    v-if="row.status === 'POSTED'"
                    type="button"
                    title="Reverse Transaksi"
                    class="p-1 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                    @click="openReversalModal(row)"
                  >
                    <RotateCcw class="w-4 h-4" />
                  </button>

                  <!-- Cancel (Draft only) -->
                  <button
                    v-if="row.status === 'DRAFT'"
                    type="button"
                    title="Batalkan Draft"
                    class="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                    @click="handleCancelDraft(row)"
                  >
                    <XCircle class="w-4 h-4" />
                  </button>

                  <!-- Print Voucher -->
                  <button
                    type="button"
                    title="Cetak Bukti Pemasukan"
                    class="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    @click="openPrintModal(row)"
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
      <div class="px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          Menampilkan <span class="font-bold text-slate-800 dark:text-slate-200">{{ items.length }}</span> dari <span class="font-bold text-slate-800 dark:text-slate-200">{{ totalItems }}</span> transaksi pemasukan.
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            :disabled="(filters.page || 1) <= 1"
            class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            @click="goToPage((filters.page || 1) - 1)"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <span>Halaman {{ filters.page }} dari {{ totalPages }}</span>
          <button
            type="button"
            :disabled="(filters.page || 1) >= totalPages"
            class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            @click="goToPage((filters.page || 1) + 1)"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <OtherIncomePostingModal
      v-model="showPostingModal"
      :income="selectedIncome"
      @posted="() => { fetchIncomes(); fetchKpi(); }"
    />
    <OtherIncomeReversalModal
      v-model="showReversalModal"
      :income="selectedIncome"
      @reversed="() => { fetchIncomes(); fetchKpi(); }"
    />
    <OtherIncomePrintModal
      v-model="showPrintModal"
      :income="selectedIncome"
    />
  </div>
</template>
