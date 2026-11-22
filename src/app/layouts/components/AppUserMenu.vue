<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import type { AuthUser } from '@/shared/types/auth.types'
import {
  User as UserIcon,
  Settings as SettingsIcon,
  ChevronDown as ChevronDownIcon,
  LogOut as LogOutIcon,
  ShieldCheck as ShieldIcon,
  Loader2 as LoaderIcon
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const user = computed<AuthUser | null>(() => {
  return authStore.currentUser || (authStore.user as AuthUser | null)
})

const userName = computed<string>(() => {
  return user.value?.name || user.value?.username || 'Pengguna'
})

const userRole = computed<string>(() => {
  return user.value?.roleName || user.value?.role || authStore.userRole || 'User'
})

const initials = computed<string>(() => {
  if (user.value && 'initials' in user.value && (user.value as { initials?: string }).initials) {
    return (user.value as { initials?: string }).initials!
  }
  const name = userName.value.trim()
  if (name.toLowerCase() === 'superadmin' || userRole.value.toLowerCase() === 'superadmin') {
    return 'SA'
  }
  const parts = name.split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase() || 'IF'
})

const isOpen = ref(false)
const isLoggingOut = ref(false)
const menuContainerRef = ref<HTMLElement | null>(null)
const triggerButtonRef = ref<HTMLButtonElement | null>(null)

function toggleMenu() {
  isOpen.value = !isOpen.value
}

function closeMenu() {
  isOpen.value = false
}

function handleClickOutside(event: MouseEvent) {
  if (
    menuContainerRef.value &&
    event.target instanceof Node &&
    !menuContainerRef.value.contains(event.target)
  ) {
    closeMenu()
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isOpen.value) {
    closeMenu()
    triggerButtonRef.value?.focus()
  }
}

async function handleLogout() {
  if (isLoggingOut.value) return
  isLoggingOut.value = true
  try {
    await authStore.logout()
    closeMenu()
    await router.push('/login')
  } catch (err) {
    console.error('Logout error:', err)
  } finally {
    isLoggingOut.value = false
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('click', handleClickOutside)
    window.addEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('click', handleClickOutside)
    window.removeEventListener('keydown', handleKeydown)
  }
})
</script>

<template>
  <div ref="menuContainerRef" class="relative inline-block text-left">
    <!-- Trigger Button -->
    <button
      ref="triggerButtonRef"
      type="button"
      :aria-expanded="isOpen"
      aria-haspopup="menu"
      aria-label="User profile menu"
      class="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white/10 transition-colors text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 cursor-pointer"
      @click="toggleMenu"
    >
      <div
        class="w-7 h-7 rounded-full bg-gradient-to-br from-[#0F766E] to-[#115E59] text-white flex items-center justify-center text-xs font-bold border border-teal-300/40 shadow-xs select-none"
      >
        {{ initials }}
      </div>
      <div class="hidden sm:flex flex-col text-left">
        <span class="text-xs font-semibold leading-tight truncate max-w-[120px]">
          {{ userName }}
        </span>
        <span class="text-[10px] text-slate-300 capitalize leading-tight">
          {{ userRole }}
        </span>
      </div>
      <ChevronDownIcon
        class="w-3.5 h-3.5 text-slate-300 transition-transform duration-200"
        :class="{ 'rotate-180 text-white': isOpen }"
      />
    </button>

    <!-- Dropdown Menu -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="transform scale-95 opacity-0 -translate-y-1"
      enter-to-class="transform scale-100 opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="transform scale-100 opacity-100 translate-y-0"
      leave-to-class="transform scale-95 opacity-0 -translate-y-1"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 mt-1 w-64 rounded-lg bg-white border border-[#D9E0E7] border-t-2 border-t-[#0F766E] shadow-xl py-1 z-50 text-[#1F2937] focus:outline-none ring-1 ring-black/5"
        role="menu"
        aria-orientation="vertical"
      >
        <!-- User Info Header -->
        <div class="px-3.5 py-2.5 border-b border-[#D9E0E7] bg-[#F8FAFC]">
          <div class="flex items-center gap-2.5">
            <div
              class="w-8 h-8 rounded-full bg-gradient-to-br from-[#0F766E] to-[#115E59] text-white flex items-center justify-center text-xs font-bold shrink-0"
            >
              {{ initials }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-bold text-[#1F2937] truncate">
                {{ userName }}
              </p>
              <p class="text-[11px] text-[#64748B] truncate">
                {{
                  user?.email ||
                  (user?.username ? `@${user.username}` : 'admin@impactfurniture.co.id')
                }}
              </p>
            </div>
          </div>
          <div
            class="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/80 w-fit"
          >
            <ShieldIcon class="w-3 h-3 text-teal-700" />
            <span>Role: {{ userRole }}</span>
          </div>
        </div>

        <!-- Links -->
        <div class="py-1 border-b border-[#D9E0E7]">
          <RouterLink
            to="/system/edit-account"
            class="flex items-center gap-2.5 mx-1 px-3 py-1.5 rounded-md text-xs text-[#1F2937] hover:bg-teal-50/80 hover:text-primary transition-colors focus:bg-teal-50 focus:text-primary focus:outline-none"
            role="menuitem"
            @click="closeMenu"
          >
            <UserIcon class="w-4 h-4 text-[#64748B]" />
            <span>Profil Saya</span>
          </RouterLink>

          <RouterLink
            to="/settings/app"
            class="flex items-center gap-2.5 mx-1 px-3 py-1.5 rounded-md text-xs text-[#1F2937] hover:bg-teal-50/80 hover:text-primary transition-colors focus:bg-teal-50 focus:text-primary focus:outline-none"
            role="menuitem"
            @click="closeMenu"
          >
            <SettingsIcon class="w-4 h-4 text-[#64748B]" />
            <span>Pengaturan Akun</span>
          </RouterLink>
        </div>

        <!-- Logout Action -->
        <div class="py-1 px-1">
          <button
            type="button"
            :disabled="isLoggingOut"
            class="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold text-rose-700 hover:bg-rose-50 hover:text-rose-800 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
            role="menuitem"
            @click="handleLogout"
          >
            <LoaderIcon v-if="isLoggingOut" class="w-3.5 h-3.5 animate-spin text-rose-600" />
            <LogOutIcon v-else class="w-3.5 h-3.5 text-rose-600" />
            <span>{{ isLoggingOut ? 'Sedang Keluar...' : 'Keluar (Logout)' }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
