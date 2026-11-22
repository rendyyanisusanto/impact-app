import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import ThemePreviewPage from '@/modules/dev/pages/ThemePreviewPage.vue'
import { DESIGN_TOKENS } from '@/shared/constants/tokens'
import { routes, devRoutes } from '@/app/router/routes'

describe('Sprint 1 — Task 2: Design Tokens & Theme Preview', () => {
  it('exports complete and valid brand color tokens', () => {
    expect(DESIGN_TOKENS.colors.brand.primary).toBe('#0F766E')
    expect(DESIGN_TOKENS.colors.brand.primaryHover).toBe('#115E59')
    expect(DESIGN_TOKENS.colors.brand.primaryLight).toBe('#F0FDFA')
    expect(DESIGN_TOKENS.colors.navbar.bg).toBe('#34454F')
    expect(DESIGN_TOKENS.colors.navbar.text).toBe('#F8FAFC')
    expect(DESIGN_TOKENS.colors.navbar.muted).toBe('#CBD5E1')
  })

  it('exports complete and valid neutral color tokens', () => {
    expect(DESIGN_TOKENS.colors.neutral.background).toBe('#F5F7FA')
    expect(DESIGN_TOKENS.colors.neutral.surface).toBe('#FFFFFF')
    expect(DESIGN_TOKENS.colors.neutral.surfaceSecondary).toBe('#F8FAFC')
    expect(DESIGN_TOKENS.colors.neutral.border).toBe('#D9E0E7')
    expect(DESIGN_TOKENS.colors.neutral.borderStrong).toBe('#CBD5E1')
    expect(DESIGN_TOKENS.colors.neutral.textPrimary).toBe('#1F2937')
    expect(DESIGN_TOKENS.colors.neutral.textSecondary).toBe('#64748B')
    expect(DESIGN_TOKENS.colors.neutral.textMuted).toBe('#94A3B8')
  })

  it('exports complete and valid semantic color tokens', () => {
    expect(DESIGN_TOKENS.colors.semantic.success).toBe('#16A34A')
    expect(DESIGN_TOKENS.colors.semantic.successBg).toBe('#F0FDF4')
    expect(DESIGN_TOKENS.colors.semantic.warning).toBe('#D97706')
    expect(DESIGN_TOKENS.colors.semantic.warningBg).toBe('#FFFBEB')
    expect(DESIGN_TOKENS.colors.semantic.danger).toBe('#DC2626')
    expect(DESIGN_TOKENS.colors.semantic.dangerBg).toBe('#FEF2F2')
    expect(DESIGN_TOKENS.colors.semantic.info).toBe('#2563EB')
    expect(DESIGN_TOKENS.colors.semantic.infoBg).toBe('#EFF6FF')
  })

  it('exports standard typography scale tokens with line heights', () => {
    const { scale } = DESIGN_TOKENS.typography
    expect(scale.xs.size).toBe('12px')
    expect(scale.xs.lineHeight).toBe('18px')
    expect(scale.sm.size).toBe('13px')
    expect(scale.sm.lineHeight).toBe('20px')
    expect(scale.base.size).toBe('14px')
    expect(scale.base.lineHeight).toBe('22px')
    expect(scale.lg.size).toBe('16px')
    expect(scale.lg.lineHeight).toBe('24px')
    expect(scale.xl.size).toBe('20px')
    expect(scale.xl.lineHeight).toBe('28px')
    expect(scale['2xl'].size).toBe('24px')
    expect(scale['2xl'].lineHeight).toBe('32px')
    expect(scale['3xl'].size).toBe('30px')
    expect(scale['3xl'].lineHeight).toBe('38px')
  })

  it('exports standardized 4px-multiple spacing tokens', () => {
    expect(DESIGN_TOKENS.spacing[1]).toBe('4px')
    expect(DESIGN_TOKENS.spacing[2]).toBe('8px')
    expect(DESIGN_TOKENS.spacing[3]).toBe('12px')
    expect(DESIGN_TOKENS.spacing[4]).toBe('16px')
    expect(DESIGN_TOKENS.spacing[5]).toBe('20px')
    expect(DESIGN_TOKENS.spacing[6]).toBe('24px')
    expect(DESIGN_TOKENS.spacing[8]).toBe('32px')
    expect(DESIGN_TOKENS.spacing[10]).toBe('40px')
    expect(DESIGN_TOKENS.spacing[12]).toBe('48px')
  })

  it('exports compact ERP border radii tokens', () => {
    expect(DESIGN_TOKENS.radii.sm).toBe('4px')
    expect(DESIGN_TOKENS.radii.md).toBe('6px')
    expect(DESIGN_TOKENS.radii.lg).toBe('8px')
    expect(DESIGN_TOKENS.radii.xl).toBe('10px')
  })

  it('exports layout dimension tokens for ERP consistency', () => {
    expect(DESIGN_TOKENS.layout.headerHeight).toBe('44px')
    expect(DESIGN_TOKENS.layout.navigationHeight).toBe('44px')
    expect(DESIGN_TOKENS.layout.contentPadding).toBe('24px')
    expect(DESIGN_TOKENS.layout.cardPadding).toBe('20px')
    expect(DESIGN_TOKENS.layout.inputHeight).toBe('38px')
    expect(DESIGN_TOKENS.layout.buttonHeight).toBe('38px')
    expect(DESIGN_TOKENS.layout.tableRowHeight).toBe('42px')
  })

  it('renders ThemePreviewPage component with all visual token sections', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/dashboard', component: { template: '<div>Dashboard</div>' } },
        { path: '/dev/theme-preview', component: ThemePreviewPage }
      ]
    })

    const wrapper = mount(ThemePreviewPage, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.text()).toContain('Impact Furniture v2 — Design System & Visual Baseline')
    expect(wrapper.text()).toContain('1. Color System')
    expect(wrapper.text()).toContain('2. Typography System (Inter)')
    expect(wrapper.text()).toContain('3. Spacing System (4px Baseline)')
    expect(wrapper.text()).toContain('4. Border Radius Tokens')
    expect(wrapper.text()).toContain('5. Shadow Levels (Elevations)')
    expect(wrapper.text()).toContain('6. ERP Layout Dimension Tokens')
    expect(wrapper.text()).toContain('7. Form Visual Baseline')
    expect(wrapper.text()).toContain('8. Semantic Status Badges')
    expect(wrapper.text()).toContain('9. Surface Layering Hierarchy')
    expect(wrapper.text()).toContain('10. Responsive Testing Guidelines')
    expect(wrapper.text()).toContain('Tabular Numerals Alignment')
  })

  it('isolates development routes so they can be excluded in production', () => {
    const hasDevRoute = routes.some(r => r.path === '/dev/theme-preview')
    if (import.meta.env.DEV) {
      expect(hasDevRoute).toBe(true)
      expect(devRoutes).toHaveLength(1)
      expect(devRoutes[0].path).toBe('/dev/theme-preview')
    } else {
      expect(hasDevRoute).toBe(false)
      expect(devRoutes).toHaveLength(0)
    }
  })
})
