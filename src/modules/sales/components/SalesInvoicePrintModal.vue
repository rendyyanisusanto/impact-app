<script setup lang="ts">
import { computed } from 'vue'
import { Printer } from 'lucide-vue-next'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import type { SalesInvoice } from '../types/sales-invoice.types'
import { formatCurrency } from '@/shared/utils/formatters'
import { getVariantConfig, type SalesOrderVariantKey } from '../config/sales-order-variants'

const props = defineProps<{
  isOpen: boolean
  invoice: SalesInvoice | null
  soKode?: string
  customerNama?: string
  customerAlamat?: string
  customerTelepon?: string
  variant: SalesOrderVariantKey
}>()

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void
}>()

const variantCfg = computed(() => getVariantConfig(props.variant))

function handlePrint(): void {
  window.print()
}
</script>

<template>
  <AppModal
    :model-value="isOpen"
    title="Cetak Sales Invoice"
    size="xl"
    @update:model-value="emit('update:isOpen', $event)"
  >
    <div class="space-y-4">
      <!-- Print Preview Sheet -->
      <div
        id="printable-invoice"
        class="bg-white border border-slate-300 p-8 rounded-lg text-slate-800 text-xs shadow-sm font-sans"
      >
        <!-- Letterhead -->
        <div class="flex items-start justify-between border-b-2 border-slate-800 pb-4 mb-4">
          <div>
            <h1 class="text-xl font-bold tracking-tight text-slate-900 uppercase">
              {{ variantCfg.companyLetterhead.title }}
            </h1>
            <p class="text-[11px] text-slate-600 mt-1 max-w-md">
              {{ variantCfg.companyLetterhead.address }}
            </p>
            <p class="text-[11px] text-slate-600 font-mono">
              Telp: {{ variantCfg.companyLetterhead.phone }}
            </p>
          </div>
          <div class="text-right">
            <h2 class="text-lg font-black tracking-wider text-teal-800 uppercase font-mono">
              FAKTUR INVOICE
            </h2>
            <p class="text-xs font-mono font-bold text-slate-700 mt-1">
              {{ invoice?.kode }}
            </p>
            <p class="text-[11px] text-slate-500 font-mono">Tanggal: {{ invoice?.tanggal }}</p>
          </div>
        </div>

        <!-- Meta Customer & SO Info -->
        <div class="grid grid-cols-2 gap-6 mb-6">
          <div class="border border-slate-200 rounded-lg p-3">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Kepada Yth:
            </p>
            <p class="font-bold text-sm text-slate-900">{{ customerNama || '-' }}</p>
            <p class="text-slate-600 mt-0.5">{{ customerAlamat || '-' }}</p>
            <p class="text-slate-600 font-mono mt-0.5">Telp: {{ customerTelepon || '-' }}</p>
          </div>

          <div class="border border-slate-200 rounded-lg p-3">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Referensi Pesanan:
            </p>
            <p class="font-semibold text-slate-800">
              No. Sales Order: <span class="font-mono">{{ soKode || '-' }}</span>
            </p>
            <p class="text-slate-600 mt-0.5">
              Jenis Tagihan: <span class="font-bold text-teal-700">{{ invoice?.jenis }}</span>
            </p>
            <p v-if="invoice?.no_faktur_pajak" class="text-slate-600 font-mono mt-0.5">
              Faktur Pajak: {{ invoice.no_faktur_pajak }}
            </p>
          </div>
        </div>

        <!-- Invoice Amount Table -->
        <table class="w-full border-collapse border border-slate-300 text-left mb-6">
          <thead>
            <tr
              class="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px]"
            >
              <th class="p-2.5 border-r border-slate-300 w-12 text-center">No</th>
              <th class="p-2.5 border-r border-slate-300">Deskripsi / Uraian Tagihan</th>
              <th class="p-2.5 border-r border-slate-300 text-right w-36">DPP</th>
              <th class="p-2.5 border-r border-slate-300 text-right w-28">PPN</th>
              <th class="p-2.5 text-right w-36">Jumlah (Rp)</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-slate-200">
              <td class="p-2.5 border-r border-slate-200 text-center font-mono">1</td>
              <td class="p-2.5 border-r border-slate-200">
                <span class="font-bold text-slate-900"
                  >Pembayaran Tagihan {{ invoice?.jenis }}</span
                >
                <p v-if="invoice?.keterangan" class="text-slate-500 text-[11px] mt-0.5">
                  {{ invoice.keterangan }}
                </p>
                <p class="text-slate-400 text-[10px] mt-0.5">
                  Sesuai konfirmasi Sales Order {{ soKode }}
                </p>
              </td>
              <td class="p-2.5 border-r border-slate-200 text-right font-mono">
                {{ formatCurrency(invoice?.subtotal || 0) }}
              </td>
              <td class="p-2.5 border-r border-slate-200 text-right font-mono">
                {{ formatCurrency(invoice?.total_ppn || 0) }}
              </td>
              <td class="p-2.5 text-right font-mono font-bold text-slate-900">
                {{ formatCurrency(invoice?.total || 0) }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="border-t-2 border-slate-800 bg-slate-50 font-bold">
              <td colspan="4" class="p-2.5 text-right uppercase text-[11px]">
                Total Tagihan Invoice:
              </td>
              <td class="p-2.5 text-right font-mono text-teal-800 text-sm">
                {{ formatCurrency(invoice?.total || 0) }}
              </td>
            </tr>
          </tfoot>
        </table>

        <!-- Signatures -->
        <div class="grid grid-cols-3 gap-4 text-center pt-6 mt-6 border-t border-slate-200">
          <div>
            <p class="text-[11px] text-slate-500 mb-16">Penerima / Customer</p>
            <div class="border-t border-slate-400 mx-6 pt-1 font-semibold text-slate-800">
              ( .................................. )
            </div>
          </div>
          <div>
            <p class="text-[11px] text-slate-500 mb-16">Bagian Keuangan</p>
            <div class="border-t border-slate-400 mx-6 pt-1 font-semibold text-slate-800">
              ( .................................. )
            </div>
          </div>
          <div>
            <p class="text-[11px] text-slate-500 mb-16">Hormat Kami</p>
            <div class="border-t border-slate-400 mx-6 pt-1 font-semibold text-slate-800">
              ( {{ variantCfg.companyLetterhead.title }} )
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between">
        <AppButton variant="primary" size="sm" @click="handlePrint">
          <template #iconLeft>
            <Printer class="w-4 h-4" />
          </template>
          Cetak Faktur Sekarang
        </AppButton>
        <AppButton variant="outline" size="sm" @click="emit('update:isOpen', false)">
          Tutup
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>

<style scoped>
@media print {
  body * {
    visibility: hidden;
  }
  #printable-invoice,
  #printable-invoice * {
    visibility: visible;
  }
  #printable-invoice {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0;
    padding: 20px;
    box-shadow: none;
    border: none;
  }
}
</style>
