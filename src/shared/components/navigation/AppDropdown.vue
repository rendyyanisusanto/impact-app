<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

export interface AppDropdownProps {
  align?: 'left' | 'right'
  width?: string
  closeOnClick?: boolean
}

const props = withDefaults(defineProps<AppDropdownProps>(), {
  align: 'left',
  width: 'w-56',
  closeOnClick: true
})

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

function toggle() {
  isOpen.value = !isOpen.value
}

function close() {
  isOpen.value = false
}

function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    close()
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (!isOpen.value) return

  if (event.key === 'Escape') {
    close()
    event.stopPropagation()
  } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    if (!dropdownRef.value) return
    const menuItems = dropdownRef.value.querySelectorAll<HTMLElement>(
      'a[role="menuitem"], button[role="menuitem"], [tabindex="0"]'
    )
    if (menuItems.length === 0) return

    const currentIndex = Array.from(menuItems).indexOf(document.activeElement as HTMLElement)
    let nextIndex = 0

    if (event.key === 'ArrowDown') {
      nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0
    } else {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1
    }

    menuItems[nextIndex]?.focus()
  }
}

function handleContentClick() {
  if (props.closeOnClick) {
    close()
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('click', handleClickOutside)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('click', handleClickOutside)
  }
})

defineExpose({
  isOpen,
  toggle,
  close
})
</script>

<template>
  <div ref="dropdownRef" class="relative inline-block text-left" @keydown="handleKeyDown">
    <div role="button" :aria-expanded="isOpen" aria-haspopup="true" @click.stop="toggle">
      <slot name="trigger" :is-open="isOpen" />
    </div>

    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen"
        class="absolute z-40 mt-1.5 rounded-card bg-surface border border-border shadow-dropdown py-1 focus:outline-none"
        :class="[align === 'right' ? 'right-0' : 'left-0', width]"
        role="menu"
        aria-orientation="vertical"
        tabindex="-1"
        @click="handleContentClick"
      >
        <slot :close="close" />
      </div>
    </Transition>
  </div>
</template>
