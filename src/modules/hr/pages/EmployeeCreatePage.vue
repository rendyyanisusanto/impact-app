<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import EmployeeForm from '../components/EmployeeForm.vue'
import { employeeService } from '../services/employee.service'
import type { CreateEmployeeDto } from '../types/employee.types'
import { UserPlus, ArrowLeft } from 'lucide-vue-next'

const router = useRouter()
const isSaving = ref(false)
const errorMessage = ref<string | null>(null)

async function handleSubmit(formData: CreateEmployeeDto) {
  isSaving.value = true
  errorMessage.value = null
  try {
    await employeeService.create(formData)
    router.push('/hr/employees')
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'Gagal menyimpan data karyawan'
  } finally {
    isSaving.value = false
  }
}

function handleCancel() {
  router.push('/hr/employees')
}
</script>

<template>
  <div>
    <AppPageHeader
      title="Tambah Karyawan"
      subtitle="Input data master karyawan baru, nomor biometrik fingerprint, serta penempatan jabatan & regu kerja."
    >
      <template #icon>
        <UserPlus class="w-6 h-6 text-primary" />
      </template>
      <template #actions>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-text bg-surface hover:bg-slate-50 transition-colors"
          @click="handleCancel"
        >
          <ArrowLeft class="w-4 h-4" /> Kembali ke Daftar
        </button>
      </template>
    </AppPageHeader>

    <div
      v-if="errorMessage"
      class="mb-4 bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700"
    >
      {{ errorMessage }}
    </div>

    <EmployeeForm mode="create" @submit="handleSubmit" @cancel="handleCancel" />
  </div>
</template>
