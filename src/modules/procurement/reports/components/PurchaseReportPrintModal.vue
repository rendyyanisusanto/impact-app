<script setup lang="ts">
import { Printer, X } from 'lucide-vue-next'
import { formatCurrency } from '@/shared/utils/formatters'
import { formatDateIndo, getReportTypeLabel } from '../utils/purchase-report-export'
import type {
  PurchaseReportType,
  PurchaseReportSummaryTotals
} from '../types/purchase-report.types'

defineProps<{
  show: boolean
  reportType: PurchaseReportType
  items: any[]
  summaryTotals?: PurchaseReportSummaryTotals
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
                <th class="p-2 border border-slate-300">Tanggal</th>
                <th class="p-2 border border-slate-300">Nomor PO</th>
                <th class="p-2 border border-slate-300">Supplier</th>
                <th class="p-2 border border-slate-300 text-right">Item</th>
                <th class="p-2 border border-slate-300 text-right">Total Qty</th>
                <th class="p-2 border border-slate-300 text-right">Subtotal</th>
                <th class="p-2 border border-slate-300 text-right">PPN</th>
                <th class="p-2 border border-slate-300 text-right">Total (Rp)</th>
                <th class="p-2 border border-slate-300 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(it, idx) in items"
                :key="it.id || idx"
                class="border-b border-slate-200"
              >
                <td class="p-2 border border-slate-300 text-center">{{ idx + 1 }}</td>
                <td class="p-2 border border-slate-300">{{ formatDateIndo(it.tanggal) }}</td>
                <td class="p-2 border border-slate-300 font-medium">{{ it.kode || '-' }}</td>
                <td class="p-2 border border-slate-300">{{ it.supplier_name || '-' }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ it.item_count }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ it.total_qty }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ formatCurrency(it.subtotal) }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ formatCurrency(it.total_ppn) }}</td>
                <td class="p-2 border border-slate-300 text-right font-bold">{{ formatCurrency(it.total) }}</td>
                <td class="p-2 border border-slate-300 text-center">
                  {{ it.status === 1 ? 'Disetujui' : (it.status_aktif === 0 ? 'Dibatalkan' : 'Draft') }}
                </td>
              </tr>
              <tr v-if="summaryTotals" class="bg-slate-100 font-bold border-t-2 border-slate-400">
                <td colspan="4" class="p-2 border border-slate-300 text-center">
                  TOTAL KESELURUHAN ({{ summaryTotals.total_rows }} PO)
                </td>
                <td class="p-2 border border-slate-300 text-right">-</td>
                <td class="p-2 border border-slate-300 text-right">{{ summaryTotals.total_qty_pesan || 0 }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ formatCurrency(summaryTotals.total_item_subtotal || 0) }}</td>
                <td class="p-2 border border-slate-300 text-right">-</td>
                <td class="p-2 border border-slate-300 text-right">{{ formatCurrency(summaryTotals.total_po_amount || 0) }}</td>
                <td class="p-2 border border-slate-300"></td>
              </tr>
            </tbody>
          </template>

          <!-- Detail Table -->
          <template v-else-if="reportType === 'detail'">
            <thead>
              <tr class="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <th class="p-2 border border-slate-300 w-8 text-center">No</th>
                <th class="p-2 border border-slate-300">Tanggal</th>
                <th class="p-2 border border-slate-300">Nomor PO</th>
                <th class="p-2 border border-slate-300">Supplier</th>
                <th class="p-2 border border-slate-300">Kode</th>
                <th class="p-2 border border-slate-300">Bahan Baku</th>
                <th class="p-2 border border-slate-300 text-center">Sat</th>
                <th class="p-2 border border-slate-300 text-right">Qty</th>
                <th class="p-2 border border-slate-300 text-right">Harga</th>
                <th class="p-2 border border-slate-300 text-right">Disc</th>
                <th class="p-2 border border-slate-300 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(it, idx) in items"
                :key="it.detail_id || idx"
                class="border-b border-slate-200"
              >
                <td class="p-2 border border-slate-300 text-center">{{ idx + 1 }}</td>
                <td class="p-2 border border-slate-300">{{ formatDateIndo(it.tanggal) }}</td>
                <td class="p-2 border border-slate-300 font-medium">{{ it.kode_po || '-' }}</td>
                <td class="p-2 border border-slate-300">{{ it.supplier_name || '-' }}</td>
                <td class="p-2 border border-slate-300 text-slate-500">{{ it.kode_bahan || '-' }}</td>
                <td class="p-2 border border-slate-300">{{ it.nama_bahan || '-' }}</td>
                <td class="p-2 border border-slate-300 text-center">{{ it.satuan || '-' }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ it.qty }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ formatCurrency(it.harga) }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ it.diskon }}%</td>
                <td class="p-2 border border-slate-300 text-right font-bold">{{ formatCurrency(it.subtotal) }}</td>
              </tr>
              <tr v-if="summaryTotals" class="bg-slate-100 font-bold border-t-2 border-slate-400">
                <td colspan="7" class="p-2 border border-slate-300 text-center">
                  TOTAL ({{ summaryTotals.total_rows }} Item)
                </td>
                <td class="p-2 border border-slate-300 text-right">{{ summaryTotals.total_qty_pesan || 0 }}</td>
                <td colspan="2" class="p-2 border border-slate-300"></td>
                <td class="p-2 border border-slate-300 text-right">{{ formatCurrency(summaryTotals.total_item_subtotal || 0) }}</td>
              </tr>
            </tbody>
          </template>

          <!-- Supplier Table -->
          <template v-else-if="reportType === 'supplier'">
            <thead>
              <tr class="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <th class="p-2 border border-slate-300 w-8 text-center">No</th>
                <th class="p-2 border border-slate-300">Kode</th>
                <th class="p-2 border border-slate-300">Nama Supplier</th>
                <th class="p-2 border border-slate-300 text-right">Jumlah PO</th>
                <th class="p-2 border border-slate-300 text-right">Total Nilai PO (Rp)</th>
                <th class="p-2 border border-slate-300 text-right">Nilai Diterima (Rp)</th>
                <th class="p-2 border border-slate-300 text-right">Total Tagihan (Rp)</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(it, idx) in items"
                :key="it.supplier_id || idx"
                class="border-b border-slate-200"
              >
                <td class="p-2 border border-slate-300 text-center">{{ idx + 1 }}</td>
                <td class="p-2 border border-slate-300 text-slate-500">{{ it.kode_supplier || '-' }}</td>
                <td class="p-2 border border-slate-300 font-medium">{{ it.nama_supplier || '-' }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ it.jumlah_po }}</td>
                <td class="p-2 border border-slate-300 text-right font-bold">{{ formatCurrency(it.total_nilai_po) }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ formatCurrency(it.total_nilai_diterima) }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ formatCurrency(it.total_tagihan) }}</td>
              </tr>
              <tr v-if="summaryTotals" class="bg-slate-100 font-bold border-t-2 border-slate-400">
                <td colspan="4" class="p-2 border border-slate-300 text-center">TOTAL KESELURUHAN</td>
                <td class="p-2 border border-slate-300 text-right">{{ formatCurrency(summaryTotals.total_po_amount || 0) }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ formatCurrency(summaryTotals.total_received_amount || 0) }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ formatCurrency(summaryTotals.total_billed_amount || 0) }}</td>
              </tr>
            </tbody>
          </template>

          <!-- Fallback Generic Table -->
          <template v-else>
            <thead>
              <tr class="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <th class="p-2 border border-slate-300 w-8 text-center">No</th>
                <th class="p-2 border border-slate-300">Dokumen / Entitas</th>
                <th class="p-2 border border-slate-300">Nama / Keterangan</th>
                <th class="p-2 border border-slate-300 text-right">Qty Pesan</th>
                <th class="p-2 border border-slate-300 text-right">Qty Terima</th>
                <th class="p-2 border border-slate-300 text-right">Nilai PO / Pesan</th>
                <th class="p-2 border border-slate-300 text-right">Nilai Terima</th>
                <th class="p-2 border border-slate-300 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(it, idx) in items" :key="idx" class="border-b border-slate-200">
                <td class="p-2 border border-slate-300 text-center">{{ idx + 1 }}</td>
                <td class="p-2 border border-slate-300 font-medium">{{ it.nomor_po || it.kode_bahan || '-' }}</td>
                <td class="p-2 border border-slate-300">{{ it.supplier_name || it.nama_bahan || '-' }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ it.qty_pesan ?? it.total_qty_pesan ?? it.qty_po ?? '-' }}</td>
                <td class="p-2 border border-slate-300 text-right">{{ it.qty_terima ?? it.total_qty_terima ?? '-' }}</td>
                <td class="p-2 border border-slate-300 text-right font-bold">
                  {{ formatCurrency(it.total_po ?? it.total_nilai_pesan ?? it.nilai_po ?? 0) }}
                </td>
                <td class="p-2 border border-slate-300 text-right">
                  {{ formatCurrency(it.total_nilai_terima ?? it.nilai_penerimaan ?? 0) }}
                </td>
                <td class="p-2 border border-slate-300 text-center">{{ it.status_penerimaan || it.status_pembayaran || '-' }}</td>
              </tr>
            </tbody>
          </template>
        </table>

        <!-- Print Footer Notes -->
        <div class="mt-8 pt-4 border-t border-slate-200 flex justify-between text-[10px] text-slate-400">
          <div>Laporan dicetak otomatis oleh Sistem SMM-Impact ERP V2</div>
          <div>Impact Furniture Management System</div>
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
  .print\:p-0,
  .print\:p-0 * {
    visibility: visible;
  }
  .print\:hidden {
    display: none !important;
  }
}
</style>
