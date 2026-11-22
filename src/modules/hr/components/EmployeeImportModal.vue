<script setup lang="ts">
import AppImportExcelModal from '@/shared/components/import-export/AppImportExcelModal.vue'
import { EMPLOYEE_IMPORT_TEMPLATE, employeeRowMapper } from '../utils/employee-import.config'
import { employeeService } from '../services/employee.service'
import type { CreateEmployeeDto } from '../types/employee.types'

defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'imported', count: number): void
}>()

async function handleImportProcess(items: CreateEmployeeDto[]) {
  let importedCount = 0
  for (const item of items) {
    await employeeService.create(item)
    importedCount++
  }
  return { importedCount }
}
</script>

<template>
  <AppImportExcelModal
    :model-value="modelValue"
    title="Import Master Data Karyawan"
    :template-definition="EMPLOYEE_IMPORT_TEMPLATE"
    :row-mapper="employeeRowMapper"
    :import-service="handleImportProcess"
    @update:model-value="val => emit('update:modelValue', val)"
    @imported="count => emit('imported', count)"
  />
</template>
