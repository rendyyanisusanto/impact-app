<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ArrowLeft,
  Printer,
  Edit2,
  XCircle,
  Camera,
  CheckCircle,
  Truck,
  ExternalLink,
  PackageCheck
} from 'lucide-vue-next'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppSkeleton from '@/shared/components/ui/AppSkeleton.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import DeliveryNoteSpreadsheet from '../components/DeliveryNoteSpreadsheet.vue'
import DeliveryNoteProofModal from '../components/DeliveryNoteProofModal.vue'
import { deliveryNoteService } from '../services/delivery-note.service'
import type { DeliveryNoteWithDetails, DeliveryProofPayload } from '../types/delivery-note.types'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import {
  resolveShippingStatusLabel,
  resolveDocumentStatusLabel
} from '../utils/delivery-note-calculations'
import { useToast } from '@/shared/composables/useToast'
import { usePermission } from '@/shared/composables/usePermission'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const { hasPermission } = usePermission()

const canUpdate = computed(
  () => hasPermission('delivery', 'update') || hasPermission('*', 'update')
)

const deliveryId = computed(() => Number(route.params.id))
const delivery = ref<DeliveryNoteWithDetails | null>(null)
const isLoading = ref(true)

// Modals
const isProofModalOpen = ref(false)
const proofModalMode = ref<'view' | 'confirm'>('view')
const isSubmittingProof = ref(false)

const isCancelDialogOpen = ref(false)
const cancelReason = ref('')
const isCancelling = ref(false)

const loadDelivery = async () => {
  const idNum = deliveryId.value
  if (!idNum || isNaN(idNum)) {
    isLoading.value = false
    return
  }

  isLoading.value = true
  try {
    const data = await deliveryNoteService.getDeliveryNoteById(idNum)
    delivery.value = data
  } catch (err) {
    console.error(err)
    toast.error('Gagal memuat Surat Jalan.')
    router.push('/delivery/notes')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadDelivery()
})

const handleConfirmDelivery = async (payload: DeliveryProofPayload) => {
  isSubmittingProof.value = true
  try {
    await deliveryNoteService.confirmDelivery(deliveryId.value, payload)
    toast.success('Pengiriman berhasil dikonfirmasi sebagai TERKIRIM!')
    isProofModalOpen.value = false
    await loadDelivery()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengonfirmasi pengiriman.'
    toast.error(msg)
  } finally {
    isSubmittingProof.value = false
  }
}

const confirmCancel = async () => {
  isCancelling.value = true
  try {
    await deliveryNoteService.cancelDeliveryNote(deliveryId.value, cancelReason.value)
    toast.success(`Surat Jalan '${delivery.value?.kode}' berhasil dibatalkan.`)
    isCancelDialogOpen.value = false
    await loadDelivery()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal membatalkan Surat Jalan.'
    toast.error(msg)
  } finally {
    isCancelling.value = false
  }
}

