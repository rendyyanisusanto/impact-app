import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import GroupListPage from '@/modules/system/groups/pages/GroupListPage.vue'
import GroupCreatePage from '@/modules/system/groups/pages/GroupCreatePage.vue'
import GroupEditPage from '@/modules/system/groups/pages/GroupEditPage.vue'
import GroupDetailPage from '@/modules/system/groups/pages/GroupDetailPage.vue'
import { groupService } from '@/modules/system/groups/services/group.service'
import { useAuthStore } from '@/stores/auth.store'
import { MOCK_USERS } from '@/mocks/users.mock'
import { createRouter, createMemoryHistory } from 'vue-router'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/system/groups', name: 'system-groups', component: GroupListPage },
    { path: '/system/groups/create', name: 'system-groups-create', component: GroupCreatePage },
    { path: '/system/groups/:id', name: 'system-groups-detail', component: GroupDetailPage },
    { path: '/system/groups/:id/edit', name: 'system-groups-edit', component: GroupEditPage }
  ]
})

describe('Sprint 9 — Task 1–4: Group End-to-End Workflow & RBAC', () => {
  let authStore: ReturnType<typeof useAuthStore>

  beforeEach(async () => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    authStore.currentUser = MOCK_USERS[0] // Superadmin
    groupService.resetToInitialSeeds()
    await router.push('/system/groups')
    await router.isReady()
  })

  it('executes full 14-step integration test: List -> Create -> Detail -> Edit -> Delete Protection -> RBAC', async () => {
    // 1. Load GroupListPage
    const listWrapper = mount(GroupListPage, {
      global: { plugins: [router] }
    })
    await flushPromises()

    expect(listWrapper.text()).toContain('Master Data Groups (Role Access)')
    expect(listWrapper.text()).toContain('Tambah Groups')
    expect(listWrapper.text()).toContain('ADMIN')
    expect(listWrapper.text()).toContain('GUDANG')

    // 2. Search filter
    const searchInput = listWrapper.find('input[type="text"]')
    await searchInput.setValue('gudang')
    await flushPromises()
    expect(listWrapper.text()).toContain('GUDANG')

    // 3. Mount GroupCreatePage
    await router.push('/system/groups/create')
    await flushPromises()

    const createWrapper = mount(GroupCreatePage, {
      global: { plugins: [router] }
    })
    await flushPromises()

    expect(createWrapper.text()).toContain('Master Data Groups - TAMBAH DATA')

    // 4. Fill group info
    const inputs = createWrapper.findAll('input[type="text"]')
    await inputs[0].setValue('Staff QC') // Name
    await inputs[1].setValue('Divisi Quality Control Bahan') // Description

    // 5. Select dashboard widget
    const widgetCheckbox = createWrapper.find('input[aria-label="Pilih widget All Top Spender"]')
    expect(widgetCheckbox.exists()).toBe(true)
    await widgetCheckbox.setValue(true)
    await flushPromises()

    // 6. Grant Create & Read on Purchase Order (id: 4)
    const poCreateCb = createWrapper.find('input[aria-label="Create Purchase Order"]')
    const poReadCb = createWrapper.find('input[aria-label="Read Purchase Order"]')
    expect(poCreateCb.exists()).toBe(true)
    expect(poReadCb.exists()).toBe(true)
    await poCreateCb.setValue(true)
    await poReadCb.setValue(true)
    await flushPromises()

    // 7. Verify reactive summary
    expect(createWrapper.text()).toContain('Akses Read (R)')
    expect(createWrapper.text()).toContain('Create (C)')

    // 8. Submit form
    const submitBtn = createWrapper.findAll('button').find((b) => b.text().includes('Simpan Data'))
    expect(submitBtn).toBeDefined()
    await submitBtn?.trigger('click')
    await flushPromises()

    // 9. Verify created in service
    const allGroups = await groupService.getAll({ search: 'Staff QC' })
    const createdQC = allGroups.items.find((g) => g.name === 'Staff QC')
    expect(createdQC).toBeDefined()
    expect(createdQC?.description).toBe('Divisi Quality Control Bahan')

    // 10. Mount GroupDetailPage for created group
    await router.push(`/system/groups/${createdQC!.id}`)
    await flushPromises()

    const detailWrapper = mount(GroupDetailPage, {
      global: { plugins: [router] }
    })
    await flushPromises()

    expect(detailWrapper.text()).toContain('STAFF QC')
    expect(detailWrapper.text()).toContain('Divisi Quality Control Bahan')
    expect(detailWrapper.text()).toContain('All Top Spender')

    // 11. Mount GroupEditPage
    await router.push(`/system/groups/${createdQC!.id}/edit`)
    await flushPromises()

    const editWrapper = mount(GroupEditPage, {
      global: { plugins: [router] }
    })
    await flushPromises()

    expect(editWrapper.text()).toContain('Master Data Groups - EDIT DATA')
    const editInputs = editWrapper.findAll('input[type="text"]')
    await editInputs[1].setValue('Deskripsi QC Diperbarui')
    const editSubmitBtn = editWrapper.findAll('button').find((b) => b.text().includes('Simpan Perubahan'))
    await editSubmitBtn?.trigger('click')
    await flushPromises()

    const updatedQC = await groupService.getById(createdQC!.id)
    expect(updatedQC.group.description).toBe('Deskripsi QC Diperbarui')

    // 12. Delete safety: Attempt to delete group with assigned user (Gudang id: 4)
    await expect(groupService.delete(4)).rejects.toThrow('masih memiliki 1 user')

    // 13. Delete newly created group without users
    const deleteRes = await groupService.delete(createdQC!.id)
    expect(deleteRes.success).toBe(true)

    // 14. RBAC test: Switch to Staff Penjualan (no system permissions)
    authStore.currentUser = MOCK_USERS[1] // Staff Penjualan
    await router.push('/system/groups')
    await flushPromises()

    const rbacListWrapper = mount(GroupListPage, {
      global: { plugins: [router] }
    })
    await flushPromises()

    // Tambah Groups button should NOT be rendered for non-authorized user
    const restrictedCreateBtn = rbacListWrapper.findAll('button').find((b) => b.text().includes('Tambah Groups'))
    expect(restrictedCreateBtn).toBeUndefined()

    listWrapper.unmount()
    createWrapper.unmount()
    detailWrapper.unmount()
    editWrapper.unmount()
    rbacListWrapper.unmount()
  })
})

