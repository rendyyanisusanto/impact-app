<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import type { SelectableAccount } from '../types/other-income.types'
import { otherIncomeService } from '../services/other-income.service'
import { Search, X, Check, Loader2 } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
  accountType?: 'all' | 'cash' | 'income'
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
const activeTab = ref<'all' | 'cash' | 'income'>('all')

const modalTitle = computed(() => {
  if (props.title) return props.title
  if (props.accountType === 'cash') return 'Pilih Rekening Kas / Bank Penerima'
  if (props.accountType === 'income') return 'Pilih Rekening Sumber Pemasukan / Pendapatan'
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
  } else if (activeTab.value === 'income') {
    list = list.filter(
      a =>
        a.coa_nama.toLowerCase().includes('pendapatan') ||
        a.coa_nama.toLowerCase().includes('penerimaan') ||
        a.induk_nama.toLowerCase().includes('pendapatan') ||
        a.induk_nama.toLowerCase().includes('penerimaan') ||
        a.saldo_normal === 'K'
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
    accounts.value = await otherIncomeService.getSelectableAccounts(typeParam)
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
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (selectedIndex.value < filteredAccounts.value.length - 1) {
      selectedIndex.value++
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (selectedIndex.value > 0) {
      selectedIndex.value--
    }
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const acc = filteredAccounts.value[selectedIndex.value]
    if (acc) selectAccount(acc)
  } else if (e.key === 'Escape') {
    close()
  }
}
</script>

<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
    @keydown="handleKeydown"
  >
    <div
      class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-up"
    >
      <!-- Modal Header -->
      <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h3 class="text-base font-semibold text-slate-800 dark:text-white">
            {{ modalTitle }}
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pilih akun dari daftar Chart of Accounts (COA) aktif
          </p>
        </div>
        <button
          type="button"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg transition-colors"
          @click="close"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Filter Tabs & Search -->
      <div class="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-3">
        <!-- Tabs -->
        <div class="flex items-center gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-800 rounded-xl text-xs font-medium">
          <button
            type="button"
            class="flex-1 py-1.5 rounded-lg text-center transition-all"
            :class="activeTab === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'"
            @click="activeTab = 'all'"
          >
            Semua Rekening
          </button>
          <button
            type="button"
            class="flex-1 py-1.5 rounded-lg text-center transition-all"
            :class="activeTab === 'cash' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'"
            @click="activeTab = 'cash'"
          >
            Kas &amp; Bank
          </button>
          <button
            type="button"
            class="flex-1 py-1.5 rounded-lg text-center transition-all"
            :class="activeTab === 'income' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'"
            @click="activeTab = 'income'"
          >
            Sumber Pemasukan
          </button>
        </div>

        <!-- Search Input -->
        <div class="relative">
          <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            placeholder="Cari kode nomor referensi, nama akun, atau kelompok..."
            class="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
          />
        </div>
      </div>

      <!-- Account List -->
      <div class="flex-1 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800">
        <div v-if="loading" class="flex flex-col items-center justify-center py-12 text-slate-400">
          <Loader2 class="w-7 h-7 animate-spin text-emerald-500 mb-2" />
          <span class="text-xs">Memuat daftar rekening COA...</span>
        </div>

        <div v-else-if="filteredAccounts.length === 0" class="py-12 text-center text-slate-400 text-xs">
          Tidak ditemukan rekening yang cocok dengan kriteria pencarian.
        </div>

        <div
          v-for="(acc, idx) in filteredAccounts"
          v-else
          :key="acc.id"
          class="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors"
          :class="idx === selectedIndex ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'"
          @click="selectAccount(acc)"
          @mouseenter="selectedIndex = idx"
        >
          <div class="min-w-0 flex-1 pr-3">
            <div class="flex items-center gap-2">
              <span class="font-mono font-semibold text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {{ acc.no_ref }}
              </span>
              <span class="font-medium text-sm text-slate-800 dark:text-slate-100 truncate">
                {{ acc.nama }}
              </span>
              <span
                class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded"
                :class="acc.saldo_normal === 'D' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'"
              >
                {{ acc.saldo_normal === 'D' ? 'Debit' : 'Kredit' }}
              </span>
            </div>
            <div class="flex items-center gap-2 mt-1 text-xs text-slate-400">
              <span>{{ acc.coa_nama }}</span>
              <span>•</span>
              <span>Induk: {{ acc.induk_nama }}</span>
            </div>
          </div>

          <div v-if="idx === selectedIndex" class="text-emerald-600 dark:text-emerald-400 shrink-0">
            <Check class="w-4 h-4" />
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div>
          <span>Gunakan panah <kbd class="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px]">↑</kbd> <kbd class="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px]">↓</kbd> dan <kbd class="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px]">Enter</kbd> untuk memilih</span>
        </div>
        <div>
          <span>Ditemukan: <strong>{{ filteredAccounts.length }}</strong> akun</span>
        </div>
      </div>
    </div>
  </div>
</template>
