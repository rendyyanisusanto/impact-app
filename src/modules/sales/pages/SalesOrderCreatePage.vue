<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import AppSearchableSelect from '@/shared/components/ui/AppSearchableSelect.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import SalesOrderSpreadsheet from '../components/SalesOrderSpreadsheet.vue'
import SalesOrderAdditionalCosts from '../components/SalesOrderAdditionalCosts.vue'
import SalesOrderSummary from '../components/SalesOrderSummary.vue'
import SalesOrderCodeTemplateModal from '../components/SalesOrderCodeTemplateModal.vue'
import { useSalesOrderForm } from '../composables/useSalesOrderForm'
import { salesOrderTransactionService } from '../services/sales-order-transaction.service'
import { useCustomerLookup } from '../composables/useCustomerLookup'
import type { SalesOrderVariantKey, SalesPerson } from '../types/sales-order.types'
import { getVariantConfig } from '../config/sales-order-variants'
import { useToast } from '@/shared/composables/useToast'
import { formatCurrency, formatNumber } from '@/shared/utils/formatters'
import { ArrowLeft, Save, RotateCcw, Settings, Info, Layers } from 'lucide-vue-next'

const props = defineProps<{
  variant?: SalesOrderVariantKey
}>()

const router = useRouter()
const route = useRoute()
const toast = useToast()

const currentVariant = computed<SalesOrderVariantKey>(() => {
  if (props.variant) return props.variant
  const path = route.path
  if (path.includes('so-pola') || path.includes('/orders/pola')) return 'pola'
  if (path.includes('so-ks') || path.includes('/orders/ks')) return 'ks'
  return 'impact'
})

const cfg = computed(() => getVariantConfig(currentVariant.value))

const {
  form,
  rows,
  additionalCosts,
  activeCell,
  isDirty,
  isSubmitting,
  totals,
  distinctProductsCount,
  hasProductionItems,
  totalQty,
  recordSnapshot,
  addRow,
  removeRow,
  setActiveCell,
  updateCell,
  selectProduct,
  handleCellKeydown,
  addCost,
  removeCost,
  updateCost,
  updateDiscount,
  validate
} = useSalesOrderForm(currentVariant.value, false)

const statusOptions = computed(() => [
  { value: 0, label: 'Draft' },
  {
    value: 1,
    label: hasProductionItems.value ? 'Selesai (Terkunci - Ada Produksi)' : 'Selesai (Succeeded)',
    disabled: hasProductionItems.value
  }
])

watch(hasProductionItems, hasProd => {
  if (hasProd) {
    form.status = 0
  }
})


const salesPersons = ref<SalesPerson[]>([])
const isLeaveConfirmOpen = ref(false)
const pendingNavigation = ref<string | null>(null)
const isFormatInfoOpen = ref(false)
const isCodeTemplateModalOpen = ref(false)

const { options: customerOptions, fetchCustomers, onSearch: onCustomerSearch,
  onSelect: onCustomerSelect } =
  useCustomerLookup()

const salesOptions = computed(() => [
  {
    value: 0,
    label: 'Tanpa Sales',
    description: 'Pesanan langsung tanpa penanggung jawab sales'
  },
  ...salesPersons.value.map(s => ({
    value: s.id,
    label: `${s.nama} (${s.nik || `ID: ${s.id}`})`,
    description: s.nik ? `NIK: ${s.nik}` : `ID: ${s.id}`
  }))
])

let codeRequestId = 0
async function regenerateCode(): Promise<void> {
  const current = ++codeRequestId
  const kode = await salesOrderTransactionService.previewCode(currentVariant.value, form.tanggal)
  if (current === codeRequestId) form.kode = kode
}

watch(
  () => form.tanggal,
  newDate => {
    if (newDate) {
      regenerateCode()
    }
  }
)

async function loadReferences(): Promise<void> {
  try {
    await fetchCustomers()
    salesPersons.value = salesOrderTransactionService.getSalesPersons()

    await regenerateCode()
    recordSnapshot()
  } catch (error) {
    console.error('Failed to load references', error)
  }
}

onBeforeRouteLeave((to, _from, next) => {
  if (isDirty.value && !isSubmitting.value) {
    pendingNavigation.value = to.fullPath
    isLeaveConfirmOpen.value = true
    next(false)
  } else {
    next()
  }
})

