<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import MaterialMutationStatusBadge from '../components/MaterialMutationStatusBadge.vue'
import { materialMutationService } from '../services/material-mutation.service'
import type { MaterialMutationDetailWithItems } from '../types/material-mutation.types'
import { exportMutationDetailPdf } from '../utils/material-mutation-export'
import { usePermission } from '@/shared/composables/usePermission'
import { useToast } from '@/shared/composables/useToast'
import { formatDate, formatNumber } from '@/shared/utils/formatters'
import { ArrowLeft, Edit2, FileText, Printer, Trash2, Layers, Send } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const { hasPermission } = usePermission()

const canUpdate = computed(() => hasPermission('inventory', 'update'))
const canDelete = computed(() => hasPermission('inventory', 'delete'))

const mutationId = Number(route.params.id)
const mutation = ref<MaterialMutationDetailWithItems | null>(null)
const isLoading = ref(true)
const isPosting = ref(false)

// Delete / Cancel Dialog
const isCancelDialogOpen = ref(false)
const isCancelling = ref(false)

async function loadDetail() {
  isLoading.value = true
  try {
    const data = await materialMutationService.getMutationById(mutationId)
    if (!data) {
      toast.error('Mutasi bahan tidak ditemukan.')
      router.push('/inventory/material-mutations')
      return
    }
    mutation.value = data
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat detail mutasi.'
    toast.error(message)
    router.push('/inventory/material-mutations')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadDetail()
})

function handleBack() {
  router.push('/inventory/material-mutations')
}

function handleEdit() {
  router.push(`/inventory/material-mutations/${mutationId}/edit`)
}

function handlePrint() {
  window.print()
}

function handleExportPdf() {
  if (!mutation.value) return
  exportMutationDetailPdf(mutation.value)
  toast.success('File PDF mutasi berhasil diunduh.')
}

async function handlePostNow() {
  if (!mutation.value) return
  isPosting.value = true
  try {
    await materialMutationService.postMutation(mutationId)
    toast.success('Mutasi bahan berhasil diposting dan stok langsung dipotong.')
    loadDetail()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memposting mutasi bahan.'
    toast.error(message)
  } finally {
    isPosting.value = false
  }
}

async function handleCancelMutation() {
  if (!mutation.value) return
  isCancelling.value = true
  try {
    await materialMutationService.deleteMutation(mutationId)
    toast.success('Mutasi bahan berhasil dibatalkan dan stok dikembalikan.')
    isCancelDialogOpen.value = false
    router.push('/inventory/material-mutations')
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal membatalkan mutasi bahan.'
    toast.error(message)
  } finally {
    isCancelling.value = false
  }
}
</script>

