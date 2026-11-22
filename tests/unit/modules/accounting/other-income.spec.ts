import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import OtherIncomeKpiCards from '@/modules/accounting/other-income/components/OtherIncomeKpiCards.vue'
import OtherIncomePostingModal from '@/modules/accounting/other-income/components/OtherIncomePostingModal.vue'
import OtherIncomeReversalModal from '@/modules/accounting/other-income/components/OtherIncomeReversalModal.vue'
import OtherIncomePrintModal from '@/modules/accounting/other-income/components/OtherIncomePrintModal.vue'
import type { OtherIncomeHeader } from '@/modules/accounting/other-income/types/other-income.types'

describe('Other Income Frontend Unit Tests', () => {
  const mockIncome: OtherIncomeHeader = {
    id: 1,
    trans_code: 'PM/2026/11/0001',
    tanggal: '2026-11-21',
    keterangan: 'Penerimaan Pendapatan Jasa Konsultasi',
    total: 2500000,
    akun_beban: 35,
    kode_akun_sumber: '4101',
    nama_akun_sumber: 'Pendapatan Jasa Desain',
    akun_kas: 1,
    kode_akun_kas: '1101',
    nama_akun_kas: 'Kas Operasional',
    status: 'DRAFT',
    received_from: 'PT Artha Mandiri',
    reference_number: 'TRF-0012',
    payment_method: 'Transfer Bank',
    created_at: '2026-11-21T00:00:00.000Z',
    item_count: 1,
    items: [
      { id: 1, keterangan: 'Konsultasi Desain Interior', jumlah: 2500000, akun_lawan_id: 35 }
    ],
    version: 1
  }

  it('OtherIncomeKpiCards renders KPI metrics correctly', () => {
    const wrapper = mount(OtherIncomeKpiCards, {
      props: {
        kpi: {
          total_count: 50,
          posted_total_amount: 35000000,
          posted_count: 45,
          draft_count: 5
        },
        loading: false
      }
    })

    expect(wrapper.text()).toContain('50')
    expect(wrapper.text()).toContain('35.000.000')
    expect(wrapper.text()).toContain('45')
    expect(wrapper.text()).toContain('5')
  })

  it('OtherIncomePostingModal displays income info and warning', () => {
    const wrapper = mount(OtherIncomePostingModal, {
      props: {
        modelValue: true,
        income: mockIncome
      }
    })

    expect(wrapper.text()).toContain('PM/2026/11/0001')
    expect(wrapper.text()).toContain('2.500.000')
    expect(wrapper.text()).toContain('Kas Operasional')
    expect(wrapper.text()).toContain('PT Artha Mandiri')
    expect(wrapper.text()).toContain('Posting Pemasukan Kas/Bank')
  })

  it('OtherIncomeReversalModal renders with reversal details', () => {
    const postedIncome = { ...mockIncome, status: 'POSTED' as const, journal_number: 'JU/2026/11/0005' }
    const wrapper = mount(OtherIncomeReversalModal, {
      props: {
        modelValue: true,
        income: postedIncome
      }
    })

    expect(wrapper.text()).toContain('PM/2026/11/0001')
    expect(wrapper.text()).toContain('2.500.000')
    expect(wrapper.text()).toContain('Reversal Transaksi Pemasukan')
  })

  it('OtherIncomePrintModal renders voucher with BUKTI PEMASUKAN KAS/BANK, terbilang, and watermark', () => {
    const wrapper = mount(OtherIncomePrintModal, {
      props: {
        modelValue: true,
        income: mockIncome
      }
    })

    expect(wrapper.text()).toContain('IMPACT FURNITURE')
    expect(wrapper.text()).toContain('BUKTI PEMASUKAN KAS/BANK')
    expect(wrapper.text()).toContain('PM/2026/11/0001')
    expect(wrapper.text()).toContain('2.500.000')
    expect(wrapper.text()).toContain('Dua Juta Lima Ratus Ribu Rupiah')
    expect(wrapper.text()).toContain('DRAFT — BELUM DIPOSTING')
  })
})
