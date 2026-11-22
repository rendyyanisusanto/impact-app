<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Truck,
  Plus,
  ShoppingBag,
  Search,
  FileSpreadsheet,
  FileText,
  RotateCw,
  Eye,
  Edit2,
  Printer,
  CheckCircle,
  XCircle,
  Camera
} from 'lucide-vue-next'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppSkeleton from '@/shared/components/ui/AppSkeleton.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import DeliveryNoteProofModal from '../components/DeliveryNoteProofModal.vue'
import { deliveryNoteService } from '../services/delivery-note.service'
import type { DeliveryNoteListItem, DeliveryProofPayload } from '../types/delivery-note.types'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import {
  exportDeliveryNoteListExcel,
  exportDeliveryNoteListPdf
} from '../utils/delivery-note-export'
import { useToast } from '@/shared/composables/useToast'
import { usePermission } from '@/shared/composables/usePermission'

const router = useRouter()
const toast = useToast()
const { hasPermission } = usePermission()

const canCreate = computed(
  () => hasPermission('delivery', 'create') || hasPermission('*', 'create')
)
const canUpdate = computed(
  () => hasPermission('delivery', 'update') || hasPermission('*', 'update')
)

const deliveryNotes = ref<DeliveryNoteListItem[]>([])
const isLoading = ref(true)

// Filters
const searchQuery = ref('')
const shippingStatusFilter = ref<string>('ALL')
const documentStatusFilter = ref<string>('ALL')
const startDate = ref('')
const endDate = ref('')
const selectedIds = ref<number[]>([])

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

// Modal states
const isProofModalOpen = ref(false)
const proofModalMode = ref<'view' | 'confirm'>('view')
const selectedDeliveryForProof = ref<DeliveryNoteListItem | null>(null)
const isSubmittingProof = ref(false)

// Cancel dialog
const isCancelDialogOpen = ref(false)
const cancelTargetNote = ref<DeliveryNoteListItem | null>(null)
const cancelReason = ref('')
const isCancelling = ref(false)

const loadData = async () => {
  isLoading.value = true
  try {
    const list = await deliveryNoteService.getAllDeliveryNotes()
    deliveryNotes.value = list
  } catch (err) {
    toast.error('Gagal memuat daftar Surat Jalan.')
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

const filteredNotes = computed(() => {
  let res = [...deliveryNotes.value]

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    res = res.filter(
      item =>
        item.kode.toLowerCase().includes(q) ||
        item.so_kode.toLowerCase().includes(q) ||
        item.customer_nama.toLowerCase().includes(q) ||
        item.nama_pengirim.toLowerCase().includes(q) ||
        (item.keterangan && item.keterangan.toLowerCase().includes(q)) ||
        (item.penerima && item.penerima.toLowerCase().includes(q))
    )
  }

  if (shippingStatusFilter.value !== 'ALL') {
    const num = Number(shippingStatusFilter.value)
    res = res.filter(item => item.status_kirim === num)
  }

  if (documentStatusFilter.value !== 'ALL') {
    const num = Number(documentStatusFilter.value)
    res = res.filter(item => item.status_dokumen === num)
  }

  if (startDate.value) {
    res = res.filter(item => item.tanggal >= startDate.value)
  }

  if (endDate.value) {
    res = res.filter(item => item.tanggal <= endDate.value)
  }

  return res
})

const totalPages = computed(() => Math.ceil(filteredNotes.value.length / pageSize.value) || 1)

const paginatedNotes = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredNotes.value.slice(start, start + pageSize.value)
})

const isAllSelected = computed(() => {
  return (
    paginatedNotes.value.length > 0 &&
    paginatedNotes.value.every(item => selectedIds.value.includes(item.id))
  )
})

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = selectedIds.value.filter(id => !paginatedNotes.value.some(p => p.id === id))
  } else {
    const toAdd = paginatedNotes.value.map(p => p.id).filter(id => !selectedIds.value.includes(id))
    selectedIds.value.push(...toAdd)
  }
}

