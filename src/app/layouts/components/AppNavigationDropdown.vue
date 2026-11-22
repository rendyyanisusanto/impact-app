<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import type { NavigationItem } from '@/app/navigation/navigation.types'
import { determineActiveState } from '@/app/navigation/navigation.utils'
import { ChevronDown as ChevronIcon } from 'lucide-vue-next'

interface Props {
  item: NavigationItem
  isOpen: boolean
  alignRight?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  alignRight: false
})

const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'open'): void
  (e: 'close'): void
}>()

const route = useRoute()
const triggerRef = ref<HTMLButtonElement | null>(null)

const isParentActive = computed(() => {
  return determineActiveState(props.item, route.path)
})

function handleTriggerKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    if (!props.isOpen) {
      emit('open')
    }
  } else if (event.key === 'Escape' && props.isOpen) {
    event.preventDefault()
    emit('close')
  }
}

function handleMenuKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
    triggerRef.value?.focus()
  }
}

function handleItemClick() {
  emit('close')
}
</script>

<template>
  <div class="relative inline-block text-left" @keydown="handleMenuKeydown">
    <!-- Dropdown Trigger Button -->
    <button
      ref="triggerRef"
      type="button"
      :aria-expanded="isOpen"
      aria-haspopup="true"
      :aria-label="item.label"
      class="px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 cursor-pointer"
      :class="[
        isParentActive || isOpen
          ? 'bg-[#28363E] text-white font-semibold'
          : 'text-slate-200 hover:bg-[#3E525E] hover:text-white'
      ]"
      @click="emit('toggle')"
      @keydown="handleTriggerKeydown"
    >
      <span>{{ item.label }}</span>
      <ChevronIcon
        class="w-3.5 h-3.5 text-slate-300 transition-transform duration-150"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <!-- Dropdown Menu List -->
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen && item.children && item.children.length > 0"
        class="absolute mt-1 w-64 rounded-lg bg-white border border-[#D9E0E7] shadow-dropdown py-1 z-50 text-[#1F2937] focus:outline-none max-h-[75vh] overflow-y-auto before:absolute before:-top-2 before:left-0 before:right-0 before:h-2 before:content-['']"
        :class="alignRight ? 'right-0' : 'left-0'"
      >
        <!-- Header Label -->
        <div
          class="px-3.5 py-2 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider border-b border-[#D9E0E7] bg-[#F8FAFC]"
        >
          {{ item.label }}
        </div>

        <!-- Submenu Links -->
        <div class="py-1">
          <RouterLink
            v-for="sub in item.children"
            :key="sub.id"
            :to="sub.route || sub.path || '#'"
            class="block px-3.5 py-2 text-xs transition-colors hover:bg-teal-50 hover:text-[#0F766E] focus:outline-none focus:bg-teal-50 focus:text-[#0F766E]"
            :class="[
              route.path === (sub.route || sub.path)
                ? 'bg-teal-50 text-[#0F766E] font-semibold border-l-2 border-[#0F766E]'
                : 'text-[#1F2937]'
            ]"
            @click="handleItemClick"
          >
            {{ sub.label }}
          </RouterLink>
        </div>
      </div>
    </Transition>
  </div>
</template>
