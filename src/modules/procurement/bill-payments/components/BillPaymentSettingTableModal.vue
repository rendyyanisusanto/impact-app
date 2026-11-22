<script setup lang="ts">
import { ref, watch } from 'vue'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppSpinner from '@/shared/components/ui/AppSpinner.vue'
import { useToast } from '@/shared/composables/useToast'
import { billPaymentService } from '../services/bill-payment.service'
import type { BillPaymentPlaceholderInfo } from '../types/bill-payment.types'
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

const savedTemplate = ref('PT/{year}{month}-{rand}')
const templateInput = ref('PT/{year}{month}-{rand}')
const previewCode = ref('PT/2611-4821')

const placeholders = ref<BillPaymentPlaceholderInfo[]>([
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
    previewCode.value = await billPaymentService.previewCode(templateInput.value)
  } catch {
    // Fallback preview
    previewCode.value = templateInput.value
      .replace(/\{last_number\}/g, '0001')
      .replace(/\{year\}/g, '26')
      .replace(/\{YEAR\}/g, '2026')
      .replace(/\{month\}/g, '11')
      .replace(/\{date_of_month\}/g, '18')
      .replace(/\{date\}/g, '18-11-26')
      .replace(/\{rand\}/g, '4821')
  }
}

watch(templateInput, () => {
  updatePreview()
})

async function fetchSettings() {
  isLoading.value = true
  try {
    const data = await billPaymentService.getSettingTable()
    if (data) {
      savedTemplate.value = data.template || 'PT/{year}{month}-{rand}'
      templateInput.value = data.template || 'PT/{year}{month}-{rand}'
      if (data.supported_placeholders && data.supported_placeholders.length > 0) {
        placeholders.value = data.supported_placeholders
      }
      previewCode.value = data.preview || 'PT/2611-4821'
    }
  } catch (err: any) {
    toast.error(err?.message || 'Gagal memuat pengaturan format kode Pembayaran Tagihan.')
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
    await billPaymentService.updateSettingTable(trimmed)
    savedTemplate.value = trimmed
    toast.success('Pengaturan format kode Pembayaran Tagihan berhasil disimpan.')
    emit('saved', trimmed)
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
    title="Pengaturan Format Nomor Pembayaran Tagihan"
    size="lg"
    @update:model-value="handleClose"
  >
    <div class="space-y-5">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-10 space-y-3">
        <AppSpinner size="lg" />
        <p class="text-xs text-slate-500 font-medium">Memuat konfigurasi kode dari database...</p>
      </div>

      <div v-else class="space-y-5">
        <!-- Info Banner -->
        <div class="bg-teal-50 border border-teal-200 rounded-lg p-3.5 flex items-start gap-3">
          <HelpCircle class="w-5 h-5 text-teal-700 mt-0.5 flex-shrink-0" />
          <div class="text-xs text-teal-900 leading-relaxed">
            <span class="font-semibold text-teal-950">Aturan Penomoran PT:</span>
            Konfigurasi template format penomoran dokumen Pembayaran Tagihan disimpan pada
            <code class="px-1.5 py-0.5 bg-teal-100 rounded text-teal-900 font-mono font-semibold"
              >setting_table</code
            >. Anda dapat menyusun kombinasi token yang didukung di bawah ini.
          </div>
        </div>

        <!-- Input Template -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">
            Template Format Kode <span class="text-rose-500">*</span>
          </label>
          <div class="flex gap-2">
            <div class="flex-1">
              <AppInput
                v-model="templateInput"
                placeholder="Contoh: PT/{year}{month}-{rand}"
                class="font-mono text-xs font-medium"
              />
            </div>
            <AppButton
              variant="outline"
              size="md"
              title="Kembalikan ke template tersimpan"
              @click="handleReset"
            >
              <RotateCcw class="w-4 h-4 mr-1 text-slate-500" />
              <span>Reset</span>
            </AppButton>
          </div>
        </div>

        <!-- Live Preview Card -->
        <div class="bg-slate-900 text-white rounded-lg p-4 space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 text-xs text-slate-400 font-medium uppercase tracking-wider">
              <Sparkles class="w-4 h-4 text-amber-400" />
              <span>Pratinjau Kode (Real-time Preview)</span>
            </div>
            <span class="text-[10px] text-slate-400 font-mono">Berdasarkan tanggal hari ini</span>
          </div>
          <div class="text-lg font-bold font-mono tracking-wide text-emerald-400">
            {{ previewCode }}
          </div>
        </div>

        <!-- Supported Placeholders Chips -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-2">
            Token / Variabel yang Didukung (Klik untuk menyisipkan ke template):
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            <button
              v-for="ph in placeholders"
              :key="ph.token"
              type="button"
              class="flex items-center justify-between p-2.5 rounded border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 text-left transition-colors group"
              @click="insertToken(ph.token)"
            >
              <div>
                <span class="font-mono font-semibold text-xs text-teal-800 group-hover:text-teal-900">
                  {{ ph.token }}
                </span>
                <p class="text-[11px] text-slate-500 mt-0.5">
                  {{ ph.description }}
                </p>
              </div>
              <span class="text-[11px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                {{ ph.example }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Footer Actions -->
    <template #footer>
      <div class="flex items-center justify-end gap-2.5">
        <AppButton variant="outline" size="md" :disabled="isSaving" @click="handleClose">
          Batal
        </AppButton>
        <AppButton
          variant="primary"
          size="md"
          :loading="isSaving"
          :disabled="isLoading"
          @click="handleSave"
        >
          <Check class="w-4 h-4 mr-1.5" />
          <span>Simpan Template</span>
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>
