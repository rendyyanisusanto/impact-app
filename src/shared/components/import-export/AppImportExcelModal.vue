<script setup lang="ts">
import { ref } from 'vue'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppBadge from '@/shared/components/ui/AppBadge.vue'
import AppImportProgress from './AppImportProgress.vue'
import type { ImportTemplateDefinition, ImportValidationResult } from '@/shared/types/crud.types'
import type { ExcelImportTemplate } from '@/shared/types/excel-import.types'
import { generateImportTemplate, parseAndValidateExcel } from '@/shared/utils/excel-import'
import { Download, UploadCloud, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-vue-next'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = any

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    templateDefinition: ImportTemplateDefinition | ExcelImportTemplate
    rowMapper: (
      rawRow: Record<string, unknown>,
      rowNumber: number
    ) => { data?: AnyRow; error?: string }
    importService: (items: AnyRow[]) => Promise<{ importedCount: number }>
  }>(),
  {
    modelValue: false
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'imported', count: number): void
}>()

// State
const selectedFile = ref<File | null>(null)
const isParsing = ref(false)
const isImporting = ref(false)
const importProgress = ref(0)
const processedRowsCount = ref(0)
const validationResult = ref<ImportValidationResult<AnyRow> | null>(null)
const importSuccessCount = ref<number | null>(null)
const generalError = ref<string | null>(null)

function handleDownloadTemplate() {
  generateImportTemplate(props.templateDefinition)
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return

  const file = target.files[0]
  selectedFile.value = file
  validationResult.value = null
  generalError.value = null

  isParsing.value = true
  try {
    const result = await parseAndValidateExcel<AnyRow>(
      file,
      props.templateDefinition,
      props.rowMapper
    )
    validationResult.value = result
  } catch (err) {
    generalError.value = err instanceof Error ? err.message : 'Gagal memproses file Excel'
  } finally {
    isParsing.value = false
    target.value = '' // Reset input so same file can be re-selected
  }
}

function handleReset() {
  selectedFile.value = null
  validationResult.value = null
  importSuccessCount.value = null
  generalError.value = null
  importProgress.value = 0
  processedRowsCount.value = 0
}

async function handleStartImport() {
  if (!validationResult.value || validationResult.value.validRows.length === 0) return
  if (validationResult.value.invalidCount > 0) return // All-or-nothing rule

  isImporting.value = true
  generalError.value = null
  importProgress.value = 10

  const items = validationResult.value.validRows
  const total = items.length

  try {
    // Process in simulated incremental batches for progress animation
    importProgress.value = 35
    processedRowsCount.value = Math.floor(total * 0.35)

    await new Promise(resolve => setTimeout(resolve, 150))
    importProgress.value = 75
    processedRowsCount.value = Math.floor(total * 0.75)

    const res = await props.importService(items)

    importProgress.value = 100
    processedRowsCount.value = total
    importSuccessCount.value = res.importedCount
  } catch (err) {
    generalError.value = err instanceof Error ? err.message : 'Gagal mengimpor data ke sistem'
  } finally {
    isImporting.value = false
  }
}

function handleClose() {
  const count = importSuccessCount.value
  handleReset()
  emit('update:modelValue', false)
  if (count && count > 0) {
    emit('imported', count)
  }
}
</script>

