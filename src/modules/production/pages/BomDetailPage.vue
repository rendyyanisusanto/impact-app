<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import BomMaterialRequirements from '../components/BomMaterialRequirements.vue'
import { bomService } from '../services/bom.service'
import type { BomTemplateWithItems } from '../types/bom.types'
import { exportBomDetailPdf } from '../utils/bom-export'
import { usePermission } from '@/shared/composables/usePermission'
import { useToast } from '@/shared/composables/useToast'
import { formatNumber, formatCurrency } from '@/shared/utils/formatters'
import {
  ArrowLeft,
  Edit2,
  Copy,
  FileText,
  Printer,
  Trash2,
  Layers,
  CheckCircle2,
  Package,
  DollarSign
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const { hasPermission } = usePermission()

const canCreate = computed(() => hasPermission('production', 'create'))
const canUpdate = computed(() => hasPermission('production', 'update'))
const canDelete = computed(() => hasPermission('production', 'delete'))

const templateId = Number(route.params.id)
const bom = ref<BomTemplateWithItems | null>(null)
const isLoading = ref(true)

// Duplicate dialog state
const isDuplicateDialogOpen = ref(false)
const isDuplicating = ref(false)

// Delete dialog state
const isDeleteDialogOpen = ref(false)
const isDeleting = ref(false)

async function loadDetail() {
  isLoading.value = true
  try {
    const data = await bomService.getTemplateById(templateId)
    if (!data) {
      toast.error('Template produk tidak ditemukan.')
      router.push('/production/bom')
      return
    }
    bom.value = data
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat template produk.'
    toast.error(message)
    router.push('/production/bom')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadDetail()
})

function handleBack() {
  router.push('/production/bom')
}

function handleEdit() {
  router.push(`/production/bom/${templateId}/edit`)
}

function handlePrint() {
  window.print()
}

function handleExportPdf() {
  if (!bom.value) return
  exportBomDetailPdf(bom.value)
  toast.success('File PDF BoM berhasil diunduh.')
}

async function handleConfirmDuplicate() {
  if (!bom.value) return
  isDuplicating.value = true
  try {
    const duplicated = await bomService.duplicateTemplate(bom.value.id)
    toast.success(`Template berhasil disalin dengan kode baru: ${duplicated.kode}`)
    isDuplicateDialogOpen.value = false
    router.push(`/production/bom/${duplicated.id}/edit`)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menduplikasi template.'
    toast.error(message)
  } finally {
    isDuplicating.value = false
  }
}

async function handleConfirmDelete() {
  if (!bom.value) return
  isDeleting.value = true
  try {
    await bomService.deleteTemplate(bom.value.id)
    toast.success(`Template ${bom.value.kode} berhasil dinonaktifkan.`)
    isDeleteDialogOpen.value = false
    router.push('/production/bom')
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menonaktifkan template.'
    toast.error(message)
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <AppPageHeader
      :title="`Detail Template: ${bom?.kode || '...'}`"
      subtitle="Spesifikasi Bill of Materials & Komposisi Resep Produk Furniture"
      :breadcrumbs="[
        { label: 'Produksi', to: '/production/bom' },
        { label: 'Template Produk (BoM)', to: '/production/bom' },
        { label: bom?.kode || 'Detail' }
      ]"
    >
      <template #actions>
        <div class="flex items-center gap-2 flex-wrap">
          <AppButton
            variant="outline"
            size="sm"
            class="text-slate-600 bg-white border-slate-300 hover:bg-slate-50"
            @click="handleBack"
          >
            <ArrowLeft class="w-4 h-4 mr-1.5" />
            Kembali
          </AppButton>

          <!-- Edit Button -->
          <AppButton
            v-if="canUpdate"
            variant="outline"
            size="sm"
            class="text-amber-700 bg-white border-amber-300 hover:bg-amber-50"
            @click="handleEdit"
          >
            <Edit2 class="w-4 h-4 mr-1.5" />
            Edit BoM
          </AppButton>

          <!-- Duplicate Button -->
          <AppButton
            v-if="canCreate"
            variant="outline"
            size="sm"
            class="text-blue-700 bg-white border-blue-300 hover:bg-blue-50"
            @click="isDuplicateDialogOpen = true"
          >
            <Copy class="w-4 h-4 mr-1.5" />
            Duplikasi
          </AppButton>

          <!-- Export PDF -->
          <AppButton
            variant="outline"
            size="sm"
            class="text-slate-700 bg-white border-slate-300 hover:bg-slate-50"
            @click="handleExportPdf"
          >
            <FileText class="w-4 h-4 mr-1.5 text-rose-600" />
            Export PDF
          </AppButton>

          <!-- Print -->
          <AppButton
            variant="outline"
            size="sm"
            class="text-slate-700 bg-white border-slate-300 hover:bg-slate-50"
            @click="handlePrint"
          >
            <Printer class="w-4 h-4 mr-1.5 text-slate-600" />
            Cetak
          </AppButton>

          <!-- Deactivate / Delete Button -->
          <AppButton
            v-if="canDelete && bom?.status_aktif === 1"
            variant="outline"
            size="sm"
            class="text-rose-700 bg-white border-rose-300 hover:bg-rose-50"
            @click="isDeleteDialogOpen = true"
          >
            <Trash2 class="w-4 h-4 mr-1.5" />
            Nonaktifkan
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <div v-if="isLoading" class="p-12 text-center text-slate-500 bg-white rounded-lg border">
      Memuat rincian template produk...
    </div>

    <template v-else-if="bom">
      <!-- Top KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          class="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex items-center gap-4"
        >
          <div class="p-3 bg-teal-50 rounded-lg text-teal-600">
            <Layers class="w-6 h-6" />
          </div>
          <div>
            <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Jenis Bahan
            </p>
            <p class="text-xl font-bold font-mono text-slate-800">{{ bom.total_items }} jenis</p>
          </div>
        </div>

        <div
          class="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex items-center gap-4"
        >
          <div class="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <DollarSign class="w-6 h-6" />
          </div>
          <div>
            <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Est. Biaya Bahan per Unit
            </p>
            <p class="text-lg font-bold font-mono text-emerald-700 truncate">
              {{ formatCurrency(bom.total_estimasi_biaya) }}
            </p>
          </div>
        </div>

        <div
          class="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex items-center gap-4"
        >
          <div class="p-3 bg-blue-50 rounded-lg text-blue-600">
            <Package class="w-6 h-6" />
          </div>
          <div>
            <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Produk Furniture
            </p>
            <p class="text-sm font-bold text-slate-800 truncate" :title="bom.nama_produk">
              [{{ bom.kode_produk }}] {{ bom.nama_produk }}
            </p>
          </div>
        </div>

        <div
          class="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex items-center gap-4"
        >
          <div class="p-3 bg-slate-50 rounded-lg text-slate-600">
            <CheckCircle2 class="w-6 h-6" />
          </div>
          <div>
            <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Status Template
            </p>
            <p class="text-sm font-bold text-emerald-700">
              {{ bom.status_aktif === 1 ? 'Aktif Digunakan' : 'Nonaktif / Arsip' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Metadata Card -->
      <div class="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3
            class="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2"
          >
            <FileText class="w-4 h-4 text-teal-600" />
            Informasi Dokumen Template
          </h3>
          <span
            v-if="bom.status_aktif === 1"
            class="inline-flex items-center gap-1 font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs"
          >
            <CheckCircle2 class="w-3.5 h-3.5" />
            <span>Aktif</span>
          </span>
          <span
            v-else
            class="inline-flex items-center gap-1 font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 text-xs"
          >
            <span>Nonaktif</span>
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <span class="text-slate-500 block">Nomor / Kode Template</span>
            <span class="font-mono font-bold text-slate-800 text-sm">{{ bom.kode }}</span>
          </div>

          <div>
            <span class="text-slate-500 block">Nama Template</span>
            <span class="font-semibold text-slate-900 text-sm">{{ bom.nama }}</span>
          </div>

          <div>
            <span class="text-slate-500 block">Produk Furniture</span>
            <span class="font-medium text-slate-900">
              [{{ bom.kode_produk }}] {{ bom.nama_produk }}
            </span>
          </div>

          <div>
            <span class="text-slate-500 block">Satuan Produk</span>
            <span class="font-medium text-slate-800">{{ bom.satuan_produk || 'Pcs' }}</span>
          </div>
        </div>
      </div>

      <!-- Composition Table -->
      <div class="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div
          class="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between"
        >
          <h3
            class="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2"
          >
            <Layers class="w-4 h-4 text-teal-600" />
            Rincian Komposisi Bahan Baku (per 1 Unit Produk)
          </h3>
          <span class="text-xs text-slate-500 font-mono">
            {{ bom.items.length }} jenis bahan baku
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
              <tr>
                <th class="w-10 px-3 py-2 text-center border-r border-slate-200">No</th>
                <th class="w-28 px-3 py-2 border-r border-slate-200">Kode Bahan</th>
                <th class="min-w-[200px] px-3 py-2 border-r border-slate-200">Nama Bahan Baku</th>
                <th class="w-20 px-3 py-2 text-center border-r border-slate-200">Satuan Pakai</th>
                <th
                  class="w-28 px-3 py-2 text-right border-r border-slate-200 bg-amber-50/70 font-bold text-amber-900"
                >
                  Qty per Produk
                </th>
                <th class="w-24 px-3 py-2 text-right border-r border-slate-200 bg-slate-50">
                  Stok Gudang
                </th>
                <th class="w-28 px-3 py-2 text-right border-r border-slate-200">Harga Satuan</th>
                <th class="w-32 px-3 py-2 text-right font-bold">Subtotal Biaya</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr
                v-for="(item, idx) in bom.items"
                :key="item.id"
                class="hover:bg-slate-50/60 transition-colors"
              >
                <td
                  class="px-3 py-2 text-center font-mono text-slate-500 border-r border-slate-200 bg-slate-50/30"
                >
                  {{ idx + 1 }}
                </td>
                <td
                  class="px-3 py-2 font-mono font-semibold text-slate-800 border-r border-slate-200"
                >
                  {{ item.kode_bahan }}
                </td>
                <td class="px-3 py-2 font-medium text-slate-900 border-r border-slate-200">
                  {{ item.nama_bahan }}
                </td>
                <td
                  class="px-3 py-2 text-center font-mono text-slate-600 border-r border-slate-200"
                >
                  {{ item.nama_satuan }}
                </td>
                <td
                  class="px-3 py-2 text-right font-mono font-bold text-slate-900 border-r border-slate-200 bg-amber-50/30"
                >
                  {{ formatNumber(item.qty) }}
                </td>
                <td
                  class="px-3 py-2 text-right font-mono text-slate-600 border-r border-slate-200 bg-slate-50/40"
                >
                  {{ formatNumber(item.stok_tersedia) }}
                </td>
                <td class="px-3 py-2 text-right font-mono text-slate-700 border-r border-slate-200">
                  {{ formatCurrency(item.harga_satuan) }}
                </td>
                <td class="px-3 py-2 text-right font-mono font-bold text-slate-900">
                  {{ formatCurrency(item.estimasi_biaya) }}
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-slate-100 font-semibold border-t-2 border-slate-300 text-slate-800">
              <tr>
                <td colspan="4" class="px-3 py-2.5 text-right font-bold border-r border-slate-200">
                  Total Estimasi Biaya Bahan per 1 Unit Produk:
                </td>
                <td
                  class="px-3 py-2.5 text-right font-mono font-bold border-r border-slate-200 text-slate-900"
                >
                  {{ formatNumber(bom.items.reduce((s, i) => s + i.qty, 0)) }}
                </td>
                <td
                  colspan="2"
                  class="px-3 py-2.5 border-r border-slate-200 text-slate-500 text-[11px] text-center"
                >
                  {{ bom.total_items }} jenis bahan
                </td>
                <td class="px-3 py-2.5 text-right font-mono font-bold text-teal-800 text-sm">
                  {{ formatCurrency(bom.total_estimasi_biaya) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Task 5: Material Requirements Calculation Simulation Panel -->
      <BomMaterialRequirements :bom="bom" />
    </template>

    <!-- Confirm Delete / Deactivate Dialog -->
    <AppConfirmDialog
      v-model="isDeleteDialogOpen"
      title="Nonaktifkan Template Produk"
      :message="`Apakah Anda yakin ingin menonaktifkan template '${bom?.kode} - ${bom?.nama}'? Template ini tidak akan dihapus dari histori produksi, tetapi tidak dapat dipilih untuk pesanan produksi baru.`"
      confirm-text="Ya, Nonaktifkan Template"
      variant="danger"
      @confirm="handleConfirmDelete"
    />

    <!-- Confirm Duplicate Dialog -->
    <AppConfirmDialog
      v-model="isDuplicateDialogOpen"
      title="Duplikasi Template Produk"
      :message="`Buat salinan template '${bom?.kode} - ${bom?.nama}'? Seluruh rincian komposisi bahan akan disalin ke template baru.`"
      confirm-text="Ya, Duplikasi Template"
      variant="primary"
      @confirm="handleConfirmDuplicate"
    />
  </div>
</template>
