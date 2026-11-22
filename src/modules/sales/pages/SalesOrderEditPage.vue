<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import AppSearchableSelect from '@/shared/components/ui/AppSearchableSelect.vue'
import AppSkeleton from '@/shared/components/ui/AppSkeleton.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import SalesOrderSpreadsheet from '../components/SalesOrderSpreadsheet.vue'
import SalesOrderAdditionalCosts from '../components/SalesOrderAdditionalCosts.vue'
import SalesOrderSummary from '../components/SalesOrderSummary.vue'
import { useSalesOrderForm } from '../composables/useSalesOrderForm'
import { salesOrderTransactionService } from '../services/sales-order-transaction.service'
import { useCustomerLookup } from '../composables/useCustomerLookup'
import type {
  SalesOrderVariantKey,
  SalesPerson,
  SalesOrderWithDetails,
  LinkedProductionsResponse
} from '../types/sales-order.types'
import { getVariantConfig } from '../config/sales-order-variants'
import { useToast } from '@/shared/composables/useToast'
import { formatCurrency, formatNumber } from '@/shared/utils/formatters'
import { ArrowLeft, Save, Layers, AlertCircle } from 'lucide-vue-next'

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
const orderId = computed(() => Number(route.params.id))

const {
  form,
  rows,
  additionalCosts,
  activeCell,
  isDirty,
  isSubmitting,
  totals,
  distinctProductsCount,
  totalQty,
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
  validate,
  populateFromExisting
} = useSalesOrderForm(currentVariant.value, true)

const existingOrder = ref<SalesOrderWithDetails | null>(null)
const linkedProductionsData = ref<LinkedProductionsResponse | null>(null)
const isLoading = ref(true)

const salesPersons = ref<SalesPerson[]>([])
const isLeaveConfirmOpen = ref(false)
const pendingNavigation = ref<string | null>(null)

const { options: customerOptions, fetchCustomers, onSearch: onCustomerSearch,
  onSelect: onCustomerSelect, setSelected: setSelectedCustomer } =
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

const isProductionCompleted = computed(() => {
  const prods = (linkedProductionsData.value?.productions || []).filter(p => p.status_aktif === 1)
  if (prods.length > 0) {
    return prods.every(p => p.status_produksi === 2)
  }
  return existingOrder.value?.status_produksi === 0
})

const isSelesaiDisabled = computed(() => {
  return !isProductionCompleted.value
})

const statusOptions = computed(() => [
  { value: 0, label: 'Draft' },
  {
    value: 1,
    label: isSelesaiDisabled.value
      ? 'Selesai (Terkunci - Produksi Belum Selesai)'
      : 'Selesai (Succeeded)',
    disabled: isSelesaiDisabled.value
  }
])

watch(isSelesaiDisabled, disabled => {
  if (disabled && form.status === 1) {
    form.status = 0
  }
})

async function loadData(): Promise<void> {
  isLoading.value = true
  try {
    const [, salesList, orderData, prodsData] = await Promise.all([
      fetchCustomers(),
      salesOrderTransactionService.getSalesPersons(),
      salesOrderTransactionService.getById(orderId.value),
      salesOrderTransactionService.getLinkedProductions(orderId.value).catch(() => null)
    ])

    salesPersons.value = salesList
    linkedProductionsData.value = prodsData || null

    if (!orderData) {
      toast.error('Sales Order tidak ditemukan.')
      router.push(cfg.value.routePrefix)
      return
    }

    // Verify cross-variant isolation
    if (orderData.variant !== currentVariant.value) {
      toast.error(
        `Sales order ini merupakan tipe ${orderData.variant.toUpperCase()} dan tidak dapat diakses di menu ${cfg.value.shortLabel}.`
      )
      router.push(cfg.value.routePrefix)
      return
    }

    existingOrder.value = orderData
    populateFromExisting(orderData)
    setSelectedCustomer(orderData.customer_id, orderData.customer_nama)

    // Jika produksi belum selesai, pastikan status dokumen tetap Draft
    if (isSelesaiDisabled.value && form.status === 1) {
      form.status = 0
    }
  } catch (error) {
    toast.error('Gagal memuat data Sales Order.')
    console.error(error)
  } finally {
    isLoading.value = false
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
    router.push(`${cfg.value.routePrefix}/${orderId.value}`)
  }
}

function cancelLeave(): void {
  isLeaveConfirmOpen.value = false
  pendingNavigation.value = null
}

