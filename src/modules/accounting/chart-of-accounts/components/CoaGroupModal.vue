<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CoaGroup } from '../types/coa.types'

const props = defineProps<{
  isOpen: boolean
  isEdit: boolean
  groupData: CoaGroup | null
  isLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', form: { name: string; is_active?: number }): void
}>()

const name = ref('')
const errorMsg = ref('')

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      errorMsg.value = ''
      name.value = props.isEdit && props.groupData ? props.groupData.name : ''
    }
  },
  { immediate: true }
)

function handleSubmit() {
  if (!name.value.trim()) {
    errorMsg.value = 'Nama kelompok akun wajib diisi'
    return
  }
  emit('submit', {
    name: name.value.trim(),
    is_active: props.groupData?.is_active ?? 1
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
          {{ isEdit ? 'Edit Kelompok Akun' : 'Tambah Kelompok Akun' }}
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
            Nama Kelompok Akun <span class="text-red-500">*</span>
          </label>
          <input
            v-model="name"
            type="text"
            placeholder="Contoh: Aset Lancar / Beban Lain-lain"
            class="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <p v-if="errorMsg" class="text-2xs text-red-600 mt-1">{{ errorMsg }}</p>
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
            {{ isEdit ? 'Simpan Perubahan' : 'Simpan Kelompok' }}
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
