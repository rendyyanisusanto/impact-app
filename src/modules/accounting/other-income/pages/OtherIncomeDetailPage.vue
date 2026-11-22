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
import { otherIncomeService } from '../services/other-income.service'
import type { OtherIncomeHeader } from '../types/other-income.types'
import OtherIncomePostingModal from '../components/OtherIncomePostingModal.vue'
import OtherIncomeReversalModal from '../components/OtherIncomeReversalModal.vue'
import OtherIncomePrintModal from '../components/OtherIncomePrintModal.vue'
import { formatCurrency } from '@/shared/utils/formatters'
import { useToast } from '@/shared/composables/useToast'
import AppButton from '@/shared/components/ui/AppButton.vue'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const incomeId = Number(route.params.id)
const income = ref<OtherIncomeHeader | null>(null)
const loading = ref(true)

// Modals
const showPostingModal = ref(false)
const showReversalModal = ref(false)
const showPrintModal = ref(false)

async function fetchIncome() {
  loading.value = true
  try {
    const data = await otherIncomeService.getIncomeById(incomeId)
    income.value = data
  } catch (err: any) {
    toast.error(err.message || 'Gagal memuat detail pemasukan')
    router.push('/accounting/other-income')
  } finally {
    loading.value = false
  }
}

async function handleCancelDraft() {
  if (!income.value) return
  if (!confirm(`Batalkan draft pemasukan ${income.value.trans_code}?`)) return
  try {
    await otherIncomeService.cancelDraft(income.value.id)
    toast.success(`Draft pemasukan ${income.value.trans_code} berhasil dibatalkan.`)
    fetchIncome()
  } catch (err: any) {
    toast.error(err.message || 'Gagal membatalkan draft')
  }
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
  fetchIncome()
})
</script>

