<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { Tag, AlertCircle, Save } from 'lucide-vue-next'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import HolidayEmployeePicker from './HolidayEmployeePicker.vue'
import type { HolidayItem, HolidayValidationError } from '../types/holiday-settings.types'
import { getDayNameIndonesian } from '../utils/holiday-date'
import { validateHolidayForm } from '../utils/holiday-validation'
import { holidaySettingsService } from '../services/holiday-settings.service'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    mode: 'create' | 'edit'
    holiday?: HolidayItem | null
    initialDate?: string | null
    isSaving?: boolean
  }>(),
  {
    holiday: null,
    initialDate: null,
    isSaving: false
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (
    e: 'submit',
    payload: {
      id?: number
      tanggal: string
      keterangan: string
      exceptionEmployeeIds: number[]
    }
  ): void
}>()

interface FormState {
  tanggal: string
  keterangan: string
  exceptionEmployeeIds: number[]
}

const form = reactive<FormState>({
  tanggal: '',
  keterangan: '',
  exceptionEmployeeIds: []
})

const errors = reactive<HolidayValidationError>({})

const dayNamePreview = computed(() => {
  return form.tanggal ? getDayNameIndonesian(form.tanggal) : ''
})

const modalTitle = computed(() => {
  return props.mode === 'create' ? 'Tambah Hari Libur Baru' : 'Ubah Pengaturan Hari Libur'
})

const modalDescription = computed(() => {
  return props.mode === 'create'
    ? 'Tentukan tanggal hari libur dan pilih karyawan yang tetap dijadwalkan masuk kerja.'
    : `Memperbarui tanggal, keterangan, atau daftar pengecualian untuk ID #${props.holiday?.id ?? ''}.`
})

// Synchronize form when modal opens
watch(
  () => props.modelValue,
  isOpen => {
    if (isOpen) {
      // Clear errors
      errors.tanggal = undefined
      errors.keterangan = undefined
      errors.exceptionEmployeeIds = undefined
      errors.general = undefined

      if (props.mode === 'edit' && props.holiday) {
        form.tanggal = props.holiday.tanggal
        form.keterangan = props.holiday.keterangan
        form.exceptionEmployeeIds = [...props.holiday.exceptionEmployeeIds]
      } else {
        form.tanggal = props.initialDate || new Date().toISOString().substring(0, 10)
        form.keterangan = ''
        form.exceptionEmployeeIds = []
      }
    }
  },
  { immediate: true }
)

function handleSubmit() {
  errors.tanggal = undefined
  errors.keterangan = undefined
  errors.exceptionEmployeeIds = undefined
  errors.general = undefined

  const existingHolidays = holidaySettingsService.getHolidaysSync()
  const excludeId = props.mode === 'edit' && props.holiday ? props.holiday.id : undefined

  const result = validateHolidayForm(
    {
      tanggal: form.tanggal,
      keterangan: form.keterangan,
      exceptionEmployeeIds: form.exceptionEmployeeIds
    },
    existingHolidays,
    excludeId
  )

  if (!result.isValid) {
    Object.assign(errors, result.errors)
    return
  }

  emit('submit', {
    id: props.holiday?.id,
    tanggal: form.tanggal,
    keterangan: form.keterangan.trim(),
    exceptionEmployeeIds: form.exceptionEmployeeIds
  })
}

function handleClose() {
  if (props.isSaving) return
  emit('update:modelValue', false)
}
</script>

<template>
  <AppModal
    :model-value="modelValue"
    size="xl"
    :title="modalTitle"
    :description="modalDescription"
    @update:model-value="handleClose"
  >
    <form class="space-y-5" @submit.prevent="handleSubmit">
      <!-- General Error Alert -->
      <div
        v-if="errors.general"
        class="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2"
      >
        <AlertCircle class="w-4 h-4 shrink-0 text-red-500" />
        <span>{{ errors.general }}</span>
      </div>

      <!-- Row 1: Tanggal & Keterangan -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Tanggal -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Tanggal Libur <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <input
              v-model="form.tanggal"
              type="date"
              :disabled="isSaving"
              class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] disabled:bg-slate-100"
              :class="{ 'border-red-500': errors.tanggal }"
            />
          </div>
          <div class="mt-1 flex items-center justify-between text-[11px]">
            <span v-if="dayNamePreview" class="text-slate-500 font-medium">
              Hari: <strong class="text-[#0F766E]">{{ dayNamePreview }}</strong>
            </span>
            <span v-if="errors.tanggal" class="text-red-600 font-medium ml-auto">
              {{ errors.tanggal }}
            </span>
          </div>
        </div>

        <!-- Keterangan -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Keterangan Hari Libur <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.keterangan"
            type="text"
            :disabled="isSaving"
            placeholder="Contoh: HARI KEMERDEKAAN RI / CUTI BERSAMA"
            class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] disabled:bg-slate-100 uppercase"
            :class="{ 'border-red-500': errors.keterangan }"
          />
          <div v-if="errors.keterangan" class="mt-1 text-[11px] text-red-600 font-medium">
            {{ errors.keterangan }}
          </div>
        </div>
      </div>

      <!-- Section: Pengecualian Karyawan -->
      <div class="pt-2 border-t border-slate-200">
        <div class="mb-2">
          <h4
            class="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5"
          >
            <Tag class="w-3.5 h-3.5 text-[#0F766E]" />
            <span>Pengecualian Karyawan (Tetap Masuk Kerja)</span>
          </h4>
          <p class="text-[11px] text-slate-500">
            Karyawan yang dipilih di bawah ini dikecualikan dari hari libur ini dan tetap tercatat
            wajib hadir.
          </p>
        </div>

        <HolidayEmployeePicker v-model="form.exceptionEmployeeIds" :disabled="isSaving" />
        <div v-if="errors.exceptionEmployeeIds" class="mt-1 text-[11px] text-red-600 font-medium">
          {{ errors.exceptionEmployeeIds }}
        </div>
      </div>
    </form>

    <template #footer>
      <div class="flex items-center justify-end space-x-2.5">
        <AppButton variant="secondary" size="sm" :disabled="isSaving" @click="handleClose">
          Batal
        </AppButton>

        <AppButton
          variant="primary"
          size="sm"
          :loading="isSaving"
          :disabled="isSaving"
          @click="handleSubmit"
        >
          <Save class="w-4 h-4 mr-1.5" />
          {{ mode === 'create' ? 'Simpan Hari Libur' : 'Perbarui Pengaturan' }}
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>