<template>
  <AppModal
    :model-value="modelValue"
    :title="`Import Data Excel — ${title}`"
    size="lg"
    @update:model-value="handleClose"
  >
    <div class="space-y-4 text-xs text-slate-700">
      <!-- 1. INSTRUCTION & TEMPLATE DOWNLOAD -->
      <div
        class="p-3 bg-teal-50/60 border border-teal-200/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div>
          <p class="font-semibold text-teal-900">Panduan Format Excel</p>
          <p class="text-[11px] text-teal-800 mt-0.5">
            Gunakan template resmi sistem agar susunan kolom, format data, dan referensi sesuai
            validasi database.
          </p>
        </div>

        <AppButton
          variant="outline"
          size="sm"
          class="shrink-0 bg-white"
          @click="handleDownloadTemplate"
        >
          <template #left-icon>
            <Download class="w-3.5 h-3.5 text-teal-700" />
          </template>
          <span>Download Template</span>
        </AppButton>
      </div>

      <!-- 2. FILE UPLOAD DROPZONE -->
      <div v-if="importSuccessCount === null" class="space-y-2">
        <label class="block font-semibold text-slate-800">
          Pilih File Spreadsheet (.xlsx / .xls)
        </label>

        <div
          class="border-2 border-dashed border-slate-300 rounded-lg p-5 text-center hover:border-teal-500 hover:bg-slate-50/50 transition-colors relative cursor-pointer"
        >
          <input
            type="file"
            accept=".xlsx, .xls"
            class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            :disabled="isParsing || isImporting"
            @change="handleFileChange"
          />

          <div class="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
            <UploadCloud class="w-8 h-8 text-teal-600 mb-1" />
            <p class="font-semibold text-slate-800">
              {{ selectedFile ? selectedFile.name : 'Klik atau seret file Excel ke sini' }}
            </p>
            <p class="text-[11px] text-slate-400">
              Format didukung: .xlsx atau .xls (Ukuran file maks. 5 MB)
            </p>
          </div>
        </div>
      </div>

      <!-- General Error Alert -->
      <div
        v-if="generalError"
        class="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs"
        role="alert"
      >
        <AlertCircle class="w-4 h-4 text-rose-600 shrink-0" />
        <span>{{ generalError }}</span>
      </div>

      <!-- 3. VALIDATION RESULT PREVIEW -->
      <div
        v-if="validationResult && importSuccessCount === null"
        class="space-y-3 pt-2 border-t border-slate-100"
      >
        <!-- Summary Stats -->
        <div class="grid grid-cols-3 gap-2">
          <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
            <p class="text-[11px] text-slate-500">Total Baris</p>
            <p class="text-base font-bold text-slate-800">{{ validationResult.totalRows }}</p>
          </div>
          <div class="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
            <p class="text-[11px] text-emerald-700">Baris Valid</p>
            <p class="text-base font-bold text-emerald-800">
              {{ validationResult.validRows.length }}
            </p>
          </div>
          <div class="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-center">
            <p class="text-[11px] text-rose-700">Baris Tidak Valid</p>
            <p class="text-base font-bold text-rose-800">{{ validationResult.invalidCount }}</p>
          </div>
        </div>

        <!-- Error Details (if any) -->
        <div v-if="validationResult.errors.length > 0" class="space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="font-semibold text-rose-700 flex items-center gap-1.5">
              <AlertCircle class="w-3.5 h-3.5 text-rose-600" />
              Daftar Kesalahan Validasi (Kebijakan All-or-Nothing):
            </span>
            <span class="text-[10px] text-slate-400">
              Perbaiki file sebelum import dapat dilanjutkan
            </span>
          </div>

          <div
            class="max-h-48 overflow-y-auto border border-rose-200 rounded-lg divide-y divide-rose-100 bg-rose-50/40 text-[11px]"
          >
            <div
              v-for="(err, idx) in validationResult.errors"
              :key="idx"
              class="p-2 flex items-start gap-2 text-rose-900"
            >
              <AppBadge variant="danger" size="xs" class="shrink-0">
                Baris {{ err.rowNumber }}
              </AppBadge>
              <div class="min-w-0 flex-1">
                <span v-if="err.column" class="font-semibold text-rose-800"
                  >[{{ err.column }}]
                </span>
                <span>{{ err.message }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Valid confirmation note -->
        <div
          v-else
          class="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800"
        >
          <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
          <span
            >Seluruh {{ validationResult.validRows.length }} data valid dan siap diimpor ke
            sistem.</span
          >
        </div>
      </div>

      <!-- 4. PROGRESS BAR (DURING IMPORT) -->
      <div v-if="isImporting" class="pt-2">
        <AppImportProgress
          :progress="importProgress"
          :total-count="validationResult?.validRows.length || 0"
          :processed-count="processedRowsCount"
          status-text="Memvalidasi dan mengimpor record ke repository..."
        />
      </div>

      <!-- 5. COMPLETION SUCCESS -->
      <div
        v-if="importSuccessCount !== null"
        class="p-6 text-center space-y-3 bg-emerald-50/70 border border-emerald-200 rounded-lg"
      >
        <CheckCircle2 class="w-12 h-12 text-emerald-600 mx-auto" />
        <h4 class="text-sm font-bold text-emerald-900">Import Data Berhasil!</h4>
        <p class="text-xs text-emerald-800 max-w-sm mx-auto">
          Sebanyak <strong>{{ importSuccessCount }}</strong> baris data berhasil ditambahkan ke
          dalam master data.
        </p>
      </div>
    </div>

    <!-- Modal Footer Actions -->
    <template #footer>
      <div class="flex items-center justify-between w-full">
        <AppButton
          v-if="validationResult && importSuccessCount === null"
          variant="ghost"
          size="sm"
          :disabled="isImporting"
          @click="handleReset"
        >
          <template #left-icon>
            <RotateCcw class="w-3.5 h-3.5" />
          </template>
          <span>Pilih File Lain</span>
        </AppButton>
        <span v-else />

        <div class="flex items-center gap-2">
          <AppButton
            v-if="importSuccessCount === null"
            variant="ghost"
            size="sm"
            :disabled="isImporting"
            @click="handleClose"
          >
            Batal
          </AppButton>

          <AppButton
            v-if="importSuccessCount === null"
            variant="primary"
            size="sm"
            :loading="isImporting || isParsing"
            :disabled="
              !validationResult ||
              validationResult.validRows.length === 0 ||
              validationResult.invalidCount > 0
            "
            @click="handleStartImport"
          >
            Mulai Import ({{ validationResult?.validRows.length || 0 }})
          </AppButton>

          <AppButton v-else variant="primary" size="sm" @click="handleClose">
            Tutup & Muat Ulang Tabel
          </AppButton>
        </div>
      </div>
    </template>
  </AppModal>
</template>
