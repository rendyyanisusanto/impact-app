<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { NAVIGATION_ITEMS } from '@/app/navigation/navigation.config'
import { determineActiveState } from '@/app/navigation/navigation.utils'
import { filterNavigationByPermissions } from '@/shared/utils/permissions'
import { X as CloseIcon, ChevronDown as ChevronIcon } from 'lucide-vue-next'

const route = useRoute()
const uiStore = useUiStore()
const authStore = useAuthStore()

const visibleNavigationItems = computed(() => {
  return filterNavigationByPermissions(NAVIGATION_ITEMS, authStore.currentUser)
})

const openModuleIds = ref<Record<string, boolean>>({})
const closeButtonRef = ref<HTMLButtonElement | null>(null)

function toggleModule(id: string) {
  openModuleIds.value[id] = !openModuleIds.value[id]
}

// Auto-expand active module when route changes or initially
watch(
  () => route.path,
  path => {
    for (const item of visibleNavigationItems.value) {
      if (item.children && determineActiveState(item, path)) {
        openModuleIds.value[item.id] = true
      }
    }
  },
  { immediate: true }
)

// Handle background scroll lock and focus management
watch(
  () => uiStore.isMobileNavOpen,
  async isOpen => {
    if (typeof document !== 'undefined') {
      if (isOpen) {
        document.body.style.overflow = 'hidden'
        await nextTick()
        closeButtonRef.value?.focus()
      } else {
        document.body.style.overflow = ''
      }
    }
  }
)

function handleLinkClick() {
  uiStore.closeMobileNav()
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && uiStore.isMobileNavOpen) {
    uiStore.closeMobileNav()
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown)
  }
})

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeyDown)
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="uiStore.isMobileNavOpen"
        class="fixed inset-0 z-50 flex lg:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Menu Navigasi Mobile"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          aria-hidden="true"
          @click="uiStore.closeMobileNav"
        />

        <!-- Drawer Content -->
        <div
          class="relative flex-1 flex flex-col max-w-xs w-full bg-[#34454F] text-slate-100 shadow-2xl z-10 overflow-y-auto"
        >
          <!-- Drawer Header -->
          <div
            class="p-4 border-b border-[#28363E] flex items-center justify-between bg-[#28363E]/60"
          >
            <div class="flex items-center gap-2.5">
              <div
                class="w-7 h-7 rounded-md bg-gradient-to-br from-[#0F766E] to-[#115E59] flex items-center justify-center text-white font-bold text-xs shadow-xs"
              >
                IF
              </div>
              <div class="flex flex-col">
                <span class="font-bold text-xs tracking-wider text-white"> Impact Furniture </span>
                <span class="text-[9px] text-teal-300 font-medium"> Management System </span>
              </div>
            </div>
            <button
              ref="closeButtonRef"
              type="button"
              class="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
              aria-label="Tutup menu navigasi"
              @click="uiStore.closeMobileNav"
            >
              <CloseIcon class="w-5 h-5" />
            </button>
          </div>

          <!-- Drawer Navigation Items -->
          <div class="p-2 space-y-1">
            <template v-for="item in visibleNavigationItems" :key="item.id">
              <!-- Single Item (Dashboard) -->
              <RouterLink
                v-if="!item.children || item.children.length === 0"
                :to="item.route || item.path || '#'"
                class="block px-3 py-2 rounded-md text-xs font-medium transition-colors"
                :class="[
                  route.path === (item.route || item.path)
                    ? 'bg-[#28363E] text-white font-semibold border-l-2 border-[#0F766E]'
                    : 'text-slate-200 hover:bg-white/5 hover:text-white'
                ]"
                @click="handleLinkClick"
              >
                {{ item.label }}
              </RouterLink>

              <!-- Parent Item (Accordion) -->
              <div v-else class="rounded-md overflow-hidden">
                <button
                  type="button"
                  :aria-expanded="!!openModuleIds[item.id]"
                  class="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/5 transition-colors cursor-pointer"
                  @click="toggleModule(item.id)"
                >
                  <span
                    :class="{
                      'text-teal-300 font-semibold': determineActiveState(item, route.path)
                    }"
                  >
                    {{ item.label }}
                  </span>
                  <ChevronIcon
                    class="w-3.5 h-3.5 text-slate-400 transition-transform duration-150"
                    :class="{ 'rotate-180': openModuleIds[item.id] }"
                  />
                </button>

                <div
                  v-if="openModuleIds[item.id]"
                  class="pl-4 pr-1 py-1 space-y-0.5 bg-[#28363E]/60 border-l-2 border-[#0F766E] ml-2 my-0.5 rounded-r"
                >
                  <RouterLink
                    v-for="sub in item.children"
                    :key="sub.id"
                    :to="sub.route || sub.path || '#'"
                    class="block px-3 py-1.5 rounded text-xs transition-colors"
                    :class="[
                      route.path === (sub.route || sub.path)
                        ? 'text-teal-300 font-semibold bg-white/10'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    ]"
                    @click="handleLinkClick"
                  >
                    {{ sub.label }}
                  </RouterLink>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