<template>
  <div class="space-y-6 print:m-0 print:p-0">
    <!-- Header -->
    <AppPageHeader
      :title="`Mutasi Bahan: ${mutation?.kode || '...'}`"
      :description="`Detail dokumen pengeluaran bahan baku (${mutation?.tanggal ? formatDate(mutation.tanggal) : ''})`"
      :breadcrumbs="[
        { label: 'Persediaan', href: '/inventory/materials' },
        { label: 'Mutasi Bahan', href: '/inventory/material-mutations' },
        { label: mutation?.kode || 'Detail Mutasi', current: true }
      ]"
      class="print:hidden"
    >
      <template #actions>
        <div class="flex items-center gap-2">
          <AppButton
            variant="outline"
            size="sm"
            class="text-slate-700 bg-white border-slate-300 hover:bg-slate-50"
            @click="handleBack"
          >
            <ArrowLeft class="w-4 h-4 mr-1.5" />
            Kembali
          </AppButton>

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
            Cetak
          </AppButton>

          <AppButton
            v-if="mutation?.status === 0 && canUpdate"
            variant="outline"
            size="sm"
            class="text-slate-700 bg-white border-slate-300 hover:bg-slate-50"
            @click="handleEdit"
          >
            <Edit2 class="w-4 h-4 mr-1.5 text-amber-600" />
            Edit Mutasi
          </AppButton>

          <AppButton
            v-if="mutation?.status === 0 && canUpdate"
            variant="primary"
            size="sm"
            class="bg-teal-600 hover:bg-teal-700 text-white font-medium"
            :loading="isPosting"
            @click="handlePostNow"
          >
            <Send class="w-4 h-4 mr-1.5" />
            Posting Mutasi Sekarang
          </AppButton>

          <AppButton
            v-if="mutation?.status === 0 && canDelete"
            variant="outline"
            size="sm"
            class="text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100"
            @click="isCancelDialogOpen = true"
          >
            <Trash2 class="w-4 h-4 mr-1.5" />
            Batalkan Mutasi
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <!-- Skeleton Loading -->
    <div
      v-if="isLoading"
      class="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center text-xs text-slate-400"
    >
      Memuat rincian mutasi bahan...
    </div>

    <template v-else-if="mutation">
      <!-- Printable Document Header (visible on print) -->
      <div class="hidden print:block mb-6 border-b border-slate-300 pb-4">
        <div class="flex justify-between items-start">
          <div>
            <h1 class="text-xl font-bold text-teal-800">IMPACT FURNITURE</h1>
            <p class="text-xs text-slate-500">Enterprise Management Information System</p>
          </div>
          <div class="text-right">
            <h2 class="text-base font-bold text-slate-800">BUKTI MUTASI BAHAN</h2>
            <p class="font-mono text-xs text-slate-600 font-semibold">{{ mutation.kode }}</p>
          </div>
        </div>
      </div>

      <!-- Overview Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 print:grid-cols-4">
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div class="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Nomor Mutasi
          </div>
          <div class="font-mono font-bold text-sm text-teal-700">{{ mutation.kode }}</div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div class="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Tanggal Mutasi
          </div>
          <div class="font-bold text-sm text-slate-800">{{ formatDate(mutation.tanggal) }}</div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div class="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Status</div>
          <div>
            <MaterialMutationStatusBadge :status="mutation.status" size="md" />
          </div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div class="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Dibuat Oleh
          </div>
          <div class="font-semibold text-sm text-slate-700">
            {{ mutation.created_by_name || 'Administrator' }}
          </div>
        </div>
      </div>

      <!-- Keterangan General Note -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
          Keterangan / Keperluan Umum
        </div>
        <div class="text-xs text-slate-800">
          {{ mutation.keterangan || 'Tidak ada catatan umum.' }}
        </div>
      </div>

      <!-- Items Table Card -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div
          class="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <Layers class="w-4 h-4 text-teal-600" />
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Rincian Bahan Yang Dimutasi
            </h3>
          </div>
          <span class="text-xs text-slate-500 font-mono">
            {{ mutation.total_items }} jenis bahan baku
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th class="w-10 px-3 py-2 text-center">No</th>
                <th class="w-32 px-3 py-2">Kode Bahan</th>
                <th class="px-3 py-2">Nama Bahan Baku</th>
                <th class="w-36 px-3 py-2">Gudang Asal</th>
                <th class="w-24 px-3 py-2 text-right">Qty Mutasi</th>
                <th class="w-20 px-3 py-2 text-center">Satuan</th>
                <th class="w-48 px-3 py-2">Keterangan / PIC</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr v-for="(item, idx) in mutation.items" :key="item.id" class="hover:bg-slate-50/70">
                <td class="px-3 py-2 text-center font-mono text-slate-500 bg-slate-50/30">
                  {{ idx + 1 }}
                </td>
                <td class="px-3 py-2 font-mono font-semibold text-slate-700">
                  {{ item.kode_bahan }}
                </td>
                <td class="px-3 py-2 font-medium text-slate-900">
                  {{ item.nama_bahan }}
                </td>
                <td class="px-3 py-2 text-slate-600">
                  {{ item.nama_gudang }}
                </td>
                <td class="px-3 py-2 text-right font-mono font-bold text-teal-700 text-xs">
                  {{ formatNumber(item.qty) }}
                </td>
                <td class="px-3 py-2 text-center font-mono text-slate-600">
                  {{ item.nama_satuan }}
                </td>
                <td class="px-3 py-2 text-slate-600">
                  {{ item.keterangan_detail || '-' }}
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-slate-50 font-bold border-t border-slate-200 text-slate-800">
              <tr>
                <td colspan="4" class="px-3 py-2.5 text-right uppercase text-[11px] text-slate-600">
                  Total Kuantitas Dimutasi:
                </td>
                <td class="px-3 py-2.5 text-right font-mono text-teal-800">
                  {{ formatNumber(mutation.total_qty) }}
                </td>
                <td colspan="2" class="px-3 py-2.5" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Signature Section (visible on print) -->
      <div class="hidden print:grid grid-cols-3 gap-6 pt-12 text-center text-xs">
        <div>
          <p class="font-medium text-slate-700 mb-16">Petugas Gudang</p>
          <p class="font-semibold text-slate-800 border-t border-slate-400 pt-1">
            ( ___________________ )
          </p>
        </div>
        <div>
          <p class="font-medium text-slate-700 mb-16">Kepala Produksi / SPV</p>
          <p class="font-semibold text-slate-800 border-t border-slate-400 pt-1">
            ( ___________________ )
          </p>
        </div>
        <div>
          <p class="font-medium text-slate-700 mb-16">Penerima Bahan</p>
          <p class="font-semibold text-slate-800 border-t border-slate-400 pt-1">
            ( ___________________ )
          </p>
        </div>
      </div>
    </template>

    <!-- Cancel / Delete Confirmation Dialog -->
    <AppConfirmDialog
      v-model="isCancelDialogOpen"
      title="Batalkan Mutasi Bahan"
      message="Apakah Anda yakin ingin membatalkan mutasi bahan ini? Jika mutasi berstatus Selesai, kuantitas bahan yang telah dipotong akan otomatis dikembalikan ke stok gudang."
      confirm-text="Ya, Batalkan Mutasi"
      cancel-text="Tutup"
      variant="danger"
      @confirm="handleCancelMutation"
      @cancel="isCancelDialogOpen = false"
    />
  </div>
</template>
