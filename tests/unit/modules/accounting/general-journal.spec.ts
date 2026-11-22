import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import JournalKpiCards from '@/modules/accounting/general-journal/components/JournalKpiCards.vue'
import PostingConfirmModal from '@/modules/accounting/general-journal/components/PostingConfirmModal.vue'
import type { JournalHeader } from '@/modules/accounting/general-journal/types/journal.types'

describe('General Journal Frontend Unit Tests', () => {
  it('JournalKpiCards renders KPI metrics correctly', () => {
    const wrapper = mount(JournalKpiCards, {
      props: {
        kpi: {
          total_count: 120,
          draft_count: 5,
          posted_count: 110,
          reversed_count: 5,
          total_value: 250000000
        },
        loading: false
      }
    })

    expect(wrapper.text()).toContain('120')
    expect(wrapper.text()).toContain('5')
    expect(wrapper.text()).toContain('110')
    expect(wrapper.text()).toContain('250.000.000')
  })

  it('PostingConfirmModal displays journal information and warning', () => {
    const mockJournal: JournalHeader = {
      id: 1,
      journal_number: 'JU/2026/11/0001',
      journal_date: '2026-11-20',
      description: 'Test Jurnal',
      source_type: 'MANUAL',
      status: 'DRAFT',
      currency: 'IDR',
      total_debit: 1500000,
      total_credit: 1500000,
      difference: 0,
      is_balanced: true,
      is_legacy: false,
      line_count: 2,
      created_at: '2026-11-20T00:00:00.000Z',
      version: 1
    }

    const wrapper = mount(PostingConfirmModal, {
      props: {
        modelValue: true,
        journal: mockJournal
      }
    })

    expect(wrapper.text()).toContain('JU/2026/11/0001')
    expect(wrapper.text()).toContain('1.500.000')
    expect(wrapper.text()).toContain('Seimbang (Balance)')
    expect(wrapper.text()).toContain('Perhatian:')
  })
})
