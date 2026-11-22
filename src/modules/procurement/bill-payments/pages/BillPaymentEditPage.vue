<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import { useBillPaymentForm } from '../composables/useBillPaymentForm'
import { billPaymentService } from '../services/bill-payment.service'
import { bankService } from '@/modules/settings/banks/services/bank.service'
import { useToast } from '@/shared/composables/useToast'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import {
  Building2,
  FileText,
  CreditCard,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  CheckSquare,
  Square
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const paymentId = computed(() => Number(route.params.id))
const isLoading = ref(true)

const {
  form,
  eligiblePbs,
  isLoadingEligible,
  summary,
  errors,
  isSubmitting,
  isDirty,
  loadEligiblePbs,
  togglePbSelection,
  setPbAllocation,
  fillRemainingForPb,
  syncMethodsWithAllocations,
  getCalculatedAllocations,
  addPaymentMethod,
  removePaymentMethod,
  validate
} = useBillPaymentForm()

const supplierName = ref('')
const bankOptions = ref<Array<{ value: number; label: string }>>([])
const isLeaveConfirmOpen = ref(false)
const pendingNavigation = ref<string | null>(null)
const pbSearch = ref('')

const filteredEligiblePbs = computed(() => {
  if (!pbSearch.value.trim()) return eligiblePbs.value
  const q = pbSearch.value.toLowerCase()
  return eligiblePbs.value.filter(
    pb =>
      pb.kode.toLowerCase().includes(q) ||
      (pb.no_po && pb.no_po.toLowerCase().includes(q))
  )
})

onMounted(async () => {
  isLoading.value = true
  try {
    const banks = bankService.getRawItems()
    bankOptions.value = banks.map(b => ({ value: b.id, label: `${b.bank} (${b.rekening})` }))

    const res = await billPaymentService.getById(paymentId.value)
    form.id = res.header.id
    form.kode = res.header.kode
    form.no_tagihan = res.header.no_tagihan
    form.tanggal = res.header.tanggal
    form.jatuh_tempo = res.header.jatuh_tempo
    form.penagih = res.header.penagih
    form.suplier_id = res.header.suplier_id
    form.keterangan = res.header.keterangan
    form.status = res.header.status
    form.selected_pb_ids = [...res.header.selected_pb_ids]
    form.payment_methods = res.header.payment_methods.map(m => ({ ...m }))
    supplierName.value = res.header.nama_suplier

    if (form.suplier_id) {
      await loadEligiblePbs(form.suplier_id, paymentId.value)
    }
  } catch (err: unknown) {
    toast.error((err as Error).message || 'Gagal memuat data pembayaran.')
    router.push('/procurement/bill-payments')
  } finally {
    isLoading.value = false
    isDirty.value = false
  }
})

function selectAllPbs() {
  isDirty.value = true
  eligiblePbs.value.forEach(pb => {
    if (!form.selected_pb_ids.includes(pb.id)) {
      form.selected_pb_ids.push(pb.id)
      pb.isSelected = true
    }
    pb.nominal_alokasi = pb.sisa_tagihan
    pb.sisa_setelah_bayar = 0
  })
  syncMethodsWithAllocations()
}

function clearAllPbSelections() {
  isDirty.value = true
  form.selected_pb_ids = []
  eligiblePbs.value.forEach(pb => {
    pb.isSelected = false
    pb.nominal_alokasi = 0
    pb.sisa_setelah_bayar = pb.sisa_tagihan
  })
  syncMethodsWithAllocations()
}

async function handleSave() {
  if (!validate()) {
    toast.error('Mohon periksa kembali isian form pembayaran.')
    return
  }

  isSubmitting.value = true
  try {
    const allocations = getCalculatedAllocations()
    await billPaymentService.update(paymentId.value, {
      no_tagihan: form.no_tagihan,
      tanggal: form.tanggal,
      jatuh_tempo: form.jatuh_tempo || undefined,
      penagih: form.penagih || undefined,
      keterangan: form.keterangan || undefined,
      pb_ids: form.selected_pb_ids,
      allocations,
      payment_methods: form.payment_methods.map(m => ({
        metode_pembayaran: m.metode_pembayaran,
        bank_id: m.bank_id || null,
        jumlah: Number(m.jumlah) || 0,
        keterangan: m.keterangan || undefined
      }))
    })

    toast.success(`Pembayaran Tagihan ${form.kode} berhasil diperbarui.`)
    isDirty.value = false
    router.push('/procurement/bill-payments')
  } catch (err: unknown) {
    toast.error((err as Error).message || 'Gagal memperbarui pembayaran tagihan.')
  } finally {
    isSubmitting.value = false
  }
}

function handleCancel() {
  if (isDirty.value) {
    pendingNavigation.value = '/procurement/bill-payments'
    isLeaveConfirmOpen.value = true
  } else {
    router.push('/procurement/bill-payments')
  }
}

function confirmLeave() {
  isDirty.value = false
  isLeaveConfirmOpen.value = false
  if (pendingNavigation.value) {
    router.push(pendingNavigation.value)
  }
}

onBeforeRouteLeave((to, _from, next) => {
  if (isDirty.value) {
    pendingNavigation.value = to.fullPath
    isLeaveConfirmOpen.value = true
    next(false)
  } else {
    next()
  }
})
</script>

<template>
  <div class="space-y-6 pb-28">
    <!-- Page Header -->
    <AppPageHeader
      :title="`Edit Pembayaran: ${form.kode}`"
      description="Perbarui informasi faktur, dokumen penerimaan barang, atau nominal alokasi pembayaran."
      :breadcrumbs="[
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Pengadaan', to: '/procurement/purchase-orders' },
        { label: 'Pembayaran Tagihan', to: '/procurement/bill-payments' },
        { label: 'Edit Pembayaran' }
      ]"
    />

    <div v-if="isLoading" class="p-12 text-center text-slate-400 text-xs">
      Memuat data pembayaran...
    </div>

    <template v-else>
      <!-- Overpayment Error Alert Banner -->
      <div
        v-if="errors.overpayment"
        class="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-lg flex items-center gap-3 text-sm shadow-sm"
      >
        <AlertCircle class="w-5 h-5 text-rose-600 flex-shrink-0" />
        <div>
          <span class="font-semibold">Kesalahan Alokasi Nominal:</span>
          {{ errors.overpayment }}
        </div>
      </div>

      <!-- Section A: Header Form -->
      <div class="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4">
        <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Building2 class="w-5 h-5 text-teal-700" />
          <h2 class="text-sm font-semibold text-slate-800 uppercase tracking-wider">
            Informasi Pembayaran & Tagihan
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- Kode PT -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Kode Pembayaran</label>
            <input
              :value="form.kode"
              type="text"
              disabled
              class="w-full px-3 py-2 text-xs bg-slate-100 text-slate-600 border border-slate-300 rounded font-mono font-medium cursor-not-allowed"
            />
          </div>

          <!-- Supplier (Read-only on edit) -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Supplier</label>
            <input
              :value="supplierName"
              type="text"
              disabled
              class="w-full px-3 py-2 text-xs bg-slate-100 text-slate-600 border border-slate-300 rounded font-medium cursor-not-allowed"
            />
          </div>

          <!-- No Tagihan -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              No. Tagihan / Invoice Supplier <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="form.no_tagihan"
              type="text"
              class="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none"
              :class="{ 'border-rose-400 bg-rose-50/50': errors.no_tagihan }"
              @input="isDirty = true"
            />
            <span v-if="errors.no_tagihan" class="text-[11px] text-rose-600 mt-0.5 block">
              {{ errors.no_tagihan }}
            </span>
          </div>

          <!-- Tanggal Bayar -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Tanggal Pembayaran <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="form.tanggal"
              type="date"
              class="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none"
              :class="{ 'border-rose-400 bg-rose-50/50': errors.tanggal }"
              @input="isDirty = true"
            />
            <span v-if="errors.tanggal" class="text-[11px] text-rose-600 mt-0.5 block">
              {{ errors.tanggal }}
            </span>
          </div>

          <!-- Jatuh Tempo -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1"
              >Tanggal Jatuh Tempo</label
            >
            <input
              v-model="form.jatuh_tempo"
              type="date"
              class="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none"
              @input="isDirty = true"
            />
          </div>

          <!-- Penagih -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1"
              >Nama Penagih / Kolektor</label
            >
            <input
              v-model="form.penagih"
              type="text"
              class="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none"
              placeholder="Nama kolektor atau staf pembawa invoice"
              @input="isDirty = true"
            />
          </div>

          <!-- Keterangan -->
          <div class="lg:col-span-3">
            <label class="block text-xs font-semibold text-slate-700 mb-1"
              >Keterangan / Catatan</label
            >
            <input
              v-model="form.keterangan"
              type="text"
              class="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none"
              placeholder="Catatan pembayaran atau informasi pelunasan"
              @input="isDirty = true"
            />
          </div>
        </div>
      </div>

      <!-- Section B: Dokumen PB yang Dibayar -->
      <div class="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2">
            <FileText class="w-5 h-5 text-teal-700" />
            <div>
              <h2 class="text-sm font-semibold text-slate-800 uppercase tracking-wider">
                Dokumen Penerimaan Barang (PB) Terkait
              </h2>
              <div class="text-[11px] text-slate-500 mt-0.5">
                Pilih dokumen PB dan tentukan alokasi nominal pembayaran per dokumen.
              </div>
            </div>
          </div>

          <!-- Batch actions & search -->
          <div v-if="eligiblePbs.length > 0" class="flex flex-wrap items-center gap-2">
            <div class="relative">
              <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="pbSearch"
                type="text"
                placeholder="Cari Kode PB / No PO..."
                class="pl-8 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-teal-500 focus:bg-white focus:outline-none w-48"
              />
            </div>

            <button
              type="button"
              class="px-2.5 py-1 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded transition-colors flex items-center gap-1"
              @click="selectAllPbs"
            >
              <CheckSquare class="w-3.5 h-3.5" />
              <span>Pilih Semua</span>
            </button>

            <button
              v-if="form.selected_pb_ids.length > 0"
              type="button"
              class="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition-colors flex items-center gap-1"
              @click="clearAllPbSelections"
            >
              <Square class="w-3.5 h-3.5" />
              <span>Kosongkan</span>
            </button>

            <span class="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-semibold">
              {{ form.selected_pb_ids.length }} Terpilih
            </span>
          </div>
        </div>

        <div v-if="isLoadingEligible" class="py-8 text-center text-slate-400 text-xs">
          Memuat dokumen Penerimaan Barang...
        </div>

        <div v-else-if="eligiblePbs.length === 0" class="py-8 text-center text-slate-500 text-xs">
          Tidak ada dokumen Penerimaan Barang yang terkait dengan pembayaran ini.
        </div>

        <div v-else class="overflow-x-auto border border-slate-200 rounded-lg">
          <table class="w-full text-xs text-left">
            <thead class="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th class="px-3 py-2.5 w-10 text-center">Pilih</th>
                <th class="px-3 py-2.5">Kode PB</th>
                <th class="px-3 py-2.5">No. PO</th>
                <th class="px-3 py-2.5">Tanggal</th>
                <th class="px-3 py-2.5 text-right">Nilai PB</th>
                <th class="px-3 py-2.5 text-right">Sudah Dibayar</th>
                <th class="px-3 py-2.5 text-right">Sisa Tagihan</th>
                <th class="px-3 py-2.5 text-right min-w-[200px]">Bayar Sekarang</th>
                <th class="px-3 py-2.5 text-right">Sisa Setelah Bayar</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              <tr
                v-for="pb in filteredEligiblePbs"
                :key="pb.id"
                class="hover:bg-slate-50/80 transition-colors"
                :class="{ 'bg-teal-50/40': form.selected_pb_ids.includes(pb.id) }"
                @click="togglePbSelection(pb.id)"
              >
                <!-- Checkbox -->
                <td class="px-3 py-2 text-center" @click.stop>
                  <input
                    type="checkbox"
                    :checked="form.selected_pb_ids.includes(pb.id)"
                    class="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                    @change="togglePbSelection(pb.id)"
                  />
                </td>

                <!-- Kode PB -->
                <td class="px-3 py-2 font-mono font-medium text-teal-800">{{ pb.kode }}</td>

                <!-- No. PO -->
                <td class="px-3 py-2 font-mono text-slate-600">
                  {{ pb.no_po || pb.po_kode || '-' }}
                </td>

                <!-- Tanggal -->
                <td class="px-3 py-2 whitespace-nowrap">{{ formatDate(pb.tanggal) }}</td>

                <!-- Nilai PB -->
                <td class="px-3 py-2 text-right font-mono">{{ formatCurrency(pb.total_pb) }}</td>

                <!-- Sudah Dibayar -->
                <td class="px-3 py-2 text-right font-mono text-slate-500">
                  {{ formatCurrency(pb.sudah_dibayar) }}
                </td>

                <!-- Sisa Tagihan -->
                <td class="px-3 py-2 text-right font-mono font-semibold text-rose-700">
                  {{ formatCurrency(pb.sisa_tagihan) }}
                </td>

                <!-- Bayar Sekarang (Input alokasi) -->
                <td class="px-3 py-2 text-right" @click.stop>
                  <div class="flex items-center gap-1 justify-end">
                    <input
                      :value="pb.nominal_alokasi"
                      type="number"
                      min="0"
                      :max="pb.sisa_tagihan"
                      step="1000"
                      class="w-32 px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono font-semibold text-right focus:ring-1 focus:ring-teal-500 focus:outline-none"
                      :class="{ 'border-rose-400 bg-rose-50/50': errors['pb_' + pb.id + '_alokasi'] }"
                      @input="e => setPbAllocation(pb.id, Number((e.target as HTMLInputElement).value))"
                    />
                    <button
                      type="button"
                      class="px-1.5 py-1 text-[10px] font-semibold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-300 rounded transition-colors whitespace-nowrap"
                      title="Isi sesuai sisa tagihan"
                      @click="fillRemainingForPb(pb.id)"
                    >
                      Lunas
                    </button>
                  </div>
                  <span
                    v-if="errors['pb_' + pb.id + '_alokasi']"
                    class="text-[10px] text-rose-600 block mt-0.5 text-right"
                  >
                    {{ errors['pb_' + pb.id + '_alokasi'] }}
                  </span>
                </td>

                <!-- Sisa Setelah Bayar -->
                <td class="px-3 py-2 text-right font-mono">
                  <span
                    :class="
                      (pb.sisa_setelah_bayar ?? Math.max(0, pb.sisa_tagihan - (pb.nominal_alokasi || 0))) <= 0
                        ? 'text-emerald-700 font-semibold'
                        : 'text-slate-700'
                    "
                  >
                    {{
                      formatCurrency(
                        pb.sisa_setelah_bayar ?? Math.max(0, pb.sisa_tagihan - (pb.nominal_alokasi || 0))
                      )
                    }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <span v-if="errors.selected_pb_ids" class="text-[11px] text-rose-600 mt-1 block">
          {{ errors.selected_pb_ids }}
        </span>
      </div>

      <!-- Section C: Metode & Rincian Pembayaran -->
      <div class="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2">
            <CreditCard class="w-5 h-5 text-teal-700" />
            <h2 class="text-sm font-semibold text-slate-800 uppercase tracking-wider">
              Rincian & Metode Pembayaran
            </h2>
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded transition-colors"
            @click="addPaymentMethod"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>Tambah Metode</span>
          </button>
        </div>

        <!-- Mismatch Warning Banner -->
        <div
          v-if="summary.is_mismatched"
          class="bg-amber-50 border border-amber-300 text-amber-900 p-3.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm"
        >
          <div class="flex items-center gap-2.5">
            <AlertCircle class="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div>
              <span class="font-semibold">Perbedaan Nominal:</span>
              Total metode pembayaran ({{ formatCurrency(summary.total_bayar) }}) belum sesuai dengan total alokasi PB ({{ formatCurrency(summary.total_alokasi_pb) }}).
              Selisih: <span class="font-mono font-bold">{{ formatCurrency(Math.abs(summary.selisih_metode_alokasi)) }}</span>.
            </div>
          </div>
          <button
            type="button"
            class="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded text-xs transition-colors whitespace-nowrap self-end sm:self-auto"
            @click="syncMethodsWithAllocations"
          >
            Samakan Nominal
          </button>
        </div>

        <div class="space-y-3">
          <div
            v-for="(method, idx) in form.payment_methods"
            :key="idx"
            class="p-3.5 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-center"
          >
            <div class="md:col-span-3">
              <label class="block text-[11px] font-semibold text-slate-600 mb-1">Metode</label>
              <select
                v-model="method.metode_pembayaran"
                class="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none"
                @change="isDirty = true"
              >
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="Cash">Cash (Tunai)</option>
                <option value="Giro">Giro / Cek</option>
              </select>
            </div>

            <div class="md:col-span-4">
              <label class="block text-[11px] font-semibold text-slate-600 mb-1"
                >Rekening Bank</label
              >
              <select
                v-model="method.bank_id"
                :disabled="method.metode_pembayaran === 'Cash'"
                class="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none disabled:bg-slate-100"
                @change="isDirty = true"
              >
                <option :value="null">Pilih Bank...</option>
                <option v-for="b in bankOptions" :key="b.value" :value="b.value">
                  {{ b.label }}
                </option>
              </select>
            </div>

            <div class="md:col-span-3">
              <label class="block text-[11px] font-semibold text-slate-600 mb-1"
                >Nominal (Rp)</label
              >
              <input
                v-model.number="method.jumlah"
                type="number"
                min="0"
                step="1000"
                class="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono font-semibold text-right focus:ring-1 focus:ring-teal-500 focus:outline-none"
                @input="isDirty = true"
              />
            </div>

            <div class="md:col-span-2 flex items-center gap-2">
              <div class="flex-1">
                <label class="block text-[11px] font-semibold text-slate-600 mb-1">Catatan</label>
                <input
                  v-model="method.keterangan"
                  type="text"
                  placeholder="No ref / giro"
                  class="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  @input="isDirty = true"
                />
              </div>
              <button
                v-if="form.payment_methods.length > 1"
                type="button"
                class="mt-4 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                title="Hapus baris metode ini"
                @click="removePaymentMethod(idx)"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <span v-if="errors.payment_methods" class="text-[11px] text-rose-600 block">
          {{ errors.payment_methods }}
        </span>
        <span v-if="errors.mismatch" class="text-[11px] text-amber-700 font-medium block">
          {{ errors.mismatch }}
        </span>
      </div>

      <!-- Section D: Live Summary Card -->
      <div class="bg-slate-900 text-white rounded-lg p-5 shadow-sm">
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <div class="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
              Total Tagihan
            </div>
            <div class="text-sm font-semibold font-mono mt-1 text-slate-100">
              {{ formatCurrency(summary.total_tagihan) }}
            </div>
          </div>

          <div>
            <div class="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
              Sdh Dibayar
            </div>
            <div class="text-sm font-semibold font-mono mt-1 text-slate-300">
              {{ formatCurrency(summary.total_sudah_dibayar) }}
            </div>
          </div>

          <div>
            <div class="text-[11px] text-amber-400 font-medium uppercase tracking-wider">
              Sisa Tagihan
            </div>
            <div class="text-sm font-semibold font-mono mt-1 text-amber-300">
              {{ formatCurrency(summary.sisa_tagihan) }}
            </div>
          </div>

          <div>
            <div class="text-[11px] text-teal-300 font-medium uppercase tracking-wider">
              Alokasi Dokumen
            </div>
            <div class="text-sm font-semibold font-mono mt-1 text-teal-300">
              {{ formatCurrency(summary.total_alokasi_pb) }}
            </div>
          </div>

          <div>
            <div class="text-[11px] text-emerald-400 font-medium uppercase tracking-wider">
              Total Bayar Ini
            </div>
            <div class="text-base font-bold font-mono mt-1 text-emerald-400">
              {{ formatCurrency(summary.total_bayar) }}
            </div>
          </div>

          <div class="flex items-center lg:justify-end">
            <div
              v-if="summary.is_lunas"
              class="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-semibold"
            >
              <CheckCircle2 class="w-4 h-4" />
              <span>Lunas</span>
            </div>
            <div
              v-else-if="summary.total_bayar > 0"
              class="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-500/20 text-teal-300 border border-teal-400/30 rounded-full text-xs font-semibold"
            >
              <Clock class="w-4 h-4" />
              <span>Parsial</span>
            </div>
            <div
              v-else
              class="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded-full text-xs font-semibold"
            >
              <Clock class="w-4 h-4" />
              <span>Belum Lunas</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Section E: Fixed Action Footer -->
      <div
        class="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-3 px-6 shadow-lg z-30 flex items-center justify-between"
      >
        <div class="flex items-center gap-4">
          <AppButton variant="outline" size="md" @click="handleCancel"> Batalkan </AppButton>

          <div class="flex items-center gap-2 pl-4 border-l border-slate-200 text-xs">
            <span class="text-slate-500 font-medium">Nominal Pembayaran:</span>
            <span class="text-sm font-bold font-mono text-emerald-700" data-test="footer-total">
              {{ formatCurrency(summary.total_bayar) }}
            </span>
            <span
              v-if="summary.is_lunas"
              class="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold"
            >
              Lunas
            </span>
            <span
              v-else-if="summary.total_bayar > 0"
              class="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-semibold"
            >
              Parsial
            </span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <AppButton
            variant="primary"
            size="md"
            :loading="isSubmitting"
            data-test="save-button"
            @click="handleSave"
          >
            <Save class="w-4 h-4 mr-1.5" />
            <span>Perbarui Pembayaran</span>
          </AppButton>
        </div>
      </div>

      <!-- Unsaved Changes Confirm Dialog -->
      <AppConfirmDialog
        v-model="isLeaveConfirmOpen"
        variant="warning"
        title="Tinggalkan Halaman?"
        message="Ada perubahan data yang belum disimpan. Yakin ingin meninggalkan halaman ini?"
        confirm-text="Ya, Tinggalkan"
        cancel-text="Lanjut Mengedit"
        @confirm="confirmLeave"
      />
    </template>
  </div>
</template>
