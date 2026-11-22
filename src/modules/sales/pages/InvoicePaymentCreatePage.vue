<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import {
  CreditCard,
  ArrowLeft,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  Building2,
  Layers,
  Save
} from 'lucide-vue-next'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppSearchableSelect from '@/shared/components/ui/AppSearchableSelect.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import InvoicePicker from '../components/InvoicePicker.vue'
import { salesPaymentService } from '../services/sales-payment.service'
import { bankService } from '@/modules/settings/banks/services/bank.service'
import { useCustomerLookup } from '../composables/useCustomerLookup'
import type { Bank } from '@/modules/settings/banks/types/bank.types'
import type {
  PaymentMethod,
  CreatePaymentPayload
} from '../types/sales-payment.types'
import type { SalesInvoiceListItem } from '../types/sales-invoice.types'
import { terbilangRupiah } from '../utils/sales-payment-calculations'
import { formatCurrency } from '@/shared/utils/formatters'
import { useToast } from '@/shared/composables/useToast'

interface AllocationRow {
  invoice_id: number
  invoice_kode: string
  so_kode: string
  so_variant?: string
  tanggal: string
  jenis: string
  total_invoice: number
  sudah_dibayar: number
  sisa_tagihan: number
  bayar_sekarang: number
  sisa_setelah_bayar: number
  error?: string
}

const route = useRoute()
const router = useRouter()
const toast = useToast()

// 1. Transaction Form State
const form = ref({
  customerId: null as number | null,
  tanggal: new Date().toISOString().split('T')[0],
  kode: '',
  metode_pembayaran: 'TRANSFER' as PaymentMethod,
  bank_id: null as number | null,
  bukti_bayar: '',
  keterangan: ''
})

const rows = ref<AllocationRow[]>([])
const banks = ref<Bank[]>([])
const isLoadingBanks = ref(false)
const isGeneratingCode = ref(false)
const isSubmitting = ref(false)
const isPickerOpen = ref(false)
const isDirty = ref(false)

// Confirmation Dialogs
const isLeaveConfirmOpen = ref(false)
const isCustomerChangeConfirmOpen = ref(false)
const pendingNavigation = ref<string | null>(null)
const previousCustomerId = ref<number | null>(null)
const pendingNewCustomerId = ref<number | null>(null)

// Keyboard navigation refs for spreadsheet inputs
const inputRefs = ref<HTMLInputElement[]>([])

// Customer lookup composable
const {
  options: customerOptions,
  fetchCustomers,
  onSearch: onCustomerSearch,
  onSelect: onCustomerSelectInternal,
  setSelected: setCustomerSelected
} = useCustomerLookup()

// Check if locked by single invoice URL query
const queryInvoiceId = computed(() => {
  const q = route.query.invoiceId
  return q && !isNaN(Number(q)) ? Number(q) : null
})

// Financial Calculations
const totals = computed(() => {
  let totalTagihan = 0
  let totalSudahDibayar = 0
  let totalSisa = 0
  let totalBayar = 0
  let totalSisaSetelah = 0
  let lunasCount = 0
  let sebagianCount = 0

  for (const r of rows.value) {
    totalTagihan += Math.round(Number(r.total_invoice) || 0)
    totalSudahDibayar += Math.round(Number(r.sudah_dibayar) || 0)
    totalSisa += Math.round(Number(r.sisa_tagihan) || 0)
    const bayar = Math.round(Number(r.bayar_sekarang) || 0)
    totalBayar += bayar
    const sisaAkhir = Math.max(0, Math.round(Number(r.sisa_tagihan) || 0) - bayar)
    totalSisaSetelah += sisaAkhir

    if (bayar > 0) {
      if (sisaAkhir === 0) {
        lunasCount++
      } else {
        sebagianCount++
      }
    }
  }

  return {
    totalTagihan,
    totalSudahDibayar,
    totalSisa,
    totalBayar,
    totalSisaSetelah,
    lunasCount,
    sebagianCount,
    hasErrors: rows.value.some(r => Boolean(r.error))
  }
})

const terbilangText = computed(() => {
  return terbilangRupiah(totals.value.totalBayar)
})

const excludedInvoiceIds = computed(() => {
  return rows.value.map(r => r.invoice_id)
})

// 2. Generate / Regenerate Payment Code
let codeReqId = 0
const generatePaymentCode = async () => {
  const current = ++codeReqId
  isGeneratingCode.value = true
  try {
    const code = await salesPaymentService.generateMultiPaymentCode(form.value.customerId)
    if (current === codeReqId) {
      form.value.kode = code
    }
  } catch (err) {
    console.error('Failed to generate payment code:', err)
  } finally {
    if (current === codeReqId) {
      isGeneratingCode.value = false
    }
  }
}

