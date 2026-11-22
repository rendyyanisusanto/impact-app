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
  ExternalLink,
  Filter,
  CheckCircle2
} from 'lucide-vue-next'
import { journalService } from '../services/journal.service'
import type {
  JournalHeader,
  JournalKpiSummary,
  JournalFilterParams
} from '../types/journal.types'
import JournalKpiCards from '../components/JournalKpiCards.vue'
import PostingConfirmModal from '../components/PostingConfirmModal.vue'
import ReversalModal from '../components/ReversalModal.vue'
import VoucherPrintModal from '../components/VoucherPrintModal.vue'
import { exportJournalListToExcel, exportJournalListToPdf } from '../utils/journal-export'
import { formatCurrency } from '@/shared/utils/formatters'

const router = useRouter()

// State
const loading = ref(false)
const kpiLoading = ref(false)
const items = ref<JournalHeader[]>([])
const kpi = ref<JournalKpiSummary | null>(null)
const totalItems = ref(0)
const totalPages = ref(1)

const filters = reactive<JournalFilterParams>({
  search: '',
  start_date: '',
  end_date: '',
  status: 'ALL',
  source_type: 'ALL',
  page: 1,
  limit: 20,
  sort_by: 'journal_date',
  sort_dir: 'DESC'
})

// Modals
const showPostingModal = ref(false)
const selectedJournalForPosting = ref<JournalHeader | null>(null)
const postingModalRef = ref<any>(null)

const showReversalModal = ref(false)
const selectedJournalForReversal = ref<JournalHeader | null>(null)
const reversalModalRef = ref<any>(null)

const showVoucherModal = ref(false)
const selectedJournalForPrint = ref<JournalHeader | null>(null)

// Toast notification
const notification = ref<{ type: 'success' | 'error'; message: string } | null>(null)

function showToast(message: string, type: 'success' | 'error' = 'success') {
  notification.value = { type, message }
  setTimeout(() => {
    notification.value = null
  }, 4000)
}

async function loadData() {
  loading.value = true
  try {
    const res = await journalService.getJournals(filters)
    items.value = res.items
    totalItems.value = res.total
    totalPages.value = res.total_pages
  } catch (err: any) {
    showToast(err.message || 'Gagal memuat daftar jurnal', 'error')
  } finally {
    loading.value = false
  }
}

async function loadKpi() {
  kpiLoading.value = true
  try {
    kpi.value = await journalService.getKpi(filters)
  } catch (err: any) {
    console.error('Failed to load KPI:', err)
  } finally {
    kpiLoading.value = false
  }
}

function applyFilter() {
  filters.page = 1
  loadData()
  loadKpi()
}

function resetFilter() {
  filters.search = ''
  filters.start_date = ''
  filters.end_date = ''
  filters.status = 'ALL'
  filters.source_type = 'ALL'
  filters.page = 1
  loadData()
  loadKpi()
}

function goToPage(p: number) {
  if (p < 1 || p > totalPages.value) return
  filters.page = p
  loadData()
}

function goToCreate() {
  router.push('/accounting/general-journal/create')
}

function goToDetail(id: number) {
  router.push(`/accounting/general-journal/${id}`)
}

function goToEdit(id: number) {
  router.push(`/accounting/general-journal/edit/${id}`)
}

// Posting Flow
async function openPostingModal(j: JournalHeader) {
  try {
    // Ambil full detail terlebih dahulu
    const full = await journalService.getJournalById(j.id)
    selectedJournalForPosting.value = full
    showPostingModal.value = true
  } catch (err: any) {
    showToast(err.message || 'Gagal menyiapkan data posting', 'error')
  }
}

async function handleConfirmPosting(id: number) {
  try {
    await journalService.postJournal(id)
    showToast('Jurnal umum berhasil diposting ke ledger akuntansi')
    showPostingModal.value = false
    loadData()
    loadKpi()
  } catch (err: any) {
    postingModalRef.value?.resetLoading()
    showToast(err.message || 'Gagal memposting jurnal', 'error')
  }
}

// Reversal Flow
async function openReversalModal(j: JournalHeader) {
  try {
    const full = await journalService.getJournalById(j.id)
    selectedJournalForReversal.value = full
    showReversalModal.value = true
  } catch (err: any) {
    showToast(err.message || 'Gagal menyiapkan data reversal', 'error')
  }
}

