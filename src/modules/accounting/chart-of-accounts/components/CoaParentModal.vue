<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { CoaGroup, CoaParent } from '../types/coa.types'

const props = defineProps<{
  isOpen: boolean
  isEdit: boolean
  parentData: CoaParent | null
  groups: CoaGroup[]
  isLoading?: boolean
  initialCoaId?: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', form: { coa_id: number; no_akun: number; nama: string; is_active?: number }): void
}>()

const form = reactive({
  coa_id: undefined as number | undefined,
  no_akun: undefined as number | undefined,
  nama: '',
  is_active: 1
})

const errors = reactive({
  coa_id: '',
  no_akun: '',
  nama: ''
})

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      errors.coa_id = ''
      errors.no_akun = ''
      errors.nama = ''

      if (props.isEdit && props.parentData) {
        form.coa_id = props.parentData.coa_id
        form.no_akun = props.parentData.no_akun
        form.nama = props.parentData.nama
        form.is_active = props.parentData.is_active ?? 1
      } else {
        form.coa_id = props.initialCoaId || (props.groups[0]?.id ?? undefined)
        form.no_akun = undefined
        form.nama = ''
        form.is_active = 1
      }
    }
  },
  { immediate: true }
)

function validate(): boolean {
  let valid = true
  errors.coa_id = ''
  errors.no_akun = ''
  errors.nama = ''

  if (!form.coa_id) {
    errors.coa_id = 'Kelompok akun wajib dipilih'
    valid = false
  }

  if (!form.no_akun || form.no_akun <= 0) {
    errors.no_akun = 'Nomor induk akun wajib berupa angka positif'
    valid = false
  }

  if (!form.nama.trim()) {
    errors.nama = 'Nama induk akun wajib diisi'
    valid = false
  }

  return valid
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    coa_id: Number(form.coa_id),
    no_akun: Number(form.no_akun),
    nama: form.nama.trim(),
    is_active: form.is_active
  })
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-2xs flex items-center justify-center p-4"
    @click.self="emit('close')"
  >
    <div class="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200">
      <div class="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <h3 class="text-base font-bold text-gray-900">
          {{ isEdit ? 'Edit Induk Akun' : 'Tambah Induk Akun' }}
        </h3>
        <button
          type="button"
          class="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
          @click="emit('close')"
        >
          &times;
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">
            Kelompok Akun <span class="text-red-500">*</span>
          </label>
          <select
            v-model="form.coa_id"
            class="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option :value="undefined" disabled>-- Pilih Kelompok Akun --</option>
            <option v-for="group in groups" :key="group.id" :value="group.id">
              {{ group.id }} &mdash; {{ group.name }}
            </option>
          </select>
          <p v-if="errors.coa_id" class="text-2xs text-red-600 mt-1">{{ errors.coa_id }}</p>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">
            Nomor Induk Akun <span class="text-red-500">*</span>
          </label>
          <input
            v-model.number="form.no_akun"
            type="number"
            placeholder="Contoh: 11 / 12 / 21"
            class="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <p v-if="errors.no_akun" class="text-2xs text-red-600 mt-1">{{ errors.no_akun }}</p>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">
            Nama Induk Akun <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.nama"
            type="text"
            placeholder="Contoh: Aset Lancar / Liabilitas Jangka Pendek"
            class="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <p v-if="errors.nama" class="text-2xs text-red-600 mt-1">{{ errors.nama }}</p>
        </div>

        <div class="pt-4 border-t border-gray-200 flex items-center justify-end space-x-2">
          <button
            type="button"
            class="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            @click="emit('close')"
          >
            Batal
          </button>
          <button
            type="submit"
            :disabled="isLoading"
            class="px-4 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            {{ isEdit ? 'Simpan Perubahan' : 'Simpan Induk Akun' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.text-2xs {
  font-size: 0.6875rem;
  line-height: 0.875rem;
}
</style>
