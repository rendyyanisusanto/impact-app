<script setup lang="ts">
import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'
import type { CoaParent, ImportAccountRow, ImportValidationResult } from '../types/coa.types'
import { generateCoaImportTemplate } from '../utils/coa-export'
import { coaService } from '../services/coa.service'
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
  parents: CoaParent[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'imported'): void
}>()

const currentStep = ref<1 | 2>(1)
const selectedFile = ref<File | null>(null)
const isValidating = ref(false)
const isCommitting = ref(false)
const validationResult = ref<ImportValidationResult | null>(null)
const generalError = ref('')

function resetModal() {
  currentStep.value = 1
  selectedFile.value = null
  isValidating.value = false
  isCommitting.value = false
  validationResult.value = null
  generalError.value = ''
}

function handleDownloadTemplate() {
  generateCoaImportTemplate(props.parents)
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return
  const file = target.files[0]
  selectedFile.value = file
  await parseAndValidateFile(file)
}

async function parseAndValidateFile(file: File) {
  generalError.value = ''
  isValidating.value = true

  try {
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data, { type: 'array' })

    const firstSheetName = workbook.SheetNames[0]
    if (!firstSheetName) {
      throw new Error('Berkas Excel kosong atau tidak memiliki worksheet')
    }

    const worksheet = workbook.Sheets[firstSheetName]
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet)

    if (rawRows.length === 0) {
      throw new Error('Tidak ada baris data yang ditemukan pada worksheet pertama')
    }

    // Map rows to standard ImportAccountRow
    const rowsToValidate: ImportAccountRow[] = rawRows.map((r, idx) => {
      // Find key matching Kode Rekening
      const codeKey = Object.keys(r).find(k => k.toLowerCase().includes('kode')) || 'no_ref'
      const nameKey = Object.keys(r).find(k => k.toLowerCase().includes('nama rekening') || k.toLowerCase() === 'nama') || 'nama'
      const parentNoKey = Object.keys(r).find(k => k.toLowerCase().includes('nomor induk') || k.toLowerCase().includes('induk_no')) || 'induk_no_akun'
      const parentNameKey = Object.keys(r).find(k => k.toLowerCase().includes('nama induk')) || 'induk_nama'
      const balanceKey = Object.keys(r).find(k => k.toLowerCase().includes('saldo normal') || k.toLowerCase().includes('saldo')) || 'saldo_normal'

      return {
        row_number: idx + 2, // Excel 1-based header is row 1
        no_ref: String(r[codeKey] || '').trim(),
        nama: String(r[nameKey] || '').trim(),
        induk_no_akun: r[parentNoKey] ? Number(r[parentNoKey]) : undefined,
        induk_nama: r[parentNameKey] ? String(r[parentNameKey]).trim() : undefined,
        saldo_normal: String(r[balanceKey] || 'D').trim(),
        errors: []
      }
    })

    const result = await coaService.validateImport(rowsToValidate)
    validationResult.value = result
    currentStep.value = 2
  } catch (err: any) {
    generalError.value = err.message || 'Gagal membaca atau memproses berkas Excel'
  } finally {
    isValidating.value = false
  }
}

const validItemsToCommit = computed(() => {
  if (!validationResult.value) return []
  return validationResult.value.items
    .filter(i => i.status === 'valid' && i.resolved_induk_id)
    .map(i => ({
      no_ref: i.no_ref,
      nama: i.nama,
      indukakun_id: i.resolved_induk_id!,
      saldo_normal: i.resolved_saldo_normal || 'D',
      is_active: 1
    }))
})

