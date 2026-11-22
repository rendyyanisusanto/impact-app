import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import DeliveryNoteListPage from '@/modules/delivery/pages/DeliveryNoteListPage.vue'
import { deliveryNoteService } from '@/modules/delivery/services/delivery-note.service'
import { useAuthStore } from '@/stores/auth.store'
import { MOCK_USERS } from '@/mocks/users.mock'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/delivery/notes', component: { template: '<div>List</div>' } },
    { path: '/delivery/notes/create', component: { template: '<div>Create</div>' } },
    { path: '/delivery/notes/pickup/create', component: { template: '<div>Pickup</div>' } },
    { path: '/delivery/notes/:id', component: { template: '<div>Detail</div>' } },
    { path: '/delivery/notes/:id/edit', component: { template: '<div>Edit</div>' } },
    { path: '/delivery/notes/:id/print', component: { template: '<div>Print</div>' } }
  ]
})

describe('Sprint 7 — DeliveryNoteListPage (Daftar Surat Jalan & Screenshot 1)', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    const authStore = useAuthStore()
    authStore.currentUser = { ...MOCK_USERS[0] } // Superadmin
    deliveryNoteService.resetMockData()
    router.push('/delivery/notes')
    await router.isReady()
  })

  it('1. renders PageHeader and toolbar buttons matching Screenshot 1', async () => {
    const wrapper = mount(DeliveryNoteListPage, {
      global: {
        plugins: [router, createPinia()]
      }
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Surat Jalan')
    expect(wrapper.find('[data-test="btn-create-delivery"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="btn-create-pickup"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="btn-export-pdf"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="btn-export-excel"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="btn-refresh"]').exists()).toBe(true)
  })

  it('2. renders 13-column table headers according to legacy specification', async () => {
    const wrapper = mount(DeliveryNoteListPage, {
      global: {
        plugins: [router, createPinia()]
      }
    })
    await flushPromises()

    const headers = wrapper.findAll('thead th').map(th => th.text())
    expect(headers).toContain('Tanggal')
    expect(headers).toContain('Kode')
    expect(headers).toContain('No. SO')
    expect(headers).toContain('Customer')
    expect(headers).toContain('Keterangan')
    expect(headers).toContain('QTY Pemesanan')
    expect(headers).toContain('QTY Pengiriman')
    expect(headers).toContain('Total')
    expect(headers).toContain('Status Pengiriman')
    expect(headers).toContain('Bukti Pengiriman')
    expect(headers).toContain('Status Dokumen')
    expect(headers).toContain('Aksi')
  })

  it('3. renders data rows and formats shipping and document status badges', async () => {
    const wrapper = mount(DeliveryNoteListPage, {
      global: {
        plugins: [router, createPinia()]
      }
    })
    await flushPromises()

    const rows = wrapper.findAll('[data-test="delivery-row"]')
    expect(rows.length).toBeGreaterThanOrEqual(3)

    // Check presence of status badges
    expect(wrapper.text()).toContain('TERKIRIM')
    expect(wrapper.text()).toContain('BELUM DIKIRIM')
    expect(wrapper.text()).toContain('AMBIL SENDIRI')
  })

  it('4. filters list dynamically when searching by keyword', async () => {
    const wrapper = mount(DeliveryNoteListPage, {
      global: {
        plugins: [router, createPinia()]
      }
    })
    await flushPromises()

    const searchInput = wrapper.find('[data-test="input-search"]')
    await searchInput.setValue('PL/03/0069')
    await flushPromises()

    const rows = wrapper.findAll('[data-test="delivery-row"]')
    expect(rows.length).toBe(1)
    expect(wrapper.text()).toContain('SJ/26/PL/03/0069')
  })

  it('5. opens proof modal when clicking Lihat on item with proof', async () => {
    const wrapper = mount(DeliveryNoteListPage, {
      global: {
        plugins: [router, createPinia()]
      }
    })
    await flushPromises()

    const proofBtn = wrapper.find('[data-test="btn-view-proof"]')
    expect(proofBtn.exists()).toBe(true)
    await proofBtn.trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="proof-modal-overlay"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Bukti Pengiriman Barang')
  })

  it('6. triggers cancel dialog when action cancel is clicked', async () => {
    const wrapper = mount(DeliveryNoteListPage, {
      global: {
        plugins: [router, createPinia()]
      }
    })
    await flushPromises()

    const cancelBtns = wrapper.findAll('[data-test="action-cancel"]')
    expect(cancelBtns.length).toBeGreaterThan(0)
    await cancelBtns[0].trigger('click')
    await flushPromises()

    expect(document.body.textContent).toContain('Batalkan Surat Jalan')
  })
})
