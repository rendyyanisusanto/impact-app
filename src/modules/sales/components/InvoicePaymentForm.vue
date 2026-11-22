<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { FileText, Banknote, DollarSign, Info, CheckCircle2, ArrowLeft } from 'lucide-vue-next'
import type {
  SalesInvoicePaymentSummary,
  SalesPayment,
  PaymentMethod,
  CreatePaymentPayload,
  UpdatePaymentPayload
} from '../types/sales-payment.types'
import { terbilangRupiah } from '../utils/sales-payment-calculations'
import { bankService } from '@/modules/settings/banks/services/bank.service'
import type { Bank } from '@/modules/settings/banks/types/bank.types'

interface Props {
  invoiceSummary: SalesInvoicePaymentSummary
  mode?: 'create' | 'edit'
  initialData?: SalesPayment | null
  isSubmitting?: boolean
  generatedCode?: string
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create',
  initialData: null,
  isSubmitting: false,
  generatedCode: ''
})

const emit = defineEmits<{
  (e: 'submit', payload: CreatePaymentPayload | UpdatePaymentPayload): void
  (e: 'cancel'): void
}>()

const banks = ref<Bank[]>([])
const isLoadingBanks = ref(false)

const tanggal = ref(new Date().toISOString().split('T')[0])
const metodePembayaran = ref<PaymentMethod>('TRANSFER')
const bankId = ref<number | null>(null)
const nominal = ref<number>(0)
const buktiBayar = ref('')
const keterangan = ref('')
const errorMessage = ref('')

// Load banks from bankService
onMounted(async () => {
  isLoadingBanks.value = true
  try {
    const res = await bankService.getAll()
    banks.value = res.data
    // Auto-select first bank if transfer and not set
    if (!bankId.value && banks.value.length > 0 && metodePembayaran.value === 'TRANSFER') {
      bankId.value = banks.value[0].id
    }
  } catch (err) {
    console.error('Failed to load banks:', err)
  } finally {
    isLoadingBanks.value = false
  }
})

// Populate initial data for edit mode
watch(
  () => props.initialData,
  data => {
    if (data && props.mode === 'edit') {
      tanggal.value = data.tanggal
      metodePembayaran.value = data.metode_pembayaran
      bankId.value = data.bank_id
      nominal.value = data.jumlah
      buktiBayar.value = data.bukti_bayar || ''
      keterangan.value = data.keterangan || ''
    }
  },
  { immediate: true }
)

// When in create mode and summary changes, set nominal to remaining balance by default
watch(
  () => props.invoiceSummary,
  summary => {
    if (props.mode === 'create' && summary && nominal.value === 0) {
      nominal.value = summary.sisa_pembayaran
    }
  },
  { immediate: true }
)

const maxAllowedNominal = computed(() => {
  if (props.mode === 'edit' && props.initialData) {
    return props.invoiceSummary.sisa_pembayaran + props.initialData.jumlah
  }
  return props.invoiceSummary.sisa_pembayaran
})

const terbilangText = computed(() => {
  if (!nominal.value || nominal.value <= 0) return '-'
  return terbilangRupiah(nominal.value)
})

const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val)
}

const handleSetFullPayment = () => {
  nominal.value = maxAllowedNominal.value
  errorMessage.value = ''
}

const validate = (): boolean => {
  errorMessage.value = ''

  if (!tanggal.value) {
    errorMessage.value = 'Tanggal pembayaran wajib diisi.'
    return false
  }

  if (metodePembayaran.value === 'TRANSFER' || metodePembayaran.value === 'CEK/GIRO') {
    if (!bankId.value) {
      errorMessage.value =
        'Bank / Rekening tujuan wajib dipilih untuk metode Transfer atau Cek/Giro.'
      return false
    }
  }

  if (!nominal.value || nominal.value <= 0) {
    errorMessage.value = 'Nominal pembayaran harus lebih besar dari Rp 0.'
    return false
  }

  if (nominal.value > maxAllowedNominal.value) {
    errorMessage.value = `Nominal pembayaran (${formatCurrency(nominal.value)}) melebihi sisa tagihan (${formatCurrency(maxAllowedNominal.value)}).`
    return false
  }

  return true
}