async function handleCommit() {
  if (validItemsToCommit.value.length === 0) return
  isCommitting.value = true
  generalError.value = ''

  try {
    const res = await coaService.commitImport(validItemsToCommit.value)
    if (res.inserted_count > 0) {
      emit('imported')
      emit('close')
      resetModal()
    } else {
      generalError.value = 'Tidak ada akun yang berhasil disimpan: ' + res.errors.join(', ')
    }
  } catch (err: any) {
    generalError.value = err.message || 'Gagal menyimpan hasil impor'
  } finally {
    isCommitting.value = false
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-2xs flex items-center justify-center p-4"
    @click.self="emit('close')"
  >
    <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-200">
      <!-- Header -->
      <div class="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 class="text-base font-bold text-gray-900 flex items-center">
            <FileSpreadsheet class="w-5 h-5 text-teal-600 mr-2" />
            Impor Master Chart of Account (Excel)
          </h3>
          <p class="text-xs text-gray-500 mt-0.5">
            Tambah rekening akuntansi baru secara massal menggunakan file Excel (.xlsx / .xls)
          </p>
        </div>
        <button
          type="button"
          class="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
          @click="emit('close')"
        >
          &times;
        </button>
      </div>

      <div class="p-6">
        <!-- Error Banner -->
        <div v-if="generalError" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start space-x-2">
          <AlertCircle class="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
          <span>{{ generalError }}</span>
        </div>

        <!-- STEP 1: Upload File & Template -->
        <div v-if="currentStep === 1" class="space-y-4">
          <!-- Download Template Card -->
          <div class="p-4 bg-teal-50/60 border border-teal-200 rounded-lg flex items-center justify-between">
            <div>
              <p class="text-xs font-bold text-teal-900">Belum punya format Excel yang sesuai?</p>
              <p class="text-xs text-teal-700 mt-0.5">Unduh template resmi yang berisi panduan dan daftar induk akun valid.</p>
            </div>
            <button
              type="button"
              class="px-3 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition-colors shadow-sm flex items-center shrink-0"
              @click="handleDownloadTemplate"
            >
              <Download class="w-3.5 h-3.5 mr-1.5" />
              Unduh Template
            </button>
          </div>

          <!-- Drag and Drop Dropzone -->
          <div class="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-teal-500 transition-colors bg-gray-50/50">
            <input
              id="coa-excel-upload"
              type="file"
              accept=".xlsx, .xls"
              class="hidden"
              @change="handleFileChange"
            />
            <label for="coa-excel-upload" class="cursor-pointer block">
              <Upload class="w-10 h-10 text-teal-600 mx-auto mb-3" />
              <p class="text-sm font-semibold text-gray-800">
                Pilih atau seret berkas Excel ke sini
              </p>
              <p class="text-xs text-gray-500 mt-1">
                Format didukung: Microsoft Excel (.xlsx, .xls)
              </p>
            </label>
          </div>

          <div v-if="isValidating" class="text-center py-4 text-xs text-teal-700 flex items-center justify-center space-x-2">
            <RefreshCw class="w-4 h-4 animate-spin text-teal-600" />
            <span>Memvalidasi struktur dan relasi data akun...</span>
          </div>
        </div>

        <!-- STEP 2: Preview & Validation Table -->
        <div v-else-if="currentStep === 2 && validationResult" class="space-y-4">
          <!-- Summary Cards -->
          <div class="grid grid-cols-3 gap-3">
            <div class="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
              <span class="text-2xs uppercase text-gray-500 font-semibold block">Total Baris</span>
              <span class="text-lg font-bold text-gray-800">{{ validationResult.total_rows }}</span>
            </div>
            <div class="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-center">
              <span class="text-2xs uppercase text-emerald-700 font-semibold block">Baris Valid</span>
              <span class="text-lg font-bold text-emerald-700">{{ validationResult.valid_rows }}</span>
            </div>
            <div class="p-3 bg-red-50 rounded-lg border border-red-200 text-center">
              <span class="text-2xs uppercase text-red-700 font-semibold block">Baris Invalid / Error</span>
              <span class="text-lg font-bold text-red-700">{{ validationResult.invalid_rows }}</span>
            </div>
          </div>

          <!-- Preview Table -->
          <div class="border border-gray-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead class="bg-gray-50 sticky top-0 border-b border-gray-200 text-gray-600">
                <tr>
                  <th class="py-2 px-3 w-12 text-center">Baris</th>
                  <th class="py-2 px-3 w-20">Kode</th>
                  <th class="py-2 px-3">Nama Rekening</th>
                  <th class="py-2 px-3 w-32">Induk Akun</th>
                  <th class="py-2 px-3 w-16 text-center">Saldo</th>
                  <th class="py-2 px-3 w-24 text-center">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr
                  v-for="item in validationResult.items"
                  :key="item.row_number"
                  :class="item.status === 'valid' ? 'bg-white' : 'bg-red-50/40'"
                >
                  <td class="py-2 px-3 text-center text-gray-500">{{ item.row_number }}</td>
                  <td class="py-2 px-3 font-mono font-bold">{{ item.no_ref || '-' }}</td>
                  <td class="py-2 px-3">
                    <span class="font-medium text-gray-900 block">{{ item.nama }}</span>
                    <span v-if="item.errors.length > 0" class="text-2xs text-red-600 block mt-0.5">
                      &bull; {{ item.errors.join(', ') }}
                    </span>
                  </td>
                  <td class="py-2 px-3 text-gray-600">
                    <span v-if="item.induk_nama !== '-'">{{ item.induk_nama }}</span>
                    <span v-else class="text-red-500">Tidak Ditemukan</span>
                  </td>
                  <td class="py-2 px-3 text-center font-semibold">
                    {{ item.saldo_normal }}
                  </td>
                  <td class="py-2 px-3 text-center">
                    <span
                      v-if="item.status === 'valid'"
                      class="inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-semibold bg-emerald-100 text-emerald-800"
                    >
                      <CheckCircle2 class="w-3 h-3 mr-1" />
                      Valid
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-semibold bg-red-100 text-red-800"
                    >
                      <XCircle class="w-3 h-3 mr-1" />
                      Error
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p v-if="validationResult.invalid_rows > 0" class="text-2xs text-amber-700">
            * Hanya baris yang berstatus valid yang akan disimpan ke database. Baris error akan otomatis dilewati.
          </p>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <button
          v-if="currentStep === 2"
          type="button"
          class="text-xs text-gray-600 hover:text-gray-900 font-medium"
          @click="currentStep = 1"
        >
          &larr; Pilih Berkas Lain
        </button>
        <div v-else></div>

        <div class="flex items-center space-x-2">
          <button
            type="button"
            class="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            @click="emit('close')"
          >
            Batal
          </button>

          <button
            v-if="currentStep === 2"
            type="button"
            :disabled="validItemsToCommit.length === 0 || isCommitting"
            class="px-4 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center shadow-sm"
            @click="handleCommit"
          >
            <RefreshCw v-if="isCommitting" class="w-3.5 h-3.5 mr-1.5 animate-spin" />
            Simpan {{ validItemsToCommit.length }} Akun Valid
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-2xs {
  font-size: 0.6875rem;
  line-height: 0.875rem;
}
</style>
