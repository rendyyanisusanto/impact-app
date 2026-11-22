<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import type { CoaGroup, CoaParent, CoaAccount, SaldoNormal } from '../types/coa.types'
import { AlertCircle, Info, Lock } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
  isEdit: boolean
  accountData: CoaAccount | null
  groups: CoaGroup[]
  parents: CoaParent[]
  isLoading?: boolean
  initialParentId?: number
  initialCoaId?: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', form: {
    no_ref: string
    nama: string
    indukakun_id: number
    saldo_normal: SaldoNormal
    is_active: number
  }): void
}>()

const form = reactive({
  no_ref: '',
  nama: '',
  coa_id: undefined as number | undefined,
  indukakun_id: undefined as number | undefined,
  saldo_normal: 'D' as SaldoNormal,
  is_active: 1
})

const errors = reactive({
  no_ref: '',
  nama: '',
  coa_id: '',
  indukakun_id: ''
})

const isAccountUsed = computed(() => {
  return props.isEdit && !!props.accountData?.is_used
})

// Filtered parents based on selected coa_id
const filteredParents = computed(() => {
  if (!form.coa_id) return []
  return props.parents.filter(p => p.coa_id === Number(form.coa_id))
})

// Check if selected normal balance is contra to group default
const isContraAccount = computed(() => {
  if (!form.coa_id) return false
  const defaultBalance = getDefaultSaldoNormal(form.coa_id)
  return form.saldo_normal !== defaultBalance
})

function getDefaultSaldoNormal(coaId: number): SaldoNormal {
  switch (coaId) {
    case 1: // Aktiva
    case 5: // Biaya
      return 'D'
    case 2: // Kewajiban
    case 3: // Modal / Ekuitas
    case 4: // Penerimaan / Pendapatan
      return 'K'
    default:
      return 'D'
  }
}

// When coa_id changes, reset or update indukakun_id and set default saldo_normal
function onCoaChange() {
  if (!form.coa_id) {
    form.indukakun_id = undefined
    return
  }
  // Check if current indukakun belongs to selected coa
  const parent = props.parents.find(p => p.id === form.indukakun_id)
  if (!parent || parent.coa_id !== Number(form.coa_id)) {
    form.indukakun_id = undefined
  }

  // Set default saldo normal based on group if creating or not locked
  if (!props.isEdit) {
    form.saldo_normal = getDefaultSaldoNormal(Number(form.coa_id))
  }
}

// When indukakun_id changes, ensure coa_id is synchronized
function onParentChange() {
  if (!form.indukakun_id) return
  const parent = props.parents.find(p => p.id === Number(form.indukakun_id))
  if (parent && parent.coa_id !== form.coa_id) {
    form.coa_id = parent.coa_id
  }
}

// Initialize form on open
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      errors.no_ref = ''
      errors.nama = ''
      errors.coa_id = ''
      errors.indukakun_id = ''

      if (props.isEdit && props.accountData) {
        form.no_ref = props.accountData.no_ref || ''
        form.nama = props.accountData.nama || ''
        form.indukakun_id = props.accountData.indukakun_id
        form.coa_id = props.accountData.coa_id
        form.saldo_normal = props.accountData.saldo_normal || 'D'
        form.is_active = props.accountData.is_active ?? 1
      } else {
        form.no_ref = ''
        form.nama = ''
        form.coa_id = props.initialCoaId || (props.groups[0]?.id ?? undefined)
        form.indukakun_id = props.initialParentId || undefined
        form.saldo_normal = form.coa_id ? getDefaultSaldoNormal(form.coa_id) : 'D'
        form.is_active = 1

        if (form.indukakun_id) {
          onParentChange()
        }
      }
    }
  },
  { immediate: true }
)

