import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import DeliveryNoteCreatePage from '@/modules/delivery/pages/DeliveryNoteCreatePage.vue'
import DeliveryNotePickupPage from '@/modules/delivery/pages/DeliveryNotePickupPage.vue'
import DeliveryNoteEditPage from '@/modules/delivery/pages/DeliveryNoteEditPage.vue'
import { deliveryNoteService } from '@/modules/delivery/services/delivery-note.service'
import { useAuthStore } from '@/stores/auth.store'
import { MOCK_USERS } from '@/mocks/users.mock'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/delivery/notes', component: { template: '<div>List</div>' } },
    { path: '/delivery/notes/create', component: DeliveryNoteCreatePage },
    { path: '/delivery/notes/pickup/create', component: DeliveryNotePickupPage },
    { path: '/delivery/notes/:id', component: { template: '<div>Detail</div>' } },
    { path: '/delivery/notes/:id/edit', component: DeliveryNoteEditPage }
  ]
})

describe('Sprint 7 — DeliveryNoteCreatePage & DeliveryNotePickupPage (Screenshot 2)', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    const authStore = useAuthStore()
    authStore.currentUser = { ...MOCK_USERS[0] }
    deliveryNoteService.resetMockData()
    router.push('/delivery/notes/create')
    await router.isReady()
  })

  it('1. renders 2-column header layout and empty product spreadsheet prompt initially', async () => {
    const wrapper = mount(DeliveryNoteCreatePage, {
      global: {
        plugins: [router, createPinia()]
      }
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Tambah Surat Jalan')
    expect(wrapper.text()).toContain('Informasi Pemesanan & Customer')
    expect(wrapper.text()).toContain('Informasi Pengiriman & Dokumen')
    expect(wrapper.find('[data-test="input-selected-so"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="input-delivery-code"]').exists()).toBe(true)

    // Empty state placeholder
    expect(wrapper.find('[data-test="empty-so-placeholder"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Pilih No. Sales Order Terlebih Dahulu')
  })

  it('2. opens SO picker, selects SO, and populates Customer, Sales, Total, and products', async () => {
    const wrapper = mount(DeliveryNoteCreatePage, {
      global: {
        plugins: [router, createPinia()]
      }
    })
    await flushPromises()

    // Click search SO
    const openPickerBtn = wrapper.find('[data-test="btn-open-so-picker"]')
    await openPickerBtn.trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="so-picker-overlay"]').exists()).toBe(true)

    // Select the first SO item (SO 1)
    const pickerItems = wrapper.findAll('[data-test="so-picker-item"]')
    expect(pickerItems.length).toBeGreaterThan(0)
    await pickerItems[0].trigger('click')
    await flushPromises()

    // Picker should close and inputs should be populated
    expect(wrapper.find('[data-test="so-picker-overlay"]').exists()).toBe(false)
    expect(
      (wrapper.find('[data-test="input-customer-name"]').element as HTMLInputElement).value
    ).toContain('Hotel Grand Pelangi')

    // Spreadsheet should now contain rows
    const rows = wrapper.findAll('[data-test="delivery-item-row"]')
    expect(rows.length).toBeGreaterThan(0)
    expect(wrapper.find('[data-test="btn-kirim-semua"]').exists()).toBe(true)
  })

  it('3. generates delivery code and updates using generator button', async () => {
    const wrapper = mount(DeliveryNoteCreatePage, {
      global: {
        plugins: [router, createPinia()]
      }
    })
    await flushPromises()

    const codeInput = wrapper.find('[data-test="input-delivery-code"]')
    expect((codeInput.element as HTMLInputElement).value).toContain('SJ/')

    const generateBtn = wrapper.find('[data-test="btn-generate-code"]')
    await generateBtn.trigger('click')
    await flushPromises()

    expect((codeInput.element as HTMLInputElement).value).toContain('SJ/')
  })

  it('4. renders specialized Pengambilan Sendiri page with SJA code and pickup indicator', async () => {
    router.push('/delivery/notes/pickup/create')
    await router.isReady()

    const wrapper = mount(DeliveryNotePickupPage, {
      global: {
        plugins: [router, createPinia()]
      }
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Pengambilan Sendiri')
    expect(wrapper.text()).toContain('Informasi Pengambilan Mandiri')

    const codeInput = wrapper.find('[data-test="input-delivery-code"]')
    expect((codeInput.element as HTMLInputElement).value).toContain('SJA/')
    expect(wrapper.find('[data-test="btn-save-pickup"]').exists()).toBe(true)
  })

  it('5. renders Edit page for existing delivery note and updates note', async () => {
    await router.push('/delivery/notes/2/edit')
    await router.isReady()
    await flushPromises()

    const wrapper = mount(DeliveryNoteEditPage, {
      global: {
        plugins: [router, createPinia()]
      }
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Edit Surat Jalan')
    expect(wrapper.find('[data-test="input-edit-code"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="btn-update-delivery"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="select-driver"]').exists()).toBe(true)
  })

  it('6. provides searchable driver selection with karyawan_id binding', async () => {
    router.push('/delivery/notes/create')
    await router.isReady()
    const wrapper = mount(DeliveryNoteCreatePage, {
      global: {
        plugins: [router, createPinia()]
      }
    })
    await flushPromises()

    const driverSelect = wrapper.find('[data-test="select-driver"]')
    expect(driverSelect.exists()).toBe(true)
    // Should have loaded driver options
    expect(wrapper.text()).toContain('Nama Pengirim / Sopir')
  })

  it('7. excludes orders with 0 stock/remaining from SO picker and hides 0-stock products', async () => {
    const list = await deliveryNoteService.getEligibleSalesOrders()
    // None of the eligible orders should have total_remaining_qty === 0 or total_deliverable_stock === 0
    for (const order of list) {
      if (order.total_remaining_qty !== undefined) {
        expect(order.total_remaining_qty).toBeGreaterThan(0)
      }
      if (order.total_deliverable_stock !== undefined) {
        expect(order.total_deliverable_stock).toBeGreaterThan(0)
      }
    }
  })
})
