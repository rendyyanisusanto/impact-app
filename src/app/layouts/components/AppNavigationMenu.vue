<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { NAVIGATION_ITEMS } from '@/app/navigation/navigation.config'
import type { NavigationItem } from '@/app/navigation/navigation.types'
import { determineActiveState } from '@/app/navigation/navigation.utils'
import { filterNavigationByPermissions } from '@/shared/utils/permissions'
import { ChevronDown as ChevronIcon, ChevronRight as ChevronRightIcon } from 'lucide-vue-next'

const route = useRoute()
const authStore = useAuthStore()

const visibleNavigationItems = computed(() => {
  return filterNavigationByPermissions(NAVIGATION_ITEMS, authStore.currentUser)
})

// Active dropdown state
const activeDropdownId = ref<string | null>(null)
const navContainerRef = ref<HTMLElement | null>(null)
let closeTimer: ReturnType<typeof setTimeout> | null = null

function openDropdown(id: string) {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
  activeDropdownId.value = id
}

function closeDropdownWithDelay() {
  if (closeTimer) {
    clearTimeout(closeTimer)
  }
  closeTimer = setTimeout(() => {
    activeDropdownId.value = null
    closeTimer = null
  }, 180)
}

function cancelCloseDropdown() {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

function toggleDropdown(id: string) {
  cancelCloseDropdown()
  if (activeDropdownId.value === id) {
    activeDropdownId.value = null
  } else {
    activeDropdownId.value = id
  }
}

function closeAllDropdowns() {
  cancelCloseDropdown()
  activeDropdownId.value = null
}

function isItemActive(item: NavigationItem): boolean {
  return determineActiveState(item, route.path)
}

function handleClickOutside(event: MouseEvent) {
  if (navContainerRef.value && !navContainerRef.value.contains(event.target as Node)) {
    closeAllDropdowns()
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeAllDropdowns()
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('click', handleClickOutside)
    window.addEventListener('keydown', handleKeyDown)
  }
})

onUnmounted(() => {
  if (closeTimer) {
    clearTimeout(closeTimer)
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('click', handleClickOutside)
    window.removeEventListener('keydown', handleKeyDown)
  }
})
</script>

<template>
  <div ref="navContainerRef" class="flex items-center space-x-1 py-1 overflow-visible">
    <template v-for="(item, index) in visibleNavigationItems" :key="item.id">
      <!-- Item without children (Dashboard) -->
      <RouterLink
        v-if="!item.children || item.children.length === 0"
        :to="item.route || item.path || '#'"
        class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
        :class="[
          isItemActive(item)
            ? 'bg-navbar-darker text-white font-semibold shadow-inner border-b-2 border-primary'
            : 'text-slate-200 hover:bg-[#3E525E] hover:text-white'
        ]"
        @click="closeAllDropdowns"
      >
        {{ item.label }}
      </RouterLink>

      <!-- Item with children (Dropdown) -->
      <div
        v-else
        class="relative inline-block text-left"
        @mouseenter="openDropdown(item.id)"
        @mouseleave="closeDropdownWithDelay"
      >
        <button
          type="button"
          :aria-expanded="activeDropdownId === item.id"
          aria-haspopup="true"
          class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 cursor-pointer"
          :class="[
            isItemActive(item) || activeDropdownId === item.id
              ? 'bg-navbar-darker text-white font-semibold'
              : 'text-slate-200 hover:bg-[#3E525E] hover:text-white'
          ]"
          @click.stop="toggleDropdown(item.id)"
        >
          <span>{{ item.label }}</span>
          <ChevronIcon
            class="w-3.5 h-3.5 text-slate-300 transition-transform duration-200"
            :class="{ 'rotate-180 text-white': activeDropdownId === item.id }"
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
            v-if="activeDropdownId === item.id"
            class="absolute mt-1 w-64 rounded-lg bg-white border border-[#D9E0E7] border-t-2 border-t-[#0F766E] shadow-xl py-1 z-50 text-[#1F2937] focus:outline-none max-h-[75vh] overflow-y-auto before:absolute before:-top-2 before:left-0 before:right-0 before:h-2 before:content-[''] ring-1 ring-black/5"
            :class="index >= NAVIGATION_ITEMS.length - 3 ? 'right-0' : 'left-0'"
            role="menu"
            @mouseenter="cancelCloseDropdown"
            @mouseleave="closeDropdownWithDelay"
          >
            <!-- Header Label with Submenu Count -->
            <div
              class="px-3.5 py-2 text-[11px] font-bold text-[#64748B] uppercase tracking-wider border-b border-[#D9E0E7] bg-[#F8FAFC] flex items-center justify-between"
            >
              <span>{{ item.label }}</span>
              <span class="text-[10px] font-normal text-slate-400 lowercase">
                {{ item.children?.length ?? 0 }} menu
              </span>
            </div>

            <!-- Submenu Links -->
            <div class="py-1">
              <RouterLink
                v-for="sub in item.children"
                :key="sub.id"
                :to="sub.route || sub.path || '#'"
                class="group mx-1 my-0.5 px-3 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between hover:bg-teal-50/80 hover:text-primary focus:outline-none focus:bg-teal-50 focus:text-primary"
                :class="[
                  route.path === (sub.route || sub.path)
                    ? 'bg-teal-50 text-primary font-semibold border-l-2 border-primary'
                    : 'text-[#1F2937]'
                ]"
                role="menuitem"
                @click="closeAllDropdowns"
              >
                <span>{{ sub.label }}</span>
                <ChevronRightIcon
                  class="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:text-primary transition-opacity"
                />
              </RouterLink>
            </div>
          </div>
        </Transition>
      </div>
    </template>
  </div>
</template>
