import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import DeliveryNoteDetailPage from '@/modules/delivery/pages/DeliveryNoteDetailPage.vue'
import DeliveryNotePrintPage from '@/modules/delivery/pages/DeliveryNotePrintPage.vue'
import { deliveryNoteService } from '@/modules/delivery/services/delivery-note.service'
import { useAuthStore } from '@/stores/auth.store'
import { MOCK_USERS } from '@/mocks/users.mock'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/delivery/notes', component: { template: '<div>List</div>' } },
    { path: '/delivery/notes/:id', component: DeliveryNoteDetailPage },
    { path: '/delivery/notes/:id/print', component: DeliveryNotePrintPage },
    { path: '/delivery/notes/:id/edit', component: { template: '<div>Edit</div>' } }
  ]
})

describe('Sprint 7 — DeliveryNoteDetailPage & DeliveryNotePrintPage', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    const authStore = useAuthStore()
    authStore.currentUser = { ...MOCK_USERS[0] }
    deliveryNoteService.resetMockData()
    await router.push('/delivery/notes/1')
    await router.isReady()
    await flushPromises()
  })

  it('1. renders detail page with header, KPI cards, and destination info', async () => {
    const wrapper = mount(DeliveryNoteDetailPage, {
      global: {
        plugins: [router, createPinia()]
      }
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Detail Surat Jalan: SJ/26/03/0312')
    expect(wrapper.find('[data-test="detail-shipping-status"]').text()).toBe('TERKIRIM')
    expect(wrapper.find('[data-test="detail-doc-status"]').text()).toBe('SUCCEEDED')
    expect(wrapper.text()).toContain('Hotel Grand Pelangi')
    expect(wrapper.text()).toContain('Pengiriman tahap 1 ke gudang customer')
  })

  it('2. renders read-only product items in spreadsheet without input fields', async () => {
    const wrapper = mount(DeliveryNoteDetailPage, {
      global: {
        plugins: [router, createPinia()]
      }
    })
    await flushPromises()

    const rows = wrapper.findAll('[data-test="delivery-item-row"]')
    expect(rows.length).toBeGreaterThan(0)
    // No edit input for qty kirim in read-only mode
    expect(wrapper.find('[data-test="input-qty-kirim"]').exists()).toBe(false)
  })

  it('3. renders proof of delivery image and recipient info on detail page', async () => {
    const wrapper = mount(DeliveryNoteDetailPage, {
      global: {
        plugins: [router, createPinia()]
      }
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Bukti Penerimaan Barang')
    expect(wrapper.text()).toContain('Pak Hendro')
  })

  it('4. renders print page with company letterhead, logistics table without prices, and 4 signatures', async () => {
    await router.push('/delivery/notes/1/print')
    await router.isReady()
    await flushPromises()

    const wrapper = mount(DeliveryNotePrintPage, {
      global: {
        plugins: [router, createPinia()]
      }
    })
    await flushPromises()

    expect(wrapper.text()).toContain('IMPACT FURNITURE')
    expect(wrapper.text()).toContain('SURAT JALAN')
    expect(wrapper.text()).toContain('SJ/26/03/0312')
    expect(wrapper.text()).toContain('Tanda Terima / Penerima')
    expect(wrapper.text()).toContain('Pengemudi / Ekspedisi')
    expect(wrapper.text()).toContain('Bagian Gudang')
    expect(wrapper.text()).toContain('Hormat Kami')

    // Strict logistics check: print page MUST NOT contain prices (Harga, Subtotal, Rp)
    expect(wrapper.find('thead').text()).not.toContain('Harga')
    expect(wrapper.find('thead').text()).not.toContain('Subtotal')
    expect(wrapper.find('tbody').text()).not.toContain('Rp')
  })

  it('5. triggers window.print when Cetak button is clicked', async () => {
    await router.push('/delivery/notes/1/print')
    await router.isReady()
    await flushPromises()

    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})

    const wrapper = mount(DeliveryNotePrintPage, {
      global: {
        plugins: [router, createPinia()]
      }
    })
    await flushPromises()

    const printBtn = wrapper.find('[data-test="btn-trigger-print"]')
    expect(printBtn.exists()).toBe(true)
    await printBtn.trigger('click')

    expect(printSpy).toHaveBeenCalled()
    printSpy.mockRestore()
  })
})
