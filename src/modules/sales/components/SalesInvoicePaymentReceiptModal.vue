<script setup lang="ts">
import { computed } from 'vue'
import { Printer } from 'lucide-vue-next'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import type { SalesPayment } from '../types/sales-payment.types'
import { getVariantConfig } from '../config/sales-order-variants'
import { formatCurrency } from '@/shared/utils/formatters'
import { terbilangRupiah } from '../utils/sales-payment-calculations'

const props = defineProps<{
  modelValue: boolean
  payment: SalesPayment | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const variantCfg = computed(() => {
  return getVariantConfig(props.payment?.variant || 'impact')
})

const terbilangText = computed(() => {
  if (!props.payment) return ''
  return terbilangRupiah(props.payment.jumlah)
})

function handlePrint(): void {
  window.print()
}
</script>

<template>
  <AppModal v-model="isOpen" title="Kwitansi Bukti Pembayaran" size="lg">
    <div v-if="payment" class="space-y-4">
      <!-- Printable Kwitansi Area -->
      <div
        id="payment-receipt-print-area"
        class="bg-white border-2 border-slate-300 rounded-lg p-6 font-sans text-slate-800 text-xs shadow-xs"
      >
        <!-- Letterhead Header -->
        <div class="flex items-start justify-between border-b-2 border-slate-800 pb-4 mb-4">
          <div>
            <h2 class="text-base font-extrabold uppercase tracking-wide text-slate-900">
              {{ variantCfg.companyLetterhead.title }}
            </h2>
            <p class="text-[11px] text-slate-600 mt-0.5">
              {{ variantCfg.companyLetterhead.address }}
            </p>
            <p class="text-[11px] text-slate-600">Telp: {{ variantCfg.companyLetterhead.phone }}</p>
          </div>

          <div class="text-right">
            <span
              class="inline-block px-3 py-1 bg-slate-100 border border-slate-300 font-extrabold text-sm uppercase tracking-wider text-slate-800 rounded"
            >
              KWITANSI PEMBAYARAN
            </span>
            <div class="font-mono text-xs font-bold text-slate-700 mt-2">
              No: {{ payment.kode }}
            </div>
            <div class="text-[11px] text-slate-500">
              Tanggal: <span class="font-mono">{{ payment.tanggal }}</span>
            </div>
          </div>
        </div>

        <!-- Receipt Rows -->
        <div class="space-y-3 py-2">
          <!-- Sudah Terima Dari -->
          <div class="grid grid-cols-12 gap-2 items-baseline">
            <span class="col-span-3 font-semibold text-slate-700">Telah Diterima Dari</span>
            <span class="col-span-1 text-center font-bold">:</span>
            <span class="col-span-8 font-bold text-slate-900 uppercase">
              {{ payment.customer_nama }}
            </span>
          </div>

          <!-- Uang Sejumlah (Terbilang) -->
          <div class="grid grid-cols-12 gap-2 items-baseline">
            <span class="col-span-3 font-semibold text-slate-700">Uang Sejumlah</span>
            <span class="col-span-1 text-center font-bold">:</span>
            <div
              class="col-span-8 font-serif italic bg-slate-50 border border-slate-200 px-3 py-1.5 rounded text-[11px] text-slate-900 font-medium"
            >
              # {{ terbilangText }} #
            </div>
          </div>

          <!-- Untuk Pembayaran -->
          <div class="grid grid-cols-12 gap-2 items-baseline">
            <span class="col-span-3 font-semibold text-slate-700">Untuk Pembayaran</span>
            <span class="col-span-1 text-center font-bold">:</span>
            <span class="col-span-8 text-slate-800">
              Tagihan Invoice
              <span class="font-mono font-bold">{{ payment.invoice_kode }}</span> (Ref Sales Order:
              <span class="font-mono">{{ payment.so_kode }}</span
              >)
              <span v-if="payment.keterangan" class="block text-slate-600 mt-0.5">
                Keterangan: {{ payment.keterangan }}
              </span>
            </span>
          </div>

          <!-- Metode Pembayaran -->
          <div class="grid grid-cols-12 gap-2 items-baseline">
            <span class="col-span-3 font-semibold text-slate-700">Metode & Akun</span>
            <span class="col-span-1 text-center font-bold">:</span>
            <span class="col-span-8 text-slate-800 font-medium">
              {{ payment.metode_pembayaran }}
              <span v-if="payment.bank_nama">
                · {{ payment.bank_nama }} ({{ payment.bank_rekening || '-' }})
              </span>
              <span v-if="payment.bukti_bayar" class="text-slate-500 font-mono text-[11px]">
                [Ref: {{ payment.bukti_bayar }}]
              </span>
            </span>
          </div>
        </div>

        <!-- Nominal Box & Signatures -->
        <div class="mt-6 pt-4 border-t border-slate-200 flex items-end justify-between gap-6">
          <!-- Terbilang Nominal Box -->
          <div
            class="bg-slate-100 border-2 border-slate-400 px-5 py-2.5 rounded-lg inline-block text-left"
          >
            <span class="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">
              Jumlah Diterima
            </span>
            <span class="font-mono text-lg font-black text-slate-900 tracking-tight">
              {{ formatCurrency(payment.jumlah) }}
            </span>
          </div>

          <!-- Signatures (2 Columns) -->
          <div class="flex items-center gap-12 text-center text-[11px]">
            <div class="w-32">
              <span class="text-slate-500 block mb-12">Yang Menyerahkan,</span>
              <div class="border-t border-slate-400 font-semibold text-slate-800 pt-1">
                ( {{ payment.customer_nama.split(' ')[0] }}... )
              </div>
            </div>

            <div class="w-36">
              <span class="text-slate-500 block mb-12">Penerima (Kasir/Finance),</span>
              <div class="border-t border-slate-400 font-bold text-slate-900 pt-1">
                {{ payment.created_by_nama }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="flex items-center justify-between pt-3 border-t border-slate-200">
        <AppButton variant="outline" size="sm" @click="isOpen = false"> Tutup </AppButton>

        <AppButton variant="primary" size="sm" @click="handlePrint">
          <template #iconLeft>
            <Printer class="w-4 h-4" />
          </template>
          Cetak Kwitansi (Print)
        </AppButton>
      </div>
    </div>
  </AppModal>
</template>

<style scoped>
@media print {
  body * {
    visibility: hidden;
  }
  #payment-receipt-print-area,
  #payment-receipt-print-area * {
    visibility: visible;
  }
  #payment-receipt-print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    border: none;
    box-shadow: none;
  }
}
</style>