async function handleConfirmReversal(data: { id: number; reversal_date: string; reason: string }) {
  try {
    await journalService.reverseJournal(data.id, {
      reversal_date: data.reversal_date,
      reason: data.reason
    })
    showToast('Jurnal berhasil direversal dan jurnal pembalik telah dibuat')
    showReversalModal.value = false
    loadData()
    loadKpi()
  } catch (err: any) {
    reversalModalRef.value?.setError(err.message || 'Gagal mereversal jurnal')
  }
}

// Cancel Draft Flow
async function handleCancelDraft(j: JournalHeader) {
  if (!confirm(`Batalkan draft jurnal ${j.journal_number}?`)) return
  try {
    await journalService.cancelDraft(j.id)
    showToast(`Draft jurnal ${j.journal_number} berhasil dibatalkan`)
    loadData()
    loadKpi()
  } catch (err: any) {
    showToast(err.message || 'Gagal membatalkan draft', 'error')
  }
}

// Print Voucher
async function openPrintModal(j: JournalHeader) {
  try {
    const full = await journalService.getJournalById(j.id)
    selectedJournalForPrint.value = full
    showVoucherModal.value = true
  } catch (err: any) {
    showToast(err.message || 'Gagal memuat voucher jurnal', 'error')
  }
}

// Exports
function handleExportExcel() {
  exportJournalListToExcel(items.value, `Periode: ${filters.start_date || 'Awal'} s/d ${filters.end_date || 'Akhir'}`)
  showToast('Daftar jurnal berhasil diekspor ke Excel')
}

function handleExportPdf() {
  exportJournalListToPdf(items.value, `Periode: ${filters.start_date || 'Awal'} s/d ${filters.end_date || 'Akhir'}`)
  showToast('Daftar jurnal berhasil diekspor ke PDF')
}

