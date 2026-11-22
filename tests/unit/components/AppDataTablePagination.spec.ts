import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppDataTable from '@/shared/components/data/AppDataTable.vue'
import type { TableColumn } from '@/shared/types/table.types'

describe('AppDataTable.vue — Pagination', () => {
  interface Item {
    id: number
    name: string
    [key: string]: unknown
  }

  const columns: TableColumn[] = [{ key: 'name', label: 'Item Name' }]

  const data: Item[] = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' },
    { id: 4, name: 'Item 4' },
    { id: 5, name: 'Item 5' }
  ]

  it('paginates data into slices matching pageSize', () => {
    const wrapper = mount(AppDataTable, {
      props: {
        columns,
        data,
        pageSize: 2,
        paginated: true,
        clientPagination: true
      }
    })

    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toContain('Item 1')
    expect(rows[1].text()).toContain('Item 2')
  })

  it('changes visible page when page button is clicked', async () => {
    const wrapper = mount(AppDataTable, {
      props: {
        columns,
        data,
        pageSize: 2,
        paginated: true,
        clientPagination: true
      }
    })

    // Find page 2 button in AppPagination
    const pageButtons = wrapper.findAll('nav button')
    const page2Button = pageButtons.find(b => b.text() === '2')
    expect(page2Button).toBeDefined()

    await page2Button?.trigger('click')

    expect(wrapper.emitted('update:currentPage')?.[0]).toEqual([2])
    const rows = wrapper.findAll('tbody tr')
    expect(rows[0].text()).toContain('Item 3')
    expect(rows[1].text()).toContain('Item 4')
  })
})