const toggleSelectItem = (id: number) => {
  const idx = selectedIds.value.indexOf(id)
  if (idx > -1) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
  }
}

// Navigation actions
const navigateToCreate = () => {
  router.push('/delivery/notes/create')
}

const navigateToPickup = () => {
  router.push('/delivery/notes/pickup/create')
}

const viewDetail = (id: number) => {
  router.push(`/delivery/notes/${id}`)
}

const editDelivery = (id: number) => {
  router.push(`/delivery/notes/${id}/edit`)
}

const printDelivery = (id: number) => {
  router.push(`/delivery/notes/${id}/print`)
}

// Proof modal triggers
const openViewProof = (item: DeliveryNoteListItem) => {
  selectedDeliveryForProof.value = item
  proofModalMode.value = 'view'
  isProofModalOpen.value = true
}

const openConfirmProof = (item: DeliveryNoteListItem) => {
  selectedDeliveryForProof.value = item
  proofModalMode.value = 'confirm'
  isProofModalOpen.value = true
}

const handleConfirmDelivery = async (payload: DeliveryProofPayload) => {
  if (!selectedDeliveryForProof.value) return
  isSubmittingProof.value = true
  try {
    await deliveryNoteService.confirmDelivery(selectedDeliveryForProof.value.id, payload)
    toast.success('Pengiriman berhasil dikonfirmasi sebagai TERKIRIM!')
    isProofModalOpen.value = false
    await loadData()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengonfirmasi pengiriman.'
    toast.error(msg)
  } finally {
    isSubmittingProof.value = false
  }
}

// Cancel actions
const promptCancel = (item: DeliveryNoteListItem) => {
  cancelTargetNote.value = item
  cancelReason.value = ''
  isCancelDialogOpen.value = true
}

const confirmCancel = async () => {
  if (!cancelTargetNote.value) return
  isCancelling.value = true
  try {
    await deliveryNoteService.cancelDeliveryNote(cancelTargetNote.value.id, cancelReason.value)
    toast.success(`Surat Jalan '${cancelTargetNote.value.kode}' berhasil dibatalkan.`)
    isCancelDialogOpen.value = false
    await loadData()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal membatalkan Surat Jalan.'
    toast.error(msg)
  } finally {
    isCancelling.value = false
  }
}

// Export actions
const handleExportExcel = () => {
  const items = filteredNotes.value
  if (items.length === 0) {
    toast.warning('Tidak ada data Surat Jalan untuk diekspor.')
    return
  }
  exportDeliveryNoteListExcel(items)
  toast.success('Daftar Surat Jalan berhasil diekspor ke Excel.')
}

const handleExportPdf = () => {
  const items = filteredNotes.value
  if (items.length === 0) {
    toast.warning('Tidak ada data Surat Jalan untuk diekspor.')
    return
  }
  exportDeliveryNoteListPdf(items)
  toast.success('Daftar Surat Jalan berhasil diekspor ke PDF.')
}

const getShippingBadgeClass = (status: number, isPickup: number) => {
  if (isPickup === 1 || status === 2) {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200'
  }
  if (status === 1) {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200'
  }
  return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200'
}

