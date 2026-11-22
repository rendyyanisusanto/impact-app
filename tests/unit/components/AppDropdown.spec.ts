import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppDropdown from '@/shared/components/navigation/AppDropdown.vue'

describe('AppDropdown.vue', () => {
  it('opens and closes on trigger click', async () => {
    const wrapper = mount(AppDropdown, {
      slots: {
        trigger: '<button class="test-trigger">Toggle</button>',
        default: '<div class="menu-content">Item 1</div>'
      }
    })

    // Initially closed
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)

    // Click trigger to open
    const trigger = wrapper.find('[role="button"]')
    await trigger.trigger('click')
    expect(wrapper.find('[role="menu"]').exists()).toBe(true)

    // Click trigger again to close
    await trigger.trigger('click')
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })

  it('closes dropdown on Escape key', async () => {
    const wrapper = mount(AppDropdown, {
      slots: {
        trigger: '<button>Toggle</button>',
        default: '<div class="menu-content">Item 1</div>'
      }
    })

    // Open dropdown
    const trigger = wrapper.find('[role="button"]')
    await trigger.trigger('click')
    expect(wrapper.find('[role="menu"]').exists()).toBe(true)

    // Press Escape
    await wrapper.trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })
})
