<script setup lang="ts">
import type { ProductionWithItems } from '../types/production.types'
import { formatNumber } from '@/shared/utils/formatters'

defineProps<{
  production: ProductionWithItems
}>()
</script>

<template>
  <div
    class="print-only-container hidden print:block bg-white text-slate-900 p-8 max-w-[210mm] mx-auto text-xs font-sans"
  >
    <!-- Header -->
    <div class="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-5">
      <div>
        <h1 class="text-xl font-bold uppercase tracking-tight text-slate-900">IMPACT FURNITURE</h1>
        <p class="text-[11px] text-slate-600 mt-0.5">
          Jl. Pogot No.72, Tanah Kali Kedinding, Kec. Kenjeran, Surabaya, Jawa Timur 60129
        </p>
        <p class="text-[11px] text-slate-600">No. Telp/HP: 081334791464</p>
      </div>
      <div class="text-right">
        <h2 class="text-lg font-bold text-slate-900 uppercase tracking-wide">
          SURAT PERINTAH KERJA (SPK)
        </h2>
        <p class="font-mono font-semibold text-sm mt-0.5">{{ production.kode }}</p>
        <p class="text-[11px] text-slate-500">Tanggal: {{ production.tanggal }}</p>
      </div>
    </div>

    <!-- Metadata Grid -->
    <div class="grid grid-cols-2 gap-4 mb-5 p-3 bg-slate-50 border border-slate-200 rounded">
      <div class="space-y-1">
        <div class="flex">
          <span class="w-32 text-slate-500 font-medium">Jenis Produksi</span>
          <span class="font-semibold text-slate-800">
            : {{ production.jenis_produksi === 1 ? 'Pesanan' : 'Non Pesanan / Stok' }}
          </span>
        </div>
        <div class="flex">
          <span class="w-32 text-slate-500 font-medium">Status Produksi</span>
          <span class="font-semibold text-slate-800">
            :
            {{
              production.status_produksi === 2
                ? 'Selesai'
                : production.status_produksi === 1
                  ? 'Proses'
                  : 'Pending'
            }}
          </span>
        </div>
        <div class="flex">
          <span class="w-32 text-slate-500 font-medium">Status Dokumen</span>
          <span class="font-semibold text-slate-800">
            : {{ production.is_posted ? 'Posted (Tercatat di Stok)' : 'Draft' }}
          </span>
        </div>
      </div>

      <div class="space-y-1">
        <div class="flex">
          <span class="w-32 text-slate-500 font-medium">Jumlah Produk</span>
          <span class="font-semibold text-slate-800"
            >: {{ production.jumlah_jenis_produk }} jenis</span
          >
        </div>
        <div class="flex">
          <span class="w-32 text-slate-500 font-medium">Total Target Qty</span>
          <span class="font-semibold text-slate-800"
            >: {{ formatNumber(production.total_qty) }} Unit</span
          >
        </div>
        <div class="flex">
          <span class="w-32 text-slate-500 font-medium">Keterangan</span>
          <span class="text-slate-800">: {{ production.keterangan || '-' }}</span>
        </div>
      </div>
    </div>

    <!-- Products Table -->
    <div class="mb-6">
      <h3 class="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2">
        Daftar Produk yang Diproduksi
      </h3>
      <table class="w-full border-collapse border border-slate-300 text-left">
        <thead>
          <tr class="bg-slate-100 text-slate-800 font-bold uppercase text-[10px]">
            <th class="border border-slate-300 p-2 text-center w-10">No</th>
            <th class="border border-slate-300 p-2 w-28">Kode</th>
            <th class="border border-slate-300 p-2">Nama Produk Furniture</th>
            <th class="border border-slate-300 p-2 text-right w-24">Qty Target</th>
            <th class="border border-slate-300 p-2 text-center w-20">Satuan</th>
            <th class="border border-slate-300 p-2">Keterangan Spesifikasi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in production.items" :key="item.rowId || idx">
            <td class="border border-slate-300 p-2 text-center text-slate-500 font-mono">
              {{ idx + 1 }}
            </td>
            <td class="border border-slate-300 p-2 font-mono font-medium">
              {{ item.kode_produk }}
            </td>
            <td class="border border-slate-300 p-2 font-semibold">{{ item.nama_produk }}</td>
            <td class="border border-slate-300 p-2 text-right font-mono font-bold">
              {{ formatNumber(item.qty) }}
            </td>
            <td class="border border-slate-300 p-2 text-center">{{ item.satuan_nama || 'Pcs' }}</td>
            <td class="border border-slate-300 p-2 text-slate-600">{{ item.keterangan || '-' }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="bg-slate-50 font-bold">
            <td colspan="3" class="border border-slate-300 p-2 text-right">TOTAL KUANTITAS:</td>
            <td class="border border-slate-300 p-2 text-right font-mono text-sm">
              {{ formatNumber(production.total_qty) }}
            </td>
            <td colspan="2" class="border border-slate-300 p-2">Unit</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Materials Consumption Breakdown if available -->
    <div
      v-if="production.material_requirements && production.material_requirements.length > 0"
      class="mb-8"
    >
      <h3 class="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2">
        Kebutuhan Bahan Baku Berdasarkan BoM
      </h3>
      <table class="w-full border-collapse border border-slate-300 text-left text-[11px]">
        <thead>
          <tr class="bg-slate-100 text-slate-800 font-bold uppercase text-[10px]">
            <th class="border border-slate-300 p-1.5 text-center w-8">No</th>
            <th class="border border-slate-300 p-1.5 w-24">Kode</th>
            <th class="border border-slate-300 p-1.5">Nama Bahan</th>
            <th class="border border-slate-300 p-1.5 text-center w-16">Satuan</th>
            <th class="border border-slate-300 p-1.5 text-right w-24">Kebutuhan</th>
            <th class="border border-slate-300 p-1.5 text-center w-20">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(m, idx) in production.material_requirements" :key="m.bahan_id">
            <td class="border border-slate-300 p-1.5 text-center text-slate-500 font-mono">
              {{ idx + 1 }}
            </td>
            <td class="border border-slate-300 p-1.5 font-mono">{{ m.kode_bahan }}</td>
            <td class="border border-slate-300 p-1.5">{{ m.nama_bahan }}</td>
            <td class="border border-slate-300 p-1.5 text-center">{{ m.satuan_nama }}</td>
            <td class="border border-slate-300 p-1.5 text-right font-mono font-medium">
              {{ formatNumber(m.total_kebutuhan) }}
            </td>
            <td
              class="border border-slate-300 p-1.5 text-center font-semibold"
              :class="m.status === 'CUKUP' ? 'text-emerald-700' : 'text-amber-700'"
            >
              {{ m.status }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Signatures -->
    <div class="grid grid-cols-3 gap-6 text-center mt-12 mb-6">
      <div>
        <p class="text-slate-600 mb-14">Dibuat oleh,</p>
        <p
          class="font-semibold text-slate-900 border-t border-slate-400 pt-1.5 inline-block min-w-[140px]"
        >
          ( Bag. PPIC )
        </p>
      </div>
      <div>
        <p class="text-slate-600 mb-14">Diperiksa oleh,</p>
        <p
          class="font-semibold text-slate-900 border-t border-slate-400 pt-1.5 inline-block min-w-[140px]"
        >
          ( Kepala Produksi )
        </p>
      </div>
      <div>
        <p class="text-slate-600 mb-14">Disetujui oleh,</p>
        <p
          class="font-semibold text-slate-900 border-t border-slate-400 pt-1.5 inline-block min-w-[140px]"
        >
          ( Factory Manager )
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div class="text-center text-[10px] text-slate-400 border-t border-slate-200 pt-3">
      <p>** DOKUMEN INTERNAL PRODUKSI PT IMPACT FURNITURE SURABAYA **</p>
    </div>
  </div>
</template>

<style>
@media print {
  body * {
    visibility: hidden;
  }
  .print-only-container,
  .print-only-container * {
    visibility: visible;
  }
  .print-only-container {
    display: block !important;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0;
    padding: 15mm;
  }
}
</style>
