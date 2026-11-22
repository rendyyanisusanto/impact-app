<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppFormField from '@/shared/components/ui/AppFormField.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppAlert from '@/shared/components/feedback/AppAlert.vue'
import AppBadge from '@/shared/components/ui/AppBadge.vue'
import { useToast } from '@/shared/composables/useToast'
import { isValidReturnUrl, canAccessRoute } from '@/shared/utils/permissions'
import {
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  LogIn as LoginIcon,
  Lock as LockIcon,
  CheckCircle2 as CheckIcon
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

interface LoginForm {
  username: string
  password: string
}

const form = ref<LoginForm>({
  username: '',
  password: ''
})

const errors = ref<{
  username?: string
  password?: string
  general?: string
}>({})

const showPassword = ref(false)
const isLoading = ref(false)

function validateForm(): boolean {
  errors.value = {}
  let isValid = true

  const trimmedUsername = form.value.username.trim()
  if (!trimmedUsername) {
    errors.value.username = 'Username wajib diisi.'
    isValid = false
  }

  // Password must not be trimmed (preserve whitespace characters if intentionally entered)
  if (!form.value.password) {
    errors.value.password = 'Password wajib diisi.'
    isValid = false
  }

  return isValid
}

async function handleLogin() {
  if (isLoading.value) return

  if (!validateForm()) {
    return
  }

  isLoading.value = true
  errors.value.general = undefined

  try {
    const trimmedUsername = form.value.username.trim()
    const user = await authStore.login(trimmedUsername, form.value.password)
    toast.success(`Selamat datang kembali, ${user.name}!`)

    // Safe redirect handling with open redirect prevention
    const rawRedirect = route.query.redirect as string | undefined
    if (rawRedirect && isValidReturnUrl(rawRedirect)) {
      // Decode and ensure permission before directing
      const decodedTarget = decodeURIComponent(rawRedirect)
      // If the user has permission for the intended target or route doesn't require extra permission
      if (canAccessRoute(user, undefined)) {
        router.push(decodedTarget)
        return
      }
    }

    router.push('/dashboard')
  } catch (err: unknown) {
    errors.value.general =
      err instanceof Error ? err.message : 'Username atau password tidak valid.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen w-full flex flex-col lg:flex-row bg-background">
    <!-- LEFT PANEL: BRANDING & SYSTEM IDENTITY (DESKTOP) -->
    <div
      class="hidden lg:flex lg:w-5/12 xl:w-1/2 bg-navbar text-slate-100 flex-col justify-between p-8 xl:p-12 relative overflow-hidden select-none border-r border-[#28363E]"
    >
      <!-- Decorative background glow -->
      <div
        class="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary/20 blur-3xl pointer-events-none"
      />
      <div
        class="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none"
      />

      <!-- Top Branding -->
      <div class="relative z-10">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0F766E] to-[#115E59] flex items-center justify-center font-bold text-white text-base shadow-sm border border-teal-400/30"
          >
            IF
          </div>
          <div>
            <span class="block font-bold text-base tracking-wider text-white leading-tight">
              IMPACT FURNITURE
            </span>
            <span class="block text-xs text-teal-300 font-medium tracking-wide">
              Management Information System
            </span>
          </div>
        </div>
      </div>

      <!-- Center System Overview -->
      <div class="relative z-10 space-y-6 my-auto py-12 max-w-lg">
        <div class="space-y-3">
          <AppBadge
            variant="neutral"
            size="sm"
            class="bg-white/10 text-teal-200 border-teal-400/20"
          >
            Enterprise ERP Platform
          </AppBadge>
          <h1 class="text-2xl xl:text-3xl font-bold text-white tracking-tight leading-snug">
            Sistem Informasi Manajemen Terintegrasi
          </h1>
          <p class="text-sm text-slate-300 leading-relaxed">
            Kelola penjualan, persediaan, produksi, dan keuangan dalam satu sistem terintegrasi
            dengan performa tinggi dan tata kelola berbasis peran.
          </p>
        </div>

        <!-- System feature highlights -->
        <div class="space-y-3 pt-2">
          <div class="flex items-start gap-3 text-xs text-slate-200">
            <div class="p-1 rounded bg-teal-800/60 text-teal-300 shrink-0 mt-0.5">
              <CheckIcon class="w-3.5 h-3.5" />
            </div>
            <div>
              <strong class="font-semibold text-white block">Arsitektur Modular ERP</strong>
              <span>11 modul operasional dari Pengadaan hingga Keuangan & Pelaporan.</span>
            </div>
          </div>

          <div class="flex items-start gap-3 text-xs text-slate-200">
            <div class="p-1 rounded bg-teal-800/60 text-teal-300 shrink-0 mt-0.5">
              <CheckIcon class="w-3.5 h-3.5" />
            </div>
            <div>
              <strong class="font-semibold text-white block">Keamanan Berbasis Peran (RBAC)</strong>
              <span>Pembatasan hak akses granular sesuai wewenang operasional divisi.</span>
            </div>
          </div>

          <div class="flex items-start gap-3 text-xs text-slate-200">
            <div class="p-1 rounded bg-teal-800/60 text-teal-300 shrink-0 mt-0.5">
              <CheckIcon class="w-3.5 h-3.5" />
            </div>
            <div>
              <strong class="font-semibold text-white block">Standar Desain Konsisten</strong>
              <span>Antarmuka responsif ramah pengguna dengan density data enterprise.</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Metadata Footer -->
      <div
        class="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400"
      >
        <span>Impact Furniture ERP v2.0 • Sprint 2</span>
        <span>Internal Enterprise Network</span>
      </div>
    </div>

    <!-- RIGHT PANEL: LOGIN FORM (RESPONSIVE) -->
    <div
      class="flex-1 flex flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-12 xl:px-16 min-h-screen"
    >
      <div class="w-full max-w-md space-y-6">
        <!-- MOBILE BRANDING HEADER (Visible only on mobile/tablet < 1024px) -->
        <div class="lg:hidden text-center mb-4">
          <div
            class="inline-flex w-11 h-11 rounded-lg bg-primary text-white items-center justify-center font-bold text-sm shadow mb-2 border border-teal-400/20"
          >
            IF
          </div>
          <h2 class="text-lg font-bold text-content-primary">IMPACT FURNITURE</h2>
          <p class="text-xs text-content-secondary">Management Information System</p>
        </div>

        <!-- FORM CARD CONTAINER -->
        <div class="bg-surface border border-border rounded-card shadow-card p-6 sm:p-8">
          <!-- Heading -->
          <div class="mb-6">
            <h2 class="text-xl font-bold text-content-primary tracking-tight">Selamat Datang</h2>
            <p class="text-xs text-content-secondary mt-1">
              Masuk ke akun Anda untuk mengakses sistem ERP
            </p>
          </div>

          <!-- General Error Alert -->
          <div v-if="errors.general" class="mb-4">
            <AppAlert
              variant="danger"
              :title="errors.general"
              dismissible
              @dismiss="errors.general = undefined"
            />
          </div>

          <!-- Main Login Form -->
          <form class="space-y-4" novalidate @submit.prevent="handleLogin">
            <!-- Username Field -->
            <AppFormField id="login-username" label="Username" required :error="errors.username">
              <AppInput
                id="login-username"
                v-model="form.username"
                type="text"
                placeholder="Masukkan username"
                autocomplete="username"
                :disabled="isLoading"
                :invalid="Boolean(errors.username)"
                size="md"
              />
            </AppFormField>

            <!-- Password Field with Toggle -->
            <AppFormField id="login-password" label="Password" required :error="errors.password">
              <div class="relative w-full">
                <AppInput
                  id="login-password"
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Masukkan password"
                  autocomplete="current-password"
                  :disabled="isLoading"
                  :invalid="Boolean(errors.password)"
                  size="md"
                >
                  <template #suffix>
                    <button
                      type="button"
                      class="p-1 rounded text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors cursor-pointer"
                      :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
                      :title="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
                      tabindex="0"
                      @click="showPassword = !showPassword"
                    >
                      <EyeOffIcon v-if="showPassword" class="w-4 h-4" />
                      <EyeIcon v-else class="w-4 h-4" />
                    </button>
                  </template>
                </AppInput>
              </div>
            </AppFormField>

            <!-- Submit Button -->
            <div class="pt-2">
              <AppButton
                type="submit"
                variant="primary"
                block
                :loading="isLoading"
                :disabled="isLoading"
                size="md"
              >
                <template #left-icon>
                  <LoginIcon class="w-4 h-4" />
                </template>
                Masuk ke Sistem
              </AppButton>
            </div>
          </form>

          <!-- Security Notice -->
          <div
            class="mt-6 pt-4 border-t border-border flex items-center gap-2 text-[11px] text-content-secondary"
          >
            <LockIcon class="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Akses terbatas untuk personel terotorisasi Impact Furniture.</span>
          </div>
        </div>

        <!-- Footer Copyright -->
        <p class="text-center text-xs text-content-secondary">
          &copy; {{ new Date().getFullYear() }} PT Impact Furniture Indonesia. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</template>
