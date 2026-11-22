<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import AppFormLabel from '@/shared/components/ui/AppFormLabel.vue'
import type {
  SatuanBarang,
  CreateSatuanBarangDto,
  UpdateSatuanBarangDto
} from '../types/unit.types'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    open?: boolean
    isEdit?: boolean
    initialData?: SatuanBarang | null
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
  (e: 'submit', form: CreateSatuanBarangDto | UpdateSatuanBarangDto): void
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
  status: number
}

const form = reactive<FormState>({
  kode: '',
  nama: '',
  status: 1
})

const errors = reactive<Record<string, string>>({})

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
        form.status = props.initialData.status ?? 1
      } else {
        form.kode = ''
        form.nama = ''
        form.status = 1
      }
    }
  },
  { immediate: true }
)

function validate(): boolean {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.nama.trim()) {
    errors.nama = 'Nama satuan produk wajib diisi'
  }
  return Object.keys(errors).length === 0
}

function handleSubmit() {
  if (!validate()) return

  emit('submit', {
    ...(isEditMode.value && props.initialData?.id ? { id: props.initialData.id } : {}),
    kode: form.kode.trim() || undefined,
    nama: form.nama.trim(),
    status: Number(form.status)
  })
}
</script>

<template>
  <AppModal
    :model-value="isOpen"
    :title="isEditMode ? 'Edit Satuan Produk' : 'Tambah Satuan Produk Baru'"
    size="md"
    @update:model-value="isOpen = $event"
    @close="isOpen = false"
  >
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div>
        <AppFormLabel for="sbrg-kode">Kode Satuan</AppFormLabel>
        <AppInput
          id="sbrg-kode"
          v-model="form.kode"
          placeholder="Auto-generate jika kosong (cth: PCS, SET)"
          :error="errors.kode"
        />
      </div>

      <div>
        <AppFormLabel for="sbrg-nama" required>Nama Satuan Produk</AppFormLabel>
        <AppInput
          id="sbrg-nama"
          v-model="form.nama"
          placeholder="Masukkan nama satuan unit produk (cth: Pcs / Unit)"
          :error="errors.nama"
        />
        <p v-if="errors.nama" class="text-xs text-red-600 mt-1">{{ errors.nama }}</p>
      </div>

      <div>
        <AppFormLabel for="sbrg-status">Status</AppFormLabel>
        <AppSelect id="sbrg-status" v-model="form.status" :options="statusOptions" />
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <AppButton variant="outline" :disabled="loading" @click="isOpen = false"> Batal </AppButton>
        <AppButton variant="primary" :loading="loading" @click="handleSubmit">
          {{ isEditMode ? 'Simpan Perubahan' : 'Tambah Satuan' }}
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>