function confirmLeave(): void {
  isDirty.value = false
  isLeaveConfirmOpen.value = false
  if (pendingNavigation.value) {
    router.push(pendingNavigation.value)
  } else {
    router.push(cfg.value.routePrefix)
  }
}

function cancelLeave(): void {
  isLeaveConfirmOpen.value = false
  pendingNavigation.value = null
}

function handleCancel(): void {
  if (isDirty.value) {
    pendingNavigation.value = cfg.value.routePrefix
    isLeaveConfirmOpen.value = true
  } else {
    router.push(cfg.value.routePrefix)
  }
}

async function handleSubmit(targetStatus?: 0 | 1): Promise<void> {
  if (targetStatus !== undefined) {
    form.status = targetStatus
  }

  if (hasProductionItems.value && form.status === 1) {
    form.status = 0
    toast.error(
      'Sales Order memiliki produk yang perlu diproduksi, sehingga status dokumen otomatis Draft dan tidak dapat diubah menjadi Selesai.'
    )
    return
  }

  const validation = validate()
  if (!validation.isValid) {
    const firstErr =
      Object.values(validation.errors)[0] ||
      validation.itemErrors[0]?.message ||
      'Silakan periksa kembali data input.'
    toast.error(firstErr)
    return
  }

  isSubmitting.value = true
  try {
    const created = await salesOrderTransactionService.create(
      currentVariant.value,
      form,
      rows.value,
      additionalCosts.value
    )

    toast.success(
      `Sales Order ${created.kode} berhasil ${form.status === 1 ? 'diterbitkan' : 'disimpan sebagai draft'}.`
    )
    isDirty.value = false
    router.push(cfg.value.routePrefix)
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Gagal menyimpan transaksi.')
    console.error(error)
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadReferences()
})
</script>