const handleSubmit = () => {
  if (!validate()) return

  if (props.mode === 'edit' && props.initialData) {
    const payload: UpdatePaymentPayload = {
      tanggal: tanggal.value,
      metode_pembayaran: metodePembayaran.value,
      bank_id: metodePembayaran.value === 'TUNAI' ? null : bankId.value,
      jumlah: Math.round(Number(nominal.value)),
      bukti_bayar: buktiBayar.value.trim() || null,
      keterangan: keterangan.value.trim() || null
    }
    emit('submit', payload)
  } else {
    const payload: CreatePaymentPayload = {
      invoice_id: props.invoiceSummary.invoice_id,
      tanggal: tanggal.value,
      metode_pembayaran: metodePembayaran.value,
      bank_id: metodePembayaran.value === 'TUNAI' ? null : bankId.value,
      jumlah: Math.round(Number(nominal.value)),
      bukti_bayar: buktiBayar.value.trim() || null,
      keterangan: keterangan.value.trim() || null
    }
    emit('submit', payload)
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- SECTION 1: Informasi Tagihan Invoice (Read-only Summary) -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div
        class="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <div class="p-2 bg-teal-100 text-teal-700 rounded-lg">
            <FileText class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-base font-bold text-slate-800">Informasi Tagihan Invoice</h2>
            <p class="text-xs text-slate-500">
              Rincian invoice penjualan yang akan diproses pembayarannya
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span
            :class="[
              'px-2.5 py-1 text-xs font-bold rounded-full',
              invoiceSummary.variant === 'impact'
                ? 'bg-teal-100 text-teal-800'
                : invoiceSummary.variant === 'pola'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-purple-100 text-purple-800'
            ]"
          >
            {{
              invoiceSummary.variant === 'impact'
                ? 'SO IMPACT (PPN)'
                : invoiceSummary.variant === 'pola'
                  ? 'SO POLA (NON-PPN)'
                  : 'SO KS (NON-PPN)'
            }}
          </span>

          <span
            :class="[
              'px-2.5 py-1 text-xs font-bold rounded-full uppercase',
              invoiceSummary.status_pembayaran === 'LUNAS'
                ? 'bg-emerald-100 text-emerald-800'
                : invoiceSummary.status_pembayaran === 'SEBAGIAN'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-amber-100 text-amber-800'
            ]"
          >
            {{
              invoiceSummary.status_pembayaran === 'LUNAS'
                ? 'Lunas'
                : invoiceSummary.status_pembayaran === 'SEBAGIAN'
                  ? 'Sebagian'
                  : 'Belum Bayar'
            }}
          </span>
        </div>
      </div>

      <div class="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <span class="text-xs font-semibold text-slate-400 block uppercase">No. Invoice</span>
          <span class="text-sm font-bold text-slate-900 mt-0.5 block">
            {{ invoiceSummary.invoice_kode }}
          </span>
          <span class="text-xs text-slate-500 mt-1 block">
            Tanggal: {{ invoiceSummary.tanggal_invoice }}
          </span>
        </div>

        <div>
          <span class="text-xs font-semibold text-slate-400 block uppercase">No. Sales Order</span>
          <span class="text-sm font-bold text-slate-900 mt-0.5 block">
            {{ invoiceSummary.so_kode }}
          </span>
          <span class="text-xs text-slate-500 mt-1 block">
            Jenis: {{ invoiceSummary.jenis_invoice }}
          </span>
        </div>

        <div>
          <span class="text-xs font-semibold text-slate-400 block uppercase">Customer</span>
          <span class="text-sm font-bold text-slate-900 mt-0.5 block truncate">
            {{ invoiceSummary.customer_nama }}
          </span>
          <span class="text-xs text-slate-500 mt-1 block truncate">
            {{ invoiceSummary.customer_alamat || 'Alamat tidak tersedia' }}
          </span>
        </div>

        <div>
          <span class="text-xs font-semibold text-slate-400 block uppercase"
            >Sisa Tagihan Saat Ini</span
          >
          <span class="text-base font-extrabold text-rose-600 mt-0.5 block">
            {{ formatCurrency(invoiceSummary.sisa_pembayaran) }}
          </span>
          <span class="text-xs text-slate-500 mt-1 block">
            Total: {{ formatCurrency(invoiceSummary.total_invoice) }} | Terbayar:
            {{ formatCurrency(invoiceSummary.sudah_dibayar) }}
          </span>
        </div>
      </div>
    </div>

    <!-- SECTION 2: Form Input Transaksi Pembayaran -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div
        class="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <div class="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
            <DollarSign class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-base font-bold text-slate-800">
              {{ mode === 'edit' ? 'Edit Transaksi Pembayaran' : 'Input Transaksi Pembayaran' }}
            </h2>
            <p class="text-xs text-slate-500">
              Lengkapi informasi pembayaran pelanggan secara akurat
            </p>
          </div>
        </div>

        <div
          v-if="generatedCode || initialData?.kode"
          class="text-xs font-mono font-bold bg-slate-200 text-slate-700 px-3 py-1 rounded-md"
        >
          {{ initialData?.kode || generatedCode }}
        </div>
      </div>

      <form class="p-6 space-y-6" @submit.prevent="handleSubmit">
        <!-- Error Alert -->
        <div
          v-if="errorMessage"
          class="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm flex items-start gap-2"
        >
          <Info class="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{{ errorMessage }}</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Tanggal Pembayaran -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">
              Tanggal Pembayaran <span class="text-rose-500">*</span>
            </label>
            <div class="relative">
              <input
                v-model="tanggal"
                type="date"
                required
                data-test="payment-input-tanggal"
                class="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
              />
            </div>
            <p class="text-[11px] text-slate-400 mt-1">Tanggal dana efektif diterima</p>
          </div>

          <!-- Metode Pembayaran -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">
              Metode Pembayaran <span class="text-rose-500">*</span>
            </label>
            <select
              v-model="metodePembayaran"
              required
              data-test="payment-select-metode"
              class="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none bg-white font-medium"
            >
              <option value="TRANSFER">Transfer Bank</option>
              <option value="TUNAI">Tunai / Kas</option>
              <option value="CEK/GIRO">Cek / Bilyet Giro</option>
            </select>
            <p class="text-[11px] text-slate-400 mt-1">Pilih saluran pembayaran</p>
          </div>

          <!-- Rekening Bank Tujuan -->
          <div v-if="metodePembayaran !== 'TUNAI'">
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">
              Rekening Bank Tujuan <span class="text-rose-500">*</span>
            </label>
            <select
              v-model="bankId"
              required
              data-test="payment-select-bank"
              class="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none bg-white"
            >
              <option :value="null" disabled>Pilih Rekening Bank</option>
              <option v-for="b in banks" :key="b.id" :value="b.id">
                {{ b.bank }} — {{ b.rekening }}
              </option>
            </select>
            <p class="text-[11px] text-slate-400 mt-1">Rekening penampung mutasi bank perusahaan</p>
          </div>

          <!-- Nomor Bukti / Referensi -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nomor Referensi / Bukti Transfer
            </label>
            <input
              v-model="buktiBayar"
              type="text"
              data-test="payment-input-bukti"
              placeholder="Contoh: TRX-BCA-20261101-009 / No Kuitansi"
              class="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
            />
            <p class="text-[11px] text-slate-400 mt-1">
              Opsional, bukti transaksi bank atau kuitansi manual
            </p>
          </div>
        </div>

        <!-- Nominal Pembayaran Input with Quick Fill -->
        <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
              <Banknote class="w-4 h-4 text-emerald-600" />
              Nominal Pembayaran (Rp) <span class="text-rose-500">*</span>
            </label>

            <button
              type="button"
              data-test="payment-btn-pay-full"
              class="text-xs font-semibold text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1 rounded-md transition-colors"
              @click="handleSetFullPayment"
            >
              Bayar Penuh / Lunas ({{ formatCurrency(maxAllowedNominal) }})
            </button>
          </div>

          <div class="relative">
            <span
              class="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm"
            >
              Rp
            </span>
            <input
              v-model.number="nominal"
              type="number"
              min="1"
              :max="maxAllowedNominal"
              step="1"
              required
              data-test="payment-input-nominal"
              class="w-full pl-11 pr-4 py-2.5 text-base font-bold text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
              placeholder="0"
            />
          </div>

          <!-- Terbilang Helper -->
          <div
            class="text-xs text-slate-600 italic flex items-center gap-1 bg-white p-2.5 rounded-lg border border-slate-200"
          >
            <span class="font-semibold text-slate-500 not-italic">Terbilang:</span>
            <span class="text-teal-700 font-medium capitalize">{{ terbilangText }}</span>
          </div>
        </div>

        <!-- Catatan / Keterangan -->
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">
            Catatan / Keterangan Tambahan
          </label>
          <textarea
            v-model="keterangan"
            rows="2"
            data-test="payment-input-keterangan"
            placeholder="Catatan pembayaran, misalnya termin ke-2, diskon pelunasan, atau info lainnya..."
            class="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none resize-none"
          />
        </div>

        <!-- Form Actions -->
        <div class="pt-4 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            class="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            @click="emit('cancel')"
          >
            <ArrowLeft class="w-4 h-4" />
            Batal
          </button>

          <button
            type="submit"
            :disabled="isSubmitting"
            data-test="payment-btn-submit"
            class="px-6 py-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <CheckCircle2 class="w-4 h-4" />
            {{
              isSubmitting
                ? 'Menyimpan...'
                : mode === 'edit'
                  ? 'Simpan Perubahan'
                  : 'Simpan Pembayaran'
            }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
