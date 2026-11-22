<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import AppFormLabel from '@/shared/components/ui/AppFormLabel.vue'
import type { Ppn, CreateTaxDto, UpdateTaxDto } from '../types/tax.types'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    open?: boolean
    isEdit?: boolean
    initialData?: Ppn | null
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
  (e: 'submit', form: CreateTaxDto | UpdateTaxDto): void
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
  nama: number
  is_active: number
  status: number
}

const form = reactive<FormState>({
  kode: '',
  nama: 11,
  is_active: 0,
  status: 1
})

const errors = reactive<Record<string, string>>({})

const statusOptions = [
  { label: 'Aktif', value: '1' },
  { label: 'Nonaktif', value: '0' }
]

const activeTaxOptions = [
  { label: 'Tidak Aktif (Arsip)', value: '0' },
  { label: 'Aktif Digunakan Transaksi', value: '1' }
]

watch(
  () => isOpen.value,
  val => {
    if (val) {
      Object.keys(errors).forEach(k => delete errors[k])
      if (props.initialData) {
        form.kode = props.initialData.kode || ''
        form.nama = props.initialData.nama ?? 11
        form.is_active = props.initialData.is_active ?? 0
        form.status = props.initialData.status ?? 1
      } else {
        form.kode = ''
        form.nama = 11
        form.is_active = 0
        form.status = 1
      }
    }
  },
  { immediate: true }
)

function validate(): boolean {
  Object.keys(errors).forEach(k => delete errors[k])
  if (isNaN(form.nama) || form.nama < 0 || form.nama > 100) {
    errors.nama = 'Tarif PPN harus berupa bilangan bulat antara 0 hingga 100%'
  }
  return Object.keys(errors).length === 0
}

function handleSubmit() {
  if (!validate()) return

  emit('submit', {
    ...(isEditMode.value && props.initialData?.id ? { id: props.initialData.id } : {}),
    kode: form.kode.trim() || undefined,
    nama: Math.round(Number(form.nama)),
    is_active: Number(form.is_active),
    status: Number(form.status)
  })
}
</script>

<template>
  <AppModal
    :model-value="isOpen"
    :title="isEditMode ? 'Edit Tarif PPN' : 'Tambah Tarif PPN Baru'"
    size="md"
    @update:model-value="isOpen = $event"
    @close="isOpen = false"
  >
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div>
        <AppFormLabel for="tax-kode">Kode PPN</AppFormLabel>
        <AppInput
          id="tax-kode"
          v-model="form.kode"
          placeholder="Auto-generate jika kosong (cth: PPN-11)"
          :error="errors.kode"
        />
      </div>

      <div>
        <AppFormLabel for="tax-nama" required>Tarif PPN (%)</AppFormLabel>
        <div class="relative">
          <AppInput
            id="tax-nama"
            v-model.number="form.nama"
            type="number"
            min="0"
            max="100"
            step="1"
            placeholder="11"
            :error="errors.nama"
          />
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
        </div>
        <p v-if="errors.nama" class="text-xs text-red-600 mt-1">{{ errors.nama }}</p>
        <p class="text-xs text-slate-400 mt-1">
          Sesuai skema database, disimpan sebagai integer persentase.
        </p>
      </div>

      <div>
        <AppFormLabel for="tax-active">Status Digunakan Transaksi</AppFormLabel>
        <AppSelect id="tax-active" v-model="form.is_active" :options="activeTaxOptions" />
        <p class="text-xs text-slate-400 mt-1">
          Hanya 1 tarif PPN yang aktif digunakan oleh modul penjualan & pembelian pada satu waktu.
        </p>
      </div>

      <div>
        <AppFormLabel for="tax-status">Status Record</AppFormLabel>
        <AppSelect id="tax-status" v-model="form.status" :options="statusOptions" />
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <AppButton variant="outline" :disabled="loading" @click="isOpen = false"> Batal </AppButton>
        <AppButton variant="primary" :loading="loading" @click="handleSubmit">
          {{ isEditMode ? 'Simpan Perubahan' : 'Tambah PPN' }}
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>
