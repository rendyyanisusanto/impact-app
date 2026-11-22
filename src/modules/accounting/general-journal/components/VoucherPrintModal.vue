<script setup lang="ts">
import type { JournalHeader } from '../types/journal.types'
import { Printer, X } from 'lucide-vue-next'
import { formatCurrency } from '@/shared/utils/formatters'

defineProps<{
  modelValue: boolean
  journal: JournalHeader | null
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
</script>

<template>
  <div
    v-if="modelValue && journal"
    class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white print:fixed print:inset-0"
  >
    <div
      class="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:rounded-none"
    >
      <!-- Modal Action Bar (hidden when printing) -->
      <div class="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
        <h3 class="text-sm font-semibold text-slate-800">
          Cetak Voucher Bukti Jurnal
        </h3>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition"
            @click="handlePrint"
          >
            <Printer class="w-4 h-4" />
            <span>Cetak / Print</span>
          </button>
          <button
            type="button"
            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
            @click="close"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Printable Voucher Content -->
      <div id="printable-voucher" class="p-8 overflow-y-auto flex-1 relative print:p-6 print:overflow-visible text-slate-900">
        <!-- Draft Watermark -->
        <div
          v-if="journal.status === 'DRAFT'"
          class="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-10 rotate-[-25deg]"
        >
          <span class="text-7xl font-black text-rose-600 border-8 border-rose-600 px-8 py-4 rounded-3xl tracking-widest">
            DRAFT
          </span>
        </div>

        <!-- Header -->
        <div class="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
          <div>
            <h1 class="text-xl font-bold tracking-tight text-slate-900">
              IMPACT FURNITURE
            </h1>
            <p class="text-xs text-slate-500 mt-0.5">
              Enterprise Resource Planning System
            </p>
          </div>
          <div class="text-right">
            <h2 class="text-lg font-bold uppercase tracking-wider text-teal-800">
              Bukti Jurnal Umum
            </h2>
            <span
              class="inline-block mt-1 px-2.5 py-0.5 text-xs font-bold rounded"
              :class="{
                'bg-emerald-100 text-emerald-800': journal.status === 'POSTED',
                'bg-amber-100 text-amber-800': journal.status === 'DRAFT',
                'bg-purple-100 text-purple-800': journal.status === 'REVERSED',
                'bg-slate-100 text-slate-800': journal.status === 'CANCELLED'
              }"
            >
              {{ journal.status }}
            </span>
          </div>
        </div>

        <!-- Metadata Grid -->
        <div class="grid grid-cols-2 gap-4 text-xs mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div class="space-y-1.5">
            <div class="flex">
              <span class="w-32 text-slate-500 font-medium">Nomor Jurnal</span>
              <span class="font-mono font-bold text-slate-900">: {{ journal.journal_number }}</span>
            </div>
            <div class="flex">
              <span class="w-32 text-slate-500 font-medium">Tanggal Jurnal</span>
              <span class="text-slate-900">: {{ journal.journal_date }}</span>
            </div>
            <div class="flex">
              <span class="w-32 text-slate-500 font-medium">Nomor Referensi</span>
              <span class="text-slate-900">: {{ journal.reference_number || '-' }}</span>
            </div>
          </div>
          <div class="space-y-1.5">
            <div class="flex">
              <span class="w-32 text-slate-500 font-medium">Sumber Jurnal</span>
              <span class="text-slate-900">: {{ journal.is_legacy ? 'Otomatis (Legacy)' : journal.source_type }}</span>
            </div>
            <div class="flex">
              <span class="w-32 text-slate-500 font-medium">Mata Uang</span>
              <span class="text-slate-900">: {{ journal.currency }}</span>
            </div>
            <div class="flex">
              <span class="w-32 text-slate-500 font-medium">Keterangan</span>
              <span class="text-slate-900">: {{ journal.description }}</span>
            </div>
          </div>
        </div>

        <!-- Lines Table -->
        <table class="w-full text-xs border-collapse border border-slate-300 mb-6">
          <thead>
            <tr class="bg-slate-100 text-slate-800 font-semibold border-b border-slate-300">
              <th class="border border-slate-300 px-3 py-2 text-center w-10">No</th>
              <th class="border border-slate-300 px-3 py-2 text-left w-24">Kode Akun</th>
              <th class="border border-slate-300 px-3 py-2 text-left">Nama Rekening & Keterangan</th>
              <th class="border border-slate-300 px-3 py-2 text-right w-36">Debit (Rp)</th>
              <th class="border border-slate-300 px-3 py-2 text-right w-36">Kredit (Rp)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="l in journal.lines" :key="l.line_number" class="border-b border-slate-200">
              <td class="border border-slate-300 px-3 py-2 text-center font-mono">{{ l.line_number }}</td>
              <td class="border border-slate-300 px-3 py-2 font-mono font-medium">{{ l.kode_akun }}</td>
              <td class="border border-slate-300 px-3 py-2">
                <div class="font-medium text-slate-900">{{ l.nama_akun }}</div>
                <div v-if="l.description" class="text-[11px] text-slate-500 mt-0.5">{{ l.description }}</div>
              </td>
              <td class="border border-slate-300 px-3 py-2 text-right font-mono font-semibold">
                {{ l.debit > 0 ? formatCurrency(l.debit) : '-' }}
              </td>
              <td class="border border-slate-300 px-3 py-2 text-right font-mono font-semibold">
                {{ l.credit > 0 ? formatCurrency(l.credit) : '-' }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="bg-slate-100 font-bold border-t-2 border-slate-400">
              <td colspan="3" class="border border-slate-300 px-3 py-2 text-right uppercase">
                Total
              </td>
              <td class="border border-slate-300 px-3 py-2 text-right font-mono text-teal-800">
                {{ formatCurrency(journal.total_debit) }}
              </td>
              <td class="border border-slate-300 px-3 py-2 text-right font-mono text-teal-800">
                {{ formatCurrency(journal.total_credit) }}
              </td>
            </tr>
          </tfoot>
        </table>

        <!-- Signatures & Audit Footers -->
        <div class="grid grid-cols-3 gap-6 text-center text-xs pt-4 border-t border-slate-200">
          <div>
            <p class="text-slate-500 mb-12">Dibuat Oleh,</p>
            <p class="font-bold border-t border-slate-400 pt-1">
              {{ journal.creator_name || '-' }}
            </p>
            <p class="text-[10px] text-slate-400">
              {{ journal.created_at ? new Date(journal.created_at).toLocaleDateString('id-ID') : '' }}
            </p>
          </div>
          <div>
            <p class="text-slate-500 mb-12">Diperiksa Oleh,</p>
            <p class="font-bold border-t border-slate-400 pt-1">
              Supervisor Akuntansi
            </p>
            <p class="text-[10px] text-slate-400">Tanggal: ..............</p>
          </div>
          <div>
            <p class="text-slate-500 mb-12">Diposting Oleh,</p>
            <p class="font-bold border-t border-slate-400 pt-1">
              {{ journal.poster_name || '-' }}
            </p>
            <p class="text-[10px] text-slate-400">
              {{ journal.posted_at ? new Date(journal.posted_at).toLocaleDateString('id-ID') : '' }}
            </p>
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
  #printable-voucher, #printable-voucher * {
    visibility: visible;
  }
  #printable-voucher {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0;
    padding: 20px;
  }
}
</style>
