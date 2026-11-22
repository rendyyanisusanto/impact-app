<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Search, RefreshCw, Save, CheckCircle, ArrowLeft, Truck, Building2 } from 'lucide-vue-next'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppSearchableSelect, {
  type SearchableOption
} from '@/shared/components/ui/AppSearchableSelect.vue'
import DeliveryNoteSalesOrderPicker, {
  type SelectableSalesOrder
} from '../components/DeliveryNoteSalesOrderPicker.vue'
import DeliveryNoteSpreadsheet from '../components/DeliveryNoteSpreadsheet.vue'
import { deliveryNoteService } from '../services/delivery-note.service'
import { salesOrderTransactionService } from '@/modules/sales/services/sales-order-transaction.service'
import type { DeliveryNoteItemInput, DriverOption } from '../types/delivery-note.types'
import { formatCurrency } from '@/shared/utils/formatters'
import { useToast } from '@/shared/composables/useToast'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const isSoPickerOpen = ref(false)
const isSubmitting = ref(false)

// Form Header State (matching Screenshot 2)
const selectedSoId = ref<number | null>(null)
const selectedSoCode = ref('')
const selectedSoVariant = ref<'impact' | 'pola' | 'ks'>('impact')
const customerName = ref('')
const salesName = ref('')
const totalPurchased = ref(0)

const deliveryCode = ref('')
const deliveryDate = ref(new Date().toISOString().slice(0, 10))
const driverKaryawanId = ref<number | null>(null)
const driverName = ref('')
const driversList = ref<DriverOption[]>([])
const isLoadingDrivers = ref(false)
const deliveryNotes = ref('')
const documentStatus = ref<number>(0) // 0 = Draft, 1 = Succeeded

const driverOptions = computed<SearchableOption[]>(() =>
  driversList.value.map(d => ({
    label: d.nama,
    value: d.id,
    description: [d.jabatan_nama, d.grup_nama].filter(Boolean).join(' • ')
  }))
)

const handleDriverChange = (val: string | number | null) => {
  const selected = driversList.value.find(d => d.id === Number(val))
  if (selected) {
    driverName.value = selected.nama
  } else {
    driverName.value = ''
  }
}

// Spreadsheet items
const spreadsheetItems = ref<DeliveryNoteItemInput[]>([])

const hasSelectedSo = computed(() => Boolean(selectedSoId.value && selectedSoId.value > 0))

const totalQtyKirim = computed(() =>
  spreadsheetItems.value.reduce((sum, it) => sum + (Number(it.qty_kirim) || 0), 0)
)

// Code Generation
const generateCode = async () => {
  deliveryCode.value = await deliveryNoteService.previewDeliveryCode(
    selectedSoVariant.value,
    false,
    deliveryDate.value
  )
}

// Handler when SO is selected
const handleSelectOrder = async (order: SelectableSalesOrder) => {
  selectedSoId.value = order.id
  selectedSoCode.value = order.kode
  selectedSoVariant.value = order.variant
  customerName.value = order.customer_nama
  totalPurchased.value = order.total

  // Generate code matching SO variant from database
  await generateCode()

  // Load order details & remaining quantities
  try {
    const orderDetails = await salesOrderTransactionService.getOrderById(order.id)
    salesName.value = orderDetails.sales_nama

    const remainingItems = await deliveryNoteService.getDeliveryRemainingBySoId(order.id)

    // Filter produk: jika stok sudah 0 atau sisa pesanan sudah 0, tidak ditampilkan
    const deliverableItems = remainingItems.filter(
      it => (it.sisa_qty ?? 0) > 0 && (it.stok_saat_ini === undefined || (it.stok_saat_ini ?? 0) > 0)
    )

    if (deliverableItems.length === 0 && remainingItems.length > 0) {
      toast.warning('Semua produk pada Sales Order ini stoknya 0 atau sudah terkirim seluruhnya.')
    }

    spreadsheetItems.value = deliverableItems.map(it => ({
      produk_id: it.produk_id,
      detail_sales_order_id: it.detail_sales_order_id,
      kode_produk: it.kode_produk,
      nama_produk: it.nama_produk,
      satuan_nama: it.satuan_nama,
      stok_saat_ini: it.stok_saat_ini,
      qty: it.qty_pemesanan,
      qty_sudah_dikirim: it.qty_sudah_dikirim,
      sisa_qty: it.sisa_qty,
      qty_kirim: Math.min(it.sisa_qty, it.stok_saat_ini ?? it.sisa_qty),
      keterangan: ''
    }))
  } catch (err) {
    console.error('Failed to load order items for delivery:', err)
    toast.error('Gagal memuat daftar produk dari Sales Order.')
  }
}

