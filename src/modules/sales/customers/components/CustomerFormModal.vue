<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import AppCrudForm from '@/shared/components/forms/AppCrudForm.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppSearchableSelect, {
  type SearchableOption
} from '@/shared/components/ui/AppSearchableSelect.vue'
import AppTextarea from '@/shared/components/ui/AppTextarea.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppFormLabel from '@/shared/components/ui/AppFormLabel.vue'
import type {
  MasterDataCustomer,
  CreateCustomerDto,
  AdditionalCustomerData
} from '../types/customer.types'
import { MOCK_PROVINCES, MOCK_CITIES, type Province, type City } from '@/mocks/references/master-references.mock'
import { referenceService } from '@/shared/services/reference.service'
import { Plus, Trash2 } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    initialData?: MasterDataCustomer | null
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
  (e: 'submit', payload: CreateCustomerDto): void
}>()

const isEdit = computed(() => !!props.initialData?.id)

// Form fields (schema: mostly nullable except nama enforced by UX)
const kode = ref('')
const nama = ref('')
const no_hp = ref('')
const email = ref('')
const province_id = ref<number | null>(null)
const city_id = ref<number | null>(null)
const alamat = ref('')
const deskripsi = ref('')
const status = ref<number>(1)
const additionalData = ref<AdditionalCustomerData[]>([])

const errors = ref<Record<string, string>>({})

// Dynamic references
const provinces = ref<Province[]>([])
const cities = ref<City[]>([])

async function loadReferences() {
  try {
    const [pList, cList] = await Promise.all([
      referenceService.getProvinces(),
      referenceService.getCities()
    ])
    provinces.value = pList
    cities.value = cList
  } catch {
    // Fallback handled by referenceService
  }
}

const provinceOptions = computed<SearchableOption[]>(() => {
  const source = provinces.value.length > 0 ? provinces.value : MOCK_PROVINCES
  return source.map(p => ({ label: p.name, value: p.id }))
})

const cityOptions = computed<SearchableOption[]>(() => {
  const source = cities.value.length > 0 ? cities.value : MOCK_CITIES
  const filtered = province_id.value
    ? source.filter(c => c.province_id === Number(province_id.value))
    : source

  return filtered.map(c => ({ label: c.name, value: c.id }))
})

watch(province_id, async (newProv, oldProv) => {
  if (newProv && Number(newProv) > 0) {
    try {
      const list = await referenceService.getCities(Number(newProv))
      if (list && list.length > 0) {
        for (const item of list) {
          if (!cities.value.some(c => c.id === item.id)) {
            cities.value.push(item)
          }
        }
      }
    } catch {
      // Ignore
    }
  }

  if (newProv !== oldProv && city_id.value) {
    const source = cities.value.length > 0 ? cities.value : MOCK_CITIES
    const valid = source.some(
      c => c.id === Number(city_id.value) && c.province_id === Number(newProv)
    )
    if (!valid) {
      city_id.value = null
    }
  }
})

watch(
  () => props.modelValue,
  isOpen => {
    if (isOpen) {
      loadReferences()
      errors.value = {}
      if (props.initialData) {
        kode.value = props.initialData.kode || ''
        nama.value = props.initialData.nama || ''
        no_hp.value = props.initialData.no_hp || ''
        email.value = props.initialData.email || ''
        province_id.value = props.initialData.province_id
          ? Number(props.initialData.province_id)
          : null
        city_id.value = props.initialData.city_id ? Number(props.initialData.city_id) : null
        alamat.value = props.initialData.alamat || ''
        deskripsi.value = props.initialData.deskripsi || ''
        status.value =
          props.initialData.status !== null && props.initialData.status !== undefined
            ? Number(props.initialData.status)
            : 1
        const rawAdditional =
          props.initialData.additional_data ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (props.initialData as any).additionalData ||
          []
        additionalData.value = Array.isArray(rawAdditional)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? rawAdditional.map((a: any) => ({
              id: a.id,
              customer_id: a.customer_id,
              name: a.name || '',
              value: a.value || ''
            }))
          : []
      } else {
        kode.value = ''
        nama.value = ''
        no_hp.value = ''
        email.value = ''
        province_id.value = null
        city_id.value = null
        alamat.value = ''
        deskripsi.value = ''
        status.value = 1
        additionalData.value = []
      }
    }
  },
  { immediate: true }
)

