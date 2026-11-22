<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import StockAdjustmentStatusBadge from '../components/StockAdjustmentStatusBadge.vue'
import { stockAdjustmentService } from '../services/stock-adjustment.service'
import type { StockAdjustmentDetailWithItems } from '../types/stock-adjustment.types'
import { exportAdjustmentDetailPdf } from '../utils/stock-adjustment-export'
import { usePermission } from '@/shared/composables/usePermission'
import { useToast } from '@/shared/composables/useToast'
import { formatDate, formatNumber, formatCurrency } from '@/shared/utils/formatters'
import {
  ArrowLeft,
  Edit2,
  FileText,
  Printer,
  Trash2,
  Layers,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const { hasPermission } = usePermission()

const canUpdate = computed(() => hasPermission('inventory', 'update'))
const canDelete = computed(() => hasPermission('inventory', 'delete'))

const adjustmentId = Number(route.params.id)
const adjustment = ref<StockAdjustmentDetailWithItems | null>(null)
const isLoading = ref(true)

// Posting modal
const isPostingConfirmOpen = ref(false)
const isPosting = ref(false)

// Delete / Cancel Dialog (Only Draft)
const isCancelDialogOpen = ref(false)
const isCancelling = ref(false)

async function loadDetail() {
  isLoading.value = true
  try {
    const data = await stockAdjustmentService.getAdjustmentById(adjustmentId)
    if (!data) {
      toast.error('Penyesuaian stok tidak ditemukan.')
      router.push('/inventory/stock-adjustments')
      return
    }
    adjustment.value = data
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat detail penyesuaian stok.'
    toast.error(message)
    router.push('/inventory/stock-adjustments')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadDetail()
})

function handleBack() {
  router.push('/inventory/stock-adjustments')
}

function handleEdit() {
  if (adjustment.value?.status === 1) {
    toast.warning('Dokumen yang telah berstatus Selesai (Posted) tidak dapat diedit langsung.')
    return
  }
  router.push(`/inventory/stock-adjustments/${adjustmentId}/edit`)
}

function handlePrint() {
  window.print()
}

function handleExportPdf() {
  if (!adjustment.value) return
  exportAdjustmentDetailPdf(adjustment.value)
  toast.success('File PDF Berita Acara Penyesuaian Stok berhasil diunduh.')
}

function openPostingConfirm() {
  if (!adjustment.value) return
  isPostingConfirmOpen.value = true
}

async function handleConfirmPost() {
  if (!adjustment.value) return
  isPosting.value = true
  try {
    await stockAdjustmentService.postAdjustment(adjustmentId)
    toast.success(`Dokumen ${adjustment.value.kode} berhasil di-posting dan saldo stok telah diperbarui.`)
    isPostingConfirmOpen.value = false
    loadDetail()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal mem-posting penyesuaian stok.'
    toast.error(message)
  } finally {
    isPosting.value = false
  }
}

async function handleCancelAdjustment() {
  if (!adjustment.value) return
  isCancelling.value = true
  try {
    await stockAdjustmentService.deleteAdjustment(adjustmentId)
    toast.success('Draft penyesuaian stok berhasil dibatalkan.')
    isCancelDialogOpen.value = false
    router.push('/inventory/stock-adjustments')
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal membatalkan draft penyesuaian stok.'
    toast.error(message)
  } finally {
    isCancelling.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <AppPageHeader
      :title="`Detail Penyesuaian: ${adjustment?.kode || '...'}`"
      subtitle="Berita Acara Stock Opname & Hasil Perhitungan Selisih"
      :breadcrumbs="[
        { label: 'Persediaan', to: '/inventory/materials' },
        { label: 'Penyesuaian Stok Bahan', to: '/inventory/stock-adjustments' },
        { label: adjustment?.kode || 'Detail' }
      ]"
    >
      <template #actions>
        <div class="flex items-center gap-2 flex-wrap print:hidden">
          <AppButton
            variant="outline"
            size="sm"
            class="text-slate-600 bg-white border-slate-300 hover:bg-slate-50"
            @click="handleBack"
          >
            <ArrowLeft class="w-4 h-4 mr-1.5" />
            Kembali
          </AppButton>

          <!-- AKSI KHUSUS DRAFT (status === 0): Edit, Posting, Hapus Draft -->
          <template v-if="adjustment?.status === 0">
            <AppButton
              v-if="canUpdate"
              variant="outline"
              size="sm"
              class="text-amber-700 bg-white border-amber-300 hover:bg-amber-50"
              @click="handleEdit"
            >
              <Edit2 class="w-4 h-4 mr-1.5" />
              Edit Draft
            </AppButton>

            <AppButton
              v-if="canUpdate"
              variant="primary"
              size="sm"
              class="bg-emerald-600 hover:bg-emerald-700 text-white"
              @click="openPostingConfirm"
            >
              <Send class="w-4 h-4 mr-1.5" />
              Posting Sekarang
            </AppButton>

            <AppButton
              v-if="canDelete"
              variant="outline"
              size="sm"
              class="text-rose-700 bg-white border-rose-300 hover:bg-rose-50"
              @click="isCancelDialogOpen = true"
            >
              <Trash2 class="w-4 h-4 mr-1.5" />
              Hapus Draft
            </AppButton>
          </template>

          <!-- AKSI KHUSUS POSTED (status === 1): Cetak, Export PDF (Tidak Boleh Edit / Hapus) -->
          <template v-else>
            <AppButton
              variant="outline"
              size="sm"
              class="text-slate-700 bg-white border-slate-300 hover:bg-slate-50"
              @click="handleExportPdf"
            >
              <FileText class="w-4 h-4 mr-1.5 text-rose-600" />
              Export PDF
            </AppButton>

            <AppButton
              variant="outline"
              size="sm"
              class="text-slate-700 bg-white border-slate-300 hover:bg-slate-50"
              @click="handlePrint"
            >
              <Printer class="w-4 h-4 mr-1.5 text-slate-600" />
              Cetak Berita Acara
            </AppButton>
          </template>
        </div>
      </template>
    </AppPageHeader>

    <div v-if="isLoading" class="p-12 text-center text-slate-500 bg-white rounded-lg border border-slate-200">
      Memuat detail penyesuaian stok...
    </div>

    <template v-else-if="adjustment">
      <!-- Status Banner -->
      <div
        v-if="adjustment.status === 1"
        class="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800 flex items-center gap-2"
      >
        <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
        <span>
          Dokumen penyesuaian stok ini telah <strong>Selesai (Posted)</strong>. Saldo persediaan bahan baku di sistem telah diperbarui dan tercatat pada histori pergerakan stok.
        </span>
      </div>
      <div
        v-else
        class="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-center gap-2"
      >
        <Clock class="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          Dokumen berstatus <strong>Draft</strong>. Saldo stok bahan belum mengalami perubahan di database hingga Anda melakukan Posting.
        </span>
      </div>

      <!-- Header Information Card -->
      <div class="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <span class="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Nomor Berita Acara Stock Opname
            </span>
            <h2 class="text-xl font-bold font-mono text-slate-800">{{ adjustment.kode }}</h2>
          </div>
          <StockAdjustmentStatusBadge :status="adjustment.status" size="md" />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-xs">
          <div>
            <p class="text-slate-400 font-medium">Tanggal Opname</p>
            <p class="font-semibold text-slate-800 mt-0.5">{{ formatDate(adjustment.tanggal) }}</p>
          </div>

          <div>
            <p class="text-slate-400 font-medium">Dibuat Oleh</p>
            <p class="font-semibold text-slate-800 mt-0.5">
              {{ adjustment.created_by_name || 'Administrator' }}
            </p>
          </div>

          <div>
            <p class="text-slate-400 font-medium">Waktu Pembuatan</p>
            <p class="font-semibold text-slate-800 mt-0.5 font-mono">
              {{ adjustment.created_at ? new Date(adjustment.created_at).toLocaleString('id-ID') : '-' }}
            </p>
          </div>

          <div>
            <p class="text-slate-400 font-medium">Keterangan / Keperluan</p>
            <p class="font-semibold text-slate-800 mt-0.5">
              {{ adjustment.keterangan || '-' }}
            </p>
          </div>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div class="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
          <p class="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Item</p>
          <p class="text-lg font-bold font-mono text-slate-800">{{ adjustment.total_items }}</p>
        </div>

        <div class="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
          <p class="text-[11px] font-medium text-emerald-600 uppercase tracking-wider">Bertambah (+)</p>
          <p class="text-lg font-bold font-mono text-emerald-700">+{{ adjustment.total_positif }}</p>
        </div>

        <div class="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
          <p class="text-[11px] font-medium text-rose-600 uppercase tracking-wider">Berkurang (-)</p>
          <p class="text-lg font-bold font-mono text-rose-700">-{{ adjustment.total_negatif }}</p>
        </div>

        <div class="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
          <p class="text-[11px] font-medium text-slate-600 uppercase tracking-wider">Cocok (=)</p>
          <p class="text-lg font-bold font-mono text-slate-700">{{ adjustment.total_tanpa_selisih }}</p>
        </div>

        <div class="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
          <p class="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Net Selisih Qty</p>
          <p
            :class="[
              'text-lg font-bold font-mono',
              adjustment.net_selisih_qty > 0
                ? 'text-emerald-700'
                : adjustment.net_selisih_qty < 0
                  ? 'text-rose-700'
                  : 'text-slate-700'
            ]"
          >
            {{ adjustment.net_selisih_qty > 0 ? `+${adjustment.net_selisih_qty}` : adjustment.net_selisih_qty }}
          </p>
        </div>

        <div class="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
          <p class="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Nilai Selisih</p>
          <p
            :class="[
              'text-sm font-bold font-mono truncate',
              adjustment.total_nilai_selisih > 0
                ? 'text-emerald-700'
                : adjustment.total_nilai_selisih < 0
                  ? 'text-rose-700'
                  : 'text-slate-700'
            ]"
            :title="formatCurrency(adjustment.total_nilai_selisih)"
          >
            {{ formatCurrency(adjustment.total_nilai_selisih) }}
          </p>
        </div>
      </div>

      <!-- Detail Items Table (Spreadsheet View) -->
      <div class="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div class="px-5 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 class="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Layers class="w-4 h-4 text-teal-600" />
            Daftar Bahan Baku Hasil Verifikasi Stock Opname
          </h3>
          <span class="text-xs text-slate-500 font-mono">{{ adjustment.items.length }} baris</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead class="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th class="px-3 py-2.5 text-center w-12">No.</th>
                <th class="px-3 py-2.5 w-32">Kode Bahan</th>
                <th class="px-3 py-2.5">Nama Bahan Baku</th>
                <th class="px-3 py-2.5 w-32">Gudang</th>
                <th class="px-3 py-2.5 text-center w-24">Satuan</th>
                <th class="px-3 py-2.5 text-right w-28">Stok Sistem</th>
                <th class="px-3 py-2.5 text-right w-28">Stok Fisik</th>
                <th class="px-3 py-2.5 text-right w-28">Selisih</th>
                <th class="px-3 py-2.5 text-right w-36">Nilai Selisih</th>
                <th class="px-3 py-2.5">Keterangan / Alasan</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="(item, idx) in adjustment.items" :key="item.id" class="hover:bg-slate-50/80">
                <td class="px-3 py-2 text-center text-slate-400 font-mono">{{ idx + 1 }}</td>
                <td class="px-3 py-2 font-mono font-medium text-teal-800">{{ item.kode_bahan }}</td>
                <td class="px-3 py-2 font-medium text-slate-800">{{ item.nama_bahan }}</td>
                <td class="px-3 py-2 text-slate-600">{{ item.nama_gudang }}</td>
                <td class="px-3 py-2 text-center text-slate-500">{{ item.nama_satuan }}</td>
                <td class="px-3 py-2 text-right font-mono text-slate-600">{{ formatNumber(item.stok_awal) }}</td>
                <td class="px-3 py-2 text-right font-mono font-bold text-slate-800">{{ formatNumber(item.stok_akhir) }}</td>
                <td class="px-3 py-2 text-right font-mono">
                  <span
                    :class="[
                      'inline-block px-1.5 py-0.5 rounded text-[11px] font-bold',
                      item.selisih > 0
                        ? 'text-emerald-700 bg-emerald-50'
                        : item.selisih < 0
                          ? 'text-rose-700 bg-rose-50'
                          : 'text-slate-500 bg-slate-100'
                    ]"
                  >
                    {{ item.selisih > 0 ? `+${formatNumber(item.selisih)}` : formatNumber(item.selisih) }}
                  </span>
                </td>
                <td
                  :class="[
                    'px-3 py-2 text-right font-mono font-medium',
                    item.nilai_selisih > 0
                      ? 'text-emerald-700'
                      : item.nilai_selisih < 0
                        ? 'text-rose-700'
                        : 'text-slate-500'
                  ]"
                >
                  {{ formatCurrency(item.nilai_selisih) }}
                </td>
                <td class="px-3 py-2 text-slate-500 italic">
                  {{ item.keterangan_detail || '-' }}
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-slate-50 font-bold border-t border-slate-200 text-slate-800">
              <tr>
                <td colspan="5" class="px-3 py-2.5 text-right uppercase text-[11px] text-slate-500">
                  Total Selisih:
                </td>
                <td class="px-3 py-2.5 text-right font-mono text-slate-600">
                  {{ formatNumber(adjustment.items.reduce((s, i) => s + i.stok_awal, 0)) }}
                </td>
                <td class="px-3 py-2.5 text-right font-mono text-slate-800">
                  {{ formatNumber(adjustment.items.reduce((s, i) => s + i.stok_akhir, 0)) }}
                </td>
                <td
                  :class="[
                    'px-3 py-2.5 text-right font-mono',
                    adjustment.net_selisih_qty > 0
                      ? 'text-emerald-700'
                      : adjustment.net_selisih_qty < 0
                        ? 'text-rose-700'
                        : 'text-slate-700'
                  ]"
                >
                  {{ adjustment.net_selisih_qty > 0 ? `+${formatNumber(adjustment.net_selisih_qty)}` : formatNumber(adjustment.net_selisih_qty) }}
                </td>
                <td
                  :class="[
                    'px-3 py-2.5 text-right font-mono',
                    adjustment.total_nilai_selisih > 0
                      ? 'text-emerald-700'
                      : adjustment.total_nilai_selisih < 0
                        ? 'text-rose-700'
                        : 'text-slate-700'
                  ]"
                >
                  {{ formatCurrency(adjustment.total_nilai_selisih) }}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Area Tanda Tangan Berita Acara Stock Opname (Section 15) -->
      <div class="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mt-6">
        <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-6 text-center">
          LEMBAR PENGESAHAN BERITA ACARA STOCK OPNAME
        </h4>
        <div class="grid grid-cols-3 gap-8 text-center text-xs">
          <!-- Petugas Opname -->
          <div class="space-y-16">
            <p class="font-medium text-slate-600">Petugas Stock Opname</p>
            <div>
              <p class="font-bold text-slate-800 border-b border-slate-300 pb-1 mx-8">
                {{ adjustment.created_by_name || 'Administrator' }}
              </p>
              <p class="text-[11px] text-slate-400 mt-0.5">Petugas Opname</p>
            </div>
          </div>

          <!-- Pemeriksa / SPV Gudang -->
          <div class="space-y-16">
            <p class="font-medium text-slate-600">Pemeriksa</p>
            <div>
              <p class="font-bold text-slate-800 border-b border-slate-300 pb-1 mx-8">
                (____________________)
              </p>
              <p class="text-[11px] text-slate-400 mt-0.5">Supervisor / Ka. Gudang</p>
            </div>
          </div>

          <!-- Penanggung Jawab Gudang / Accounting -->
          <div class="space-y-16">
            <p class="font-medium text-slate-600">Mengetahui & Menyetujui</p>
            <div>
              <p class="font-bold text-slate-800 border-b border-slate-300 pb-1 mx-8">
                (____________________)
              </p>
              <p class="text-[11px] text-slate-400 mt-0.5">Manajer Operasional / Akuntansi</p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Modal Konfirmasi Posting Sekarang -->
    <div
      v-if="isPostingConfirmOpen"
      class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        class="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        @click.stop
      >
        <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div class="flex items-center gap-2 text-teal-800 font-semibold text-sm">
            <Send class="w-5 h-5 text-teal-600" />
            Konfirmasi Posting Penyesuaian
          </div>
          <button
            type="button"
            class="text-slate-400 hover:text-slate-600 p-1"
            @click="isPostingConfirmOpen = false"
          >
            ✕
          </button>
        </div>

        <div class="p-5 space-y-4">
          <div class="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-start gap-2.5">
            <AlertTriangle class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p class="font-semibold">Perhatian Posting Saldo Stok:</p>
              <p class="mt-0.5 text-slate-700">
                Posting akan memperbarui saldo stok bahan di database dan tidak dapat diedit langsung setelah selesai.
              </p>
            </div>
          </div>

          <div class="space-y-2 text-xs">
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-500">Nomor Dokumen:</span>
              <span class="font-mono font-bold text-slate-800">{{ adjustment?.kode }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-500">Tanggal Opname:</span>
              <span class="font-medium text-slate-800">{{ adjustment?.tanggal }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-500">Jumlah Bahan:</span>
              <span class="font-mono font-medium text-slate-800">{{ adjustment?.total_items }} item</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-500">Bahan Bertambah:</span>
              <span class="font-mono font-bold text-emerald-600">+{{ adjustment?.total_positif }} item</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-500">Bahan Berkurang:</span>
              <span class="font-mono font-bold text-rose-600">-{{ adjustment?.total_negatif }} item</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-500">Bahan Cocok:</span>
              <span class="font-mono font-medium text-slate-600">{{ adjustment?.total_tanpa_selisih }} item</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-500">Total Nilai Selisih:</span>
              <span
                :class="[
                  'font-mono font-bold',
                  (adjustment?.total_nilai_selisih ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                ]"
              >
                {{ formatCurrency(adjustment?.total_nilai_selisih || 0) }}
              </span>
            </div>
          </div>
        </div>

        <div class="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <AppButton
            variant="outline"
            size="sm"
            class="text-slate-700 border-slate-300 hover:bg-slate-100 text-xs"
            :disabled="isPosting"
            @click="isPostingConfirmOpen = false"
          >
            Batal
          </AppButton>
          <AppButton
            variant="primary"
            size="sm"
            class="bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs"
            :disabled="isPosting"
            @click="handleConfirmPost"
          >
            <Send class="w-3.5 h-3.5 mr-1.5" />
            {{ isPosting ? 'Memproses Posting...' : 'Konfirmasi Posting' }}
          </AppButton>
        </div>
      </div>
    </div>

    <!-- Confirm Delete / Cancel Draft Dialog -->
    <AppConfirmDialog
      v-model="isCancelDialogOpen"
      title="Hapus Draft Penyesuaian Stok"
      :message="`Apakah Anda yakin ingin membatalkan dan menghapus draft penyesuaian '${adjustment?.kode}'? Tindakan ini tidak dapat dikembalikan.`"
      confirm-text="Ya, Hapus Draft"
      variant="danger"
      @confirm="handleCancelAdjustment"
    />
  </div>
</template>
