<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Receipt, AlertCircle, Info } from 'lucide-vue-next'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import AppTextarea from '@/shared/components/ui/AppTextarea.vue'
import { useToast } from '@/shared/composables/useToast'
import type { SalesOrderVariantKey } from '../config/sales-order-variants'
import type { InvoiceType, SalesOrderInvoiceSummary } from '../types/sales-invoice.types'
import { calculateInvoiceTaxes } from '../utils/sales-invoice-calculations'
import { salesInvoiceService } from '../services/sales-invoice.service'
import { formatCurrency } from '@/shared/utils/formatters'

const props = defineProps<{
  isOpen: boolean
  summary: SalesOrderInvoiceSummary | null
  variant: SalesOrderVariantKey
}>()

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void
  (e: 'success'): void
}>()

const toast = useToast()

const invoiceCode = ref('')
const jenis = ref<InvoiceType>('DP')
const tanggal = ref(new Date().toISOString().slice(0, 10))
const noFakturPajak = ref('')
const totalInvoice = ref<number | ''>('')
const keterangan = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')

const jenisOptions = [
  { value: 'DP', label: 'DP (Uang Muka)' },
  { value: 'Termin', label: 'Termin' },
  { value: 'Pelunasan', label: 'Pelunasan' }
]

const hasTax = computed(() => props.summary?.is_ppn === 1)
const taxRate = computed(() => (hasTax.value ? props.summary?.ppn_rate || 11 : 0))

// Reactive tax calculations
const calculatedTax = computed(() => {
  const nominal = typeof totalInvoice.value === 'number' ? totalInvoice.value : 0
  return calculateInvoiceTaxes(nominal, hasTax.value, taxRate.value)
})

async function initializeForm(): Promise<void> {
  if (!props.summary) return
  errorMessage.value = ''
  keterangan.value = ''
  tanggal.value = new Date().toISOString().slice(0, 10)
  jenis.value = props.summary.sudah_invoice === 0 ? 'DP' : 'Termin'
  noFakturPajak.value = ''

  // Suggest remaining amount
  totalInvoice.value = props.summary.sisa_invoice > 0 ? props.summary.sisa_invoice : ''

  try {
    invoiceCode.value = await salesInvoiceService.generateNextInvoiceCode(props.summary.order_id)
  } catch (error) {
    console.error('Failed to generate invoice code:', error)
    invoiceCode.value = `INV-${props.summary.order_kode}-1`
  }
}

watch(
  () => [props.isOpen, props.summary?.order_id],
  ([isOpen]) => {
    if (isOpen) {
      initializeForm()
    }
  }
)

