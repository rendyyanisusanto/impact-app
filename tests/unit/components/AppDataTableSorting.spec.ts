import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppDataTable from '@/shared/components/data/AppDataTable.vue'
import type { TableColumn } from '@/shared/types/table.types'

describe('AppDataTable.vue — Sorting', () => {
  interface RowItem {
    id: number
    name: string
    quantity: number
    [key: string]: unknown
  }

  const columns: TableColumn[] = [
    { key: 'name', label: 'Nama Bahan', sortable: true },
    { key: 'quantity', label: 'Jumlah', sortable: true, align: 'right' },
    { key: 'action', label: 'Aksi', sortable: false }
  ]

  const mockData: RowItem[] = [
    { id: 1, name: 'Kayu Mahoni', quantity: 30 },
    { id: 2, name: 'Busa density 24', quantity: 15 },
    { id: 3, name: 'Engsel Huben', quantity: 100 }
  ]

  it('renders columns and initial rows correctly', () => {
    const wrapper = mount(AppDataTable, {
      props: {
        columns,
        data: mockData,
        clientPagination: false
      }
    })

    expect(wrapper.text()).toContain('Nama Bahan')
    expect(wrapper.text()).toContain('Jumlah')
    expect(wrapper.text()).toContain('Kayu Mahoni')
  })

  it('sorts data client-side on header click and emits sort event', async () => {
    const wrapper = mount(AppDataTable, {
      props: {
        columns,
        data: mockData,
        clientSort: true,
        clientPagination: false
      }
    })

    const headers = wrapper.findAll('th')
    const nameHeader = headers[0]

    // Click 1: Ascending sort
    await nameHeader.trigger('click')
    expect(wrapper.emitted('sort')?.[0]).toEqual([{ key: 'name', direction: 'asc' }])

    let rows = wrapper.findAll('tbody tr')
    expect(rows[0].text()).toContain('Busa density 24')
    expect(rows[1].text()).toContain('Engsel Huben')
    expect(rows[2].text()).toContain('Kayu Mahoni')

    // Click 2: Descending sort
    await nameHeader.trigger('click')
    expect(wrapper.emitted('sort')?.[1]).toEqual([{ key: 'name', direction: 'desc' }])

    rows = wrapper.findAll('tbody tr')
    expect(rows[0].text()).toContain('Kayu Mahoni')
    expect(rows[1].text()).toContain('Engsel Huben')
    expect(rows[2].text()).toContain('Busa density 24')
  })

  it('does not emit sort when non-sortable column header is clicked', async () => {
    const wrapper = mount(AppDataTable, {
      props: {
        columns,
        data: mockData
      }
    })

    const headers = wrapper.findAll('th')
    const actionHeader = headers[2] // non-sortable
    await actionHeader.trigger('click')

    expect(wrapper.emitted('sort')).toBeUndefined()
  })
})
