<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Save, ArrowLeft, Truck, Building2 } from 'lucide-vue-next'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppSkeleton from '@/shared/components/ui/AppSkeleton.vue'
import AppSearchableSelect, {
  type SearchableOption
} from '@/shared/components/ui/AppSearchableSelect.vue'
import DeliveryNoteSpreadsheet from '../components/DeliveryNoteSpreadsheet.vue'
import { deliveryNoteService } from '../services/delivery-note.service'
import type {
  DeliveryNoteWithDetails,
  DeliveryNoteItemInput,
  DriverOption
} from '../types/delivery-note.types'
import { formatCurrency } from '@/shared/utils/formatters'
import { useToast } from '@/shared/composables/useToast'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const deliveryId = computed(() => Number(route.params.id))
const delivery = ref<DeliveryNoteWithDetails | null>(null)
const isLoading = ref(true)
const isSubmitting = ref(false)

const deliveryCode = ref('')
const deliveryDate = ref('')
const driverKaryawanId = ref<number | null>(null)
const driverName = ref('')
const driversList = ref<DriverOption[]>([])
const isLoadingDrivers = ref(false)
const deliveryNotes = ref('')
const documentStatus = ref<number>(0)
const spreadsheetItems = ref<DeliveryNoteItemInput[]>([])

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

const totalQtyKirim = computed(() =>
  spreadsheetItems.value.reduce((sum, it) => sum + (Number(it.qty_kirim) || 0), 0)
)

