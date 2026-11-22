<script setup lang="ts">
import { ref, watch } from 'vue'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import { employeeGroupService } from '../services/employee-group.service'
import { validateEmployeeGroup } from '../utils/employee-group-validation'
import type {
  EmployeeGroup,
  CreateEmployeeGroupDto,
  EmployeeGroupValidationErrors
} from '../types/employee-group.types'
import { AlertCircle, Save } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    mode?: 'create' | 'edit'
    initialData?: EmployeeGroup | null
  }>(),
  {
    modelValue: false,
    mode: 'create',
    initialData: null
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'success', group: EmployeeGroup): void
}>()

const formData = ref<CreateEmployeeGroupDto>({
  kode: '',
  nama: '',
  color: '#0F766E',
  status_aktif: 1
})

const errors = ref<EmployeeGroupValidationErrors>({})
const isSubmitting = ref(false)

const statusOptions = [
  { value: '1', label: 'AKTIF' },
  { value: '0', label: 'TIDAK AKTIF' }
]

watch(
  () => props.modelValue,
  async isOpen => {
    if (isOpen) {
      errors.value = {}
      if (props.initialData) {
        formData.value = {
          kode: props.initialData.kode || '',
          nama: props.initialData.nama || '',
          color: props.initialData.color || '#0F766E',
          status_aktif:
            props.initialData.status_aktif !== undefined ? props.initialData.status_aktif : 1
        }
      } else {
        const groups = await employeeGroupService.getAll()
        const nextNum = groups.length + 1
        formData.value = {
          kode: `GRP${nextNum}`,
          nama: '',
          color: '#0F766E',
          status_aktif: 1
        }
      }
    }
  }
)

async function handleSubmit() {
  if (isSubmitting.value) return

  const allGroups = await employeeGroupService.getAll()
  const validation = validateEmployeeGroup(formData.value, allGroups, props.initialData?.id)

  if (!validation.isValid) {
    errors.value = validation.errors
    return
  }

  errors.value = {}
  isSubmitting.value = true

  try {
    let saved: EmployeeGroup
    if (props.mode === 'edit' && props.initialData) {
      saved = await employeeGroupService.update(props.initialData.id, formData.value)
    } else {
      saved = await employeeGroupService.create(formData.value)
    }

    emit('success', saved)
    emit('update:modelValue', false)
  } catch (err: unknown) {
    errors.value = {
      nama: err instanceof Error ? err.message : 'Gagal menyimpan grup karyawan'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AppModal
    :model-value="modelValue"
    :title="mode === 'create' ? 'Tambah Master Data Grup Karyawan' : 'Ubah Grup Karyawan'"
    size="md"
    @update:model-value="val => emit('update:modelValue', val)"
  >
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <!-- Kode Grup -->
      <div>
        <label class="block text-xs font-semibold text-text mb-1">
          Kode Grup <span class="text-rose-500">*</span>
        </label>
        <AppInput
          v-model="formData.kode"
          placeholder="Contoh: GRP1"
          :class="{ 'border-rose-500': errors.kode }"
          class="w-full text-xs"
        />
        <p v-if="errors.kode" class="text-xs text-rose-500 mt-1 flex items-center gap-1">
          <AlertCircle class="w-3.5 h-3.5" /> {{ errors.kode }}
        </p>
      </div>

      <!-- Nama Grup -->
      <div>
        <label class="block text-xs font-semibold text-text mb-1">
          Nama Grup Karyawan <span class="text-rose-500">*</span>
        </label>
        <AppInput
          v-model="formData.nama"
          placeholder="Contoh: Group Gudang, Grup Driver Achmad"
          :class="{ 'border-rose-500': errors.nama }"
          class="w-full text-xs"
        />
        <p v-if="errors.nama" class="text-xs text-rose-500 mt-1 flex items-center gap-1">
          <AlertCircle class="w-3.5 h-3.5" /> {{ errors.nama }}
        </p>
      </div>

      <!-- Warna / Label Color -->
      <div>
        <label class="block text-xs font-semibold text-text mb-1">
          Warna Tag / Identifikasi Grup <span class="text-rose-500">*</span>
        </label>
        <div class="flex items-center gap-3">
          <input
            v-model="formData.color"
            type="color"
            class="h-9 w-14 rounded border border-border cursor-pointer p-0.5 bg-surface"
          />
          <AppInput v-model="formData.color" placeholder="#0F766E" class="w-36 text-xs font-mono" />
          <span
            class="inline-block w-4 h-4 rounded-full border border-border"
            :style="{ backgroundColor: formData.color || '#0F766E' }"
          />
        </div>
      </div>

      <!-- Status Aktif -->
      <div>
        <label class="block text-xs font-semibold text-text mb-1">
          Status <span class="text-rose-500">*</span>
        </label>
        <AppSelect
          :model-value="String(formData.status_aktif)"
          :options="statusOptions"
          class="w-full text-xs"
          @update:model-value="val => (formData.status_aktif = Number(val))"
        />
      </div>

      <div class="border-t border-border pt-4 flex items-center justify-end gap-2">
        <AppButton
          variant="outline"
          size="sm"
          type="button"
          @click="emit('update:modelValue', false)"
        >
          Batal
        </AppButton>
        <AppButton
          variant="primary"
          size="sm"
          type="submit"
          :loading="isSubmitting"
          class="flex items-center gap-1.5"
        >
          <Save class="w-4 h-4" /> Simpan Data
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>
