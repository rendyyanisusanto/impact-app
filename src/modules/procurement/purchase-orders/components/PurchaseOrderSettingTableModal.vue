<script setup lang="ts">
import { ref, watch } from 'vue'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppSpinner from '@/shared/components/ui/AppSpinner.vue'
import { useToast } from '@/shared/composables/useToast'
import { purchaseOrderService } from '../services/purchase-order.service'
import type { PurchaseOrderPlaceholderInfo } from '../types/purchase-order.types'
import { Check, HelpCircle, RotateCcw, Sparkles } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'saved', newTemplate: string): void
}>()

const toast = useToast()
const isLoading = ref(false)
const isSaving = ref(false)

const savedTemplate = ref('PO/{last_number}')
const templateInput = ref('PO/{last_number}')
const previewCode = ref('PO/0001')

const placeholders = ref<PurchaseOrderPlaceholderInfo[]>([
  { token: '{last_number}', description: 'Nomor urut 4 digit', example: '0001' },
  { token: '{year}', description: '2-digit tahun transaksi', example: '26' },
  { token: '{YEAR}', description: '4-digit tahun transaksi', example: '2026' },
  { token: '{month}', description: '2-digit bulan transaksi (01–12)', example: '11' },
  { token: '{date_of_month}', description: '2-digit tanggal bulan (01–31)', example: '18' },
  { token: '{date}', description: 'Tanggal lengkap (DD-MM-YY)', example: '18-11-26' },
  { token: '{rand}', description: 'Angka acak 4 digit', example: '4821' }
])

async function updatePreview() {
  try {
    previewCode.value = await purchaseOrderService.previewCode(templateInput.value)
  } catch {
    // Fallback preview
    previewCode.value = templateInput.value
      .replace(/\{last_number\}/g, '0001')
      .replace(/\{year\}/g, '26')
      .replace(/\{YEAR\}/g, '2026')
      .replace(/\{month\}/g, '11')
      .replace(/\{date_of_month\}/g, '18')
      .replace(/\{date\}/g, '18-11-26')
      .replace(/\{rand\}/g, '1234')
  }
}

watch(templateInput, () => {
  updatePreview()
})

async function fetchSettings() {
  isLoading.value = true
  try {
    const data = await purchaseOrderService.getSettingTable()
    if (data) {
      savedTemplate.value = data.template || 'PO/{last_number}'
      templateInput.value = data.template || 'PO/{last_number}'
      if (data.supported_placeholders && data.supported_placeholders.length > 0) {
        placeholders.value = data.supported_placeholders
      }
      previewCode.value = data.preview || 'PO/0001'
    }
  } catch (err: any) {
    toast.error(err?.message || 'Gagal memuat pengaturan format kode Purchase Order.')
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.modelValue,
  isOpen => {
    if (isOpen) {
      fetchSettings()
    }
  }
)

function insertToken(token: string) {
  templateInput.value += token
}

function handleReset() {
  templateInput.value = savedTemplate.value
  toast.info('Template dikembalikan ke pengaturan tersimpan.')
}

async function handleSave() {
  const trimmed = templateInput.value.trim()
  if (!trimmed) {
    toast.error('Template format kode tidak boleh kosong.')
    return
  }

  isSaving.value = true
  try {
    const updated = await purchaseOrderService.updateSettingTable(trimmed)
    savedTemplate.value = updated.template
    toast.success('Pengaturan format kode Purchase Order berhasil disimpan.')
    emit('saved', updated.template)
    emit('update:modelValue', false)
  } catch (err: any) {
    toast.error(err?.message || 'Gagal menyimpan pengaturan format kode.')
  } finally {
    isSaving.value = false
  }
}

function handleClose() {
  emit('update:modelValue', false)
}
</script>

<template>
  <AppModal
    :model-value="modelValue"
    title="Pengaturan Format Kode Purchase Order"
    description="Atur pola penomoran otomatis dokumen Purchase Order yang tersimpan pada sistem."
    size="md"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="isLoading" class="py-10 flex flex-col items-center justify-center gap-2 text-slate-500">
      <AppSpinner size="md" />
      <span class="text-xs">Memuat pengaturan...</span>
    </div>

    <div v-else class="space-y-4">
      <!-- Supported Placeholders Guide -->
      <div class="rounded-lg bg-teal-50 border border-teal-200 p-3.5 text-xs text-teal-800 space-y-2">
        <div class="flex items-center gap-1.5 font-semibold text-teal-900">
          <HelpCircle class="w-4 h-4 shrink-0 text-teal-700" />
          <span>Placeholder / Variabel yang Didukung:</span>
        </div>
        <p class="leading-relaxed text-[11px] text-teal-800">
          Klik variabel di bawah untuk menyisipkannya ke template:
        </p>
        <div class="flex flex-wrap gap-1.5 pt-1">
          <button
            v-for="p in placeholders"
            :key="p.token"
            type="button"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-100 hover:bg-teal-200 text-teal-900 font-mono text-[11px] font-semibold border border-teal-300 transition-colors"
            :title="`${p.description} (Contoh: ${p.example})`"
            @click="insertToken(p.token)"
          >
            <span>{{ p.token }}</span>
            <span class="text-[10px] font-normal text-teal-700 opacity-80">({{ p.example }})</span>
          </button>
        </div>
      </div>

      <!-- Template Input -->
      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">
          Format Template Kode PO <span class="text-rose-500">*</span>
        </label>
        <AppInput
          v-model="templateInput"
          placeholder="Contoh: PO/{year}/{month}/{last_number}"
          :disabled="isSaving"
        />
        <p class="text-[11px] text-slate-500 mt-1">
          Gunakan variabel penomoran seperti <code class="font-mono text-teal-600 font-semibold">{last_number}</code> untuk urutan nomor otomatis.
        </p>
      </div>

      <!-- Real-time Preview Box -->
      <div class="rounded-lg bg-slate-50 border border-slate-200 p-3 flex items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <Sparkles class="w-4 h-4 text-amber-500 shrink-0" />
          <div>
            <span class="text-[11px] font-medium text-slate-500 block">Preview Hasil Kode Real-time:</span>
            <span class="font-mono text-sm font-bold text-slate-800 tracking-wider">
              {{ previewCode }}
            </span>
          </div>
        </div>
        <span class="text-[10px] text-slate-400 bg-white px-2 py-1 rounded border border-slate-200">
          Simulasi (tanpa consume nomor)
        </span>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between gap-2 w-full">
        <div>
          <AppButton
            type="button"
            variant="ghost"
            size="sm"
            :disabled="isLoading || isSaving || templateInput === savedTemplate"
            title="Kembalikan ke template tersimpan"
            @click="handleReset"
          >
            <RotateCcw class="w-3.5 h-3.5 mr-1 text-slate-500" />
            Reset
          </AppButton>
        </div>

        <div class="flex items-center gap-2">
          <AppButton
            type="button"
            variant="outline"
            size="sm"
            :disabled="isSaving"
            @click="handleClose"
          >
            Batal
          </AppButton>
          <AppButton
            type="button"
            variant="primary"
            size="sm"
            :loading="isSaving"
            :disabled="isLoading"
            @click="handleSave"
          >
            <template #iconLeft>
              <Check class="w-4 h-4" />
            </template>
            Simpan Pengaturan
          </AppButton>
        </div>
      </div>
    </template>
  </AppModal>
</template>
