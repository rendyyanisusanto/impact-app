<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppFormLabel from '@/shared/components/ui/AppFormLabel.vue'
import AppSearchableSelect, {
  type SearchableOption
} from '@/shared/components/ui/AppSearchableSelect.vue'
import type { SatuanPakai, CreateSatuanPakaiDto, UpdateSatuanPakaiDto } from '../types/unit.types'
import { satuanBeliService } from '../services/unit.service'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    open?: boolean
    isEdit?: boolean
    initialData?: SatuanPakai | null
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
  (e: 'submit', form: CreateSatuanPakaiDto | UpdateSatuanPakaiDto): void
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
  satuan_beli_id: number | null
  pembagi: number
}

const form = reactive<FormState>({
  kode: '',
  nama: '',
  satuan_beli_id: 1,
  pembagi: 1
})

const errors = reactive<Record<string, string>>({})
const satuanBeliOptions = ref<SearchableOption[]>([])

async function loadSatuanBeliOptions() {
  const res = await satuanBeliService.getAll({ pageSize: 1000 })
  satuanBeliOptions.value = res.data.map(b => ({
    label: `${b.nama} (${b.kode})`,
    value: b.id
  }))
}

watch(
  () => isOpen.value,
  async val => {
    if (val) {
      await loadSatuanBeliOptions()
      Object.keys(errors).forEach(k => delete errors[k])
      if (props.initialData) {
        form.kode = props.initialData.kode || ''
        form.nama = props.initialData.nama || ''
        form.satuan_beli_id =
          props.initialData.satuan_beli_id ?? (satuanBeliOptions.value[0]?.value as number) ?? 1
        form.pembagi = props.initialData.pembagi ?? 1
      } else {
        form.kode = ''
        form.nama = ''
        form.satuan_beli_id = (satuanBeliOptions.value[0]?.value as number) ?? 1
        form.pembagi = 1
      }
    }
  },
  { immediate: true }
)

function validate(): boolean {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.nama.trim()) {
    errors.nama = 'Nama satuan pakai wajib diisi'
  }
  if (isNaN(form.pembagi) || form.pembagi <= 0) {
    errors.pembagi = 'Nilai pembagi harus lebih besar dari 0 (tidak boleh 0 atau negatif)'
  }
  return Object.keys(errors).length === 0
}

function handleSubmit() {
  if (!validate()) return

  emit('submit', {
    ...(isEditMode.value && props.initialData?.id ? { id: props.initialData.id } : {}),
    kode: form.kode.trim() || undefined,
    nama: form.nama.trim(),
    satuan_beli_id: form.satuan_beli_id ? Number(form.satuan_beli_id) : null,
    pembagi: Number(form.pembagi)
  })
}
</script>

<template>
  <AppModal
    :model-value="isOpen"
    :title="isEditMode ? 'Edit Satuan Pakai' : 'Tambah Satuan Pakai Baru'"
    size="md"
    @update:model-value="isOpen = $event"
    @close="isOpen = false"
  >
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div>
        <AppFormLabel for="sp-kode">Kode Satuan Pakai</AppFormLabel>
        <AppInput
          id="sp-kode"
          v-model="form.kode"
          placeholder="Auto-generate jika kosong (cth: BTG, LBR)"
          :error="errors.kode"
        />
      </div>

      <div>
        <AppFormLabel for="sp-nama" required>Nama Satuan Pakai</AppFormLabel>
        <AppInput
          id="sp-nama"
          v-model="form.nama"
          placeholder="Masukkan nama satuan pemakaian (cth: Lembar / Batang)"
          :error="errors.nama"
        />
        <p v-if="errors.nama" class="text-xs text-red-600 mt-1">{{ errors.nama }}</p>
      </div>

      <div>
        <AppFormLabel for="sp-satuan-beli">Satuan Beli Referensi</AppFormLabel>
        <AppSearchableSelect
          id="sp-satuan-beli"
          v-model="form.satuan_beli_id"
          :options="satuanBeliOptions"
          placeholder="Pilih Satuan Beli"
        />
      </div>

      <div>
        <AppFormLabel for="sp-pembagi" required>Faktor Pembagi (decimal 20,6)</AppFormLabel>
        <AppInput
          id="sp-pembagi"
          v-model.number="form.pembagi"
          type="number"
          step="any"
          min="0.000001"
          placeholder="1"
          :error="errors.pembagi"
        />
        <p v-if="errors.pembagi" class="text-xs text-red-600 mt-1">{{ errors.pembagi }}</p>
        <p class="text-xs text-slate-400 mt-1">
          1 Satuan Beli = {{ form.pembagi }} Satuan Pakai (pembagi untuk konversi stok saat
          penerimaan & pemakaian).
        </p>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <AppButton variant="outline" :disabled="loading" @click="isOpen = false"> Batal </AppButton>
        <AppButton variant="primary" :loading="loading" @click="handleSubmit">
          {{ isEditMode ? 'Simpan Perubahan' : 'Tambah Satuan Pakai' }}
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>
