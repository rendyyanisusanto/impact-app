<script setup lang="ts">
import type { SalesOrderWithDetails } from '../types/sales-order.types'
import { getVariantConfig } from '../config/sales-order-variants'
import { formatCurrency, formatDate, formatNumber } from '@/shared/utils/formatters'

const props = defineProps<{
  order: SalesOrderWithDetails
}>()

const cfg = getVariantConfig(props.order.variant)
</script>

<template>
  <div
    class="sales-order-nota-document bg-white border border-slate-200 rounded-xl p-8 sm:p-10 shadow-sm max-w-5xl mx-auto space-y-6 text-slate-800 font-sans"
  >
    <!-- Document Title & Letterhead -->
    <div class="border-b-2 border-slate-800 pb-4 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold tracking-tight text-slate-900 uppercase">
          {{ cfg.companyLetterhead.title }}
        </h1>
        <p class="text-xs text-slate-500 mt-0.5">
          {{ cfg.companyLetterhead.address }}
        </p>
        <p class="text-xs text-slate-500">No. Telp / HP: {{ cfg.companyLetterhead.phone }}</p>
      </div>

      <div class="text-right">
        <h2 class="text-lg font-bold tracking-wider text-slate-800 uppercase font-mono">
          NOTA PENJUALAN
        </h2>
        <span
          class="inline-block mt-1 px-2.5 py-0.5 text-[11px] font-semibold rounded font-mono"
          :class="
            order.status === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          "
        >
          {{ order.status === 1 ? 'STATUS: SUCCEEDED' : 'STATUS: DRAFT' }}
        </span>
      </div>
    </div>

    <!-- Metadata Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-xs">
      <div class="space-y-1.5">
        <div class="flex items-center">
          <span class="w-36 text-slate-500">No. Sales Order</span>
          <span class="font-mono font-bold text-slate-800">: {{ order.kode }}</span>
        </div>
        <div v-if="cfg.hasTax && order.no_faktur_pajak" class="flex items-center">
          <span class="w-36 text-slate-500">No. Faktur Pajak</span>
          <span class="font-mono text-slate-700">: {{ order.no_faktur_pajak }}</span>
        </div>
        <div class="flex items-center">
          <span class="w-36 text-slate-500">Tanggal Transaksi</span>
          <span class="text-slate-800">: {{ formatDate(order.tanggal) }}</span>
        </div>
      </div>

      <div class="space-y-1.5">
        <div class="flex items-center">
          <span class="w-32 text-slate-500">Customer</span>
          <span class="font-semibold text-slate-800">: {{ order.customer_nama }}</span>
        </div>
        <div v-if="order.customer_alamat" class="flex items-start">
          <span class="w-32 text-slate-500">Alamat</span>
          <span class="text-slate-600">: {{ order.customer_alamat }}</span>
        </div>
        <div class="flex items-center">
          <span class="w-32 text-slate-500">Salesman</span>
          <span class="text-slate-800">: {{ order.sales_nama }}</span>
        </div>
      </div>
    </div>

    <!-- Items Table (Matching Screenshot 3) -->
    <div class="border border-slate-300 rounded-lg overflow-hidden">
      <table class="w-full text-left text-xs border-collapse">
        <thead
          class="bg-slate-100 border-b border-slate-300 text-slate-700 font-semibold uppercase text-[11px]"
        >
          <tr>
            <th class="py-2.5 px-3 w-16 text-center border-r border-slate-200">Jumlah</th>
            <th class="py-2.5 px-3 w-28 border-r border-slate-200">Kode</th>
            <th class="py-2.5 px-3 border-r border-slate-200">Nama Barang</th>
            <th class="py-2.5 px-3 border-r border-slate-200">Keterangan</th>
            <th class="py-2.5 px-3 w-32 text-right border-r border-slate-200">Harga</th>
            <th class="py-2.5 px-3 w-20 text-center border-r border-slate-200">Diskon</th>
            <th class="py-2.5 px-3 w-36 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 bg-white">
          <tr v-for="item in order.items" :key="item.id">
            <td class="py-2 px-3 text-center font-mono font-medium border-r border-slate-200">
              {{ formatNumber(item.qty) }} {{ item.satuan_nama || 'Pcs' }}
            </td>
            <td class="py-2 px-3 font-mono text-slate-600 border-r border-slate-200">
              {{ item.kode_produk || '-' }}
            </td>
            <td class="py-2 px-3 font-medium text-slate-800 border-r border-slate-200">
              {{ item.nama_produk }}
            </td>
            <td class="py-2 px-3 text-slate-500 border-r border-slate-200">
              {{ item.keterangan || '-' }}
            </td>
            <td class="py-2 px-3 text-right font-mono border-r border-slate-200">
              {{ formatCurrency(item.harga) }}
            </td>
            <td class="py-2 px-3 text-center border-r border-slate-200 font-mono">
              {{ item.diskon > 0 ? `${item.diskon}%` : '-' }}
            </td>
            <td class="py-2 px-3 text-right font-mono font-semibold text-slate-800">
              {{ formatCurrency(item.subtotal) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Biaya Tambahan Section (Matching Screenshot 3) -->
    <div class="space-y-2">
      <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Biaya Tambahan</h3>
      <div class="border border-slate-300 rounded-lg overflow-hidden">
        <table class="w-full text-left text-xs border-collapse">
          <thead class="bg-slate-50 border-b border-slate-300 text-slate-600 uppercase text-[11px]">
            <tr>
              <th class="py-2 px-3 w-12 text-center border-r border-slate-200">No.</th>
              <th class="py-2 px-3 border-r border-slate-200">Nama Komponen</th>
              <th class="py-2 px-3 w-48 text-right">Jumlah</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 bg-white">
            <tr v-if="order.biaya_tambahan.length === 0">
              <td colspan="3" class="py-4 text-center text-slate-400 italic">
                Tidak ada komponen biaya tambahan.
              </td>
            </tr>
            <tr v-for="(b, idx) in order.biaya_tambahan" :key="b.id">
              <td class="py-2 px-3 text-center font-mono text-slate-400 border-r border-slate-200">
                {{ idx + 1 }}
              </td>
              <td class="py-2 px-3 font-medium text-slate-700 border-r border-slate-200">
                {{ b.komponen }}
              </td>
              <td class="py-2 px-3 text-right font-mono font-semibold text-slate-800">
                {{ formatCurrency(b.jumlah) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Totals Summary & Signatures -->
    <div
      class="flex flex-col sm:flex-row items-start justify-between gap-6 pt-4 border-t border-slate-200"
    >
      <!-- Signature Blocks -->
      <div class="grid grid-cols-2 gap-8 text-center text-xs text-slate-600 min-w-[280px]">
        <div>
          <p>Tanda Terima Customer,</p>
          <div class="h-16" />
          <p class="font-medium border-t border-slate-300 pt-1">( {{ order.customer_nama }} )</p>
        </div>
        <div>
          <p>Hormat Kami,</p>
          <div class="h-16" />
          <p class="font-medium border-t border-slate-300 pt-1">( {{ order.sales_nama }} )</p>
        </div>
      </div>

      <!-- Financial Totals -->
      <div class="w-full sm:w-72 space-y-2 text-xs">
        <div class="flex items-center justify-between text-slate-600">
          <span>Subtotal Item</span>
          <span class="font-mono font-medium">{{ formatCurrency(order.subtotal) }}</span>
        </div>

        <div v-if="order.diskon && order.diskon > 0" class="flex items-center justify-between text-slate-600">
          <span>Diskon</span>
          <span class="font-mono font-medium text-amber-700">-{{ formatCurrency(order.diskon) }}</span>
        </div>

        <div v-if="cfg.hasTax" class="flex items-center justify-between text-slate-700 font-semibold pt-1 border-t border-slate-200">
          <span>Total Sebelum PPN</span>
          <span class="font-mono">{{ formatCurrency(Math.max(0, order.subtotal - (order.diskon || 0))) }}</span>
        </div>

        <div v-if="cfg.hasTax" class="flex items-center justify-between text-slate-600">
          <span>PPN</span>
          <span class="font-mono font-medium">{{ formatCurrency(order.total_ppn) }}</span>
        </div>

        <div
          class="flex items-center justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-300"
        >
          <span>TOTAL</span>
          <span class="font-mono text-base text-teal-700 font-bold">
            {{ formatCurrency(order.total) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
