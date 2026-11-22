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
    class="sales-order-invoice-document bg-white border border-slate-200 print:border-none rounded-xl print:rounded-none p-8 sm:p-10 print:p-0 shadow-sm print:shadow-none max-w-4xl mx-auto space-y-6 text-slate-800 font-sans"
  >
    <!-- Header Letterhead & Title -->
    <div class="border-b-2 border-slate-900 pb-4 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900 uppercase">
          {{ cfg.companyLetterhead.title }}
        </h1>
        <p class="text-xs text-slate-600 mt-1 max-w-md leading-relaxed">
          {{ cfg.companyLetterhead.address }}
        </p>
        <p class="text-xs text-slate-600 font-mono mt-0.5">
          Telp: {{ cfg.companyLetterhead.phone }}
        </p>
      </div>

      <div class="text-right">
        <h2 class="text-2xl font-black tracking-widest text-slate-900 uppercase font-mono">
          FAKTUR
        </h2>
        <div class="mt-2 space-y-1 text-xs">
          <div class="flex justify-end gap-2">
            <span class="text-slate-500">No. Faktur:</span>
            <span class="font-mono font-bold text-slate-900">{{ order.kode }}</span>
          </div>
          <div v-if="cfg.hasTax && order.no_faktur_pajak" class="flex justify-end gap-2">
            <span class="text-slate-500">No. Seri Faktur Pajak:</span>
            <span class="font-mono text-slate-800">{{ order.no_faktur_pajak }}</span>
          </div>
          <div class="flex justify-end gap-2">
            <span class="text-slate-500">Tanggal:</span>
            <span class="text-slate-900 font-medium">{{ formatDate(order.tanggal) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Customer & Transaction Information -->
    <div
      class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs p-4 bg-slate-50 print:bg-transparent border border-slate-200 print:border-slate-300 rounded-lg"
    >
      <div class="space-y-1.5">
        <p class="text-slate-500 font-medium uppercase text-[10px] tracking-wider">Kepada Yth:</p>
        <p class="text-sm font-bold text-slate-900">{{ order.customer_nama }}</p>
        <p v-if="order.customer_alamat" class="text-slate-600 leading-relaxed">
          {{ order.customer_alamat }}
        </p>
      </div>

      <div class="space-y-1.5 sm:text-right">
        <div class="flex sm:justify-end gap-2">
          <span class="text-slate-500">Salesman:</span>
          <span class="font-semibold text-slate-800">{{ order.sales_nama }}</span>
        </div>
        <div class="flex sm:justify-end gap-2">
          <span class="text-slate-500">Tipe Pesanan:</span>
          <span class="font-mono font-medium text-slate-800">{{ cfg.shortLabel }}</span>
        </div>
        <div v-if="order.keterangan" class="flex sm:justify-end gap-2">
          <span class="text-slate-500">Catatan:</span>
          <span class="text-slate-700 italic">{{ order.keterangan }}</span>
        </div>
      </div>
    </div>

    <!-- Items Table (Matching Screenshot 4) -->
    <div class="border border-slate-300 rounded-lg overflow-hidden">
      <table class="w-full text-left text-xs border-collapse">
        <thead
          class="bg-slate-100 print:bg-slate-200 border-b border-slate-300 text-slate-800 font-bold uppercase text-[11px]"
        >
          <tr>
            <th class="py-2.5 px-3 w-12 text-center border-r border-slate-300">No.</th>
            <th class="py-2.5 px-3 w-24 text-center border-r border-slate-300">Banyaknya</th>
            <th class="py-2.5 px-3 border-r border-slate-300">Nama Barang</th>
            <th class="py-2.5 px-3 border-r border-slate-300">Keterangan</th>
            <th class="py-2.5 px-3 w-28 text-right border-r border-slate-300">Harga Satuan</th>
            <th class="py-2.5 px-3 w-16 text-center border-r border-slate-300">Disc</th>
            <th class="py-2.5 px-3 w-36 text-right">Jumlah</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 print:divide-slate-300 bg-white">
          <tr v-for="(item, idx) in order.items" :key="item.id">
            <td
              class="py-2 px-3 text-center font-mono text-slate-500 border-r border-slate-200 print:border-slate-300"
            >
              {{ idx + 1 }}
            </td>
            <td
              class="py-2 px-3 text-center font-mono font-semibold border-r border-slate-200 print:border-slate-300"
            >
              {{ formatNumber(item.qty) }} {{ item.satuan_nama || 'Pcs' }}
            </td>
            <td
              class="py-2 px-3 font-semibold text-slate-900 border-r border-slate-200 print:border-slate-300"
            >
              {{ item.nama_produk }}
            </td>
            <td class="py-2 px-3 text-slate-600 border-r border-slate-200 print:border-slate-300">
              {{ item.keterangan || '-' }}
            </td>
            <td
              class="py-2 px-3 text-right font-mono border-r border-slate-200 print:border-slate-300"
            >
              {{ formatCurrency(item.harga) }}
            </td>
            <td
              class="py-2 px-3 text-center border-r border-slate-200 print:border-slate-300 font-mono"
            >
              {{ item.diskon > 0 ? `${item.diskon}%` : '-' }}
            </td>
            <td class="py-2 px-3 text-right font-mono font-bold text-slate-900">
              {{ formatCurrency(item.subtotal) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Biaya Tambahan Table if exists -->
    <div v-if="order.biaya_tambahan && order.biaya_tambahan.length > 0" class="space-y-1.5">
      <p class="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
        Komponen Biaya Tambahan:
      </p>
      <div class="border border-slate-300 rounded-lg overflow-hidden">
        <table class="w-full text-left text-xs border-collapse">
          <thead class="bg-slate-50 border-b border-slate-300 text-slate-600 uppercase text-[10px]">
            <tr>
              <th class="py-1.5 px-3 w-12 text-center border-r border-slate-300">No.</th>
              <th class="py-1.5 px-3 border-r border-slate-300">Nama Komponen</th>
              <th class="py-1.5 px-3 w-40 text-right">Jumlah</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 bg-white">
            <tr v-for="(b, idx) in order.biaya_tambahan" :key="b.id">
              <td
                class="py-1.5 px-3 text-center font-mono text-slate-400 border-r border-slate-200"
              >
                {{ idx + 1 }}
              </td>
              <td class="py-1.5 px-3 font-medium text-slate-700 border-r border-slate-200">
                {{ b.komponen }}
              </td>
              <td class="py-1.5 px-3 text-right font-mono font-semibold text-slate-900">
                {{ formatCurrency(b.jumlah) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Summary & Signatures Section -->
    <div
      class="flex flex-col sm:flex-row items-start justify-between gap-6 pt-4 border-t-2 border-slate-800"
    >
      <!-- Signatures (3 Kolom: Penerima, Pengirim / Gudang, Hormat Kami) -->
      <div class="grid grid-cols-3 gap-6 text-center text-xs text-slate-700 flex-1 max-w-lg">
        <div>
          <p>Tanda Terima,</p>
          <div class="h-20" />
          <p class="font-medium border-t border-slate-400 pt-1">( {{ order.customer_nama }} )</p>
        </div>
        <div>
          <p>Bagian Gudang,</p>
          <div class="h-20" />
          <p class="font-medium border-t border-slate-400 pt-1">
            (
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            )
          </p>
        </div>
        <div>
          <p>Hormat Kami,</p>
          <div class="h-20" />
          <p class="font-medium border-t border-slate-400 pt-1">( {{ order.sales_nama }} )</p>
        </div>
      </div>

      <!-- Financial Calculation Summary -->
      <div class="w-full sm:w-80 space-y-2 text-xs">
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

        <div
          v-if="order.biaya_tambahan && order.biaya_tambahan.length > 0"
          class="flex items-center justify-between text-slate-600"
        >
          <span>Total Biaya Tambahan</span>
          <span class="font-mono font-medium">
            {{ formatCurrency(order.biaya_tambahan.reduce((sum, b) => sum + b.jumlah, 0)) }}
          </span>
        </div>

        <div v-if="cfg.hasTax" class="flex items-center justify-between text-slate-600">
          <span>PPN ({{ order.ppn_persen || 11 }}%)</span>
          <span class="font-mono font-medium">{{ formatCurrency(order.total_ppn) }}</span>
        </div>

        <div
          class="flex items-center justify-between text-sm font-bold text-slate-900 pt-2 border-t-2 border-slate-900"
        >
          <span class="uppercase tracking-wider">NET / TOTAL</span>
          <span class="font-mono text-lg font-black text-slate-900">
            {{ formatCurrency(order.total) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Print Footer Notice -->
    <div class="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-200">
      <p>
        Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan kecuali ada perjanjian
        tertulis sebelumnya.
      </p>
    </div>
  </div>
</template>

<style>
@media print {
  @page {
    size: A4 portrait;
    margin: 10mm;
  }
  body * {
    visibility: hidden;
  }
  .sales-order-invoice-document,
  .sales-order-invoice-document * {
    visibility: visible;
  }
  .sales-order-invoice-document {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0;
    padding: 0;
  }
}
</style>
