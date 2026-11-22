<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import PurchaseOrderHeaderForm from '../components/PurchaseOrderHeaderForm.vue'
import PurchaseOrderSpreadsheet from '../components/PurchaseOrderSpreadsheet.vue'
import PurchaseOrderSummary from '../components/PurchaseOrderSummary.vue'
import { usePurchaseOrderForm } from '../composables/usePurchaseOrderForm'
import { usePurchaseOrderSpreadsheet } from '../composables/usePurchaseOrderSpreadsheet'
import { usePurchaseOrderCalculations } from '../composables/usePurchaseOrderCalculations'
import { useToast } from '@/shared/composables/useToast'
import { formatCurrency } from '@/shared/utils/formatters'
import { ArrowLeft, Save, X } from 'lucide-vue-next'

const router = useRouter()
const toast = useToast()

const {
  header,
  isSubmitting,
  generalErrors,
  ppnPersen,
  loadTaxRate,
  generateNewCode,
  takeSnapshot,
  isFormDirty,
  submitOrder
} = usePurchaseOrderForm()

const {
  rows,
  initRows,
  activeCell,
  selectedRowIndex,
  isPickerOpen,
  pickerAnchorRect,
  setActiveCell,
  addRow,
  removeRow,
  openMaterialPicker,
  closeMaterialPicker,
  selectMaterialForActiveRow,
  handleCellKeyDown,
  handleCellDoubleClick,
  updateCell
} = usePurchaseOrderSpreadsheet(10)

const isPpnRef = computed(() => header.is_ppn)
const ppnPersenRef = computed(() => ppnPersen.value)
const diskonPersenRef = computed(() => header.diskon_persen)

const { summary } = usePurchaseOrderCalculations(rows, isPpnRef, ppnPersenRef, diskonPersenRef)

// Unsaved changes dialog
const isLeaveConfirmOpen = ref(false)
const isSavedOrLeaving = ref(false)
const pendingNavigation = ref<string | null>(null)

onMounted(async () => {
  initRows()
  await Promise.all([generateNewCode(), loadTaxRate()])
  takeSnapshot(rows.value)
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
    pendingNavigation.value = '/procurement/purchase-orders'
    isLeaveConfirmOpen.value = true
  } else {
    isSavedOrLeaving.value = true
    router.push('/procurement/purchase-orders')
  }
}

function confirmLeave() {
  isSavedOrLeaving.value = true
  isLeaveConfirmOpen.value = false
  if (pendingNavigation.value) {
    router.push(pendingNavigation.value)
  } else {
    router.push('/procurement/purchase-orders')
  }
}

function cancelLeave() {
  isLeaveConfirmOpen.value = false
  pendingNavigation.value = null
}

async function handleSave() {
  try {
    const res = await submitOrder(rows.value)
    if (res) {
      isSavedOrLeaving.value = true
      takeSnapshot(rows.value)
      toast.success(`Purchase Order ${res.header.kode} berhasil dibuat dan disimpan.`)
      router.push('/procurement/purchase-orders')
    }
  } catch (err: unknown) {
    toast.error((err as Error).message || 'Gagal menyimpan Purchase Order.')
  }
}
</script>

<template>
  <div class="space-y-6 pb-28">
    <!-- Page Header -->
    <AppPageHeader
      title="Tambah Purchase Order"
      description="Buat pesanan pembelian bahan baku dengan antarmuka spreadsheet interaktif desktop-grade."
      :breadcrumbs="[
        { label: 'Home', to: '/dashboard' },
        { label: 'Pengadaan', to: '/procurement/purchase-orders' },
        { label: 'Purchase Order', to: '/procurement/purchase-orders' },
        { label: 'Tambah Data' }
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
    <PurchaseOrderHeaderForm
      :header="header"
      :errors="generalErrors"
      :disabled="isSubmitting"
      @generate-code="onGenerateCode"
    />

    <!-- Section B: Interactive Desktop-Style Spreadsheet Editor -->
    <div>
      <div class="mb-2 flex items-center justify-between">
        <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wide">Detail Bahan Baku</h3>
        <span class="text-xs text-slate-500">
          Total: {{ rows.filter(r => !!r.bahan_id).length }} baris aktif
        </span>
      </div>

      <PurchaseOrderSpreadsheet
        :rows="rows"
        :active-cell="activeCell"
        :selected-row-index="selectedRowIndex"
        :is-picker-open="isPickerOpen"
        :picker-anchor-rect="pickerAnchorRect"
        :disabled="isSubmitting"
        @set-active-cell="setActiveCell"
        @add-row="addRow"
        @remove-row="removeRow"
        @open-picker="openMaterialPicker"
        @close-picker="closeMaterialPicker"
        @select-material="selectMaterialForActiveRow"
        @cell-keydown="handleCellKeyDown"
        @cell-double-click="handleCellDoubleClick"
        @update-cell="updateCell"
      />
    </div>

    <!-- Section C: Calculation Summary Panel -->
    <PurchaseOrderSummary
      v-model:diskon-persen="header.diskon_persen"
      :summary="summary"
      :is-ppn="header.is_ppn"
      :disabled="isSubmitting"
    />

    <!-- Section D: Bottom Fixed Action Bar -->
    <div
      class="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-3 shadow-lg flex items-center justify-between"
    >
      <div class="text-xs text-slate-500 hidden sm:block">
        Pastikan seluruh bahan dan jumlah telah terisi dengan benar sebelum menyimpan data.
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
          <span>Simpan Data</span>
        </AppButton>
      </div>
    </div>

    <!-- Unsaved Changes Confirmation Dialog -->
    <AppConfirmDialog
      :is-open="isLeaveConfirmOpen"
      title="Perubahan Belum Disimpan"
      message="Ada perubahan formulir Purchase Order yang belum tersimpan. Yakin ingin meninggalkan halaman ini dan membatalkan draft?"
      confirm-text="Tinggalkan Halaman"
      cancel-text="Lanjut Mengedit"
      variant="warning"
      @confirm="confirmLeave"
      @cancel="cancelLeave"
    />
  </div>
</template>
