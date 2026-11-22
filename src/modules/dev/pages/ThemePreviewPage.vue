<script setup lang="ts">
import { DESIGN_TOKENS } from '@/shared/constants/tokens'

const brandColors = [
  {
    name: 'Brand Primary',
    hex: '#0F766E',
    class: 'bg-[#0F766E] text-white',
    token: '--color-brand-primary'
  },
  {
    name: 'Brand Primary Hover',
    hex: '#115E59',
    class: 'bg-[#115E59] text-white',
    token: '--color-brand-primary-hover'
  },
  {
    name: 'Brand Primary Light',
    hex: '#F0FDFA',
    class: 'bg-[#F0FDFA] text-teal-900 border border-teal-200',
    token: '--color-brand-primary-light'
  },
  {
    name: 'Navbar Background',
    hex: '#34454F',
    class: 'bg-[#34454F] text-white',
    token: '--color-navbar-bg'
  },
  {
    name: 'Navbar Text',
    hex: '#F8FAFC',
    class: 'bg-[#34454F] text-[#F8FAFC] border border-slate-600',
    token: '--color-navbar-text'
  },
  {
    name: 'Navbar Muted',
    hex: '#CBD5E1',
    class: 'bg-[#34454F] text-[#CBD5E1] border border-slate-600',
    token: '--color-navbar-muted'
  }
]

const neutralColors = [
  {
    name: 'Background',
    hex: '#F5F7FA',
    class: 'bg-[#F5F7FA] text-slate-800 border border-slate-200',
    token: '--color-background'
  },
  {
    name: 'Surface',
    hex: '#FFFFFF',
    class: 'bg-[#FFFFFF] text-slate-800 border border-slate-200',
    token: '--color-surface'
  },
  {
    name: 'Surface Secondary',
    hex: '#F8FAFC',
    class: 'bg-[#F8FAFC] text-slate-800 border border-slate-200',
    token: '--color-surface-secondary'
  },
  { name: 'Border', hex: '#D9E0E7', class: 'bg-[#D9E0E7] text-slate-800', token: '--color-border' },
  {
    name: 'Border Strong',
    hex: '#CBD5E1',
    class: 'bg-[#CBD5E1] text-slate-800',
    token: '--color-border-strong'
  },
  {
    name: 'Text Primary',
    hex: '#1F2937',
    class: 'bg-[#1F2937] text-white',
    token: '--color-text-primary'
  },
  {
    name: 'Text Secondary',
    hex: '#64748B',
    class: 'bg-[#64748B] text-white',
    token: '--color-text-secondary'
  },
  {
    name: 'Text Muted',
    hex: '#94A3B8',
    class: 'bg-[#94A3B8] text-white',
    token: '--color-text-muted'
  }
]

const semanticColors = [
  {
    name: 'Success',
    hex: '#16A34A',
    bgHex: '#F0FDF4',
    class: 'bg-[#16A34A] text-white',
    bgClass: 'bg-[#F0FDF4] text-green-800 border border-green-200',
    token: '--color-success'
  },
  {
    name: 'Warning',
    hex: '#D97706',
    bgHex: '#FFFBEB',
    class: 'bg-[#D97706] text-white',
    bgClass: 'bg-[#FFFBEB] text-amber-800 border border-amber-200',
    token: '--color-warning'
  },
  {
    name: 'Danger',
    hex: '#DC2626',
    bgHex: '#FEF2F2',
    class: 'bg-[#DC2626] text-white',
    bgClass: 'bg-[#FEF2F2] text-red-800 border border-red-200',
    token: '--color-danger'
  },
  {
    name: 'Info',
    hex: '#2563EB',
    bgHex: '#EFF6FF',
    class: 'bg-[#2563EB] text-white',
    bgClass: 'bg-[#EFF6FF] text-blue-800 border border-blue-200',
    token: '--color-info'
  }
]

