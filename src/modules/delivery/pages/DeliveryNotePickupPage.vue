<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Search,
  RefreshCw,
  Save,
  CheckCircle,
  ArrowLeft,
  Building2,
  UserCheck
} from 'lucide-vue-next'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import DeliveryNoteSalesOrderPicker, {
  type SelectableSalesOrder
} from '../components/DeliveryNoteSalesOrderPicker.vue'
import DeliveryNoteSpreadsheet from '../components/DeliveryNoteSpreadsheet.vue'
import { deliveryNoteService } from '../services/delivery-note.service'
import { salesOrderTransactionService } from '@/modules/sales/services/sales-order-transaction.service'
import type { DeliveryNoteItemInput } from '../types/delivery-note.types'
import { formatCurrency } from '@/shared/utils/formatters'
import { useToast } from '@/shared/composables/useToast'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const isSoPickerOpen = ref(false)
const isSubmitting = ref(false)

// Form Header State for Self Pickup
const selectedSoId = ref<number | null>(null)
const selectedSoCode = ref('')
const selectedSoVariant = ref<'impact' | 'pola' | 'ks'>('impact')
const customerName = ref('')
const salesName = ref('')
const totalPurchased = ref(0)

const deliveryCode = ref('')
const deliveryDate = ref(new Date().toISOString().slice(0, 10))
const pickupPersonName = ref('Diambil Sendiri oleh Pelanggan')
const deliveryNotes = ref('')
const documentStatus = ref<number>(1) // Default to Succeeded for pickup

// Spreadsheet items
const spreadsheetItems = ref<DeliveryNoteItemInput[]>([])

const hasSelectedSo = computed(() => Boolean(selectedSoId.value && selectedSoId.value > 0))

const totalQtyKirim = computed(() =>
  spreadsheetItems.value.reduce((sum, it) => sum + (Number(it.qty_kirim) || 0), 0)
)

// Code Generation (Pickup mode)
const generateCode = async () => {
  deliveryCode.value = await deliveryNoteService.previewDeliveryCode(
    selectedSoVariant.value,
    true,
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

  await generateCode()

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
      keterangan: 'Diambil mandiri oleh customer'
    }))
  } catch (err) {
    console.error('Failed to load order items for pickup:', err)
    toast.error('Gagal memuat daftar produk dari Sales Order.')
  }
}

onMounted(async () => {
  await generateCode()

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
      // Ignore
    }
  }
})

