<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import AppFormLabel from '@/shared/components/ui/AppFormLabel.vue'
import type {
  KategoriBahan,
  CreateMaterialCategoryDto,
  UpdateMaterialCategoryDto
} from '../types/material-category.types'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    open?: boolean
    isEdit?: boolean
    initialData?: KategoriBahan | null
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
  (e: 'submit', form: CreateMaterialCategoryDto | UpdateMaterialCategoryDto): void
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
  color: string
  status: number
}

const form = reactive<FormState>({
  kode: '',
  nama: '',
  color: '#2980b9',
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
        form.color = props.initialData.color || '#2980b9'
        form.status = props.initialData.status ?? 1
      } else {
        form.kode = ''
        form.nama = ''
        form.color = '#2980b9'
        form.status = 1
      }
    }
  },
  { immediate: true }
)

function validate(): boolean {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.nama.trim()) {
    errors.nama = 'Nama kategori bahan wajib diisi'
  }
  return Object.keys(errors).length === 0
}

function handleSubmit() {
  if (!validate()) return

  emit('submit', {
    ...(isEditMode.value && props.initialData?.id ? { id: props.initialData.id } : {}),
    kode: form.kode.trim() || undefined,
    nama: form.nama.trim(),
    color: form.color.trim() || '#2980b9',
    status: Number(form.status)
  })
}
</script>

<template>
  <AppModal
    :model-value="isOpen"
    :title="isEditMode ? 'Edit Kategori Bahan' : 'Tambah Kategori Bahan Baru'"
    size="md"
    @update:model-value="isOpen = $event"
    @close="isOpen = false"
  >
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div>
        <AppFormLabel for="kb-kode">Kode Kategori</AppFormLabel>
        <AppInput
          id="kb-kode"
          v-model="form.kode"
          placeholder="Auto-generate jika kosong (cth: B1)"
          :error="errors.kode"
        />
      </div>

      <div>
        <AppFormLabel for="kb-nama" required>Nama Kategori Bahan</AppFormLabel>
        <AppInput
          id="kb-nama"
          v-model="form.nama"
          placeholder="Masukkan nama kategori (cth: Bahan Utama)"
          :error="errors.nama"
        />
        <p v-if="errors.nama" class="text-xs text-red-600 mt-1">{{ errors.nama }}</p>
      </div>

      <div>
        <AppFormLabel for="kb-color">Warna Label / Tag</AppFormLabel>
        <div class="flex items-center gap-3">
          <input
            id="kb-color"
            v-model="form.color"
            type="color"
            class="w-10 h-10 p-0.5 rounded border border-slate-300 dark:border-slate-600 cursor-pointer bg-transparent"
          />
          <AppInput v-model="form.color" placeholder="#2980b9" class="w-32 font-mono uppercase" />
          <div
            class="px-2.5 py-1 rounded text-xs text-white font-medium shadow-xs"
            :style="{ backgroundColor: form.color || '#2980b9' }"
          >
            Preview Tag
          </div>
        </div>
      </div>

      <div>
        <AppFormLabel for="kb-status">Status</AppFormLabel>
        <AppSelect id="kb-status" v-model="form.status" :options="statusOptions" />
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <AppButton variant="outline" :disabled="loading" @click="isOpen = false"> Batal </AppButton>
        <AppButton variant="primary" :loading="loading" @click="handleSubmit">
          {{ isEditMode ? 'Simpan Perubahan' : 'Tambah Kategori' }}
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>
