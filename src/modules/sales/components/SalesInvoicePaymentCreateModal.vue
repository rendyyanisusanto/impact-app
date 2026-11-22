<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { AlertCircle, CheckCircle2 } from 'lucide-vue-next'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import AppTextarea from '@/shared/components/ui/AppTextarea.vue'
import { salesPaymentService } from '../services/sales-payment.service'
import { bankService } from '@/modules/settings/banks/services/bank.service'
import type { SalesInvoice } from '../types/sales-invoice.types'
import type { PaymentMethod } from '../types/sales-payment.types'
import type { Bank } from '@/modules/settings/banks/types/bank.types'
import { formatCurrency } from '@/shared/utils/formatters'
import { useToast } from '@/shared/composables/useToast'

const props = defineProps<{
  modelValue: boolean
  invoice: SalesInvoice | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}>()

const toast = useToast()

const isOpen = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const isLoading = ref(false)
const isSubmitting = ref(false)
const paymentCode = ref('')
const tanggalBayar = ref(new Date().toISOString().split('T')[0])
const metodePembayaran = ref<PaymentMethod>('TRANSFER')
const bankId = ref<number | ''>('')
const nominal = ref<number>(0)
const keterangan = ref('')
const buktiBayar = ref('')
const bankOptions = ref<{ value: number; label: string }[]>([])

// Calculations
const sisaTagihan = computed(() => {
  if (!props.invoice) return 0
  return Math.max(0, props.invoice.total - props.invoice.terbayar)
})

const sisaSetelahBayar = computed(() => {
  return Math.max(0, sisaTagihan.value - (nominal.value || 0))
})

const isOverpaid = computed(() => {
  return (nominal.value || 0) > sisaTagihan.value
})

const isFormValid = computed(() => {
  if (!tanggalBayar.value) return false
  if (!nominal.value || nominal.value <= 0) return false
  if (isOverpaid.value) return false
  if (
    (metodePembayaran.value === 'TRANSFER' || metodePembayaran.value === 'CEK/GIRO') &&
    !bankId.value
  ) {
    return false
  }
  return true
})

