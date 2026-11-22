<script setup lang="ts">
import { Printer, X } from 'lucide-vue-next'
import { formatCurrency } from '@/shared/utils/formatters'
import { formatDateIndo, getReportTypeLabel } from '../utils/sales-report-export'
import type {
  SalesReportType,
  SalesReportSummaryTotals
} from '../types/sales-report.types'

defineProps<{
  show: boolean
  reportType: SalesReportType
  items: any[]
  summaryTotals?: SalesReportSummaryTotals
  filterInfo?: string
  printDate?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

function triggerPrint() {
  window.print()
}
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:p-0 print:bg-white print:static"
  >
    <div
      class="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden print:max-h-none print:shadow-none print:border-none print:w-full"
    >
      <!-- Modal Toolbar (Hidden during print) -->
      <div
        class="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50 print:hidden"
      >
        <div class="flex items-center gap-2">
          <Printer class="w-4 h-4 text-teal-600" />
          <h3 class="text-sm font-bold text-slate-800">
            Print Preview — {{ getReportTypeLabel(reportType) }}
          </h3>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition"
            @click="triggerPrint"
          >
            <Printer class="w-3.5 h-3.5" />
            Cetak Sekarang
          </button>
          <button
            type="button"
            class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition"
            @click="emit('close')"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Printable Area -->
      <div class="p-8 overflow-y-auto flex-1 text-slate-800 print:p-0">
        <!-- Company Identity & Title -->
        <div class="border-b-2 border-teal-600 pb-3 mb-4">
          <div class="flex items-start justify-between">
            <div>
              <h1 class="text-lg font-black text-teal-700 tracking-tight">
                IMPACT FURNITURE
              </h1>
              <p class="text-[10px] text-slate-500 uppercase tracking-widest font-medium">
                Enterprise Management Information System
              </p>
            </div>
            <div class="text-right text-[10px] text-slate-400">
              <div>Dicetak: {{ printDate || new Date().toLocaleDateString('id-ID') }}</div>
              <div>ERP V2 Reporting Module</div>
            </div>
          </div>

          <div class="mt-3">
            <h2 class="text-sm font-bold text-slate-900 uppercase">
              LAPORAN {{ getReportTypeLabel(reportType).toUpperCase() }}
            </h2>
            <p v-if="filterInfo" class="text-xs text-slate-500 mt-0.5">
              Filter: {{ filterInfo }}
            </p>
          </div>
        </div>

        <!-- Table Content -->
        <table class="w-full text-left text-[11px] border-collapse border border-slate-300">
          <!-- Summary Table -->
          <template v-if="reportType === 'summary'">
            <thead>
              <tr class="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <th class="p-2 border border-slate-300 w-8 text-center">No</th>
                <th class="p-2 border border-slate-300">Tanggal SO</th>
                <th class="p-2 border border-slate-300">Nomor SO</th>
                <th class="p-2 border border-slate-300">Customer</th>
                <th class="p-2 border border-slate-300 text-right">Item</th>
                <th class="p-2 border border-slate-300 text-right">Total Qty</th>
                <th class="p-2 border border-slate-300 text-right">Subtotal</th>
                <th class="p-2 border border-slate-300 text-right">PPN</th>
                <th class="p-2 border border-slate-300 text-right">Total SO</th>
                <th class="p-2 border border-slate-300 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(it, idx) in items" :key="it.id" class="border-b border-slate-200">
                <td class="p-2 border border-slate-300 text-center">{{ idx + 1 }}</td>
                <td class="p-2 border border-slate-300">{{ formatDateIndo(it.tanggal) }}</td>
                <td class="p-2 border border-slate-300 font-semibold text-slate-900">{{ it.kode || '-' }}</td>
                <td class="p-2 border border-slate-300">{{ it.customer_name || '-' }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ it.item_count }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ it.total_qty }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ formatCurrency(it.subtotal) }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ formatCurrency(it.total_ppn) }}</td>
                <td class="p-2 border border-slate-300 text-right font-bold">{{ formatCurrency(it.total) }}</td>
                <td class="p-2 border border-slate-300 text-center">{{ it.status === 1 ? 'Disetujui' : (it.status_aktif === 0 ? 'Dibatalkan' : 'Draft') }}</td>
              </tr>
            </tbody>
            <tfoot v-if="summaryTotals" class="bg-slate-100 font-bold border-t-2 border-slate-400">
              <tr>
                <td colspan="4" class="p-2 border border-slate-300 text-center">TOTAL KESELURUHAN ({{ summaryTotals.total_rows }} SO)</td>
                <td class="p-2 border border-slate-300 text-right">-</td>
                <td class="p-2 border border-slate-300 text-right">{{ summaryTotals.total_qty || 0 }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ formatCurrency(summaryTotals.total_subtotal || 0) }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ formatCurrency(summaryTotals.total_ppn || 0) }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ formatCurrency(summaryTotals.total_amount || 0) }}</td>
                <td class="p-2 border border-slate-300"></td>
              </tr>
            </tfoot>
          </template>

          <!-- Detail Table -->
          <template v-else-if="reportType === 'detail'">
            <thead>
              <tr class="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <th class="p-2 border border-slate-300 w-8 text-center">No</th>
                <th class="p-2 border border-slate-300">Tanggal</th>
                <th class="p-2 border border-slate-300">Nomor SO</th>
                <th class="p-2 border border-slate-300">Customer</th>
                <th class="p-2 border border-slate-300">Nama Produk</th>
                <th class="p-2 border border-slate-300 text-center">Satuan</th>
                <th class="p-2 border border-slate-300 text-right">Qty</th>
                <th class="p-2 border border-slate-300 text-right">Harga Satuan</th>
                <th class="p-2 border border-slate-300 text-right">Subtotal</th>
                <th class="p-2 border border-slate-300 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(it, idx) in items" :key="it.detail_id" class="border-b border-slate-200">
                <td class="p-2 border border-slate-300 text-center">{{ idx + 1 }}</td>
                <td class="p-2 border border-slate-300">{{ formatDateIndo(it.tanggal) }}</td>
                <td class="p-2 border border-slate-300">{{ it.kode_so || '-' }}</td>
                <td class="p-2 border border-slate-300">{{ it.customer_name || '-' }}</td>
                <td class="p-2 border border-slate-300 font-medium">{{ it.nama_produk || '-' }}</td>
                <td class="p-2 border border-slate-300 text-center">{{ it.satuan || '-' }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ it.qty }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ formatCurrency(it.harga) }}</td>
                <td class="p-2 border border-slate-300 text-right font-bold">{{ formatCurrency(it.subtotal) }}</td>
                <td class="p-2 border border-slate-300 text-center">{{ it.status_so === 1 ? 'Disetujui' : 'Draft' }}</td>
              </tr>
            </tbody>
            <tfoot v-if="summaryTotals" class="bg-slate-100 font-bold border-t-2 border-slate-400">
              <tr>
                <td colspan="6" class="p-2 border border-slate-300 text-center">TOTAL KESELURUHAN ({{ summaryTotals.total_rows }} Baris)</td>
                <td class="p-2 border border-slate-300 text-right">{{ summaryTotals.total_qty || 0 }}</td>
                <td class="p-2 border border-slate-300"></td>
                <td class="p-2 border border-slate-300 text-right">{{ formatCurrency(summaryTotals.total_subtotal || 0) }}</td>
                <td class="p-2 border border-slate-300"></td>
              </tr>
            </tfoot>
          </template>

          <!-- Customer Table -->
          <template v-else-if="reportType === 'customer'">
            <thead>
              <tr class="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <th class="p-2 border border-slate-300 w-8 text-center">No</th>
                <th class="p-2 border border-slate-300">Kode</th>
                <th class="p-2 border border-slate-300">Nama Customer</th>
                <th class="p-2 border border-slate-300 text-right">Jumlah SO</th>
                <th class="p-2 border border-slate-300 text-right">Total Qty</th>
                <th class="p-2 border border-slate-300 text-right">Subtotal</th>
                <th class="p-2 border border-slate-300 text-right">PPN</th>
                <th class="p-2 border border-slate-300 text-right">Total Nilai SO</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(it, idx) in items" :key="it.customer_id" class="border-b border-slate-200">
                <td class="p-2 border border-slate-300 text-center">{{ idx + 1 }}</td>
                <td class="p-2 border border-slate-300 font-mono text-[10px]">{{ it.kode_customer || '-' }}</td>
                <td class="p-2 border border-slate-300 font-medium">{{ it.nama_customer || '-' }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ it.jumlah_so }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ it.total_qty }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ formatCurrency(it.subtotal_pesanan) }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ formatCurrency(it.total_ppn) }}</td>
                <td class="p-2 border border-slate-300 text-right font-bold">{{ formatCurrency(it.total_nilai_so) }}</td>
              </tr>
            </tbody>
            <tfoot v-if="summaryTotals" class="bg-slate-100 font-bold border-t-2 border-slate-400">
              <tr>
                <td colspan="3" class="p-2 border border-slate-300 text-center">TOTAL KESELURUHAN ({{ summaryTotals.total_rows }} Customer)</td>
                <td colspan="2" class="p-2 border border-slate-300"></td>
                <td class="p-2 border border-slate-300 text-right">{{ formatCurrency(summaryTotals.total_subtotal || 0) }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ formatCurrency(summaryTotals.total_ppn || 0) }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ formatCurrency(summaryTotals.total_amount || 0) }}</td>
              </tr>
            </tfoot>
          </template>

          <!-- Product Table -->
          <template v-else-if="reportType === 'product'">
            <thead>
              <tr class="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <th class="p-2 border border-slate-300 w-8 text-center">No</th>
                <th class="p-2 border border-slate-300">Kode</th>
                <th class="p-2 border border-slate-300">Nama Produk</th>
                <th class="p-2 border border-slate-300 text-center">Satuan</th>
                <th class="p-2 border border-slate-300 text-right">Jumlah SO</th>
                <th class="p-2 border border-slate-300 text-right">Total Qty</th>
                <th class="p-2 border border-slate-300 text-right">Total Nilai</th>
                <th class="p-2 border border-slate-300 text-right">Harga Rata2</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(it, idx) in items" :key="it.produk_id" class="border-b border-slate-200">
                <td class="p-2 border border-slate-300 text-center">{{ idx + 1 }}</td>
                <td class="p-2 border border-slate-300 font-mono text-[10px]">{{ it.kode_produk || '-' }}</td>
                <td class="p-2 border border-slate-300 font-medium">{{ it.nama_produk || '-' }}</td>
                <td class="p-2 border border-slate-300 text-center">{{ it.satuan || '-' }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ it.jumlah_so }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ it.total_qty_dipesan }}</td>
                <td class="p-2 border border-slate-300 text-right font-bold">{{ formatCurrency(it.total_nilai_penjualan) }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ formatCurrency(it.harga_rata_rata) }}</td>
              </tr>
            </tbody>
            <tfoot v-if="summaryTotals" class="bg-slate-100 font-bold border-t-2 border-slate-400">
              <tr>
                <td colspan="5" class="p-2 border border-slate-300 text-center">TOTAL KESELURUHAN ({{ summaryTotals.total_rows }} Produk)</td>
                <td class="p-2 border border-slate-300 text-right">{{ summaryTotals.total_qty || 0 }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ formatCurrency(summaryTotals.total_amount || 0) }}</td>
                <td class="p-2 border border-slate-300"></td>
              </tr>
            </tfoot>
          </template>

          <!-- Status Table -->
          <template v-else-if="reportType === 'status'">
            <thead>
              <tr class="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <th class="p-2 border border-slate-300 w-8 text-center">No</th>
                <th class="p-2 border border-slate-300">Nomor SO</th>
                <th class="p-2 border border-slate-300">Tanggal</th>
                <th class="p-2 border border-slate-300">Customer</th>
                <th class="p-2 border border-slate-300 text-right">Total SO</th>
                <th class="p-2 border border-slate-300 text-center">Status SO</th>
                <th class="p-2 border border-slate-300 text-center">Produksi</th>
                <th class="p-2 border border-slate-300 text-center">Pengiriman</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(it, idx) in items" :key="it.id" class="border-b border-slate-200">
                <td class="p-2 border border-slate-300 text-center">{{ idx + 1 }}</td>
                <td class="p-2 border border-slate-300 font-medium">{{ it.nomor_so || '-' }}</td>
                <td class="p-2 border border-slate-300">{{ formatDateIndo(it.tanggal) }}</td>
                <td class="p-2 border border-slate-300">{{ it.customer_name || '-' }}</td>
                <td class="p-2 border border-slate-300 text-right font-bold">{{ formatCurrency(it.total_so) }}</td>
                <td class="p-2 border border-slate-300 text-center">{{ it.status_so === 1 ? 'Disetujui' : (it.status_aktif === 0 ? 'Dibatalkan' : 'Draft') }}</td>
                <td class="p-2 border border-slate-300 text-center">{{ it.status_produksi === 1 ? 'Selesai/Dalam' : 'Belum' }}</td>
                <td class="p-2 border border-slate-300 text-center">{{ it.status_pengiriman }}</td>
              </tr>
            </tbody>
          </template>

          <!-- SO vs Delivery Table -->
          <template v-else-if="reportType === 'so_vs_delivery'">
            <thead>
              <tr class="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <th class="p-2 border border-slate-300 w-8 text-center">No</th>
                <th class="p-2 border border-slate-300">Nomor SO</th>
                <th class="p-2 border border-slate-300">Customer</th>
                <th class="p-2 border border-slate-300">Nama Produk</th>
                <th class="p-2 border border-slate-300 text-right">Qty Pesan</th>
                <th class="p-2 border border-slate-300 text-right">Qty Kirim</th>
                <th class="p-2 border border-slate-300 text-right">Sisa Qty</th>
                <th class="p-2 border border-slate-300 text-right">Realisasi</th>
                <th class="p-2 border border-slate-300 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(it, idx) in items" :key="idx" class="border-b border-slate-200">
                <td class="p-2 border border-slate-300 text-center">{{ idx + 1 }}</td>
                <td class="p-2 border border-slate-300 font-medium">{{ it.nomor_so || '-' }}</td>
                <td class="p-2 border border-slate-300">{{ it.customer_name || '-' }}</td>
                <td class="p-2 border border-slate-300">{{ it.nama_produk || '-' }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ it.qty_pesanan }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ it.qty_terkirim }}</td>
                <td class="p-2 border border-slate-300 text-right font-medium">{{ it.sisa_qty }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ it.persentase_pengiriman }}%</td>
                <td class="p-2 border border-slate-300 text-center">{{ it.status_pengiriman }}</td>
              </tr>
            </tbody>
          </template>

          <!-- Invoice Table -->
          <template v-else-if="reportType === 'invoice'">
            <thead>
              <tr class="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <th class="p-2 border border-slate-300 w-8 text-center">No</th>
                <th class="p-2 border border-slate-300">Tanggal</th>
                <th class="p-2 border border-slate-300">Nomor Invoice</th>
                <th class="p-2 border border-slate-300">Nomor SO</th>
                <th class="p-2 border border-slate-300">Customer</th>
                <th class="p-2 border border-slate-300 text-center">Jenis</th>
                <th class="p-2 border border-slate-300 text-right">Subtotal</th>
                <th class="p-2 border border-slate-300 text-right">PPN</th>
                <th class="p-2 border border-slate-300 text-right">Total Invoice</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(it, idx) in items" :key="it.id" class="border-b border-slate-200">
                <td class="p-2 border border-slate-300 text-center">{{ idx + 1 }}</td>
                <td class="p-2 border border-slate-300">{{ formatDateIndo(it.tanggal_invoice) }}</td>
                <td class="p-2 border border-slate-300 font-semibold">{{ it.nomor_invoice || '-' }}</td>
                <td class="p-2 border border-slate-300">{{ it.nomor_so || '-' }}</td>
                <td class="p-2 border border-slate-300">{{ it.customer_name || '-' }}</td>
                <td class="p-2 border border-slate-300 text-center">{{ it.jenis_invoice }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ formatCurrency(it.subtotal) }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ formatCurrency(it.total_ppn) }}</td>
                <td class="p-2 border border-slate-300 text-right font-bold">{{ formatCurrency(it.total_invoice) }}</td>
              </tr>
            </tbody>
            <tfoot v-if="summaryTotals" class="bg-slate-100 font-bold border-t-2 border-slate-400">
              <tr>
                <td colspan="6" class="p-2 border border-slate-300 text-center">TOTAL KESELURUHAN ({{ summaryTotals.total_rows }} Invoice)</td>
                <td class="p-2 border border-slate-300 text-right">{{ formatCurrency(summaryTotals.total_subtotal || 0) }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ formatCurrency(summaryTotals.total_ppn || 0) }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ formatCurrency(summaryTotals.total_amount || 0) }}</td>
              </tr>
            </tfoot>
          </template>

          <!-- Payment & Receivable Table -->
          <template v-else-if="reportType === 'payment_receivable'">
            <thead>
              <tr class="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <th class="p-2 border border-slate-300 w-8 text-center">No</th>
                <th class="p-2 border border-slate-300">Nomor Invoice</th>
                <th class="p-2 border border-slate-300">Tanggal</th>
                <th class="p-2 border border-slate-300">Nomor SO</th>
                <th class="p-2 border border-slate-300">Customer</th>
                <th class="p-2 border border-slate-300 text-center">Jenis</th>
                <th class="p-2 border border-slate-300 text-right">Total Invoice</th>
                <th class="p-2 border border-slate-300 text-right">Total Bayar</th>
                <th class="p-2 border border-slate-300 text-right">Sisa Tagihan</th>
                <th class="p-2 border border-slate-300 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(it, idx) in items" :key="it.invoice_id" class="border-b border-slate-200">
                <td class="p-2 border border-slate-300 text-center">{{ idx + 1 }}</td>
                <td class="p-2 border border-slate-300 font-semibold">{{ it.nomor_invoice || '-' }}</td>
                <td class="p-2 border border-slate-300">{{ formatDateIndo(it.tanggal_invoice) }}</td>
                <td class="p-2 border border-slate-300">{{ it.nomor_so || '-' }}</td>
                <td class="p-2 border border-slate-300">{{ it.customer_name || '-' }}</td>
                <td class="p-2 border border-slate-300 text-center">{{ it.jenis_invoice }}</td>
                <td class="p-2 border border-slate-300 text-right font-medium">{{ formatCurrency(it.total_invoice) }}</td>
                <td class="p-2 border border-slate-300 text-right text-emerald-700 font-medium">{{ formatCurrency(it.total_pembayaran) }}</td>
                <td class="p-2 border border-slate-300 text-right text-rose-700 font-bold">{{ formatCurrency(it.sisa_tagihan) }}</td>
                <td class="p-2 border border-slate-300 text-center">{{ it.status_pembayaran }}</td>
              </tr>
            </tbody>
            <tfoot v-if="summaryTotals" class="bg-slate-100 font-bold border-t-2 border-slate-400">
              <tr>
                <td colspan="6" class="p-2 border border-slate-300 text-center">TOTAL KESELURUHAN</td>
                <td class="p-2 border border-slate-300 text-right">{{ formatCurrency(summaryTotals.total_amount || 0) }}</td>
                <td class="p-2 border border-slate-300 text-right text-emerald-800">{{ formatCurrency(summaryTotals.total_pembayaran || 0) }}</td>
                <td class="p-2 border border-slate-300 text-right text-rose-800">{{ formatCurrency(summaryTotals.total_sisa_tagihan || 0) }}</td>
                <td class="p-2 border border-slate-300"></td>
              </tr>
            </tfoot>
          </template>
        </table>
      </div>
    </div>
  </div>
</template>
