<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import type { SelectableAccount } from '../types/journal.types'
import { journalService } from '../services/journal.service'
import { Search, X, Check, Loader2 } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
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

const filteredAccounts = computed(() => {
  if (!searchQuery.value.trim()) return accounts.value
  const q = searchQuery.value.toLowerCase().trim()
  return accounts.value.filter(
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
    accounts.value = await journalService.getSelectableAccounts()
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
    const target = filteredAccounts.value[selectedIndex.value]
    if (target) {
      selectAccount(target)
    }
  }
}

function scrollToSelected() {
  nextTick(() => {
    const el = document.querySelector('.account-row-selected')
    if (el) {
      el.scrollIntoView({ block: 'nearest' })
    }
  })
}
</script>

<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
    @keydown="handleKeydown"
  >
    <div
      class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
    >
      <!-- Modal Header -->
      <div class="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
        <div>
          <h3 class="text-base font-semibold text-slate-800 dark:text-slate-100">
            Pilih Rekening Akuntansi
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gunakan tombol panah [↑/↓] lalu tekan [Enter] untuk memilih rekening aktif
          </p>
        </div>
        <button
          type="button"
          class="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          @click="close"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Search Bar -->
      <div class="p-4 border-b border-slate-100 dark:border-slate-700/60 bg-white dark:bg-slate-800">
        <div class="relative">
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            placeholder="Cari kode rekening, nama akun, atau kelompok..."
            class="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-100"
            @input="selectedIndex = 0"
          />
        </div>
      </div>

      <!-- Account List -->
      <div class="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
        <div v-if="loading" class="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <Loader2 class="w-6 h-6 animate-spin text-teal-600" />
          <span class="text-xs">Memuat daftar rekening...</span>
        </div>

        <div v-else-if="filteredAccounts.length === 0" class="p-8 text-center text-slate-400">
          <p class="text-sm font-medium">Tidak ada rekening yang cocok</p>
          <p class="text-xs mt-1">Coba kata kunci pencarian yang lain.</p>
        </div>

        <div
          v-for="(acc, idx) in filteredAccounts"
          :key="acc.id"
          class="px-4 py-3 flex items-center justify-between cursor-pointer transition select-none"
          :class="[
            idx === selectedIndex
              ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-100 account-row-selected'
              : 'hover:bg-slate-50 dark:hover:bg-slate-700/40 text-slate-700 dark:text-slate-200'
          ]"
          @click="selectAccount(acc)"
          @mouseenter="selectedIndex = idx"
        >
          <div class="flex items-center gap-3 min-w-0">
            <span class="px-2 py-0.5 font-mono text-xs font-semibold rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
              {{ acc.no_ref }}
            </span>
            <div class="min-w-0">
              <div class="text-sm font-medium truncate">
                {{ acc.nama }}
              </div>
              <div class="text-xs text-slate-400 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{{ acc.coa_nama }}</span>
                <span>•</span>
                <span>{{ acc.induk_nama }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3 flex-shrink-0">
            <span
              class="px-2 py-0.5 text-xs font-semibold rounded"
              :class="acc.saldo_normal === 'D' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'"
            >
              {{ acc.saldo_normal === 'D' ? 'Debit (D)' : 'Kredit (K)' }}
            </span>
            <Check v-if="idx === selectedIndex" class="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center text-xs text-slate-500">
        <span>Menampilkan {{ filteredAccounts.length }} rekening aktif</span>
        <button
          type="button"
          class="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          @click="close"
        >
          Tutup [Esc]
        </button>
      </div>
    </div>
  </div>
</template>