async function initForm(): Promise<void> {
  if (!props.invoice) return

  isLoading.value = true
  try {
    // Load banks
    const banksRes = await bankService.getAll()
    bankOptions.value = banksRes.data.map((b: Bank) => ({
      value: b.id,
      label: `${b.bank || 'Bank'} (${b.rekening || '-'})`
    }))

    // Default to BCA PT Impact if available
    const defaultBank = banksRes.data.find(b => b.bank?.toLowerCase().includes('bca'))
    if (defaultBank) {
      bankId.value = defaultBank.id
    } else if (bankOptions.value.length > 0) {
      bankId.value = bankOptions.value[0].value
    }

    // Default payment code and remaining balance
    paymentCode.value = await salesPaymentService.generateNextPaymentCode(props.invoice.id)
    nominal.value = sisaTagihan.value
    tanggalBayar.value = new Date().toISOString().split('T')[0]
    metodePembayaran.value = 'TRANSFER'
    keterangan.value = ''
    buktiBayar.value = ''
  } catch (error) {
    console.error('Failed to init payment form:', error)
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.modelValue,
  newVal => {
    if (newVal) {
      initForm()
    }
  }
)

function setMaxNominal(): void {
  nominal.value = sisaTagihan.value
}

async function handleSubmit(): Promise<void> {
  if (!props.invoice || !isFormValid.value || isSubmitting.value) return

  isSubmitting.value = true
  try {
    await salesPaymentService.createPayment({
      invoice_id: props.invoice.id,
      tanggal: tanggalBayar.value,
      metode_pembayaran: metodePembayaran.value,
      bank_id: bankId.value ? Number(bankId.value) : null,
      jumlah: Number(nominal.value),
      keterangan: keterangan.value || null,
      bukti_bayar: buktiBayar.value || null
    })

    toast.success(`Pembayaran untuk invoice ${props.invoice.kode} berhasil dicatat.`)
    emit('saved')
    isOpen.value = false
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Gagal mencatat pembayaran.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AppModal v-model="isOpen" title="Tambah Pembayaran Invoice" size="lg">
    <!-- Invoice Context Banner -->
    <div
      v-if="invoice"
      class="bg-slate-50 border border-slate-200 rounded-lg p-3.5 mb-5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
    >
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <span class="font-bold text-slate-800 text-sm font-mono">{{ invoice.kode }}</span>
          <span
            class="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-100 text-teal-800 uppercase"
          >
            {{ invoice.jenis }}
          </span>
        </div>
        <div class="text-slate-500">
          Tanggal Invoice: <span class="font-mono text-slate-700">{{ invoice.tanggal }}</span>
        </div>
      </div>

      <div class="flex items-center gap-4 text-right">
        <div>
          <span class="text-slate-500 block text-[11px]">Total Tagihan</span>
          <span class="font-mono font-bold text-slate-900 text-sm">
            {{ formatCurrency(invoice.total) }}
          </span>
        </div>
        <div class="border-l border-slate-200 pl-4">
          <span class="text-amber-800 block text-[11px] font-medium">Sisa Tagihan</span>
          <span class="font-mono font-bold text-amber-700 text-sm">
            {{ formatCurrency(sisaTagihan) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Payment Form -->
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- 1. Kode Pembayaran (Read-only) -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Kode Pembayaran <span class="text-slate-400 font-normal">(Otomatis)</span>
          </label>
          <AppInput
            :model-value="paymentCode"
            readonly
            disabled
            placeholder="Memuat kode..."
            class="bg-slate-100 font-mono text-xs font-bold text-slate-700"
          />
        </div>

        <!-- 2. Tanggal Pembayaran -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Tanggal Pembayaran <span class="text-rose-500">*</span>
          </label>
          <div class="relative">
            <AppInput v-model="tanggalBayar" type="date" required class="text-xs" />
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- 3. Metode Pembayaran -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Metode Pembayaran <span class="text-rose-500">*</span>
          </label>
          <AppSelect
            v-model="metodePembayaran"
            :options="[
              { value: 'TRANSFER', label: 'Transfer Bank' },
              { value: 'TUNAI', label: 'Tunai / Kasir' },
              { value: 'CEK/GIRO', label: 'Cek / Bilyet Giro' }
            ]"
            class="text-xs"
          />
        </div>

        <!-- 4. Bank / Akun Kas -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Bank Tujuan
            <span
              v-if="metodePembayaran === 'TRANSFER' || metodePembayaran === 'CEK/GIRO'"
              class="text-rose-500"
              >*</span
            >
          </label>
          <AppSelect
            v-model="bankId"
            :options="bankOptions"
            :disabled="metodePembayaran === 'TUNAI'"
            placeholder="Pilih rekening bank..."
            class="text-xs"
          />
        </div>
      </div>

      <!-- 5. Nominal Pembayaran -->
      <div class="bg-amber-50/50 border border-amber-200/70 rounded-lg p-3.5 space-y-2">
        <div class="flex items-center justify-between">
          <label class="block text-xs font-bold text-slate-800">
            Nominal Pembayaran (Rp) <span class="text-rose-500">*</span>
          </label>
          <button
            type="button"
            class="text-[11px] font-semibold text-teal-700 hover:text-teal-900 underline transition-colors"
            @click="setMaxNominal"
          >
            Bayar Penuh Sisa Tagihan ({{ formatCurrency(sisaTagihan) }})
          </button>
        </div>

        <AppInput
          v-model.number="nominal"
          type="number"
          min="1"
          :max="sisaTagihan"
          step="1"
          required
          placeholder="Masukkan nominal bayar..."
          class="font-mono text-base font-bold text-slate-900 bg-white"
        />

        <div class="flex items-center justify-between text-xs pt-1">
          <span class="text-slate-500">Sisa Tagihan Setelah Pembayaran:</span>
          <span
            class="font-mono font-bold"
            :class="sisaSetelahBayar === 0 ? 'text-emerald-700' : 'text-amber-700'"
          >
            {{ formatCurrency(sisaSetelahBayar) }}
            <span v-if="sisaSetelahBayar === 0" class="text-[10px] text-emerald-600 font-semibold">
              (LUNAS)
            </span>
          </span>
        </div>

        <!-- Overpayment Warning -->
        <div v-if="isOverpaid" class="flex items-center gap-1.5 text-xs text-rose-600 font-medium">
          <AlertCircle class="w-3.5 h-3.5 shrink-0" />
          <span>Nominal tidak boleh melebihi sisa tagihan invoice.</span>
        </div>
      </div>

      <!-- 6. Nomor Bukti / Referensi -->
      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">
          Nomor Bukti / Referensi Transfer
          <span class="text-slate-400 font-normal">(Opsional)</span>
        </label>
        <AppInput
          v-model="buktiBayar"
          placeholder="Contoh: TRX-BCA-9812401 atau No. Giro..."
          class="text-xs font-mono"
        />
      </div>

      <!-- 7. Keterangan -->
      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">
          Keterangan / Catatan Pembayaran
          <span class="text-slate-400 font-normal">(Opsional)</span>
        </label>
        <AppTextarea
          v-model="keterangan"
          :rows="2"
          placeholder="Catatan tambahan pembayaran..."
          class="text-xs"
        />
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
        <AppButton type="button" variant="outline" size="sm" @click="isOpen = false">
          Batal
        </AppButton>
        <AppButton
          type="submit"
          variant="primary"
          size="sm"
          :loading="isSubmitting"
          :disabled="!isFormValid || isSubmitting"
        >
          <template #iconLeft>
            <CheckCircle2 class="w-4 h-4" />
          </template>
          Simpan Pembayaran
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>
