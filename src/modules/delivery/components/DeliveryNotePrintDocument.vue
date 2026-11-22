<script setup lang="ts">
import type { DeliveryNoteWithDetails } from '../types/delivery-note.types'
import { getVariantConfig } from '@/modules/sales/config/sales-order-variants'
import { formatDate } from '@/shared/utils/formatters'

const props = defineProps<{
  delivery: DeliveryNoteWithDetails
}>()

const cfg = getVariantConfig(props.delivery.so_variant || 'impact')
</script>

<template>
  <div
    class="delivery-note-print-document bg-white border border-slate-200 print:border-none rounded-xl print:rounded-none p-8 sm:p-10 print:p-0 shadow-sm print:shadow-none max-w-4xl mx-auto space-y-6 text-slate-800 font-sans"
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
          {{ delivery.status_ambil === 1 ? 'SURAT PENGAMBILAN SENDIRI' : 'SURAT JALAN' }}
        </h2>
        <div class="mt-2 space-y-1 text-xs">
          <div class="flex justify-end gap-2">
            <span class="text-slate-500">No. Dokumen:</span>
            <span class="font-mono font-bold text-slate-900">{{ delivery.kode }}</span>
          </div>
          <div class="flex justify-end gap-2">
            <span class="text-slate-500">No. Sales Order:</span>
            <span class="font-mono font-semibold text-slate-800">{{ delivery.so_kode }}</span>
          </div>
          <div class="flex justify-end gap-2">
            <span class="text-slate-500">Tanggal:</span>
            <span class="text-slate-900 font-medium">{{ formatDate(delivery.tanggal) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Customer & Destination Info -->
    <div
      class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs p-4 bg-slate-50 print:bg-transparent border border-slate-200 print:border-slate-300 rounded-lg"
    >
      <div class="space-y-1.5">
        <p class="text-slate-500 font-medium uppercase text-[10px] tracking-wider">
          {{
            delivery.status_ambil === 1
              ? 'Diambil Oleh / Customer:'
              : 'Alamat Pengiriman (Kepada Yth):'
          }}
        </p>
        <p class="text-sm font-bold text-slate-900">{{ delivery.customer_nama }}</p>
        <p v-if="delivery.customer_alamat" class="text-slate-600 leading-relaxed">
          {{ delivery.customer_alamat }}
        </p>
        <p v-if="delivery.customer_no_hp" class="text-slate-600 font-mono">
          No. Kontak: {{ delivery.customer_no_hp }}
        </p>
      </div>

      <div class="space-y-1.5 sm:text-right">
        <div class="flex sm:justify-end gap-2">
          <span class="text-slate-500">
            {{ delivery.status_ambil === 1 ? 'Nama Pengambil:' : 'Pengemudi / Ekspedisi:' }}
          </span>
          <span class="font-semibold text-slate-800">{{ delivery.nama_pengirim || '-' }}</span>
        </div>
        <div class="flex sm:justify-end gap-2">
          <span class="text-slate-500">Salesman:</span>
          <span class="font-medium text-slate-800">{{ delivery.sales_nama }}</span>
        </div>
        <div v-if="delivery.keterangan" class="flex sm:justify-end gap-2">
          <span class="text-slate-500">Instruksi Khusus:</span>
          <span class="text-slate-700 italic">{{ delivery.keterangan }}</span>
        </div>
      </div>
    </div>

    <!-- Items Table (NO PRICES - STRICT LOGISTICS) -->
    <div class="border border-slate-300 rounded-lg overflow-hidden">
      <table class="w-full text-left text-xs border-collapse">
        <thead
          class="bg-slate-100 print:bg-slate-200 border-b border-slate-300 text-slate-700 uppercase font-bold text-[10px] tracking-wider"
        >
          <tr>
            <th class="py-2.5 px-3 w-12 text-center border-r border-slate-300">No.</th>
            <th class="py-2.5 px-3 w-32 border-r border-slate-300">Kode Barang</th>
            <th class="py-2.5 px-3 border-r border-slate-300">Nama Barang & Spesifikasi</th>
            <th class="py-2.5 px-3 w-20 text-center border-r border-slate-300">Satuan</th>
            <th class="py-2.5 px-3 w-24 text-center border-r border-slate-300 font-black">
              QTY Kirim
            </th>
            <th class="py-2.5 px-4 min-w-[140px]">Keterangan</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 bg-white">
          <tr v-for="(item, idx) in delivery.items" :key="item.id" class="hover:bg-slate-50">
            <td class="py-2 px-3 text-center font-mono text-slate-500 border-r border-slate-200">
              {{ idx + 1 }}
            </td>
            <td class="py-2 px-3 font-mono font-medium text-slate-700 border-r border-slate-200">
              {{ item.kode_produk || '-' }}
            </td>
            <td class="py-2 px-3 font-medium text-slate-900 border-r border-slate-200">
              {{ item.nama_produk }}
            </td>
            <td class="py-2 px-3 text-center text-slate-600 border-r border-slate-200">
              {{ item.satuan_nama || 'Unit' }}
            </td>
            <td
              class="py-2 px-3 text-center font-mono font-bold text-slate-900 border-r border-slate-200 text-sm"
            >
              {{ item.qty_kirim }}
            </td>
            <td class="py-2 px-4 text-slate-600 italic">
              {{ item.keterangan || '-' }}
            </td>
          </tr>
        </tbody>
        <tfoot class="bg-slate-50 border-t-2 border-slate-300 font-bold text-slate-900">
          <tr>
            <td
              colspan="4"
              class="py-2 px-3 text-right uppercase text-[10px] tracking-wider text-slate-600"
            >
              Total Barang Yang Dikirim:
            </td>
            <td class="py-2 px-3 text-center font-mono text-sm border-r border-slate-300">
              {{ delivery.qty_pengiriman }}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- 4-Column Signature Blocks -->
    <div class="grid grid-cols-4 gap-4 text-xs pt-4 border-t border-slate-300 text-center">
      <div class="space-y-12">
        <p class="text-slate-600 font-semibold uppercase text-[10px]">Tanda Terima / Penerima</p>
        <div class="border-t border-slate-400 pt-1 text-slate-800">
          <p class="font-medium">( ........................................ )</p>
          <p class="text-[9px] text-slate-500 mt-0.5">Cap Toko / Tanda Tangan</p>
        </div>
      </div>

      <div class="space-y-12">
        <p class="text-slate-600 font-semibold uppercase text-[10px]">
          {{ delivery.status_ambil === 1 ? 'Pengambil Barang' : 'Pengemudi / Ekspedisi' }}
        </p>
        <div class="border-t border-slate-400 pt-1 text-slate-800">
          <p class="font-medium">
            ( {{ delivery.nama_pengirim || '........................................' }} )
          </p>
          <p class="text-[9px] text-slate-500 mt-0.5">Nama Terang & Tanda Tangan</p>
        </div>
      </div>

      <div class="space-y-12">
        <p class="text-slate-600 font-semibold uppercase text-[10px]">Bagian Gudang</p>
        <div class="border-t border-slate-400 pt-1 text-slate-800">
          <p class="font-medium">( ........................................ )</p>
          <p class="text-[9px] text-slate-500 mt-0.5">Petugas Muat / Checker</p>
        </div>
      </div>

      <div class="space-y-12">
        <p class="text-slate-600 font-semibold uppercase text-[10px]">Hormat Kami</p>
        <div class="border-t border-slate-400 pt-1 text-slate-800">
          <p class="font-medium">( {{ delivery.sales_nama || 'Administrasi' }} )</p>
          <p class="text-[9px] text-slate-500 mt-0.5">Administrasi Penjualan</p>
        </div>
      </div>
    </div>

    <!-- Logistics Footnote Notice -->
    <div class="text-center text-[10px] text-slate-500 pt-4 border-t border-slate-200">
      <p class="font-medium">
        Perhatian: Mohon periksa kelengkapan fisik dan jumlah barang sebelum menandatangani Surat
        Jalan ini.
      </p>
      <p class="text-slate-400 mt-0.5">
        Klaim / komplain atas kerusakan atau kekurangan barang setelah surat jalan ditandatangani
        tanpa catatan tidak dapat kami proses.
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
  .delivery-note-print-document,
  .delivery-note-print-document * {
    visibility: visible;
  }
  .delivery-note-print-document {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0;
    padding: 0;
  }
}
</style>
