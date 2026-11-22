<script setup lang="ts">
import type { OtherExpenseHeader } from '../types/other-expense.types'
import { Send, AlertTriangle, X } from 'lucide-vue-next'
import { formatCurrency } from '@/shared/utils/formatters'
import AppButton from '@/shared/components/ui/AppButton.vue'

defineProps<{
  modelValue: boolean
  expense: OtherExpenseHeader | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
}>()

function close() {
  emit('update:modelValue', false)
}

function handleConfirm() {
  emit('confirm')
}
</script>

<template>
  <div
    v-if="modelValue && expense"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
  >
    <div
      class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up"
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-teal-50/50 dark:bg-teal-900/20">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-teal-100 dark:bg-teal-800/40 text-teal-700 dark:text-teal-300 rounded-xl">
            <Send class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-slate-800 dark:text-white">
              Konfirmasi Posting Pengeluaran
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Posting transaksi ke buku besar (General Ledger)
            </p>
          </div>
        </div>
        <button
          type="button"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          @click="close"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-4">
        <!-- Warning alert -->
        <div class="flex items-start gap-3 p-3.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
          <AlertTriangle class="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div>
            <p class="font-semibold">Perhatian Transaksi Akuntansi</p>
            <p class="mt-0.5 text-amber-700 dark:text-amber-400">
              Setelah diposting, pengeluaran ini akan menghasilkan jurnal double-entry resmi dan mengurangi saldo kas/bank. Transaksi tidak dapat diedit atau dihapus secara langsung (hanya dapat dibatalkan melalui Reversal).
            </p>
          </div>
        </div>

        <!-- Summary box -->
        <div class="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
          <div class="flex justify-between items-center">
            <span class="text-slate-500">Nomor Transaksi:</span>
            <span class="font-mono font-bold text-slate-800 dark:text-white">{{ expense.trans_code }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-500">Tanggal:</span>
            <span class="font-medium text-slate-700 dark:text-slate-300">{{ expense.tanggal }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-500">Keperluan:</span>
            <span class="font-medium text-slate-700 dark:text-slate-300 text-right truncate max-w-[240px]">{{ expense.keterangan }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-500">Sumber Dana (Kredit):</span>
            <span class="font-semibold text-slate-700 dark:text-slate-300">{{ expense.kode_akun_kas }} - {{ expense.nama_akun_kas }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-500">Akun Beban (Debit):</span>
            <span class="font-semibold text-slate-700 dark:text-slate-300">{{ expense.kode_akun_beban }} - {{ expense.nama_akun_beban }}</span>
          </div>
          <div class="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between items-center text-sm">
            <span class="font-bold text-slate-700 dark:text-slate-200">Total Nominal:</span>
            <span class="font-mono font-bold text-teal-600 dark:text-teal-400 text-base">
              {{ formatCurrency(expense.total) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
        <AppButton
          variant="outline"
          size="sm"
          :disabled="loading"
          @click="close"
        >
          Batal
        </AppButton>
        <AppButton
          variant="primary"
          size="sm"
          class="bg-teal-600 hover:bg-teal-700 text-white"
          :loading="loading"
          @click="handleConfirm"
        >
          <Send class="w-4 h-4 mr-1.5" />
          Posting Sekarang
        </AppButton>
      </div>
    </div>
  </div>
</template>
