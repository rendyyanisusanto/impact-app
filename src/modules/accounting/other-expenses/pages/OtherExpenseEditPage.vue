<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ArrowLeft,
  Save,
  Send,
  Plus,
  Trash2,
  FileText,
  Search,
  Loader2
} from 'lucide-vue-next'
import { otherExpenseService } from '../services/other-expense.service'
import type { SelectableAccount, OtherExpenseHeader } from '../types/other-expense.types'
import AccountPickerModal from '../components/AccountPickerModal.vue'
import { formatCurrency } from '@/shared/utils/formatters'
import { useToast } from '@/shared/composables/useToast'
import AppButton from '@/shared/components/ui/AppButton.vue'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const expenseId = Number(route.params.id)
const isLoading = ref(true)
const isSubmitting = ref(false)
const expenseRecord = ref<OtherExpenseHeader | null>(null)

// Form Header
const form = reactive({
  trans_code: '',
  tanggal: '',
  keterangan: '',
  reference_number: '',
  payment_method: 'Transfer Bank',
  akun_kas_id: null as number | null,
  akun_kas_name: '',
  akun_kas_code: '',
  akun_beban_id: null as number | null,
  akun_beban_name: '',
  akun_beban_code: ''
})

// Detail Items
interface FormItemRow {
  id: string
  detail_id?: number
  keterangan: string
  jumlah: number | null
  akun_beban_id: number | null
  akun_beban_name: string
  akun_beban_code: string
}

let rowIdCounter = 1
const items = ref<FormItemRow[]>([])

// Modal State
const showAccountModal = ref(false)
const accountModalType = ref<'cash' | 'expense'>('cash')
const activeRowIndex = ref<number | null>(null)

function openAccountPicker(type: 'cash' | 'expense', rowIndex?: number) {
  accountModalType.value = type
  activeRowIndex.value = rowIndex !== undefined ? rowIndex : null
  showAccountModal.value = true
}

function handleAccountSelected(acc: SelectableAccount) {
  if (activeRowIndex.value !== null) {
    const row = items.value[activeRowIndex.value]
    if (row) {
      row.akun_beban_id = acc.id
      row.akun_beban_name = acc.nama
      row.akun_beban_code = acc.no_ref
    }
  } else {
    if (accountModalType.value === 'cash') {
      form.akun_kas_id = acc.id
      form.akun_kas_name = acc.nama
      form.akun_kas_code = acc.no_ref
    } else {
      form.akun_beban_id = acc.id
      form.akun_beban_name = acc.nama
      form.akun_beban_code = acc.no_ref
    }
  }
}

function addRow() {
  items.value.push({
    id: `row-${Date.now()}-${rowIdCounter++}`,
    keterangan: '',
    jumlah: null,
    akun_beban_id: form.akun_beban_id,
    akun_beban_name: form.akun_beban_name,
    akun_beban_code: form.akun_beban_code
  })
}

function removeRow(idx: number) {
  if (items.value.length <= 1) {
    toast.warning('Minimal harus terdapat satu baris rincian pengeluaran.')
    return
  }
  items.value.splice(idx, 1)
}

const totalAmount = computed(() => {
  return items.value.reduce((sum, it) => sum + (Number(it.jumlah) || 0), 0)
})

