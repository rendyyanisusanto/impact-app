<script setup lang="ts">
import { ref } from 'vue'
import { useUiStore } from '@/stores/ui.store'
import AppUserMenu from './AppUserMenu.vue'
import BugReportModal from '@/modules/system/components/BugReportModal.vue'
import { Menu as MenuIcon, Bug } from 'lucide-vue-next'

const uiStore = useUiStore()
const isBugModalOpen = ref(false)
</script>

<template>
  <header
    class="bg-[#34454F] text-white border-b border-[#28363E] h-11 flex items-center relative z-40 select-none shadow-xs"
  >
    <div
      class="w-full max-w-[1920px] mx-auto px-3 sm:px-5 lg:px-6 flex items-center justify-between"
    >
      <!-- Left: Mobile Toggle & Brand Identity -->
      <div class="flex items-center gap-3">
        <!-- Mobile Drawer Toggle Button -->
        <button
          type="button"
          class="lg:hidden p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 cursor-pointer transition-colors"
          aria-label="Buka menu navigasi"
          @click="uiStore.toggleMobileNavigation"
        >
          <MenuIcon class="w-4 h-4" />
        </button>

        <!-- Branding Logo & System Title -->
        <RouterLink to="/dashboard" class="flex items-center gap-2.5 group focus:outline-none">
          <div
            class="w-7 h-7 rounded-md bg-gradient-to-br from-[#0F766E] to-[#115E59] flex items-center justify-center font-bold text-white text-xs shadow-xs border border-teal-400/30 group-hover:from-teal-600 group-hover:to-teal-800 transition-all"
          >
            IF
          </div>
          <div class="flex flex-col">
            <span class="font-bold text-xs tracking-wider text-white leading-tight font-sans">
              IMPACT FURNITURE
            </span>
            <span class="text-[9px] text-teal-300/90 font-medium tracking-wide leading-tight">
              Management System
            </span>
          </div>
        </RouterLink>
      </div>

      <!-- Right: Bug Report Button & User Profile Menu -->
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors cursor-pointer border border-white/10"
          title="Laporkan Masalah / Bug"
          @click="isBugModalOpen = true"
        >
          <Bug class="w-3.5 h-3.5 text-amber-400" />
          <span>Laporkan Masalah</span>
        </button>

        <AppUserMenu />
      </div>
    </div>

    <!-- Global Bug Report Modal -->
    <BugReportModal v-model="isBugModalOpen" />
  </header>
</template>
