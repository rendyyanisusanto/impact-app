<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft,
  Save,
  Send,
  Plus,
  Trash2,
  FileText,
  Search
} from 'lucide-vue-next'
import { otherIncomeService } from '../services/other-income.service'
import type { SelectableAccount } from '../types/other-income.types'
import AccountPickerModal from '../components/AccountPickerModal.vue'
import { formatCurrency } from '@/shared/utils/formatters'
import { useToast } from '@/shared/composables/useToast'
import AppButton from '@/shared/components/ui/AppButton.vue'

const router = useRouter()
const toast = useToast()

const isSubmitting = ref(false)

// Form Header
const form = reactive({
  tanggal: new Date().toISOString().split('T')[0],
  keterangan: '',
  received_from: '',
  reference_number: '',
  payment_method: 'Transfer Bank',
  akun_kas_id: null as number | null,
  akun_kas_name: '',
  akun_kas_code: '',
  akun_sumber_id: null as number | null,
  akun_sumber_name: '',
  akun_sumber_code: ''
})

// Detail Items
interface FormItemRow {
  id: string
  keterangan: string
  jumlah: number | null
  akun_lawan_id: number | null
  akun_lawan_name: string
  akun_lawan_code: string
}

let rowIdCounter = 1
const items = ref<FormItemRow[]>([
  {
    id: `row-${Date.now()}-${rowIdCounter++}`,
    keterangan: '',
    jumlah: null,
    akun_lawan_id: null,
    akun_lawan_name: '',
    akun_lawan_code: ''
  }
])

// Modal State
const showAccountModal = ref(false)
const accountModalType = ref<'cash' | 'income'>('cash')
const activeRowIndex = ref<number | null>(null)

function openAccountPicker(type: 'cash' | 'income', rowIndex?: number) {
  accountModalType.value = type
  activeRowIndex.value = rowIndex !== undefined ? rowIndex : null
  showAccountModal.value = true
}

function handleAccountSelected(acc: SelectableAccount) {
  if (activeRowIndex.value !== null) {
    // Selected for a specific line item
    const row = items.value[activeRowIndex.value]
    if (row) {
      row.akun_lawan_id = acc.id
      row.akun_lawan_name = acc.nama
      row.akun_lawan_code = acc.no_ref
    }
  } else {
    // Selected for header
    if (accountModalType.value === 'cash') {
      form.akun_kas_id = acc.id
      form.akun_kas_name = acc.nama
      form.akun_kas_code = acc.no_ref
    } else {
      form.akun_sumber_id = acc.id
      form.akun_sumber_name = acc.nama
      form.akun_sumber_code = acc.no_ref
    }
  }
}

function addRow() {
  items.value.push({
    id: `row-${Date.now()}-${rowIdCounter++}`,
    keterangan: '',
    jumlah: null,
    akun_lawan_id: form.akun_sumber_id,
    akun_lawan_name: form.akun_sumber_name,
    akun_lawan_code: form.akun_sumber_code
  })
}

function removeRow(idx: number) {
  if (items.value.length <= 1) {
    toast.error('Minimal harus terdapat satu baris rincian pemasukan.')
    return
  }
  items.value.splice(idx, 1)
}

// Totals
const totalAmount = computed(() => {
  return items.value.reduce((sum, it) => sum + (Number(it.jumlah) || 0), 0)
})