async function fetchExpense() {
  isLoading.value = true
  try {
    const data = await otherExpenseService.getExpenseById(expenseId)
    if (!data) {
      toast.error('Dokumen pengeluaran tidak ditemukan.')
      router.push('/accounting/other-expenses')
      return
    }

    if (data.status !== 'DRAFT') {
      toast.warning(`Pengeluaran berstatus ${data.status} tidak dapat diedit langsung.`)
      router.replace(`/accounting/other-expenses/${expenseId}`)
      return
    }

    expenseRecord.value = data
    form.trans_code = data.trans_code
    form.tanggal = data.tanggal
    form.keterangan = data.keterangan
    form.reference_number = data.reference_number || ''
    form.payment_method = data.payment_method || 'Transfer Bank'
    form.akun_kas_id = data.akun_kas
    form.akun_kas_name = data.nama_akun_kas || ''
    form.akun_kas_code = data.kode_akun_kas || ''
    form.akun_beban_id = data.akun_beban
    form.akun_beban_name = data.nama_akun_beban || ''
    form.akun_beban_code = data.kode_akun_beban || ''

    if (data.items && data.items.length > 0) {
      items.value = data.items.map(it => ({
        id: `row-${it.id || rowIdCounter++}`,
        detail_id: it.id,
        keterangan: it.keterangan,
        jumlah: it.jumlah,
        akun_beban_id: it.akun_beban_id || data.akun_beban,
        akun_beban_name: it.nama_akun_beban || data.nama_akun_beban || '',
        akun_beban_code: it.kode_akun_beban || data.kode_akun_beban || ''
      }))
    } else {
      addRow()
    }
  } catch (err: any) {
    toast.error(err.message || 'Gagal memuat detail pengeluaran')
    router.push('/accounting/other-expenses')
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit(shouldPost: boolean = false) {
  if (!form.tanggal) {
    toast.error('Tanggal pengeluaran wajib diisi.')
    return
  }
  if (!form.keterangan.trim()) {
    toast.error('Keterangan / keperluan pengeluaran wajib diisi.')
    return
  }
  if (!form.akun_kas_id) {
    toast.error('Rekening sumber dana (Kas / Bank) wajib dipilih.')
    return
  }
  if (items.value.length === 0) {
    toast.error('Minimal harus terdapat satu rincian pengeluaran.')
    return
  }
  for (let i = 0; i < items.value.length; i++) {
    const it = items.value[i]
    if (!it.keterangan.trim()) {
      toast.error(`Keterangan pada baris #${i + 1} wajib diisi.`)
      return
    }
    if (!it.jumlah || it.jumlah <= 0) {
      toast.error(`Nominal pada baris #${i + 1} harus lebih besar dari 0.`)
      return
    }
  }

  isSubmitting.value = true
  try {
    const payload = {
      tanggal: form.tanggal,
      keterangan: form.keterangan.trim(),
      akun_kas: form.akun_kas_id,
      akun_beban: form.akun_beban_id || null,
      reference_number: form.reference_number.trim() || null,
      payment_method: form.payment_method,
      items: items.value.map(it => ({
        id: it.detail_id,
        keterangan: it.keterangan.trim(),
        jumlah: Number(it.jumlah),
        akun_beban_id: it.akun_beban_id || form.akun_beban_id || null
      }))
    }

    await otherExpenseService.updateDraft(expenseId, payload)

    if (shouldPost) {
      const posted = await otherExpenseService.postExpense(expenseId)
      toast.success(`Pengeluaran ${posted.trans_code} berhasil diposting. Jurnal: ${posted.journal_number}`)
    } else {
      toast.success(`Draft pengeluaran ${form.trans_code} berhasil diperbarui.`)
    }

    router.push(`/accounting/other-expenses/${expenseId}`)
  } catch (err: any) {
    toast.error(err.message || 'Gagal memperbarui transaksi pengeluaran')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchExpense()
})
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
            Edit Draft Pengeluaran: <span class="font-mono text-teal-600 dark:text-teal-400">{{ form.trans_code }}</span>
          </h1>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Perbarui data transaksi sebelum diposting ke ledger akuntansi
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <span class="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
          Status: DRAFT
        </span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="py-16 text-center text-slate-400">
      <Loader2 class="w-8 h-8 animate-spin mx-auto mb-2 text-teal-600" />
      <span class="text-xs">Memuat data pengeluaran...</span>
    </div>

    <template v-else>
      <!-- Section A: Informasi Transaksi -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-4">
        <h2 class="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-2">
          <FileText class="w-4 h-4 text-teal-600" />
          Bagian A — Informasi Transaksi &amp; Sumber Dana
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <!-- Nomor Pengeluaran -->
          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nomor Pengeluaran
            </label>
            <input
              type="text"
              disabled
              :value="form.trans_code"
              class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-mono font-bold cursor-not-allowed"
            />
          </div>

          <!-- Tanggal -->
          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tanggal Pengeluaran <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="form.tanggal"
              type="date"
              class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white"
            />
          </div>

          <!-- Metode Pembayaran -->
          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Metode Pembayaran
            </label>
            <select
              v-model="form.payment_method"
              class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white"
            >
              <option value="Transfer Bank">Transfer Bank</option>
              <option value="Tunai">Tunai / Kas Kecil</option>
              <option value="Giro / Cek">Giro / Cek</option>
              <option value="Kartu Debit">Kartu Debit</option>
            </select>
          </div>

          <!-- Keterangan -->
          <div class="md:col-span-2">
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Keperluan / Keterangan Umum <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="form.keterangan"
              type="text"
              class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white"
            />
          </div>

          <!-- Referensi Eksternal -->
          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Referensi Eksternal
            </label>
            <input
              v-model="form.reference_number"
              type="text"
              class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white"
            />
          </div>

          <!-- Sumber Dana -->
          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Akun Sumber Dana (Kas / Bank) <span class="text-rose-500">*</span>
            </label>
            <div
              class="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-teal-500 transition-colors"
              @click="openAccountPicker('cash')"
            >
              <div class="truncate">
                <span v-if="form.akun_kas_id" class="font-medium text-slate-800 dark:text-white">
                  <span class="font-mono text-teal-600 dark:text-teal-400 font-bold mr-1">{{ form.akun_kas_code }}</span>
                  {{ form.akun_kas_name }}
                </span>
                <span v-else class="text-slate-400">Pilih Rekening Kas/Bank...</span>
              </div>
              <Search class="w-4 h-4 text-slate-400 shrink-0 ml-2" />
            </div>
          </div>

          <!-- Akun Beban Utama -->
          <div class="md:col-span-2">
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Akun Beban Utama
            </label>
            <div
              class="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-teal-500 transition-colors"
              @click="openAccountPicker('expense')"
            >
              <div class="truncate">
                <span v-if="form.akun_beban_id" class="font-medium text-slate-800 dark:text-white">
                  <span class="font-mono text-teal-600 dark:text-teal-400 font-bold mr-1">{{ form.akun_beban_code }}</span>
                  {{ form.akun_beban_name }}
                </span>
                <span v-else class="text-slate-400">Pilih Akun Beban...</span>
              </div>
              <Search class="w-4 h-4 text-slate-400 shrink-0 ml-2" />
            </div>
          </div>
        </div>
      </div>

      <!-- Section B: Rincian Table -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-4">
        <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/50">
          <div>
            <h2 class="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Bagian B — Rincian Pengeluaran Biaya
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Edit dan sesuaikan baris rincian pengeluaran operasional
            </p>
          </div>

          <AppButton
            variant="outline"
            size="sm"
            class="text-teal-700 bg-teal-50 border-teal-200 hover:bg-teal-100 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800"
            @click="addRow"
          >
            <Plus class="w-4 h-4 mr-1.5" />
            Tambah Baris
          </AppButton>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
                <th class="py-2.5 px-3 w-12 text-center">No</th>
                <th class="py-2.5 px-3 min-w-[240px]">Keterangan Rincian <span class="text-rose-500">*</span></th>
                <th class="py-2.5 px-3 min-w-[200px]">Alokasi Akun Beban</th>
                <th class="py-2.5 px-3 text-right w-48">Nominal (Rp) <span class="text-rose-500">*</span></th>
                <th class="py-2.5 px-3 w-14 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60">
              <tr v-for="(item, idx) in items" :key="item.id" class="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                <td class="py-2.5 px-3 text-center text-slate-400 font-mono">{{ idx + 1 }}</td>
                <td class="py-2.5 px-3">
                  <input
                    v-model="item.keterangan"
                    type="text"
                    class="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 dark:text-white text-xs"
                  />
                </td>
                <td class="py-2.5 px-3">
                  <div
                    class="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-teal-500 transition-colors"
                    @click="openAccountPicker('expense', idx)"
                  >
                    <span v-if="item.akun_beban_id" class="truncate font-medium text-slate-800 dark:text-white">
                      <span class="font-mono text-teal-600 dark:text-teal-400 font-bold">{{ item.akun_beban_code }}</span>
                      {{ item.akun_beban_name }}
                    </span>
                    <span v-else-if="form.akun_beban_id" class="truncate text-slate-500">
                      {{ form.akun_beban_code }} - {{ form.akun_beban_name }} (Default)
                    </span>
                    <span v-else class="text-slate-400 italic">Pilih akun beban...</span>
                    <Search class="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1.5" />
                  </div>
                </td>
                <td class="py-2.5 px-3 text-right">
                  <input
                    v-model.number="item.jumlah"
                    type="number"
                    min="0"
                    step="1000"
                    class="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 dark:text-white text-xs text-right font-mono font-semibold"
                  />
                </td>
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
                  Total Pengeluaran:
                </td>
                <td class="py-3 px-3 text-right font-mono font-bold text-base text-teal-600 dark:text-teal-400">
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

          <div class="flex items-center gap-3 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <div class="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span>Total Item:</span>
              <span class="font-bold text-slate-800 dark:text-white font-mono">{{ items.length }} baris</span>
            </div>

            <span class="text-slate-300 dark:text-slate-600">|</span>

            <div class="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span>Sumber Dana:</span>
              <span class="font-bold text-slate-800 dark:text-white truncate max-w-[150px]">
                {{ form.akun_kas_name || '-' }}
              </span>
            </div>

            <span class="text-slate-300 dark:text-slate-600">|</span>

            <div class="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span>Total:</span>
              <span class="font-bold text-teal-600 dark:text-teal-400 font-mono text-sm">
                {{ formatCurrency(totalAmount) }}
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2.5">
          <AppButton
            variant="outline"
            size="sm"
            class="text-slate-700 border-slate-300 hover:bg-slate-100 dark:text-slate-300 dark:border-slate-700"
            :disabled="isSubmitting"
            @click="handleSubmit(false)"
          >
            <Save class="w-4 h-4 mr-1.5 text-amber-600" />
            Simpan Perubahan Draft
          </AppButton>

          <AppButton
            variant="primary"
            size="sm"
            class="bg-teal-600 hover:bg-teal-700 text-white font-medium"
            :loading="isSubmitting"
            @click="handleSubmit(true)"
          >
            <Send class="w-4 h-4 mr-1.5" />
            Simpan &amp; Posting
          </AppButton>
        </div>
      </div>
    </template>

    <!-- Modal Account Picker -->
    <AccountPickerModal
      v-model="showAccountModal"
      :account-type="accountModalType"
      @select="handleAccountSelected"
    />
  </div>
</template>
