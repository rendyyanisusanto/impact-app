<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Printer,
  Edit,
  Send,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  ShieldCheck,
  ExternalLink,
  History,
  XCircle
} from 'lucide-vue-next'
import { journalService } from '../services/journal.service'
import type { JournalHeader } from '../types/journal.types'
import PostingConfirmModal from '../components/PostingConfirmModal.vue'
import ReversalModal from '../components/ReversalModal.vue'
import VoucherPrintModal from '../components/VoucherPrintModal.vue'
import { formatCurrency } from '@/shared/utils/formatters'

const route = useRoute()
const router = useRouter()

const journalId = computed(() => Number(route.params.id))
const journal = ref<JournalHeader | null>(null)
const loading = ref(true)

// Modals
const showPostingModal = ref(false)
const postingModalRef = ref<any>(null)
const showReversalModal = ref(false)
const reversalModalRef = ref<any>(null)
const showVoucherModal = ref(false)

const toast = ref<{ type: 'success' | 'error'; message: string } | null>(null)

function showToast(message: string, type: 'success' | 'error' = 'success') {
  toast.value = { type, message }
  setTimeout(() => {
    toast.value = null
  }, 4000)
}

async function loadDetail() {
  loading.value = true
  try {
    journal.value = await journalService.getJournalById(journalId.value)
  } catch (err: any) {
    showToast(err.message || 'Gagal memuat detail jurnal', 'error')
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/accounting/general-journal')
}

function goToEdit() {
  router.push(`/accounting/general-journal/edit/${journal.value?.id}`)
}

function openPostingModal() {
  showPostingModal.value = true
}

async function handleConfirmPosting(id: number) {
  try {
    await journalService.postJournal(id)
    showToast('Jurnal umum berhasil diposting ke ledger akuntansi!')
    showPostingModal.value = false
    loadDetail()
  } catch (err: any) {
    postingModalRef.value?.resetLoading()
    showToast(err.message || 'Gagal memposting jurnal', 'error')
  }
}

function openReversalModal() {
  showReversalModal.value = true
}

async function handleConfirmReversal(data: { id: number; reversal_date: string; reason: string }) {
  try {
    const rev = await journalService.reverseJournal(data.id, {
      reversal_date: data.reversal_date,
      reason: data.reason
    })
    showToast('Jurnal pembalik berhasil dibuat!')
    showReversalModal.value = false
    router.push(`/accounting/general-journal/${rev.id}`)
  } catch (err: any) {
    reversalModalRef.value?.setError(err.message || 'Gagal mereversal jurnal')
  }
}

function openPrintModal() {
  showVoucherModal.value = true
}

onMounted(() => {
  loadDetail()
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8">
    <!-- Toast -->
    <div
      v-if="toast"
      class="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2 text-sm font-medium animate-in slide-in-from-top duration-200"
      :class="
        toast.type === 'success'
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200'
          : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-200'
      "
    >
      <CheckCircle2 v-if="toast.type === 'success'" class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
      <XCircle v-else class="w-4 h-4 text-rose-600 dark:text-rose-400" />
      <span>{{ toast.message }}</span>
    </div>

    <!-- Top Action Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
          @click="goBack"
        >
          <ArrowLeft class="w-4 h-4" />
        </button>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight font-mono">
              {{ journal?.journal_number || 'Detail Jurnal' }}
            </h1>
            <span
              v-if="journal"
              class="px-2.5 py-0.5 text-xs font-bold rounded-full"
              :class="{
                'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300': journal.status === 'POSTED',
                'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300': journal.status === 'DRAFT',
                'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300': journal.status === 'REVERSED',
                'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300': journal.status === 'CANCELLED'
              }"
            >
              {{ journal.status }}
            </span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Informasi lengkap dokumen jurnal akuntansi dan baris pembukuan.
          </p>
        </div>
      </div>

      <div v-if="journal" class="flex flex-wrap items-center gap-2">
        <!-- Print -->
        <button
          type="button"
          class="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
          @click="openPrintModal"
        >
          <Printer class="w-4 h-4" />
          <span>Cetak Voucher</span>
        </button>

        <!-- Edit Draft -->
        <button
          v-if="journal.status === 'DRAFT'"
          type="button"
          class="px-3.5 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition"
          @click="goToEdit"
        >
          <Edit class="w-4 h-4" />
          <span>Edit Draft</span>
        </button>

        <!-- Posting -->
        <button
          v-if="journal.status === 'DRAFT'"
          type="button"
          class="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
          @click="openPostingModal"
        >
          <Send class="w-4 h-4" />
          <span>Posting Jurnal</span>
        </button>

        <!-- Reversal -->
        <button
          v-if="journal.status === 'POSTED' && !journal.is_legacy && !journal.reversed_at"
          type="button"
          class="px-3.5 py-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition"
          @click="openReversalModal"
        >
          <RotateCcw class="w-4 h-4" />
          <span>Reversal Jurnal</span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-20 text-slate-400">
      Memuat detail dokumen jurnal...
    </div>

    <div v-else-if="journal" class="space-y-6">
      <!-- Reversal Alert Banner -->
      <div
        v-if="journal.status === 'REVERSED'"
        class="p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl flex items-center gap-3 text-xs text-purple-900 dark:text-purple-200"
      >
        <RotateCcw class="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
        <div>
          <span class="font-bold">Jurnal ini telah direversal.</span> Saldo keuangan dinetralkan oleh jurnal pembalik yang diterbitkan pada
          {{ journal.reversed_at ? new Date(journal.reversed_at).toLocaleDateString('id-ID') : '-' }} oleh
          {{ journal.reverser_name || 'Petugas' }}.
        </div>
      </div>

      <!-- Document Overview Card -->
      <div class="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
        <h2 class="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 mb-4 pb-2 border-b border-slate-100 dark:border-slate-700/60">
          Informasi Dokumen Jurnal
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <span class="text-slate-400 block mb-0.5">Nomor Jurnal</span>
            <span class="font-mono font-bold text-slate-800 dark:text-slate-100 text-sm">{{ journal.journal_number }}</span>
          </div>

          <div>
            <span class="text-slate-400 block mb-0.5">Tanggal Akuntansi</span>
            <span class="font-mono font-medium text-slate-800 dark:text-slate-100 text-sm">{{ journal.journal_date }}</span>
          </div>

          <div>
            <span class="text-slate-400 block mb-0.5">Nomor Referensi</span>
            <span class="font-mono text-slate-800 dark:text-slate-100 text-sm">{{ journal.reference_number || '-' }}</span>
          </div>

          <div>
            <span class="text-slate-400 block mb-0.5">Sumber Dokumen</span>
            <div class="flex items-center gap-1.5 mt-0.5">
              <span
                class="px-2 py-0.5 text-[10px] font-semibold rounded"
                :class="
                  journal.is_legacy
                    ? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    : journal.source_type === 'MANUAL'
                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border border-teal-200'
                    : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                "
              >
                {{ journal.is_legacy ? 'Otomatis (Legacy)' : journal.source_type === 'MANUAL' ? 'Manual' : 'Otomatis' }}
              </span>
              <router-link
                v-if="journal.source_document_url"
                :to="journal.source_document_url"
                class="text-teal-600 hover:underline flex items-center gap-0.5 font-medium"
              >
                <span>Lihat Dokumen</span>
                <ExternalLink class="w-3 h-3" />
              </router-link>
            </div>
          </div>

          <div class="sm:col-span-2 lg:col-span-4 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
            <span class="text-slate-400 block mb-0.5">Keterangan Umum</span>
            <p class="text-slate-800 dark:text-slate-200 text-sm leading-relaxed">
              {{ journal.description }}
            </p>
          </div>
        </div>
      </div>

      <!-- Line Items Card -->
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div class="px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/40">
          <h2 class="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
            Detail Baris Jurnal Akuntansi ({{ journal.lines?.length || 0 }} Baris)
          </h2>
          <span
            class="px-2.5 py-0.5 text-[11px] font-bold rounded-full flex items-center gap-1"
            :class="
              journal.is_balanced
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
            "
          >
            <CheckCircle2 v-if="journal.is_balanced" class="w-3.5 h-3.5" />
            <AlertTriangle v-else class="w-3.5 h-3.5" />
            <span>{{ journal.is_balanced ? 'Debit = Kredit (Seimbang)' : 'Tidak Seimbang' }}</span>
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-700">
            <thead class="bg-slate-50 dark:bg-slate-900/60 font-semibold text-slate-600 dark:text-slate-300">
              <tr>
                <th class="px-3 py-3 w-10 text-center">No</th>
                <th class="px-3 py-3 w-32">Kode Rekening</th>
                <th class="px-4 py-3 min-w-[200px]">Nama Akun</th>
                <th class="px-3 py-3 w-24 text-center">Saldo Normal</th>
                <th class="px-4 py-3 min-w-[220px]">Keterangan Baris</th>
                <th class="px-4 py-3 w-36 text-right">Debit (Rp)</th>
                <th class="px-4 py-3 w-36 text-right">Kredit (Rp)</th>
                <th class="px-3 py-3 w-24 text-center">ID Ledger</th>
              </tr>
            </thead>

            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr
                v-for="line in journal.lines"
                :key="line.line_number"
                class="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
              >
                <td class="px-3 py-3 text-center text-slate-400 font-mono">
                  {{ line.line_number }}
                </td>

                <td class="px-3 py-3 font-mono font-bold text-slate-700 dark:text-slate-200">
                  {{ line.kode_akun }}
                </td>

                <td class="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                  {{ line.nama_akun }}
                </td>

                <td class="px-3 py-3 text-center">
                  <span
                    class="px-2 py-0.5 text-[10px] font-semibold rounded"
                    :class="
                      line.saldo_normal === 'D'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                    "
                  >
                    {{ line.saldo_normal === 'D' ? 'Debit' : 'Kredit' }}
                  </span>
                </td>

                <td class="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {{ line.description || '-' }}
                </td>

                <td class="px-4 py-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-100">
                  {{ line.debit > 0 ? formatCurrency(line.debit) : '-' }}
                </td>

                <td class="px-4 py-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-100">
                  {{ line.credit > 0 ? formatCurrency(line.credit) : '-' }}
                </td>

                <td class="px-3 py-3 text-center font-mono text-slate-400">
                  {{ line.jurnal_umum_id ? `#${line.jurnal_umum_id}` : '-' }}
                </td>
              </tr>
            </tbody>

            <tfoot class="bg-slate-50 dark:bg-slate-900/60 font-bold border-t-2 border-slate-300 dark:border-slate-600">
              <tr>
                <td colspan="5" class="px-4 py-3 text-right uppercase text-slate-600 dark:text-slate-400">
                  Total Jurnal
                </td>
                <td class="px-4 py-3 text-right font-mono text-sm text-teal-700 dark:text-teal-400">
                  {{ formatCurrency(journal.total_debit) }}
                </td>
                <td class="px-4 py-3 text-right font-mono text-sm text-teal-700 dark:text-teal-400">
                  {{ formatCurrency(journal.total_credit) }}
                </td>
                <td class="px-3 py-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Audit & Workflow Metadata Card -->
      <div class="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm text-xs">
        <h2 class="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-4 pb-2 border-b border-slate-100 dark:border-slate-700/60 flex items-center gap-1.5">
          <History class="w-4 h-4 text-teal-600" />
          <span>Audit Trail & Jejak Dokumen</span>
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="space-y-1">
            <span class="text-slate-400 block font-medium">Dibuat Oleh</span>
            <div class="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
              <User class="w-3.5 h-3.5 text-slate-400" />
              <span>{{ journal.creator_name || '-' }}</span>
            </div>
            <span class="text-slate-400 text-[11px] block">
              {{ journal.created_at ? new Date(journal.created_at).toLocaleString('id-ID') : '-' }}
            </span>
          </div>

          <div class="space-y-1">
            <span class="text-slate-400 block font-medium">Terakhir Diperbarui</span>
            <div class="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
              <Clock class="w-3.5 h-3.5 text-slate-400" />
              <span>{{ journal.updater_name || '-' }}</span>
            </div>
            <span class="text-slate-400 text-[11px] block">
              {{ journal.updated_at ? new Date(journal.updated_at).toLocaleString('id-ID') : '-' }}
            </span>
          </div>

          <div class="space-y-1">
            <span class="text-slate-400 block font-medium">Diposting Oleh</span>
            <div class="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
              <ShieldCheck class="w-3.5 h-3.5 text-emerald-600" />
              <span>{{ journal.poster_name || '-' }}</span>
            </div>
            <span class="text-slate-400 text-[11px] block">
              {{ journal.posted_at ? new Date(journal.posted_at).toLocaleString('id-ID') : '-' }}
            </span>
          </div>

          <div class="space-y-1">
            <span class="text-slate-400 block font-medium">Status Reversal</span>
            <div class="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
              <RotateCcw class="w-3.5 h-3.5 text-purple-600" />
              <span>{{ journal.reversed_at ? 'Telah Direversal' : 'Belum Direversal' }}</span>
            </div>
            <span class="text-slate-400 text-[11px] block">
              {{ journal.reversed_at ? new Date(journal.reversed_at).toLocaleString('id-ID') : '-' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <PostingConfirmModal
      ref="postingModalRef"
      v-model="showPostingModal"
      :journal="journal"
      @confirm="handleConfirmPosting"
    />

    <ReversalModal
      ref="reversalModalRef"
      v-model="showReversalModal"
      :journal="journal"
      @confirm="handleConfirmReversal"
    />

    <VoucherPrintModal
      v-model="showVoucherModal"
      :journal="journal"
    />
  </div>
</template>
