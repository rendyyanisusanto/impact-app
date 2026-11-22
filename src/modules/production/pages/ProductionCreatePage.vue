<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
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
import { ArrowLeft, Save, RotateCcw, Info, Layers } from 'lucide-vue-next'

const router = useRouter()
const toast = useToast()

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
  validate
} = useProductionForm(false)

const isLeaveConfirmOpen = ref(false)
const pendingNavigation = ref<string | null>(null)
const isFormatInfoOpen = ref(false)

const jenisOptions = [
  { value: 1, label: 'Pesanan' },
  { value: 0, label: 'Non Pesanan / Stok' }
]

const statusOptions = [
  { value: 0, label: 'Pending' },
  { value: 1, label: 'Proses' },
  { value: 2, label: 'Selesai' }
]

onMounted(() => {
  // Generate initial production code
  generateNewCode()
  recordSnapshot()
})

function generateNewCode() {
  form.kode = productionService.generateProductionCode(form.tanggal)
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

function confirmLeave() {
  isDirty.value = false
  isLeaveConfirmOpen.value = false
  if (pendingNavigation.value) {
    router.push(pendingNavigation.value)
  } else {
    router.push('/production/orders')
  }
}

function cancelLeave() {
  isLeaveConfirmOpen.value = false
  pendingNavigation.value = null
}

async function handleSubmit() {
  const result = validate()
  if (!result.isValid) {
    const firstMsg =
      Object.values(result.errors)[0] ||
      result.itemErrors[0]?.message ||
      'Formulir belum lengkap atau memiliki data yang tidak valid.'
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

    const created = await productionService.createProduction({
      kode: form.kode,
      jenis_produksi: Number(form.jenis_produksi),
      tanggal: form.tanggal,
      status_produksi: Number(form.status_produksi),
      keterangan: form.keterangan || null,
      items: validItems
    })

    toast.success(
      'Transaksi Produksi Berhasil Disimpan',
      `Surat perintah produksi ${created.kode} telah berhasil dibuat.`
    )

    isDirty.value = false
    router.push(`/production/orders/${created.id}`)
  } catch (err: unknown) {
    toast.error('Gagal Menyimpan Produksi', (err as Error).message)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6 pb-28">
    <!-- Header -->
    <AppPageHeader
      title="Tambah Transaksi Produksi"
      subtitle="Buat surat perintah kerja produksi baru dengan memilih produk furniture dan menentukan kuantitas target"
      :breadcrumbs="[
        { label: 'Produksi', to: '/production/orders' },
        { label: 'Proses Produksi', to: '/production/orders' },
        { label: 'Tambah Transaksi' }
      ]"
    >
      <template #actions>
        <AppButton
          variant="outline"
          size="sm"
          class="flex items-center gap-1.5"
          @click="router.push('/production/orders')"
        >
          <ArrowLeft class="w-4 h-4" />
          <span>Kembali ke Daftar</span>
        </AppButton>
      </template>
    </AppPageHeader>

    <!-- Card 1: Informasi Header Produksi (Matching Legacy Form Screenshot) -->
    <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
      <div class="border-b border-slate-100 pb-3 flex items-center justify-between">
        <h3
          class="text-sm font-semibold text-slate-800 uppercase tracking-wider text-[11px] text-slate-500"
        >
          Informasi Transaksi Produksi
        </h3>
        <span class="text-xs text-slate-400"
          >Urutan field diselaraskan dengan tata letak legacy</span
        >
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <!-- 1. No Produksi -->
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-700">
            No Produksi <span class="text-rose-500">*</span>
          </label>
          <div class="flex items-center gap-1.5">
            <input
              v-model="form.kode"
              type="text"
              placeholder="PDMMYY-XXXX"
              class="flex-1 py-2 px-3 text-xs font-mono font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800"
            />
            <button
              type="button"
              class="p-2 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 rounded-lg border border-slate-200 transition-colors"
              title="Generate Ulang Nomor Produksi Otomatis"
              @click="generateNewCode"
            >
              <RotateCcw class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              class="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg border border-slate-200 transition-colors"
              title="Format: PD{bulan}{tahun}-{nomor urut}"
              @click="isFormatInfoOpen = true"
            >
              <Info class="w-3.5 h-3.5" />
            </button>
          </div>
          <p class="text-[10px] text-slate-400 font-mono">Format: PD{month}{year}-{seq}</p>
        </div>

        <!-- 2. Jenis Produksi -->
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-700">
            Jenis <span class="text-rose-500">*</span>
          </label>
          <AppSelect
            v-model="form.jenis_produksi"
            :options="jenisOptions"
            placeholder="Pilih Jenis Produksi"
          />
          <p class="text-[10px] text-slate-400">Pesanan (Sales Order) atau Non Pesanan (Stok)</p>
        </div>

        <!-- 3. Tanggal -->
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-700">
            Tanggal <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="form.tanggal"
            type="date"
            class="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800 font-mono"
            @change="generateNewCode"
          />
          <p class="text-[10px] text-slate-400">Tanggal penetapan perintah kerja</p>
        </div>

        <!-- 4. Status Produksi -->
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-700">
            Status Produksi <span class="text-rose-500">*</span>
          </label>
          <AppSelect
            v-model="form.status_produksi"
            :options="statusOptions"
            placeholder="Pilih Status Produksi"
          />
          <p class="text-[10px] text-slate-400">Default: Pending (Belum diproses)</p>
        </div>

        <!-- 5. Keterangan (Full row) -->
        <div class="md:col-span-2 lg:col-span-4 space-y-1.5">
          <label class="block text-xs font-semibold text-slate-700"> Keterangan </label>
          <textarea
            v-model="form.keterangan"
            rows="2"
            maxlength="255"
            placeholder="Catatan pengerjaan batch produksi, instruksi penanggung jawab, dll..."
            class="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>
    </div>

    <!-- Card 2: Spreadsheet Detail Produk (Full Width) -->
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
        @add-row="addRow"
        @remove-row="removeRow"
        @set-active-cell="setActiveCell"
        @update-cell="updateCell"
        @select-product="selectProduct"
        @cell-keydown="handleCellKeydown"
      />
    </div>

    <!-- Card 3: Material Requirements Preview Panel (BoM Calculation) -->
    <div class="space-y-3">
      <ProductionMaterialRequirements
        :requirements="materialRequirements"
        :has-unassigned-bom="hasUnassignedBom"
        :loading="isCalculatingReqs"
      />
    </div>

    <!-- Sticky Bottom Action Bar -->
    <div
      class="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-3.5 shadow-lg flex items-center justify-between"
    >
      <div class="flex items-center gap-3">
        <AppButton
          variant="outline"
          size="sm"
          class="text-slate-600 hover:bg-slate-100"
          @click="router.push('/production/orders')"
        >
          Batalkan
        </AppButton>
        <span v-if="isDirty" class="text-xs text-amber-600 font-medium hidden sm:inline">
          ● Perubahan belum disimpan
        </span>
      </div>

      <!-- Live Total Summary & Submit -->
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
          :is-loading="isSubmitting"
          class="bg-teal-600 hover:bg-teal-700 text-white font-medium px-6 shadow-sm flex items-center gap-2"
          @click="handleSubmit"
        >
          <Save class="w-4 h-4" />
          <span>Simpan Transaksi Produksi</span>
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

    <!-- Format Info Modal -->
    <div
      v-if="isFormatInfoOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
    >
      <div
        class="bg-white rounded-xl p-5 border border-slate-200 max-w-sm w-full space-y-3 shadow-xl"
      >
        <h4 class="font-semibold text-slate-800 text-sm">Format Nomor Produksi</h4>
        <p class="text-xs text-slate-600 leading-relaxed">
          Nomor produksi mengikuti pola format legacy dari tabel <code>setting_table</code>:
          <br />
          <code class="font-mono text-teal-700 font-bold bg-teal-50 px-1 py-0.5 rounded"
            >PD{month}{year}-{sequence}</code
          >
          <br /><br />
          Contoh: <b>PD1126-0001</b> (Bulan 11, Tahun 2026, nomor urut 0001).
        </p>
        <div class="text-right pt-2">
          <button
            type="button"
            class="px-4 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
            @click="isFormatInfoOpen = false"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
