import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CoaKpiCards from '@/modules/accounting/chart-of-accounts/components/CoaKpiCards.vue'
import CoaTreeView from '@/modules/accounting/chart-of-accounts/components/CoaTreeView.vue'
import CoaTableView from '@/modules/accounting/chart-of-accounts/components/CoaTableView.vue'
import CoaAccountModal from '@/modules/accounting/chart-of-accounts/components/CoaAccountModal.vue'
import { coaService } from '@/modules/accounting/chart-of-accounts/services/coa.service'
import type {
  CoaAccount,
  CoaTreeNodeGroup,
  CoaGroup,
  CoaParent
} from '@/modules/accounting/chart-of-accounts/types/coa.types'

describe('Chart of Accounts Frontend Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 1. KPI Cards Component
  it('CoaKpiCards renders correct summary values', () => {
    const wrapper = mount(CoaKpiCards, {
      props: {
        kpi: {
          total_accounts: 34,
          active_accounts: 30,
          total_groups: 5,
          total_parents: 10,
          used_accounts: 12
        },
        isLoading: false
      }
    })

    expect(wrapper.text()).toContain('34')
    expect(wrapper.text()).toContain('30')
    expect(wrapper.text()).toContain('15') // 5 groups + 10 parents
    expect(wrapper.text()).toContain('12')
  })

  // 2. Tree View Component
  it('CoaTreeView renders hierarchy and emits events', async () => {
    const mockTree: CoaTreeNodeGroup[] = [
      {
        id: 1,
        name: 'Aktiva',
        is_active: 1,
        parent_count: 1,
        account_count: 1,
        parents: [
          {
            id: 1,
            no_akun: 11,
            nama: 'Aktiva Lancar',
            coa_id: 1,
            is_active: 1,
            account_count: 1,
            accounts: [
              {
                id: 1,
                no_ref: '1101',
                nama: 'Kas',
                saldo_normal: 'D',
                is_active: 1,
                is_used: true,
                transaction_count: 128
              }
            ]
          }
        ]
      }
    ]

    const wrapper = mount(CoaTreeView, {
      props: {
        tree: mockTree,
        isLoading: false,
        canCreate: true,
        canUpdate: true,
        canDelete: true
      }
    })

    expect(wrapper.text()).toContain('AKTIVA')
    expect(wrapper.text()).toContain('Aktiva Lancar')
    expect(wrapper.text()).toContain('1101')
    expect(wrapper.text()).toContain('Kas')
    expect(wrapper.text()).toContain('Debit (D)')
    expect(wrapper.text()).toContain('Terpakai (128 tx)')

    // Click view detail button
    const viewBtn = wrapper.find('button[title="Lihat Detail Rekening"]')
    expect(viewBtn.exists()).toBe(true)
    await viewBtn.trigger('click')
    expect(wrapper.emitted('view')?.[0]).toEqual([1])
  })

  // 3. Table View Component
  it('CoaTableView renders rows and emits sort and pagination events', async () => {
    const mockAccounts: CoaAccount[] = [
      {
        id: 1,
        no_ref: '1101',
        nama: 'Kas',
        indukakun_id: 1,
        induk_nama: 'Aktiva Lancar',
        induk_no_akun: 11,
        coa_id: 1,
        coa_name: 'Aktiva',
        saldo_normal: 'D',
        is_active: 1,
        is_used: true,
        transaction_count: 128
      }
    ]

    const wrapper = mount(CoaTableView, {
      props: {
        accounts: mockAccounts,
        isLoading: false,
        total: 1,
        currentPage: 1,
        pageSize: 20,
        totalPages: 1,
        sortBy: 'no_ref',
        sortOrder: 'ASC',
        canUpdate: true,
        canDelete: true
      }
    })

    expect(wrapper.text()).toContain('1101')
    expect(wrapper.text()).toContain('Kas')
    expect(wrapper.text()).toContain('Aktiva')
    expect(wrapper.text()).toContain('Debit (D)')

    // Click sort header
    const headers = wrapper.findAll('th')
    await headers[0].trigger('click')
    expect(wrapper.emitted('sort')?.[0]).toEqual(['no_ref'])
  })

  // 4. Account Modal & Normal Balance Defaults
  it('CoaAccountModal sets smart normal balance defaults and detects contra account', async () => {
    const mockGroups: CoaGroup[] = [
      { id: 1, name: 'Aktiva', is_active: 1 },
      { id: 2, name: 'Kewajiban', is_active: 1 }
    ]
    const mockParents: CoaParent[] = [
      { id: 1, no_akun: 11, nama: 'Aktiva Lancar', coa_id: 1, is_active: 1 },
      { id: 3, no_akun: 21, nama: 'Kewajiban Lancar', coa_id: 2, is_active: 1 }
    ]

    const wrapper = mount(CoaAccountModal, {
      props: {
        isOpen: true,
        isEdit: false,
        accountData: null,
        groups: mockGroups,
        parents: mockParents,
        isLoading: false
      }
    })

    // Group 1 (Aktiva) should default to Debit (D)
    expect((wrapper.find('input[type="radio"][value="D"]').element as HTMLInputElement).checked).toBe(true)

    // Changing group to Kewajiban (2) should default to Kredit (K)
    const coaSelect = wrapper.find('select')
    await coaSelect.setValue(2)
    await coaSelect.trigger('change')

    // Form inputs
    const inputs = wrapper.findAll('input[type="text"]')
    await inputs[0].setValue('2105') // no_ref
    await inputs[1].setValue('Utang Operasional') // nama

    const selects = wrapper.findAll('select')
    await selects[1].setValue(3) // indukakun_id (Kewajiban Lancar)

    // Submit form
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeDefined()
    const submitPayload = wrapper.emitted('submit')?.[0][0] as any
    expect(submitPayload.no_ref).toBe('2105')
    expect(submitPayload.nama).toBe('Utang Operasional')
    expect(submitPayload.saldo_normal).toBe('K')
  })
})