// 3. Customer Selection Handling
const handleCustomerSelect = (id: string | number | null) => {
  const nextId = id ? Number(id) : null
  if (rows.value.length > 0 && form.value.customerId && nextId !== form.value.customerId) {
    // Confirm before clearing grid
    pendingNewCustomerId.value = nextId
    previousCustomerId.value = form.value.customerId
    isCustomerChangeConfirmOpen.value = true
    return
  }

  applyCustomerChange(nextId)
}

const applyCustomerChange = (customerId: number | null) => {
  form.value.customerId = customerId
  onCustomerSelectInternal(customerId)
  rows.value = []
  isDirty.value = true
  generatePaymentCode()
}

const confirmCustomerChange = () => {
  isCustomerChangeConfirmOpen.value = false
  applyCustomerChange(pendingNewCustomerId.value)
  pendingNewCustomerId.value = null
  previousCustomerId.value = null
}

const cancelCustomerChange = () => {
  isCustomerChangeConfirmOpen.value = false
  form.value.customerId = previousCustomerId.value
  pendingNewCustomerId.value = null
  previousCustomerId.value = null
}

// 4. Load Master Banks
const loadBanks = async () => {
  isLoadingBanks.value = true
  try {
    const res = await bankService.getAll()
    banks.value = res.data || []
    if (!form.value.bank_id && banks.value.length > 0 && form.value.metode_pembayaran === 'TRANSFER') {
      form.value.bank_id = banks.value[0].id
    }
  } catch (err) {
    console.error('Failed to load banks:', err)
  } finally {
    isLoadingBanks.value = false
  }
}

// 5. Invoices & Allocation Grid Operations
const addInvoicesToGrid = (invoices: SalesInvoiceListItem[]) => {
  for (const inv of invoices) {
    if (rows.value.some(r => r.invoice_id === inv.id)) continue

    const sisa = Math.max(0, Math.round(Number(inv.sisa_pembayaran ?? (Number(inv.total) - Number(inv.terbayar || 0)))))
    rows.value.push({
      invoice_id: inv.id,
      invoice_kode: inv.kode,
      so_kode: inv.so_kode || '-',
      so_variant: inv.so_variant,
      tanggal: inv.tanggal,
      jenis: inv.jenis || 'PELUNASAN',
      total_invoice: Math.round(Number(inv.total) || 0),
      sudah_dibayar: Math.round(Number(inv.terbayar) || 0),
      sisa_tagihan: sisa,
      bayar_sekarang: sisa, // Default to full remaining payment
      sisa_setelah_bayar: 0,
      error: undefined
    })
  }

  isDirty.value = true
  isPickerOpen.value = false

  // Focus the first newly added input on next tick
  nextTick(() => {
    if (inputRefs.value.length > 0) {
      inputRefs.value[inputRefs.value.length - 1]?.focus()
    }
  })
}

const handleSelectInvoiceFromPicker = (invoice: SalesInvoiceListItem) => {
  addInvoicesToGrid([invoice])
}

const handleAddMultipleInvoicesFromPicker = (invoices: SalesInvoiceListItem[]) => {
  addInvoicesToGrid(invoices)
}

const updateRowPayment = (row: AllocationRow, rawVal: string | number) => {
  const val = typeof rawVal === 'string' ? Number(rawVal.replace(/[^\d.-]/g, '')) || 0 : Number(rawVal) || 0
  const cleanVal = Math.max(0, Math.round(val))

  row.bayar_sekarang = cleanVal
  row.sisa_setelah_bayar = Math.max(0, row.sisa_tagihan - cleanVal)

  if (cleanVal > row.sisa_tagihan) {
    row.error = `Melebihi sisa (${formatCurrency(row.sisa_tagihan)})`
  } else if (cleanVal < 0) {
    row.error = 'Tidak boleh negatif'
  } else {
    row.error = undefined
  }

  isDirty.value = true
}

const handleBayarPenuhRow = (idx: number) => {
  const row = rows.value[idx]
  if (row) {
    updateRowPayment(row, row.sisa_tagihan)
  }
}

const handleHapusRow = (idx: number) => {
  rows.value.splice(idx, 1)
  isDirty.value = true
}

const handleBayarPenuhSemua = () => {
  for (const r of rows.value) {
    updateRowPayment(r, r.sisa_tagihan)
  }
}

const handleKosongkanAlokasi = () => {
  for (const r of rows.value) {
    updateRowPayment(r, 0)
  }
}

// 6. Excel-like Keyboard Navigation
const handleEnterKey = (idx: number, e: KeyboardEvent) => {
  e.preventDefault()
  if (idx + 1 < inputRefs.value.length) {
    inputRefs.value[idx + 1]?.focus()
    inputRefs.value[idx + 1]?.select()
  }
}

