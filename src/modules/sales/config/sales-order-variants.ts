export type SalesOrderVariantKey = 'impact' | 'pola' | 'ks'

export interface SalesOrderVariantConfig {
  key: SalesOrderVariantKey
  orderType: 'PPN' | 'NON_PPN' | 'NON_PPN_2'
  label: string
  shortLabel: string
  subTitle: string
  routePrefix: string
  codePattern: string
  hasTax: boolean
  hasTaxInvoiceNumber: boolean
  brandingName: string
  companyLetterhead: {
    title: string
    address: string
    phone: string
  }
}

export const SALES_ORDER_VARIANTS: Record<SalesOrderVariantKey, SalesOrderVariantConfig> = {
  impact: {
    key: 'impact',
    orderType: 'PPN',
    label: 'Sales Order Impact',
    shortLabel: 'SO Impact',
    subTitle: 'Sales order resmi PT Impact Furniture dengan faktur pajak & PPN aktif',
    routePrefix: '/sales/so-impact',
    codePattern: 'SO/{year}/{romawi_bulan}/{last_number}',
    hasTax: true,
    hasTaxInvoiceNumber: true,
    brandingName: 'IMPACT FURNITURE',
    companyLetterhead: {
      title: 'IMPACT FURNITURE',
      address: 'Jl. Pogot No.72, Tanah Kali Kedinding, Kec. Kenjeran, Surabaya, Jawa Timur 60129',
      phone: '081334791464'
    }
  },
  pola: {
    key: 'pola',
    orderType: 'NON_PPN',
    label: 'Sales Order Pola',
    shortLabel: 'SO Pola',
    subTitle: 'Sales order divisi Polaris Furniture transaksi non-PPN',
    routePrefix: '/sales/so-pola',
    codePattern: 'SO/{year}/PL/{month}/{last_number}',
    hasTax: false,
    hasTaxInvoiceNumber: false,
    brandingName: 'POLARIS FURNITURE',
    companyLetterhead: {
      title: 'POLARIS FURNITURE',
      address: 'Jalan Pogot No. 72, Surabaya - 60129',
      phone: '081334791464'
    }
  },
  ks: {
    key: 'ks',
    orderType: 'NON_PPN_2',
    label: 'Sales Order KS',
    shortLabel: 'SO KS',
    subTitle: 'Sales order divisi KS transaksi non-PPN',
    routePrefix: '/sales/so-ks',
    codePattern: 'SO/{year}/{month}/{last_number}',
    hasTax: false,
    hasTaxInvoiceNumber: false,
    brandingName: 'IMPACT FURNITURE (KS)',
    companyLetterhead: {
      title: 'IMPACT FURNITURE (KS)',
      address: 'Jl. Pogot No.72, Surabaya, Jawa Timur 60129',
      phone: '081334791464'
    }
  }
}

export function getVariantConfig(variant: SalesOrderVariantKey): SalesOrderVariantConfig {
  const cfg = SALES_ORDER_VARIANTS[variant]
  if (!cfg) {
    throw new Error(`Variant Sales Order '${variant}' tidak valid.`)
  }
  return cfg
}

export function getVariantByOrderType(orderType: string): SalesOrderVariantConfig {
  const found = Object.values(SALES_ORDER_VARIANTS).find(v => v.orderType === orderType)
  return found || SALES_ORDER_VARIANTS.impact
}
