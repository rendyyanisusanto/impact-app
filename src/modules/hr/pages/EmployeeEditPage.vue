<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppSkeleton from '@/shared/components/ui/AppSkeleton.vue'
import EmployeeForm from '../components/EmployeeForm.vue'
import { employeeService } from '../services/employee.service'
import type { Employee, CreateEmployeeDto } from '../types/employee.types'
import { UserCheck, ArrowLeft } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()

const employeeId = Number(route.params.id)
const employee = ref<Employee | null>(null)
const isLoading = ref(true)
const errorMessage = ref<string | null>(null)

onMounted(async () => {
  isLoading.value = true
  try {
    const data = await employeeService.getById(employeeId)
    if (!data) {
      errorMessage.value = `Data karyawan #${employeeId} tidak ditemukan`
    } else {
      employee.value = data
    }
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'Gagal memuat data karyawan'
  } finally {
    isLoading.value = false
  }
})

async function handleSubmit(formData: CreateEmployeeDto) {
  errorMessage.value = null
  try {
    await employeeService.update(employeeId, formData)
    router.push('/hr/employees')
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'Gagal memperbarui data karyawan'
  }
}

function handleCancel() {
  router.push('/hr/employees')
}
</script>

<template>
  <div>
    <AppPageHeader
      :title="`Ubah Karyawan ${employee?.nama ? '— ' + employee.nama : ''}`"
      subtitle="Perbarui data identitas, status kepegawaian, atau penugasan grup karyawan."
    >
      <template #icon>
        <UserCheck class="w-6 h-6 text-primary" />
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

    <div v-if="isLoading" class="bg-surface rounded-lg border border-border p-6 space-y-4">
      <AppSkeleton class="h-6 w-48 mb-4" />
      <div class="grid grid-cols-2 gap-6">
        <AppSkeleton class="h-32 w-full" />
        <AppSkeleton class="h-32 w-full" />
      </div>
    </div>

    <EmployeeForm
      v-else-if="employee"
      mode="edit"
      :initial-data="employee"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>