const getShippingBadgeClass = (status: number, isPickup: number | null) => {
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
  <div class="space-y-6 w-full">
    <!-- Header -->
    <AppPageHeader
      :title="`Detail Surat Jalan: ${delivery?.kode || '...'}`"
      :breadcrumbs="[
        { label: 'Beranda', to: '/' },
        { label: 'Pengiriman', to: '/delivery/notes' },
        { label: 'Surat Jalan', to: '/delivery/notes' },
        { label: delivery?.kode || 'Detail' }
      ]"
    >
      <template #actions>
        <div class="flex flex-wrap items-center gap-2.5">
          <AppButton variant="outline" @click="router.push('/delivery/notes')">
            <template #icon>
              <ArrowLeft class="w-4 h-4" />
            </template>
            Kembali
          </AppButton>

          <AppButton
            v-if="delivery"
            variant="primary"
            data-test="btn-print-detail"
            @click="router.push(`/delivery/notes/${deliveryId}/print`)"
          >
            <template #icon>
              <Printer class="w-4 h-4" />
            </template>
            Cetak Surat Jalan
          </AppButton>

          <AppButton
            v-if="delivery && delivery.status === 0 && canUpdate"
            variant="outline"
            class="border-amber-300 text-amber-700 hover:bg-amber-50"
            data-test="btn-edit-detail"
            @click="router.push(`/delivery/notes/${deliveryId}/edit`)"
          >
            <template #icon>
              <Edit2 class="w-4 h-4" />
            </template>
            Edit
          </AppButton>

          <AppButton
            v-if="delivery && delivery.status_kirim === 0 && delivery.status !== 2"
            variant="outline"
            class="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            data-test="btn-confirm-shipping"
            @click="
              () => {
                proofModalMode = 'confirm'
                isProofModalOpen = true
              }
            "
          >
            <template #icon>
              <CheckCircle class="w-4 h-4" />
            </template>
            Konfirmasi Terkirim
          </AppButton>

          <AppButton
            v-if="delivery && delivery.status !== 2"
            variant="outline"
            class="border-red-300 text-red-700 hover:bg-red-50"
            data-test="btn-cancel-detail"
            @click="isCancelDialogOpen = true"
          >
            <template #icon>
              <XCircle class="w-4 h-4" />
            </template>
            Batalkan
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <div v-if="isLoading" class="p-8 space-y-4">
      <AppSkeleton class="h-32 w-full" />
      <AppSkeleton class="h-64 w-full" />
    </div>

    <template v-else-if="delivery">
      <!-- Status & KPI Summary Banners -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          class="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3"
        >
          <div class="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600">
            <Truck class="w-5 h-5" />
          </div>
          <div>
            <span class="text-xs text-gray-500 dark:text-gray-400 block">Status Pengiriman</span>
            <span
              class="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-bold border"
              :class="getShippingBadgeClass(delivery.status_kirim, delivery.status_ambil)"
              data-test="detail-shipping-status"
            >
              {{ resolveShippingStatusLabel(delivery.status_kirim, delivery.status_ambil) }}
            </span>
          </div>
        </div>

        <div
          class="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3"
        >
          <div class="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600">
            <PackageCheck class="w-5 h-5" />
          </div>
          <div>
            <span class="text-xs text-gray-500 dark:text-gray-400 block">Status Dokumen</span>
            <span
              class="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-bold border"
              :class="getDocumentBadgeClass(delivery.status)"
              data-test="detail-doc-status"
            >
              {{ resolveDocumentStatusLabel(delivery.status) }}
            </span>
          </div>
        </div>

        <div
          class="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <span class="text-xs text-gray-500 dark:text-gray-400 block">Total QTY Dikirim</span>
          <span
            class="text-xl font-black text-primary-600 dark:text-primary-400 mt-1 block font-mono"
          >
            {{ delivery.qty_pengiriman }}
            <span class="text-xs font-normal text-gray-500">unit</span>
          </span>
        </div>

        <div
          class="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <span class="text-xs text-gray-500 dark:text-gray-400 block"
            >Total Nilai Pembelian SO</span
          >
          <span class="text-lg font-bold text-gray-900 dark:text-white mt-1 block font-mono">
            {{ formatCurrency(delivery.total_pembelian) }}
          </span>
        </div>
      </div>

      <!-- Detail Card (Header Info) -->
      <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
          <!-- Sisi Kiri -->
          <div class="space-y-3">
            <h3
              class="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-[11px] border-b pb-2"
            >
              Informasi Pemesanan & Tujuan
            </h3>
            <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700/50">
              <span class="text-gray-500">No. Sales Order:</span>
              <span class="font-mono font-bold text-gray-900 dark:text-white">{{
                delivery.so_kode
              }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700/50">
              <span class="text-gray-500">Nama Customer:</span>
              <span class="font-semibold text-gray-900 dark:text-white">{{
                delivery.customer_nama
              }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700/50">
              <span class="text-gray-500">Alamat Pengiriman:</span>
              <span class="font-medium text-gray-700 dark:text-gray-300 text-right max-w-xs">{{
                delivery.customer_alamat || '-'
              }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700/50">
              <span class="text-gray-500">No. Telepon / HP:</span>
              <span class="font-mono text-gray-700 dark:text-gray-300">{{
                delivery.customer_no_hp || '-'
              }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700/50">
              <span class="text-gray-500">Salesman:</span>
              <span class="font-medium text-gray-800 dark:text-gray-200">{{
                delivery.sales_nama
              }}</span>
            </div>
          </div>

          <!-- Sisi Kanan -->
          <div class="space-y-3">
            <h3
              class="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-[11px] border-b pb-2"
            >
              Informasi Surat Jalan & Ekspedisi
            </h3>
            <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700/50">
              <span class="text-gray-500">No. Surat Jalan:</span>
              <span class="font-mono font-bold text-primary-600 dark:text-primary-400">{{
                delivery.kode
              }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700/50">
              <span class="text-gray-500">Tanggal Pengiriman:</span>
              <span class="font-medium text-gray-900 dark:text-white">{{
                formatDate(delivery.tanggal)
              }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700/50">
              <span class="text-gray-500">
                {{ delivery.status_ambil === 1 ? 'Pengambil Barang:' : 'Pengemudi / Ekspedisi:' }}
              </span>
              <span class="font-semibold text-gray-900 dark:text-white">{{
                delivery.nama_pengirim || '-'
              }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700/50">
              <span class="text-gray-500">Penerima Barang:</span>
              <span class="font-semibold text-emerald-700 dark:text-emerald-400">{{
                delivery.penerima || 'Belum Diterima'
              }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700/50">
              <span class="text-gray-500">Catatan / Keterangan:</span>
              <span class="italic text-gray-700 dark:text-gray-300 text-right max-w-xs">{{
                delivery.keterangan || '-'
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Proof of Delivery Section if exists -->
      <div
        v-if="delivery.foto_bukti"
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-emerald-200 dark:border-emerald-800/50 p-6"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <Camera class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 class="text-sm font-bold text-gray-900 dark:text-white">Bukti Penerimaan Barang</h3>
          </div>
          <button
            type="button"
            class="text-xs font-semibold text-primary-600 hover:text-primary-800 flex items-center gap-1"
            @click="
              () => {
                proofModalMode = 'view'
                isProofModalOpen = true
              }
            "
          >
            <ExternalLink class="w-3.5 h-3.5" />
            Buka Ukuran Penuh
          </button>
        </div>

        <div class="flex flex-col sm:flex-row items-start gap-6">
          <div
            class="w-full sm:w-64 h-48 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 shrink-0"
          >
            <img
              :src="delivery.foto_bukti"
              alt="Bukti Penerimaan"
              class="w-full h-full object-cover"
            />
          </div>
          <div class="space-y-2 text-xs flex-1">
            <p>
              <span class="text-gray-400">Diterima oleh:</span>
              <strong class="text-gray-900 dark:text-white">{{ delivery.penerima || '-' }}</strong>
            </p>
            <p>
              <span class="text-gray-400">Tanggal Serah Terima:</span>
              <strong class="text-gray-900 dark:text-white">{{
                formatDate(delivery.tanggal)
              }}</strong>
            </p>
            <p v-if="delivery.note">
              <span class="text-gray-400">Catatan Penerima:</span>
              <span class="italic text-gray-700 dark:text-gray-300">{{ delivery.note }}</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Product Items Spreadsheet (Read-Only) -->
      <DeliveryNoteSpreadsheet
        v-model="delivery.items"
        :has-selected-so="true"
        :is-read-only="true"
      />
    </template>

    <!-- Proof Modal -->
    <DeliveryNoteProofModal
      :is-open="isProofModalOpen"
      :delivery-id="deliveryId"
      :delivery-code="delivery?.kode || ''"
      :recipient-name="delivery?.penerima || ''"
      :proof-url="delivery?.foto_bukti || ''"
      :delivery-note-text="delivery?.note || delivery?.keterangan || ''"
      :mode="proofModalMode"
      :is-submitting="isSubmittingProof"
      @close="isProofModalOpen = false"
      @confirm="handleConfirmDelivery"
    />

    <!-- Cancel Dialog -->
    <AppConfirmDialog
      v-model="isCancelDialogOpen"
      variant="danger"
      title="Batalkan Surat Jalan"
      :message="`Apakah Anda yakin ingin membatalkan Surat Jalan '${delivery?.kode}'? Kuantitas stok produk yang sudah dikurangi akan dikembalikan otomatis ke persediaan.`"
      :confirm-text="'Batalkan Dokumen'"
      :cancel-text="'Kembali'"
      @confirm="confirmCancel"
    />
  </div>
</template>