<template>
  <div class="space-y-6 pb-28">
    <!-- Header with Breadcrumb & Back (Consistent with Produksi & PO) -->
    <AppPageHeader
      :title="`Tambah ${cfg.label}`"
      :subtitle="`Form pembuatan transaksi penjualan ${cfg.shortLabel} baru.`"
    >
      <template #breadcrumb>
        <div class="flex items-center gap-2 text-xs text-slate-500">
          <button class="hover:text-slate-800 transition-colors" @click="handleCancel">
            Penjualan
          </button>
          <span>/</span>
          <button class="hover:text-slate-800 transition-colors" @click="handleCancel">
            {{ cfg.shortLabel }}
          </button>
          <span>/</span>
          <span class="font-medium text-slate-700">Tambah Transaksi</span>
        </div>
      </template>

      <template #actions>
        <AppButton
          variant="outline"
          size="sm"
          class="flex items-center gap-1.5"
          @click="handleCancel"
        >
          <ArrowLeft class="w-4 h-4" />
          <span>Kembali ke Daftar</span>
        </AppButton>
      </template>
    </AppPageHeader>

    <!-- Card 1: Informasi Header Transaksi (Consistent with Produksi & PO) -->
    <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
      <div class="border-b border-slate-100 pb-3 flex items-center justify-between">
        <h3
          class="text-sm font-semibold text-slate-800 uppercase tracking-wider text-[11px] text-slate-500"
        >
          Informasi Transaksi Penjualan
        </h3>
        <span
          class="px-2.5 py-0.5 rounded text-[11px] font-semibold"
          :class="
            cfg.hasTax
              ? 'bg-teal-50 text-teal-800 border border-teal-200'
              : 'bg-slate-100 text-slate-700'
          "
        >
          {{ cfg.hasTax ? 'Transaksi PPN (11%)' : 'Transaksi Non-PPN' }}
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <!-- 1. No. Sales Order -->
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-700">
            No. Sales Order <span class="text-rose-500">*</span>
          </label>
          <div class="flex items-center gap-1.5">
            <input
              v-model="form.kode"
              type="text"
              placeholder="Nomor SO otomatis..."
              class="flex-1 py-2 px-3 text-xs font-mono font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800"
            />
            <button
              type="button"
              class="p-2 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 rounded-lg border border-slate-200 transition-colors"
              title="Generate Ulang Nomor Dokumen Otomatis"
              @click="regenerateCode"
            >
              <RotateCcw class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              class="p-2 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 rounded-lg border border-slate-200 transition-colors"
              title="Pengaturan Template Format Nomor Kode"
              @click="isCodeTemplateModalOpen = true"
            >
              <Settings class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              class="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg border border-slate-200 transition-colors"
              :title="`Format Pola: ${cfg.codePattern}`"
              @click="isFormatInfoOpen = true"
            >
              <Info class="w-3.5 h-3.5" />
            </button>
          </div>
          <p class="text-[10px] text-slate-400 font-mono">Format: {{ cfg.codePattern }}</p>
        </div>

        <!-- 2. Customer Dropdown (Searchable) -->
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-700">
            Customer <span class="text-rose-500">*</span>
          </label>
          <AppSearchableSelect
            v-model="form.customer_id"
            :options="customerOptions"
            placeholder="Cari atau pilih customer..."
            remote
            @search="onCustomerSearch"
            @change="onCustomerSelect"
          />
          <p class="text-[10px] text-slate-400">Pilih mitra customer terdaftar (pencarian nama/kode/alamat)</p>
        </div>

        <!-- 3. Tanggal Transaksi -->
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-700">
            Tanggal Transaksi <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="form.tanggal"
            type="date"
            class="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800 font-mono"
            @change="regenerateCode"
          />
          <p class="text-[10px] text-slate-400">Tanggal penetapan transaksi pesanan</p>
        </div>

        <!-- 4. Salesman Dropdown (Searchable) -->
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-700">
            Salesman <span class="text-rose-500">*</span>
          </label>
          <AppSearchableSelect
            v-model="form.sales_id"
            :options="salesOptions"
            placeholder="Cari atau pilih salesman..."
          />
          <p class="text-[10px] text-slate-400">Penanggung jawab sales pesanan (pencarian nama/NIK)</p>
        </div>

        <!-- 5. Faktur Pajak (Only for SO Impact) -->
        <div v-if="cfg.hasTax" class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-700"> No. Seri Faktur Pajak </label>
          <input
            v-model="form.no_faktur_pajak"
            type="text"
            placeholder="010.000-26.XXXXXXXX"
            class="w-full py-2 px-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800"
          />
          <p class="text-[10px] text-slate-400">Nomor seri faktur pajak DJP</p>
        </div>

        <!-- 6. Status Dokumen -->
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-700">
            Status Dokumen <span class="text-rose-500">*</span>
          </label>
          <AppSelect
            v-model="form.status"
            :options="statusOptions"
            placeholder="Pilih Status Dokumen"
          />
          <p v-if="hasProductionItems" class="text-[10px] text-amber-600 font-medium">
            Terdapat produk yang diproduksi. Dokumen otomatis berstatus Draft hingga proses produksi selesai.
          </p>
          <p v-else class="text-[10px] text-slate-400">
            Status alur dokumen pesanan (Draft atau Selesai)
          </p>
        </div>

        <!-- 7. Keterangan -->
        <div
          class="space-y-1.5"
          :class="cfg.hasTax ? 'md:col-span-2 lg:col-span-2' : 'md:col-span-2 lg:col-span-3'"
        >
          <label class="block text-xs font-semibold text-slate-700">
            Keterangan / Catatan Transaksi
          </label>
          <textarea
            v-model="form.keterangan"
            rows="2"
            maxlength="255"
            placeholder="Tambahkan catatan jika ada (opsional)..."
            class="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>
    </div>

    <!-- Card 2: Spreadsheet Detail Produk (Matching Produksi & PO) -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <Layers class="w-4 h-4 text-teal-600" />
          <span>Daftar Produk yang Dipesan</span>
        </h3>
        <span class="text-xs text-slate-500">
          Double-click baris untuk memilih produk dari Master Produk
        </span>
      </div>

      <SalesOrderSpreadsheet
        :rows="rows"
        :active-cell="activeCell"
        :disabled="isSubmitting"
        @set-active-cell="setActiveCell"
        @add-row="addRow"
        @remove-row="removeRow"
        @update-cell="updateCell"
        @cell-keydown="handleCellKeydown"
        @select-product="selectProduct"
      />
    </div>

    <!-- Card 3: Additional Costs & Financial Summary -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SalesOrderAdditionalCosts
        :costs="additionalCosts"
        :disabled="isSubmitting"
        @add-cost="addCost"
        @remove-cost="removeCost"
        @update-cost="updateCost"
      />

      <SalesOrderSummary
        :variant="currentVariant"
        :items-subtotal="totals.itemsSubtotal"
        :discount="form.diskon"
        :total-sebelum-ppn="totals.totalSebelumPpn"
        :total-additional-costs="totals.totalAdditionalCosts"
        :total-ppn="totals.totalPpn"
        :grand-total="totals.grandTotal"
        :ppn-rate="form.ppn_rate"
        :distinct-products-count="distinctProductsCount"
        :total-qty="totalQty"
        :disabled="isSubmitting"
        @update:discount="updateDiscount"
      />
    </div>

    <!-- Modal Pengaturan Format Nomor Dokumen -->
    <SalesOrderCodeTemplateModal
      v-model="isCodeTemplateModalOpen"
      @saved="regenerateCode"
    />

    <!-- Sticky Bottom Action Bar (Identical across Produksi & PO) -->
    <div
      class="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-3.5 shadow-lg flex items-center justify-between"
    >
      <!-- Left: Cancel Button & Unsaved Status -->
      <div class="flex items-center gap-3">
        <AppButton
          variant="outline"
          size="sm"
          class="text-slate-600 hover:bg-slate-100"
          :disabled="isSubmitting"
          @click="handleCancel"
        >
          Batalkan
        </AppButton>
        <span v-if="isDirty" class="text-xs text-amber-600 font-medium hidden sm:inline">
          • Perubahan belum disimpan
        </span>
      </div>

      <!-- Right: Live KPIs + Total Indicator + Submit Buttons -->
      <div class="flex items-center gap-4 sm:gap-6">
        <!-- Live KPIs -->
        <div class="hidden md:flex items-center gap-4 text-xs">
          <span class="text-slate-500">
            Total Produk:
            <b class="text-slate-800 font-semibold">{{ distinctProductsCount }}</b> jenis
          </span>
          <span class="text-slate-500">
            Total Qty:
            <b class="text-slate-800 font-semibold">{{ formatNumber(totalQty) }}</b> unit
          </span>
        </div>

        <!-- Total Currency Badge (matching PO) -->
        <div
          class="flex items-baseline gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
        >
          <span class="text-xs text-slate-500 font-medium">Total:</span>
          <span class="text-sm sm:text-base font-bold font-mono text-teal-700">
            {{ formatCurrency(totals.grandTotal) }}
          </span>
        </div>

        <!-- Save Draft Button -->
        <AppButton
          variant="outline"
          size="md"
          :disabled="isSubmitting"
          class="hidden sm:inline-flex items-center gap-1.5"
          @click="handleSubmit(0)"
        >
          <Save class="w-4 h-4 text-slate-600" />
          <span>Simpan Draft</span>
        </AppButton>

        <!-- Save Transaction (Primary Submit) -->
        <AppButton
          variant="primary"
          size="md"
          :is-loading="isSubmitting"
          :disabled="isSubmitting"
          class="bg-teal-600 hover:bg-teal-700 text-white font-medium px-6 shadow-sm flex items-center gap-2"
          @click="handleSubmit()"
        >
          <Save class="w-4 h-4" />
          <span>Simpan Transaksi {{ cfg.shortLabel }}</span>
        </AppButton>
      </div>
    </div>

    <!-- Confirm Unsaved Changes Dialog (Consistent with Produksi & PO) -->
    <AppConfirmDialog
      v-model:is-open="isLeaveConfirmOpen"
      title="Tinggalkan Halaman?"
      message="Anda memiliki perubahan formulir penjualan yang belum disimpan. Perubahan yang belum disimpan akan hilang jika Anda meninggalkan halaman ini."
      confirm-text="Tinggalkan Halaman"
      cancel-text="Tetap di Sini"
      variant="warning"
      @confirm="confirmLeave"
      @cancel="cancelLeave"
    />
  </div>
</template>
