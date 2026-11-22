<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import ProductionSpreadsheet from '../components/ProductionSpreadsheet.vue'
import ProductionMaterialRequirements from '../components/ProductionMaterialRequirements.vue'
import { productionService } from '../services/production.service'
import { useProductionForm } from '../composables/useProductionForm'
import { useToast } from '@/shared/composables/useToast'
import { formatNumber } from '@/shared/utils/formatters'
import { ArrowLeft, Save, Layers, AlertTriangle } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const productionId = Number(route.params.id)

const {
  form,
  rows,
  activeCell,
  isDirty,
  isSubmitting,
  materialRequirements,
  isCalculatingReqs,
  totals,
  hasUnassignedBom,
  recordSnapshot,
  addRow,
  removeRow,
  setActiveCell,
  updateCell,
  selectProduct,
  handleCellKeydown,
  refreshRequirements,
  validate
} = useProductionForm(true)

const isLoading = ref(true)
const isPosted = ref(false)
const isLeaveConfirmOpen = ref(false)
const pendingNavigation = ref<string | null>(null)

const jenisOptions = [
  { value: 1, label: 'Pesanan' },
  { value: 0, label: 'Non Pesanan / Stok' }
]

const statusOptions = [
  { value: 0, label: 'Pending' },
  { value: 1, label: 'Proses' },
  { value: 2, label: 'Selesai' }
]

