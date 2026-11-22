<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppSkeleton from '@/shared/components/ui/AppSkeleton.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import GoodsReceiptStatusBadge from '../components/GoodsReceiptStatusBadge.vue'
import { goodsReceiptService } from '../services/goods-receipt.service'
import type { GoodsReceiptFormValues, GoodsReceiptDetailRow } from '../types/goods-receipt.types'
import { usePermission } from '@/shared/composables/usePermission'
import { useToast } from '@/shared/composables/useToast'
import { formatCurrency, formatDate, formatNumber } from '@/shared/utils/formatters'
import { exportToPdf } from '@/shared/utils/pdf-export'
import {
  ArrowLeft,
  Edit2,
  Printer,
  FileText,
  Building2,
  Warehouse,
  Truck,
  CheckCircle,
  CheckCircle2
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const { hasPermission } = usePermission()

const receiptId = computed(() => Number(route.params.id))
const canUpdate = computed(() => hasPermission('procurement', 'update'))

const isLoading = ref(true)
const isFinalizeConfirmOpen = ref(false)
const isFinalizing = ref(false)

const header = ref<
  | (GoodsReceiptFormValues & {
      kode_po: string
      nama_suplier: string
      nama_gudang: string
      suplier_id: number | null
      total: number
      nilai_pb: number
      total_ppn: number
    })
  | null
>(null)
const details = ref<GoodsReceiptDetailRow[]>([])

const hasDiscount = computed(() => {
  if (!details.value) return false
  return details.value.some(d => (d.diskon || 0) > 0) || (header.value?.diskon_persen || 0) > 0
})

async function loadData() {
  isLoading.value = true
  try {
    const res = await goodsReceiptService.getById(receiptId.value)
    header.value = res.header
    details.value = res.details
  } catch (err: unknown) {
    toast.error((err as Error).message || 'Gagal memuat detail Penerimaan Barang.')
    router.push('/procurement/goods-receipts')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

function navigateBack() {
  router.push('/procurement/goods-receipts')
}

function navigateToEdit() {
  if (header.value?.status === 1) {
    toast.warning('Dokumen Penerimaan Barang yang sudah Diterima (Final) tidak dapat diedit.')
    return
  }
  router.push(`/procurement/goods-receipts/${receiptId.value}/edit`)
}

async function handleFinalize() {
  if (!header.value) return
  isFinalizing.value = true
  try {
    await goodsReceiptService.finalize(receiptId.value)
    toast.success(`Penerimaan Barang ${header.value.kode} berhasil difinalisasi dan stok telah diposting.`)
    isFinalizeConfirmOpen.value = false
    await loadData()
  } catch (err: unknown) {
    toast.error((err as Error).message || 'Gagal memfinalisasi Penerimaan Barang.')
  } finally {
    isFinalizing.value = false
  }
}

function handlePrint() {
  window.print()
}

function handleExportPdf() {
  if (!header.value) return
  try {
    const exportData = details.value.map((item, idx) => ({
      no: idx + 1,
      nama_bahan: item.nama_bahan,
      satuan: item.nama_satuan,
      qty_pesan: formatNumber(item.qty_pesan),
      qty_terima: formatNumber(item.qty_terima || 0),
      harga: formatCurrency(item.harga_satuan || 0),
      diskon: `${item.diskon || 0}%`,
      subtotal: formatCurrency(item.subtotal || 0)
    }))

    exportToPdf({
      title: `PENERIMAAN BARANG - ${header.value.kode}`,
      filename: `Penerimaan-Barang-${header.value.kode}.pdf`,
      columns: [
        { key: 'no', label: 'No' },
        { key: 'nama_bahan', label: 'Nama Bahan' },
        { key: 'satuan', label: 'Satuan' },
        { key: 'qty_pesan', label: 'Qty Pesan' },
        { key: 'qty_terima', label: 'Qty Terima' },
        { key: 'harga', label: 'Harga Satuan' },
        { key: 'diskon', label: 'Diskon' },
        { key: 'subtotal', label: 'Subtotal' }
      ],
      data: exportData
    })
    toast.success('File PDF berhasil dibuat.')
  } catch (err: unknown) {
    toast.error((err as Error).message || 'Gagal membuat file PDF.')
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header & Action Buttons -->
    <AppPageHeader
      :title="`Detail Penerimaan: ${header?.kode || ''}`"
      description="Lihat informasi lengkap dokumen fisik dan verifikasi kedatangan bahan baku."
      :breadcrumbs="[
        { label: 'Home', to: '/dashboard' },
        { label: 'Pengadaan', to: '/procurement/purchase-orders' },
        { label: 'Penerimaan Barang', to: '/procurement/goods-receipts' },
        { label: 'Detail' }
      ]"
    >
      <template #actions>
        <div class="flex flex-wrap items-center gap-2">
          <!-- Back Button -->
          <AppButton variant="outline" size="md" @click="navigateBack">
            <ArrowLeft class="w-4 h-4 mr-1.5" />
            <span>Kembali</span>
          </AppButton>

          <!-- Finalisasi Button (Visible for Draft status 0) -->
          <AppButton
            v-if="canUpdate && header?.status === 0"
            variant="primary"
            size="md"
            :is-loading="isFinalizing"
            @click="isFinalizeConfirmOpen = true"
          >
            <CheckCircle class="w-4 h-4 mr-1.5" />
            <span>Finalisasi Penerimaan</span>
          </AppButton>

          <!-- Edit Button -->
          <AppButton
            v-if="canUpdate"
            :variant="header?.status === 0 ? 'outline' : 'outline'"
            size="md"
            :disabled="header?.status === 1"
            :title="header?.status === 1 ? 'Dokumen sudah Succeeded (Diterima Final) dan tidak dapat diedit' : 'Edit Dokumen'"
            @click="navigateToEdit"
          >
            <Edit2 class="w-4 h-4 mr-1.5" />
            <span>Edit Dokumen</span>
          </AppButton>

          <!-- Export PDF -->
          <AppButton variant="outline" size="md" @click="handleExportPdf">
            <FileText class="w-4 h-4 mr-1.5 text-rose-600" />
            <span>Ekspor PDF</span>
          </AppButton>

          <!-- Print -->
          <AppButton variant="outline" size="md" @click="handlePrint">
            <Printer class="w-4 h-4 text-slate-600 mr-1.5" />
            <span>Cetak</span>
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="space-y-6">
      <div class="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
        <AppSkeleton height="32px" width="30%" />
        <div class="grid grid-cols-2 gap-4">
          <AppSkeleton height="40px" />
          <AppSkeleton height="40px" />
          <AppSkeleton height="40px" />
          <AppSkeleton height="40px" />
        </div>
      </div>
      <div class="bg-white p-6 rounded-lg border border-slate-200">
        <AppSkeleton height="200px" />
      </div>
    </div>

    <template v-else-if="header">
      <!-- Section A: Read-Only Header Summary Card -->
      <div class="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-6">
        <div
          class="flex flex-wrap items-center justify-between pb-4 border-b border-slate-200 gap-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700"
            >
              <CheckCircle2 class="w-5 h-5" />
            </div>
            <div>
              <div class="text-xs text-slate-500 font-medium uppercase tracking-wider">
                Nomor Dokumen
              </div>
              <div class="text-lg font-bold font-mono text-slate-900">{{ header.kode }}</div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-500">Status:</span>
            <GoodsReceiptStatusBadge :status="header.status" />
          </div>
        </div>

        <!-- Two Column Meta Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
          <div>
            <span class="text-slate-500 block mb-1">Tanggal Penerimaan</span>
            <span class="font-semibold text-slate-800 text-sm">{{
              formatDate(header.tanggal)
            }}</span>
          </div>

          <div>
            <span class="text-slate-500 block mb-1">Nomor Surat Jalan (DO)</span>
            <span class="font-mono font-semibold text-slate-800 text-sm">{{
              header.no_surat_jalan
            }}</span>
          </div>

          <div>
            <span class="text-slate-500 block mb-1 flex items-center gap-1">
              <Building2 class="w-3.5 h-3.5 text-slate-400" />
              <span>Purchase Order & Supplier</span>
            </span>
            <span class="font-mono font-medium text-teal-700 block">{{ header.kode_po }}</span>
            <span class="font-bold text-slate-800">{{ header.nama_suplier }}</span>
          </div>

          <div>
            <span class="text-slate-500 block mb-1 flex items-center gap-1">
              <Warehouse class="w-3.5 h-3.5 text-slate-400" />
              <span>Gudang Penyimpanan</span>
            </span>
            <span class="font-bold text-slate-800 text-sm">{{ header.nama_gudang }}</span>
          </div>

          <div>
            <span class="text-slate-500 block mb-1 flex items-center gap-1">
              <Truck class="w-3.5 h-3.5 text-slate-400" />
              <span>Pengirim / Driver</span>
            </span>
            <span class="font-medium text-slate-800">{{ header.nama_pengirim || '-' }}</span>
          </div>

          <div>
            <span class="text-slate-500 block mb-1">Pajak (PPN)</span>
            <span class="font-semibold" :class="header.is_ppn ? 'text-teal-700' : 'text-slate-600'">
              {{ header.is_ppn ? `PPN (${header.ppn_persen}%)` : 'Non PPN' }}
            </span>
          </div>

          <div class="md:col-span-2">
            <span class="text-slate-500 block mb-1">Catatan Dokumen</span>
            <span class="text-slate-700 italic">{{ header.keterangan || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- Section B: Read-Only Detail Table -->
      <div class="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div
          class="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between"
        >
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wide">
            Daftar Bahan Yang Diterima
          </h3>
          <span class="text-xs text-slate-500"> Total {{ details.length }} item </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-left text-xs">
            <thead class="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
              <tr>
                <th class="w-10 px-3 py-2 text-center">No</th>
                <th class="px-3 py-2">Nama Bahan Baku</th>
                <th class="px-3 py-2 text-center">Satuan</th>
                <th class="px-3 py-2 text-right">Qty Pesan</th>
                <th class="px-3 py-2 text-right bg-amber-50/70 font-bold text-amber-900">
                  Qty Terima
                </th>
                <th class="px-3 py-2 text-right">Harga Satuan</th>
                <th v-if="hasDiscount" class="px-3 py-2 text-right">Diskon</th>
                <th class="px-3 py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr v-for="(item, idx) in details" :key="item.row_id" class="hover:bg-slate-50/60">
                <td class="px-3 py-2 text-center font-mono text-slate-400">{{ idx + 1 }}</td>
                <td class="px-3 py-2">
                  <div class="font-medium text-slate-800">{{ item.nama_bahan }}</div>
                  <div v-if="item.kode_bahan" class="font-mono text-[10px] text-slate-400">
                    {{ item.kode_bahan }}
                  </div>
                </td>
                <td class="px-3 py-2 text-center text-slate-600">{{ item.nama_satuan }}</td>
                <td class="px-3 py-2 text-right font-mono text-slate-700">
                  {{ formatNumber(item.qty_pesan) }}
                </td>
                <td class="px-3 py-2 text-right font-mono font-bold text-amber-900 bg-amber-50/30">
                  {{ formatNumber(item.qty_terima || 0) }}
                </td>
                <td class="px-3 py-2 text-right font-mono text-slate-700">
                  {{ formatCurrency(item.harga_satuan || 0) }}
                </td>
                <td v-if="hasDiscount" class="px-3 py-2 text-right font-mono text-slate-700">
                  {{ item.diskon || 0 }}%
                </td>
                <td class="px-3 py-2 text-right font-mono font-semibold text-slate-900">
                  {{ formatCurrency(item.subtotal || 0) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Section C: Summary Panel -->
      <div class="flex justify-end">
        <div
          class="w-full md:w-96 bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-3"
        >
          <div class="flex items-center justify-between text-xs text-slate-600">
            <span>Nilai Barang Diterima</span>
            <span class="font-mono font-semibold text-slate-800">{{
              formatCurrency(header.nilai_pb)
            }}</span>
          </div>

          <div
            v-if="hasDiscount && header.diskon_persen"
            class="flex items-center justify-between text-xs text-slate-600"
          >
            <span>Diskon ({{ header.diskon_persen }}%)</span>
            <span class="font-mono text-slate-700"
              >-{{ formatCurrency((header.nilai_pb * header.diskon_persen) / 100) }}</span
            >
          </div>

          <div class="flex items-center justify-between text-xs text-slate-600">
            <span>PPN {{ header.is_ppn ? `(${header.ppn_persen}%)` : '(Non PPN)' }}</span>
            <span
              class="font-mono"
              :class="header.is_ppn ? 'text-teal-700 font-semibold' : 'text-slate-400'"
            >
              {{ formatCurrency(header.total_ppn) }}
            </span>
          </div>

          <div
            class="flex items-center justify-between text-sm border-t-2 border-slate-200 pt-3 bg-teal-50/50 -mx-5 -mb-5 p-5 rounded-b-lg"
          >
            <span class="font-bold text-slate-900 uppercase tracking-wide">Total Nilai PB</span>
            <span class="font-mono text-lg font-extrabold text-teal-800">
              {{ formatCurrency(header.total) }}
            </span>
          </div>
        </div>
      </div>
    </template>

    <!-- Finalize Confirmation Dialog -->
    <AppConfirmDialog
      v-model="isFinalizeConfirmOpen"
      title="Finalisasi Penerimaan Barang"
      :message="`Apakah Anda yakin ingin memfinalisasi dokumen Penerimaan Barang ${header?.kode}? Bahan baku fisik akan diposting langsung menambah stok di gudang dan jurnal umum akan dicatat otomatis. Dokumen yang sudah difinalisasi tidak dapat diedit kembali.`"
      confirm-text="Ya, Finalisasi Dokumen"
      cancel-text="Batal"
      variant="primary"
      @confirm="handleFinalize"
      @cancel="isFinalizeConfirmOpen = false"
    />
  </div>
</template>
