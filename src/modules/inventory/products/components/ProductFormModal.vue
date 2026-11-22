<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppTextarea from '@/shared/components/ui/AppTextarea.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import AppFormLabel from '@/shared/components/ui/AppFormLabel.vue'
import AppSearchableSelect, {
  type SearchableOption
} from '@/shared/components/ui/AppSearchableSelect.vue'
import type { Produk, CreateProductDto, UpdateProductDto } from '../types/product.types'
import {
  productService,
  MOCK_PRODUCT_CATEGORIES,
  MOCK_PRODUCT_UNITS,
  MOCK_PRODUCT_WAREHOUSES,
  type ProductLookups
} from '../services/product.service'
import { UploadCloud, X, Image as ImageIcon, Plus } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    open?: boolean
    isEdit?: boolean
    initialData?: Produk | null
    loading?: boolean
  }>(),
  {
    modelValue: false,
    open: false,
    isEdit: false,
    initialData: null,
    loading: false
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
  (e: 'submit', form: CreateProductDto | UpdateProductDto): void
}>()

const isOpen = computed({
  get: () => props.modelValue || props.open,
  set: val => {
    emit('update:modelValue', val)
    if (!val) emit('close')
  }
})

const isEditMode = computed(() => props.isEdit || !!props.initialData?.id)

interface FormState {
  kode: string
  nama: string
  qty: number
  min_qty: number
  satuan_barang_id: number | null
  harga: number
  kategori_barang_id: number | null
  gudang_id: number | null
  status: number
  keterangan: string
  foto: string
  additional_fotos: string[]
}

const form = reactive<FormState>({
  kode: '',
  nama: '',
  qty: 0,
  min_qty: 0,
  satuan_barang_id: 1,
  harga: 0,
  kategori_barang_id: 1,
  gudang_id: 1000,
  status: 1,
  keterangan: '',
  foto: '',
  additional_fotos: []
})

const errors = reactive<Record<string, string>>({})
const mainFileInputRef = ref<HTMLInputElement | null>(null)
const additionalFileInputRef = ref<HTMLInputElement | null>(null)
const liveLookups = ref<ProductLookups | null>(null)

const categoryOptions = computed<SearchableOption[]>(() => {
  const cats = liveLookups.value?.categories || MOCK_PRODUCT_CATEGORIES
  return cats.map(c => ({ label: `${c.nama || '-'} (${c.kode || '-'})`, value: c.id }))
})

const unitOptions = computed<SearchableOption[]>(() => {
  const units = liveLookups.value?.units || MOCK_PRODUCT_UNITS
  return units.map(u => ({ label: `${u.nama || '-'} (${u.kode || '-'})`, value: u.id }))
})

const warehouseOptions = computed<SearchableOption[]>(() => {
  const whs = liveLookups.value?.warehouses || MOCK_PRODUCT_WAREHOUSES
  return whs.map(w => ({ label: `${w.nama || '-'} (${w.kode || '-'})`, value: w.id }))
})

const statusOptions = [
  { label: 'Aktif', value: '1' },
  { label: 'Nonaktif', value: '0' }
]

watch(
  () => isOpen.value,
  val => {
    if (val) {
      Object.keys(errors).forEach(k => delete errors[k])
      if (props.initialData) {
        form.kode = props.initialData.kode || ''
        form.nama = props.initialData.nama || ''
        form.qty = props.initialData.qty ?? 0
        form.min_qty = props.initialData.min_qty ?? 0
        form.satuan_barang_id = props.initialData.satuan_barang_id ?? 1
        form.harga = props.initialData.harga ?? 0
        form.kategori_barang_id = props.initialData.kategori_barang_id ?? 1
        form.gudang_id = props.initialData.gudang_id ?? 1000
        form.status = props.initialData.status ?? 1
        form.keterangan = props.initialData.keterangan || ''
        form.foto = props.initialData.foto || ''
        form.additional_fotos = props.initialData.fotos?.map(f => f.foto) || []
      } else {
        form.kode = ''
        form.nama = ''
        form.qty = 0
        form.min_qty = 0
        form.satuan_barang_id = 1
        form.harga = 0
        form.kategori_barang_id = 1
        form.gudang_id = 1000
        form.status = 1
        form.keterangan = ''
        form.foto = ''
        form.additional_fotos = []
      }

      if (productService.getLookups) {
        productService
          .getLookups()
          .then(data => {
            liveLookups.value = data
          })
          .catch(err => {
            console.error('Failed to load product lookups in modal', err)
          })
      }
    }
  },
  { immediate: true }
)

function handleMainFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    const reader = new FileReader()
    reader.onload = ev => {
      form.foto = String(ev.target?.result || '')
    }
    reader.readAsDataURL(file)
  }
}

function removeMainPhoto() {
  form.foto = ''
  if (mainFileInputRef.value) {
    mainFileInputRef.value.value = ''
  }
}

function handleAdditionalFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files) {
    Array.from(target.files).forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => {
        if (ev.target?.result) {
          form.additional_fotos.push(String(ev.target.result))
        }
      }
      reader.readAsDataURL(file)
    })
  }
  if (additionalFileInputRef.value) {
    additionalFileInputRef.value.value = ''
  }
}

function removeAdditionalPhoto(index: number) {
  form.additional_fotos.splice(index, 1)
}

function validate(): boolean {
  Object.keys(errors).forEach(k => delete errors[k])

  if (!form.nama.trim()) {
    errors.nama = 'Nama produk wajib diisi'
  }
  if (form.harga < 0) {
    errors.harga = 'Harga tidak boleh negatif'
  }
  if (form.qty < 0) {
    errors.qty = 'Stok tidak boleh negatif'
  }
  if (form.min_qty < 0) {
    errors.min_qty = 'Minimal stok tidak boleh negatif'
  }

  return Object.keys(errors).length === 0
}

function handleSubmit() {
  if (!validate()) return

  const payload: CreateProductDto | UpdateProductDto = {
    ...(isEditMode.value && props.initialData?.id ? { id: props.initialData.id } : {}),
    kode: form.kode.trim() || undefined,
    nama: form.nama.trim(),
    min_qty: Number(form.min_qty),
    satuan_barang_id: form.satuan_barang_id ? Number(form.satuan_barang_id) : null,
    harga: Math.round(Number(form.harga) || 0),
    kategori_barang_id: form.kategori_barang_id ? Number(form.kategori_barang_id) : null,
    gudang_id: form.gudang_id ? Number(form.gudang_id) : null,
    status: Number(form.status),
    keterangan: form.keterangan.trim() || null,
    foto: form.foto || null,
    additional_fotos: form.additional_fotos
  }

  // Stock Integrity Rule #15: In edit mode, do not mutate qty via master product update
  if (!isEditMode.value) {
    payload.qty = Number(form.qty)
  }

  emit('submit', payload)
}
</script>

