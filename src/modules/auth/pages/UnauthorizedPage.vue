<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import AppButton from '@/shared/components/ui/AppButton.vue'
import {
  ShieldAlert as ShieldAlertIcon,
  Home as HomeIcon,
  LogOut as LogoutIcon
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-[70vh] flex items-center justify-center p-4">
    <div
      class="max-w-md w-full bg-surface border border-border rounded-card p-6 sm:p-8 text-center shadow-card"
    >
      <div
        class="w-14 h-14 rounded-full bg-red-50 text-semantic-danger flex items-center justify-center mx-auto mb-4 border border-red-200"
      >
        <ShieldAlertIcon class="w-7 h-7" />
      </div>

      <h1 class="text-xl sm:text-2xl font-bold text-content-primary tracking-tight">
        403 — Akses Ditolak
      </h1>

      <p class="mt-2 text-xs sm:text-sm text-content-secondary leading-relaxed">
        Akun Anda saat ini terdaftar sebagai
        <strong class="text-content-primary">{{ authStore.userRole }}</strong>
        dan tidak memiliki hak akses (permission) untuk membuka halaman ini.
      </p>

      <div class="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5">
        <AppButton variant="primary" size="sm" @click="router.push('/dashboard')">
          <template #left-icon>
            <HomeIcon class="w-4 h-4" />
          </template>
          Ke Dashboard
        </AppButton>

        <AppButton variant="secondary" size="sm" @click="router.push('/login')">
          Ganti Profil Akun
        </AppButton>

        <AppButton variant="ghost" size="sm" @click="handleLogout">
          <template #left-icon>
            <LogoutIcon class="w-4 h-4 text-slate-400" />
          </template>
          Logout
        </AppButton>
      </div>
    </div>
  </div>
</template>
