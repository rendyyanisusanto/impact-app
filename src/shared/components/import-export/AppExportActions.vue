<script setup lang="ts">
import AppButton from '@/shared/components/ui/AppButton.vue'
import { FileSpreadsheet, FileText } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    exportingPdf?: boolean
    exportingExcel?: boolean
    disabled?: boolean
  }>(),
  {
    exportingPdf: false,
    exportingExcel: false,
    disabled: false
  }
)

const emit = defineEmits<{
  (e: 'export-excel'): void
  (e: 'export-pdf'): void
}>()
</script>

<template>
  <div class="flex items-center gap-1.5">
    <!-- Export Excel Button -->
    <AppButton
      variant="outline"
      size="sm"
      :loading="exportingExcel"
      :disabled="disabled || exportingPdf"
      title="Ekspor seluruh data ke file spreadsheet Excel (.xlsx)"
      @click="emit('export-excel')"
    >
      <template #left-icon>
        <FileSpreadsheet class="w-3.5 h-3.5 text-emerald-600" />
      </template>
      <span>Excel</span>
    </AppButton>

    <!-- Export PDF Button -->
    <AppButton
      variant="outline"
      size="sm"
      :loading="exportingPdf"
      :disabled="disabled || exportingExcel"
      title="Cetak dan ekspor dokumen laporan PDF"
      @click="emit('export-pdf')"
    >
      <template #left-icon>
        <FileText class="w-3.5 h-3.5 text-rose-600" />
      </template>
      <span>PDF</span>
    </AppButton>
  </div>
</template>
