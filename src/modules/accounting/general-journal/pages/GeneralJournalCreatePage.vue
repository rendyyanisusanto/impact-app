<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  Save,
  Send,
  Loader2,
  XCircle
} from 'lucide-vue-next'
import { journalService } from '../services/journal.service'
import type { SelectableAccount, CreateJournalPayload } from '../types/journal.types'
import AccountPickerModal from '../components/AccountPickerModal.vue'
import PostingConfirmModal from '../components/PostingConfirmModal.vue'
import { formatCurrency } from '@/shared/utils/formatters'

const route = useRoute()
const router = useRouter()

const editId = computed(() => (route.params.id ? Number(route.params.id) : null))
const isEditMode = computed(() => editId.value !== null)

// Header form state
const form = reactive({
  journal_number: '[Otomatis dari Sistem]',
  journal_date: new Date().toISOString().slice(0, 10),
  reference_number: '',
  description: '',
  source_type: 'Manual'
})

// Detail spreadsheet row interface
interface SpreadsheetRow {
  akun_id: number | null
  kode_akun: string
  nama_akun: string
  saldo_normal: string
  description: string
  debit: number
  credit: number
}

const rows = ref<SpreadsheetRow[]>([
  { akun_id: null, kode_akun: '', nama_akun: '', saldo_normal: '', description: '', debit: 0, credit: 0 },
  { akun_id: null, kode_akun: '', nama_akun: '', saldo_normal: '', description: '', debit: 0, credit: 0 }
])

// Account Picker Modal
const showAccountPicker = ref(false)
const targetRowIndex = ref<number | null>(null)

// Posting modal
const showPostingModal = ref(false)
const postingJournalData = ref<any>(null)
const postingModalRef = ref<any>(null)

// UI state
const loading = ref(false)
const saving = ref(false)
const toast = ref<{ type: 'success' | 'error'; message: string } | null>(null)

function showToast(message: string, type: 'success' | 'error' = 'success') {
  toast.value = { type, message }
  setTimeout(() => {
    toast.value = null
  }, 4000)
}

// Calculations
const totalDebit = computed(() => {
  return Math.round(rows.value.reduce((sum, r) => sum + (Number(r.debit) || 0), 0) * 100) / 100
})

const totalCredit = computed(() => {
  return Math.round(rows.value.reduce((sum, r) => sum + (Number(r.credit) || 0), 0) * 100) / 100
})

const difference = computed(() => {
  return Math.round(Math.abs(totalDebit.value - totalCredit.value) * 100) / 100
})

const isBalanced = computed(() => {
  return totalDebit.value > 0 && totalCredit.value > 0 && difference.value === 0
})

// Account Picker Handler
function openAccountPicker(rowIndex: number) {
  targetRowIndex.value = rowIndex
  showAccountPicker.value = true
}

function handleAccountSelected(acc: SelectableAccount) {
  if (targetRowIndex.value !== null && rows.value[targetRowIndex.value]) {
    const row = rows.value[targetRowIndex.value]
    row.akun_id = acc.id
    row.kode_akun = acc.no_ref
    row.nama_akun = acc.nama
    row.saldo_normal = acc.saldo_normal
  }
}

// Row Operations
function addRow() {
  rows.value.push({
    akun_id: null,
    kode_akun: '',
    nama_akun: '',
    saldo_normal: '',
    description: '',
    debit: 0,
    credit: 0
  })
}

function removeRow(index: number) {
  if (rows.value.length <= 2) {
    showToast('Jurnal minimal harus memiliki 2 baris rekening', 'error')
    return
  }
  const row = rows.value[index]
  if (row.akun_id || row.debit > 0 || row.credit > 0) {
    if (!confirm('Hapus baris ini?')) return
  }
  rows.value.splice(index, 1)
}

// Mutual exclusivity of Debit / Credit on same row
function onDebitInput(rowIndex: number, e: Event) {
  const val = Number((e.target as HTMLInputElement).value) || 0
  const cleanVal = Math.max(0, val)
  rows.value[rowIndex].debit = cleanVal
  if (cleanVal > 0) {
    rows.value[rowIndex].credit = 0
  }
}

function onCreditInput(rowIndex: number, e: Event) {
  const val = Number((e.target as HTMLInputElement).value) || 0
  const cleanVal = Math.max(0, val)
  rows.value[rowIndex].credit = cleanVal
  if (cleanVal > 0) {
    rows.value[rowIndex].debit = 0
  }
}

