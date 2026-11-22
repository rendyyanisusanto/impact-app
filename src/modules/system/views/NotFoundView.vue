<script setup lang="ts">
import AppButton from '@/shared/components/ui/AppButton.vue'
import { Home as HomeIcon } from 'lucide-vue-next'
</script>

<template>
  <div class="py-16 text-center max-w-md mx-auto">
    <div
      class="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4 font-bold text-2xl font-mono"
    >
      404
    </div>
    <h2 class="text-xl font-bold text-content-primary">Halaman Tidak Ditemukan</h2>
    <p class="text-xs text-content-secondary mt-1.5 leading-relaxed">
      Halaman yang Anda tuju tidak tersedia atau telah dipindahkan dalam arsitektur Impact Furniture
      v2.
    </p>
    <div class="mt-6">
      <RouterLink to="/dashboard">
        <AppButton variant="primary" size="sm">
          <template #left-icon>
            <HomeIcon class="w-4 h-4" />
          </template>
          Kembali ke Dashboard Utama
        </AppButton>
      </RouterLink>
    </div>
  </div>
</template>
