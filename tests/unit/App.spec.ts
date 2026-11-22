import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '@/App.vue'

describe('App.vue', () => {
  it('renders root application component successfully', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          RouterView: {
            template: '<div class="test-router-view">Router View Content</div>'
          }
        }
      }
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('main').exists()).toBe(true)
    expect(wrapper.text()).toContain('Router View Content')
  })
})