// Load existing draft if editing
async function loadExistingDraft(id: number) {
  loading.value = true
  try {
    const j = await journalService.getJournalById(id)
    if (j.status !== 'DRAFT') {
      showToast(`Jurnal berstatus ${j.status} tidak dapat diedit.`, 'error')
      router.push('/accounting/general-journal')
      return
    }
    form.journal_number = j.journal_number
    form.journal_date = j.journal_date
    form.reference_number = j.reference_number || ''
    form.description = j.description

    if (j.lines && j.lines.length > 0) {
      rows.value = j.lines.map(l => ({
        akun_id: l.akun_id,
        kode_akun: l.kode_akun || '',
        nama_akun: l.nama_akun || '',
        saldo_normal: l.saldo_normal || '',
        description: l.description || '',
        debit: l.debit,
        credit: l.credit
      }))
    }
  } catch (err: any) {
    showToast(err.message || 'Gagal memuat draft jurnal', 'error')
  } finally {
    loading.value = false
  }
}

// Validate Form before save
function validateForm(): boolean {
  if (!form.journal_date) {
    showToast('Tanggal jurnal wajib diisi', 'error')
    return false
  }
  if (!form.description || form.description.trim().length < 3) {
    showToast('Keterangan umum wajib diisi minimal 3 karakter', 'error')
    return false
  }
  for (let i = 0; i < rows.value.length; i++) {
    const r = rows.value[i]
    if (!r.akun_id) {
      showToast(`Baris #${i + 1}: Rekening akuntansi belum dipilih`, 'error')
      return false
    }
  }
  return true
}

// Save Draft
async function handleSaveDraft() {
  if (!validateForm() || saving.value) return
  saving.value = true
  try {
    const payload: CreateJournalPayload = {
      journal_date: form.journal_date,
      reference_number: form.reference_number.trim() || null,
      description: form.description.trim(),
      lines: rows.value.map(r => ({
        akun_id: r.akun_id!,
        description: r.description.trim() || null,
        debit: Number(r.debit) || 0,
        credit: Number(r.credit) || 0
      }))
    }

    if (isEditMode.value) {
      await journalService.updateDraft(editId.value!, payload)
      showToast('Draft jurnal berhasil diperbarui')
    } else {
      await journalService.createDraft(payload)
      showToast('Draft jurnal berhasil disimpan')
    }
    setTimeout(() => {
      router.push('/accounting/general-journal')
    }, 600)
  } catch (err: any) {
    showToast(err.message || 'Gagal menyimpan draft jurnal', 'error')
  } finally {
    saving.value = false
  }
}

// Save & Post Flow
async function handleSaveAndPost() {
  if (!validateForm() || saving.value) return
  if (!isBalanced.value) {
    showToast(
      `Jurnal belum seimbang! Total Debit (${formatCurrency(totalDebit.value)}) != Total Kredit (${formatCurrency(totalCredit.value)}). Selisih: ${formatCurrency(difference.value)}`,
      'error'
    )
    return
  }

  saving.value = true
  try {
    let targetId = editId.value
    const payload: CreateJournalPayload = {
      journal_date: form.journal_date,
      reference_number: form.reference_number.trim() || null,
      description: form.description.trim(),
      lines: rows.value.map(r => ({
        akun_id: r.akun_id!,
        description: r.description.trim() || null,
        debit: Number(r.debit) || 0,
        credit: Number(r.credit) || 0
      }))
    }

    if (isEditMode.value) {
      const updated = await journalService.updateDraft(editId.value!, payload)
      targetId = updated.id
    } else {
      const created = await journalService.createDraft(payload)
      targetId = created.id
    }

    // Siapkan konfirmasi modal
    const full = await journalService.getJournalById(targetId!)
    postingJournalData.value = full
    showPostingModal.value = true
  } catch (err: any) {
    showToast(err.message || 'Gagal menyimpan jurnal sebelum posting', 'error')
  } finally {
    saving.value = false
  }
}

async function handleConfirmPosting(id: number) {
  try {
    await journalService.postJournal(id)
    showToast('Jurnal umum berhasil diposting!')
    showPostingModal.value = false
    setTimeout(() => {
      router.push('/accounting/general-journal')
    }, 600)
  } catch (err: any) {
    postingModalRef.value?.resetLoading()
    showToast(err.message || 'Gagal memposting jurnal', 'error')
  }
}

function handleCancel() {
  router.push('/accounting/general-journal')
}