const loadDelivery = async () => {
  const idNum = deliveryId.value
  if (!idNum || isNaN(idNum)) {
    isLoading.value = false
    return
  }

  isLoading.value = true
  try {
    try {
      isLoadingDrivers.value = true
      driversList.value = await deliveryNoteService.getDrivers()
    } catch (driverErr) {
      console.error('Failed to load drivers:', driverErr)
    } finally {
      isLoadingDrivers.value = false
    }

    const data = await deliveryNoteService.getDeliveryNoteById(idNum)
    if (!data) {
      toast.error('Surat Jalan tidak ditemukan.')
      router.push('/delivery/notes')
      return
    }

    if (data.status === 2) {
      toast.error('Surat Jalan yang telah dibatalkan tidak dapat diedit.')
      router.push(`/delivery/notes/${idNum}`)
      return
    }

    delivery.value = data
    deliveryCode.value = data.kode
    deliveryDate.value = data.tanggal
    driverName.value = data.nama_pengirim || ''
    driverKaryawanId.value = data.karyawan_id || null

    if (!driverKaryawanId.value && data.nama_pengirim) {
      const matched = driversList.value.find(
        d => d.nama.toUpperCase() === data.nama_pengirim?.trim().toUpperCase()
      )
      if (matched) {
        driverKaryawanId.value = matched.id
      }
    }

    deliveryNotes.value = data.keterangan || ''
    documentStatus.value = data.status

    spreadsheetItems.value = data.items.map(it => ({
      produk_id: it.produk_id,
      detail_sales_order_id: it.detail_sales_order_id,
      kode_produk: it.kode_produk,
      nama_produk: it.nama_produk,
      satuan_nama: it.satuan_nama,
      qty: it.qty,
      qty_sudah_dikirim: it.qty_sudah_dikirim,
      sisa_qty: (it.sisa_qty ?? 0) + it.qty_kirim, // Allow reallocating this note's qty
      qty_kirim: it.qty_kirim,
      keterangan: it.keterangan || ''
    }))
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

const handleUpdate = async () => {
  if (!deliveryCode.value.trim()) {
    toast.warning('Nomor Surat Jalan wajib diisi.')
    return
  }

  const itemsToShip = spreadsheetItems.value.filter(it => it.qty_kirim > 0)
  if (itemsToShip.length === 0) {
    toast.warning('Minimal harus ada 1 produk dengan QTY Pengiriman lebih dari 0.')
    return
  }

  isSubmitting.value = true
  try {
    await deliveryNoteService.updateDeliveryNote(deliveryId.value, {
      id: deliveryId.value,
      kode: deliveryCode.value.trim(),
      tanggal: deliveryDate.value,
      karyawan_id: driverKaryawanId.value,
      nama_pengirim: driverName.value.trim() || null,
      keterangan: deliveryNotes.value.trim() || null,
      status: documentStatus.value,
      items: spreadsheetItems.value
    })

    toast.success(`Surat Jalan '${deliveryCode.value}' berhasil diperbarui.`)
    router.push(`/delivery/notes/${deliveryId.value}`)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memperbarui Surat Jalan.'
    toast.error(msg)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6 w-full pb-28">
    <AppPageHeader
      title="Edit Surat Jalan"
      :breadcrumbs="[
        { label: 'Beranda', to: '/' },
        { label: 'Pengiriman', to: '/delivery/notes' },
        { label: 'Surat Jalan', to: '/delivery/notes' },
        { label: 'Edit' }
      ]"
    >
      <template #actions>
        <AppButton variant="outline" @click="router.push(`/delivery/notes/${deliveryId}`)">
          <template #icon>
            <ArrowLeft class="w-4 h-4" />
          </template>
          Batal
        </AppButton>
      </template>
    </AppPageHeader>

    <div v-if="isLoading" class="p-8 space-y-4">
      <AppSkeleton class="h-24 w-full" />
      <AppSkeleton class="h-64 w-full" />
    </div>

    <template v-else-if="delivery">
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
              <Building2 class="w-4 h-4 text-primary-500" />
              Informasi Pemesanan & Customer
            </h3>

            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Sales Order
              </label>
              <input
                type="text"
                readonly
                :value="`${delivery.so_kode} - ${delivery.customer_nama}`"
                class="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                No Surat Jalan <span class="text-red-500">*</span>
              </label>
              <input
                v-model="deliveryCode"
                type="text"
                required
                class="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono font-semibold focus:ring-2 focus:ring-primary-500 transition-all"
                data-test="input-edit-code"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
                >Customer</label
              >
              <input
                type="text"
                readonly
                :value="delivery.customer_nama"
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
                :value="delivery.sales_nama"
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
                :value="formatCurrency(delivery.total_pembelian)"
                class="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono font-bold cursor-not-allowed"
              />
            </div>
          </div>

          <!-- Kolom Kanan -->
          <div class="space-y-4">
            <h3
              class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b pb-2 flex items-center gap-1.5"
            >
              <Truck class="w-4 h-4 text-emerald-500" />
              Informasi Pengiriman & Dokumen
            </h3>

            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
                >Dokumen</label
              >
              <input
                type="text"
                readonly
                :value="delivery.status_ambil === 1 ? 'Pengambilan Sendiri' : 'Surat Jalan'"
                class="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Tanggal <span class="text-red-500">*</span>
              </label>
              <input
                v-model="deliveryDate"
                type="date"
                required
                class="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 transition-all"
              />
            </div>

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

            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
                >Keterangan</label
              >
              <textarea
                v-model="deliveryNotes"
                rows="3"
                class="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 transition-all"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
                >Status Dokumen</label
              >
              <select
                v-model="documentStatus"
                class="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 transition-all"
              >
                <option :value="0">Draft</option>
                <option :value="1">Succeeded (Sah & Siap Kirim)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Spreadsheet -->
      <DeliveryNoteSpreadsheet v-model="spreadsheetItems" :has-selected-so="true" />

      <!-- Sticky Bottom Action Bar -->
      <div
        class="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-t border-slate-200 dark:border-gray-700 px-6 py-3.5 shadow-lg flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="px-4 py-2 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            data-test="btn-cancel"
            @click="router.push(`/delivery/notes/${deliveryId}`)"
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
            class="px-5 py-2 text-xs font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-sm inline-flex items-center gap-1.5 disabled:opacity-50"
            data-test="btn-update-delivery"
            @click="handleUpdate"
          >
            <Save class="w-3.5 h-3.5" />
            {{ isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
