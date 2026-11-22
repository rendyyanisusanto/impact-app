/**
 * Validation rules for Bill Payment (Pembayaran Tagihan)
 */

import type { BillPaymentFormValues, EligibleGoodsReceiptForPayment } from '../types/bill-payment.types'
import { calculateBillPaymentSummary } from './bill-payment-calculations'

export interface BillPaymentValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export function validateBillPaymentForm(
  form: BillPaymentFormValues,
  selectedPbs: Array<EligibleGoodsReceiptForPayment | { id?: number; total_pb: number; sudah_dibayar: number; sisa_tagihan?: number; nominal_alokasi?: number }>
): BillPaymentValidationResult {
  const errors: Record<string, string> = {}

  if (!form.kode?.trim()) {
    errors.kode = 'Kode Pembayaran wajib diisi.'
  }

  if (!form.suplier_id) {
    errors.suplier_id = 'Supplier wajib dipilih.'
  }

  if (!form.no_tagihan?.trim()) {
    errors.no_tagihan = 'Nomor tagihan / invoice wajib diisi.'
  }

  if (!form.tanggal?.trim()) {
    errors.tanggal = 'Tanggal pembayaran wajib diisi.'
  }

  if (!form.selected_pb_ids || form.selected_pb_ids.length === 0) {
    errors.selected_pb_ids = 'Pilih setidaknya satu dokumen Penerimaan Barang (PB) untuk dibayar.'
  }

  // Validate per-PB allocation
  const hasAllocations = selectedPbs.some(pb => pb.nominal_alokasi !== undefined && pb.nominal_alokasi !== null)
  if (hasAllocations) {
    selectedPbs.forEach(pb => {
      const sisa = pb.sisa_tagihan !== undefined ? pb.sisa_tagihan : Math.max(0, pb.total_pb - pb.sudah_dibayar)
      const alokasi = Number(pb.nominal_alokasi) || 0
      if (alokasi <= 0 && form.selected_pb_ids.includes((pb as any).id)) {
        errors[`pb_${(pb as any).id}_alokasi`] = 'Nominal bayar harus lebih dari 0.'
      } else if (alokasi > sisa + 0.01) {
        errors[`pb_${(pb as any).id}_alokasi`] = `Nominal bayar melebihi sisa tagihan (Rp ${sisa.toLocaleString('id-ID')}).`
      }
    })
  }

  // Validate payment methods
  if (!form.payment_methods || form.payment_methods.length === 0) {
    errors.payment_methods = 'Tambahkan setidaknya satu rincian metode pembayaran.'
  } else {
    let hasValidAmount = false
    form.payment_methods.forEach((method, index) => {
      if (!method.metode_pembayaran) {
        errors[`method_${index}_type`] = 'Pilih metode pembayaran.'
      }
      if (method.metode_pembayaran === 'Transfer Bank' && !method.bank_id) {
        errors[`method_${index}_bank`] = 'Pilih rekening bank tujuan transfer.'
      }
      if (Number(method.jumlah) <= 0) {
        errors[`method_${index}_amount`] = 'Nominal pembayaran harus lebih dari 0.'
      } else {
        hasValidAmount = true
      }
    })

    if (!hasValidAmount && !errors.payment_methods) {
      errors.payment_methods = 'Total nominal pembayaran harus lebih besar dari 0.'
    }
  }

  // Summary calculations and Overpayment / Mismatch prevention
  if (form.selected_pb_ids?.length > 0 && form.payment_methods?.length > 0) {
    const summary = calculateBillPaymentSummary(selectedPbs as any, form.payment_methods)

    if (summary.total_bayar > summary.sisa_tagihan + 0.01) {
      errors.overpayment = `Total pembayaran (Rp ${summary.total_bayar.toLocaleString('id-ID')}) melebihi sisa tagihan (Rp ${summary.sisa_tagihan.toLocaleString('id-ID')}).`
    }

    if (summary.is_mismatched) {
      errors.mismatch = `Total metode pembayaran (Rp ${summary.total_bayar.toLocaleString('id-ID')}) harus sama persis dengan total alokasi tagihan PB (Rp ${summary.total_alokasi_pb.toLocaleString('id-ID')}). Selisih: Rp ${Math.abs(summary.selisih_metode_alokasi).toLocaleString('id-ID')}.`
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}