onMounted(() => {
  if (isEditMode.value) {
    loadExistingDraft(editId.value!)
  }
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 pb-28 p-4 sm:p-6 lg:p-8">
    <!-- Toast Notification -->
    <div
      v-if="toast"
      class="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2 text-sm font-medium animate-in slide-in-from-top duration-200"
      :class="
        toast.type === 'success'
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200'
          : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-200'
      "
    >
      <CheckCircle2 v-if="toast.type === 'success'" class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
      <XCircle v-else class="w-4 h-4 text-rose-600 dark:text-rose-400" />
      <span>{{ toast.message }}</span>
    </div>

    <!-- Top Action Bar -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
          @click="handleCancel"
        >
          <ArrowLeft class="w-4 h-4" />
        </button>
        <div>
          <h1 class="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            {{ isEditMode ? 'Edit Draft Jurnal Umum' : 'Tambah Jurnal Umum Manual' }}
          </h1>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Form pencatatan transaksi jurnal dengan sistem pembukuan berimbang.
          </p>
        </div>
      </div>
    </div>

    <!-- Bagian A: Informasi Jurnal -->
    <div class="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
      <h2 class="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 mb-4 pb-2 border-b border-slate-100 dark:border-slate-700/60">
        Bagian A — Informasi Jurnal
      </h2>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Nomor Jurnal -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Nomor Jurnal
          </label>
          <input
            v-model="form.journal_number"
            type="text"
            readonly
            class="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 font-mono"
          />
        </div>

        <!-- Tanggal Jurnal -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Tanggal Jurnal <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="form.journal_date"
            type="date"
            class="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-100"
          />
        </div>

        <!-- Nomor Referensi -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Nomor Referensi (Opsional)
          </label>
          <input
            v-model="form.reference_number"
            type="text"
            placeholder="Bukti transfer / Dokumen..."
            class="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-100 font-mono"
          />
        </div>

        <!-- Sumber Jurnal -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Sumber Jurnal
          </label>
          <input
            v-model="form.source_type"
            type="text"
            readonly
            class="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 font-semibold"
          />
        </div>

        <!-- Keterangan Umum -->
        <div class="sm:col-span-2 lg:col-span-4">
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Keterangan Umum <span class="text-rose-500">*</span>
          </label>
          <textarea
            v-model="form.description"
            rows="2"
            placeholder="Keterangan lengkap transaksi jurnal..."
            class="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-100"
          />
        </div>
      </div>
    </div>

    <!-- Bagian B: Detail Jurnal Spreadsheet -->
    <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mb-6">
      <div class="px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/40">
        <div>
          <h2 class="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
            Bagian B — Detail Baris Jurnal
          </h2>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Double-click kode atau nama rekening untuk memilih akun COA.
          </p>
        </div>
        <button
          type="button"
          class="px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700 hover:bg-teal-100 text-xs font-semibold flex items-center gap-1.5 transition"
          @click="addRow"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Tambah Baris</span>
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-xs text-left divide-y divide-slate-200 dark:divide-slate-700">
          <thead class="bg-slate-50 dark:bg-slate-900/60 font-semibold text-slate-600 dark:text-slate-300">
            <tr>
              <th class="px-3 py-2.5 w-10 text-center">No</th>
              <th class="px-3 py-2.5 w-36">Kode Akun</th>
              <th class="px-3 py-2.5 w-56">Nama Rekening</th>
              <th class="px-3 py-2.5 min-w-[200px]">Keterangan Baris</th>
              <th class="px-3 py-2.5 w-40 text-right">Debit (Rp)</th>
              <th class="px-3 py-2.5 w-40 text-right">Kredit (Rp)</th>
              <th class="px-3 py-2.5 w-12 text-center">Aksi</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr
              v-for="(row, idx) in rows"
              :key="idx"
              class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
            >
              <!-- No -->
              <td class="px-3 py-2 text-center text-slate-400 font-mono">
                {{ idx + 1 }}
              </td>

              <!-- Kode Akun -->
              <td class="px-2 py-1.5" @dblclick="openAccountPicker(idx)">
                <div class="relative flex items-center">
                  <input
                    type="text"
                    readonly
                    placeholder="Klik / Dobel klik..."
                    :value="row.kode_akun"
                    class="w-full pl-2 pr-6 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded cursor-pointer font-mono font-medium text-slate-800 dark:text-slate-100"
                    @click="openAccountPicker(idx)"
                  />
                  <Search class="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
                </div>
              </td>

              <!-- Nama Rekening -->
              <td class="px-2 py-1.5" @dblclick="openAccountPicker(idx)">
                <input
                  type="text"
                  readonly
                  placeholder="Pilih rekening akuntansi..."
                  :value="row.nama_akun"
                  class="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded cursor-pointer text-slate-800 dark:text-slate-100"
                  @click="openAccountPicker(idx)"
                />
              </td>

              <!-- Keterangan Baris -->
              <td class="px-2 py-1.5">
                <input
                  v-model="row.description"
                  type="text"
                  placeholder="Keterangan transaksi baris ini (opsional)..."
                  class="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded focus:ring-1 focus:ring-teal-500 text-slate-800 dark:text-slate-100"
                />
              </td>

              <!-- Debit -->
              <td class="px-2 py-1.5">
                <input
                  type="number"
                  min="0"
                  step="any"
                  :value="row.debit || ''"
                  placeholder="0"
                  class="w-full px-2 py-1.5 text-xs font-mono text-right bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded focus:ring-1 focus:ring-teal-500 font-semibold text-slate-800 dark:text-slate-100"
                  @input="onDebitInput(idx, $event)"
                />
              </td>

              <!-- Kredit -->
              <td class="px-2 py-1.5">
                <input
                  type="number"
                  min="0"
                  step="any"
                  :value="row.credit || ''"
                  placeholder="0"
                  class="w-full px-2 py-1.5 text-xs font-mono text-right bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded focus:ring-1 focus:ring-teal-500 font-semibold text-slate-800 dark:text-slate-100"
                  @input="onCreditInput(idx, $event)"
                />
              </td>

              <!-- Aksi -->
              <td class="px-2 py-1.5 text-center">
                <button
                  type="button"
                  title="Hapus baris"
                  class="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition"
                  @click="removeRow(idx)"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="p-3 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
        <button
          type="button"
          class="text-teal-600 dark:text-teal-400 hover:underline font-semibold flex items-center gap-1"
          @click="addRow"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Tambah Baris Baru</span>
        </button>
        <span class="text-slate-400">Total: {{ rows.length }} Baris</span>
      </div>
    </div>

    <!-- Bagian C: Sticky Bottom Summary Bar -->
    <div
      class="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 px-4 sm:px-8 py-3.5 shadow-2xl transition-all"
    >
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <!-- Live Totals & Balance Status -->
        <div class="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
          <div>
            <span class="text-slate-400 block text-[10px] uppercase font-bold">Jumlah Baris</span>
            <span class="font-bold text-sm text-slate-800 dark:text-slate-100 font-mono">{{ rows.length }}</span>
          </div>

          <div class="border-l border-slate-200 dark:border-slate-700 pl-4 sm:pl-6">
            <span class="text-slate-400 block text-[10px] uppercase font-bold">Total Debit</span>
            <span class="font-bold text-sm text-slate-900 dark:text-slate-100 font-mono">{{ formatCurrency(totalDebit) }}</span>
          </div>

          <div class="border-l border-slate-200 dark:border-slate-700 pl-4 sm:pl-6">
            <span class="text-slate-400 block text-[10px] uppercase font-bold">Total Kredit</span>
            <span class="font-bold text-sm text-slate-900 dark:text-slate-100 font-mono">{{ formatCurrency(totalCredit) }}</span>
          </div>

          <div class="border-l border-slate-200 dark:border-slate-700 pl-4 sm:pl-6">
            <span class="text-slate-400 block text-[10px] uppercase font-bold">Selisih</span>
            <span
              class="font-bold text-sm font-mono"
              :class="difference === 0 ? 'text-slate-600 dark:text-slate-300' : 'text-rose-600'"
            >
              {{ formatCurrency(difference) }}
            </span>
          </div>

          <!-- Balance Badge -->
          <div class="border-l border-slate-200 dark:border-slate-700 pl-4 sm:pl-6">
            <span class="text-slate-400 block text-[10px] uppercase font-bold">Status Saldo</span>
            <div class="flex items-center gap-1.5 mt-0.5">
              <span
                class="px-2.5 py-0.5 text-xs font-bold rounded-full flex items-center gap-1"
                :class="
                  isBalanced
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                "
              >
                <CheckCircle2 v-if="isBalanced" class="w-3.5 h-3.5" />
                <AlertTriangle v-else class="w-3.5 h-3.5" />
                <span>{{ isBalanced ? 'Seimbang' : 'Belum Seimbang' }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            :disabled="saving"
            class="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            @click="handleCancel"
          >
            Batalkan
          </button>

          <button
            type="button"
            :disabled="saving"
            class="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
            @click="handleSaveDraft"
          >
            <Save class="w-4 h-4" />
            <span>Simpan Draft</span>
          </button>

          <button
            type="button"
            :disabled="saving || !isBalanced"
            class="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            @click="handleSaveAndPost"
          >
            <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
            <Send v-else class="w-4 h-4" />
            <span>Simpan & Posting</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Account Picker Modal -->
    <AccountPickerModal
      v-model="showAccountPicker"
      @select="handleAccountSelected"
    />

    <!-- Posting Modal -->
    <PostingConfirmModal
      ref="postingModalRef"
      v-model="showPostingModal"
      :journal="postingJournalData"
      @confirm="handleConfirmPosting"
    />
  </div>
</template>
