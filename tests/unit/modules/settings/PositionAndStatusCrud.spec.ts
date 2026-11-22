import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { positionService } from '@/modules/settings/positions/services/position.service'
import { employeeStatusService } from '@/modules/settings/employee-statuses/services/employee-status.service'
import PositionListPage from '@/modules/settings/positions/pages/PositionListPage.vue'
import PositionFormModal from '@/modules/settings/positions/components/PositionFormModal.vue'
import EmployeeStatusListPage from '@/modules/settings/employee-statuses/pages/EmployeeStatusListPage.vue'
import EmployeeStatusFormModal from '@/modules/settings/employee-statuses/components/EmployeeStatusFormModal.vue'
import { positionRowMapper } from '@/modules/settings/positions/utils/position-import.config'
import { employeeStatusRowMapper } from '@/modules/settings/employee-statuses/utils/employee-status-import.config'

describe('Sprint 3 — Task 10: Master Data Jabatan & Status Karyawan', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    positionService.reset()
    employeeStatusService.reset()
  })

  describe('PositionService & UI (Jabatan)', () => {
    it('1. retrieves active positions and ignores soft-deleted positions (is_deleted === 0)', async () => {
      const res = await positionService.getAll()
      // Initial mock has id: 999 with is_deleted: 0 which must NOT be in active list
      expect(res.data.find(j => j.id === 999)).toBeUndefined()
      expect(res.data.length).toBeGreaterThanOrEqual(4)
      const dir = res.data.find(j => j.nama === 'Direktur')
      expect(dir).toBeDefined()
      expect(dir?.is_deleted).toBe(1)
    })

    it('2. creates, updates, and soft deletes a position', async () => {
      const created = await positionService.create({
        kode: 'JB-TEST-01',
        nama: 'Quality Assurance Lead',
        color: '#6366f1',
        status: 1
      })
      expect(created.id).toBeDefined()
      expect(created.is_deleted).toBe(1)
      expect(created.nama).toBe('Quality Assurance Lead')

      const updated = await positionService.update(created.id, {
        nama: 'Head of Quality Assurance'
      })
      expect(updated.nama).toBe('Head of Quality Assurance')

      // Soft delete: should set is_deleted = 0
      const deleted = await positionService.delete(created.id)
      expect(deleted).toBe(true)

      // Verifying it is excluded from getAll
      const res = await positionService.getAll()
      expect(res.data.find(j => j.id === created.id)).toBeUndefined()

      // Verifying getById throws not found
      await expect(positionService.getById(created.id)).rejects.toThrow()
    })

    it('3. validates and imports position rows', () => {
      const valid = positionRowMapper.mapRow(
        {
          'Kode Jabatan': 'JB-2405-9999',
          'Nama Jabatan *': 'Operator Mesin CNC',
          'Warna Label': '#0ea5e9',
          Status: 'Aktif'
        },
        2
      )
      expect(valid.error).toBeUndefined()
      expect(valid.data?.nama).toBe('Operator Mesin CNC')
      expect(valid.data?.color).toBe('#0ea5e9')

      const invalid = positionRowMapper.mapRow({}, 3)
      expect(invalid.error).toContain('Nama Jabatan wajib diisi')
    })

    it('4. mounts PositionListPage and opens form modal', async () => {
      const wrapper = mount(PositionListPage, {
        global: {
          stubs: {
            AppDataTable: {
              template: '<div class="data-table-stub"><slot /></div>'
            },
            AppTableSkeleton: true,
            AppModal: {
              template:
                '<div v-if="modelValue || open" class="modal-stub"><slot /><slot name="footer" /></div>',
              props: ['modelValue', 'open']
            },
            AppExportExcelModal: true,
            AppImportExcelModal: true,
            AppConfirmDialog: true,
            PositionFormModal: true,
            PositionDetailModal: true
          }
        }
      })

      expect(wrapper.text()).toContain('Master Data Jabatan')
      expect(wrapper.find('button').exists()).toBe(true)
    })

    it('5. submits PositionFormModal with valid inputs and validates required fields', async () => {
      const wrapper = mount(PositionFormModal, {
        props: {
          modelValue: true,
          isEdit: false
        },
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      // Validation check
      await wrapper.find('form').trigger('submit.prevent')
      expect(wrapper.text()).toContain('Nama jabatan wajib diisi')

      // Fill in name
      const nameInput = wrapper.find('#jb-nama')
      await nameInput.setValue('Kepala Bengkel')

      await wrapper.find('form').trigger('submit.prevent')
      const emitted = wrapper.emitted('submit')
      expect(emitted).toBeTruthy()
      expect(emitted?.[0][0]).toMatchObject({
        nama: 'Kepala Bengkel',
        status: 1
      })
    })
  })

  describe('EmployeeStatusService & UI (Status Karyawan)', () => {
    it('6. retrieves status karyawan with color badges', async () => {
      const res = await employeeStatusService.getAll()
      expect(res.data.length).toBeGreaterThanOrEqual(4)
      const harian = res.data.find(s => s.nama === 'Harian')
      expect(harian).toBeDefined()
      expect(harian?.kode).toBe('SK2974')
    })

    it('7. creates, updates, and deletes status karyawan', async () => {
      const created = await employeeStatusService.create({
        kode: 'SK-MAGANG',
        nama: 'Magang / Intern',
        color: '#ec4899',
        status: 1
      })
      expect(created.id).toBeDefined()
      expect(created.nama).toBe('Magang / Intern')

      const updated = await employeeStatusService.update(created.id, {
        nama: 'Apprentice (Magang)'
      })
      expect(updated.nama).toBe('Apprentice (Magang)')

      const deleted = await employeeStatusService.delete(created.id)
      expect(deleted).toBe(true)
      await expect(employeeStatusService.getById(created.id)).rejects.toThrow()
    })

    it('8. validates and imports status karyawan rows', () => {
      const valid = employeeStatusRowMapper.mapRow(
        {
          'Kode Status': 'SK-HONOR',
          'Nama Status Karyawan *': 'Honorer',
          'Warna Label': '#14b8a6',
          'Status Rekord': 'Aktif'
        },
        2
      )
      expect(valid.error).toBeUndefined()
      expect(valid.data?.nama).toBe('Honorer')
      expect(valid.data?.color).toBe('#14b8a6')

      const invalid = employeeStatusRowMapper.mapRow({}, 3)
      expect(invalid.error).toContain('Nama Status Karyawan wajib diisi')
    })

    it('9. mounts EmployeeStatusListPage and renders header', async () => {
      const wrapper = mount(EmployeeStatusListPage, {
        global: {
          stubs: {
            AppDataTable: {
              template: '<div class="data-table-stub"><slot /></div>'
            },
            AppTableSkeleton: true,
            AppModal: {
              template:
                '<div v-if="modelValue || open" class="modal-stub"><slot /><slot name="footer" /></div>',
              props: ['modelValue', 'open']
            },
            AppExportExcelModal: true,
            AppImportExcelModal: true,
            AppConfirmDialog: true,
            EmployeeStatusFormModal: true,
            EmployeeStatusDetailModal: true
          }
        }
      })

      expect(wrapper.text()).toContain('Master Data Status Karyawan')
    })

    it('10. submits EmployeeStatusFormModal with valid inputs and validates required fields', async () => {
      const wrapper = mount(EmployeeStatusFormModal, {
        props: {
          modelValue: true,
          isEdit: false
        },
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      // Validation check
      await wrapper.find('form').trigger('submit.prevent')
      expect(wrapper.text()).toContain('Nama status karyawan wajib diisi')

      // Fill in name
      const nameInput = wrapper.find('#sk-nama')
      await nameInput.setValue('Freelance Project')

      await wrapper.find('form').trigger('submit.prevent')
      const emitted = wrapper.emitted('submit')
      expect(emitted).toBeTruthy()
      expect(emitted?.[0][0]).toMatchObject({
        nama: 'Freelance Project',
        status: 1
      })
    })
  })
})
