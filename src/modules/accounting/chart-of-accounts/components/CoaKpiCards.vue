<script setup lang="ts">
import { computed } from 'vue'
import type { CoaKpiSummary } from '../types/coa.types'
import { BookOpen, CheckCircle2, FolderTree, Database } from 'lucide-vue-next'

const props = defineProps<{
  kpi: CoaKpiSummary | null
  isLoading?: boolean
}>()

const totalAccounts = computed(() => props.kpi?.total_accounts ?? 0)
const activeAccounts = computed(() => props.kpi?.active_accounts ?? 0)
const totalGroupsAndParents = computed(() => (props.kpi?.total_groups ?? 0) + (props.kpi?.total_parents ?? 0))
const usedAccounts = computed(() => props.kpi?.used_accounts ?? 0)
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <!-- Card 1: Total Akun -->
    <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm transition-all hover:border-teal-300">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Akun</p>
          <div v-if="isLoading" class="h-7 w-16 bg-gray-200 animate-pulse rounded mt-1.5"></div>
          <p v-else class="text-2xl font-bold text-gray-900 mt-1">{{ totalAccounts }}</p>
          <p class="text-xs text-gray-500 mt-1">Master rekening akuntansi</p>
        </div>
        <div class="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
          <BookOpen class="w-5 h-5" />
        </div>
      </div>
    </div>

    <!-- Card 2: Akun Aktif -->
    <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm transition-all hover:border-teal-300">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">Akun Aktif</p>
          <div v-if="isLoading" class="h-7 w-16 bg-gray-200 animate-pulse rounded mt-1.5"></div>
          <p v-else class="text-2xl font-bold text-emerald-600 mt-1">{{ activeAccounts }}</p>
          <p class="text-xs text-gray-500 mt-1">Dapat digunakan transaksi</p>
        </div>
        <div class="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
          <CheckCircle2 class="w-5 h-5" />
        </div>
      </div>
    </div>

    <!-- Card 3: Kelompok & Induk -->
    <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm transition-all hover:border-teal-300">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">Kelompok & Induk</p>
          <div v-if="isLoading" class="h-7 w-16 bg-gray-200 animate-pulse rounded mt-1.5"></div>
          <p v-else class="text-2xl font-bold text-gray-900 mt-1">
            {{ totalGroupsAndParents }}
            <span class="text-xs font-normal text-gray-500 ml-1">
              ({{ kpi?.total_groups ?? 0 }} grup, {{ kpi?.total_parents ?? 0 }} induk)
            </span>
          </p>
          <p class="text-xs text-gray-500 mt-1">Struktur hierarki akun</p>
        </div>
        <div class="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
          <FolderTree class="w-5 h-5" />
        </div>
      </div>
    </div>

    <!-- Card 4: Akun Terpakai -->
    <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm transition-all hover:border-teal-300">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">Akun Terpakai</p>
          <div v-if="isLoading" class="h-7 w-16 bg-gray-200 animate-pulse rounded mt-1.5"></div>
          <p v-else class="text-2xl font-bold text-teal-700 mt-1">{{ usedAccounts }}</p>
          <p class="text-xs text-gray-500 mt-1">Memiliki riwayat jurnal/kas</p>
        </div>
        <div class="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
          <Database class="w-5 h-5" />
        </div>
      </div>
    </div>
  </div>
</template>
