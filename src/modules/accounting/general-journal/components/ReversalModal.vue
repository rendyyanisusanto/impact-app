<script setup lang="ts">
import { ref, watch } from 'vue'
import type { JournalHeader } from '../types/journal.types'
import { RotateCcw, X, Loader2, AlertCircle } from 'lucide-vue-next'
import { formatCurrency } from '@/shared/utils/formatters'

const props = defineProps<{
  modelValue: boolean
  journal: JournalHeader | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', data: { id: number; reversal_date: string; reason: string }): void
}>()

const reversalDate = ref(new Date().toISOString().slice(0, 10))
const reason = ref('')
const submitting = ref(false)
const errorMessage = ref('')

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      reversalDate.value = new Date().toISOString().slice(0, 10)
      reason.value = ''
      errorMessage.value = ''
      submitting.value = false
    }
  }
)

function close() {
  if (submitting.value) return
  emit('update:modelValue', false)
}

function handleConfirm() {
  if (!props.journal || submitting.value) return
  if (!reason.value.trim() || reason.value.trim().length < 5) {
    errorMessage.value = 'Alasan reversal wajib diisi minimal 5 karakter.'
    return
  }

  submitting.value = true
  errorMessage.value = ''
  emit('confirm', {
    id: props.journal.id,
    reversal_date: reversalDate.value,
    reason: reason.value.trim()
  })
}

defineExpose({
  resetLoading: () => {
    submitting.value = false
  },
  setError: (msg: string) => {
    submitting.value = false
    errorMessage.value = msg
  }
})
</script>

<template>
  <div
    v-if="modelValue && journal"
    class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
  >
    <div
      class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
    >
      <!-- Modal Header -->
      <div class="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
        <div class="flex items-center gap-2 text-rose-600 dark:text-rose-400">
          <RotateCcw class="w-5 h-5" />
          <h3 class="text-base font-semibold text-slate-800 dark:text-slate-100">
            Reversal Jurnal Umum
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

      <!-- Form Content -->
      <div class="p-5 space-y-4 overflow-y-auto flex-1">
        <div v-if="errorMessage" class="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle class="w-4 h-4 flex-shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Meta fields -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Nomor Jurnal Asli
            </label>
            <input
              type="text"
              readonly
              :value="journal.journal_number"
              class="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 font-mono"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Tanggal Reversal <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="reversalDate"
              type="date"
              class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Alasan Reversal (Wajib) <span class="text-rose-500">*</span>
          </label>
          <textarea
            v-model="reason"
            rows="3"
            placeholder="Contoh: Koreksi pembatalan transaksi / salah input rekening oleh staf..."
            class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-100"
          />
        </div>

        <!-- Preview Baris Pembalik -->
        <div>
          <div class="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
            Perbandingan Baris Pembalik (Debit & Kredit Ditukar)
          </div>
          <div class="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden text-xs">
            <table class="w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead class="bg-slate-50 dark:bg-slate-900/60 font-semibold text-slate-600 dark:text-slate-300">
                <tr>
                  <th class="px-3 py-2 text-left">Rekening</th>
                  <th class="px-3 py-2 text-right">Debit Asli</th>
                  <th class="px-3 py-2 text-right">Kredit Asli</th>
                  <th class="px-3 py-2 text-right text-rose-600 bg-rose-50/50 dark:bg-rose-950/20">Debit Pembalik</th>
                  <th class="px-3 py-2 text-right text-rose-600 bg-rose-50/50 dark:bg-rose-950/20">Kredit Pembalik</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                <tr v-for="l in journal.lines" :key="l.line_number" class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td class="px-3 py-2">
                    <span class="font-mono text-slate-500 mr-1.5">{{ l.kode_akun }}</span>
                    <span class="text-slate-700 dark:text-slate-300">{{ l.nama_akun }}</span>
                  </td>
                  <td class="px-3 py-2 text-right font-mono text-slate-500">
                    {{ l.debit > 0 ? formatCurrency(l.debit) : '-' }}
                  </td>
                  <td class="px-3 py-2 text-right font-mono text-slate-500">
                    {{ l.credit > 0 ? formatCurrency(l.credit) : '-' }}
                  </td>
                  <td class="px-3 py-2 text-right font-mono font-semibold text-rose-700 dark:text-rose-300 bg-rose-50/30 dark:bg-rose-950/10">
                    {{ l.credit > 0 ? formatCurrency(l.credit) : '-' }}
                  </td>
                  <td class="px-3 py-2 text-right font-mono font-semibold text-rose-700 dark:text-rose-300 bg-rose-50/30 dark:bg-rose-950/10">
                    {{ l.debit > 0 ? formatCurrency(l.debit) : '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-5 py-3.5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2">
        <button
          type="button"
          :disabled="submitting"
          class="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          @click="close"
        >
          Batal
        </button>
        <button
          type="button"
          :disabled="submitting || !reason.trim()"
          class="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium flex items-center gap-2 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          @click="handleConfirm"
        >
          <Loader2 v-if="submitting" class="w-4 h-4 animate-spin" />
          <span>{{ submitting ? 'Memproses Reversal...' : 'Buat Jurnal Pembalik' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
