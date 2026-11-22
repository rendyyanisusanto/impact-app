<script setup lang="ts">
import { computed } from 'vue'
import type { OtherExpenseHeader } from '../types/other-expense.types'
import { Printer, X } from 'lucide-vue-next'
import { formatCurrency } from '@/shared/utils/formatters'
import { terbilangRupiah } from '@/modules/sales/utils/sales-payment-calculations'
import AppButton from '@/shared/components/ui/AppButton.vue'

const props = defineProps<{
  modelValue: boolean
  expense: OtherExpenseHeader | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

function close() {
  emit('update:modelValue', false)
}

function handlePrint() {
  window.print()
}

const terbilangText = computed(() => {
  if (!props.expense?.total) return 'Nol Rupiah'
  return terbilangRupiah(props.expense.total)
})

const watermarkText = computed(() => {
  if (!props.expense) return ''
  if (props.expense.status === 'DRAFT') return 'DRAFT — BELUM DIPOSTING'
  if (props.expense.status === 'CANCELLED') return 'DIBATALKAN'
  if (props.expense.status === 'REVERSED') return 'REVERSED / TELAH DIBALIK'
  return ''
})
</script>

<template>
  <div
    v-if="modelValue && expense"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white print:static"
  >
    <div
      class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up print:border-none print:shadow-none print:max-w-none print:max-h-none print:w-full print:rounded-none"
    >
      <!-- Modal Toolbar (Hidden on print) -->
      <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 print:hidden">
        <div>
          <h3 class="text-base font-semibold text-slate-800 dark:text-white">
            Cetak Bukti Pengeluaran Kas/Bank
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dokumen resmi tanda bukti pengeluaran kas operasional
          </p>
        </div>
        <div class="flex items-center gap-2">
          <AppButton
            variant="primary"
            size="sm"
            class="bg-teal-600 hover:bg-teal-700 text-white"
            @click="handlePrint"
          >
            <Printer class="w-4 h-4 mr-1.5" />
            Cetak Dokumen
          </AppButton>
          <button
            type="button"
            class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg"
            @click="close"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Printable Area -->
      <div id="print-area" class="flex-1 overflow-y-auto p-8 bg-white text-slate-900 relative print:p-6 print:overflow-visible font-sans">
        <!-- Watermark -->
        <div
          v-if="watermarkText"
          class="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-15 rotate-[-25deg] z-0"
        >
          <span class="text-6xl font-black tracking-widest text-red-600 border-8 border-red-600 px-8 py-4 rounded-3xl uppercase">
            {{ watermarkText }}
          </span>
        </div>

        <!-- Document Content -->
        <div class="relative z-10 space-y-6">
          <!-- Company Header -->
          <div class="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
            <div>
              <h1 class="text-xl font-bold tracking-tight text-slate-900">
                IMPACT FURNITURE
              </h1>
              <p class="text-xs text-slate-600 mt-0.5">
                SMM Manufacturing &amp; Interior Solution
              </p>
              <p class="text-xs text-slate-500">
                Departemen Keuangan &amp; Akuntansi
              </p>
            </div>
            <div class="text-right">
              <h2 class="text-lg font-black tracking-wider uppercase text-slate-900">
                BUKTI PENGELUARAN KAS/BANK
              </h2>
              <div class="mt-1 font-mono font-bold text-sm text-slate-800">
                {{ expense.trans_code }}
              </div>
              <div class="text-xs text-slate-500">
                Tanggal: <span class="font-medium text-slate-800">{{ expense.tanggal }}</span>
              </div>
            </div>
          </div>

          <!-- Transaction Info Grid -->
          <div class="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div class="space-y-1.5">
              <div class="flex">
                <span class="w-32 text-slate-500">Sumber Dana:</span>
                <span class="font-semibold text-slate-800">{{ expense.kode_akun_kas }} - {{ expense.nama_akun_kas }}</span>
              </div>
              <div class="flex">
                <span class="w-32 text-slate-500">Metode Bayar:</span>
                <span class="font-medium text-slate-800">{{ expense.payment_method || 'Transfer Bank' }}</span>
              </div>
              <div class="flex">
                <span class="w-32 text-slate-500">Referensi Nota/TRF:</span>
                <span class="font-medium text-slate-800">{{ expense.reference_number || '-' }}</span>
              </div>
            </div>
            <div class="space-y-1.5">
              <div class="flex">
                <span class="w-32 text-slate-500">Akun Beban:</span>
                <span class="font-semibold text-slate-800">{{ expense.kode_akun_beban }} - {{ expense.nama_akun_beban }}</span>
              </div>
              <div class="flex">
                <span class="w-32 text-slate-500">Status Transaksi:</span>
                <span class="font-bold uppercase tracking-wider text-xs" :class="expense.status === 'POSTED' ? 'text-teal-700' : expense.status === 'REVERSED' ? 'text-purple-700' : 'text-amber-700'">
                  {{ expense.status }}
                </span>
              </div>
              <div class="flex">
                <span class="w-32 text-slate-500">No. Jurnal Terkait:</span>
                <span class="font-mono text-slate-800">{{ expense.journal_number || '-' }}</span>
              </div>
            </div>
          </div>

          <!-- Keperluan / Keterangan -->
          <div class="text-xs">
            <span class="font-semibold text-slate-700 block mb-1">Keperluan / Keterangan:</span>
            <p class="text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200">
              {{ expense.keterangan }}
            </p>
          </div>

          <!-- Rincian Table -->
          <div>
            <span class="font-semibold text-xs text-slate-700 block mb-2">Rincian Pengeluaran:</span>
            <table class="w-full text-xs border border-slate-300">
              <thead>
                <tr class="bg-slate-100 text-slate-700 text-left border-b border-slate-300">
                  <th class="py-2 px-3 w-12 text-center">No</th>
                  <th class="py-2 px-3">Uraian / Keterangan</th>
                  <th class="py-2 px-3">Alokasi Akun Beban</th>
                  <th class="py-2 px-3 text-right w-36">Jumlah (Rp)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                <tr v-for="(it, idx) in expense.items" :key="idx">
                  <td class="py-2 px-3 text-center text-slate-500 font-mono">{{ idx + 1 }}</td>
                  <td class="py-2 px-3 font-medium text-slate-800">{{ it.keterangan }}</td>
                  <td class="py-2 px-3 text-slate-600">
                    {{ it.kode_akun_beban ? `${it.kode_akun_beban} - ${it.nama_akun_beban}` : `${expense.kode_akun_beban} - ${expense.nama_akun_beban}` }}
                  </td>
                  <td class="py-2 px-3 text-right font-mono font-semibold text-slate-800">
                    {{ formatCurrency(it.jumlah) }}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="bg-slate-100 font-bold border-t-2 border-slate-300">
                  <td colspan="3" class="py-2.5 px-3 text-right uppercase tracking-wider text-slate-700">
                    Total Pengeluaran:
                  </td>
                  <td class="py-2.5 px-3 text-right font-mono text-sm text-slate-900">
                    {{ formatCurrency(expense.total) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Terbilang Box -->
          <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex items-start gap-2">
            <span class="font-semibold text-slate-600 shrink-0">Terbilang:</span>
            <span class="italic font-medium text-slate-800 capitalize">{{ terbilangText }}</span>
          </div>

          <!-- Signature Section -->
          <div class="pt-6 grid grid-cols-4 gap-4 text-center text-xs">
            <div class="space-y-12">
              <p class="text-slate-600">Dibuat Oleh:</p>
              <div class="border-t border-slate-400 pt-1 font-semibold text-slate-800">
                {{ expense.creator_name || 'Admin Operasional' }}
              </div>
            </div>
            <div class="space-y-12">
              <p class="text-slate-600">Diperiksa Oleh:</p>
              <div class="border-t border-slate-400 pt-1 font-semibold text-slate-800">
                ( Spv. Keuangan )
              </div>
            </div>
            <div class="space-y-12">
              <p class="text-slate-600">Diposting Oleh:</p>
              <div class="border-t border-slate-400 pt-1 font-semibold text-slate-800">
                {{ expense.poster_name || '-' }}
              </div>
            </div>
            <div class="space-y-12">
              <p class="text-slate-600">Penerima Dana:</p>
              <div class="border-t border-slate-400 pt-1 font-semibold text-slate-800">
                ( Tanda Tangan &amp; Nama )
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media print {
  body * {
    visibility: hidden;
  }
  #print-area, #print-area * {
    visibility: visible;
  }
  #print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0;
    padding: 20px;
    background: white !important;
    color: black !important;
  }
}
</style>