function validate(): boolean {
  let valid = true
  errors.no_ref = ''
  errors.nama = ''
  errors.coa_id = ''
  errors.indukakun_id = ''

  if (!form.no_ref.trim()) {
    errors.no_ref = 'Kode rekening wajib diisi'
    valid = false
  } else if (!/^[A-Za-z0-9._-]+$/.test(form.no_ref.trim())) {
    errors.no_ref = 'Kode rekening hanya boleh berisi huruf, angka, titik, atau strip'
    valid = false
  }

  if (!form.nama.trim()) {
    errors.nama = 'Nama rekening wajib diisi'
    valid = false
  } else if (form.nama.trim().length < 2) {
    errors.nama = 'Nama rekening minimal 2 karakter'
    valid = false
  }

  if (!form.coa_id) {
    errors.coa_id = 'Kelompok akun wajib dipilih'
    valid = false
  }

  if (!form.indukakun_id) {
    errors.indukakun_id = 'Induk akun wajib dipilih'
    valid = false
  }

  return valid
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    no_ref: form.no_ref.trim(),
    nama: form.nama.trim(),
    indukakun_id: Number(form.indukakun_id),
    saldo_normal: form.saldo_normal,
    is_active: Number(form.is_active)
  })
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-2xs flex items-center justify-center p-4"
    @click.self="emit('close')"
  >
    <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
      <!-- Header -->
      <div class="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 class="text-base font-bold text-gray-900">
            {{ isEdit ? 'Edit Rekening Akuntansi' : 'Tambah Rekening Akuntansi' }}
          </h3>
          <p class="text-xs text-gray-500 mt-0.5">
            {{ isEdit ? 'Perbarui informasi master rekening akuntansi' : 'Daftarkan rekening baru ke dalam struktur COA' }}
          </p>
        </div>
        <button
          type="button"
          class="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          @click="emit('close')"
        >
          &times;
        </button>
      </div>

      <!-- In-Use Notice if editing an active ledger account -->
      <div
        v-if="isAccountUsed"
        class="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-2 text-xs text-amber-800"
      >
        <Lock class="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p class="font-semibold">Rekening ini telah digunakan dalam transaksi</p>
          <p class="text-amber-700 mt-0.5">
            Kode rekening, kelompok, dan saldo normal dikunci untuk melindungi integritas laporan historis dan jurnal umum.
          </p>
        </div>
      </div>

      <!-- Body Form -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <!-- Field 1: Kode Rekening -->
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">
            Kode Rekening <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <input
              v-model="form.no_ref"
              type="text"
              placeholder="Contoh: 1109"
              :disabled="isAccountUsed"
              :class="[
                'w-full px-3 py-2 text-xs font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500',
                isAccountUsed ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' : 'bg-white border-gray-300',
                errors.no_ref ? 'border-red-500 focus:ring-red-500' : ''
              ]"
            />
            <Lock v-if="isAccountUsed" class="w-3.5 h-3.5 text-gray-400 absolute right-3 top-2.5" />
          </div>
          <p v-if="errors.no_ref" class="text-2xs text-red-600 mt-1 flex items-center">
            <AlertCircle class="w-3 h-3 mr-1 inline" /> {{ errors.no_ref }}
          </p>
        </div>

        <!-- Field 2: Nama Rekening -->
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">
            Nama Rekening <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.nama"
            type="text"
            placeholder="Contoh: Kas Kecil Kantor Cabang"
            :class="[
              'w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white',
              errors.nama ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
            ]"
          />
          <p v-if="errors.nama" class="text-2xs text-red-600 mt-1 flex items-center">
            <AlertCircle class="w-3 h-3 mr-1 inline" /> {{ errors.nama }}
          </p>
        </div>

        <!-- Field 3: Kelompok Akun (COA) -->
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">
            Kelompok Akun <span class="text-red-500">*</span>
          </label>
          <select
            v-model="form.coa_id"
            :disabled="isAccountUsed"
            :class="[
              'w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500',
              isAccountUsed ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' : 'bg-white border-gray-300',
              errors.coa_id ? 'border-red-500' : ''
            ]"
            @change="onCoaChange"
          >
            <option :value="undefined" disabled>-- Pilih Kelompok Akun --</option>
            <option v-for="group in groups" :key="group.id" :value="group.id">
              {{ group.id }} &mdash; {{ group.name }}
            </option>
          </select>
          <p v-if="errors.coa_id" class="text-2xs text-red-600 mt-1 flex items-center">
            <AlertCircle class="w-3 h-3 mr-1 inline" /> {{ errors.coa_id }}
          </p>
        </div>

        <!-- Field 4: Induk Akun (Parent) -->
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">
            Induk Akun <span class="text-red-500">*</span>
          </label>
          <select
            v-model="form.indukakun_id"
            :disabled="isAccountUsed || !form.coa_id"
            :class="[
              'w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500',
              isAccountUsed || !form.coa_id ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' : 'bg-white border-gray-300',
              errors.indukakun_id ? 'border-red-500' : ''
            ]"
            @change="onParentChange"
          >
            <option :value="undefined" disabled>
              {{ form.coa_id ? '-- Pilih Induk Akun --' : '-- Pilih Kelompok Akun terlebih dahulu --' }}
            </option>
            <option v-for="parent in filteredParents" :key="parent.id" :value="parent.id">
              [{{ parent.no_akun }}] {{ parent.nama }}
            </option>
          </select>
          <p v-if="errors.indukakun_id" class="text-2xs text-red-600 mt-1 flex items-center">
            <AlertCircle class="w-3 h-3 mr-1 inline" /> {{ errors.indukakun_id }}
          </p>
        </div>

        <!-- Field 5: Saldo Normal -->
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">
            Saldo Normal <span class="text-red-500">*</span>
          </label>
          <div class="grid grid-cols-2 gap-3">
            <label
              :class="[
                'flex items-center px-3 py-2 border rounded-lg cursor-pointer text-xs transition-colors',
                form.saldo_normal === 'D' ? 'border-blue-500 bg-blue-50/60 text-blue-900 font-semibold' : 'border-gray-200 hover:bg-gray-50 text-gray-700',
                isAccountUsed ? 'opacity-60 cursor-not-allowed' : ''
              ]"
            >
              <input
                v-model="form.saldo_normal"
                type="radio"
                value="D"
                :disabled="isAccountUsed"
                class="text-blue-600 focus:ring-blue-500 mr-2"
              />
              Debit (D)
            </label>

            <label
              :class="[
                'flex items-center px-3 py-2 border rounded-lg cursor-pointer text-xs transition-colors',
                form.saldo_normal === 'K' ? 'border-amber-500 bg-amber-50/60 text-amber-900 font-semibold' : 'border-gray-200 hover:bg-gray-50 text-gray-700',
                isAccountUsed ? 'opacity-60 cursor-not-allowed' : ''
              ]"
            >
              <input
                v-model="form.saldo_normal"
                type="radio"
                value="K"
                :disabled="isAccountUsed"
                class="text-amber-600 focus:ring-amber-500 mr-2"
              />
              Kredit (K)
            </label>
          </div>

          <!-- Contra Account Notification -->
          <div
            v-if="isContraAccount"
            class="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-2xs text-blue-800 flex items-start space-x-1.5"
          >
            <Info class="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
            <span>
              Perhatian: Saldo normal ini berbeda dari default kelompok akun. Pastikan rekening ini memang merupakan akun kontra (misal: Akumulasi Penyusutan, Retur Penjualan, atau Prive).
            </span>
          </div>
        </div>

        <!-- Field 6: Status -->
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">
            Status Rekening
          </label>
          <div class="flex items-center space-x-4">
            <label class="inline-flex items-center text-xs text-gray-700 cursor-pointer">
              <input
                v-model.number="form.is_active"
                type="radio"
                :value="1"
                class="text-teal-600 focus:ring-teal-500 mr-1.5"
              />
              Aktif (dapat digunakan untuk transaksi baru)
            </label>
            <label class="inline-flex items-center text-xs text-gray-700 cursor-pointer">
              <input
                v-model.number="form.is_active"
                type="radio"
                :value="0"
                class="text-gray-500 focus:ring-gray-400 mr-1.5"
              />
              Nonaktif
            </label>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="pt-4 border-t border-gray-200 flex items-center justify-end space-x-2">
          <button
            type="button"
            class="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            @click="emit('close')"
          >
            Batal
          </button>
          <button
            type="submit"
            :disabled="isLoading"
            class="px-4 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <span v-if="isLoading" class="mr-1.5 animate-spin">&bull;</span>
            {{ isEdit ? 'Simpan Perubahan' : 'Simpan Rekening' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.text-2xs {
  font-size: 0.6875rem;
  line-height: 0.875rem;
}
</style>
