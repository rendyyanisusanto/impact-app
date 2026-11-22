<script setup lang="ts">
import { ref } from 'vue'
import type { OtherIncomeHeader } from '../types/other-income.types'
import { otherIncomeService } from '../services/other-income.service'
import { AlertTriangle, Send, Loader2, X } from 'lucide-vue-next'
import { formatCurrency } from '@/shared/utils/formatters'
import { useToast } from '@/shared/composables/useToast'
import AppButton from '@/shared/components/ui/AppButton.vue'

const props = defineProps<{
  modelValue: boolean
  income: OtherIncomeHeader | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'posted', updated: OtherIncomeHeader): void
}>()

const toast = useToast()
const isPosting = ref(false)

function close() {
  emit('update:modelValue', false)
}

async function handleConfirmPost() {
  if (!props.income) return
  isPosting.value = true
  try {
    const res = await otherIncomeService.postIncome(props.income.id)
    toast.success(`Pemasukan ${res.trans_code} berhasil diposting. Jurnal ${res.journal_number || ''} telah tercatat di ledger!`)
    emit('posted', res)
    close()
  } catch (err: any) {
    console.error('Failed to post income:', err)
    toast.error(err.message || 'Gagal memposting pemasukan')
  } finally {
    isPosting.value = false
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
          <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
            <Send class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-slate-800 dark:text-white">
              Posting Pemasukan Kas/Bank
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Konfirmasi pencatatan jurnal akuntansi ganda
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
        <div class="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div class="text-xs text-amber-800 dark:text-amber-300 space-y-1">
            <p class="font-semibold">
              Perhatian: Tindakan ini bersifat permanen!
            </p>
            <p>
              Setelah diposting, pemasukan ini akan menghasilkan ayat jurnal double-entry di buku besar, memengaruhi saldo kas/bank, dan tidak dapat diedit atau dihapus secara langsung kecuali melalui mekanisme reversal.
            </p>
          </div>
        </div>

        <div class="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60 space-y-2.5 text-xs">
          <div class="flex justify-between items-center">
            <span class="text-slate-500">Nomor Dokumen:</span>
            <span class="font-mono font-bold text-slate-800 dark:text-slate-200">{{ income.trans_code }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-500">Tanggal Transaksi:</span>
            <span class="font-medium text-slate-800 dark:text-slate-200">{{ income.tanggal }}</span>
          </div>
          <div v-if="income.received_from" class="flex justify-between items-center">
            <span class="text-slate-500">Diterima Dari:</span>
            <span class="font-medium text-slate-800 dark:text-slate-200">{{ income.received_from }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-500">Rekening Kas/Bank:</span>
            <span class="font-medium text-emerald-600 dark:text-emerald-400">{{ income.kode_akun_kas }} - {{ income.nama_akun_kas }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-500">Keterangan:</span>
            <span class="font-medium text-slate-800 dark:text-slate-200 max-w-[240px] truncate text-right">{{ income.keterangan }}</span>
          </div>
          <div class="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between items-center font-bold text-sm">
            <span class="text-slate-700 dark:text-slate-300">Total Pemasukan:</span>
            <span class="text-emerald-600 dark:text-emerald-400 font-mono">{{ formatCurrency(income.total) }}</span>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
        <AppButton
          variant="secondary"
          size="sm"
          :disabled="isPosting"
          @click="close"
        >
          Batal
        </AppButton>
        <AppButton
          variant="primary"
          size="sm"
          class="bg-emerald-600 hover:bg-emerald-700 text-white"
          :disabled="isPosting"
          @click="handleConfirmPost"
        >
          <Loader2 v-if="isPosting" class="w-4 h-4 animate-spin mr-1.5" />
          <Send v-else class="w-4 h-4 mr-1.5" />
          Konfirmasi Posting
        </AppButton>
      </div>
    </div>
  </div>
</template>
