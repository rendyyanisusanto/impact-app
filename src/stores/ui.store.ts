import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const isMobileNavigationOpen = ref(false)

  // Alias computed to support both naming styles
  const isMobileNavOpen = computed({
    get: () => isMobileNavigationOpen.value,
    set: val => {
      isMobileNavigationOpen.value = val
    }
  })

  function toggleMobileNavigation() {
    isMobileNavigationOpen.value = !isMobileNavigationOpen.value
  }

  function setMobileNavigation(isOpen: boolean) {
    isMobileNavigationOpen.value = isOpen
  }

  function openMobileNavigation() {
    setMobileNavigation(true)
  }

  function closeMobileNavigation() {
    setMobileNavigation(false)
  }

  function toggleMobileNav() {
    toggleMobileNavigation()
  }

  function closeMobileNav() {
    setMobileNavigation(false)
  }

  function openMobileNav() {
    setMobileNavigation(true)
  }

  return {
    isMobileNavigationOpen,
    isMobileNavOpen,
    toggleMobileNavigation,
    setMobileNavigation,
    openMobileNavigation,
    closeMobileNavigation,
    toggleMobileNav,
    closeMobileNav,
    openMobileNav
  }
})
