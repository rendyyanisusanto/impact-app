<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppTextarea from '@/shared/components/ui/AppTextarea.vue'
import AppFormLabel from '@/shared/components/ui/AppFormLabel.vue'
import type {
  AppSetting,
  CreateAppSettingDto,
  UpdateAppSettingDto
} from '../types/app-setting.types'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    open?: boolean
    isEdit?: boolean
    initialData?: AppSetting | null
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
  (e: 'submit', form: CreateAppSettingDto | UpdateAppSettingDto): void
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
  table: string
  name: string
  value: string
  keterangan: string
}

const form = reactive<FormState>({
  table: '',
  name: '',
  value: '',
  keterangan: ''
})

const errors = reactive<Record<string, string>>({})

watch(
  () => isOpen.value,
  val => {
    if (val) {
      Object.keys(errors).forEach(k => delete errors[k])
      if (props.initialData) {
        form.table = props.initialData.table || ''
        form.name = props.initialData.name || ''
        form.value = props.initialData.value || ''
        form.keterangan = props.initialData.keterangan || ''
      } else {
        form.table = ''
        form.name = ''
        form.value = ''
        form.keterangan = ''
      }
    }
  },
  { immediate: true }
)

function validate(): boolean {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.table.trim()) {
    errors.table = 'Modul / tabel target wajib diisi'
  }
  if (!form.name.trim()) {
    errors.name = 'Kunci pengaturan (name) wajib diisi'
  }
  if (!form.value.trim()) {
    errors.value = 'Nilai (value) wajib diisi'
  }
  return Object.keys(errors).length === 0
}

function handleSubmit() {
  if (!validate()) return

  emit('submit', {
    ...(isEditMode.value && props.initialData?.id ? { id: props.initialData.id } : {}),
    table: form.table.trim(),
    name: form.name.trim(),
    value: form.value.trim(),
    keterangan: form.keterangan.trim() || null
  })
}
</script>

<template>
  <AppModal
    :model-value="isOpen"
    :title="isEditMode ? 'Edit Setting Aplikasi' : 'Tambah Setting Baru'"
    size="md"
    @update:model-value="isOpen = $event"
    @close="isOpen = false"
  >
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div>
        <AppFormLabel for="st-table" required>Modul / Tabel Target</AppFormLabel>
        <AppInput
          id="st-table"
          v-model="form.table"
          placeholder="cth: master_data_bahan / produk / gudang"
          :error="errors.table"
        />
        <p v-if="errors.table" class="text-xs text-red-600 mt-1">{{ errors.table }}</p>
      </div>

      <div>
        <AppFormLabel for="st-name" required>Kunci Parameter (Name)</AppFormLabel>
        <AppInput
          id="st-name"
          v-model="form.name"
          placeholder="cth: kode / template_excel / start_row_excel"
          :error="errors.name"
        />
        <p v-if="errors.name" class="text-xs text-red-600 mt-1">{{ errors.name }}</p>
      </div>

      <div>
        <AppFormLabel for="st-value" required>Nilai Pengaturan (Value)</AppFormLabel>
        <AppInput
          id="st-value"
          v-model="form.value"
          placeholder="cth: Bahan/{year}{month}-{rand} atau 4"
          :error="errors.value"
        />
        <p v-if="errors.value" class="text-xs text-red-600 mt-1">{{ errors.value }}</p>
      </div>

      <div>
        <AppFormLabel for="st-keterangan">Keterangan</AppFormLabel>
        <AppTextarea
          id="st-keterangan"
          v-model="form.keterangan"
          :rows="2"
          placeholder="Deskripsi fungsi pengaturan..."
        />
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <AppButton variant="outline" :disabled="loading" @click="isOpen = false"> Batal </AppButton>
        <AppButton variant="primary" :loading="loading" @click="handleSubmit">
          {{ isEditMode ? 'Simpan Perubahan' : 'Tambah Setting' }}
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>
