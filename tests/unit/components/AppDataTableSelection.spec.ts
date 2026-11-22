import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppDataTable from '@/shared/components/data/AppDataTable.vue'

interface ProductRow {
  [key: string]: unknown
  id: number
  name: string
  price: number
}

describe('AppDataTable.vue — Row Selection & Slots', () => {
  const sampleData: ProductRow[] = [
    { id: 1, name: 'Sofa Jati 3 Seater', price: 4500000 },
    { id: 2, name: 'Meja Makan Minimalis', price: 3200000 },
    { id: 3, name: 'Lemari Pakaian 4 Pintu', price: 6800000 }
  ]

  const columns = [
    { key: 'name', label: 'Nama Produk', sortable: true },
    {
      key: 'price',
      label: 'Harga',
      formatter: (val: unknown) => `Rp ${Number(val).toLocaleString('id-ID')}`
    }
  ]

  it('renders table rows and applies custom formatter', () => {
    const wrapper = mount(AppDataTable, {
      props: {
        columns,
        data: sampleData
      }
    })

    expect(wrapper.text()).toContain('Sofa Jati 3 Seater')
    expect(wrapper.text()).toContain('Rp 4.500.000')
    expect(wrapper.text()).toContain('Lemari Pakaian 4 Pintu')
  })

  it('handles row selection when selectable is enabled', async () => {
    const wrapper = mount(AppDataTable, {
      props: {
        columns,
        data: sampleData,
        selectable: true,
        selectedRows: []
      }
    })

    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    // 1 header select all + 3 row checkboxes = 4
    expect(checkboxes).toHaveLength(4)

    // Select first row
    await checkboxes[1].setValue(true)
    expect(wrapper.emitted('update:selectedRows')?.[0]).toEqual([[sampleData[0]]])
  })

  it('selects all rows when header checkbox is clicked', async () => {
    const wrapper = mount(AppDataTable, {
      props: {
        columns,
        data: sampleData,
        selectable: true,
        selectedRows: []
      }
    })

    const headerCheckbox = wrapper.find('thead input[type="checkbox"]')
    await headerCheckbox.setValue(true)

    expect(wrapper.emitted('update:selectedRows')?.[0]).toEqual([sampleData])
  })

  it('supports custom cell slots and row action slots', () => {
    const wrapper = mount(AppDataTable, {
      props: {
        columns,
        data: sampleData
      },
      slots: {
        'cell-name': `<template #cell-name="{ value }"><span class="custom-name">★ {{ value }}</span></template>`,
        actions: `<template #actions="{ row }"><button class="btn-edit">Edit {{ row.id }}</button></template>`
      }
    })

    const customName = wrapper.find('.custom-name')
    expect(customName.exists()).toBe(true)
    expect(customName.text()).toContain('★ Sofa Jati 3 Seater')

    const editButtons = wrapper.findAll('.btn-edit')
    expect(editButtons).toHaveLength(3)
    expect(editButtons[0].text()).toBe('Edit 1')
  })

  it('supports density prop for compact and comfortable spacing', async () => {
    const wrapper = mount(AppDataTable, {
      props: {
        columns,
        data: sampleData,
        density: 'comfortable'
      }
    })

    expect(wrapper.html()).toContain('py-3')
  })
})