async function handleSubmit(shouldPost: boolean = false) {
  if (!form.tanggal) {
    toast.error('Tanggal pemasukan wajib diisi.')
    return
  }
  if (!form.keterangan || !form.keterangan.trim()) {
    toast.error('Keterangan / keperluan pemasukan wajib diisi.')
    return
  }
  if (!form.akun_kas_id) {
    toast.error('Rekening kas / bank penerima wajib dipilih.')
    return
  }
  if (items.value.length === 0) {
    toast.error('Minimal harus terdapat satu rincian pemasukan.')
    return
  }

  for (let i = 0; i < items.value.length; i++) {
    const it = items.value[i]
    if (!it) continue
    if (!it.keterangan.trim()) {
      toast.error(`Keterangan pada baris #${i + 1} wajib diisi.`)
      return
    }
    if (!it.jumlah || it.jumlah <= 0) {
      toast.error(`Nominal pada baris #${i + 1} harus lebih besar dari 0.`)
      return
    }
    if (!it.akun_lawan_id && !form.akun_sumber_id) {
      toast.error(`Pilih Akun Sumber pada baris #${i + 1} atau tentukan Akun Sumber Utama.`)
      return
    }
  }

  isSubmitting.value = true
  try {
    const payload = {
      tanggal: form.tanggal,
      keterangan: form.keterangan.trim(),
      received_from: form.received_from.trim() || null,
      reference_number: form.reference_number.trim() || null,
      payment_method: form.payment_method,
      akun_kas: form.akun_kas_id,
      akun_sumber: form.akun_sumber_id || null,
      items: items.value.map(it => ({
        keterangan: it.keterangan.trim(),
        jumlah: Number(it.jumlah),
        akun_lawan_id: it.akun_lawan_id || form.akun_sumber_id || null
      }))
    }

    const created = await otherIncomeService.createDraft(payload)

    if (shouldPost) {
      const posted = await otherIncomeService.postIncome(created.id)
      toast.success(`Pemasukan ${posted.trans_code} berhasil diposting. Jurnal: ${posted.journal_number}`)
    } else {
      toast.success(`Draft pemasukan ${created.trans_code} berhasil disimpan.`)
    }

    router.push('/accounting/other-income')
  } catch (err: any) {
    toast.error(err.message || 'Gagal menyimpan transaksi pemasukan')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6 pb-24">
    <!-- Top Bar -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          @click="router.back()"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-xl font-bold tracking-tight text-slate-800 dark:text-white">
            Tambah Pemasukan Kas / Bank
          </h1>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Buat voucher penerimaan kas/bank baru dan catat rincian pos pendapatan operasional
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <span class="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
          Status: DRAFT
        </span>
      </div>
    </div>

    <!-- Section A: Informasi Transaksi & Penerimaan Kas/Bank -->
    <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-4">
      <h2 class="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-2">
        <FileText class="w-4 h-4 text-emerald-600" />
        Bagian A — Informasi Transaksi &amp; Kas/Bank Penerima
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <!-- Nomor Pemasukan (Auto) -->
        <div>
          <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Nomor Pemasukan
          </label>
          <input
            type="text"
            disabled
            value="[Otomatis: PM/YYYY/MM/XXXX]"
            class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 font-mono cursor-not-allowed"
          />
          <p class="text-[10px] text-slate-400 mt-1">Diberikan secara unik saat disimpan</p>
        </div>

        <!-- Tanggal -->
        <div>
          <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Tanggal Penerimaan <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="form.tanggal"
            type="date"
            class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
          />
        </div>

        <!-- Diterima Dari -->
        <div>
          <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Diterima Dari (Penyetor / Pihak Ketiga)
          </label>
          <input
            v-model="form.received_from"
            type="text"
            placeholder="Contoh: PT Mitra Sejahtera / Bpk. Hendra"
            class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
          />
        </div>

        <!-- Metode Pembayaran -->
        <div>
          <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Metode Pembayaran
          </label>
          <select
            v-model="form.payment_method"
            class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
          >
            <option value="Transfer Bank">Transfer Bank</option>
            <option value="Kas Tunai">Kas Tunai / Kasir</option>
            <option value="Cek / Giro">Cek / Giro</option>
            <option value="QRIS / Digital">QRIS / Digital</option>
            <option value="Lainnya">Lainnya</option>
          </select>
        </div>

        <!-- Akun Kas/Bank Penerima -->
        <div>
          <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Rekening Kas / Bank Penerima <span class="text-rose-500">*</span>
          </label>
          <div
            class="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-emerald-500 transition-colors"
            @click="openAccountPicker('cash')"
          >
            <div class="truncate">
              <span v-if="form.akun_kas_id" class="font-medium text-slate-800 dark:text-white">
                <span class="font-mono text-emerald-600 dark:text-emerald-400 font-bold mr-1">{{ form.akun_kas_code }}</span>
                {{ form.akun_kas_name }}
              </span>
              <span v-else class="text-slate-400">Pilih Rekening Kas/Bank...</span>
            </div>
            <Search class="w-4 h-4 text-slate-400 shrink-0 ml-2" />
          </div>
        </div>

        <!-- Akun Sumber Utama (Default Baris) -->
        <div>
          <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Akun Sumber / Pendapatan Utama
          </label>
          <div
            class="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-emerald-500 transition-colors"
            @click="openAccountPicker('income')"
          >
            <div class="truncate">
              <span v-if="form.akun_sumber_id" class="font-medium text-slate-800 dark:text-white">
                <span class="font-mono text-emerald-600 dark:text-emerald-400 font-bold mr-1">{{ form.akun_sumber_code }}</span>
                {{ form.akun_sumber_name }}
              </span>
              <span v-else class="text-slate-400">Pilih Akun Sumber (atau tentukan per baris)...</span>
            </div>
            <Search class="w-4 h-4 text-slate-400 shrink-0 ml-2" />
          </div>
        </div>

        <!-- Keterangan Umum -->
        <div class="md:col-span-2">
          <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Keterangan / Keperluan Penerimaan <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="form.keterangan"
            type="text"
            placeholder="Contoh: Penerimaan pendapatan jasa konsultasi, pendapatan bunga bank, sewa ruangan kantor..."
            class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
          />
        </div>

        <!-- Referensi Eksternal -->
        <div>
          <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Referensi Eksternal (No. Bukti Transfer / TRF)
          </label>
          <input
            v-model="form.reference_number"
            type="text"
            placeholder="Contoh: TRF-BCA-9921 / KWT-8812"
            class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
          />
        </div>
      </div>
    </div>

    <!-- Section B: Rincian Pemasukan Dana (Multi-baris Spreadsheet) -->
    <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-4">
      <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/50">
        <div>
          <h2 class="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Bagian B — Rincian Pos Penerimaan Dana
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dukung penerimaan multi-pos pada satu voucher kas/bank
          </p>
        </div>

        <AppButton
          variant="outline"
          size="sm"
          class="text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
          @click="addRow"
        >
          <Plus class="w-4 h-4 mr-1.5" />
          Tambah Baris
        </AppButton>
      </div>

      <!-- Spreadsheet Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
              <th class="py-2.5 px-3 w-12 text-center">No</th>
              <th class="py-2.5 px-3 min-w-[240px]">Keterangan Rincian <span class="text-rose-500">*</span></th>
              <th class="py-2.5 px-3 min-w-[200px]">Alokasi Akun Sumber / Pendapatan</th>
              <th class="py-2.5 px-3 text-right w-48">Nominal (Rp) <span class="text-rose-500">*</span></th>
              <th class="py-2.5 px-3 w-14 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60">
            <tr v-for="(item, idx) in items" :key="item.id" class="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
              <td class="py-2.5 px-3 text-center text-slate-400 font-mono">{{ idx + 1 }}</td>

              <!-- Keterangan -->
              <td class="py-2.5 px-3">
                <input
                  v-model="item.keterangan"
                  type="text"
                  placeholder="Deskripsi pos penerimaan..."
                  class="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:text-white text-xs"
                />
              </td>

              <!-- Akun Sumber Baris -->
              <td class="py-2.5 px-3">
                <div
                  class="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-emerald-500 transition-colors"
                  @click="openAccountPicker('income', idx)"
                >
                  <span v-if="item.akun_lawan_id" class="truncate font-medium text-slate-800 dark:text-white">
                    <span class="font-mono text-emerald-600 dark:text-emerald-400 font-bold mr-1">{{ item.akun_lawan_code }}</span>
                    {{ item.akun_lawan_name }}
                  </span>
                  <span v-else-if="form.akun_sumber_id" class="truncate text-slate-500">
                    {{ form.akun_sumber_code }} - {{ form.akun_sumber_name }} (Default)
                  </span>
                  <span v-else class="text-slate-400 italic">Pilih akun sumber...</span>
                  <Search class="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1.5" />
                </div>
              </td>

              <!-- Nominal -->
              <td class="py-2.5 px-3 text-right">
                <input
                  v-model.number="item.jumlah"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="0"
                  class="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:text-white text-xs text-right font-mono font-semibold"
                />
              </td>

              <!-- Delete -->
              <td class="py-2.5 px-3 text-center">
                <button
                  type="button"
                  class="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                  title="Hapus baris"
                  @click="removeRow(idx)"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="bg-slate-50/80 dark:bg-slate-800/80 border-t-2 border-slate-200 dark:border-slate-700 font-bold">
              <td colspan="3" class="py-3 px-4 text-right uppercase tracking-wider text-slate-600 dark:text-slate-400 text-xs">
                Total Pemasukan:
              </td>
              <td class="py-3 px-3 text-right font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">
                {{ formatCurrency(totalAmount) }}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- Sticky Bottom Action Bar -->
    <div
      class="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-6 py-3.5 shadow-lg flex flex-wrap items-center justify-between gap-4"
    >
      <!-- Left side: Batal button + Total Summary Indicator -->
      <div class="flex items-center gap-4 flex-wrap">
        <AppButton
          variant="outline"
          size="sm"
          class="text-slate-600 bg-white border-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
          :disabled="isSubmitting"
          @click="router.back()"
        >
          Batalkan
        </AppButton>

        <!-- Summary badge -->
        <div class="flex items-center gap-3 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
          <div class="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <span>Total Item:</span>
            <span class="font-bold text-slate-800 dark:text-white font-mono">{{ items.length }} baris</span>
          </div>

          <span class="text-slate-300 dark:text-slate-600">|</span>

          <div class="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <span>Kas/Bank Penerima:</span>
            <span class="font-bold text-slate-800 dark:text-white truncate max-w-[150px]">
              {{ form.akun_kas_name || '-' }}
            </span>
          </div>

          <span class="text-slate-300 dark:text-slate-600">|</span>

          <div class="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <span>Total Pemasukan:</span>
            <span class="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
              {{ formatCurrency(totalAmount) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Right side: Save buttons -->
      <div class="flex items-center gap-2.5">
        <AppButton
          variant="outline"
          size="sm"
          class="text-slate-700 border-slate-300 hover:bg-slate-100 dark:text-slate-300 dark:border-slate-700"
          :disabled="isSubmitting"
          @click="handleSubmit(false)"
        >
          <Save class="w-4 h-4 mr-1.5 text-amber-600" />
          Simpan sebagai Draft
        </AppButton>

        <AppButton
          variant="primary"
          size="sm"
          class="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          :loading="isSubmitting"
          @click="handleSubmit(true)"
        >
          <Send class="w-4 h-4 mr-1.5" />
          Simpan &amp; Posting
        </AppButton>
      </div>
    </div>

    <!-- Modal Account Picker -->
    <AccountPickerModal
      v-model="showAccountModal"
      :account-type="accountModalType"
      @select="handleAccountSelected"
    />
  </div>
</template>