function handleCancel(): void {
  if (isDirty.value) {
    pendingNavigation.value = `${cfg.value.routePrefix}/${orderId.value}`
    isLeaveConfirmOpen.value = true
  } else {
    router.push(`${cfg.value.routePrefix}/${orderId.value}`)
  }
}

async function handleUpdate(targetStatus?: 0 | 1): Promise<void> {
  if (targetStatus !== undefined) {
    form.status = targetStatus
  }

  if (isSelesaiDisabled.value && form.status === 1) {
    form.status = 0
    toast.error(
      'Sales Order tidak dapat diubah menjadi Selesai (Succeeded) karena proses produksi belum selesai.'
    )
    return
  }

  const validation = validate({ isProductionCompleted: isProductionCompleted.value })
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
    const updated = await salesOrderTransactionService.update(
      orderId.value,
      form,
      rows.value,
      additionalCosts.value,
      currentVariant.value
    )

    toast.success(`Sales Order ${updated.kode} berhasil diperbarui.`)
    isDirty.value = false
    router.push(`${cfg.value.routePrefix}/${orderId.value}`)
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Gagal memperbarui transaksi.')
    console.error(error)
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="space-y-6 pb-28">
    <!-- Header with Breadcrumb & Back -->
    <AppPageHeader
      :title="`Edit ${cfg.label}`"
      :subtitle="`Perbarui informasi transaksi dan detail produk pesanan.`"
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
          <span class="font-medium text-slate-700">Edit Transaksi</span>
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
          <span>Kembali</span>
        </AppButton>
      </template>
    </AppPageHeader>

    <!-- Skeleton Loading -->
    <div
      v-if="isLoading"
      class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4"
    >
      <AppSkeleton height="32px" width="40%" />
      <AppSkeleton height="120px" width="100%" />
      <AppSkeleton height="200px" width="100%" />
    </div>

    <!-- Main Edit Form -->
    <template v-else-if="existingOrder">
      <!-- Status Notice if Succeeded -->
      <div
        v-if="existingOrder.status === 1"
        class="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 flex items-center gap-3 text-xs"
      >
        <AlertCircle class="w-5 h-5 text-amber-600 shrink-0" />
        <p>
          <b>Catatan:</b> Transaksi ini telah berstatus <b>Succeeded</b>. Anda dapat memperbarui
          rincian, namun pastikan penyesuaian telah dikoordinasikan dengan bagian pengiriman dan
          akuntansi.
        </p>
      </div>

      <!-- Card 1: Informasi Header Transaksi -->
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
            <input
              v-model="form.kode"
              type="text"
              readonly
              class="w-full py-2 px-3 text-xs font-mono font-bold bg-slate-100 border border-slate-200 rounded-lg text-slate-600 outline-none cursor-not-allowed"
            />
            <p class="text-[10px] text-slate-400">Nomor dokumen permanen</p>
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
            />
            <p class="text-[10px] text-slate-400">Tanggal penetapan transaksi</p>
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
            <p class="text-[10px] text-slate-400">Penanggung jawab sales (pencarian nama/NIK)</p>
          </div>

          <!-- 5. Faktur Pajak (Only for SO Impact) -->
          <div v-if="cfg.hasTax" class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-700">
              No. Seri Faktur Pajak
            </label>
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
            <p v-if="isSelesaiDisabled" class="text-[10px] text-amber-600 font-medium">
              Proses produksi belum selesai. Status dokumen terkunci sebagai Draft hingga seluruh proses produksi selesai.
            </p>
            <p v-else class="text-[10px] text-slate-400">
              Status alur dokumen (Draft atau Selesai/Succeeded)
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
              placeholder="Catatan..."
              class="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800 placeholder-slate-400"
            />
          </div>
        </div>
      </div>

      <!-- Card 2: Spreadsheet Detail Produk -->
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

          <!-- Total Currency Badge -->
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
            @click="handleUpdate(0)"
          >
            <Save class="w-4 h-4 text-slate-600" />
            <span>Simpan Draft</span>
          </AppButton>

          <!-- Save Succeeded / Post Button -->
          <AppButton
            variant="primary"
            size="md"
            :is-loading="isSubmitting"
            :disabled="isSubmitting"
            class="bg-teal-600 hover:bg-teal-700 text-white font-medium px-6 shadow-sm flex items-center gap-2"
            @click="handleUpdate()"
          >
            <Save class="w-4 h-4" />
            <span>Simpan Perubahan</span>
          </AppButton>
        </div>
      </div>
    </template>

    <!-- Confirm Unsaved Changes Dialog -->
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
