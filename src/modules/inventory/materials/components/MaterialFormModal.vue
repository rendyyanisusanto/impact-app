<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import AppCrudForm from '@/shared/components/forms/AppCrudForm.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppTextarea from '@/shared/components/ui/AppTextarea.vue'
import AppSearchableSelect, {
  type SearchableOption
} from '@/shared/components/ui/AppSearchableSelect.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppFormLabel from '@/shared/components/ui/AppFormLabel.vue'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import type {
  MasterDataBahan,
  CreateMaterialDto,
  KonversiSatuanBahan
} from '../types/material.types'
import { materialService } from '../services/material.service'
import { referenceService } from '@/shared/services/reference.service'
import {
  MOCK_GUDANG,
  MOCK_SATUAN_PAKAI,
  MOCK_SATUAN_BELI
} from '@/mocks/references/master-references.mock'
import { Plus, Trash2, Info, Upload, RotateCcw, Building2, Scale } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    initialData?: MasterDataBahan | null
    loading?: boolean
  }>(),
  {
    modelValue: false,
    initialData: null,
    loading: false
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'submit', payload: CreateMaterialDto): void
}>()

const isEdit = computed(() => !!props.initialData?.id)

// Form fields
const kode = ref('')
const nama = ref('')
const min_qty = ref<number | null>(0)
const qty = ref<number | null>(0)
const satuan_pakai_id = ref<number | null>(null)
const satuan_beli_id = ref<number | null>(null)
const gudang_id = ref<number | null>(null)
const harga_satuan = ref<number | null>(null)
const foto = ref<string | null>(null)
const deskripsi = ref('')
const status = ref<number>(1)
const konversiList = ref<KonversiSatuanBahan[]>([])

const errors = ref<Record<string, string>>({})
const fileInputRef = ref<HTMLInputElement | null>(null)
const photoUploadError = ref<string | null>(null)

// Quick add modals state
const showAddGudangModal = ref(false)
const newGudangNama = ref('')
const newGudangError = ref('')

const showAddSatuanModal = ref(false)
const newSatuanNama = ref('')
const targetSatuanType = ref<'pakai' | 'beli'>('pakai')
const newSatuanError = ref('')

// Dynamic Lookups from Database
const dbGudangList = ref<Array<{ id: number; nama: string; kode?: string | null }>>([])
const dbSatuanPakaiList = ref<Array<{ id: number; nama: string }>>([])
const dbSatuanBeliList = ref<Array<{ id: number; nama: string; kode?: string | null }>>([])
const isLoadingLookups = ref(false)

async function loadLookups() {
  isLoadingLookups.value = true
  try {
    const lookups = await materialService.getLookups()
    referenceService.syncFromLookups(lookups)
    if (lookups.warehouses && lookups.warehouses.length > 0) {
      dbGudangList.value = lookups.warehouses.map(w => ({
        id: Number(w.id),
        nama: w.nama || `Gudang #${w.id}`,
        kode: w.kode
      }))
    }
    if (lookups.usageUnits && lookups.usageUnits.length > 0) {
      dbSatuanPakaiList.value = lookups.usageUnits.map(u => ({
        id: Number(u.id),
        nama: u.nama || `Satuan #${u.id}`
      }))
    }
    if (lookups.buyUnits && lookups.buyUnits.length > 0) {
      dbSatuanBeliList.value = lookups.buyUnits.map(b => ({
        id: Number(b.id),
        nama: b.nama || `Satuan #${b.id}`,
        kode: b.kode
      }))
    }
  } catch (err) {
    console.error('Gagal memuat master data references:', err)
  } finally {
    isLoadingLookups.value = false
  }
}

onMounted(() => {
  loadLookups()
})

// Reactive Options (Menggunakan ID dan Nama asli dari Database)
const gudangOptions = computed<SearchableOption[]>(() => {
  const list = dbGudangList.value.length > 0 ? dbGudangList.value : MOCK_GUDANG
  return list.map(g => ({
    label: g.nama,
    value: g.id
  }))
})