<template>
  <div class="space-y-6 max-w-5xl mx-auto">
    <!-- Top Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          @click="router.push('/accounting/other-income')"
        >
          <ArrowLeft class="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Detail Pemasukan Kas/Bank
            </h1>
            <span
              v-if="income"
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
              :class="getStatusBadgeClass(income.status)"
            >
              {{ income.status }}
            </span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            {{ income?.trans_code || 'Memuat...' }}
          </p>
        </div>
      </div>

      <!-- Header Action Buttons -->
      <div v-if="income" class="flex items-center flex-wrap gap-2">
        <!-- Edit Draft -->
        <AppButton
          v-if="income.status === 'DRAFT'"
          variant="secondary"
          size="sm"
          class="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
          @click="router.push(`/accounting/other-income/${income.id}/edit`)"
        >
          <Edit class="w-4 h-4 mr-1.5" />
          Edit Draft
        </AppButton>

        <!-- Post Draft -->
        <AppButton
          v-if="income.status === 'DRAFT'"
          variant="primary"
          size="sm"
          class="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          @click="showPostingModal = true"
        >
          <Send class="w-4 h-4 mr-1.5" />
          Posting Sekarang
        </AppButton>

        <!-- Reverse Posted -->
        <AppButton
          v-if="income.status === 'POSTED'"
          variant="secondary"
          size="sm"
          class="text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-50"
          @click="showReversalModal = true"
        >
          <RotateCcw class="w-4 h-4 mr-1.5" />
          Reversal
        </AppButton>

        <!-- Cancel Draft -->
        <AppButton
          v-if="income.status === 'DRAFT'"
          variant="secondary"
          size="sm"
          class="text-rose-600 hover:bg-rose-50 border-rose-200"
          @click="handleCancelDraft"
        >
          <XCircle class="w-4 h-4 mr-1.5" />
          Batalkan Draft
        </AppButton>

        <!-- Print Voucher -->
        <AppButton
          variant="secondary"
          size="sm"
          class="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
          @click="showPrintModal = true"
        >
          <Printer class="w-4 h-4 mr-1.5" />
          Cetak Bukti Pemasukan
        </AppButton>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-24 text-slate-400">
      <Loader2 class="w-8 h-8 animate-spin text-emerald-500 mb-3" />
      <span class="text-sm font-medium">Memuat rincian transaksi...</span>
    </div>

    <div v-else-if="income" class="space-y-6">
      <!-- Reversal Banner if Reversed -->
      <div
        v-if="income.status === 'REVERSED'"
        class="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 flex items-start gap-3"
      >
        <RotateCcw class="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
        <div class="text-xs text-rose-800 dark:text-rose-200 space-y-1">
          <p class="font-bold">
            Transaksi Ini Telah Direversal
          </p>
          <p>
            Alasan: <span class="font-medium italic">"{{ income.reversal_reason || '-' }}"</span>
          </p>
          <p class="text-[11px] text-rose-600 dark:text-rose-400">
            Direversal oleh {{ income.reverser_name || 'System' }} pada {{ income.reversed_at ? new Date(income.reversed_at).toLocaleString('id-ID') : '-' }}
          </p>
        </div>
      </div>

      <!-- Main Overview Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <!-- Card 1: Total & Kas/Bank -->
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Penerimaan Kas/Bank
            </span>
            <div class="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {{ formatCurrency(income.total) }}
            </div>
          </div>
          <div class="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-2">
            <div>
              <span class="text-slate-400 block text-[11px]">Rekening Kas/Bank Penerima:</span>
              <span class="font-bold text-slate-800 dark:text-slate-200">
                {{ income.kode_akun_kas }} - {{ income.nama_akun_kas }}
              </span>
            </div>
            <div>
              <span class="text-slate-400 block text-[11px]">Metode Pembayaran:</span>
              <span class="font-medium text-slate-700 dark:text-slate-300">
                {{ income.payment_method || 'Transfer Bank' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Card 2: Pihak Penyetor & Referensi -->
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 text-xs">
          <span class="font-semibold text-slate-400 uppercase tracking-wider block text-[11px]">
            Informasi Dokumen &amp; Penyetor
          </span>
          <div class="space-y-2.5">
            <div>
              <span class="text-slate-400 block text-[11px]">Diterima Dari:</span>
              <span class="font-bold text-slate-800 dark:text-slate-200 text-sm">
                {{ income.received_from || '-' }}
              </span>
            </div>
            <div>
              <span class="text-slate-400 block text-[11px]">Tanggal Transaksi:</span>
              <span class="font-medium text-slate-700 dark:text-slate-300">
                {{ income.tanggal }}
              </span>
            </div>
            <div>
              <span class="text-slate-400 block text-[11px]">Nomor Referensi:</span>
              <span class="font-mono text-slate-700 dark:text-slate-300 font-medium">
                {{ income.reference_number || '-' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Card 3: Integrasi Akuntansi & Status -->
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 text-xs">
          <span class="font-semibold text-slate-400 uppercase tracking-wider block text-[11px]">
            Integrasi Jurnal Akuntansi
          </span>
          <div class="space-y-2.5">
            <div>
              <span class="text-slate-400 block text-[11px]">Status Jurnal:</span>
              <span
                class="inline-block mt-0.5 px-2 py-0.5 rounded-full font-bold text-[10px]"
                :class="getStatusBadgeClass(income.status)"
              >
                {{ income.status === 'POSTED' ? 'TERCATAT DI LEDGER' : income.status }}
              </span>
            </div>
            <div v-if="income.journal_number">
              <span class="text-slate-400 block text-[11px]">Nomor Jurnal Umum:</span>
              <span class="font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                {{ income.journal_number }}
                <ExternalLink class="w-3 h-3 text-slate-400 inline cursor-pointer" @click="router.push('/accounting/general-journal')" />
              </span>
            </div>
            <div>
              <span class="text-slate-400 block text-[11px]">Pembuat Dokumen:</span>
              <span class="text-slate-700 dark:text-slate-300">
                {{ income.creator_name || '-' }} ({{ income.created_at ? new Date(income.created_at).toLocaleDateString('id-ID') : '-' }})
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Keterangan Umum -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
          Deskripsi &amp; Keperluan
        </span>
        <p class="text-sm font-medium text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
          {{ income.keterangan }}
        </p>
      </div>

      <!-- Table Detail Items -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div class="p-5 border-b border-slate-200 dark:border-slate-800">
          <h2 class="text-sm font-bold text-slate-800 dark:text-slate-200">
            Rincian Pos Pemasukan ({{ income.items?.length || 0 }} Baris)
          </h2>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th class="py-3 px-4 w-12 text-center">#</th>
                <th class="py-3 px-4">Deskripsi Rincian</th>
                <th class="py-3 px-4">Akun Sumber / Pendapatan</th>
                <th class="py-3 px-4 text-right w-48">Jumlah (Rp)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-for="(it, idx) in (income.items || [])" :key="idx" class="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                <td class="py-3 px-4 text-center text-slate-400 font-mono">
                  {{ idx + 1 }}
                </td>
                <td class="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                  {{ it.keterangan }}
                </td>
                <td class="py-3 px-4">
                  <div class="font-medium text-slate-700 dark:text-slate-300">
                    {{ it.nama_akun_lawan || income.nama_akun_sumber || '-' }}
                  </div>
                  <span class="text-[10px] text-slate-400 font-mono">
                    {{ it.kode_akun_lawan || income.kode_akun_sumber || '' }}
                  </span>
                </td>
                <td class="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                  {{ formatCurrency(it.jumlah) }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 font-bold">
                <td colspan="3" class="py-3 px-4 text-right text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Total Penerimaan Kas/Bank:
                </td>
                <td class="py-3 px-4 text-right font-mono text-sm text-emerald-600 dark:text-emerald-400">
                  {{ formatCurrency(income.total) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <OtherIncomePostingModal
      v-model="showPostingModal"
      :income="income"
      @posted="fetchIncome"
    />
    <OtherIncomeReversalModal
      v-model="showReversalModal"
      :income="income"
      @reversed="fetchIncome"
    />
    <OtherIncomePrintModal
      v-model="showPrintModal"
      :income="income"
    />
  </div>
</template>