const handleShiftEnterKey = (idx: number, e: KeyboardEvent) => {
  e.preventDefault()
  if (idx > 0) {
    inputRefs.value[idx - 1]?.focus()
    inputRefs.value[idx - 1]?.select()
  }
}

const handleKeyDownGlobal = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault()
    handleSubmit()
  }
}

// 7. Submission
const handleSubmit = async () => {
  if (!form.value.customerId) {
    toast.error('Silakan pilih mitra customer terlebih dahulu.')
    return
  }

  if (rows.value.length === 0) {
    toast.error('Belum ada tagihan invoice yang dipilih untuk dibayar.')
    return
  }

  const activeAllocations = rows.value.filter(r => r.bayar_sekarang > 0)
  if (activeAllocations.length === 0) {
    toast.error('Nominal pembayaran belum dialokasikan pada invoice mana pun.')
    return
  }

  const invalidRow = rows.value.find(r => Boolean(r.error))
  if (invalidRow) {
    toast.error(`Periksa alokasi pada invoice ${invalidRow.invoice_kode}: ${invalidRow.error}`)
    return
  }

  if (form.value.metode_pembayaran === 'TRANSFER' && !form.value.bank_id) {
    toast.error('Silakan pilih rekening bank tujuan untuk metode transfer.')
    return
  }

  isSubmitting.value = true
  try {
    const payload: CreatePaymentPayload = {
      customerId: form.value.customerId,
      tanggal: form.value.tanggal,
      metode_pembayaran: form.value.metode_pembayaran,
      bank_id: form.value.metode_pembayaran === 'TUNAI' ? undefined : form.value.bank_id || undefined,
      bukti_bayar: form.value.bukti_bayar?.trim() || undefined,
      keterangan: form.value.keterangan?.trim() || undefined,
      allocations: activeAllocations.map(r => ({
        invoice_id: r.invoice_id,
        amount: r.bayar_sekarang
      }))
    }

    const created = await salesPaymentService.createPayment(payload)
    toast.success(`Pembayaran ${created.kode} berhasil disimpan (${activeAllocations.length} invoice).`)
    isDirty.value = false
    router.push('/sales/invoice-payments')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mencatat transaksi pembayaran.'
    toast.error(msg)
    console.error('Submit payment error:', err)
  } finally {
    isSubmitting.value = false
  }
}

// 8. Route Navigation Guards & Cancel
onBeforeRouteLeave((to, _from, next) => {
  if (isDirty.value && !isSubmitting.value) {
    pendingNavigation.value = to.fullPath
    isLeaveConfirmOpen.value = true
    next(false)
  } else {
    next()
  }
})

const handleCancel = () => {
  if (isDirty.value) {
    pendingNavigation.value = '/sales/invoice-payments'
    isLeaveConfirmOpen.value = true
  } else {
    router.push('/sales/invoice-payments')
  }
}

const confirmLeave = () => {
  isDirty.value = false
  isLeaveConfirmOpen.value = false
  if (pendingNavigation.value) {
    router.push(pendingNavigation.value)
  } else {
    router.push('/sales/invoice-payments')
  }
}

const cancelLeave = () => {
  isLeaveConfirmOpen.value = false
  pendingNavigation.value = null
}

// 9. Initial Load & URL Query Support
onMounted(async () => {
  window.addEventListener('keydown', handleKeyDownGlobal)
  await Promise.all([fetchCustomers(), loadBanks()])

  if (queryInvoiceId.value) {
    try {
      const summary = await salesPaymentService.getInvoicePaymentSummary(queryInvoiceId.value)
      if (summary) {
        setCustomerSelected(summary.customer_id ?? null, `${summary.customer_nama}`)
        form.value.customerId = summary.customer_id ?? null
        await generatePaymentCode()

        const sisa = Math.max(0, summary.sisa_pembayaran)
        rows.value = [
          {
            invoice_id: summary.invoice_id,
            invoice_kode: summary.invoice_kode,
            so_kode: summary.so_kode || '-',
            tanggal: summary.tanggal_invoice,
            jenis: summary.jenis_invoice,
            total_invoice: summary.total_invoice,
            sudah_dibayar: summary.sudah_dibayar,
            sisa_tagihan: sisa,
            bayar_sekarang: sisa,
            sisa_setelah_bayar: 0
          }
        ]
        isDirty.value = false
      }
    } catch (err) {
      console.error('Failed to pre-load invoice from query:', err)
      toast.error('Gagal memuat invoice dari URL.')
      await generatePaymentCode()
    }
  } else {
    await generatePaymentCode()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDownGlobal)
})

const getVariantBadge = (variant?: string) => {
  switch (variant) {
    case 'impact':
      return { label: 'Impact (PPN)', cls: 'bg-teal-50 text-teal-700 border-teal-200' }
    case 'pola':
      return { label: 'Pola', cls: 'bg-blue-50 text-blue-700 border-blue-200' }
    case 'ks':
      return { label: 'KS', cls: 'bg-purple-50 text-purple-700 border-purple-200' }
    default:
      return { label: 'Impact', cls: 'bg-slate-50 text-slate-700 border-slate-200' }
  }
}
</script>