async function handleSubmit(): Promise<void> {
  if (!props.summary) return

  const nominal = Number(totalInvoice.value) || 0

  if (nominal <= 0) {
    errorMessage.value = 'Total invoice harus lebih besar dari Rp 0.'
    return
  }

  if (nominal > props.summary.sisa_invoice) {
    errorMessage.value = `Total invoice (${formatCurrency(nominal)}) melebihi sisa yang belum di-invoice (${formatCurrency(props.summary.sisa_invoice)}).`
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const created = await salesInvoiceService.createInvoice({
      so_id: props.summary.order_id,
      kode: invoiceCode.value,
      jenis: jenis.value,
      tanggal: tanggal.value,
      total: nominal,
      subtotal: calculatedTax.value.dpp,
      total_ppn: calculatedTax.value.ppn,
      no_faktur_pajak: hasTax.value ? noFakturPajak.value || null : null,
      keterangan: keterangan.value || null,
      variant: props.variant
    })

    toast.success(`Invoice ${created.kode} berhasil diterbitkan.`)
    emit('success')
    emit('update:isOpen', false)
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Terjadi kesalahan saat membuat invoice.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AppModal
    :model-value="isOpen"
    title="Buat Invoice"
    size="lg"
    @update:model-value="emit('update:isOpen', $event)"
  >
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <!-- Error Alert -->
      <div
        v-if="errorMessage"
        data-testid="invoice-error-alert"
        class="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-700"
      >
        <AlertCircle class="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Sisa Info Banner (Screenshot 2 Match) -->
      <div
        v-if="summary"
        data-testid="info-sisa-invoice"
        class="p-3 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-between text-xs text-teal-800"
      >
        <div class="flex items-center gap-2">
          <Info class="w-4 h-4 text-teal-600 shrink-0" />
          <span> <strong>Info:</strong> Sisa yang belum di-invoice: </span>
        </div>
        <span class="font-bold text-teal-900 font-mono text-sm">
          {{ formatCurrency(summary.sisa_invoice) }}
        </span>
      </div>

      <!-- Row 1: Kode Invoice (Auto) & Jenis Invoice -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Kode Invoice <span class="text-slate-400 font-normal">(Otomatis)</span>
          </label>
          <input
            type="text"
            data-testid="input-invoice-code"
            :value="invoiceCode"
            disabled
            class="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-mono font-bold cursor-not-allowed select-none"
          />
        </div>

        <div>
          <label for="select-invoice-jenis" class="block text-xs font-semibold text-slate-700 mb-1">
            Jenis Invoice <span class="text-rose-500">*</span>
          </label>
          <AppSelect
            id="select-invoice-jenis"
            v-model="jenis"
            data-testid="select-invoice-jenis"
            :options="jenisOptions"
            class="w-full"
            :disabled="isSubmitting"
            required
          />
        </div>
      </div>

      <!-- Row 2: Tanggal & No. Faktur Pajak -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            for="input-invoice-tanggal"
            class="block text-xs font-semibold text-slate-700 mb-1"
          >
            Tanggal <span class="text-rose-500">*</span>
          </label>
          <AppInput
            id="input-invoice-tanggal"
            v-model="tanggal"
            data-testid="input-invoice-tanggal"
            type="date"
            class="w-full"
            :disabled="isSubmitting"
            required
          />
        </div>

        <div>
          <label for="input-faktur-pajak" class="block text-xs font-semibold text-slate-700 mb-1">
            No. Faktur Pajak
            <span v-if="!hasTax" class="text-slate-400 font-normal">(Non-PPN)</span>
            <span v-else class="text-slate-400 font-normal">(Opsional)</span>
          </label>
          <AppInput
            id="input-faktur-pajak"
            v-model="noFakturPajak"
            data-testid="input-invoice-faktur-pajak"
            type="text"
            placeholder="010.002-XX.XXXXXXXX"
            class="w-full"
            :disabled="isSubmitting || !hasTax"
          />
        </div>
      </div>

      <!-- Row 3: Total Invoice, DPP & PPN -->
      <div
        class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl"
      >
        <!-- Total Invoice Input -->
        <div>
          <label for="input-total-invoice" class="block text-xs font-bold text-slate-800 mb-1">
            Total Invoice (Nominal) <span class="text-rose-500">*</span>
          </label>
          <AppInput
            id="input-total-invoice"
            v-model.number="totalInvoice"
            data-testid="input-total-invoice"
            type="number"
            min="1"
            :max="summary?.sisa_invoice || undefined"
            step="1"
            placeholder="0"
            class="w-full font-mono font-bold text-slate-900"
            :disabled="isSubmitting"
            required
          />
          <p class="text-[11px] text-slate-500 mt-1">
            Format: {{ formatCurrency(Number(totalInvoice) || 0) }}
          </p>
        </div>

        <!-- DPP (Subtotal) Calculated -->
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1"> DPP (Subtotal) </label>
          <div
            class="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 font-mono font-medium"
          >
            {{ formatCurrency(calculatedTax.dpp) }}
          </div>
          <p class="text-[10px] text-slate-400 mt-1">Dasar Pengenaan Pajak</p>
        </div>

        <!-- PPN Calculated -->
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1">
            PPN {{ hasTax ? `(${taxRate}%)` : '(Non-PPN)' }}
          </label>
          <div
            class="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono font-medium"
            :class="hasTax ? 'text-teal-700' : 'text-slate-500'"
          >
            {{ formatCurrency(calculatedTax.ppn) }}
          </div>
          <p class="text-[10px] text-slate-400 mt-1">Pajak Pertambahan Nilai</p>
        </div>
      </div>

      <!-- Row 4: Keterangan -->
      <div>
        <label
          for="input-invoice-keterangan"
          class="block text-xs font-semibold text-slate-700 mb-1"
        >
          Keterangan (Opsional)
        </label>
        <AppTextarea
          id="input-invoice-keterangan"
          v-model="keterangan"
          data-testid="input-invoice-keterangan"
          :rows="2"
          placeholder="Catatan tagihan invoice (misal: Uang Muka 50%, Pelunasan sebelum kirim)..."
          :disabled="isSubmitting"
        />
      </div>

      <!-- Footer Actions -->
      <div class="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
        <AppButton
          type="button"
          variant="outline"
          size="sm"
          :disabled="isSubmitting"
          @click="emit('update:isOpen', false)"
        >
          Batal
        </AppButton>
        <AppButton
          type="submit"
          variant="primary"
          size="sm"
          data-testid="btn-submit-invoice"
          :loading="isSubmitting"
        >
          <template #iconLeft>
            <Receipt class="w-4 h-4" />
          </template>
          Simpan Invoice
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>
