import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUiStore } from '@/stores/ui.store'

describe('ui.store.ts', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with default isMobileNavigationOpen = false', () => {
    const store = useUiStore()
    expect(store.isMobileNavigationOpen).toBe(false)
  })

  it('toggles mobile navigation state via toggleMobileNavigation action', () => {
    const store = useUiStore()
    expect(store.isMobileNavigationOpen).toBe(false)

    store.toggleMobileNavigation()
    expect(store.isMobileNavigationOpen).toBe(true)

    store.toggleMobileNavigation()
    expect(store.isMobileNavigationOpen).toBe(false)
  })

  it('sets mobile navigation state directly via setMobileNavigation action', () => {
    const store = useUiStore()
    store.setMobileNavigation(true)
    expect(store.isMobileNavigationOpen).toBe(true)

    store.setMobileNavigation(false)
    expect(store.isMobileNavigationOpen).toBe(false)
  })
})