<template>
  <div class="space-y-6 pb-28">
    <!-- Header with Breadcrumb & Back -->
    <AppPageHeader
      title="Catat Pembayaran Invoice"
      description="Pencatatan alokasi pelunasan dan pembayaran multi-invoice untuk satu mitra customer."
      :breadcrumbs="[
        { label: 'Beranda', to: '/' },
        { label: 'Penjualan', to: '/sales/orders/impact' },
        { label: 'Pembayaran Invoice', to: '/sales/invoice-payments' },
        { label: 'Catat Pembayaran' }
      ]"
    >
      <template #actions>
        <AppButton
          variant="outline"
          size="sm"
          data-test="btn-back-to-list"
          class="flex items-center gap-1.5"
          @click="handleCancel"
        >
          <ArrowLeft class="w-4 h-4" />
          <span>Kembali ke Daftar</span>
        </AppButton>
      </template>
    </AppPageHeader>

    <!-- Card 1: Informasi Header Transaksi Pembayaran (Desktop ERP 4 Columns) -->
    <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5" data-test="section-payment-info">
      <div class="border-b border-slate-100 pb-3 flex items-center justify-between">
        <h3 class="text-sm font-semibold text-slate-800 uppercase tracking-wider text-[11px] text-slate-500 flex items-center gap-2">
          <CreditCard class="w-4 h-4 text-teal-600" />
          <span>Informasi Transaksi Kas & Bank</span>
        </h3>
        <span class="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
          Multi-Invoice Payment System
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <!-- 1. Customer Dropdown (Searchable) -->
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-700">
            Customer <span class="text-rose-500">*</span>
          </label>
          <AppSearchableSelect
            v-model="form.customerId"
            :options="customerOptions"
            placeholder="Cari atau pilih customer..."
            remote
            data-test="select-customer"
            @search="onCustomerSearch"
            @change="handleCustomerSelect"
          />
          <p class="text-[10px] text-slate-400">Pilih mitra customer yang akan membayar faktur</p>
        </div>

        <!-- 2. Tanggal Transaksi -->
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-700">
            Tanggal Pembayaran <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="form.tanggal"
            type="date"
            data-test="input-payment-date"
            class="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800 font-mono"
            @change="generatePaymentCode"
          />
          <p class="text-[10px] text-slate-400">Tanggal efektif penerimaan dana</p>
        </div>

        <!-- 3. No. Pembayaran (Generated / Readonly with refresh) -->
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-700">
            No. Bukti Pembayaran <span class="text-rose-500">*</span>
          </label>
          <div class="flex items-center gap-1.5">
            <input
              v-model="form.kode"
              type="text"
              readonly
              data-test="input-payment-code"
              placeholder="PAY/YY/MM/0001..."
              class="flex-1 py-2 px-3 text-xs font-mono font-semibold bg-slate-100 border border-slate-200 rounded-lg text-slate-800 cursor-not-allowed select-all"
            />
            <button
              type="button"
              class="p-2 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 rounded-lg border border-slate-200 transition-colors"
              title="Generate Ulang Nomor Bukti Pembayaran"
              :disabled="isGeneratingCode"
              @click="generatePaymentCode"
            >
              <RotateCcw class="w-3.5 h-3.5" :class="{ 'animate-spin': isGeneratingCode }" />
            </button>
          </div>
          <p class="text-[10px] text-slate-400 font-mono">Format otomatis: PAY/{YY}/{MM}/{seq}</p>
        </div>

        <!-- 4. Metode Pembayaran -->
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-700">
            Metode Pembayaran <span class="text-rose-500">*</span>
          </label>
          <select
            v-model="form.metode_pembayaran"
            data-test="select-payment-method"
            class="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800"
          >
            <option value="TRANSFER">Transfer Bank</option>
            <option value="TUNAI">Kas / Tunai</option>
            <option value="CEK/GIRO">Cek / Bilyet Giro</option>
          </select>
          <p class="text-[10px] text-slate-400">Instrumen transaksi penerimaan</p>
        </div>

        <!-- 5. Bank Tujuan (Only for Transfer & Cek/Giro) -->
        <div v-if="form.metode_pembayaran !== 'TUNAI'" class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-700">
            Rekening Bank Tujuan <span class="text-rose-500">*</span>
          </label>
          <select
            v-model="form.bank_id"
            data-test="select-bank"
            class="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800"
          >
            <option :value="null" disabled>Pilih Bank Rekening Tujuan</option>
            <option v-for="b in banks" :key="b.id" :value="b.id">
              {{ b.bank }} - {{ b.rekening }}
            </option>
          </select>
          <p class="text-[10px] text-slate-400">Rekening penampung dana masuk</p>
        </div>

        <!-- 6. Nomor Referensi / Bukti Transfer -->
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-700">
            No. Referensi / Bukti Bayar
          </label>
          <input
            v-model="form.bukti_bayar"
            type="text"
            data-test="input-reference"
            placeholder="No. transfer, resi, atau giro..."
            class="w-full py-2 px-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800"
          />
          <p class="text-[10px] text-slate-400">Nomor referensi mutasi bank atau kwitansi</p>
        </div>

        <!-- 7. Keterangan / Catatan Transaksi -->
        <div
          class="space-y-1.5"
          :class="form.metode_pembayaran !== 'TUNAI' ? 'md:col-span-2 lg:col-span-2' : 'md:col-span-2 lg:col-span-3'"
        >
          <label class="block text-xs font-semibold text-slate-700">
            Keterangan / Catatan Pembayaran
          </label>
          <textarea
            v-model="form.keterangan"
            rows="2"
            maxlength="255"
            data-test="input-keterangan"
            placeholder="Tambahkan catatan jika ada (opsional)..."
            class="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>
    </div>

    <!-- Card 2: Desktop ERP / Excel-like Invoice Allocation Spreadsheet Grid -->
    <div class="space-y-3" data-test="section-allocation-grid">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <Layers class="w-4 h-4 text-teal-600" />
          <h3 class="text-sm font-semibold text-slate-800">
            Daftar Tagihan & Alokasi Pembayaran
          </h3>
          <span
            v-if="rows.length > 0"
            class="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200"
          >
            {{ rows.length }} Faktur Tagihan
          </span>
        </div>

        <!-- Quick Action Toolbar -->
        <div class="flex items-center gap-2 flex-wrap">
          <AppButton
            variant="outline"
            size="sm"
            data-test="btn-open-picker"
            :disabled="!form.customerId"
            class="flex items-center gap-1.5 text-xs font-semibold text-teal-700 border-teal-300 hover:bg-teal-50"
            @click="isPickerOpen = true"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>Tambah Invoice</span>
          </AppButton>

          <AppButton
            v-if="rows.length > 0"
            variant="outline"
            size="sm"
            data-test="btn-pay-all-full"
            class="flex items-center gap-1.5 text-xs text-slate-700 hover:bg-slate-100"
            @click="handleBayarPenuhSemua"
          >
            <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" />
            <span>Bayar Penuh Semua</span>
          </AppButton>

          <AppButton
            v-if="rows.length > 0"
            variant="outline"
            size="sm"
            data-test="btn-clear-allocations"
            class="flex items-center gap-1.5 text-xs text-slate-700 hover:bg-slate-100"
            @click="handleKosongkanAlokasi"
          >
            <RotateCcw class="w-3.5 h-3.5 text-slate-500" />
            <span>Kosongkan Alokasi</span>
          </AppButton>
        </div>
      </div>

      <!-- State A: No Customer Selected Yet -->
      <div
        v-if="!form.customerId"
        data-test="empty-no-customer"
        class="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center shadow-xs"
      >
        <Building2 class="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <h4 class="text-sm font-bold text-slate-700">Pilih Mitra Customer Terlebih Dahulu</h4>
        <p class="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Silakan tentukan customer pada formulir di atas untuk menampilkan dan memilih daftar Sales Invoice aktif yang dapat dibayarkan.
        </p>
      </div>

      <!-- State B: Customer Selected, but 0 invoices added to grid -->
      <div
        v-else-if="rows.length === 0"
        data-test="empty-no-invoices"
        class="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center shadow-xs"
      >
        <CreditCard class="w-10 h-10 text-teal-400 mx-auto mb-2" />
        <h4 class="text-sm font-bold text-slate-800">Belum Ada Tagihan Invoice Dipilih</h4>
        <p class="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Klik tombol <strong>+ Tambah Invoice</strong> untuk memilih satu atau beberapa faktur penjualan yang akan dibayar dalam transaksi ini.
        </p>
        <div class="mt-4">
          <AppButton
            variant="primary"
            size="sm"
            class="bg-teal-600 hover:bg-teal-700 text-white font-semibold"
            @click="isPickerOpen = true"
          >
            <Plus class="w-4 h-4 mr-1" />
            Pilih Tagihan Invoice
          </AppButton>
        </div>
      </div>

      <!-- State C: Excel-like Allocation Spreadsheet Table -->
      <div
        v-else
        class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left border-collapse" data-test="table-allocations">
            <thead>
              <tr class="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <th class="py-2.5 px-3 text-center w-12 border-r border-slate-200">No.</th>
                <th class="py-2.5 px-3 border-r border-slate-200 min-w-[150px]">No. Invoice</th>
                <th class="py-2.5 px-3 border-r border-slate-200 min-w-[150px]">No. Sales Order</th>
                <th class="py-2.5 px-3 border-r border-slate-200 min-w-[90px]">Tanggal</th>
                <th class="py-2.5 px-3 border-r border-slate-200 text-right min-w-[120px]">Total Tagihan</th>
                <th class="py-2.5 px-3 border-r border-slate-200 text-right min-w-[110px]">Terbayar</th>
                <th class="py-2.5 px-3 border-r border-slate-200 text-right min-w-[120px]">Sisa Tagihan</th>
                <th class="py-2.5 px-3 border-r border-slate-200 text-right min-w-[160px] bg-teal-50/50">
                  Bayar Sekarang (Rp) <span class="text-rose-500">*</span>
                </th>
                <th class="py-2.5 px-3 border-r border-slate-200 text-right min-w-[120px]">Sisa Setelah</th>
                <th class="py-2.5 px-3 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-mono">
              <tr
                v-for="(row, idx) in rows"
                :key="row.invoice_id"
                class="hover:bg-slate-50 transition-colors"
                :class="{ 'bg-rose-50/40': Boolean(row.error) }"
                :data-test="`allocation-row-${idx}`"
              >
                <!-- 1. Row Index -->
                <td class="py-2 px-3 text-center text-slate-400 font-sans border-r border-slate-100">
                  {{ idx + 1 }}
                </td>

                <!-- 2. No. Invoice & Jenis Badge -->
                <td class="py-2 px-3 font-bold text-slate-800 border-r border-slate-100">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span>{{ row.invoice_kode }}</span>
                    <span class="px-1.5 py-0.2 rounded text-[10px] font-sans font-semibold bg-slate-100 text-slate-700">
                      {{ row.jenis }}
                    </span>
                  </div>
                </td>

                <!-- 3. No. Sales Order & Variant Badge -->
                <td class="py-2 px-3 text-slate-700 border-r border-slate-100">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span>{{ row.so_kode }}</span>
                    <span
                      v-if="row.so_variant"
                      :class="['px-1.5 py-0.2 rounded text-[10px] font-sans font-semibold border', getVariantBadge(row.so_variant).cls]"
                    >
                      {{ getVariantBadge(row.so_variant).label }}
                    </span>
                  </div>
                </td>

                <!-- 4. Tanggal -->
                <td class="py-2 px-3 text-slate-500 border-r border-slate-100">
                  {{ row.tanggal }}
                </td>

                <!-- 5. Total Tagihan -->
                <td class="py-2 px-3 text-right text-slate-700 border-r border-slate-100">
                  {{ formatCurrency(row.total_invoice) }}
                </td>

                <!-- 6. Terbayar -->
                <td class="py-2 px-3 text-right text-slate-500 border-r border-slate-100">
                  {{ formatCurrency(row.sudah_dibayar) }}
                </td>

                <!-- 7. Sisa Tagihan -->
                <td class="py-2 px-3 text-right font-bold text-slate-900 border-r border-slate-100">
                  {{ formatCurrency(row.sisa_tagihan) }}
                </td>

                <!-- 8. Bayar Sekarang (Editable Currency Input with Excel Nav) -->
                <td class="py-1.5 px-2 text-right border-r border-slate-100 bg-teal-50/30">
                  <div class="space-y-0.5">
                    <input
                      :ref="el => { if (el) inputRefs[idx] = el as HTMLInputElement }"
                      :value="row.bayar_sekarang"
                      type="number"
                      min="0"
                      :max="row.sisa_tagihan"
                      step="1"
                      :data-test="`input-allocation-amount-${idx}`"
                      class="w-full text-right font-mono font-bold text-teal-700 py-1.5 px-2 bg-white border rounded focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs transition-shadow"
                      :class="row.error ? 'border-rose-400 bg-rose-50 text-rose-700 ring-1 ring-rose-400' : 'border-slate-300'"
                      @input="updateRowPayment(row, ($event.target as HTMLInputElement).value)"
                      @keydown.enter="handleEnterKey(idx, $event)"
                      @keydown.shift.enter="handleShiftEnterKey(idx, $event)"
                    />
                    <p v-if="row.error" class="text-[10px] text-rose-600 font-sans font-medium text-right">
                      {{ row.error }}
                    </p>
                  </div>
                </td>

                <!-- 9. Sisa Setelah Bayar -->
                <td class="py-2 px-3 text-right border-r border-slate-100">
                  <span
                    v-if="row.sisa_setelah_bayar === 0 && row.bayar_sekarang > 0"
                    class="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-emerald-100 text-emerald-800"
                  >
                    Rp 0 (Lunas)
                  </span>
                  <span
                    v-else
                    class="font-semibold"
                    :class="row.sisa_setelah_bayar > 0 ? 'text-amber-700' : 'text-slate-500'"
                  >
                    {{ formatCurrency(row.sisa_setelah_bayar) }}
                  </span>
                </td>

                <!-- 10. Aksi (Bayar Penuh / Hapus) -->
                <td class="py-2 px-3 text-center">
                  <div class="flex items-center justify-center gap-1.5 font-sans">
                    <button
                      type="button"
                      title="Set Pembayaran Penuh untuk Invoice Ini"
                      :data-test="`btn-pay-full-${idx}`"
                      class="px-2 py-1 text-[10px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded border border-teal-200 transition-colors"
                      @click="handleBayarPenuhRow(idx)"
                    >
                      Penuh
                    </button>
                    <button
                      type="button"
                      title="Hapus Invoice dari Daftar Alokasi"
                      :data-test="`btn-remove-row-${idx}`"
                      class="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      @click="handleHapusRow(idx)"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>

            <!-- Table Footer: Aggregated Totals -->
            <tfoot>
              <tr class="bg-slate-50 font-bold border-t-2 border-slate-200 text-slate-800">
                <td colspan="4" class="py-3 px-3 text-right font-sans text-xs uppercase text-slate-500 border-r border-slate-200">
                  Total Alokasi Pembayaran:
                </td>
                <td class="py-3 px-3 text-right font-mono text-xs border-r border-slate-200">
                  {{ formatCurrency(totals.totalTagihan) }}
                </td>
                <td class="py-3 px-3 text-right font-mono text-xs text-slate-500 border-r border-slate-200">
                  {{ formatCurrency(totals.totalSudahDibayar) }}
                </td>
                <td class="py-3 px-3 text-right font-mono text-xs text-slate-900 border-r border-slate-200">
                  {{ formatCurrency(totals.totalSisa) }}
                </td>
                <td class="py-3 px-3 text-right font-mono text-sm font-extrabold text-teal-700 bg-teal-50/80 border-r border-slate-200" data-test="total-allocation-amount">
                  {{ formatCurrency(totals.totalBayar) }}
                </td>
                <td class="py-3 px-3 text-right font-mono text-xs border-r border-slate-200">
                  {{ formatCurrency(totals.totalSisaSetelah) }}
                </td>
                <td class="py-3 px-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="px-4 py-2.5 bg-slate-50/70 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div class="flex items-center gap-2">
            <span class="inline-block w-2 h-2 rounded-full bg-teal-500"></span>
            <span>Gunakan tombol <strong>Enter</strong> untuk berpindah ke baris berikutnya, <strong>Shift+Enter</strong> ke baris sebelumnya, dan <strong>Ctrl+S</strong> untuk menyimpan.</span>
          </div>
          <span class="font-medium text-slate-600">
            {{ rows.length }} faktur terdaftar
          </span>
        </div>
      </div>
    </div>

    <!-- Card 3: Summary & Terbilang (Matching SalesOrderSummary Layout) -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" data-test="section-payment-summary">
      <!-- Left: Status Alokasi & Terbilang -->
      <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <CheckCircle2 class="w-4 h-4 text-teal-600" />
          <span>Status Distribusi Alokasi</span>
        </h4>

        <div class="grid grid-cols-2 gap-4 text-xs">
          <div class="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span class="text-slate-400 block text-[11px]">Faktur Lunas Seketika</span>
            <span class="text-sm font-bold text-emerald-700 mt-0.5 block font-mono">
              {{ totals.lunasCount }} Faktur
            </span>
          </div>

          <div class="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span class="text-slate-400 block text-[11px]">Faktur Cicilan Sebagian</span>
            <span class="text-sm font-bold text-amber-700 mt-0.5 block font-mono">
              {{ totals.sebagianCount }} Faktur
            </span>
          </div>
        </div>

        <!-- Terbilang Box -->
        <div class="p-3.5 bg-teal-50/60 border border-teal-200/80 rounded-xl space-y-1">
          <span class="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
            Terbilang Rupiah:
          </span>
          <p class="text-xs italic text-teal-900 font-medium capitalize" data-test="text-terbilang">
            "{{ terbilangText }}"
          </p>
        </div>

        <p class="text-[11px] text-slate-400 leading-relaxed">
          Satu transaksi kas/bank ini akan membukukan mutasi penerimaan dana dan secara simultan mengupdate histori pembayaran masing-masing Sales Invoice terkait.
        </p>
      </div>

      <!-- Right: Financial Breakdown Card -->
      <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider text-slate-500">
          Ringkasan Finansial Pembayaran
        </h4>

        <div class="space-y-2 text-xs">
          <div class="flex items-center justify-between text-slate-600">
            <span>Total Sisa Tagihan Sebelumnya:</span>
            <span class="font-mono font-medium">{{ formatCurrency(totals.totalSisa) }}</span>
          </div>

          <div class="flex items-center justify-between text-slate-600">
            <span>Jumlah Faktur Dialokasikan:</span>
            <span class="font-semibold">{{ rows.length }} Faktur</span>
          </div>

          <div class="border-t border-slate-200 pt-2 flex items-center justify-between">
            <span class="text-sm font-bold text-slate-800">Total Pembayaran Sekarang:</span>
            <span class="text-xl sm:text-2xl font-black font-mono text-teal-700" data-test="grand-total-display">
              {{ formatCurrency(totals.totalBayar) }}
            </span>
          </div>

          <div class="border-t border-slate-100 pt-2 flex items-center justify-between text-slate-600">
            <span class="text-slate-500">Sisa Tagihan Tertunda:</span>
            <span class="font-mono font-semibold" :class="totals.totalSisaSetelah > 0 ? 'text-amber-700' : 'text-emerald-700'">
              {{ formatCurrency(totals.totalSisaSetelah) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Sticky Bottom Action Bar -->
    <div
      class="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-3.5 shadow-lg flex items-center justify-between"
    >
      <!-- Left: Cancel Button & Unsaved Status -->
      <div class="flex items-center gap-3">
        <AppButton
          variant="outline"
          size="sm"
          class="text-slate-600 hover:bg-slate-100"
          :disabled="isSubmitting"
          data-test="btn-cancel"
          @click="handleCancel"
        >
          Batalkan
        </AppButton>
        <span v-if="rows.length > 0" class="text-xs text-slate-500 hidden sm:inline">
          • <strong>{{ rows.length }}</strong> invoice dipilih
        </span>
        <span v-if="isDirty" class="text-xs text-amber-600 font-medium hidden md:inline">
          • Perubahan belum disimpan
        </span>
      </div>

      <!-- Right: Live KPIs + Total Indicator + Submit Buttons -->
      <div class="flex items-center gap-3 sm:gap-4">
        <!-- Total Currency Badge -->
        <div class="flex items-baseline gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
          <span class="text-xs text-slate-500 font-medium">Total:</span>
          <span class="text-sm sm:text-base font-bold font-mono text-teal-700" data-test="sticky-total">
            {{ formatCurrency(totals.totalBayar) }}
          </span>
        </div>

        <!-- Quick Pay All Full -->
        <AppButton
          v-if="rows.length > 0"
          variant="outline"
          size="md"
          :disabled="isSubmitting"
          class="hidden md:inline-flex items-center gap-1.5"
          @click="handleBayarPenuhSemua"
        >
          <CheckCircle2 class="w-4 h-4 text-emerald-600" />
          <span>Bayar Penuh Semua</span>
        </AppButton>

        <!-- Save Payment (Primary Submit) -->
        <AppButton
          variant="primary"
          size="md"
          :is-loading="isSubmitting"
          :disabled="isSubmitting || totals.totalBayar <= 0 || totals.hasErrors || !form.customerId"
          data-test="btn-submit-payment"
          class="bg-teal-600 hover:bg-teal-700 text-white font-medium px-6 shadow-sm flex items-center gap-2"
          @click="handleSubmit"
        >
          <Save class="w-4 h-4" />
          <span>Simpan Pembayaran</span>
        </AppButton>
      </div>
    </div>

    <!-- Invoice Multi-Select Picker Modal -->
    <InvoicePicker
      :is-open="isPickerOpen"
      :customer-id="form.customerId"
      :excluded-invoice-ids="excludedInvoiceIds"
      :multiple="true"
      @select="handleSelectInvoiceFromPicker"
      @add-multiple="handleAddMultipleInvoicesFromPicker"
      @close="isPickerOpen = false"
    />

    <!-- Confirm Unsaved Changes Dialog -->
    <AppConfirmDialog
      v-model:is-open="isLeaveConfirmOpen"
      title="Tinggalkan Halaman?"
      message="Anda memiliki perubahan alokasi pembayaran invoice yang belum disimpan. Perubahan akan hilang jika Anda meninggalkan halaman ini."
      confirm-text="Tinggalkan Halaman"
      cancel-text="Tetap di Sini"
      variant="warning"
      @confirm="confirmLeave"
      @cancel="cancelLeave"
    />

    <!-- Confirm Customer Change Dialog -->
    <AppConfirmDialog
      v-model:is-open="isCustomerChangeConfirmOpen"
      title="Ganti Customer Mitra?"
      message="Setiap transaksi kas/bank hanya dapat mencakup invoice dari satu customer yang sama. Mengganti customer akan mengosongkan seluruh daftar tagihan invoice yang sudah dipilih."
      confirm-text="Ya, Ganti Customer"
      cancel-text="Batalkan"
      variant="warning"
      @confirm="confirmCustomerChange"
      @cancel="cancelCustomerChange"
    />
  </div>
</template>