<template>
  <AppModal
    :model-value="isOpen"
    :title="isEditMode ? 'Edit Produk' : 'Tambah Produk Baru'"
    size="xl"
    @update:model-value="isOpen = $event"
    @close="isOpen = false"
  >
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Kode Produk -->
        <div>
          <AppFormLabel for="prod-kode">Kode Produk</AppFormLabel>
          <AppInput
            id="prod-kode"
            v-model="form.kode"
            placeholder="Auto-generate jika kosong (cth: IC - 74)"
            :error="errors.kode"
          />
        </div>

        <!-- Nama Produk -->
        <div>
          <AppFormLabel for="prod-nama" required>Nama Produk</AppFormLabel>
          <AppInput
            id="prod-nama"
            v-model="form.nama"
            placeholder="Masukkan nama barang jadi/produk"
            :error="errors.nama"
          />
          <p v-if="errors.nama" class="text-xs text-red-600 mt-1">{{ errors.nama }}</p>
        </div>

        <!-- Kategori Produk -->
        <div>
          <AppFormLabel for="prod-kategori">Kategori Produk</AppFormLabel>
          <AppSearchableSelect
            id="prod-kategori"
            v-model="form.kategori_barang_id"
            :options="categoryOptions"
            placeholder="Pilih Kategori Produk"
          />
        </div>

        <!-- Satuan Produk -->
        <div>
          <AppFormLabel for="prod-satuan">Satuan Produk</AppFormLabel>
          <AppSearchableSelect
            id="prod-satuan"
            v-model="form.satuan_barang_id"
            :options="unitOptions"
            placeholder="Pilih Satuan Produk"
          />
        </div>

        <!-- Lokasi Gudang -->
        <div>
          <AppFormLabel for="prod-gudang">Lokasi Gudang</AppFormLabel>
          <AppSearchableSelect
            id="prod-gudang"
            v-model="form.gudang_id"
            :options="warehouseOptions"
            placeholder="Pilih Gudang Penyimpanan"
          />
        </div>

        <!-- Harga Jual -->
        <div>
          <AppFormLabel for="prod-harga">Harga Jual (Rp)</AppFormLabel>
          <AppInput
            id="prod-harga"
            v-model.number="form.harga"
            type="number"
            min="0"
            step="1000"
            placeholder="0"
            :error="errors.harga"
          />
        </div>

        <!-- Stok Awal (QTY) -->
        <div>
          <AppFormLabel for="prod-qty">Stok {{ isEditMode ? 'Saat Ini' : 'Awal' }} (QTY)</AppFormLabel>
          <AppInput
            id="prod-qty"
            v-model.number="form.qty"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            :disabled="isEditMode"
            :error="errors.qty"
          />
          <p v-if="isEditMode" class="mt-1 text-xs text-amber-600 dark:text-amber-400">
            Perubahan stok hanya dapat dilakukan melalui transaksi persediaan (Penerimaan, Pengeluaran, Retur, Penyesuaian, atau Stock Opname).
          </p>
        </div>

        <!-- Min QTY -->
        <div>
          <AppFormLabel for="prod-min-qty">Batas Minimal Stok (Min QTY)</AppFormLabel>
          <AppInput
            id="prod-min-qty"
            v-model.number="form.min_qty"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            :error="errors.min_qty"
          />
        </div>

        <!-- Status -->
        <div>
          <AppFormLabel for="prod-status">Status Produk</AppFormLabel>
          <AppSelect id="prod-status" v-model="form.status" :options="statusOptions" />
        </div>
      </div>

      <!-- Keterangan -->
      <div>
        <AppFormLabel for="prod-keterangan">Keterangan / Spesifikasi</AppFormLabel>
        <AppTextarea
          id="prod-keterangan"
          v-model="form.keterangan"
          :rows="2"
          placeholder="Catatan material, dimensi, finishing, atau kelengkapan..."
        />
      </div>

      <!-- Foto Utama Produk -->
      <div class="border-t border-slate-200 dark:border-slate-700 pt-4">
        <AppFormLabel>Foto Utama Produk</AppFormLabel>
        <div class="mt-2 flex items-start gap-4">
          <!-- Thumbnail preview -->
          <div
            class="relative w-28 h-28 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center bg-slate-50 dark:bg-slate-800 overflow-hidden flex-shrink-0"
          >
            <img
              v-if="form.foto"
              :src="form.foto"
              alt="Preview Foto Produk"
              class="w-full h-full object-cover"
            />
            <div v-else class="text-center p-2">
              <ImageIcon class="w-8 h-8 text-slate-400 mx-auto" />
              <span class="text-[11px] text-slate-400 mt-1 block">Belum ada foto</span>
            </div>
            <button
              v-if="form.foto"
              type="button"
              class="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow"
              title="Hapus foto"
              @click="removeMainPhoto"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Upload input button -->
          <div class="flex-1">
            <input
              ref="mainFileInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleMainFileChange"
            />
            <AppButton type="button" variant="outline" size="sm" @click="mainFileInputRef?.click()">
              <UploadCloud class="w-4 h-4 mr-1.5" />
              Pilih File Foto
            </AppButton>
            <p class="text-xs text-slate-500 mt-1.5">
              Format: JPG, PNG, WEBP. Maks 5MB. Foto akan disimpan dalam data base64.
            </p>
          </div>
        </div>
      </div>

      <!-- Foto Tambahan Gallery -->
      <div class="border-t border-slate-200 dark:border-slate-700 pt-3">
        <div class="flex items-center justify-between mb-2">
          <AppFormLabel>Foto Tambahan (Gallery Produk)</AppFormLabel>
          <AppButton
            type="button"
            variant="ghost"
            size="sm"
            @click="additionalFileInputRef?.click()"
          >
            <Plus class="w-4 h-4 mr-1" />
            Tambah Foto
          </AppButton>
          <input
            ref="additionalFileInputRef"
            type="file"
            accept="image/*"
            multiple
            class="hidden"
            @change="handleAdditionalFileChange"
          />
        </div>

        <div v-if="form.additional_fotos.length > 0" class="flex flex-wrap gap-2.5">
          <div
            v-for="(f, idx) in form.additional_fotos"
            :key="idx"
            class="relative w-20 h-20 rounded border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800"
          >
            <img :src="f" alt="Gallery item" class="w-full h-full object-cover" />
            <button
              type="button"
              class="absolute top-0.5 right-0.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-0.5 shadow"
              @click="removeAdditionalPhoto(idx)"
            >
              <X class="w-3 h-3" />
            </button>
          </div>
        </div>
        <div v-else class="text-xs text-slate-400 italic">Belum ada foto tambahan.</div>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <AppButton variant="outline" :disabled="loading" @click="isOpen = false"> Batal </AppButton>
        <AppButton variant="primary" :loading="loading" @click="handleSubmit">
          {{ isEditMode ? 'Simpan Perubahan' : 'Tambah Produk' }}
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>
