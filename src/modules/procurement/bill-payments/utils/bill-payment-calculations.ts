/**
 * Calculation Utilities for Bill Payments (Pembayaran Tagihan)
 */

export function roundDecimal(num: number, decimals = 2): number {
  const factor = Math.pow(10, decimals)
  return Math.round((num + Number.EPSILON) * factor) / factor
}

export function calculateTotalPayment(
  methods: Array<{ jumlah: number | null | undefined }>
): number {
  return roundDecimal(methods.reduce((sum, item) => sum + (Number(item.jumlah) || 0), 0))
}

export interface BillPaymentCalculationResult {
  total_tagihan: number
  total_sudah_dibayar: number
  sisa_tagihan: number
  total_bayar: number
  total_alokasi_pb: number
  selisih_metode_alokasi: number
  is_mismatched: boolean
  sisa_setelah_bayar: number
  is_lunas: boolean
}

export function calculateBillPaymentSummary(
  selectedPbs: Array<{ total_pb: number; sudah_dibayar: number; nominal_alokasi?: number }>,
  methods: Array<{ jumlah: number | null | undefined }>
): BillPaymentCalculationResult {
  const totalTagihan = roundDecimal(
    selectedPbs.reduce((sum, pb) => sum + (Number(pb.total_pb) || 0), 0)
  )
  const totalSudahDibayar = roundDecimal(
    selectedPbs.reduce((sum, pb) => sum + (Number(pb.sudah_dibayar) || 0), 0)
  )
  const sisaTagihan = roundDecimal(Math.max(0, totalTagihan - totalSudahDibayar))
  const totalBayar = calculateTotalPayment(methods)

  const hasExplicitAllocations = selectedPbs.some(
    pb => pb.nominal_alokasi !== undefined && pb.nominal_alokasi !== null && pb.nominal_alokasi > 0
  )
  const totalAlokasiPb = hasExplicitAllocations
    ? roundDecimal(selectedPbs.reduce((sum, pb) => sum + (Number(pb.nominal_alokasi) || 0), 0))
    : totalBayar

  const selisih = roundDecimal(totalBayar - totalAlokasiPb)
  const isMismatched = hasExplicitAllocations && totalAlokasiPb > 0 && Math.abs(selisih) > 0.01

  const sisaSetelahBayar = roundDecimal(Math.max(0, sisaTagihan - totalAlokasiPb))

  return {
    total_tagihan: totalTagihan,
    total_sudah_dibayar: totalSudahDibayar,
    sisa_tagihan: sisaTagihan,
    total_bayar: totalBayar,
    total_alokasi_pb: totalAlokasiPb,
    selisih_metode_alokasi: selisih,
    is_mismatched: isMismatched,
    sisa_setelah_bayar: sisaSetelahBayar,
    is_lunas: sisaSetelahBayar <= 0.01 && sisaTagihan > 0
  }
}