onMounted(async () => {
  // Pre-generate code
  await generateCode()

  // Load drivers list
  try {
    isLoadingDrivers.value = true
    driversList.value = await deliveryNoteService.getDrivers()
  } catch (err) {
    console.error('Failed to load drivers:', err)
  } finally {
    isLoadingDrivers.value = false
  }

  // Support query param ?soId=...
  if (route.query.soId) {
    const querySoId = Number(route.query.soId)
    try {
      const order = await salesOrderTransactionService.getOrderById(querySoId)
      await handleSelectOrder({
        id: order.id,
        kode: order.kode,
        variant: order.variant,
        customer_id: order.customer_id,
        customer_nama: order.customer_nama,
        total: order.total
      })
    } catch {
      // Ignore if soId not found
    }
  }
})

const saveDelivery = async (status: number) => {
  if (!selectedSoId.value) {
    toast.warning('Pilih Sales Order terlebih dahulu.')
    isSoPickerOpen.value = true
    return
  }

  if (!deliveryCode.value.trim()) {
    toast.warning('Nomor Surat Jalan wajib diisi.')
    return
  }

  const itemsToShip = spreadsheetItems.value.filter(it => it.qty_kirim > 0)
  if (itemsToShip.length === 0) {
    toast.warning('Minimal harus ada 1 produk dengan QTY Pengiriman lebih dari 0.')
    return
  }

  for (const it of spreadsheetItems.value) {
    const maxAllowed =
      it.sisa_qty !== undefined ? it.sisa_qty : it.qty - (it.qty_sudah_dikirim || 0)
    if (it.qty_kirim > maxAllowed) {
      toast.warning(
        `QTY Pengiriman untuk '${it.nama_produk}' (${it.qty_kirim}) melebihi sisa pesanan (${maxAllowed}).`
      )
      return
    }
  }

  isSubmitting.value = true
  try {
    const created = await deliveryNoteService.createDeliveryNote({
      so_id: selectedSoId.value,
      kode: deliveryCode.value.trim(),
      tanggal: deliveryDate.value,
      karyawan_id: driverKaryawanId.value,
      nama_pengirim: driverName.value.trim() || null,
      keterangan: deliveryNotes.value.trim() || null,
      status,
      is_pickup: false,
      items: spreadsheetItems.value
    })

    toast.success(
      status === 1
        ? `Surat Jalan '${created.kode}' berhasil dibuat dan diselesaikan (Stok telah dikurangi).`
        : `Surat Jalan '${created.kode}' berhasil disimpan sebagai Draft.`
    )
    router.push('/delivery/notes')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menyimpan Surat Jalan.'
    toast.error(msg)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6 w-full pb-28">
    <!-- Page Header Matching Screenshot 2 -->
    <AppPageHeader
      title="Tambah Surat Jalan"
      :breadcrumbs="[
        { label: 'Beranda', to: '/' },
        { label: 'Pengiriman', to: '/delivery/notes' },
        { label: 'Surat Jalan', to: '/delivery/notes' },
        { label: 'Tambah Surat Jalan' }
      ]"
    >
      <template #actions>
        <AppButton variant="outline" @click="router.push('/delivery/notes')">
          <template #icon>
            <ArrowLeft class="w-4 h-4" />
          </template>
          Kembali
        </AppButton>
      </template>
    </AppPageHeader>

    <!-- 2-Column Header Form Card (Matching Screenshot 2) -->
    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Kolom Kiri: Informasi Pemesanan & Customer -->
        <div class="space-y-4">
          <h3
            class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b pb-2 flex items-center gap-1.5"
          >
            <Building2 class="w-4 h-4 text-primary-500" />
            Informasi Pemesanan & Customer
          </h3>

          <!-- 1. Sales Order Picker -->
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Sales Order <span class="text-red-500">*</span>
            </label>
            <div class="flex gap-2">
              <input
                type="text"
                readonly
                :value="
                  selectedSoCode
                    ? `${selectedSoCode} - ${customerName}`
                    : 'Pilih No. Sales Order...'
                "
                class="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 cursor-pointer font-medium"
                data-test="input-selected-so"
                @click="isSoPickerOpen = true"
              />
              <button
                type="button"
                class="px-3.5 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shrink-0"
                data-test="btn-open-so-picker"
                @click="isSoPickerOpen = true"
              >
                <Search class="w-3.5 h-3.5" />
                Cari SO
              </button>
            </div>
          </div>

          <!-- 2. No Surat Jalan -->
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              No Surat Jalan <span class="text-red-500">*</span>
            </label>
            <div class="flex gap-2">
              <input
                v-model="deliveryCode"
                type="text"
                required
                placeholder="SJ/..."
                class="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono font-semibold focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                data-test="input-delivery-code"
              />
              <button
                type="button"
                class="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
                title="Generate Ulang Nomor Surat Jalan"
                data-test="btn-generate-code"
                @click="generateCode"
              >
                <RefreshCw class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- 3. Customer (Read-only) -->
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Customer
            </label>
            <input
              type="text"
              readonly
              :value="customerName || '-'"
              class="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-medium cursor-not-allowed"
              data-test="input-customer-name"
            />
          </div>

          <!-- 4. Sales (Read-only) -->
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Sales
            </label>
            <input
              type="text"
              readonly
              :value="salesName || '-'"
              class="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-medium cursor-not-allowed"
              data-test="input-sales-name"
            />
          </div>

          <!-- 5. Total Pembelian (Read-only) -->
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Total Pembelian
            </label>
            <input
              type="text"
              readonly
              :value="formatCurrency(totalPurchased)"
              class="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono font-bold cursor-not-allowed"
              data-test="input-total-pembelian"
            />
          </div>
        </div>

        <!-- Kolom Kanan: Informasi Pengiriman & Dokumen -->
        <div class="space-y-4">
          <h3
            class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b pb-2 flex items-center gap-1.5"
          >
            <Truck class="w-4 h-4 text-emerald-500" />
            Informasi Pengiriman & Dokumen
          </h3>

          <!-- 1. Dokumen -->
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Dokumen
            </label>
            <input
              type="text"
              readonly
              value="Surat Jalan"
              class="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-medium cursor-not-allowed"
              data-test="input-doc-type"
            />
          </div>

          <!-- 2. Tanggal -->
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Tanggal <span class="text-red-500">*</span>
            </label>
            <input
              v-model="deliveryDate"
              type="date"
              required
              class="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              data-test="input-delivery-date"
            />
          </div>

          <!-- 3. Nama Pengirim / Sopir -->
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Nama Pengirim / Sopir
            </label>
            <AppSearchableSelect
              v-model="driverKaryawanId"
              :options="driverOptions"
              placeholder="-- Pilih Pengirim / Sopir --"
              :allow-clear="true"
              size="sm"
              @change="handleDriverChange"
              data-test="select-driver"
            />
          </div>

          <!-- 4. Keterangan -->
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Keterangan
            </label>
            <textarea
              v-model="deliveryNotes"
              rows="3"
              placeholder="Catatan pengiriman, alamat khusus, atau instruksi supir..."
              class="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              data-test="input-delivery-notes"
            />
          </div>

          <!-- 5. Status Dokumen -->
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Status Dokumen
            </label>
            <select
              v-model="documentStatus"
              class="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              data-test="select-doc-status"
            >
              <option :value="0">Draft</option>
              <option :value="1">Succeeded (Sah & Siap Kirim)</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Product Detail Spreadsheet Component -->
    <DeliveryNoteSpreadsheet v-model="spreadsheetItems" :has-selected-so="hasSelectedSo" />

    <!-- Sticky Bottom Action Bar (Identical across Produksi, PO, SO) -->
    <div
      class="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-t border-slate-200 dark:border-gray-700 px-6 py-3.5 shadow-lg flex items-center justify-between"
    >
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="px-4 py-2 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          data-test="btn-cancel"
          @click="router.push('/delivery/notes')"
        >
          Batal
        </button>
      </div>

      <div class="flex items-center gap-4 sm:gap-6">
        <div class="hidden md:flex items-center gap-4 text-xs">
          <span class="text-slate-500 dark:text-gray-400">
            Total Produk:
            <b class="text-slate-800 dark:text-white font-semibold">{{
              spreadsheetItems.length
            }}</b>
            item
          </span>
          <span class="text-slate-500 dark:text-gray-400">
            Total QTY Kirim:
            <b class="text-primary-600 dark:text-primary-400 font-semibold text-sm">{{
              totalQtyKirim
            }}</b>
            unit
          </span>
        </div>

        <button
          type="button"
          :disabled="isSubmitting"
          class="px-4 py-2 text-xs font-semibold rounded-lg border border-primary-600 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
          data-test="btn-save-draft"
          @click="saveDelivery(0)"
        >
          <Save class="w-3.5 h-3.5" />
          Simpan sebagai Draft
        </button>

        <button
          type="button"
          :disabled="isSubmitting"
          class="px-5 py-2 text-xs font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-sm inline-flex items-center gap-1.5 disabled:opacity-50"
          data-test="btn-save-succeed"
          @click="saveDelivery(1)"
        >
          <CheckCircle class="w-3.5 h-3.5" />
          Simpan & Selesaikan
        </button>
      </div>
    </div>

    <!-- Sales Order Picker Modal -->
    <DeliveryNoteSalesOrderPicker
      :is-open="isSoPickerOpen"
      :model-value="selectedSoId"
      @close="isSoPickerOpen = false"
      @select="handleSelectOrder"
    />
  </div>
</template>