const satuanPakaiOptions = computed<SearchableOption[]>(() => {
  const list = dbSatuanPakaiList.value.length > 0 ? dbSatuanPakaiList.value : MOCK_SATUAN_PAKAI
  return list.map(s => ({
    label: s.nama,
    value: s.id
  }))
})

const satuanBeliOptions = computed<SearchableOption[]>(() => {
  const list = dbSatuanBeliList.value.length > 0 ? dbSatuanBeliList.value : MOCK_SATUAN_BELI
  return list.map(s => ({
    label: s.nama,
    value: s.id
  }))
})

watch(
  () => props.modelValue,
  isOpen => {
    if (isOpen) {
      loadLookups()
      errors.value = {}
      photoUploadError.value = null
      if (props.initialData) {
        kode.value = props.initialData.kode || ''
        nama.value = props.initialData.nama || ''
        min_qty.value = props.initialData.min_qty !== null ? props.initialData.min_qty : 0
        qty.value = props.initialData.qty !== null ? props.initialData.qty : 0
        satuan_pakai_id.value = props.initialData.satuan_pakai_id
          ? Number(props.initialData.satuan_pakai_id)
          : null
        satuan_beli_id.value = props.initialData.satuan_beli_id
          ? Number(props.initialData.satuan_beli_id)
          : null
        gudang_id.value = props.initialData.gudang_id ? Number(props.initialData.gudang_id) : null
        harga_satuan.value =
          props.initialData.harga_satuan !== null ? props.initialData.harga_satuan : null
        foto.value = props.initialData.foto || null
        deskripsi.value = props.initialData.deskripsi || ''
        status.value =
          props.initialData.status !== null && props.initialData.status !== undefined
            ? Number(props.initialData.status)
            : 1
        konversiList.value = props.initialData.konversi_satuan
          ? props.initialData.konversi_satuan.map(k => ({ ...k }))
          : []
      } else {
        kode.value = ''
        nama.value = ''
        min_qty.value = 0
        qty.value = 0
        satuan_pakai_id.value = null
        satuan_beli_id.value = null
        gudang_id.value = null
        harga_satuan.value = null
        foto.value = null
        deskripsi.value = ''
        status.value = 1
        konversiList.value = []
      }
    }
  },
  { immediate: true }
)

// Photo file upload handler
function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return

  const file = target.files[0]
  photoUploadError.value = null

  // Validate mime type
  if (!file.type.startsWith('image/')) {
    photoUploadError.value = 'Berkas harus berupa gambar (JPG, PNG, WebP).'
    target.value = ''
    return
  }

  // Validate max size 2MB
  const maxBytes = 2 * 1024 * 1024
  if (file.size > maxBytes) {
    photoUploadError.value = 'Ukuran gambar maksimal 2 MB.'
    target.value = ''
    return
  }

  // Read file as Base64 data URL
  const reader = new FileReader()
  reader.onload = e => {
    foto.value = (e.target?.result as string) || null
    target.value = ''
  }
  reader.onerror = () => {
    photoUploadError.value = 'Gagal membaca berkas gambar.'
    target.value = ''
  }
  reader.readAsDataURL(file)
}