function addAdditionalRow() {
  additionalData.value.push({ name: '', value: '' })
}

function removeAdditionalRow(index: number) {
  additionalData.value.splice(index, 1)
}

function validate(): boolean {
  errors.value = {}

  if (!nama.value.trim()) {
    errors.value.nama = 'Nama customer wajib diisi.'
  }

  if (email.value.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.value.trim())) {
      errors.value.email = 'Format email tidak valid.'
    }
  }

  return Object.keys(errors.value).length === 0
}

function handleSubmit() {
  if (!validate()) return

  const payload: CreateCustomerDto = {
    kode: kode.value.trim() || null,
    nama: nama.value.trim(),
    no_hp: no_hp.value.trim() || null,
    email: email.value.trim() || null,
    province_id: province_id.value ? Number(province_id.value) : null,
    city_id: city_id.value ? Number(city_id.value) : null,
    alamat: alamat.value.trim() || null,
    deskripsi: deskripsi.value.trim() || null,
    status: Number(status.value),
    additional_data: additionalData.value
      .filter(a => a && a.name && a.name.trim().length > 0)
      .map(a => ({
        ...(a.id ? { id: a.id } : {}),
        name: a.name.trim(),
        value: (a.value || '').trim()
      }))
  }

  emit('submit', payload)
}
</script>

