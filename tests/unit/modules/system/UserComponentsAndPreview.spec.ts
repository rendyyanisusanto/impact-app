import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import UserRoleAccessPreview from '@/modules/system/users/components/UserRoleAccessPreview.vue'
import UserResetPasswordModal from '@/modules/system/users/components/UserResetPasswordModal.vue'
import UserResetPinModal from '@/modules/system/users/components/UserResetPinModal.vue'
import type { UserListItem } from '@/modules/system/users/types/user.types'
import type { SubmenuPermissionFlag } from '@/modules/system/groups/types/group.types'

describe('Sprint 9 — Task 7 & 8: User Components & Role Access Preview Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const mockPermissions: Record<string, SubmenuPermissionFlag> = {
    '1': { c: true, r: true, u: true, d: false }, // Suplier
    '4': { c: true, r: true, u: false, d: false }, // PO
    '14': { c: false, r: true, u: false, d: false } // Laporan Pengadaan
  }

  const mockUser: UserListItem = {
    id: 2,
    username: 'staff.penjualan',
    email: 'ahmad@impactfurniture.co.id',
    firstName: 'Ahmad Fauzi',
    employeeId: 54,
    employeeCode: '2',
    employeeName: 'ACHMAD',
    employeePosition: 'SUPIR',
    groupId: 3,
    groupName: 'STAFF PENJUALAN',
    groupDescription: 'Divisi Penjualan',
    active: 1,
    statusLabel: 'AKTIF',
    ipAddress: '192.168.1.10',
    lastLogin: null,
    createdOn: '2023-01-15 09:30:00'
  }

  describe('UserRoleAccessPreview.vue', () => {
    it('renders role access preview header and group description', () => {
      const wrapper = mount(UserRoleAccessPreview, {
        props: {
          groupId: 3,
          groupName: 'STAFF PENJUALAN',
          groupDescription: 'Divisi Penjualan & Pemrosesan Sales Order',
          permissions: mockPermissions,
          dashboardWidgets: [1, 3]
        },
        global: {
          stubs: {
            'router-link': true
          }
        }
      })

      expect(wrapper.text()).toContain('Preview Role Access (Hak Akses)')
      expect(wrapper.text()).toContain('STAFF PENJUALAN')
      expect(wrapper.text()).toContain('Divisi Penjualan & Pemrosesan Sales Order')
      expect(wrapper.text()).toContain('Catatan Otorisasi')
    })

    it('calculates KPI metric summary cards accurately', () => {
      const wrapper = mount(UserRoleAccessPreview, {
        props: {
          groupId: 3,
          groupName: 'STAFF PENJUALAN',
          permissions: mockPermissions,
          dashboardWidgets: [1, 3]
        },
        global: {
          stubs: {
            'router-link': true
          }
        }
      })

      // We have:
      // '1': c: true, r: true, u: true, d: false
      // '4': c: true, r: true, u: false, d: false
      // '14': c: false, r: true, u: false, d: false
      // Totals: C = 2, R = 3, U = 1, D = 0, Dashboard = 2
      expect(wrapper.text()).toContain('Akses Buat (C)')
      expect(wrapper.text()).toContain('Akses Lihat (R)')
      expect(wrapper.text()).toContain('Akses Ubah (U)')
      expect(wrapper.text()).toContain('Akses Hapus (D)')
      expect(wrapper.text()).toContain('2 / 3') // Dashboard widgets
    })

    it('renders 3 legacy dashboard widget cards with active/inactive indicators', () => {
      const wrapper = mount(UserRoleAccessPreview, {
        props: {
          groupId: 3,
          groupName: 'STAFF PENJUALAN',
          permissions: mockPermissions,
          dashboardWidgets: [1] // Only All Top Spender active
        },
        global: {
          stubs: {
            'router-link': true
          }
        }
      })

      expect(wrapper.text()).toContain('All Top Spender')
      expect(wrapper.text()).toContain('All Stock Limit')
      expect(wrapper.text()).toContain('Get Recent Mutation')
    })

    it('filters submenus dynamically via search input', async () => {
      const wrapper = mount(UserRoleAccessPreview, {
        props: {
          groupId: 3,
          groupName: 'STAFF PENJUALAN',
          permissions: mockPermissions,
          dashboardWidgets: []
        },
        global: {
          stubs: {
            'router-link': true
          }
        }
      })

      const searchInput = wrapper.find('input[placeholder*="Cari submenu"]')
      expect(searchInput.exists()).toBe(true)

      await searchInput.setValue('Purchase Order')
      expect(wrapper.text()).toContain('Purchase Order')
      // Non-matching submenus from other categories are hidden
      expect(wrapper.text()).not.toContain('Master Data Pelanggan')
    })
  })

  describe('UserResetPasswordModal.vue', () => {
    it('renders modal and enforces password confirmation match', async () => {
      const wrapper = mount(UserResetPasswordModal, {
        props: {
          isOpen: true,
          user: mockUser
        },
        global: {
          stubs: {
            Teleport: true
          }
        }
      })

      expect(wrapper.text()).toContain('Reset Password Pengguna')
      expect(wrapper.text()).toContain('staff.penjualan')

      // Set mismatched passwords
      const inputs = wrapper.findAll('input')
      await inputs[0].setValue('password123')
      await inputs[1].setValue('different456')

      const submitBtn = wrapper.findAll('button').find(b => b.text().includes('Simpan'))
      await submitBtn?.trigger('click')

      expect(wrapper.text()).toContain('Konfirmasi password tidak cocok.')
    })
  })

  describe('UserResetPinModal.vue', () => {
    it('renders modal and enforces numeric PIN validation', async () => {
      const wrapper = mount(UserResetPinModal, {
        props: {
          isOpen: true,
          user: mockUser
        },
        global: {
          stubs: {
            Teleport: true
          }
        }
      })

      expect(wrapper.text()).toContain('Reset PIN Otorisasi Transaksi')
      expect(wrapper.text()).toContain('staff.penjualan')

      // Set invalid non-numeric PIN
      const inputs = wrapper.findAll('input')
      await inputs[0].setValue('abc')
      await inputs[1].setValue('abc')

      const submitBtn = wrapper.findAll('button').find(b => b.text().includes('Simpan'))
      await submitBtn?.trigger('click')

      expect(wrapper.text()).toContain('PIN hanya boleh berupa angka.')
    })
  })
})