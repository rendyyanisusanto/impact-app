<script setup lang="ts">
import { Printer } from 'lucide-vue-next'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import type { SalesInvoice } from '../types/sales-invoice.types'
import { formatCurrency } from '@/shared/utils/formatters'

defineProps<{
  isOpen: boolean
  invoice: SalesInvoice | null
  soKode?: string
  customerNama?: string
}>()

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void
  (e: 'print', invoice: SalesInvoice): void
}>()
</script>

<template>
  <AppModal
    :model-value="isOpen"
    title="Detail Sales Invoice"
    size="lg"
    @update:model-value="emit('update:isOpen', $event)"
  >
    <div v-if="invoice" class="space-y-4 text-xs">
      <!-- Header Banner -->
      <div
        class="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
      >
        <div>
          <span class="text-[11px] font-medium text-slate-500 uppercase tracking-wider"
            >Kode Invoice</span
          >
          <p class="text-base font-bold text-slate-800 font-mono mt-0.5">{{ invoice.kode }}</p>
        </div>

        <div class="flex items-center gap-2">
          <!-- Status Invoice -->
          <span
            class="px-2.5 py-1 rounded-full text-xs font-semibold"
            :class="
              invoice.status === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            "
          >
            {{ invoice.status === 1 ? 'Aktif' : 'Batal' }}
          </span>

          <!-- Status Pembayaran -->
          <span
            class="px-2.5 py-1 rounded-full text-xs font-semibold"
            :class="{
              'bg-emerald-100 text-emerald-800': invoice.status_pembayaran === 'LUNAS',
              'bg-amber-100 text-amber-800': invoice.status_pembayaran === 'SEBAGIAN',
              'bg-rose-100 text-rose-800': invoice.status_pembayaran === 'BELUM_BAYAR'
            }"
          >
            {{
              invoice.status_pembayaran === 'LUNAS'
                ? 'Lunas'
                : invoice.status_pembayaran === 'SEBAGIAN'
                  ? 'Sebagian'
                  : 'Belum Bayar'
            }}
          </span>
        </div>
      </div>

      <!-- Info Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Sales Order Info -->
        <div class="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5">
          <h4
            class="text-xs font-bold text-slate-900 border-b border-slate-100 pb-1.5 uppercase tracking-wider"
          >
            Informasi Referensi
          </h4>
          <div class="flex justify-between">
            <span class="text-slate-500">No. Sales Order:</span>
            <span class="font-mono font-medium text-slate-800">{{ soKode || '-' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Customer:</span>
            <span class="font-medium text-slate-800">{{ customerNama || '-' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Tanggal Invoice:</span>
            <span class="font-mono text-slate-800">{{ invoice.tanggal }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Jenis Tagihan:</span>
            <span class="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">{{
              invoice.jenis
            }}</span>
          </div>
          <div v-if="invoice.no_faktur_pajak" class="flex justify-between">
            <span class="text-slate-500">No. Faktur Pajak:</span>
            <span class="font-mono text-slate-800">{{ invoice.no_faktur_pajak }}</span>
          </div>
        </div>

        <!-- Financial Breakdown -->
        <div class="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5">
          <h4
            class="text-xs font-bold text-slate-900 border-b border-slate-100 pb-1.5 uppercase tracking-wider"
          >
            Rincian Nilai Tagihan
          </h4>
          <div class="flex justify-between">
            <span class="text-slate-500">DPP (Dasar Pengenaan Pajak):</span>
            <span class="font-mono text-slate-700">{{ formatCurrency(invoice.subtotal) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">PPN:</span>
            <span
              class="font-mono"
              :class="invoice.total_ppn > 0 ? 'text-teal-700 font-medium' : 'text-slate-500'"
            >
              {{ formatCurrency(invoice.total_ppn) }}
            </span>
          </div>
          <div
            class="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900"
          >
            <span>Total Tagihan:</span>
            <span class="font-mono text-teal-700">{{ formatCurrency(invoice.total) }}</span>
          </div>
          <div class="flex justify-between text-slate-600">
            <span>Sudah Terbayar:</span>
            <span class="font-mono font-medium text-emerald-600">{{
              formatCurrency(invoice.terbayar)
            }}</span>
          </div>
          <div class="flex justify-between font-bold text-slate-800">
            <span>Sisa Pembayaran:</span>
            <span class="font-mono text-amber-700">{{
              formatCurrency(Math.max(0, invoice.total - invoice.terbayar))
            }}</span>
          </div>
        </div>
      </div>

      <!-- Keterangan -->
      <div v-if="invoice.keterangan" class="bg-slate-50 border border-slate-200 rounded-xl p-3">
        <span class="block text-[11px] font-semibold text-slate-500 mb-1">Keterangan:</span>
        <p class="text-slate-700">{{ invoice.keterangan }}</p>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between">
        <AppButton
          v-if="invoice && invoice.status === 1"
          variant="outline"
          size="sm"
          @click="emit('print', invoice)"
        >
          <template #iconLeft>
            <Printer class="w-4 h-4 text-indigo-600" />
          </template>
          Cetak Invoice
        </AppButton>
        <div v-else />

        <AppButton variant="outline" size="sm" @click="emit('update:isOpen', false)">
          Tutup
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>