function handleRemovePhoto() {
  foto.value = null
  photoUploadError.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

// Quick add warehouse handler
function openAddGudangModal() {
  newGudangNama.value = ''
  newGudangError.value = ''
  showAddGudangModal.value = true
}

function saveNewGudang() {
  if (!newGudangNama.value.trim()) {
    newGudangError.value = 'Nama gudang wajib diisi.'
    return
  }
  try {
    const created = referenceService.addGudang(newGudangNama.value.trim())
    if (!dbGudangList.value.some(g => g.id === created.id)) {
      dbGudangList.value.push({ id: created.id, nama: created.nama })
    }
    gudang_id.value = created.id
    showAddGudangModal.value = false
  } catch (err) {
    newGudangError.value = err instanceof Error ? err.message : 'Gagal menambah gudang.'
  }
}

// Quick add unit handler
function openAddSatuanModal(target: 'pakai' | 'beli') {
  targetSatuanType.value = target
  newSatuanNama.value = ''
  newSatuanError.value = ''
  showAddSatuanModal.value = true
}

function saveNewSatuan() {
  if (!newSatuanNama.value.trim()) {
    newSatuanError.value = 'Nama satuan wajib diisi.'
    return
  }
  try {
    const created = referenceService.addSatuan(newSatuanNama.value.trim())
    if (targetSatuanType.value === 'pakai') {
      if (!dbSatuanPakaiList.value.some(s => s.id === created.id)) {
        dbSatuanPakaiList.value.push({ id: created.id, nama: created.nama })
      }
      satuan_pakai_id.value = created.id
    } else {
      if (!dbSatuanBeliList.value.some(s => s.id === created.id)) {
        dbSatuanBeliList.value.push({ id: created.id, nama: created.nama })
      }
      satuan_beli_id.value = created.id
    }
    showAddSatuanModal.value = false
  } catch (err) {
    newSatuanError.value = err instanceof Error ? err.message : 'Gagal menambah satuan.'
  }
}

// Konversi Satuan Handlers
function addKonversiRow() {
  const defaultSatuan = dbSatuanBeliList.value[0] || MOCK_SATUAN_BELI[0]
  konversiList.value.push({
    satuan_id: defaultSatuan.id,
    nilai: 1,
    default: konversiList.value.length === 0 ? 1 : 0
  })
}

function removeKonversiRow(index: number) {
  konversiList.value.splice(index, 1)
}

function validate(): boolean {
  errors.value = {}

  if (!nama.value.trim()) {
    errors.value.nama = 'Nama bahan wajib diisi.'
  }

  if (min_qty.value !== null && min_qty.value < 0) {
    errors.value.min_qty = 'Minimum kuantitas tidak boleh negatif.'
  }

  if (qty.value !== null && qty.value < 0) {
    errors.value.qty = 'Kuantitas tidak boleh negatif.'
  }

  if (harga_satuan.value !== null && harga_satuan.value < 0) {
    errors.value.harga_satuan = 'Harga satuan tidak boleh negatif.'
  }

  return Object.keys(errors.value).length === 0
}

function handleSubmit() {
  if (!validate()) return

  const payload: CreateMaterialDto = {
    kode: kode.value.trim() || null,
    nama: nama.value.trim(),
    min_qty: min_qty.value !== null ? Number(min_qty.value) : 0,
    qty: qty.value !== null ? Number(qty.value) : 0,
    satuan_pakai_id: satuan_pakai_id.value ? Number(satuan_pakai_id.value) : null,
    satuan_beli_id: satuan_beli_id.value ? Number(satuan_beli_id.value) : null,
    gudang_id: gudang_id.value ? Number(gudang_id.value) : null,
    harga_satuan: harga_satuan.value !== null ? Number(harga_satuan.value) : null,
    foto: foto.value ? foto.value.trim() : null,
    deskripsi: deskripsi.value.trim() || null,
    status: Number(status.value),
    konversi_satuan: konversiList.value.filter(k => k.satuan_id && k.nilai > 0)
  }

  emit('submit', payload)
}
</script>

<template>
  <AppCrudForm
    :model-value="modelValue"
    title="Master Data Bahan"
    :is-edit="isEdit"
    :loading="loading"
    size="xl"
    @update:model-value="emit('update:modelValue', $event)"
    @submit="handleSubmit"
    @cancel="emit('update:modelValue', false)"
  >
    <!-- Hidden File Input for Image Upload -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      class="hidden"
      @change="handleFileChange"
    />

    <div class="space-y-4">
      <!-- Section 1: Identitas Utama (Kode & Nama) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="space-y-1.5">
          <AppFormLabel for-id="bhn-kode">Kode Bahan</AppFormLabel>
          <AppInput
            id="bhn-kode"
            v-model="kode"
            placeholder="Contoh: BHN-001 (Otomatis jika kosong)"
            :disabled="loading"
          />
          <p class="text-[11px] text-slate-400">Kode unik identifikasi material dalam inventori.</p>
        </div>

        <div class="space-y-1.5">
          <AppFormLabel for-id="bhn-nama" required>Nama Bahan</AppFormLabel>
          <AppInput
            id="bhn-nama"
            v-model="nama"
            placeholder="Contoh: Kayu Jati Solid Grade A 3cm x 20cm"
            :error="errors.nama"
            :disabled="loading"
            required
          />
          <span v-if="errors.nama" class="text-xs text-rose-600 font-medium block">
            {{ errors.nama }}
          </span>
          <p v-else class="text-[11px] text-slate-400">
            Nama lengkap spesifikasi material atau bahan baku.
          </p>
        </div>
      </div>

      <!-- Section 2: Gudang & Harga Satuan -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <AppFormLabel for-id="bhn-gudang">Lokasi Gudang Penyimpanan</AppFormLabel>
            <button
              type="button"
              class="text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline inline-flex items-center gap-1 focus:outline-none"
              title="Tambah Gudang Baru Langsung"
              @click="openAddGudangModal"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>Tambah Gudang</span>
            </button>
          </div>
          <AppSearchableSelect
            id="bhn-gudang"
            :model-value="gudang_id"
            :options="gudangOptions"
            placeholder="-- Cari atau Pilih Lokasi Gudang --"
            action-text="+ Tambah Gudang Baru Langsung"
            :disabled="loading"
            @update:model-value="gudang_id = $event ? Number($event) : null"
            @action="openAddGudangModal"
          />
          <p class="text-[11px] text-slate-400">Pilih fasilitas gudang tempat material disimpan.</p>
        </div>

        <div class="space-y-1.5">
          <AppFormLabel for-id="bhn-harga">Harga Satuan Bahan (Rp)</AppFormLabel>
          <AppInput
            id="bhn-harga"
            v-model.number="harga_satuan"
            type="number"
            placeholder="Contoh: 150000"
            :error="errors.harga_satuan"
            :disabled="loading"
          />
          <span v-if="errors.harga_satuan" class="text-xs text-rose-600 font-medium block">
            {{ errors.harga_satuan }}
          </span>
          <p v-else class="text-[11px] text-slate-400">
            Standar harga per satuan pakai dalam Rupiah.
          </p>
        </div>
      </div>

      <!-- Section 3: Satuan Pakai & Satuan Beli (dengan Quick Add) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <AppFormLabel for-id="bhn-satuan-pakai">Satuan Pakai (Produksi)</AppFormLabel>
            <button
              type="button"
              class="text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline inline-flex items-center gap-1 focus:outline-none"
              title="Tambah Satuan Baru Langsung"
              @click="openAddSatuanModal('pakai')"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>Tambah Satuan</span>
            </button>
          </div>
          <AppSearchableSelect
            id="bhn-satuan-pakai"
            :model-value="satuan_pakai_id"
            :options="satuanPakaiOptions"
            placeholder="-- Cari atau Pilih Satuan Pakai --"
            action-text="+ Tambah Satuan Baru Langsung"
            :disabled="loading"
            @update:model-value="satuan_pakai_id = $event ? Number($event) : null"
            @action="openAddSatuanModal('pakai')"
          />
          <p class="text-[11px] text-slate-400">
            Satuan yang digunakan di lini produksi (misal: Batang, Lembar, Meter).
          </p>
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <AppFormLabel for-id="bhn-satuan-beli">Satuan Beli (Pengadaan / PO)</AppFormLabel>
            <button
              type="button"
              class="text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline inline-flex items-center gap-1 focus:outline-none"
              title="Tambah Satuan Baru Langsung"
              @click="openAddSatuanModal('beli')"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>Tambah Satuan</span>
            </button>
          </div>
          <AppSearchableSelect
            id="bhn-satuan-beli"
            :model-value="satuan_beli_id"
            :options="satuanBeliOptions"
            placeholder="-- Cari atau Pilih Satuan Beli --"
            action-text="+ Tambah Satuan Baru Langsung"
            :disabled="loading"
            @update:model-value="satuan_beli_id = $event ? Number($event) : null"
            @action="openAddSatuanModal('beli')"
          />
          <p class="text-[11px] text-slate-400">
            Satuan saat dibeli dari supplier (misal: Kubik, Palet, Roll, Dus).
          </p>
        </div>
      </div>

      <!-- Section 4: Min QTY & QTY Stok -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="space-y-1.5">
          <AppFormLabel for-id="bhn-min-qty">Batas Minimum Stok (Min QTY)</AppFormLabel>
          <AppInput
            id="bhn-min-qty"
            v-model.number="min_qty"
            type="number"
            placeholder="Contoh: 10"
            :error="errors.min_qty"
            :disabled="loading"
          />
          <span v-if="errors.min_qty" class="text-xs text-rose-600 font-medium block">
            {{ errors.min_qty }}
          </span>
          <p v-else class="text-[11px] text-slate-400">
            Batas peringatan darurat: sistem akan menandai status "Stok Limit" jika kuantitas kurang
            dari angka ini.
          </p>
        </div>

        <div class="space-y-1.5">
          <AppFormLabel for-id="bhn-qty">
            {{
              isEdit ? 'Kuantitas Stok Saat Ini (QTY - Terkunci)' : 'Kuantitas Stok Awal (QTY Awal)'
            }}
          </AppFormLabel>
          <AppInput
            id="bhn-qty"
            v-model.number="qty"
            type="number"
            placeholder="0"
            :error="errors.qty"
            :disabled="isEdit || loading"
          />
          <span v-if="errors.qty" class="text-xs text-rose-600 font-medium block">
            {{ errors.qty }}
          </span>
          <div
            v-if="isEdit"
            class="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2 flex items-start gap-1.5"
          >
            <Info class="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span
              >Perubahan kuantitas stok langsung dikunci demi audit trail. Penyesuaian fisik &
              mutasi dikelola melalui modul <strong>Transaksi Stok (Sprint 5)</strong>.</span
            >
          </div>
          <p v-else class="text-[11px] text-slate-400">
            Kuantitas fisik awal bahan baku yang ada saat data pertama kali didaftarkan.
          </p>
        </div>
      </div>

      <!-- Section 5: Foto Bahan / Produk (File Upload) -->
      <div class="space-y-1.5 pt-1">
        <AppFormLabel for-id="bhn-foto">Foto Bahan / Produk</AppFormLabel>

        <!-- Image Upload Dropzone / Preview Area -->
        <div class="border border-slate-200 rounded-lg p-3 bg-slate-50/60">
          <!-- State: Image Selected -->
          <div v-if="foto" class="flex items-center gap-4">
            <div
              class="w-20 h-20 rounded-lg border border-slate-300 bg-white overflow-hidden shrink-0 shadow-2xs"
            >
              <img
                :src="foto"
                alt="Foto Bahan"
                class="w-full h-full object-cover"
                @error="foto = null"
              />
            </div>

            <div class="space-y-1.5 flex-1">
              <p class="text-xs font-semibold text-slate-800">Berkas foto berhasil diunggah</p>
              <p class="text-[11px] text-slate-500">
                Foto akan ditampilkan pada tabel inventori dan kartu detail spesifikasi bahan.
              </p>
              <div class="flex items-center gap-2 pt-1">
                <AppButton
                  type="button"
                  variant="secondary"
                  size="xs"
                  :disabled="loading"
                  @click="triggerFileInput"
                >
                  <template #left-icon>
                    <RotateCcw class="w-3 h-3" />
                  </template>
                  Ganti Foto
                </AppButton>

                <AppButton
                  type="button"
                  variant="danger"
                  size="xs"
                  :disabled="loading"
                  @click="handleRemovePhoto"
                >
                  <template #left-icon>
                    <Trash2 class="w-3 h-3" />
                  </template>
                  Hapus Foto
                </AppButton>
              </div>
            </div>
          </div>

          <!-- State: No Image Selected -->
          <div
            v-else
            class="border-2 border-dashed border-slate-300 hover:border-teal-600 rounded-lg p-4 text-center cursor-pointer transition-colors bg-white group"
            @click="triggerFileInput"
          >
            <div class="flex flex-col items-center justify-center gap-1.5">
              <div
                class="w-9 h-9 rounded-full bg-teal-50 group-hover:bg-teal-100 text-teal-700 flex items-center justify-center transition-colors"
              >
                <Upload class="w-4 h-4" />
              </div>
              <div>
                <p class="text-xs font-semibold text-slate-700 group-hover:text-teal-700">
                  Pilih berkas foto atau klik di sini untuk mengunggah
                </p>
                <p class="text-[11px] text-slate-400 mt-0.5">
                  Format gambar yang didukung: JPG, PNG, atau WebP (Maksimal 2 MB)
                </p>
              </div>
            </div>
          </div>

          <span v-if="photoUploadError" class="text-xs text-rose-600 font-medium block mt-1.5">
            {{ photoUploadError }}
          </span>
        </div>
      </div>

      <!-- Section 6: Deskripsi & Status -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
        <div class="sm:col-span-2 space-y-1.5">
          <AppFormLabel for-id="bhn-deskripsi">Deskripsi & Spesifikasi Bahan</AppFormLabel>
          <AppTextarea
            id="bhn-deskripsi"
            v-model="deskripsi"
            placeholder="Tuliskan spesifikasi teknis, kadar air kayu (MC%), grade kualitas, atau catatan aplikasi..."
            :rows="2"
            :disabled="loading"
          />
        </div>

        <div class="space-y-1.5">
          <AppFormLabel>Status Bahan</AppFormLabel>
          <div class="flex flex-col gap-2 pt-1.5">
            <label
              class="inline-flex items-center gap-2 cursor-pointer text-xs p-2 rounded border transition-colors"
              :class="[
                status === 1
                  ? 'border-teal-500 bg-teal-50/50'
                  : 'border-slate-200 hover:bg-slate-50'
              ]"
            >
              <input
                v-model="status"
                type="radio"
                :value="1"
                class="text-teal-600 focus:ring-teal-500"
              />
              <span class="font-medium text-slate-800">Aktif (Dapat Digunakan)</span>
            </label>

            <label
              class="inline-flex items-center gap-2 cursor-pointer text-xs p-2 rounded border transition-colors"
              :class="[
                status === 0
                  ? 'border-rose-400 bg-rose-50/50'
                  : 'border-slate-200 hover:bg-slate-50'
              ]"
            >
              <input
                v-model="status"
                type="radio"
                :value="0"
                class="text-rose-600 focus:ring-rose-500"
              />
              <span class="font-medium text-slate-800">Nonaktif (Diarsipkan)</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Section 7: Konversi Satuan (konversi_satuan_bahan) -->
      <div class="pt-4 border-t border-slate-200 space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Scale class="w-4 h-4 text-teal-700" />
              Aturan Konversi Satuan (konversi_satuan_bahan)
            </h4>
            <p class="text-[11px] text-slate-500 mt-0.5">
              Aturan konversi otomatis dari satuan pembelian grosir ke satuan pemakaian produksi
              (misal: 1 Kubik = 25 Batang).
            </p>
          </div>

          <AppButton type="button" variant="secondary" size="xs" @click="addKonversiRow">
            <template #left-icon>
              <Plus class="w-3.5 h-3.5" />
            </template>
            <span>Tambah Konversi</span>
          </AppButton>
        </div>

        <div
          v-if="konversiList.length === 0"
          class="p-4 text-center bg-slate-50 border border-slate-200 rounded-lg text-slate-400 text-xs"
        >
          Belum ada aturan konversi satuan khusus. Klik tombol
          <strong class="text-slate-600">"+ Tambah Konversi"</strong> jika bahan dibeli dalam satuan
          besar/grosir.
        </div>

        <div v-else class="space-y-2.5">
          <div
            v-for="(row, idx) in konversiList"
            :key="idx"
            class="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col md:flex-row items-stretch md:items-center gap-3"
          >
            <!-- Target Satuan Select with Search -->
            <div class="flex-1 space-y-1">
              <span class="text-[10px] font-semibold text-slate-500 uppercase block"
                >1 Satuan Pembelian</span
              >
              <AppSearchableSelect
                :model-value="row.satuan_id"
                :options="satuanBeliOptions"
                placeholder="-- Pilih Satuan --"
                size="sm"
                @update:model-value="row.satuan_id = $event ? Number($event) : row.satuan_id"
              />
            </div>

            <div class="text-center font-bold text-slate-400 md:pt-4 text-sm">=</div>

            <!-- Nilai Konversi -->
            <div class="w-full md:w-36 space-y-1">
              <span class="text-[10px] font-semibold text-slate-500 uppercase block"
                >Faktor Konversi</span
              >
              <AppInput
                v-model.number="row.nilai"
                type="number"
                placeholder="Nilai angka"
                size="sm"
              />
            </div>

            <!-- Satuan Pakai Label Reference -->
            <div class="md:w-32 space-y-1 md:pt-4 text-xs font-semibold text-teal-800">
              {{ referenceService.getSatuanPakaiName(satuan_pakai_id) }}
            </div>

            <!-- Default checkbox & remove button -->
            <div class="flex items-center gap-3 md:pt-4 justify-between md:justify-end">
              <label class="inline-flex items-center gap-1.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  :checked="row.default === 1"
                  class="rounded text-teal-600 focus:ring-teal-500"
                  @change="row.default = ($event.target as HTMLInputElement).checked ? 1 : 0"
                />
                <span class="text-slate-600 text-[11px]">Default</span>
              </label>

              <button
                type="button"
                class="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                title="Hapus baris konversi"
                @click="removeKonversiRow(idx)"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Add Gudang Modal -->
    <AppModal
      :model-value="showAddGudangModal"
      title="Tambah Lokasi Gudang Baru"
      size="sm"
      @update:model-value="showAddGudangModal = $event"
    >
      <div class="space-y-3 p-1">
        <div
          class="flex items-center gap-2 p-2 bg-teal-50 border border-teal-200 rounded text-xs text-teal-800"
        >
          <Building2 class="w-4 h-4 shrink-0 text-teal-700" />
          <span>Gudang baru akan otomatis terdaftar dan langsung terpilih pada formulir ini.</span>
        </div>

        <div class="space-y-1.5">
          <AppFormLabel for-id="new-gudang-nama" required>Nama Gudang Baru</AppFormLabel>
          <AppInput
            id="new-gudang-nama"
            v-model="newGudangNama"
            placeholder="Contoh: Gudang Transit Logistik Candi"
            :error="newGudangError"
            autofocus
            @keydown.enter.prevent="saveNewGudang"
          />
          <span v-if="newGudangError" class="text-xs text-rose-600 font-medium block">
            {{ newGudangError }}
          </span>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <AppButton variant="secondary" size="sm" @click="showAddGudangModal = false">
            Batal
          </AppButton>
          <AppButton variant="primary" size="sm" @click="saveNewGudang"> Simpan & Pilih </AppButton>
        </div>
      </template>
    </AppModal>

    <!-- Quick Add Satuan Modal -->
    <AppModal
      :model-value="showAddSatuanModal"
      :title="`Tambah Satuan ${targetSatuanType === 'pakai' ? 'Pakai' : 'Beli'} Baru`"
      size="sm"
      @update:model-value="showAddSatuanModal = $event"
    >
      <div class="space-y-3 p-1">
        <div
          class="flex items-center gap-2 p-2 bg-teal-50 border border-teal-200 rounded text-xs text-teal-800"
        >
          <Scale class="w-4 h-4 shrink-0 text-teal-700" />
          <span>Satuan baru akan otomatis terdaftar dalam sistem dan langsung terpilih.</span>
        </div>

        <div class="space-y-1.5">
          <AppFormLabel for-id="new-satuan-nama" required>Nama / Simbol Satuan</AppFormLabel>
          <AppInput
            id="new-satuan-nama"
            v-model="newSatuanNama"
            placeholder="Contoh: Karton, Slop, Yard, Bundle"
            :error="newSatuanError"
            autofocus
            @keydown.enter.prevent="saveNewSatuan"
          />
          <span v-if="newSatuanError" class="text-xs text-rose-600 font-medium block">
            {{ newSatuanError }}
          </span>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <AppButton variant="secondary" size="sm" @click="showAddSatuanModal = false">
            Batal
          </AppButton>
          <AppButton variant="primary" size="sm" @click="saveNewSatuan"> Simpan & Pilih </AppButton>
        </div>
      </template>
    </AppModal>
  </AppCrudForm>
</template>
