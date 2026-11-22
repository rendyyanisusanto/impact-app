<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ArrowLeft,
  Edit,
  Send,
  RotateCcw,
  XCircle,
  Printer,
  ExternalLink,
  Loader2
} from 'lucide-vue-next'
import { otherExpenseService } from '../services/other-expense.service'
import type { OtherExpenseHeader } from '../types/other-expense.types'
import OtherExpensePostingModal from '../components/OtherExpensePostingModal.vue'
import OtherExpenseReversalModal from '../components/OtherExpenseReversalModal.vue'
import OtherExpensePrintModal from '../components/OtherExpensePrintModal.vue'
import { formatCurrency } from '@/shared/utils/formatters'
import { useToast } from '@/shared/composables/useToast'
import AppButton from '@/shared/components/ui/AppButton.vue'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const expenseId = Number(route.params.id)
const expense = ref<OtherExpenseHeader | null>(null)
const loading = ref(true)

// Modals
const showPostingModal = ref(false)
const showReversalModal = ref(false)
const showPrintModal = ref(false)
const actionLoading = ref(false)

async function fetchExpense() {
  loading.value = true
  try {
    const data = await otherExpenseService.getExpenseById(expenseId)
    expense.value = data
  } catch (err: any) {
    toast.error(err.message || 'Gagal memuat detail pengeluaran')
    router.push('/accounting/other-expenses')
  } finally {
    loading.value = false
  }
}

async function handleConfirmPosting() {
  if (!expense.value) return
  actionLoading.value = true
  try {
    const posted = await otherExpenseService.postExpense(expense.value.id)
    toast.success(`Pengeluaran ${posted.trans_code} berhasil diposting. Jurnal: ${posted.journal_number}`)
    showPostingModal.value = false
    fetchExpense()
  } catch (err: any) {
    toast.error(err.message || 'Gagal memposting pengeluaran')
  } finally {
    actionLoading.value = false
  }
}

async function handleConfirmReversal(data: { reason: string; reversal_date: string }) {
  if (!expense.value) return
  actionLoading.value = true
  try {
    const rev = await otherExpenseService.reverseExpense(expense.value.id, data)
    toast.success(`Pengeluaran ${rev.trans_code} berhasil direversal.`)
    showReversalModal.value = false
    fetchExpense()
  } catch (err: any) {
    toast.error(err.message || 'Gagal mereversal pengeluaran')
  } finally {
    actionLoading.value = false
  }
}

async function handleCancelDraft() {
  if (!expense.value) return
  if (!confirm(`Batalkan draft pengeluaran ${expense.value.trans_code}?`)) return
  try {
    await otherExpenseService.cancelDraft(expense.value.id)
    toast.success(`Draft pengeluaran ${expense.value.trans_code} berhasil dibatalkan.`)
    fetchExpense()
  } catch (err: any) {
    toast.error(err.message || 'Gagal membatalkan draft')
  }
}

onMounted(() => {
  fetchExpense()
})
</script>