async function loadData() {
  isLoading.value = true
  try {
    const prod = await productionService.getProductionById(productionId)
    if (!prod) {
      toast.error('Data Tidak Ditemukan', `Transaksi produksi #${productionId} tidak ada.`)
      router.push('/production/orders')
      return
    }

    form.id = prod.id
    form.kode = prod.kode || ''
    form.jenis_produksi = prod.jenis_produksi
    form.tanggal = prod.tanggal || new Date().toISOString().slice(0, 10)
    form.status_produksi = prod.status_produksi ?? 0
    form.keterangan = prod.keterangan || ''

    isPosted.value = prod.is_posted

    // Populate rows
    rows.value = prod.items.map(item => ({
      rowId: item.rowId,
      detailId: item.detailId,
      produk_id: item.produk_id,
      kode_produk: item.kode_produk,
      nama_produk: item.nama_produk,
      stok: item.stok,
      qty: item.qty,
      keterangan: item.keterangan || '',
      satuan_nama: item.satuan_nama,
      has_bom: item.has_bom
    }))

    // If less than 5 rows, pad with empty rows for editing convenience
    while (rows.value.length < 5) {
      addRow(1)
    }

    await refreshRequirements()
    recordSnapshot()
  } catch (err: unknown) {
    toast.error('Gagal Memuat Transaksi', (err as Error).message)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

onBeforeRouteLeave((to, _from, next) => {
  if (isDirty.value && !isSubmitting.value) {
    pendingNavigation.value = to.fullPath
    isLeaveConfirmOpen.value = true
    next(false)
  } else {
    next()
  }
})

function confirmLeave() {
  isDirty.value = false
  isLeaveConfirmOpen.value = false
  if (pendingNavigation.value) {
    router.push(pendingNavigation.value)
  } else {
    router.push(`/production/orders/${productionId}`)
  }
}

function cancelLeave() {
  isLeaveConfirmOpen.value = false
  pendingNavigation.value = null
}

async function handleSubmit() {
  if (isPosted.value) {
    toast.warning(
      'Transaksi Telah Diposting',
      'Perubahan tidak dapat disimpan karena transaksi sudah berstatus Selesai.'
    )
    return
  }

  const result = validate()
  if (!result.isValid) {
    const firstMsg =
      Object.values(result.errors)[0] ||
      result.itemErrors[0]?.message ||
      'Formulir memiliki data yang tidak valid.'
    toast.error('Validasi Gagal', firstMsg)
    return
  }

  isSubmitting.value = true
  try {
    const validItems = rows.value
      .filter(r => (r.produk_id || 0) > 0 && Number(r.qty || 0) > 0)
      .map(r => ({
        produk_id: r.produk_id as number,
        qty: Number(r.qty),
        keterangan: r.keterangan || null
      }))

    const updated = await productionService.updateProduction({
      id: productionId,
      kode: form.kode,
      jenis_produksi: Number(form.jenis_produksi),
      tanggal: form.tanggal,
      status_produksi: Number(form.status_produksi),
      keterangan: form.keterangan || null,
      items: validItems
    })

    toast.success(
      'Perubahan Berhasil Disimpan',
      `Transaksi produksi ${updated.kode} telah berhasil diperbarui.`
    )

    isDirty.value = false
    router.push(`/production/orders/${updated.id}`)
  } catch (err: unknown) {
    toast.error('Gagal Menyimpan Perubahan', (err as Error).message)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6 pb-28">
    <!-- Header -->
    <AppPageHeader
      :title="`Edit Produksi: ${form.kode || '...'}`"
      subtitle="Perbarui data surat perintah kerja produksi dan rincian kuantitas produk target"
      :breadcrumbs="[
        { label: 'Produksi', to: '/production/orders' },
        { label: 'Proses Produksi', to: '/production/orders' },
        { label: `Edit: ${form.kode || 'Dokumen'}` }
      ]"
    >
      <template #actions>
        <AppButton
          variant="outline"
          size="sm"
          class="flex items-center gap-1.5"
          @click="router.push(`/production/orders/${productionId}`)"
        >
          <ArrowLeft class="w-4 h-4" />
          <span>Kembali ke Detail</span>
        </AppButton>
      </template>
    </AppPageHeader>

    <!-- Warning if Posted -->
    <div
      v-if="isPosted"
      class="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-800 text-xs shadow-xs"
    >
      <AlertTriangle class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div>
        <p class="font-semibold text-sm">Transaksi Telah Diposting (Selesai)</p>
        <p class="mt-0.5 text-amber-700">
          Transaksi produksi ini telah berstatus Selesai dan menambah stok barang jadi di kartu
          stok. Perubahan rincian produk dikunci untuk mencegah terjadinya duplikasi mutasi stok.
        </p>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div
      v-if="isLoading"
      class="p-16 text-center text-slate-400 bg-white rounded-xl border border-slate-200"
    >
      <div
        class="inline-block animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full mb-3"
      />
      <p class="text-sm font-medium">Memuat data transaksi produksi...</p>
    </div>

    <template v-else>
      <!-- Card 1: Informasi Header Produksi -->
      <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div class="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h3
            class="text-sm font-semibold text-slate-800 uppercase tracking-wider text-[11px] text-slate-500"
          >
            Informasi Transaksi Produksi
          </h3>
          <span class="text-xs text-slate-400">ID Dokumen: #{{ form.id }}</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <!-- 1. No Produksi -->
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-700">
              No Produksi <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="form.kode"
              type="text"
              :disabled="isPosted"
              placeholder="PDMMYY-XXXX"
              class="w-full py-2 px-3 text-xs font-mono font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800 disabled:opacity-60"
            />
          </div>

          <!-- 2. Jenis Produksi -->
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-700">
              Jenis <span class="text-rose-500">*</span>
            </label>
            <AppSelect
              v-model="form.jenis_produksi"
              :options="jenisOptions"
              :disabled="isPosted"
              placeholder="Pilih Jenis"
            />
          </div>

          <!-- 3. Tanggal -->
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-700">
              Tanggal <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="form.tanggal"
              type="date"
              :disabled="isPosted"
              class="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800 font-mono disabled:opacity-60"
            />
          </div>

          <!-- 4. Status Produksi -->
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-700">
              Status Produksi <span class="text-rose-500">*</span>
            </label>
            <AppSelect
              v-model="form.status_produksi"
              :options="statusOptions"
              :disabled="isPosted"
              placeholder="Pilih Status"
            />
          </div>

          <!-- 5. Keterangan -->
          <div class="md:col-span-2 lg:col-span-4 space-y-1.5">
            <label class="block text-xs font-semibold text-slate-700"> Keterangan </label>
            <textarea
              v-model="form.keterangan"
              rows="2"
              maxlength="255"
              :disabled="isPosted"
              placeholder="Catatan pengerjaan batch produksi..."
              class="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800 disabled:opacity-60"
            />
          </div>
        </div>
      </div>

      <!-- Card 2: Spreadsheet Detail Produk -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Layers class="w-4 h-4 text-teal-600" />
            <span>Daftar Produk yang Diproduksi</span>
          </h3>
          <span class="text-xs text-slate-500">
            Double-click baris untuk memilih produk dari Master Produk
          </span>
        </div>

        <ProductionSpreadsheet
          :rows="rows"
          :active-cell="activeCell"
          :disabled="isPosted"
          @add-row="addRow"
          @remove-row="removeRow"
          @set-active-cell="setActiveCell"
          @update-cell="updateCell"
          @select-product="selectProduct"
          @cell-keydown="handleCellKeydown"
        />
      </div>

      <!-- Card 3: Material Requirements Preview Panel -->
      <div class="space-y-3">
        <ProductionMaterialRequirements
          :requirements="materialRequirements"
          :has-unassigned-bom="hasUnassignedBom"
          :loading="isCalculatingReqs"
        />
      </div>
    </template>

    <!-- Sticky Bottom Action Bar -->
    <div
      class="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-3.5 shadow-lg flex items-center justify-between"
    >
      <div class="flex items-center gap-3">
        <AppButton
          variant="outline"
          size="sm"
          class="text-slate-600 hover:bg-slate-100"
          @click="router.push(`/production/orders/${productionId}`)"
        >
          Batalkan
        </AppButton>
        <span v-if="isDirty" class="text-xs text-amber-600 font-medium hidden sm:inline">
          ● Perubahan belum disimpan
        </span>
      </div>

      <div class="flex items-center gap-6">
        <div class="hidden md:flex items-center gap-4 text-xs">
          <span class="text-slate-500">
            Total Produk:
            <b class="text-slate-800 font-semibold">{{ totals.distinctProducts }}</b> jenis
          </span>
          <span class="text-slate-500">
            Total Qty Target:
            <b class="text-teal-700 font-semibold text-sm">{{ formatNumber(totals.totalQty) }}</b>
            Unit
          </span>
        </div>

        <AppButton
          variant="primary"
          size="md"
          :disabled="isPosted"
          :is-loading="isSubmitting"
          class="bg-teal-600 hover:bg-teal-700 text-white font-medium px-6 shadow-sm flex items-center gap-2"
          @click="handleSubmit"
        >
          <Save class="w-4 h-4" />
          <span>Simpan Perubahan</span>
        </AppButton>
      </div>
    </div>

    <!-- Confirm Unsaved Changes Dialog -->
    <AppConfirmDialog
      :is-open="isLeaveConfirmOpen"
      title="Tinggalkan Halaman?"
      message="Anda memiliki perubahan formulir produksi yang belum disimpan. Perubahan yang belum disimpan akan hilang jika Anda meninggalkan halaman ini."
      confirm-text="Tinggalkan Halaman"
      cancel-text="Tetap di Sini"
      confirm-variant="warning"
      @confirm="confirmLeave"
      @cancel="cancelLeave"
    />
  </div>
</template>
