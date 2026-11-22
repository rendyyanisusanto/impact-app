<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  Hammer as UnderConstructionIcon,
  Layers as ModuleIcon,
  ArrowLeft as ArrowLeftIcon,
  Calendar as CalendarIcon
} from 'lucide-vue-next'

const route = useRoute()

const pageTitle = computed(() => (route.meta?.title as string) || 'Menu Operasional')
const moduleName = computed(() => (route.meta?.module as string) || 'Impact Furniture ERP')
const routePath = computed(() => route.path)
</script>

<template>
  <div class="space-y-6">
    <!-- Header of the Module Page -->
    <div
      class="bg-white border border-[#D9E0E7] rounded-lg p-5 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
    >
      <div>
        <div class="flex items-center gap-2">
          <span
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200"
          >
            <ModuleIcon class="w-3 h-3" />
            {{ moduleName }}
          </span>
          <span class="text-xs font-mono text-slate-400">{{ routePath }}</span>
        </div>
        <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-[#1F2937] mt-1.5">
          {{ pageTitle }}
        </h1>
        <p class="text-xs sm:text-sm text-[#64748B] mt-0.5">
          Antarmuka modul operasional Impact Furniture v2
        </p>
      </div>

      <RouterLink
        to="/dashboard"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#34454F] text-white hover:bg-[#28363E] transition-colors"
      >
        <ArrowLeftIcon class="w-3.5 h-3.5" />
        <span>Kembali ke Dashboard</span>
      </RouterLink>
    </div>

    <!-- Informational Card -->
    <div
      class="bg-white border border-[#D9E0E7] rounded-lg p-8 shadow-subtle text-center max-w-2xl mx-auto space-y-4"
    >
      <div
        class="w-14 h-14 rounded-full bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto"
      >
        <UnderConstructionIcon class="w-7 h-7" />
      </div>

      <div class="space-y-1.5">
        <h2 class="text-lg font-bold text-[#1F2937]">Halaman Dalam Antrean Pengembangan</h2>
        <p class="text-xs text-[#64748B] max-w-md mx-auto leading-relaxed">
          Struktur rute, navigasi menu, dan metadata untuk
          <strong class="text-teal-800 font-semibold">{{ pageTitle }}</strong>
          telah aktif. Form input, tabel transaksi, dan integrasi backend akan diimplementasikan
          pada Sprint berikutnya.
        </p>
      </div>

      <div class="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-3">
        <span
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200"
        >
          <CalendarIcon class="w-3.5 h-3.5 text-slate-400" />
          <span>Sprint 1 — Task 3 Active Layout</span>
        </span>
        <span
          class="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200"
        >
          Status: Ready for Feature Sprint
        </span>
      </div>
    </div>
  </div>
</template>