<template>
  <div class="space-y-6 max-w-5xl mx-auto">
    <!-- Top Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          @click="router.push('/accounting/other-expenses')"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-bold tracking-tight text-slate-800 dark:text-white font-mono">
              {{ expense?.trans_code || 'Detail Pengeluaran' }}
            </h1>
            <span
              v-if="expense"
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase"
              :class="{
                'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300': expense.status === 'DRAFT',
                'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300': expense.status === 'POSTED',
                'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300': expense.status === 'REVERSED',
                'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300': expense.status === 'CANCELLED'
              }"
            >
              {{ expense.status }}
            </span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Informasi lengkap transaksi pengeluaran operasional dan buku besar
          </p>
        </div>
      </div>

      <!-- Action buttons -->
      <div v-if="expense" class="flex items-center gap-2 flex-wrap">
        <!-- Print -->
        <AppButton
          variant="outline"
          size="sm"
          class="border-slate-300 dark:border-slate-700"
          @click="showPrintModal = true"
        >
          <Printer class="w-4 h-4 mr-1.5" />
          Cetak Voucher
        </AppButton>

        <!-- Edit (Draft only) -->
        <AppButton
          v-if="expense.status === 'DRAFT'"
          variant="outline"
          size="sm"
          class="text-amber-700 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700"
          @click="router.push(`/accounting/other-expenses/${expense.id}/edit`)"
        >
          <Edit class="w-4 h-4 mr-1.5" />
          Edit Draft
        </AppButton>

        <!-- Posting (Draft only) -->
        <AppButton
          v-if="expense.status === 'DRAFT'"
          variant="primary"
          size="sm"
          class="bg-teal-600 hover:bg-teal-700 text-white"
          @click="showPostingModal = true"
        >
          <Send class="w-4 h-4 mr-1.5" />
          Posting ke Jurnal
        </AppButton>

        <!-- Reverse (Posted only) -->
        <AppButton
          v-if="expense.status === 'POSTED'"
          variant="outline"
          size="sm"
          class="text-purple-700 border-purple-300 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-700"
          @click="showReversalModal = true"
        >
          <RotateCcw class="w-4 h-4 mr-1.5" />
          Reversal Transaksi
        </AppButton>

        <!-- Cancel (Draft only) -->
        <AppButton
          v-if="expense.status === 'DRAFT'"
          variant="outline"
          size="sm"
          class="text-rose-600 border-rose-300 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-700"
          @click="handleCancelDraft"
        >
          <XCircle class="w-4 h-4 mr-1.5" />
          Batalkan Draft
        </AppButton>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="py-20 text-center text-slate-400">
      <Loader2 class="w-8 h-8 animate-spin mx-auto mb-2 text-teal-600" />
      <span class="text-xs">Memuat detail pengeluaran...</span>
    </div>

    <template v-else-if="expense">
      <!-- Workflow Status Banner -->
      <div
        v-if="expense.status === 'REVERSED'"
        class="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-4 text-xs text-purple-900 dark:text-purple-300 flex items-start gap-3"
      >
        <RotateCcw class="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
        <div>
          <p class="font-bold">Transaksi Telah Direversal</p>
          <p class="mt-0.5">
            Pengeluaran ini telah dibatalkan melalui jurnal pembalik pada <strong>{{ expense.reversed_at ? new Date(expense.reversed_at).toLocaleString('id-ID') : '-' }}</strong> oleh <strong>{{ expense.reverser_name || 'Admin' }}</strong>.
          </p>
          <p v-if="expense.reversal_reason" class="mt-1 italic">
            Alasan: "{{ expense.reversal_reason }}"
          </p>
        </div>
      </div>

      <!-- Financial & Header Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Card 1: Total Pengeluaran -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-1">
          <span class="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total Pengeluaran
          </span>
          <div class="text-2xl font-bold font-mono text-teal-600 dark:text-teal-400">
            {{ formatCurrency(expense.total) }}
          </div>
          <p class="text-xs text-slate-400">
            {{ expense.item_count }} baris rincian biaya
          </p>
        </div>

        <!-- Card 2: Sumber Dana -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-1">
          <span class="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Sumber Dana (Kredit)
          </span>
          <div class="text-sm font-bold text-slate-800 dark:text-white truncate">
            {{ expense.nama_akun_kas }}
          </div>
          <p class="text-xs font-mono text-slate-500">
            Kode Akun: {{ expense.kode_akun_kas }}
          </p>
        </div>

        <!-- Card 3: Jurnal Umum -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-1">
          <span class="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Integrasi Jurnal Umum
          </span>
          <div v-if="expense.journal_number" class="flex items-center gap-2">
            <span class="font-mono text-sm font-bold text-slate-800 dark:text-white">
              {{ expense.journal_number }}
            </span>
            <button
              type="button"
              class="text-teal-600 hover:text-teal-700 p-1 rounded"
              title="Buka Jurnal Umum"
              @click="router.push('/accounting/general-journal')"
            >
              <ExternalLink class="w-4 h-4" />
            </button>
          </div>
          <div v-else class="text-xs text-amber-600 dark:text-amber-400 font-medium">
            Belum diposting ke jurnal
          </div>
          <p class="text-[11px] text-slate-400">
            {{ expense.status === 'POSTED' ? 'Double-entry seimbang di ledger' : 'Jurnal otomatis saat status POSTED' }}
          </p>
        </div>
      </div>

      <!-- Main Info Panel -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-6">
        <h2 class="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-100 dark:border-slate-700/50">
          Informasi Transaksi
        </h2>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span class="text-slate-400 block mb-0.5">Tanggal Transaksi</span>
            <span class="font-medium text-slate-800 dark:text-slate-200">{{ expense.tanggal }}</span>
          </div>

          <div>
            <span class="text-slate-400 block mb-0.5">Metode Pembayaran</span>
            <span class="font-medium text-slate-800 dark:text-slate-200">{{ expense.payment_method || '-' }}</span>
          </div>

          <div>
            <span class="text-slate-400 block mb-0.5">Referensi Nota / Transfer</span>
            <span class="font-mono font-medium text-slate-800 dark:text-slate-200">{{ expense.reference_number || '-' }}</span>
          </div>

          <div>
            <span class="text-slate-400 block mb-0.5">Akun Beban Default</span>
            <span class="font-medium text-slate-800 dark:text-slate-200">{{ expense.kode_akun_beban }} - {{ expense.nama_akun_beban }}</span>
          </div>
        </div>

        <div>
          <span class="text-slate-400 block mb-1 text-xs">Keperluan / Keterangan</span>
          <div class="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200">
            {{ expense.keterangan }}
          </div>
        </div>

        <!-- Rincian Biaya Table -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Rincian Baris Pengeluaran
            </h3>
            <span class="text-xs text-slate-400">
              {{ expense.items?.length || 0 }} baris
            </span>
          </div>

          <div class="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
                  <th class="py-2.5 px-3 w-12 text-center">No</th>
                  <th class="py-2.5 px-3">Uraian Rincian</th>
                  <th class="py-2.5 px-3">Alokasi Akun Beban</th>
                  <th class="py-2.5 px-3 text-right w-40">Nominal (Rp)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60">
                <tr v-for="(it, idx) in expense.items" :key="idx" class="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                  <td class="py-2.5 px-3 text-center text-slate-400 font-mono">{{ idx + 1 }}</td>
                  <td class="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">{{ it.keterangan }}</td>
                  <td class="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                    {{ it.kode_akun_beban ? `${it.kode_akun_beban} - ${it.nama_akun_beban}` : `${expense.kode_akun_beban} - ${expense.nama_akun_beban}` }}
                  </td>
                  <td class="py-2.5 px-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {{ formatCurrency(it.jumlah) }}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="bg-slate-50 dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-700 font-bold">
                  <td colspan="3" class="py-3 px-3 text-right uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Total:
                  </td>
                  <td class="py-3 px-3 text-right font-mono text-sm text-teal-600 dark:text-teal-400">
                    {{ formatCurrency(expense.total) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- Audit Trail Footprint -->
        <div class="pt-4 border-t border-slate-100 dark:border-slate-700/50 grid grid-cols-2 md:grid-cols-4 gap-4 text-[11px] text-slate-500">
          <div>
            <span class="block text-slate-400">Dibuat Oleh:</span>
            <span class="font-medium text-slate-700 dark:text-slate-300">{{ expense.creator_name || '-' }}</span>
            <span class="block text-[10px]">{{ expense.created_at ? new Date(expense.created_at).toLocaleDateString('id-ID') : '-' }}</span>
          </div>

          <div>
            <span class="block text-slate-400">Diposting Oleh:</span>
            <span class="font-medium text-slate-700 dark:text-slate-300">{{ expense.poster_name || '-' }}</span>
            <span class="block text-[10px]">{{ expense.posted_at ? new Date(expense.posted_at).toLocaleDateString('id-ID') : '-' }}</span>
          </div>

          <div>
            <span class="block text-slate-400">Terakhir Diperbarui:</span>
            <span class="font-medium text-slate-700 dark:text-slate-300">{{ expense.updater_name || '-' }}</span>
            <span class="block text-[10px]">{{ expense.updated_at ? new Date(expense.updated_at).toLocaleDateString('id-ID') : '-' }}</span>
          </div>

          <div>
            <span class="block text-slate-400">Versi Dokumen:</span>
            <span class="font-mono font-medium text-slate-700 dark:text-slate-300">v{{ expense.version }}</span>
          </div>
        </div>
      </div>
    </template>

    <!-- Modals -->
    <OtherExpensePostingModal
      v-model="showPostingModal"
      :expense="expense"
      :loading="actionLoading"
      @confirm="handleConfirmPosting"
    />

    <OtherExpenseReversalModal
      v-model="showReversalModal"
      :expense="expense"
      :loading="actionLoading"
      @confirm="handleConfirmReversal"
    />

    <OtherExpensePrintModal
      v-model="showPrintModal"
      :expense="expense"
    />
  </div>
</template>