const typographyScale = [
  {
    token: 'xs',
    size: '12px',
    lineHeight: '18px',
    weight: '400 / 500',
    usage: 'Caption, helper text, badge text',
    sample: 'Kode Item: MAT-WOD-0021'
  },
  {
    token: 'sm',
    size: '13px',
    lineHeight: '20px',
    weight: '500 / 600',
    usage: 'Form label, table cells, compact UI',
    sample: 'Stok Minimum: 45 Pcs (Gudang Bahan Baku)'
  },
  {
    token: 'base',
    size: '14px',
    lineHeight: '22px',
    weight: '400 / 500',
    usage: 'Body default, input content, modal text',
    sample: 'Sistem ERP Operasional Impact Furniture v2'
  },
  {
    token: 'lg',
    size: '16px',
    lineHeight: '24px',
    weight: '600',
    usage: 'Card title, section heading, modal title',
    sample: 'Daftar Surat Perintah Kerja (SPK)'
  },
  {
    token: 'xl',
    size: '20px',
    lineHeight: '28px',
    weight: '600',
    usage: 'Sub-module title, drawer heading',
    sample: 'Detail Pengadaan Kayu Mahoni Super'
  },
  {
    token: '2xl',
    size: '24px',
    lineHeight: '32px',
    weight: '700',
    usage: 'Module title, main dashboard heading',
    sample: 'Manajemen Persediaan & Logistik'
  },
  {
    token: '3xl',
    size: '30px',
    lineHeight: '38px',
    weight: '700',
    usage: 'Primary KPI, highlight metrics',
    sample: 'Rp 1.485.250.000'
  }
]

const spacingScale = [
  { step: '1', px: '4px', width: 'w-1', usage: 'Micro spacing, icon gap' },
  { step: '2', px: '8px', width: 'w-2', usage: 'Badge padding, tight element gap' },
  { step: '3', px: '12px', width: 'w-3', usage: 'Input horizontal padding, compact gap' },
  { step: '4', px: '16px', width: 'w-4', usage: 'Standard card padding (mobile), form field gap' },
  { step: '5', px: '20px', width: 'w-5', usage: 'Card padding, compact section gap' },
  { step: '6', px: '24px', width: 'w-6', usage: 'Desktop page padding, section gap' },
  { step: '8', px: '32px', width: 'w-8', usage: 'Major section separation' },
  { step: '10', px: '40px', width: 'w-10', usage: 'Large layout block separation' },
  { step: '12', px: '48px', width: 'w-12', usage: 'Container margins' }
]

const radii = [
  { name: 'radius-sm', value: '4px', class: 'rounded-sm', usage: 'Badges, compact indicators' },
  {
    name: 'radius-md',
    value: '6px',
    class: 'rounded-md',
    usage: 'Input controls, buttons, form controls'
  },
  { name: 'radius-lg', value: '8px', class: 'rounded-lg', usage: 'Content cards, dropdown menus' },
  { name: 'radius-xl', value: '10px', class: 'rounded-xl', usage: 'Modal dialogs, popovers' }
]

const shadows = [
  {
    name: 'Shadow Subtle',
    token: '--shadow-subtle',
    class: 'shadow-subtle',
    usage: 'Cards, elevated list items'
  },
  {
    name: 'Shadow Dropdown',
    token: '--shadow-dropdown',
    class: 'shadow-dropdown',
    usage: 'Dropdown menus, popover tooltips'
  },
  {
    name: 'Shadow Modal',
    token: '--shadow-modal',
    class: 'shadow-modal',
    usage: 'Modal dialogs, slide-over panels'
  }
]

