<script setup lang="ts">
import { ref, watch } from 'vue'
import type { OtherExpenseHeader } from '../types/other-expense.types'
import { RotateCcw, AlertOctagon, X } from 'lucide-vue-next'
import { formatCurrency } from '@/shared/utils/formatters'
import AppButton from '@/shared/components/ui/AppButton.vue'

const props = defineProps<{
  modelValue: boolean
  expense: OtherExpenseHeader | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', data: { reason: string; reversal_date: string }): void
}>()

const reversalDate = ref('')
const reversalReason = ref('')
const errorMsg = ref('')

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      reversalDate.value = new Date().toISOString().split('T')[0]
      reversalReason.value = ''
      errorMsg.value = ''
    }
  }
)

function close() {
  emit('update:modelValue', false)
}

function handleConfirm() {
  if (!reversalReason.value.trim() || reversalReason.value.trim().length < 3) {
    errorMsg.value = 'Alasan reversal wajib diisi minimal 3 karakter.'
    return
  }

  emit('confirm', {
    reason: reversalReason.value.trim(),
    reversal_date: reversalDate.value
  })
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
      <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-purple-50/50 dark:bg-purple-900/20">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-purple-100 dark:bg-purple-800/40 text-purple-700 dark:text-purple-300 rounded-xl">
            <RotateCcw class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-slate-800 dark:text-white">
              Reversal Pengeluaran Operasional
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Membatalkan transaksi Posted dengan membuat Jurnal Pembalik
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
        <div class="flex items-start gap-3 p-3.5 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 rounded-xl text-rose-800 dark:text-rose-300 text-xs leading-relaxed">
          <AlertOctagon class="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <div>
            <p class="font-semibold">Ketentuan Reversal</p>
            <p class="mt-0.5 text-rose-700 dark:text-rose-400">
              Transaksi yang sudah diposting tidak dapat dihapus. Sistem akan menerbitkan <strong>Jurnal Pembalik</strong> resmi yang membalik Debit Kas/Bank dan Kredit Beban, serta mempertahankan jejak audit transaksi asli.
            </p>
          </div>
        </div>

        <!-- Summary box -->
        <div class="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
          <div class="flex justify-between items-center">
            <span class="text-slate-500">Nomor Pengeluaran:</span>
            <span class="font-mono font-bold text-slate-800 dark:text-white">{{ expense.trans_code }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-500">Nominal:</span>
            <span class="font-bold text-rose-600 dark:text-rose-400 font-mono">{{ formatCurrency(expense.total) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-500">Jurnal Terkait:</span>
            <span class="font-mono text-slate-700 dark:text-slate-300">{{ expense.journal_number || '-' }}</span>
          </div>
        </div>

        <!-- Form fields -->
        <div class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tanggal Reversal <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="reversalDate"
              type="date"
              class="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Alasan Reversal <span class="text-rose-500">*</span>
            </label>
            <textarea
              v-model="reversalReason"
              rows="3"
              placeholder="Contoh: Kesalahan input nominal, duplikasi pencatatan, transaksi dibatalkan oleh supplier..."
              class="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white resize-none"
            />
            <p v-if="errorMsg" class="text-xs text-rose-500 mt-1">
              {{ errorMsg }}
            </p>
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
          class="bg-purple-600 hover:bg-purple-700 text-white"
          :loading="loading"
          @click="handleConfirm"
        >
          <RotateCcw class="w-4 h-4 mr-1.5" />
          Proses Reversal
        </AppButton>
      </div>
    </div>
  </div>
</template>
