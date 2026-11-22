/** @type {import('tailwindcss').Config} */
export default {
  // Tema UI tetap terang & kontras; tidak mengikuti tema OS (varian dark: hanya aktif jika ada class .dark)
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#0F766E',
          'primary-hover': '#115E59',
          'primary-light': '#F0FDFA'
        },
        navbar: {
          DEFAULT: '#34454F',
          bg: '#34454F',
          text: '#F8FAFC',
          muted: '#CBD5E1',
          dark: '#34454F',
          darker: '#28363E',
          light: '#425763',
          hover: '#3E525E',
          active: '#28363E'
        },
        primary: {
          DEFAULT: '#0F766E',
          hover: '#115E59',
          light: '#F0FDFA',
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          500: '#0F766E',
          600: '#0D6760',
          700: '#115E59',
          800: '#115E59',
          900: '#134E4A'
        },
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F8FAFC',
          muted: '#F8FAFC'
        },
        background: {
          DEFAULT: '#F5F7FA',
          alt: '#EEF2F6'
        },
        border: {
          DEFAULT: '#D9E0E7',
          strong: '#CBD5E1',
          dark: '#CBD5E1',
          light: '#E2E8F0'
        },
        text: {
          primary: '#1F2937',
          secondary: '#64748B',
          muted: '#94A3B8'
        },
        content: {
          primary: '#1F2937',
          secondary: '#64748B',
          muted: '#94A3B8'
        },
        semantic: {
          success: '#16A34A',
          'success-bg': '#F0FDF4',
          warning: '#D97706',
          'warning-bg': '#FFFBEB',
          danger: '#DC2626',
          'danger-bg': '#FEF2F2',
          info: '#2563EB',
          'info-bg': '#EFF6FF'
        },
        success: {
          DEFAULT: '#16A34A',
          bg: '#F0FDF4'
        },
        warning: {
          DEFAULT: '#D97706',
          bg: '#FFFBEB'
        },
        danger: {
          DEFAULT: '#DC2626',
          bg: '#FEF2F2'
        },
        info: {
          DEFAULT: '#2563EB',
          bg: '#EFF6FF'
        }
      },
      fontSize: {
        xs: ['12px', { lineHeight: '18px' }],
        sm: ['13px', { lineHeight: '20px' }],
        base: ['14px', { lineHeight: '22px' }],
        lg: ['16px', { lineHeight: '24px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '38px' }]
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '10px',
        input: '6px',
        btn: '6px',
        card: '8px',
        dropdown: '8px',
        modal: '10px'
      },
      height: {
        header: '44px',
        navbar: '44px',
        input: '38px',
        btn: '38px',
        'table-row': '42px'
      },
      minHeight: {
        header: '44px',
        navbar: '44px',
        input: '38px',
        btn: '38px',
        'table-row': '42px'
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif'
        ]
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        dropdown: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        modal: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)'
      }
    }
  },
  plugins: []
}
