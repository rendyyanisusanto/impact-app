<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppTextarea from '@/shared/components/ui/AppTextarea.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import AppFormLabel from '@/shared/components/ui/AppFormLabel.vue'
import type { Gudang, CreateWarehouseDto, UpdateWarehouseDto } from '../types/warehouse.types'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    open?: boolean
    isEdit?: boolean
    initialData?: Gudang | null
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
  (e: 'submit', form: CreateWarehouseDto | UpdateWarehouseDto): void
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
  alamat: string
  status: number
}

const form = reactive<FormState>({
  kode: '',
  nama: '',
  color: '#000000',
  alamat: '',
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
        form.color = props.initialData.color || '#000000'
        form.alamat = props.initialData.alamat || ''
        form.status = props.initialData.status ?? 1
      } else {
        form.kode = ''
        form.nama = ''
        form.color = '#000000'
        form.alamat = ''
        form.status = 1
      }
    }
  },
  { immediate: true }
)

function validate(): boolean {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.nama.trim()) {
    errors.nama = 'Nama gudang wajib diisi'
  }
  return Object.keys(errors).length === 0
}

function handleSubmit() {
  if (!validate()) return

  emit('submit', {
    ...(isEditMode.value && props.initialData?.id ? { id: props.initialData.id } : {}),
    kode: form.kode.trim() || undefined,
    nama: form.nama.trim(),
    color: form.color.trim() || '#000000',
    alamat: form.alamat.trim() || null,
    status: Number(form.status)
  })
}
</script>

<template>
  <AppModal
    :model-value="isOpen"
    :title="isEditMode ? 'Edit Gudang' : 'Tambah Gudang Baru'"
    size="md"
    @update:model-value="isOpen = $event"
    @close="isOpen = false"
  >
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <!-- Kode Gudang -->
      <div>
        <AppFormLabel for="gd-kode">Kode Gudang</AppFormLabel>
        <AppInput
          id="gd-kode"
          v-model="form.kode"
          placeholder="Auto-generate jika kosong (cth: GD-7745)"
          :error="errors.kode"
        />
      </div>

      <!-- Nama Gudang -->
      <div>
        <AppFormLabel for="gd-nama" required>Nama Gudang</AppFormLabel>
        <AppInput
          id="gd-nama"
          v-model="form.nama"
          placeholder="Masukkan nama gudang (cth: Gudang Utama)"
          :error="errors.nama"
        />
        <p v-if="errors.nama" class="text-xs text-red-600 mt-1">{{ errors.nama }}</p>
      </div>

      <!-- Color Picker -->
      <div>
        <AppFormLabel for="gd-color">Warna Label / Tag</AppFormLabel>
        <div class="flex items-center gap-3">
          <input
            id="gd-color"
            v-model="form.color"
            type="color"
            class="w-10 h-10 p-0.5 rounded border border-slate-300 dark:border-slate-600 cursor-pointer bg-transparent"
          />
          <AppInput v-model="form.color" placeholder="#000000" class="w-32 font-mono uppercase" />
          <div
            class="px-2.5 py-1 rounded text-xs text-white font-medium shadow-xs"
            :style="{ backgroundColor: form.color || '#000' }"
          >
            Preview Tag
          </div>
        </div>
      </div>

      <!-- Alamat Gudang -->
      <div>
        <AppFormLabel for="gd-alamat">Alamat Gudang</AppFormLabel>
        <AppTextarea
          id="gd-alamat"
          v-model="form.alamat"
          :rows="2"
          placeholder="Alamat lengkap lokasi gudang..."
        />
      </div>

      <!-- Status -->
      <div>
        <AppFormLabel for="gd-status">Status</AppFormLabel>
        <AppSelect id="gd-status" v-model="form.status" :options="statusOptions" />
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <AppButton variant="outline" :disabled="loading" @click="isOpen = false"> Batal </AppButton>
        <AppButton variant="primary" :loading="loading" @click="handleSubmit">
          {{ isEditMode ? 'Simpan Perubahan' : 'Tambah Gudang' }}
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>
