<script setup lang="ts">
import { computed } from 'vue'
import { Printer, CheckCircle2, XCircle } from 'lucide-vue-next'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import type { SalesPayment } from '../types/sales-payment.types'
import { formatCurrency } from '@/shared/utils/formatters'

const props = defineProps<{
  modelValue: boolean
  payment: SalesPayment | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'print', payment: SalesPayment): void
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

function handlePrint(): void {
  if (props.payment) {
    emit('print', props.payment)
  }
}
</script>

<template>
  <AppModal v-model="isOpen" title="Detail Pembayaran Sales Invoice" size="md">
    <div v-if="payment" class="space-y-4 text-xs">
      <!-- Status Banner -->
      <div
        class="p-3 rounded-lg border flex items-center justify-between"
        :class="
          payment.status === 1
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
            : 'bg-rose-50/70 border-rose-200 text-rose-800'
        "
      >
        <div class="flex items-center gap-2">
          <CheckCircle2 v-if="payment.status === 1" class="w-4 h-4 text-emerald-600" />
          <XCircle v-else class="w-4 h-4 text-rose-600" />
          <span class="font-bold">
            Status Pembayaran: {{ payment.status === 1 ? 'BERHASIL / AKTIF' : 'DIBATALKAN' }}
          </span>
        </div>
        <span class="font-mono text-[11px] font-semibold">{{ payment.kode }}</span>
      </div>

      <!-- Info Grid -->
      <div class="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
        <div>
          <span class="text-slate-500 block text-[11px]">No. Invoice</span>
          <span class="font-mono font-bold text-slate-800 text-xs">{{ payment.invoice_kode }}</span>
        </div>

        <div>
          <span class="text-slate-500 block text-[11px]">No. Sales Order</span>
          <span class="font-mono font-medium text-slate-700 text-xs">{{ payment.so_kode }}</span>
        </div>

        <div>
          <span class="text-slate-500 block text-[11px]">Tanggal Pembayaran</span>
          <span class="font-mono text-slate-800">{{ payment.tanggal }}</span>
        </div>

        <div>
          <span class="text-slate-500 block text-[11px]">Customer</span>
          <span class="font-medium text-slate-800">{{ payment.customer_nama }}</span>
        </div>

        <div>
          <span class="text-slate-500 block text-[11px]">Metode Pembayaran</span>
          <span class="font-semibold text-slate-800">{{ payment.metode_pembayaran }}</span>
        </div>

        <div>
          <span class="text-slate-500 block text-[11px]">Bank Tujuan</span>
          <span class="text-slate-800 font-mono">
            {{ payment.bank_nama ? `${payment.bank_nama} (${payment.bank_rekening || '-'})` : '-' }}
          </span>
        </div>

        <div>
          <span class="text-slate-500 block text-[11px]">No. Bukti / Referensi</span>
          <span class="font-mono text-slate-800">{{ payment.bukti_bayar || '-' }}</span>
        </div>

        <div>
          <span class="text-slate-500 block text-[11px]">Dicatat Oleh</span>
          <span class="text-slate-700">{{ payment.created_by_nama }}</span>
        </div>
      </div>

      <!-- Nominal Highlight Box -->
      <div
        class="bg-teal-50/60 border border-teal-200 rounded-lg p-3.5 flex items-center justify-between"
      >
        <div>
          <span class="text-xs font-semibold text-teal-800">Jumlah Pembayaran Diterima</span>
          <p class="text-[11px] text-teal-600 mt-0.5">Tercatat ke buku kas/bank penerimaan</p>
        </div>
        <div class="text-right">
          <span class="font-mono font-bold text-teal-900 text-base">
            {{ formatCurrency(payment.jumlah) }}
          </span>
        </div>
      </div>

      <!-- Keterangan -->
      <div v-if="payment.keterangan" class="border border-slate-200 rounded-lg p-3 bg-white">
        <span class="text-slate-500 block text-[11px] mb-0.5">Catatan / Keterangan:</span>
        <p class="text-slate-800">{{ payment.keterangan }}</p>
      </div>

      <!-- Alasan Batal (if cancelled) -->
      <div
        v-if="payment.status === 0 && payment.alasan_batal"
        class="border border-rose-200 rounded-lg p-3 bg-rose-50/50"
      >
        <span class="text-rose-700 block text-[11px] font-semibold mb-0.5">Alasan Pembatalan:</span>
        <p class="text-rose-900">{{ payment.alasan_batal }}</p>
      </div>

      <!-- Modal Footer -->
      <div class="flex items-center justify-between pt-3 border-t border-slate-200">
        <AppButton variant="outline" size="sm" @click="handlePrint">
          <template #iconLeft>
            <Printer class="w-4 h-4" />
          </template>
          Cetak Kwitansi
        </AppButton>

        <AppButton variant="secondary" size="sm" @click="isOpen = false"> Tutup </AppButton>
      </div>
    </div>
  </AppModal>
</template>
