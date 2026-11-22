import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppPagination from '@/shared/components/navigation/AppPagination.vue'

describe('AppPagination.vue', () => {
  it('calculates range numbers and total counts accurately', () => {
    const wrapper = mount(AppPagination, {
      props: {
        currentPage: 2,
        totalItems: 45,
        pageSize: 10
      }
    })

    expect(wrapper.text()).toContain('Menampilkan 11 - 20 dari 45 data')
  })

  it('navigates to next and previous pages when buttons are clicked', async () => {
    const wrapper = mount(AppPagination, {
      props: {
        currentPage: 2,
        totalItems: 45,
        pageSize: 10
      }
    })

    const prevBtn = wrapper.find('button[aria-label="Halaman Sebelumnya"]')
    const nextBtn = wrapper.find('button[aria-label="Halaman Berikutnya"]')

    await prevBtn.trigger('click')
    expect(wrapper.emitted('update:currentPage')?.[0]).toEqual([1])

    await nextBtn.trigger('click')
    expect(wrapper.emitted('update:currentPage')?.[1]).toEqual([3])
  })

  it('disables previous button on page 1 and next button on last page', () => {
    const wrapperFirst = mount(AppPagination, {
      props: {
        currentPage: 1,
        totalItems: 20,
        pageSize: 10
      }
    })
    const prevBtn = wrapperFirst.find('button[aria-label="Halaman Sebelumnya"]')
    expect(prevBtn.attributes('disabled')).toBeDefined()

    const wrapperLast = mount(AppPagination, {
      props: {
        currentPage: 2,
        totalItems: 20,
        pageSize: 10
      }
    })
    const nextBtn = wrapperLast.find('button[aria-label="Halaman Berikutnya"]')
    expect(nextBtn.attributes('disabled')).toBeDefined()
  })

  it('changes page size and resets current page to 1', async () => {
    const wrapper = mount(AppPagination, {
      props: {
        currentPage: 3,
        totalItems: 100,
        pageSize: 10
      }
    })

    const select = wrapper.find('select')
    await select.setValue('25')

    expect(wrapper.emitted('update:pageSize')?.[0]).toEqual([25])
    expect(wrapper.emitted('update:currentPage')?.[0]).toEqual([1])
  })
})
