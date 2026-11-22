<script setup lang="ts">
import { ref, watch } from 'vue'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import { useToast } from '@/shared/composables/useToast'
import { salesOrderTransactionService } from '../services/sales-order-transaction.service'
import { Check, HelpCircle } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'saved'): void
}>()

const toast = useToast()
const isLoading = ref(false)
const isSaving = ref(false)

const templates = ref({
  kode_ppn: 'SO/{year}/{romawi_bulan}/{last_number_ppn}',
  kode_non_ppn: 'SO/{year}/{month}/{last_number}',
  kode_non_ppn_2: 'SO/N2/{year}/{month}/{last_number}'
})

async function fetchTemplates() {
  isLoading.value = true
  try {
    const data = await salesOrderTransactionService.getCodeTemplates()
    if (data) {
      templates.value = {
        kode_ppn: data.kode_ppn || 'SO/{year}/{romawi_bulan}/{last_number_ppn}',
        kode_non_ppn: data.kode_non_ppn || 'SO/{year}/{month}/{last_number}',
        kode_non_ppn_2: data.kode_non_ppn_2 || 'SO/N2/{year}/{month}/{last_number}'
      }
    }
  } catch (err: any) {
    toast.error(err?.message || 'Gagal memuat template kode Sales Order')
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.modelValue,
  val => {
    if (val) {
      fetchTemplates()
    }
  }
)

async function handleSave() {
  isSaving.value = true
  try {
    await salesOrderTransactionService.updateCodeTemplates(templates.value)
    toast.success('Template penomoran kode Sales Order berhasil disimpan')
    emit('saved')
    emit('update:modelValue', false)
  } catch (err: any) {
    toast.error(err?.message || 'Gagal menyimpan template kode')
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
    title="Pengaturan Template Kode Sales Order"
    size="md"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <div class="rounded-lg bg-teal-50 border border-teal-200 p-3.5 text-xs text-teal-800 space-y-1.5">
        <div class="flex items-center gap-1.5 font-semibold text-teal-900">
          <HelpCircle class="w-4 h-4 shrink-0 text-teal-700" />
          <span>Variabel yang Didukung:</span>
        </div>
        <p class="leading-relaxed">
          <code class="bg-teal-100/80 px-1 py-0.5 rounded font-mono font-semibold">{year}</code>: 2 digit tahun (cth: 26) &bull;
          <code class="bg-teal-100/80 px-1 py-0.5 rounded font-mono font-semibold">{month}</code>: 2 digit bulan (01-12) &bull;
          <code class="bg-teal-100/80 px-1 py-0.5 rounded font-mono font-semibold">{romawi_bulan}</code>: Romawi (I-XII) &bull;
          <code class="bg-teal-100/80 px-1 py-0.5 rounded font-mono font-semibold">{last_number}</code> / <code class="bg-teal-100/80 px-1 py-0.5 rounded font-mono font-semibold">{last_number_ppn}</code>: Urutan nomor 4 digit (0001).
        </p>
      </div>

      <div class="space-y-3.5">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Template Kode SO Impact (PPN)
          </label>
          <AppInput
            v-model="templates.kode_ppn"
            placeholder="SO/{year}/{romawi_bulan}/{last_number_ppn}"
            :disabled="isLoading"
          />
          <p class="text-[11px] text-slate-500 mt-0.5">Contoh hasil: SO/26/XI/0001</p>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Template Kode SO Pola (Non-PPN)
          </label>
          <AppInput
            v-model="templates.kode_non_ppn"
            placeholder="SO/{year}/{month}/{last_number}"
            :disabled="isLoading"
          />
          <p class="text-[11px] text-slate-500 mt-0.5">Contoh hasil: SO/26/11/1748</p>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Template Kode SO KS (Non-PPN 2)
          </label>
          <AppInput
            v-model="templates.kode_non_ppn_2"
            placeholder="SO/N2/{year}/{month}/{last_number}"
            :disabled="isLoading"
          />
          <p class="text-[11px] text-slate-500 mt-0.5">Contoh hasil: SO/N2/26/11/0003</p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <AppButton variant="outline" size="sm" :disabled="isSaving" @click="handleClose">
          Batal
        </AppButton>
        <AppButton variant="primary" size="sm" :loading="isSaving" :disabled="isLoading" @click="handleSave">
          <template #iconLeft>
            <Check class="w-4 h-4" />
          </template>
          Simpan Template
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>