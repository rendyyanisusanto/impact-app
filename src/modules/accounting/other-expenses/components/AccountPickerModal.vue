<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import type { SelectableAccount } from '../types/other-expense.types'
import { otherExpenseService } from '../services/other-expense.service'
import { Search, X, Check, Loader2 } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
  accountType?: 'all' | 'cash' | 'expense'
  title?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', account: SelectableAccount): void
}>()

const searchInput = ref<HTMLInputElement | null>(null)
const searchQuery = ref('')
const accounts = ref<SelectableAccount[]>([])
const loading = ref(false)
const selectedIndex = ref(0)
const activeTab = ref<'all' | 'cash' | 'expense'>('all')

const modalTitle = computed(() => {
  if (props.title) return props.title
  if (props.accountType === 'cash') return 'Pilih Rekening Sumber Dana (Kas / Bank)'
  if (props.accountType === 'expense') return 'Pilih Rekening Beban Operasional'
  return 'Pilih Rekening Akuntansi'
})

const filteredAccounts = computed(() => {
  let list = accounts.value
  if (activeTab.value === 'cash') {
    list = list.filter(
      a =>
        a.nama.toLowerCase().includes('kas') ||
        a.nama.toLowerCase().includes('bank') ||
        a.induk_nama.toLowerCase().includes('kas') ||
        a.induk_nama.toLowerCase().includes('bank')
    )
  } else if (activeTab.value === 'expense') {
    list = list.filter(
      a =>
        a.coa_nama.toLowerCase().includes('biaya') ||
        a.coa_nama.toLowerCase().includes('beban') ||
        a.induk_nama.toLowerCase().includes('biaya') ||
        a.induk_nama.toLowerCase().includes('beban') ||
        a.saldo_normal === 'D'
    )
  }

  if (!searchQuery.value.trim()) return list
  const q = searchQuery.value.toLowerCase().trim()
  return list.filter(
    a =>
      a.no_ref.toLowerCase().includes(q) ||
      a.nama.toLowerCase().includes(q) ||
      a.induk_nama.toLowerCase().includes(q) ||
      a.coa_nama.toLowerCase().includes(q)
  )
})

async function fetchAccounts() {
  loading.value = true
  try {
    const typeParam = props.accountType || 'all'
    accounts.value = await otherExpenseService.getSelectableAccounts(typeParam)
  } catch (err) {
    console.error('Failed to load accounts for picker:', err)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      searchQuery.value = ''
      selectedIndex.value = 0
      activeTab.value = props.accountType || 'all'
      fetchAccounts()
      nextTick(() => {
        searchInput.value?.focus()
      })
    }
  }
)

function close() {
  emit('update:modelValue', false)
}

function selectAccount(account: SelectableAccount) {
  emit('select', account)
  close()
}

function handleKeydown(e: KeyboardEvent) {
  if (!props.modelValue) return

  if (e.key === 'Escape') {
    e.preventDefault()
    close()
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (selectedIndex.value < filteredAccounts.value.length - 1) {
      selectedIndex.value++
      scrollToSelected()
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (selectedIndex.value > 0) {
      selectedIndex.value--
      scrollToSelected()
    }
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const selected = filteredAccounts.value[selectedIndex.value]
    if (selected) {
      selectAccount(selected)
    }
  }
}

function scrollToSelected() {
  nextTick(() => {
    const el = document.querySelector(`[data-account-index="${selectedIndex.value}"]`)
    if (el) {
      el.scrollIntoView({ block: 'nearest' })
    }
  })
}
</script>

<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    @keydown="handleKeydown"
  >
    <div
      class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-up"
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
        <div>
          <h3 class="text-base font-semibold text-slate-800 dark:text-white">
            {{ modalTitle }}
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pilih rekening aktif untuk transaksi pengeluaran operasional
          </p>
        </div>
        <button
          type="button"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
          @click="close"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Search & Tabs -->
      <div class="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
        <div class="relative">
          <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            placeholder="Cari kode akun, nama rekening, atau kelompok (↑↓ navigasi, Enter pilih, Esc batal)..."
            class="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white"
          />
        </div>

        <!-- Filter tabs -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="px-3 py-1 text-xs rounded-lg font-medium transition-colors"
            :class="activeTab === 'all' ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'"
            @click="activeTab = 'all'"
          >
            Semua Akun
          </button>
          <button
            type="button"
            class="px-3 py-1 text-xs rounded-lg font-medium transition-colors"
            :class="activeTab === 'cash' ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'"
            @click="activeTab = 'cash'"
          >
            Kas & Bank
          </button>
          <button
            type="button"
            class="px-3 py-1 text-xs rounded-lg font-medium transition-colors"
            :class="activeTab === 'expense' ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'"
            @click="activeTab = 'expense'"
          >
            Beban Operasional
          </button>
        </div>
      </div>

      <!-- Account List -->
      <div class="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2">
        <div v-if="loading" class="flex flex-col items-center justify-center py-12 text-slate-400">
          <Loader2 class="w-8 h-8 animate-spin mb-2 text-teal-600" />
          <span class="text-xs">Memuat daftar rekening COA...</span>
        </div>

        <div v-else-if="filteredAccounts.length === 0" class="py-12 text-center text-slate-400 text-xs">
          Tidak ditemukan rekening yang cocok dengan kriteria pencarian.
        </div>

        <div
          v-for="(acc, idx) in filteredAccounts"
          :key="acc.id"
          :data-account-index="idx"
          class="flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all duration-150"
          :class="idx === selectedIndex ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-900 dark:text-teal-100 ring-1 ring-teal-500/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'"
          @click="selectAccount(acc)"
          @mouseenter="selectedIndex = idx"
        >
          <div class="flex items-center gap-3">
            <span class="font-mono text-xs font-semibold px-2 py-1 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
              {{ acc.no_ref }}
            </span>
            <div>
              <div class="text-sm font-medium">
                {{ acc.nama }}
              </div>
              <div class="text-[11px] text-slate-400 dark:text-slate-500">
                {{ acc.induk_nama }} &bull; {{ acc.coa_nama }}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span
              class="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase"
              :class="acc.saldo_normal === 'D' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'"
            >
              {{ acc.saldo_normal === 'D' ? 'Debit (D)' : 'Kredit (K)' }}
            </span>
            <Check v-if="idx === selectedIndex" class="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
        </div>
      </div>

      <!-- Footer Info -->
      <div class="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span>Gunakan <strong>↑↓</strong> untuk navigasi, <strong>Enter</strong> untuk memilih</span>
        <span>Ditemukan: {{ filteredAccounts.length }} rekening</span>
      </div>
    </div>
  </div>
</template>