onMounted(() => {
  loadData()
  loadKpi()
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8">
    <!-- Toast Notification -->
    <div
      v-if="notification"
      class="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2 text-sm font-medium animate-in slide-in-from-top duration-200"
      :class="
        notification.type === 'success'
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200'
          : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-200'
      "
    >
      <CheckCircle2 v-if="notification.type === 'success'" class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
      <XCircle v-else class="w-4 h-4 text-rose-600 dark:text-rose-400" />
      <span>{{ notification.message }}</span>
    </div>

    <!-- Breadcrumb -->
    <div class="mb-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
      <span>Dashboard</span>
      <span>&gt;</span>
      <span>Keuangan</span>
      <span>&gt;</span>
      <span class="text-teal-600 dark:text-teal-400">Jurnal Umum</span>
    </div>

    <!-- Header & Action Buttons -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
          Jurnal Umum
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Pencatatan transaksi keuangan dengan sistem debit dan kredit berimbang.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
          @click="handleExportExcel"
        >
          <FileSpreadsheet class="w-4 h-4 text-emerald-600" />
          <span>Export Excel</span>
        </button>

        <button
          type="button"
          class="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
          @click="handleExportPdf"
        >
          <FileText class="w-4 h-4 text-rose-600" />
          <span>Export PDF</span>
        </button>

        <button
          type="button"
          class="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
          @click="goToCreate"
        >
          <Plus class="w-4 h-4" />
          <span>Tambah Jurnal</span>
        </button>
      </div>
    </div>

    <!-- KPI Cards -->
    <JournalKpiCards :kpi="kpi" :loading="kpiLoading" />

    <!-- Filter Bar Card -->
    <div class="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <!-- Search -->
        <div class="lg:col-span-1">
          <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            Pencarian
          </label>
          <div class="relative">
            <Search class="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              v-model="filters.search"
              type="text"
              placeholder="No Jurnal / Ref / Keterangan..."
              class="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-100"
              @keydown.enter="applyFilter"
            />
          </div>
        </div>

        <!-- Start Date -->
        <div>
          <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            Tanggal Mulai
          </label>
          <input
            v-model="filters.start_date"
            type="date"
            class="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-100"
          />
        </div>

        <!-- End Date -->
        <div>
          <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            Tanggal Akhir
          </label>
          <input
            v-model="filters.end_date"
            type="date"
            class="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-100"
          />
        </div>

        <!-- Status -->
        <div>
          <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            Status
          </label>
          <select
            v-model="filters.status"
            class="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-100"
          >
            <option value="ALL">Semua Status</option>
            <option value="DRAFT">Draft</option>
            <option value="POSTED">Posted</option>
            <option value="REVERSED">Reversed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <!-- Sumber -->
        <div>
          <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            Sumber Jurnal
          </label>
          <select
            v-model="filters.source_type"
            class="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-100"
          >
            <option value="ALL">Semua Sumber</option>
            <option value="MANUAL">Manual</option>
            <option value="AUTOMATIC">Otomatis</option>
          </select>
        </div>
      </div>

      <div class="mt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700/60 pt-3">
        <button
          type="button"
          class="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
          @click="resetFilter"
        >
          Reset Filter
        </button>
        <button
          type="button"
          class="px-4 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm transition flex items-center gap-1.5"
          @click="applyFilter"
        >
          <Filter class="w-3.5 h-3.5" />
          <span>Terapkan Filter</span>
        </button>
      </div>
    </div>

    <!-- Table Card -->
    <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-700">
          <thead class="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
            <tr>
              <th class="px-3 py-3 w-10 text-center">No</th>
              <th class="px-3 py-3 w-36">Nomor Jurnal</th>
              <th class="px-3 py-3 w-28">Tanggal</th>
              <th class="px-4 py-3 min-w-[200px]">Keterangan</th>
              <th class="px-3 py-3 w-28">Referensi</th>
              <th class="px-3 py-3 w-24 text-center">Sumber</th>
              <th class="px-3 py-3 w-32 text-right">Total Debit</th>
              <th class="px-3 py-3 w-32 text-right">Total Kredit</th>
              <th class="px-3 py-3 w-24 text-center">Status</th>
              <th class="px-3 py-3 w-28">Pembuat</th>
              <th class="px-3 py-3 w-36 text-center">Aksi</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-if="loading">
              <td colspan="11" class="text-center py-12 text-slate-400">
                Memuat data jurnal umum...
              </td>
            </tr>

            <tr v-else-if="items.length === 0">
              <td colspan="11" class="text-center py-12 text-slate-400">
                Tidak ada data jurnal umum yang sesuai dengan filter.
              </td>
            </tr>

            <tr
              v-for="(j, idx) in items"
              :key="j.id"
              class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition duration-150"
            >
              <!-- No -->
              <td class="px-3 py-3 text-center text-slate-500 font-mono">
                {{ (filters.page! - 1) * filters.limit! + idx + 1 }}
              </td>

              <!-- Nomor Jurnal -->
              <td class="px-3 py-3 font-mono font-semibold">
                <button
                  type="button"
                  class="text-teal-600 hover:text-teal-700 dark:text-teal-400 hover:underline text-left"
                  @click="goToDetail(j.id)"
                >
                  {{ j.journal_number }}
                </button>
              </td>

              <!-- Tanggal -->
              <td class="px-3 py-3 text-slate-600 dark:text-slate-300 font-mono whitespace-nowrap">
                {{ j.journal_date }}
              </td>

              <!-- Keterangan -->
              <td class="px-4 py-3 text-slate-800 dark:text-slate-200">
                <div class="line-clamp-2" :title="j.description">
                  {{ j.description }}
                </div>
                <div v-if="!j.is_balanced" class="mt-0.5 text-[10px] text-rose-500 font-medium">
                  Belum Seimbang (Selisih: {{ formatCurrency(j.difference) }})
                </div>
              </td>

              <!-- Referensi -->
              <td class="px-3 py-3 text-slate-600 dark:text-slate-400 font-mono">
                <div v-if="j.source_document_url" class="flex items-center gap-1">
                  <router-link
                    :to="j.source_document_url"
                    class="text-teal-600 hover:underline flex items-center gap-1"
                  >
                    <span>{{ j.reference_number || '-' }}</span>
                    <ExternalLink class="w-3 h-3" />
                  </router-link>
                </div>
                <div v-else>
                  {{ j.reference_number || '-' }}
                </div>
              </td>

              <!-- Sumber -->
              <td class="px-3 py-3 text-center whitespace-nowrap">
                <span
                  class="inline-block px-2 py-0.5 text-[10px] font-semibold rounded"
                  :class="
                    j.is_legacy
                      ? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      : j.source_type === 'MANUAL'
                      ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                      : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  "
                >
                  {{ j.is_legacy ? 'Otomatis' : j.source_type === 'MANUAL' ? 'Manual' : 'Otomatis' }}
                </span>
              </td>

              <!-- Total Debit -->
              <td class="px-3 py-3 text-right font-mono font-medium text-slate-800 dark:text-slate-100 whitespace-nowrap">
                {{ formatCurrency(j.total_debit) }}
              </td>

              <!-- Total Kredit -->
              <td class="px-3 py-3 text-right font-mono font-medium text-slate-800 dark:text-slate-100 whitespace-nowrap">
                {{ formatCurrency(j.total_credit) }}
              </td>

              <!-- Status -->
              <td class="px-3 py-3 text-center whitespace-nowrap">
                <span
                  class="inline-block px-2 py-0.5 text-[10px] font-bold rounded"
                  :class="{
                    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300': j.status === 'POSTED',
                    'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300': j.status === 'DRAFT',
                    'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300': j.status === 'REVERSED',
                    'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300': j.status === 'CANCELLED'
                  }"
                >
                  {{ j.status }}
                </span>
              </td>

              <!-- Pembuat -->
              <td class="px-3 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                {{ j.creator_name || '-' }}
              </td>

              <!-- Aksi -->
              <td class="px-3 py-3 text-center whitespace-nowrap">
                <div class="flex items-center justify-center gap-1">
                  <!-- Lihat -->
                  <button
                    type="button"
                    title="Lihat Detail"
                    class="p-1 rounded text-slate-500 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    @click="goToDetail(j.id)"
                  >
                    <Eye class="w-4 h-4" />
                  </button>

                  <!-- Edit Draft -->
                  <button
                    v-if="j.status === 'DRAFT'"
                    type="button"
                    title="Edit Draft"
                    class="p-1 rounded text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition"
                    @click="goToEdit(j.id)"
                  >
                    <Edit class="w-4 h-4" />
                  </button>

                  <!-- Posting Draft -->
                  <button
                    v-if="j.status === 'DRAFT'"
                    type="button"
                    title="Posting Jurnal"
                    class="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition"
                    @click="openPostingModal(j)"
                  >
                    <Send class="w-4 h-4" />
                  </button>

                  <!-- Reversal Posted (Manual Only) -->
                  <button
                    v-if="j.status === 'POSTED' && !j.is_legacy && !j.reversed_at"
                    type="button"
                    title="Reversal (Jurnal Pembalik)"
                    class="p-1 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition"
                    @click="openReversalModal(j)"
                  >
                    <RotateCcw class="w-4 h-4" />
                  </button>

                  <!-- Batalkan Draft -->
                  <button
                    v-if="j.status === 'DRAFT'"
                    type="button"
                    title="Batalkan Draft"
                    class="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition"
                    @click="handleCancelDraft(j)"
                  >
                    <XCircle class="w-4 h-4" />
                  </button>

                  <!-- Cetak Voucher -->
                  <button
                    type="button"
                    title="Cetak Voucher"
                    class="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    @click="openPrintModal(j)"
                  >
                    <Printer class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          Menampilkan <span class="font-semibold text-slate-700 dark:text-slate-200">{{ items.length }}</span> dari
          <span class="font-semibold text-slate-700 dark:text-slate-200">{{ totalItems.toLocaleString('id-ID') }}</span> total jurnal
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            :disabled="filters.page! <= 1"
            class="p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            @click="goToPage(filters.page! - 1)"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <span>Halaman {{ filters.page }} dari {{ totalPages }}</span>
          <button
            type="button"
            :disabled="filters.page! >= totalPages"
            class="p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            @click="goToPage(filters.page! + 1)"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <PostingConfirmModal
      ref="postingModalRef"
      v-model="showPostingModal"
      :journal="selectedJournalForPosting"
      @confirm="handleConfirmPosting"
    />

    <ReversalModal
      ref="reversalModalRef"
      v-model="showReversalModal"
      :journal="selectedJournalForReversal"
      @confirm="handleConfirmReversal"
    />

    <VoucherPrintModal
      v-model="showVoucherModal"
      :journal="selectedJournalForPrint"
    />
  </div>
</template>
