<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppFormLabel from '@/shared/components/ui/AppFormLabel.vue'
import type { Bank, CreateBankDto, UpdateBankDto } from '../types/bank.types'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    open?: boolean
    isEdit?: boolean
    initialData?: Bank | null
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
  (e: 'submit', form: CreateBankDto | UpdateBankDto): void
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
  bank: string
  rekening: string
}

const form = reactive<FormState>({
  bank: '',
  rekening: ''
})

const errors = reactive<Record<string, string>>({})

watch(
  () => isOpen.value,
  val => {
    if (val) {
      Object.keys(errors).forEach(k => delete errors[k])
      if (props.initialData) {
        form.bank = props.initialData.bank || ''
        form.rekening = props.initialData.rekening || ''
      } else {
        form.bank = ''
        form.rekening = ''
      }
    }
  },
  { immediate: true }
)

function validate(): boolean {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.bank.trim()) {
    errors.bank = 'Nama bank wajib diisi'
  }
  if (!form.rekening.trim()) {
    errors.rekening = 'Nomor rekening wajib diisi'
  }
  return Object.keys(errors).length === 0
}

function handleSubmit() {
  if (!validate()) return

  emit('submit', {
    ...(isEditMode.value && props.initialData?.id ? { id: props.initialData.id } : {}),
    bank: form.bank.trim(),
    rekening: form.rekening.trim()
  })
}
</script>

<template>
  <AppModal
    :model-value="isOpen"
    :title="isEditMode ? 'Edit Rekening Bank' : 'Tambah Rekening Bank Baru'"
    size="md"
    @update:model-value="isOpen = $event"
    @close="isOpen = false"
  >
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <!-- Nama Bank -->
      <div>
        <AppFormLabel for="bank-name" required>Nama Bank / Akun</AppFormLabel>
        <AppInput
          id="bank-name"
          v-model="form.bank"
          placeholder="cth: BCA PT Impact / Mandiri Operasional"
          :error="errors.bank"
        />
        <p v-if="errors.bank" class="text-xs text-red-600 mt-1">{{ errors.bank }}</p>
      </div>

      <!-- Nomor Rekening -->
      <div>
        <AppFormLabel for="bank-rekening" required>Nomor Rekening</AppFormLabel>
        <AppInput
          id="bank-rekening"
          v-model="form.rekening"
          type="text"
          placeholder="Masukkan nomor rekening (cth: 0123984711)"
          :error="errors.rekening"
        />
        <p v-if="errors.rekening" class="text-xs text-red-600 mt-1">{{ errors.rekening }}</p>
        <p class="text-xs text-slate-400 mt-1">
          Disimpan sebagai teks untuk mempertahankan angka nol di depan.
        </p>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <AppButton variant="outline" :disabled="loading" @click="isOpen = false"> Batal </AppButton>
        <AppButton variant="primary" :loading="loading" @click="handleSubmit">
          {{ isEditMode ? 'Simpan Perubahan' : 'Tambah Bank' }}
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>
