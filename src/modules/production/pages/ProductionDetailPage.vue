<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import ProductionMaterialRequirements from '../components/ProductionMaterialRequirements.vue'
import ProductionPrintDocument from '../components/ProductionPrintDocument.vue'
import { productionService } from '../services/production.service'
import type { ProductionWithItems } from '../types/production.types'
import { usePermission } from '@/shared/composables/usePermission'
import { useToast } from '@/shared/composables/useToast'
import { formatNumber } from '@/shared/utils/formatters'
import { exportProductionDetailPdf } from '../utils/production-export'
import {
  ArrowLeft,
  Edit2,
  Printer,
  FileText,
  Trash2,
  Layers,
  CheckCircle2,
  PlayCircle,
  Package,
  Calendar,
  ExternalLink
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const { hasPermission } = usePermission()
const toast = useToast()

function getSalesOrderRoute(soId: number, orderType?: string): string {
  if (orderType === 'NON_PPN') return `/sales/so-pola/${soId}`
  if (orderType === 'NON_PPN_2') return `/sales/so-ks/${soId}`
  return `/sales/so-impact/${soId}`
}

const productionId = Number(route.params.id)

const canUpdate = computed(() => hasPermission('production', 'update'))
const canDelete = computed(() => hasPermission('production', 'delete'))

const production = ref<ProductionWithItems | null>(null)
const isLoading = ref(true)

// Workflow dialog states
const isProcessDialogOpen = ref(false)
const isCompleteDialogOpen = ref(false)
const isCancelDialogOpen = ref(false)
const isActionLoading = ref(false)

async function loadData() {
  isLoading.value = true
  try {
    const data = await productionService.getProductionById(productionId)
    if (!data) {
      toast.error('Data Tidak Ditemukan', `Transaksi produksi #${productionId} tidak ada.`)
      router.push('/production/orders')
      return
    }
    production.value = data
  } catch (err: unknown) {
    toast.error('Gagal Memuat Transaksi', (err as Error).message)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

async function handleTransitionToProcess() {
  isActionLoading.value = true
  try {
    await productionService.updateProductionStatus(productionId, 1)
    toast.success(
      'Status Diperbarui',
      'Transaksi produksi telah masuk ke status Dalam Pengerjaan (Proses).'
    )
    isProcessDialogOpen.value = false
    await loadData()
  } catch (err: unknown) {
    toast.error('Gagal Mengubah Status', (err as Error).message)
  } finally {
    isActionLoading.value = false
  }
}

async function handleTransitionToComplete() {
  isActionLoading.value = true
  try {
    const res = await productionService.postProduction(productionId)
    toast.success('Produksi Selesai & Stok Diposting', res.message)
    isCompleteDialogOpen.value = false
    await loadData()
  } catch (err: unknown) {
    toast.error('Gagal Menyelesaikan Produksi', (err as Error).message)
  } finally {
    isActionLoading.value = false
  }
}

async function handleCancelTransaction() {
  isActionLoading.value = true
  try {
    await productionService.deleteProduction(productionId)
    toast.success(
      'Transaksi Dibatalkan',
      'Surat perintah kerja telah dibatalkan dan saldo stok telah disesuaikan kembali (reversal).'
    )
    isCancelDialogOpen.value = false
    await loadData()
  } catch (err: unknown) {
    toast.error('Gagal Membatalkan Transaksi', (err as Error).message)
  } finally {
    isActionLoading.value = false
  }
}

function handlePrint() {
  window.print()
}

function handleExportPdf() {
  if (!production.value) return
  exportProductionDetailPdf(production.value)
  toast.success('Ekspor PDF Berhasil', 'Dokumen Surat Perintah Kerja (SPK) telah diunduh.')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <AppPageHeader
      :title="`Surat Perintah Kerja: ${production?.kode || '...'}`"
      subtitle="Rincian dokumen spesifikasi perintah kerja produksi furniture dan estimasi kebutuhan bahan"
      :breadcrumbs="[
        { label: 'Produksi', to: '/production/orders' },
        { label: 'Proses Produksi', to: '/production/orders' },
        { label: production?.kode || 'Detail' }
      ]"
    >
      <template #actions>
        <div class="flex items-center gap-2">
          <AppButton
            variant="outline"
            size="sm"
            class="flex items-center gap-1.5"
            @click="router.push('/production/orders')"
          >
            <ArrowLeft class="w-4 h-4" />
            <span>Kembali ke Daftar</span>
          </AppButton>

          <AppButton
            variant="outline"
            size="sm"
            class="flex items-center gap-1.5"
            @click="handlePrint"
          >
            <Printer class="w-4 h-4 text-slate-600" />
            <span>Cetak SPK</span>
          </AppButton>

          <AppButton
            variant="outline"
            size="sm"
            class="flex items-center gap-1.5"
            @click="handleExportPdf"
          >
            <FileText class="w-4 h-4 text-rose-600" />
            <span>Ekspor PDF</span>
          </AppButton>

          <AppButton
            v-if="canUpdate && !production?.is_posted"
            variant="outline"
            size="sm"
            class="flex items-center gap-1.5 text-blue-700 border-blue-200 hover:bg-blue-50"
            @click="router.push(`/production/orders/${productionId}/edit`)"
          >
            <Edit2 class="w-4 h-4" />
            <span>Edit Dokumen</span>
          </AppButton>

          <!-- Workflow: Mulai Pengerjaan (Pending -> Proses) -->
          <AppButton
            v-if="canUpdate && production && production.status_produksi === 0"
            variant="primary"
            size="sm"
            class="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
            @click="isProcessDialogOpen = true"
          >
            <PlayCircle class="w-4 h-4" />
            <span>Mulai Pengerjaan</span>
          </AppButton>

          <!-- Workflow: Selesaikan & Posting Stok (Proses -> Selesai) -->
          <AppButton
            v-if="canUpdate && production && production.status_produksi === 1"
            variant="primary"
            size="sm"
            class="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
            @click="isCompleteDialogOpen = true"
          >
            <CheckCircle2 class="w-4 h-4" />
            <span>Selesaikan & Posting Stok</span>
          </AppButton>

          <!-- Action: Batalkan Transaksi -->
          <AppButton
            v-if="canDelete && production && production.status_aktif === 1"
            variant="outline"
            size="sm"
            class="flex items-center gap-1.5 text-rose-700 border-rose-200 hover:bg-rose-50"
            @click="isCancelDialogOpen = true"
          >
            <Trash2 class="w-4 h-4" />
            <span>Batalkan</span>
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <!-- Loading Skeleton -->
    <div
      v-if="isLoading"
      class="p-16 text-center text-slate-400 bg-white rounded-xl border border-slate-200"
    >
      <div
        class="inline-block animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full mb-3"
      />
      <p class="text-sm font-medium">Memuat detail transaksi produksi...</p>
    </div>

    <template v-else-if="production">
      <!-- Card 1: Header Document Overview -->
      <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div
          class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700"
            >
              <Layers class="w-6 h-6" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-lg font-bold text-slate-900 font-mono">{{ production.kode }}</h2>
                <span
                  class="px-2 py-0.5 rounded text-[11px] font-semibold"
                  :class="[
                    production.jenis_produksi === 1
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  ]"
                >
                  {{ production.jenis_produksi === 1 ? 'Pesanan' : 'Non Pesanan / Stok' }}
                </span>
                <span
                  class="px-2 py-0.5 rounded text-[11px] font-medium"
                  :class="
                    production.is_posted
                      ? 'bg-teal-50 text-teal-700 border border-teal-200'
                      : 'bg-slate-100 text-slate-600'
                  "
                >
                  {{ production.is_posted ? 'Posted (Selesai)' : 'Draft' }}
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                <Calendar class="w-3.5 h-3.5 text-slate-400" />
                <span
                  >Tanggal Transaksi: <b>{{ production.tanggal }}</b></span
                >
                <span v-if="production.created_at" class="text-slate-400"
                  >| Dibuat: {{ production.created_at }}</span
                >
              </p>
            </div>
          </div>

          <!-- Status Produksi Badge -->
          <div class="text-right">
            <span class="text-xs text-slate-500 block mb-1">Status Pengerjaan:</span>
            <span
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              :class="[
                production.status_produksi === 2
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : production.status_produksi === 1
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
              ]"
            >
              <span
                class="w-2 h-2 rounded-full"
                :class="[
                  production.status_produksi === 2
                    ? 'bg-emerald-500'
                    : production.status_produksi === 1
                      ? 'bg-blue-500'
                      : 'bg-amber-500'
                ]"
              />
              {{
                production.status_produksi === 2
                  ? 'Produksi Selesai'
                  : production.status_produksi === 1
                    ? 'Dalam Pengerjaan (Proses)'
                    : 'Pending (Menunggu Pengerjaan)'
              }}
            </span>
          </div>
        </div>

        <!-- Metadata Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div class="space-y-1">
            <span class="text-slate-400 font-medium block">Keterangan Catatan:</span>
            <p class="text-slate-700 font-medium">
              {{ production.keterangan || 'Tidak ada catatan keterangan khusus.' }}
            </p>
          </div>

          <div class="space-y-1">
            <span class="text-slate-400 font-medium block">Relasi Penjualan / Customer:</span>
            <div v-if="production.so_id" class="text-slate-700 flex flex-wrap items-center gap-1.5">
              <span>Terikat Sales Order:</span>
              <router-link
                :to="getSalesOrderRoute(production.so_id, production.sales_order?.order_type)"
                class="font-mono font-bold text-teal-700 hover:text-teal-900 hover:underline inline-flex items-center gap-1"
              >
                <span>{{ production.sales_order?.kode || production.so_kode || `#SO-${production.so_id}` }}</span>
                <ExternalLink class="w-3 h-3 text-teal-500" />
              </router-link>
              <span v-if="production.customer_nama && production.customer_nama !== '-'" class="text-slate-500 text-[11px]">
                ({{ production.customer_nama }})
              </span>
            </div>
            <p v-else class="text-slate-500 italic">
              Produksi mandiri untuk persediaan gudang (Non-SO).
            </p>
          </div>

          <div class="space-y-1">
            <span class="text-slate-400 font-medium block">Ringkasan Output:</span>
            <p class="text-slate-700">
              <b>{{ production.jumlah_jenis_produk }}</b> varian produk |
              <b>{{ formatNumber(production.total_qty) }}</b> unit total target
            </p>
          </div>
        </div>
      </div>

      <!-- Card 2: Products Table -->
      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs space-y-0">
        <div
          class="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between"
        >
          <h3 class="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Package class="w-4 h-4 text-teal-600" />
            <span>Rincian Produk yang Diproduksi</span>
          </h3>
          <span class="text-xs text-slate-500 font-medium">
            Total Target: <b class="text-teal-700">{{ formatNumber(production.total_qty) }}</b> Unit
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead
              class="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-semibold tracking-wider"
            >
              <tr>
                <th class="py-2.5 px-4 w-12 text-center">No</th>
                <th class="py-2.5 px-4 w-32">Kode Produk</th>
                <th class="py-2.5 px-4">Nama Produk Furniture</th>
                <th class="py-2.5 px-4 w-28 text-center">Satuan</th>
                <th class="py-2.5 px-4 w-32 text-right">Stok Saat Ini</th>
                <th class="py-2.5 px-4 w-32 text-right">Target Produksi</th>
                <th class="py-2.5 px-4 w-52">Keterangan Spesifikasi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              <tr
                v-for="(item, idx) in production.items"
                :key="item.rowId || idx"
                class="hover:bg-slate-50/70 transition-colors"
              >
                <td class="py-2.5 px-4 text-center text-slate-400 font-mono text-[11px]">
                  {{ idx + 1 }}
                </td>
                <td class="py-2.5 px-4 font-mono font-medium text-slate-700">
                  {{ item.kode_produk }}
                </td>
                <td class="py-2.5 px-4 font-semibold text-slate-800">
                  {{ item.nama_produk }}
                  <span
                    v-if="item.has_bom"
                    class="ml-2 inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                  >
                    BoM Ready
                  </span>
                </td>
                <td class="py-2.5 px-4 text-center text-slate-500 font-mono">
                  {{ item.satuan_nama || 'Pcs' }}
                </td>
                <td class="py-2.5 px-4 text-right font-mono text-slate-600">
                  {{ formatNumber(item.stok) }}
                </td>
                <td class="py-2.5 px-4 text-right font-mono font-bold text-teal-700 text-sm">
                  {{ formatNumber(item.qty) }}
                </td>
                <td class="py-2.5 px-4 text-slate-500">{{ item.keterangan || '-' }}</td>
              </tr>
            </tbody>
            <tfoot
              class="bg-slate-50 border-t border-slate-200 font-semibold text-slate-700 text-xs"
            >
              <tr>
                <td colspan="5" class="py-2.5 px-4 text-right">TOTAL KUANTITAS PRODUKSI:</td>
                <td class="py-2.5 px-4 text-right font-mono text-teal-800 text-sm">
                  {{ formatNumber(production.total_qty) }}
                </td>
                <td class="py-2.5 px-4 text-slate-500">Unit</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Card 3: Material Requirements Breakdown (BoM Integration Preview) -->
      <div class="space-y-3">
        <ProductionMaterialRequirements
          :requirements="production.material_requirements || []"
          :has-unassigned-bom="production.has_unassigned_bom"
        />
      </div>

      <!-- Print Document Container (Hidden on screen, visible during window.print) -->
      <ProductionPrintDocument :production="production" />
    </template>

    <!-- Dialog 1: Mulai Pengerjaan (Proses) -->
    <AppConfirmDialog
      :is-open="isProcessDialogOpen"
      title="Mulai Pengerjaan Produksi"
      message="Ubah status transaksi produksi ini menjadi 'Dalam Pengerjaan (Proses)'? Tim produksi dapat memulai perakitan fisik di workshop."
      confirm-text="Mulai Pengerjaan"
      cancel-text="Batal"
      confirm-variant="primary"
      :is-loading="isActionLoading"
      @confirm="handleTransitionToProcess"
      @cancel="isProcessDialogOpen = false"
    />

    <!-- Dialog 2: Selesaikan Produksi & Posting Stok -->
    <AppConfirmDialog
      :is-open="isCompleteDialogOpen"
      title="Selesaikan Produksi & Posting Stok"
      message="Apakah seluruh produk telah selesai dirakit dan siap masuk ke persediaan? Transaksi ini akan memposting kuantitas produk jadi ke kartu stok produk dan memotong saldo bahan baku yang digunakan."
      confirm-text="Ya, Selesaikan & Posting Stok"
      cancel-text="Batal"
      confirm-variant="primary"
      :is-loading="isActionLoading"
      @confirm="handleTransitionToComplete"
      @cancel="isCompleteDialogOpen = false"
    />

    <!-- Dialog 3: Batalkan Transaksi Produksi -->
    <AppConfirmDialog
      :is-open="isCancelDialogOpen"
      title="Batalkan Transaksi Produksi"
      :message="`Yakin ingin membatalkan transaksi produksi '${production?.kode}'? ${
        production?.is_posted
          ? 'Perhatian: Transaksi ini telah diposting. Pembatalan akan membalikkan penambahan stok produk dan memulihkan saldo bahan baku (reversal).'
          : 'Data yang dibatalkan akan dinonaktifkan.'
      }`"
      confirm-text="Ya, Batalkan Transaksi"
      cancel-text="Kembali"
      confirm-variant="danger"
      :is-loading="isActionLoading"
      @confirm="handleCancelTransaction"
      @cancel="isCancelDialogOpen = false"
    />
  </div>
</template>