<template>
  <AppCrudForm
    :model-value="modelValue"
    title="Master Data Customer"
    :is-edit="isEdit"
    :loading="loading"
    size="xl"
    @update:model-value="emit('update:modelValue', $event)"
    @submit="handleSubmit"
    @cancel="emit('update:modelValue', false)"
  >
    <!-- Row 1: Kode & Nama -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      <div class="space-y-1">
        <AppFormLabel for-id="cust-kode">Kode Customer</AppFormLabel>
        <AppInput
          id="cust-kode"
          v-model="kode"
          placeholder="Contoh: CUST-001 (Otomatis jika kosong)"
          :disabled="loading"
        />
        <p class="text-[11px] text-slate-400">Kode identifikasi pelanggan.</p>
      </div>

      <div class="space-y-1">
        <AppFormLabel for-id="cust-nama" required>Nama Customer</AppFormLabel>
        <AppInput
          id="cust-nama"
          v-model="nama"
          placeholder="Contoh: Hotel Grand Pelangi"
          :error="errors.nama"
          :disabled="loading"
          required
        />
        <span v-if="errors.nama" class="text-xs text-rose-600 block">{{ errors.nama }}</span>
      </div>
    </div>

    <!-- Row 2: No HP & Email -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      <div class="space-y-1">
        <AppFormLabel for-id="cust-no-hp">No. HP / WhatsApp Customer</AppFormLabel>
        <AppInput
          id="cust-no-hp"
          v-model="no_hp"
          placeholder="Contoh: 081122334455"
          :disabled="loading"
        />
      </div>

      <div class="space-y-1">
        <AppFormLabel for-id="cust-email">Alamat Email Customer</AppFormLabel>
        <AppInput
          id="cust-email"
          v-model="email"
          type="email"
          placeholder="Contoh: purchasing@grandpelangi.com"
          :error="errors.email"
          :disabled="loading"
        />
        <span v-if="errors.email" class="text-xs text-rose-600 block">{{ errors.email }}</span>
      </div>
    </div>

    <!-- Row 3: Provinsi & Kota (Searchable) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      <div class="space-y-1">
        <AppFormLabel>Provinsi (Opsional)</AppFormLabel>
        <AppSearchableSelect
          :model-value="province_id"
          :options="provinceOptions"
          placeholder="-- Cari atau Pilih Provinsi --"
          :disabled="loading"
          @update:model-value="province_id = $event ? Number($event) : null"
        />
      </div>

      <div class="space-y-1">
        <AppFormLabel>Kota / Kabupaten (Opsional)</AppFormLabel>
        <AppSearchableSelect
          :model-value="city_id"
          :options="cityOptions"
          placeholder="-- Cari atau Pilih Kota --"
          :disabled="loading || cityOptions.length === 0"
          @update:model-value="city_id = $event ? Number($event) : null"
        />
      </div>
    </div>

    <!-- Row 4: Alamat -->
    <div class="space-y-1">
      <AppFormLabel for-id="cust-alamat">Alamat Pengiriman / Kantor</AppFormLabel>
      <AppTextarea
        id="cust-alamat"
        v-model="alamat"
        placeholder="Alamat lengkap customer..."
        :rows="2"
        :disabled="loading"
      />
    </div>

    <!-- Row 5: Deskripsi & Status -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-start">
      <div class="sm:col-span-2 space-y-1">
        <AppFormLabel for-id="cust-deskripsi">Deskripsi / Catatan Khusus</AppFormLabel>
        <AppInput
          id="cust-deskripsi"
          v-model="deskripsi"
          placeholder="Catatan jenis proyek atau termin khusus"
          :disabled="loading"
        />
      </div>

      <div class="space-y-1">
        <AppFormLabel>Status Customer</AppFormLabel>
        <div class="flex items-center gap-4 pt-2">
          <label class="inline-flex items-center gap-1.5 cursor-pointer text-xs">
            <input
              v-model="status"
              type="radio"
              :value="1"
              class="text-teal-600 focus:ring-teal-500"
            />
            <span class="font-medium text-slate-700">Aktif</span>
          </label>
          <label class="inline-flex items-center gap-1.5 cursor-pointer text-xs">
            <input
              v-model="status"
              type="radio"
              :value="0"
              class="text-teal-600 focus:ring-teal-500"
            />
            <span class="font-medium text-slate-700">Nonaktif</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Section: Informasi Tambahan (additional_master_data_customer) -->
    <div class="pt-3 border-t border-slate-200 space-y-2.5">
      <div class="flex items-center justify-between">
        <div>
          <h4 class="text-xs font-bold text-slate-800">Informasi Tambahan (NPWP / PIC / Termin)</h4>
          <p class="text-[11px] text-slate-400">
            Data pelengkap dinamis tabel additional_master_data_customer
          </p>
        </div>

        <AppButton type="button" variant="secondary" size="xs" @click="addAdditionalRow">
          <template #left-icon>
            <Plus class="w-3.5 h-3.5" />
          </template>
          <span>Tambah Baris</span>
        </AppButton>
      </div>

      <div
        v-if="additionalData.length === 0"
        class="p-3 text-center bg-slate-50 border border-slate-200 rounded-md text-slate-400 text-xs"
      >
        Belum ada informasi tambahan. Klik "Tambah Baris" untuk menambahkan NPWP, kontak PIC
        billing, dsb.
      </div>

      <div v-else class="space-y-2">
        <div v-for="(row, idx) in additionalData" :key="idx" class="flex items-center gap-2">
          <div class="w-1/3">
            <input
              v-model="row.name"
              type="text"
              placeholder="Keterangan (misal: NPWP)"
              class="w-full h-8 px-2.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div class="flex-1">
            <input
              v-model="row.value"
              type="text"
              placeholder="Nilai (misal: 01.998.887.6-652.000)"
              class="w-full h-8 px-2.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <button
            type="button"
            class="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer transition-colors"
            title="Hapus baris"
            @click="removeAdditionalRow(idx)"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </AppCrudForm>
</template>
