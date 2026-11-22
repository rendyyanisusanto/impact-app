<script setup lang="ts">
import AppNavigationMenu from './AppNavigationMenu.vue'
</script>

<template>
  <nav
    aria-label="Navigasi Horizontal Utama"
    class="bg-[#34454F] text-slate-100 border-t border-white/[0.08] border-b border-[#28363E] relative z-30 select-none shadow-xs"
  >
    <div class="w-full max-w-[1920px] mx-auto px-3 sm:px-5 lg:px-6">
      <AppNavigationMenu />
    </div>
  </nav>
</template>
