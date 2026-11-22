<script setup lang="ts">
import { ref } from 'vue'
import type { OtherIncomeHeader } from '../types/other-income.types'
import { otherIncomeService } from '../services/other-income.service'
import { RotateCcw, Loader2, X, AlertTriangle } from 'lucide-vue-next'
import { formatCurrency } from '@/shared/utils/formatters'
import { useToast } from '@/shared/composables/useToast'
import AppButton from '@/shared/components/ui/AppButton.vue'

const props = defineProps<{
  modelValue: boolean
  income: OtherIncomeHeader | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'reversed', updated: OtherIncomeHeader): void
}>()

const toast = useToast()
const isReversing = ref(false)
const reason = ref('')
const reversalDate = ref(new Date().toISOString().slice(0, 10))

function close() {
  reason.value = ''
  emit('update:modelValue', false)
}

async function handleConfirmReversal() {
  if (!props.income) return
  if (!reason.value.trim() || reason.value.trim().length < 3) {
    toast.error('Alasan reversal wajib diisi minimal 3 karakter')
    return
  }

  isReversing.value = true
  try {
    const res = await otherIncomeService.reverseIncome(props.income.id, {
      reason: reason.value.trim(),
      reversal_date: reversalDate.value
    })
    toast.success(`Transaksi ${res.trans_code} berhasil direversal. Jurnal pembalik telah dibuat!`)
    emit('reversed', res)
    close()
  } catch (err: any) {
    console.error('Failed to reverse income:', err)
    toast.error(err.message || 'Gagal mereversal pemasukan')
  } finally {
    isReversing.value = false
  }
}
</script>

<template>
  <div
    v-if="modelValue && income"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
  >
    <div
      class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up"
    >
      <!-- Modal Header -->
      <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center shrink-0">
            <RotateCcw class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-slate-800 dark:text-white">
              Reversal Transaksi Pemasukan
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Buat jurnal pembalik akuntansi untuk membatalkan penerimaan kas/bank
            </p>
          </div>
        </div>
        <button
          type="button"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg"
          @click="close"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6 space-y-4">
        <div class="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle class="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div class="text-xs text-rose-800 dark:text-rose-300 space-y-1">
            <p class="font-semibold">
              Konfirmasi Jurnal Pembalik (Reversal)
            </p>
            <p>
              Reversal akan membuat jurnal pembalik otomatis (Debit Pendapatan/Sumber, Kredit Kas/Bank) untuk menetralkan transaksi asli tanpa menghapus jejak audit. Transaksi ini tidak dapat dibalik ulang setelah reversal.
            </p>
          </div>
        </div>

        <div class="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60 space-y-2 text-xs">
          <div class="flex justify-between items-center">
            <span class="text-slate-500">Kode Pemasukan:</span>
            <span class="font-mono font-bold text-slate-800 dark:text-slate-200">{{ income.trans_code }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-500">Nominal yang Dibalik:</span>
            <span class="font-bold text-rose-600 dark:text-rose-400 font-mono">{{ formatCurrency(income.total) }}</span>
          </div>
        </div>

        <div class="space-y-3 pt-1">
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tanggal Reversal <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="reversalDate"
              type="date"
              class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Alasan Reversal <span class="text-rose-500">*</span>
            </label>
            <textarea
              v-model="reason"
              rows="3"
              placeholder="Jelaskan alasan pembatalan / pembalikan transaksi pemasukan ini..."
              class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
        <AppButton
          variant="secondary"
          size="sm"
          :disabled="isReversing"
          @click="close"
        >
          Batal
        </AppButton>
        <AppButton
          variant="primary"
          size="sm"
          class="bg-rose-600 hover:bg-rose-700 text-white"
          :disabled="isReversing || !reason.trim()"
          @click="handleConfirmReversal"
        >
          <Loader2 v-if="isReversing" class="w-4 h-4 animate-spin mr-1.5" />
          <RotateCcw v-else class="w-4 h-4 mr-1.5" />
          Proses Reversal
        </AppButton>
      </div>
    </div>
  </div>
</template>