const savePickup = async (status: number) => {
  if (!selectedSoId.value) {
    toast.warning('Pilih Sales Order terlebih dahulu.')
    isSoPickerOpen.value = true
    return
  }

  if (!deliveryCode.value.trim()) {
    toast.warning('Nomor Dokumen Pengambilan Sendiri wajib diisi.')
    return
  }

  const itemsToShip = spreadsheetItems.value.filter(it => it.qty_kirim > 0)
  if (itemsToShip.length === 0) {
    toast.warning('Minimal harus ada 1 produk dengan QTY Pengambilan lebih dari 0.')
    return
  }

  isSubmitting.value = true
  try {
    const created = await deliveryNoteService.createDeliveryNote({
      so_id: selectedSoId.value,
      kode: deliveryCode.value.trim(),
      tanggal: deliveryDate.value,
      nama_pengirim: pickupPersonName.value.trim() || 'Diambil Sendiri oleh Pelanggan',
      keterangan: deliveryNotes.value.trim() || 'Pengambilan Mandiri (Self Pickup)',
      status,
      is_pickup: true,
      items: spreadsheetItems.value
    })

    toast.success(
      status === 1
        ? `Tanda Terima Pengambilan Sendiri '${created.kode}' berhasil diselesaikan (Stok telah disesuaikan).`
        : `Tanda Terima Pengambilan Sendiri '${created.kode}' berhasil disimpan sebagai Draft.`
    )
    router.push('/delivery/notes')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menyimpan Pengambilan Sendiri.'
    toast.error(msg)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6 w-full pb-28">
    <!-- Header -->
    <AppPageHeader
      title="Pengambilan Sendiri (Self Pickup)"
      :breadcrumbs="[
        { label: 'Beranda', to: '/' },
        { label: 'Pengiriman', to: '/delivery/notes' },
        { label: 'Surat Jalan', to: '/delivery/notes' },
        { label: 'Pengambilan Sendiri' }
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

    <!-- 2-Column Header Form -->
    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Kolom Kiri -->
        <div class="space-y-4">
          <h3
            class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b pb-2 flex items-center gap-1.5"
          >
            <Building2 class="w-4 h-4 text-indigo-500" />
            Informasi Pemesanan & Customer
          </h3>

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
                class="px-3.5 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shrink-0"
                data-test="btn-open-so-picker"
                @click="isSoPickerOpen = true"
              >
                <Search class="w-3.5 h-3.5" />
                Cari SO
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              No Surat Jalan / Ambil <span class="text-red-500">*</span>
            </label>
            <div class="flex gap-2">
              <input
                v-model="deliveryCode"
                type="text"
                required
                class="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                data-test="input-delivery-code"
              />
              <button
                type="button"
                class="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
                title="Generate Ulang"
                data-test="btn-generate-code"
                @click="generateCode"
              >
                <RefreshCw class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
              >Customer</label
            >
            <input
              type="text"
              readonly
              :value="customerName || '-'"
              class="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-medium cursor-not-allowed"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
              >Sales</label
            >
            <input
              type="text"
              readonly
              :value="salesName || '-'"
              class="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-medium cursor-not-allowed"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
              >Total Pembelian</label
            >
            <input
              type="text"
              readonly
              :value="formatCurrency(totalPurchased)"
              class="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono font-bold cursor-not-allowed"
            />
          </div>
        </div>

        <!-- Kolom Kanan -->
        <div class="space-y-4">
          <h3
            class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b pb-2 flex items-center gap-1.5"
          >
            <UserCheck class="w-4 h-4 text-indigo-500" />
            Informasi Pengambilan Mandiri
          </h3>

          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
              >Dokumen</label
            >
            <input
              type="text"
              readonly
              value="Pengambilan Sendiri (Self Pickup)"
              class="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-indigo-700 dark:text-indigo-400 font-semibold cursor-not-allowed"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Tanggal Pengambilan <span class="text-red-500">*</span>
            </label>
            <input
              v-model="deliveryDate"
              type="date"
              required
              class="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Nama Pengambil / Utusan Pelanggan
            </label>
            <input
              v-model="pickupPersonName"
              type="text"
              placeholder="cth. Ibu Ratna / Sopir Customer..."
              class="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
              >Keterangan / Nopol Armada</label
            >
            <textarea
              v-model="deliveryNotes"
              rows="3"
              placeholder="cth. Diambil langsung menggunakan Pickup L300 Nopol L 9821 AB..."
              class="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
              >Status Dokumen</label
            >
            <select
              v-model="documentStatus"
              class="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              <option :value="1">Succeeded (Barang Langsung Diserahkan)</option>
              <option :value="0">Draft</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Spreadsheet -->
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
            <b class="text-indigo-600 dark:text-indigo-400 font-semibold text-sm">{{
              totalQtyKirim
            }}</b>
            unit
          </span>
        </div>

        <button
          type="button"
          :disabled="isSubmitting"
          class="px-4 py-2 text-xs font-semibold rounded-lg border border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
          @click="savePickup(0)"
        >
          <Save class="w-3.5 h-3.5" />
          Simpan sebagai Draft
        </button>

        <button
          type="button"
          :disabled="isSubmitting"
          class="px-5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm inline-flex items-center gap-1.5 disabled:opacity-50"
          data-test="btn-save-pickup"
          @click="savePickup(1)"
        >
          <CheckCircle class="w-3.5 h-3.5" />
          Simpan & Serahkan Barang
        </button>
      </div>
    </div>

    <!-- Picker -->
    <DeliveryNoteSalesOrderPicker
      :is-open="isSoPickerOpen"
      :model-value="selectedSoId"
      @close="isSoPickerOpen = false"
      @select="handleSelectOrder"
    />
  </div>
</template>
