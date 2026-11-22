import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import OtherExpenseKpiCards from '@/modules/accounting/other-expenses/components/OtherExpenseKpiCards.vue'
import OtherExpensePostingModal from '@/modules/accounting/other-expenses/components/OtherExpensePostingModal.vue'
import OtherExpenseReversalModal from '@/modules/accounting/other-expenses/components/OtherExpenseReversalModal.vue'
import OtherExpensePrintModal from '@/modules/accounting/other-expenses/components/OtherExpensePrintModal.vue'
import type { OtherExpenseHeader } from '@/modules/accounting/other-expenses/types/other-expense.types'

describe('Other Expenses Frontend Unit Tests', () => {
  const mockExpense: OtherExpenseHeader = {
    id: 1,
    trans_code: 'PL/2026/11/0001',
    tanggal: '2026-11-21',
    keterangan: 'Biaya Listrik Kantor PLN',
    total: 750000,
    akun_beban: 22,
    kode_akun_beban: '5101',
    nama_akun_beban: 'Beban Listrik',
    akun_kas: 1,
    kode_akun_kas: '1101',
    nama_akun_kas: 'Kas Operasional',
    status: 'DRAFT',
    reference_number: 'NOTA-001',
    payment_method: 'Transfer Bank',
    created_at: '2026-11-21T00:00:00.000Z',
    item_count: 1,
    items: [
      { id: 1, keterangan: 'Listrik Kantor', jumlah: 750000, akun_beban_id: 22 }
    ],
    version: 1
  }

  it('OtherExpenseKpiCards renders KPI metrics correctly', () => {
    const wrapper = mount(OtherExpenseKpiCards, {
      props: {
        kpi: {
          total_count: 42,
          posted_total_amount: 18500000,
          posted_count: 38,
          draft_count: 4
        },
        loading: false
      }
    })

    expect(wrapper.text()).toContain('42')
    expect(wrapper.text()).toContain('18.500.000')
    expect(wrapper.text()).toContain('38')
    expect(wrapper.text()).toContain('4')
  })

  it('OtherExpensePostingModal displays expense information and warning', () => {
    const wrapper = mount(OtherExpensePostingModal, {
      props: {
        modelValue: true,
        expense: mockExpense,
        loading: false
      }
    })

    expect(wrapper.text()).toContain('PL/2026/11/0001')
    expect(wrapper.text()).toContain('750.000')
    expect(wrapper.text()).toContain('Kas Operasional')
    expect(wrapper.text()).toContain('Beban Listrik')
    expect(wrapper.text()).toContain('Perhatian Transaksi Akuntansi')
  })

  it('OtherExpenseReversalModal validates reason and displays reversal warning', async () => {
    const postedExpense = { ...mockExpense, status: 'POSTED' as const, journal_number: 'JU/2026/11/0005' }
    const wrapper = mount(OtherExpenseReversalModal, {
      props: {
        modelValue: true,
        expense: postedExpense,
        loading: false
      }
    })

    expect(wrapper.text()).toContain('PL/2026/11/0001')
    expect(wrapper.text()).toContain('750.000')
    expect(wrapper.text()).toContain('JU/2026/11/0005')

    // Click confirm with empty reason -> should show validation error
    const confirmBtn = wrapper.find('button.bg-purple-600')
    await confirmBtn.trigger('click')
    expect(wrapper.text()).toContain('Alasan reversal wajib diisi minimal 3 karakter')
  })

  it('OtherExpensePrintModal renders voucher with BUKTI PENGELUARAN KAS/BANK, terbilang, and watermark', () => {
    const wrapper = mount(OtherExpensePrintModal, {
      props: {
        modelValue: true,
        expense: mockExpense
      }
    })

    expect(wrapper.text()).toContain('IMPACT FURNITURE')
    expect(wrapper.text()).toContain('BUKTI PENGELUARAN KAS/BANK')
    expect(wrapper.text()).toContain('PL/2026/11/0001')
    expect(wrapper.text()).toContain('750.000')
    expect(wrapper.text()).toContain('Tujuh Ratus Lima Puluh Ribu Rupiah')
    expect(wrapper.text()).toContain('DRAFT — BELUM DIPOSTING')
  })
})
