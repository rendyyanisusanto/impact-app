import { ref, reactive, computed } from 'vue'
import type {
  BillPaymentFormValues,
  EligibleGoodsReceiptForPayment,
  PbAllocationItem
} from '../types/bill-payment.types'
import { billPaymentService } from '../services/bill-payment.service'
import { calculateBillPaymentSummary, roundDecimal } from '../utils/bill-payment-calculations'
import { validateBillPaymentForm } from '../utils/bill-payment-validation'

export function useBillPaymentForm(initialValues?: Partial<BillPaymentFormValues>) {
  const form = reactive<BillPaymentFormValues>({
    id: initialValues?.id,
    kode: initialValues?.kode || '',
    no_tagihan: initialValues?.no_tagihan || '',
    tanggal: initialValues?.tanggal || new Date().toISOString().slice(0, 10),
    jatuh_tempo: initialValues?.jatuh_tempo || '',
    penagih: initialValues?.penagih || '',
    suplier_id: initialValues?.suplier_id ?? null,
    keterangan: initialValues?.keterangan || '',
    status: initialValues?.status ?? 0,
    selected_pb_ids: initialValues?.selected_pb_ids ? [...initialValues.selected_pb_ids] : [],
    allocations: initialValues?.allocations ? [...initialValues.allocations] : [],
    payment_methods: initialValues?.payment_methods
      ? initialValues.payment_methods.map(m => ({ ...m }))
      : [
        {
          metode_pembayaran: 'Transfer Bank',
          bank_id: 1,
          jumlah: 0,
          keterangan: ''
        }
      ]
  })

  const eligiblePbs = ref<EligibleGoodsReceiptForPayment[]>([])
  const isLoadingEligible = ref(false)
  const errors = ref<Record<string, string>>({})
  const isSubmitting = ref(false)
  const isDirty = ref(false)

  // Selected PB objects
  const selectedPbItems = computed(() => {
    return eligiblePbs.value.filter(pb => form.selected_pb_ids.includes(pb.id))
  })

  // Live Summary Calculation
  const summary = computed(() => {
    return calculateBillPaymentSummary(selectedPbItems.value, form.payment_methods)
  })

  async function loadEligiblePbs(supplierId: number, currentPtId?: number) {
    if (!supplierId) {
      eligiblePbs.value = []
      return
    }

    isLoadingEligible.value = true
    try {
      const pbs = await billPaymentService.getEligibleGoodsReceipts(supplierId, currentPtId)
      eligiblePbs.value = pbs.map(pb => {
        const isSelected = form.selected_pb_ids.includes(pb.id)
        const initialAlloc = pb.nominal_alokasi !== undefined && pb.nominal_alokasi > 0
          ? pb.nominal_alokasi
          : (isSelected ? pb.sisa_tagihan : 0)

        return {
          ...pb,
          isSelected,
          nominal_alokasi: initialAlloc,
          sisa_setelah_bayar: roundDecimal(Math.max(0, pb.sisa_tagihan - initialAlloc))
        }
      })

      // Auto-populate method amount if 1 method and jumlah == 0
      if (
        form.selected_pb_ids.length > 0 &&
        form.payment_methods.length === 1 &&
        form.payment_methods[0].jumlah === 0
      ) {
        syncMethodsWithAllocations()
      }
    } finally {
      isLoadingEligible.value = false
    }
  }

  function togglePbSelection(pbId: number) {
    isDirty.value = true
    const index = form.selected_pb_ids.indexOf(pbId)
    const pb = eligiblePbs.value.find(p => p.id === pbId)

    if (index === -1) {
      form.selected_pb_ids.push(pbId)
      if (pb) {
        pb.isSelected = true
        // Default allocation to full remaining balance
        if (!pb.nominal_alokasi || pb.nominal_alokasi <= 0) {
          pb.nominal_alokasi = pb.sisa_tagihan
        }
        pb.sisa_setelah_bayar = roundDecimal(Math.max(0, pb.sisa_tagihan - pb.nominal_alokasi))
      }
    } else {
      form.selected_pb_ids.splice(index, 1)
      if (pb) {
        pb.isSelected = false
        pb.nominal_alokasi = 0
        pb.sisa_setelah_bayar = pb.sisa_tagihan
      }
    }

    // Auto-update single payment method if currently active
    if (form.payment_methods.length === 1) {
      syncMethodsWithAllocations()
    }
  }

  function setPbAllocation(pbId: number, amount: number) {
    isDirty.value = true
    const pb = eligiblePbs.value.find(p => p.id === pbId)
    if (!pb) return

    const sanitized = Math.max(0, Number(amount) || 0)
    pb.nominal_alokasi = sanitized
    pb.sisa_setelah_bayar = roundDecimal(Math.max(0, pb.sisa_tagihan - sanitized))

    // Ensure it is in selected_pb_ids if amount > 0
    if (sanitized > 0 && !form.selected_pb_ids.includes(pbId)) {
      form.selected_pb_ids.push(pbId)
      pb.isSelected = true
    }

    if (form.payment_methods.length === 1) {
      syncMethodsWithAllocations()
    }
  }

  function fillRemainingForPb(pbId: number) {
    isDirty.value = true
    const pb = eligiblePbs.value.find(p => p.id === pbId)
    if (!pb) return

    if (!form.selected_pb_ids.includes(pbId)) {
      form.selected_pb_ids.push(pbId)
      pb.isSelected = true
    }

    pb.nominal_alokasi = pb.sisa_tagihan
    pb.sisa_setelah_bayar = 0

    if (form.payment_methods.length === 1) {
      syncMethodsWithAllocations()
    }
  }

  function syncMethodsWithAllocations() {
    const totalAlloc = roundDecimal(
      selectedPbItems.value.reduce((sum, pb) => sum + (Number(pb.nominal_alokasi) || 0), 0)
    )
    if (form.payment_methods.length === 1) {
      form.payment_methods[0].jumlah = totalAlloc
    }
  }

  function addPaymentMethod() {
    isDirty.value = true
    form.payment_methods.push({
      metode_pembayaran: 'Transfer Bank',
      bank_id: 1,
      jumlah: 0,
      keterangan: ''
    })
  }

  function removePaymentMethod(index: number) {
    if (form.payment_methods.length > 1) {
      isDirty.value = true
      form.payment_methods.splice(index, 1)
    }
  }

  function getCalculatedAllocations(): PbAllocationItem[] {
    return selectedPbItems.value.map(pb => ({
      pb_id: pb.id,
      nominal_alokasi: Number(pb.nominal_alokasi) || 0
    }))
  }

  function validate(): boolean {
    const result = validateBillPaymentForm(form, selectedPbItems.value)
    errors.value = result.errors
    return result.isValid
  }

  return {
    form,
    eligiblePbs,
    isLoadingEligible,
    selectedPbItems,
    summary,
    errors,
    isSubmitting,
    isDirty,
    loadEligiblePbs,
    togglePbSelection,
    setPbAllocation,
    fillRemainingForPb,
    syncMethodsWithAllocations,
    getCalculatedAllocations,
    addPaymentMethod,
    removePaymentMethod,
    validate
  }
}
