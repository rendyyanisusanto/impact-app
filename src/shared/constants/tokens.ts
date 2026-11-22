export const DESIGN_TOKENS = {
  colors: {
    brand: {
      primary: '#0F766E',
      primaryHover: '#115E59',
      primaryLight: '#F0FDFA'
    },
    navbar: {
      bg: '#34454F',
      text: '#F8FAFC',
      muted: '#CBD5E1',
      hover: '#3E525E',
      dark: '#34454F',
      darker: '#28363E',
      light: '#425763'
    },
    neutral: {
      background: '#F5F7FA',
      surface: '#FFFFFF',
      surfaceSecondary: '#F8FAFC',
      border: '#D9E0E7',
      borderStrong: '#CBD5E1',
      textPrimary: '#1F2937',
      textSecondary: '#64748B',
      textMuted: '#94A3B8'
    },
    semantic: {
      success: '#16A34A',
      successBg: '#F0FDF4',
      warning: '#D97706',
      warningBg: '#FFFBEB',
      danger: '#DC2626',
      dangerBg: '#FEF2F2',
      info: '#2563EB',
      infoBg: '#EFF6FF'
    },
    interactive: {
      hover: '#115E59',
      active: '#0D6760',
      focus: '#0F766E',
      disabledBg: '#F1F5F9',
      disabledText: '#94A3B8',
      disabledBorder: '#E2E8F0',
      selectedBg: '#F0FDFA',
      selectedBorder: '#99F6E4',
      invalidBorder: '#DC2626',
      invalidBg: '#FEF2F2'
    },
    /* Aliases for backwards compatibility */
    primary: {
      default: '#0F766E',
      hover: '#115E59',
      light: '#F0FDFA'
    },
    background: {
      default: '#F5F7FA',
      alt: '#EEF2F6'
    },
    surface: {
      default: '#FFFFFF',
      muted: '#F8FAFC'
    },
    border: {
      default: '#D9E0E7',
      dark: '#CBD5E1',
      light: '#E2E8F0'
    },
    text: {
      primary: '#1F2937',
      secondary: '#64748B',
      muted: '#94A3B8'
    }
  },
  typography: {
    fontFamily:
      "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    scale: {
      xs: { size: '12px', lineHeight: '18px', usage: 'Caption, helper' },
      sm: { size: '13px', lineHeight: '20px', usage: 'Label, table' },
      base: { size: '14px', lineHeight: '22px', usage: 'Body' },
      lg: { size: '16px', lineHeight: '24px', usage: 'Card title' },
      xl: { size: '20px', lineHeight: '28px', usage: 'Page title' },
      '2xl': {
        size: '24px',
        lineHeight: '32px',
        usage: 'Dashboard heading'
      },
      '3xl': { size: '30px', lineHeight: '38px', usage: 'Primary KPI' }
    },
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },
  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px'
  },
  radii: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '10px',
    input: '6px',
    button: '6px',
    card: '8px',
    dropdown: '8px',
    modal: '10px'
  },
  shadows: {
    subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    dropdown: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
    modal: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)'
  },
  layout: {
    headerHeight: '44px',
    navigationHeight: '44px',
    contentPadding: '24px',
    cardPadding: '20px',
    inputHeight: '38px',
    buttonHeight: '38px',
    tableRowHeight: '42px'
  }
} as const

export type DesignTokens = typeof DESIGN_TOKENS
