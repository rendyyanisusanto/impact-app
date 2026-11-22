<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppSkeleton from '@/shared/components/ui/AppSkeleton.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import GoodsReceiptHeaderForm from '../components/GoodsReceiptHeaderForm.vue'
import GoodsReceiptSpreadsheet from '../components/GoodsReceiptSpreadsheet.vue'
import GoodsReceiptSummary from '../components/GoodsReceiptSummary.vue'
import { useGoodsReceiptForm } from '../composables/useGoodsReceiptForm'
import { useGoodsReceiptSpreadsheet } from '../composables/useGoodsReceiptSpreadsheet'
import { useGoodsReceiptCalculations } from '../composables/useGoodsReceiptCalculations'
import { goodsReceiptService } from '../services/goods-receipt.service'
import { useToast } from '@/shared/composables/useToast'
import { formatCurrency } from '@/shared/utils/formatters'
import { ArrowLeft, Save, X } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const receiptId = computed(() => Number(route.params.id))
const isLoading = ref(true)

const {
  header,
  selectedPoInfo,
  isSubmitting,
  generalErrors,
  generateNewCode,
  takeSnapshot,
  isFormDirty,
  submitReceipt
} = useGoodsReceiptForm(receiptId.value)

const {
  rows,
  activeCell,
  selectedRowIndex,
  setRows,
  setActiveCell,
  updateCell,
  handleCellKeyDown
} = useGoodsReceiptSpreadsheet()

const isPpnRef = computed(() => header.is_ppn)
const ppnPersenRef = computed(() => header.ppn_persen)
const diskonPersenRef = computed(() => header.diskon_persen)

const { summary } = useGoodsReceiptCalculations(rows, isPpnRef, ppnPersenRef, diskonPersenRef)

// Unsaved changes dialog
const isLeaveConfirmOpen = ref(false)
const isSavedOrLeaving = ref(false)
const pendingNavigation = ref<string | null>(null)

async function loadExistingReceipt() {
  isLoading.value = true
  try {
    const res = await goodsReceiptService.getById(receiptId.value)
    header.id = res.header.id
    header.kode = res.header.kode || ''
    header.purchase_order_id = res.header.purchase_order_id
    header.no_surat_jalan = res.header.no_surat_jalan || ''
    header.gudang_id = res.header.gudang_id
    header.tanggal = res.header.tanggal || ''
    header.nama_pengirim = res.header.nama_pengirim || ''
    header.keterangan = res.header.keterangan || ''
    header.is_ppn = res.header.is_ppn
    header.ppn_id = res.header.ppn_id
    header.ppn_persen = res.header.ppn_persen
    header.diskon_persen = res.header.diskon_persen
    header.status = res.header.status

    selectedPoInfo.value = {
      kode_po: res.header.kode_po,
      suplier_id: res.header.suplier_id,
      nama_suplier: res.header.nama_suplier
    }

    setRows(res.details)
    takeSnapshot(rows.value)
  } catch (err: unknown) {
    toast.error((err as Error).message || 'Gagal memuat Penerimaan Barang.')
    router.push('/procurement/goods-receipts')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadExistingReceipt()
})

function onGenerateCode() {
  generateNewCode()
}

// Route leave guard for dirty form state
onBeforeRouteLeave((to, _from, next) => {
  if (isFormDirty(rows.value) && !isSubmitting.value && !isSavedOrLeaving.value) {
    pendingNavigation.value = to.fullPath
    isLeaveConfirmOpen.value = true
    next(false)
  } else {
    next()
  }
})

function handleCancelClick() {
  if (isFormDirty(rows.value) && !isSavedOrLeaving.value) {
    pendingNavigation.value = '/procurement/goods-receipts'
    isLeaveConfirmOpen.value = true
  } else {
    isSavedOrLeaving.value = true
    router.push('/procurement/goods-receipts')
  }
}

function confirmLeave() {
  isSavedOrLeaving.value = true
  isLeaveConfirmOpen.value = false
  if (pendingNavigation.value) {
    router.push(pendingNavigation.value)
  } else {
    router.push('/procurement/goods-receipts')
  }
}

function cancelLeave() {
  isLeaveConfirmOpen.value = false
  pendingNavigation.value = null
}

async function handleSave() {
  if (header.status === 1) {
    toast.error('Penerimaan Barang dengan status Succeeded (Diterima Final) sudah dikunci dan tidak dapat diubah.')
    return
  }
  try {
    const res = await submitReceipt(rows.value)
    if (res) {
      isSavedOrLeaving.value = true
      takeSnapshot(rows.value)
      toast.success(`Perubahan Penerimaan Barang ${res.header.kode} berhasil disimpan.`)
      router.push('/procurement/goods-receipts')
    }
  } catch (err: unknown) {
    toast.error((err as Error).message || 'Gagal menyimpan perubahan.')
  }
}
</script>