const layoutTokens = [
  {
    name: 'Header Height',
    token: '--layout-header-height',
    value: DESIGN_TOKENS.layout.headerHeight,
    usage: 'Top brand bar & user status'
  },
  {
    name: 'Navigation Height',
    token: '--layout-nav-height',
    value: DESIGN_TOKENS.layout.navigationHeight,
    usage: 'Horizontal menu bar'
  },
  {
    name: 'Content Padding',
    token: '--layout-content-padding',
    value: DESIGN_TOKENS.layout.contentPadding,
    usage: 'Standard page container padding'
  },
  {
    name: 'Card Padding',
    token: '--layout-card-padding',
    value: DESIGN_TOKENS.layout.cardPadding,
    usage: 'Interior padding of surface cards'
  },
  {
    name: 'Input Height',
    token: '--layout-input-height',
    value: DESIGN_TOKENS.layout.inputHeight,
    usage: 'Form controls baseline height'
  },
  {
    name: 'Button Height',
    token: '--layout-button-height',
    value: DESIGN_TOKENS.layout.buttonHeight,
    usage: 'Action buttons baseline height'
  },
  {
    name: 'Table Row Height',
    token: '--layout-table-row-height',
    value: DESIGN_TOKENS.layout.tableRowHeight,
    usage: 'Dense data grid row baseline'
  }
]
</script>

