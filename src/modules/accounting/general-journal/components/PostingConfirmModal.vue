<script setup lang="ts">
import { ref } from 'vue'
import type { JournalHeader } from '../types/journal.types'
import { AlertTriangle, CheckCircle, X, Loader2 } from 'lucide-vue-next'
import { formatCurrency } from '@/shared/utils/formatters'

const props = defineProps<{
  modelValue: boolean
  journal: JournalHeader | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', id: number): void
}>()

const submitting = ref(false)

function close() {
  if (submitting.value) return
  emit('update:modelValue', false)
}

function handleConfirm() {
  if (!props.journal || submitting.value) return
  submitting.value = true
  emit('confirm', props.journal.id)
}

// Reset submitting when modal opens/closes
defineExpose({
  resetLoading: () => {
    submitting.value = false
  }
})
</script>

<template>
  <div
    v-if="modelValue && journal"
    class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
  >
    <div
      class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      <!-- Modal Header -->
      <div class="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
        <div class="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <CheckCircle class="w-5 h-5" />
          <h3 class="text-base font-semibold text-slate-800 dark:text-slate-100">
            Konfirmasi Posting Jurnal
          </h3>
        </div>
        <button
          type="button"
          :disabled="submitting"
          class="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          @click="close"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-5 space-y-4">
        <div class="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-3">
          <AlertTriangle class="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p class="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
            <strong>Perhatian:</strong> Jurnal yang telah diposting tidak dapat diedit atau dihapus secara langsung. Segala bentuk koreksi saldo ledger harus dilakukan melalui penerbitan jurnal pembalik (Reversal).
          </p>
        </div>

        <div class="bg-slate-50 dark:bg-slate-900/60 rounded-lg p-4 border border-slate-200 dark:border-slate-700 space-y-2 text-sm">
          <div class="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
            <span class="text-slate-500">Nomor Jurnal</span>
            <span class="font-mono font-bold text-slate-800 dark:text-slate-100">{{ journal.journal_number }}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
            <span class="text-slate-500">Tanggal Jurnal</span>
            <span class="text-slate-800 dark:text-slate-200">{{ journal.journal_date }}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
            <span class="text-slate-500">Jumlah Baris</span>
            <span class="text-slate-800 dark:text-slate-200">{{ journal.line_count }} Baris</span>
          </div>
          <div class="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
            <span class="text-slate-500">Total Debit</span>
            <span class="font-mono font-semibold text-slate-800 dark:text-slate-100">{{ formatCurrency(journal.total_debit) }}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
            <span class="text-slate-500">Total Kredit</span>
            <span class="font-mono font-semibold text-slate-800 dark:text-slate-100">{{ formatCurrency(journal.total_credit) }}</span>
          </div>
          <div class="flex justify-between py-1">
            <span class="text-slate-500">Status Keseimbangan</span>
            <span class="font-semibold" :class="journal.is_balanced ? 'text-emerald-600' : 'text-rose-600'">
              {{ journal.is_balanced ? 'Seimbang (Balance)' : 'Belum Seimbang' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="px-5 py-3.5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2">
        <button
          type="button"
          :disabled="submitting"
          class="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          @click="close"
        >
          Kembali
        </button>
        <button
          type="button"
          :disabled="submitting || !journal.is_balanced"
          class="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium flex items-center gap-2 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          @click="handleConfirm"
        >
          <Loader2 v-if="submitting" class="w-4 h-4 animate-spin" />
          <span>{{ submitting ? 'Memproses Posting...' : 'Konfirmasi Posting' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
