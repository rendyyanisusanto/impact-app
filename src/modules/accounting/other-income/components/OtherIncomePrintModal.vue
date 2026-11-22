<script setup lang="ts">
import { computed } from 'vue'
import type { OtherIncomeHeader } from '../types/other-income.types'
import { Printer, X } from 'lucide-vue-next'
import { formatCurrency } from '@/shared/utils/formatters'
import { terbilangRupiah } from '@/modules/sales/utils/sales-payment-calculations'
import AppButton from '@/shared/components/ui/AppButton.vue'

const props = defineProps<{
  modelValue: boolean
  income: OtherIncomeHeader | null
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
  if (!props.income?.total) return 'Nol Rupiah'
  return terbilangRupiah(props.income.total)
})

const watermarkText = computed(() => {
  if (!props.income) return ''
  if (props.income.status === 'DRAFT') return 'DRAFT — BELUM DIPOSTING'
  if (props.income.status === 'CANCELLED') return 'DIBATALKAN'
  if (props.income.status === 'REVERSED') return 'REVERSED / TELAH DIBALIK'
  return ''
})
</script>

<template>
  <div
    v-if="modelValue && income"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white print:static"
  >
    <div
      class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up print:border-none print:shadow-none print:max-w-none print:max-h-none print:w-full print:rounded-none"
    >
      <!-- Modal Toolbar (Hidden on print) -->
      <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 print:hidden">
        <div>
          <h3 class="text-base font-semibold text-slate-800 dark:text-white">
            Cetak Bukti Pemasukan Kas/Bank
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dokumen resmi tanda bukti penerimaan kas/bank operasional
          </p>
        </div>
        <div class="flex items-center gap-2">
          <AppButton
            variant="primary"
            size="sm"
            class="bg-emerald-600 hover:bg-emerald-700 text-white"
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
                BUKTI PEMASUKAN KAS/BANK
              </h2>
              <div class="mt-1 font-mono font-bold text-sm text-slate-800">
                {{ income.trans_code }}
              </div>
              <div class="text-xs text-slate-500">
                Tanggal: <span class="font-medium text-slate-800">{{ income.tanggal }}</span>
              </div>
            </div>
          </div>

          <!-- Transaction Info Grid -->
          <div class="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div class="space-y-1.5">
              <div class="flex">
                <span class="w-32 text-slate-500">Diterima Dari:</span>
                <span class="font-semibold text-slate-800">{{ income.received_from || '-' }}</span>
              </div>
              <div class="flex">
                <span class="w-32 text-slate-500">Kas/Bank Penerima:</span>
                <span class="font-semibold text-slate-800">{{ income.kode_akun_kas }} - {{ income.nama_akun_kas }}</span>
              </div>
              <div class="flex">
                <span class="w-32 text-slate-500">Akun Sumber:</span>
                <span class="font-semibold text-slate-800">{{ income.kode_akun_sumber || '-' }} - {{ income.nama_akun_sumber || '-' }}</span>
              </div>
            </div>
            <div class="space-y-1.5">
              <div class="flex">
                <span class="w-32 text-slate-500">Metode Bayar:</span>
                <span class="font-semibold text-slate-800">{{ income.payment_method || 'Transfer Bank' }}</span>
              </div>
              <div class="flex">
                <span class="w-32 text-slate-500">No. Referensi / Bukti:</span>
                <span class="font-semibold text-slate-800">{{ income.reference_number || '-' }}</span>
              </div>
              <div class="flex">
                <span class="w-32 text-slate-500">Status Dokumen:</span>
                <span class="font-bold uppercase tracking-wider text-slate-800">{{ income.status }}</span>
              </div>
            </div>
          </div>

          <!-- Keterangan Umum -->
          <div class="text-xs">
            <span class="text-slate-500 block mb-0.5">Keterangan / Keperluan:</span>
            <div class="p-2.5 bg-slate-50 rounded-lg border border-slate-200 font-medium text-slate-800">
              {{ income.keterangan }}
            </div>
          </div>

          <!-- Table of Details -->
          <div>
            <table class="w-full text-xs border-collapse">
              <thead>
                <tr class="border-b-2 border-slate-800 text-slate-700 text-left">
                  <th class="py-2 px-2 w-10 text-center font-bold">No</th>
                  <th class="py-2 px-2 font-bold">Deskripsi / Rincian Pemasukan</th>
                  <th class="py-2 px-2 font-bold">Akun Sumber / Pendapatan</th>
                  <th class="py-2 px-2 text-right font-bold w-36">Jumlah (Rp)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                <tr v-for="(it, idx) in (income.items || [])" :key="idx" class="text-slate-800">
                  <td class="py-2.5 px-2 text-center text-slate-500">{{ idx + 1 }}</td>
                  <td class="py-2.5 px-2 font-medium">{{ it.keterangan }}</td>
                  <td class="py-2.5 px-2 text-slate-600">
                    {{ it.kode_akun_lawan ? `${it.kode_akun_lawan} - ${it.nama_akun_lawan}` : (income.nama_akun_sumber || '-') }}
                  </td>
                  <td class="py-2.5 px-2 text-right font-mono font-semibold">{{ formatCurrency(it.jumlah) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="border-t-2 border-slate-800 font-bold text-slate-900">
                  <td colspan="3" class="py-3 px-2 text-right text-xs uppercase tracking-wider">
                    Total Penerimaan:
                  </td>
                  <td class="py-3 px-2 text-right font-mono text-sm text-emerald-700">
                    {{ formatCurrency(income.total) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Terbilang Box -->
          <div class="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs">
            <span class="text-slate-500 font-medium">Terbilang:</span>
            <p class="font-bold text-emerald-900 italic mt-0.5 capitalize">
              # {{ terbilangText }} #
            </p>
          </div>

          <!-- Signatures Section -->
          <div class="pt-6 grid grid-cols-3 gap-6 text-center text-xs">
            <div class="space-y-16">
              <span class="text-slate-600">Diterima Oleh,</span>
              <div>
                <div class="border-b border-slate-400 w-3/4 mx-auto"></div>
                <span class="text-[11px] text-slate-500 mt-1 block">Kasir / Finance</span>
              </div>
            </div>
            <div class="space-y-16">
              <span class="text-slate-600">Diverifikasi Oleh,</span>
              <div>
                <div class="border-b border-slate-400 w-3/4 mx-auto"></div>
                <span class="text-[11px] text-slate-500 mt-1 block">Accounting Officer</span>
              </div>
            </div>
            <div class="space-y-16">
              <span class="text-slate-600">Mengetahui / Menyetujui,</span>
              <div>
                <div class="border-b border-slate-400 w-3/4 mx-auto"></div>
                <span class="text-[11px] text-slate-500 mt-1 block">Head of Finance</span>
              </div>
            </div>
          </div>

          <!-- Footer Metadata -->
          <div class="pt-6 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400">
            <span>Dicetak secara otomatis oleh SMM-Impact ERP V2</span>
            <span>Nomor Dokumen: {{ income.trans_code }}</span>
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
  }
}
</style>