const getDocumentBadgeClass = (status: number) => {
  if (status === 2) {
    return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200'
  }
  if (status === 1) {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200'
  }
  return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header & Action Toolbar Matching Screenshot 1 -->
    <AppPageHeader
      title="Surat Jalan"
      :breadcrumbs="[
        { label: 'Beranda', to: '/' },
        { label: 'Pengiriman', to: '/delivery/notes' },
        { label: 'Surat Jalan' }
      ]"
    >
      <template #actions>
        <div class="flex flex-wrap items-center gap-2.5">
          <AppButton
            v-if="canCreate"
            variant="primary"
            data-test="btn-create-delivery"
            @click="navigateToCreate"
          >
            <template #icon>
              <Plus class="w-4 h-4" />
            </template>
            Tambah Surat Jalan
          </AppButton>

          <AppButton
            v-if="canCreate"
            variant="outline"
            class="border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
            data-test="btn-create-pickup"
            @click="navigateToPickup"
          >
            <template #icon>
              <ShoppingBag class="w-4 h-4 text-indigo-500" />
            </template>
            Pengambilan Sendiri
          </AppButton>

          <AppButton variant="outline" data-test="btn-export-pdf" @click="handleExportPdf">
            <template #icon>
              <FileText class="w-4 h-4 text-rose-500" />
            </template>
            Export PDF
          </AppButton>

          <AppButton variant="outline" data-test="btn-export-excel" @click="handleExportExcel">
            <template #icon>
              <FileSpreadsheet class="w-4 h-4 text-emerald-600" />
            </template>
            Export Excel
          </AppButton>

          <AppButton
            variant="ghost"
            class="p-2"
            title="Refresh Data"
            data-test="btn-refresh"
            @click="loadData"
          >
            <RotateCw class="w-4 h-4" />
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <!-- Filter & Search Toolbar -->
    <div
      class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-3"
    >
      <!-- Search Input -->
      <div class="relative flex-1 min-w-[240px]">
        <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari No. SJ, No. SO, Customer, Pengirim..."
          class="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
          data-test="input-search"
        />
      </div>

      <!-- Shipping Status Filter -->
      <div class="w-44">
        <select
          v-model="shippingStatusFilter"
          class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          data-test="filter-status-kirim"
        >
          <option value="ALL">Status Kirim (Semua)</option>
          <option value="0">BELUM DIKIRIM</option>
          <option value="1">TERKIRIM</option>
          <option value="2">AMBIL SENDIRI</option>
        </select>
      </div>

      <!-- Document Status Filter -->
      <div class="w-44">
        <select
          v-model="documentStatusFilter"
          class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          data-test="filter-status-dokumen"
        >
          <option value="ALL">Status Dokumen (Semua)</option>
          <option value="0">DRAFT</option>
          <option value="1">SUCCEEDED</option>
          <option value="2">BATAL</option>
        </select>
      </div>

      <!-- Date Filters -->
      <div class="flex items-center gap-1.5 text-xs">
        <input
          v-model="startDate"
          type="date"
          class="px-2.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          title="Tanggal Mulai"
        />
        <span class="text-gray-400">s/d</span>
        <input
          v-model="endDate"
          type="date"
          class="px-2.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          title="Tanggal Akhir"
        />
      </div>
    </div>

    <!-- Main 13-Column DataTable Matching Screenshot 1 -->
    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <div v-if="isLoading" class="p-8 space-y-4">
        <AppSkeleton class="h-8 w-full" />
        <AppSkeleton class="h-10 w-full" />
        <AppSkeleton class="h-10 w-full" />
        <AppSkeleton class="h-10 w-full" />
      </div>

      <div v-else-if="filteredNotes.length === 0" class="py-16 text-center text-gray-400">
        <Truck class="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
        <p class="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Belum ada data Surat Jalan
        </p>
        <p class="text-xs text-gray-400 mt-1">
          Buat Surat Jalan baru atau sesuaikan filter pencarian Anda.
        </p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs" data-test="delivery-notes-table">
          <thead>
            <tr
              class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 text-gray-700 dark:text-gray-300 font-semibold uppercase tracking-wider text-[11px]"
            >
              <!-- 1. Checkbox -->
              <th class="py-3.5 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  @change="toggleSelectAll"
                />
              </th>
              <!-- 2. Tanggal -->
              <th class="py-3.5 px-3 whitespace-nowrap">Tanggal</th>
              <!-- 3. Kode -->
              <th class="py-3.5 px-3 whitespace-nowrap">Kode</th>
              <!-- 4. No. SO -->
              <th class="py-3.5 px-3 whitespace-nowrap">No. SO</th>
              <!-- 5. Customer -->
              <th class="py-3.5 px-3 min-w-[150px]">Customer</th>
              <!-- 6. Keterangan -->
              <th class="py-3.5 px-3 min-w-[140px]">Keterangan</th>
              <!-- 7. QTY Pemesanan -->
              <th class="py-3.5 px-2.5 text-center whitespace-nowrap">QTY Pemesanan</th>
              <!-- 8. QTY Pengiriman -->
              <th class="py-3.5 px-2.5 text-center whitespace-nowrap">QTY Pengiriman</th>
              <!-- 9. Total -->
              <th class="py-3.5 px-3 text-right whitespace-nowrap">Total</th>
              <!-- 10. Status Pengiriman -->
              <th class="py-3.5 px-3 text-center whitespace-nowrap">Status Pengiriman</th>
              <!-- 11. Bukti Pengiriman -->
              <th class="py-3.5 px-3 text-center whitespace-nowrap">Bukti Pengiriman</th>
              <!-- 12. Status Dokumen -->
              <th class="py-3.5 px-3 text-center whitespace-nowrap">Status Dokumen</th>
              <!-- 13. Actions -->
              <th class="py-3.5 px-3 text-center w-28 whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700/60 bg-white dark:bg-gray-800">
            <tr
              v-for="item in paginatedNotes"
              :key="item.id"
              class="hover:bg-gray-50/70 dark:hover:bg-gray-700/30 transition-colors"
              :class="
                selectedIds.includes(item.id) ? 'bg-primary-50/20 dark:bg-primary-950/10' : ''
              "
              data-test="delivery-row"
            >
              <!-- 1. Checkbox -->
              <td class="py-3 px-3 text-center">
                <input
                  type="checkbox"
                  :checked="selectedIds.includes(item.id)"
                  class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  @change="toggleSelectItem(item.id)"
                />
              </td>

              <!-- 2. Tanggal -->
              <td class="py-3 px-3 whitespace-nowrap text-gray-600 dark:text-gray-300 font-medium">
                {{ formatDate(item.tanggal) }}
              </td>

              <!-- 3. Kode -->
              <td class="py-3 px-3 whitespace-nowrap">
                <button
                  type="button"
                  class="font-mono font-semibold text-primary-600 hover:text-primary-800 hover:underline dark:text-primary-400"
                  data-test="link-detail-kode"
                  @click="viewDetail(item.id)"
                >
                  {{ item.kode }}
                </button>
              </td>

              <!-- 4. No. SO -->
              <td class="py-3 px-3 whitespace-nowrap">
                <span class="font-mono text-gray-700 dark:text-gray-300 font-medium">
                  {{ item.so_kode }}
                </span>
              </td>

              <!-- 5. Customer -->
              <td class="py-3 px-3 font-medium text-gray-900 dark:text-white">
                {{ item.customer_nama }}
              </td>

              <!-- 6. Keterangan -->
              <td class="py-3 px-3 text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                {{ item.keterangan || '-' }}
              </td>

              <!-- 7. QTY Pemesanan -->
              <td class="py-3 px-2.5 text-center font-semibold text-gray-800 dark:text-gray-200">
                {{ item.qty_pemesanan }}
              </td>

              <!-- 8. QTY Pengiriman -->
              <td class="py-3 px-2.5 text-center font-bold text-primary-600 dark:text-primary-400">
                {{ item.qty_pengiriman }}
              </td>

              <!-- 9. Total -->
              <td
                class="py-3 px-3 text-right font-mono font-semibold text-gray-900 dark:text-white"
              >
                {{ formatCurrency(item.total_pembelian) }}
              </td>

              <!-- 10. Status Pengiriman -->
              <td class="py-3 px-3 text-center whitespace-nowrap">
                <span
                  class="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border"
                  :class="getShippingBadgeClass(item.status_kirim, item.status_ambil)"
                  data-test="badge-status-kirim"
                >
                  {{ item.status_kirim_label }}
                </span>
              </td>

              <!-- 11. Bukti Pengiriman -->
              <td class="py-3 px-3 text-center whitespace-nowrap">
                <button
                  v-if="item.has_bukti"
                  type="button"
                  class="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                  data-test="btn-view-proof"
                  @click="openViewProof(item)"
                >
                  <Camera class="w-3.5 h-3.5" />
                  Lihat
                </button>
                <button
                  v-else-if="item.status_dokumen !== 2"
                  type="button"
                  class="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg bg-gray-100 hover:bg-primary-50 text-gray-600 hover:text-primary-600 transition-colors"
                  title="Upload / Konfirmasi Bukti"
                  data-test="btn-upload-proof"
                  @click="openConfirmProof(item)"
                >
                  <CheckCircle class="w-3.5 h-3.5 text-gray-400 hover:text-primary-600" />
                  Konfirmasi
                </button>
                <span v-else class="text-gray-400 text-[11px]">-</span>
              </td>

              <!-- 12. Status Dokumen -->
              <td class="py-3 px-3 text-center whitespace-nowrap">
                <span
                  class="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border"
                  :class="getDocumentBadgeClass(item.status_dokumen)"
                  data-test="badge-status-dokumen"
                >
                  {{ item.status_dokumen_label }}
                </span>
              </td>

              <!-- 13. Actions Menu -->
              <td class="py-3 px-3 text-center whitespace-nowrap">
                <div class="flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    class="p-1.5 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Lihat Detail"
                    data-test="action-view"
                    @click="viewDetail(item.id)"
                  >
                    <Eye class="w-4 h-4" />
                  </button>

                  <button
                    v-if="item.status_dokumen === 0 && canUpdate"
                    type="button"
                    class="p-1.5 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Edit Surat Jalan"
                    data-test="action-edit"
                    @click="editDelivery(item.id)"
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    class="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Cetak Surat Jalan"
                    data-test="action-print"
                    @click="printDelivery(item.id)"
                  >
                    <Printer class="w-4 h-4" />
                  </button>

                  <button
                    v-if="item.status_dokumen !== 2"
                    type="button"
                    class="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Batalkan Surat Jalan"
                    data-test="action-cancel"
                    @click="promptCancel(item)"
                  >
                    <XCircle class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        class="px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500"
      >
        <div>
          Menampilkan {{ paginatedNotes.length }} dari {{ filteredNotes.length }} Surat Jalan
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            :disabled="currentPage === 1"
            class="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 disabled:opacity-40"
            @click="currentPage--"
          >
            Sebelumnya
          </button>
          <span>Halaman {{ currentPage }} dari {{ totalPages }}</span>
          <button
            type="button"
            :disabled="currentPage >= totalPages"
            class="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 disabled:opacity-40"
            @click="currentPage++"
          >
            Selanjutnya
          </button>
        </div>
      </div>
    </div>

    <!-- Proof of Delivery Modal -->
    <DeliveryNoteProofModal
      :is-open="isProofModalOpen"
      :delivery-id="selectedDeliveryForProof?.id || 0"
      :delivery-code="selectedDeliveryForProof?.kode || ''"
      :recipient-name="selectedDeliveryForProof?.penerima || ''"
      :proof-url="selectedDeliveryForProof?.foto_bukti || ''"
      :delivery-note-text="selectedDeliveryForProof?.keterangan || ''"
      :mode="proofModalMode"
      :is-submitting="isSubmittingProof"
      @close="isProofModalOpen = false"
      @confirm="handleConfirmDelivery"
    />

    <!-- Confirm Dialog for Cancellation -->
    <AppConfirmDialog
      v-model="isCancelDialogOpen"
      variant="danger"
      title="Batalkan Surat Jalan"
      :message="`Apakah Anda yakin ingin membatalkan Surat Jalan '${cancelTargetNote?.kode}'? Kuantitas stok produk yang sudah dikurangi akan dikembalikan otomatis ke persediaan.`"
      :confirm-text="'Batalkan Dokumen'"
      :cancel-text="'Kembali'"
      @confirm="confirmCancel"
    />
  </div>
</template>