<template>
  <div class="space-y-6 pb-28">
    <!-- Page Header -->
    <AppPageHeader
      :title="`Edit Penerimaan Barang: ${header.kode || ''}`"
      description="Perbarui informasi pengiriman fisik dan kuantitas barang yang tiba di gudang."
      :breadcrumbs="[
        { label: 'Home', to: '/dashboard' },
        { label: 'Pengadaan', to: '/procurement/purchase-orders' },
        { label: 'Penerimaan Barang', to: '/procurement/goods-receipts' },
        { label: 'Edit Data' }
      ]"
    >
      <template #actions>
        <div class="flex items-center gap-2">
          <AppButton variant="outline" size="md" @click="handleCancelClick">
            <ArrowLeft class="w-4 h-4 mr-1.5" />
            <span>Kembali</span>
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="space-y-6">
      <div class="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
        <AppSkeleton height="32px" width="40%" />
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

    <template v-else>
      <!-- General Error Banner if validation fails -->
      <div
        v-if="Object.keys(generalErrors).length > 0"
        class="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-3"
      >
        <div class="font-semibold whitespace-nowrap">Mohon perbaiki kesalahan berikut:</div>
        <ul class="list-disc list-inside space-y-0.5">
          <li v-for="(msg, key) in generalErrors" :key="key">
            {{ msg }}
          </li>
        </ul>
      </div>

      <!-- Section A: Header Form (Two Columns) -->
      <GoodsReceiptHeaderForm
        :header="header"
        :selected-po-info="selectedPoInfo"
        :errors="generalErrors"
        :disabled="isSubmitting"
        is-editing
        @generate-code="onGenerateCode"
      />

      <!-- Section B: Interactive Desktop-Style Spreadsheet Detail Editor -->
      <div>
        <div class="mb-2 flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wide">
            Verifikasi Kuantitas Bahan Diterima
          </h3>
          <span class="text-xs text-slate-500"> Total: {{ rows.length }} item terdaftar </span>
        </div>

        <GoodsReceiptSpreadsheet
          :rows="rows"
          :active-cell="activeCell"
          :selected-row-index="selectedRowIndex"
          :disabled="isSubmitting"
          @set-active-cell="setActiveCell"
          @update-cell="updateCell"
          @cell-keydown="handleCellKeyDown"
        />
      </div>

      <!-- Section C: Calculation Summary Panel -->
      <GoodsReceiptSummary
        :summary="summary"
        :is-ppn="header.is_ppn"
        :disabled="isSubmitting"
      />

      <!-- Section D: Bottom Fixed Action Bar -->
      <div
        class="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-3 shadow-lg flex items-center justify-between"
      >
        <div class="text-xs text-slate-500 hidden sm:block">
          Perubahan pada kuantitas penerimaan barang akan disimpan secara atomik pada database.
        </div>

        <div class="flex items-center gap-3 sm:gap-4 ml-auto">
          <!-- Total Indicator beside Batalkan -->
          <div
            class="flex items-baseline gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md"
          >
            <span class="text-xs text-slate-500 font-medium">Total:</span>
            <span class="text-sm sm:text-base font-bold font-mono text-teal-700">
              {{ formatCurrency(summary.total) }}
            </span>
          </div>

          <AppButton
            type="button"
            variant="outline"
            size="md"
            :disabled="isSubmitting"
            @click="handleCancelClick"
          >
            <X class="w-4 h-4 mr-1.5" />
            <span>Batalkan</span>
          </AppButton>

          <AppButton
            type="button"
            variant="primary"
            size="md"
            :is-loading="isSubmitting"
            :disabled="isSubmitting"
            @click="handleSave"
          >
            <Save class="w-4 h-4 mr-1.5" />
            <span>Simpan Perubahan</span>
          </AppButton>
        </div>
      </div>
    </template>

    <!-- Unsaved Changes Confirmation Dialog -->
    <AppConfirmDialog
      v-model="isLeaveConfirmOpen"
      title="Perubahan Belum Disimpan"
      message="Ada perubahan formulir Penerimaan Barang yang belum tersimpan. Yakin ingin meninggalkan halaman ini dan membatalkan perubahan?"
      confirm-text="Tinggalkan Halaman"
      cancel-text="Lanjut Mengedit"
      variant="warning"
      @confirm="confirmLeave"
      @cancel="cancelLeave"
    />
  </div>
</template>