<template>
  <div class="min-h-screen bg-[#F5F7FA] text-[#1F2937] p-4 sm:p-6 lg:p-8 space-y-8 font-sans">
    <!-- Header Banner -->
    <header
      class="bg-white border border-[#D9E0E7] rounded-lg p-5 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
    >
      <div>
        <div class="flex items-center gap-3">
          <div
            class="w-8 h-8 rounded-md bg-[#0F766E] text-white flex items-center justify-center font-bold text-sm"
          >
            IF
          </div>
          <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-[#1F2937]">
            Impact Furniture v2 — Design System & Visual Baseline
          </h1>
        </div>
        <p class="text-xs sm:text-sm text-[#64748B] mt-1">
          Sprint 1 — Task 2 Theme Verification Preview (Development Only)
        </p>
      </div>
      <div class="flex items-center gap-2">
        <span
          class="inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-semibold bg-[#F0FDFA] text-[#0F766E] border border-teal-200"
        >
          DEVELOPMENT ONLY
        </span>
        <RouterLink
          to="/dashboard"
          class="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-[#34454F] text-white hover:bg-[#28363E] transition-colors"
        >
          Ke Dashboard
        </RouterLink>
      </div>
    </header>

    <!-- 1. Color Palette Section -->
    <section class="bg-white border border-[#D9E0E7] rounded-lg p-5 shadow-subtle space-y-6">
      <div class="border-b border-[#D9E0E7] pb-3">
        <h2 class="text-lg font-bold text-[#1F2937]">1. Color System</h2>
        <p class="text-xs text-[#64748B]">
          Palet warna enterprise terpusat untuk brand, layout neutral, dan semantic feedback.
        </p>
      </div>

      <!-- 1.1 Brand Colors -->
      <div class="space-y-3">
        <h3 class="text-sm font-semibold text-[#1F2937]">1.1 Brand & Navigation Colors</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div
            v-for="color in brandColors"
            :key="color.name"
            class="rounded-md border border-[#D9E0E7] p-3 flex flex-col justify-between h-28"
          >
            <div
              :class="[
                color.class,
                'h-10 rounded flex items-center justify-center text-xs font-bold'
              ]"
            >
              {{ color.hex }}
            </div>
            <div class="mt-2">
              <div class="text-xs font-medium text-[#1F2937] truncate">{{ color.name }}</div>
              <div class="text-[11px] text-[#64748B] font-mono">{{ color.token }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 1.2 Neutral Colors -->
      <div class="space-y-3">
        <h3 class="text-sm font-semibold text-[#1F2937]">1.2 Neutral Colors</h3>
        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div
            v-for="color in neutralColors"
            :key="color.name"
            class="rounded-md border border-[#D9E0E7] p-2.5 flex flex-col justify-between h-28"
          >
            <div
              :class="[
                color.class,
                'h-10 rounded flex items-center justify-center text-xs font-bold'
              ]"
            >
              {{ color.hex }}
            </div>
            <div class="mt-2">
              <div class="text-xs font-medium text-[#1F2937] truncate">{{ color.name }}</div>
              <div class="text-[10px] text-[#64748B] font-mono truncate">{{ color.token }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 1.3 Semantic Colors -->
      <div class="space-y-3">
        <h3 class="text-sm font-semibold text-[#1F2937]">1.3 Semantic Colors</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="color in semanticColors"
            :key="color.name"
            class="rounded-md border border-[#D9E0E7] p-3 space-y-2"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-[#1F2937]">{{ color.name }}</span>
              <span class="text-[11px] font-mono text-[#64748B]">{{ color.token }}</span>
            </div>
            <div class="flex gap-2">
              <div
                :class="[
                  color.class,
                  'flex-1 h-9 rounded flex items-center justify-center text-xs font-bold'
                ]"
              >
                Solid ({{ color.hex }})
              </div>
              <div
                :class="[
                  color.bgClass,
                  'flex-1 h-9 rounded flex items-center justify-center text-xs font-medium'
                ]"
              >
                Light Tint
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 2. Typography Scale Section -->
    <section class="bg-white border border-[#D9E0E7] rounded-lg p-5 shadow-subtle space-y-4">
      <div class="border-b border-[#D9E0E7] pb-3">
        <h2 class="text-lg font-bold text-[#1F2937]">2. Typography System (Inter)</h2>
        <p class="text-xs text-[#64748B]">
          Skala tipografi enterprise dengan baseline line-height terkontrol dan dukungan tabular
          numerals.
        </p>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b border-[#D9E0E7] bg-[#F8FAFC] text-[#64748B]">
              <th class="py-2.5 px-3 font-semibold">Token</th>
              <th class="py-2.5 px-3 font-semibold">Size / Line Height</th>
              <th class="py-2.5 px-3 font-semibold">Weight</th>
              <th class="py-2.5 px-3 font-semibold">Recommended Usage</th>
              <th class="py-2.5 px-3 font-semibold">Visual Sample</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#D9E0E7]">
            <tr v-for="item in typographyScale" :key="item.token" class="hover:bg-slate-50">
              <td class="py-2.5 px-3 font-mono font-bold text-[#0F766E]">{{ item.token }}</td>
              <td class="py-2.5 px-3 font-mono text-[#1F2937]">
                {{ item.size }} / {{ item.lineHeight }}
              </td>
              <td class="py-2.5 px-3 text-[#64748B]">{{ item.weight }}</td>
              <td class="py-2.5 px-3 text-[#64748B]">{{ item.usage }}</td>
              <td
                class="py-2.5 px-3 text-[#1F2937]"
                :style="{ fontSize: item.size, lineHeight: item.lineHeight }"
              >
                {{ item.sample }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tabular Numerals Demonstration -->
      <div class="mt-4 p-4 rounded-md bg-[#F8FAFC] border border-[#D9E0E7] space-y-2">
        <h4 class="text-xs font-bold text-[#1F2937] uppercase tracking-wider">
          Tabular Numerals Alignment (Financial Data)
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div class="p-3 bg-white rounded border border-[#D9E0E7]">
            <span class="text-xs font-semibold text-teal-800 block mb-1"
              >Standard Proportional Numerals:</span
            >
            <div class="space-y-0.5 font-mono text-[#64748B]">
              <div>Invoice #1: Rp 1.111.111,00</div>
              <div>Invoice #2: Rp 8.888.888,00</div>
              <div>Invoice #3: Rp 7.777.777,00</div>
            </div>
          </div>
          <div class="p-3 bg-white rounded border border-[#D9E0E7]">
            <span class="text-xs font-semibold text-teal-800 block mb-1"
              >Tabular Numerals (.tabular-nums):</span
            >
            <div class="space-y-0.5 tabular-nums text-right font-medium text-[#1F2937]">
              <div>Rp 1.111.111,00</div>
              <div>Rp 8.888.888,00</div>
              <div>Rp 7.777.777,00</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. Spacing System Section -->
    <section class="bg-white border border-[#D9E0E7] rounded-lg p-5 shadow-subtle space-y-4">
      <div class="border-b border-[#D9E0E7] pb-3">
        <h2 class="text-lg font-bold text-[#1F2937]">3. Spacing System (4px Baseline)</h2>
        <p class="text-xs text-[#64748B]">
          Sistem kelipatan 4px untuk density proporsional pada sistem data-heavy.
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="space in spacingScale"
          :key="space.step"
          class="flex items-center justify-between p-3 rounded-md border border-[#D9E0E7] bg-white"
        >
          <div>
            <div class="text-xs font-bold text-[#1F2937]">
              Space {{ space.step }} ({{ space.px }})
            </div>
            <div class="text-[11px] text-[#64748B]">{{ space.usage }}</div>
          </div>
          <div class="flex items-center gap-2">
            <div class="h-5 bg-[#0F766E] rounded-sm" :style="{ width: space.px }" />
            <span class="text-[11px] font-mono text-[#94A3B8] w-10 text-right">{{ space.px }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. Border Radius & Shadows -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Border Radius -->
      <section class="bg-white border border-[#D9E0E7] rounded-lg p-5 shadow-subtle space-y-4">
        <div class="border-b border-[#D9E0E7] pb-3">
          <h2 class="text-base font-bold text-[#1F2937]">4. Border Radius Tokens</h2>
          <p class="text-xs text-[#64748B]">
            Radius sudut terstandarisasi untuk komponen enterprise.
          </p>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div
            v-for="r in radii"
            :key="r.name"
            class="p-4 border-2 border-teal-600 bg-[#F0FDFA] flex flex-col justify-between"
            :style="{ borderRadius: r.value }"
          >
            <div class="text-xs font-bold text-teal-900">{{ r.name }} ({{ r.value }})</div>
            <div class="text-[11px] text-teal-700 mt-2">{{ r.usage }}</div>
          </div>
        </div>
      </section>

      <!-- Shadows -->
      <section class="bg-white border border-[#D9E0E7] rounded-lg p-5 shadow-subtle space-y-4">
        <div class="border-b border-[#D9E0E7] pb-3">
          <h2 class="text-base font-bold text-[#1F2937]">5. Shadow Levels (Elevations)</h2>
          <p class="text-xs text-[#64748B]">Tiga tingkat elevasi halus untuk hierarki visual.</p>
        </div>
        <div class="space-y-3">
          <div
            v-for="s in shadows"
            :key="s.name"
            :class="[
              s.class,
              'p-3 bg-white rounded-md border border-[#D9E0E7] flex items-center justify-between'
            ]"
          >
            <div>
              <div class="text-xs font-bold text-[#1F2937]">{{ s.name }}</div>
              <div class="text-[11px] text-[#64748B]">{{ s.usage }}</div>
            </div>
            <code class="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">{{
              s.token
            }}</code>
          </div>
        </div>
      </section>
    </div>

    <!-- 6. Layout Dimension Tokens -->
    <section class="bg-white border border-[#D9E0E7] rounded-lg p-5 shadow-subtle space-y-4">
      <div class="border-b border-[#D9E0E7] pb-3">
        <h2 class="text-lg font-bold text-[#1F2937]">6. ERP Layout Dimension Tokens</h2>
        <p class="text-xs text-[#64748B]">
          Standar ukuran vertikal dan horizontal untuk keseragaman antar halaman modul.
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <div
          v-for="layout in layoutTokens"
          :key="layout.name"
          class="p-3 bg-[#F8FAFC] border border-[#D9E0E7] rounded-md"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-[#1F2937]">{{ layout.name }}</span>
            <span class="text-xs font-mono font-bold text-[#0F766E]">{{ layout.value }}</span>
          </div>
          <div class="text-[11px] text-[#64748B] mt-1">{{ layout.usage }}</div>
          <div class="text-[10px] font-mono text-[#94A3B8] mt-1 truncate">{{ layout.token }}</div>
        </div>
      </div>
    </section>

    <!-- 7. Form Visual Baseline -->
    <section class="bg-white border border-[#D9E0E7] rounded-lg p-5 shadow-subtle space-y-4">
      <div class="border-b border-[#D9E0E7] pb-3">
        <h2 class="text-lg font-bold text-[#1F2937]">
          7. Form Visual Baseline & Interactive States
        </h2>
        <p class="text-xs text-[#64748B]">
          Styling elemen HTML native murni dengan visual state standar.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Default Text Input -->
        <div class="space-y-1">
          <label class="block text-xs font-semibold text-[#1F2937]">Default Input</label>
          <input
            type="text"
            class="w-full text-xs"
            placeholder="Masukkan nomor transaksi..."
            value="TRX-2026-0042"
          />
          <p class="text-[11px] text-[#64748B]">Helper text informasi standar.</p>
        </div>

        <!-- Hover / Focus Demonstration -->
        <div class="space-y-1">
          <label class="block text-xs font-semibold text-[#1F2937]">Interactive Focus State</label>
          <input
            type="text"
            class="w-full text-xs"
            placeholder="Klik untuk melihat focus-ring..."
          />
          <p class="text-[11px] text-[#64748B]">Fokus ring hijau teal dengan outline offset.</p>
        </div>

        <!-- Invalid / Error Input -->
        <div class="space-y-1">
          <label class="block text-xs font-semibold text-[#DC2626]">Invalid / Error State *</label>
          <input type="text" class="w-full text-xs" aria-invalid="true" value="NILAI-TIDAK-VALID" />
          <p class="text-[11px] text-[#DC2626] font-medium">
            Format kode barang tidak sesuai pola!
          </p>
        </div>

        <!-- Readonly Input -->
        <div class="space-y-1">
          <label class="block text-xs font-semibold text-[#1F2937]">Read-Only Input</label>
          <input type="text" class="w-full text-xs" readonly value="TOTAL_HARGA: Rp 3.500.000" />
          <p class="text-[11px] text-[#64748B]">Hanya baca dengan surface secondary background.</p>
        </div>

        <!-- Disabled Input -->
        <div class="space-y-1">
          <label class="block text-xs font-semibold text-[#94A3B8]">Disabled Input</label>
          <input type="text" class="w-full text-xs" disabled value="Fitur Terkunci (Nonaktif)" />
          <p class="text-[11px] text-[#94A3B8]">
            Cursor not-allowed dengan warna disabled terstandar.
          </p>
        </div>

        <!-- Select Dropdown -->
        <div class="space-y-1">
          <label class="block text-xs font-semibold text-[#1F2937]">Native Select Dropdown</label>
          <select class="w-full text-xs">
            <option>Gudang Utama (Cikande)</option>
            <option>Gudang Transit (Jakarta)</option>
            <option>Gudang Bahan Mentah (Jepara)</option>
          </select>
          <p class="text-[11px] text-[#64748B]">Select baseline dengan border radius 6px.</p>
        </div>
      </div>

      <!-- Checkboxes & Radios Baseline -->
      <div class="pt-4 border-t border-[#D9E0E7] flex flex-wrap gap-6 items-center">
        <label
          class="inline-flex items-center gap-2 text-xs font-medium text-[#1F2937] cursor-pointer"
        >
          <input type="checkbox" checked class="w-4 h-4" />
          <span>Checkbox Aktif (Checked)</span>
        </label>
        <label
          class="inline-flex items-center gap-2 text-xs font-medium text-[#1F2937] cursor-pointer"
        >
          <input type="checkbox" class="w-4 h-4" />
          <span>Checkbox Kosong (Unchecked)</span>
        </label>
        <label
          class="inline-flex items-center gap-2 text-xs font-medium text-[#94A3B8] cursor-not-allowed"
        >
          <input type="checkbox" disabled checked class="w-4 h-4" />
          <span>Checkbox Disabled</span>
        </label>
        <label
          class="inline-flex items-center gap-2 text-xs font-medium text-[#1F2937] cursor-pointer"
        >
          <input type="radio" name="demo-radio" checked class="w-4 h-4" />
          <span>Radio Opsi A</span>
        </label>
        <label
          class="inline-flex items-center gap-2 text-xs font-medium text-[#1F2937] cursor-pointer"
        >
          <input type="radio" name="demo-radio" class="w-4 h-4" />
          <span>Radio Opsi B</span>
        </label>
      </div>
    </section>

    <!-- 8. Semantic Status Badges & Surface Hierarchy -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Status Badges -->
      <section class="bg-white border border-[#D9E0E7] rounded-lg p-5 shadow-subtle space-y-4">
        <div class="border-b border-[#D9E0E7] pb-3">
          <h2 class="text-base font-bold text-[#1F2937]">8. Semantic Status Badges</h2>
          <p class="text-xs text-[#64748B]">
            Indikator status transaksional ERP dengan teks yang informatif.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-semibold bg-[#F0FDF4] text-[#16A34A] border border-green-200"
          >
            Selesai / Approved
          </span>
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-semibold bg-[#FFFBEB] text-[#D97706] border border-amber-200"
          >
            Menunggu Verifikasi
          </span>
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-semibold bg-[#FEF2F2] text-[#DC2626] border border-red-200"
          >
            Ditolak / Dibatalkan
          </span>
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] border border-blue-200"
          >
            Dalam Proses Produksi
          </span>
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-semibold bg-[#F1F5F9] text-[#64748B] border border-slate-200"
          >
            Draft
          </span>
        </div>
      </section>

      <!-- Surface Hierarchy -->
      <section class="bg-[#F5F7FA] border border-[#D9E0E7] rounded-lg p-5 space-y-3">
        <div class="border-b border-[#D9E0E7] pb-2">
          <h2 class="text-base font-bold text-[#1F2937]">9. Surface Layering Hierarchy</h2>
          <p class="text-xs text-[#64748B]">
            Struktur kedalaman layout ERP dari Background ke Surface dan Nested Card.
          </p>
        </div>
        <div class="p-3 bg-white border border-[#D9E0E7] rounded-md shadow-subtle space-y-2">
          <div class="text-xs font-bold text-[#1F2937]">Level 1: Surface Card (#FFFFFF)</div>
          <div class="p-2.5 bg-[#F8FAFC] border border-[#D9E0E7] rounded text-xs text-[#64748B]">
            Level 2: Surface Secondary (#F8FAFC) — Digunakan untuk filter toolbar, tabel sub-header,
            atau preview panel.
          </div>
        </div>
      </section>
    </div>

    <!-- 10. Responsive Breakpoint Guidelines -->
    <section class="bg-white border border-[#D9E0E7] rounded-lg p-5 shadow-subtle space-y-4">
      <div class="border-b border-[#D9E0E7] pb-3">
        <h2 class="text-lg font-bold text-[#1F2937]">10. Responsive Testing Guidelines</h2>
        <p class="text-xs text-[#64748B]">
          Target breakpoint verifikasi antarmuka enterprise Impact Furniture v2.
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div class="p-3 rounded-md bg-[#F8FAFC] border border-[#D9E0E7] space-y-1">
          <div class="font-bold text-[#0F766E]">Mobile (375px)</div>
          <p class="text-[#64748B]">
            Padding 12-16px, form satu kolom penuh, tabel horizontal scroll dengan freeze column.
          </p>
        </div>
        <div class="p-3 rounded-md bg-[#F8FAFC] border border-[#D9E0E7] space-y-1">
          <div class="font-bold text-[#0F766E]">Tablet (768px)</div>
          <p class="text-[#64748B]">
            Padding 16-20px, layout dua kolom untuk form, navbar responsif dengan mobile drawer.
          </p>
        </div>
        <div class="p-3 rounded-md bg-[#F8FAFC] border border-[#D9E0E7] space-y-1">
          <div class="font-bold text-[#0F766E]">Desktop (1366px)</div>
          <p class="text-[#64748B]">
            Target resolusi operasional utama: compact layout, full horizontal navigation, dense
            data grids.
          </p>
        </div>
        <div class="p-3 rounded-md bg-[#F8FAFC] border border-[#D9E0E7] space-y-1">
          <div class="font-bold text-[#0F766E]">Wide Monitor (1920px)</div>
          <p class="text-[#64748B]">
            Maksimalisasi visibilitas tabel multi-kolom tanpa stretch yang merusak rasio elemen
            visual.
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
