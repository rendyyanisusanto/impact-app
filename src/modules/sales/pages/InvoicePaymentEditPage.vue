<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, AlertCircle } from 'lucide-vue-next'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppSkeleton from '@/shared/components/ui/AppSkeleton.vue'
import InvoicePaymentForm from '../components/InvoicePaymentForm.vue'
import { salesPaymentService } from '../services/sales-payment.service'
import type {
  SalesPayment,
  SalesInvoicePaymentSummary,
  CreatePaymentPayload,
  UpdatePaymentPayload
} from '../types/sales-payment.types'
import { useToast } from '@/shared/composables/useToast'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const paymentId = computed(() => Number(route.params.id))
const payment = ref<SalesPayment | null>(null)
const invoiceSummary = ref<SalesInvoicePaymentSummary | null>(null)
const isLoading = ref(true)
const isSubmitting = ref(false)

const isEditable = computed(() => {
  if (!payment.value) return false
  return payment.value.status === 1 && !payment.value.is_posted_to_finance
})

const uneditableReason = computed(() => {
  if (!payment.value) return ''
  if (payment.value.status === 0) {
    return 'Pembayaran telah dibatalkan dan tidak dapat diubah.'
  }
  if (payment.value.is_posted_to_finance) {
    return 'Pembayaran telah diposting ke Keuangan. Silakan gunakan jurnal pembalik pada modul Keuangan.'
  }
  return ''
})

const loadData = async () => {
  isLoading.value = true
  try {
    const p = await salesPaymentService.getPaymentById(paymentId.value)
    if (!p) {
      toast.error('Data pembayaran tidak ditemukan.')
      router.push('/sales/invoice-payments')
      return
    }
    payment.value = p

    const summary = await salesPaymentService.getInvoicePaymentSummary(p.invoice_id)
    invoiceSummary.value = summary
  } catch (err: unknown) {
    console.error('Failed to load payment for edit:', err)
    const msg = err instanceof Error ? err.message : 'Gagal memuat data pembayaran.'
    toast.error(msg)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

const handleSubmitEdit = async (payload: CreatePaymentPayload | UpdatePaymentPayload) => {
  if (!payment.value || !isEditable.value) return
  isSubmitting.value = true
  try {
    await salesPaymentService.updatePayment(payment.value.id, payload as UpdatePaymentPayload)
    toast.success(`Pembayaran ${payment.value.kode} berhasil diperbarui.`)
    router.push(`/sales/invoice-payments/${payment.value.id}`)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memperbarui pembayaran.'
    toast.error(msg)
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  if (payment.value) {
    router.push(`/sales/invoice-payments/${payment.value.id}`)
  } else {
    router.push('/sales/invoice-payments')
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <AppPageHeader
      :title="`Edit Pembayaran ${payment?.kode || ''}`"
      description="Perubahan informasi pembayaran dan penyesuaian nominal tagihan"
      :breadcrumbs="[
        { label: 'Beranda', to: '/' },
        { label: 'Penjualan', to: '/sales/orders/impact' },
        { label: 'Pembayaran Invoice', to: '/sales/invoice-payments' },
        { label: 'Edit Pembayaran' }
      ]"
    >
      <template #actions>
        <AppButton variant="outline" size="sm" data-test="btn-back" @click="handleCancel">
          <template #icon>
            <ArrowLeft class="w-4 h-4" />
          </template>
          Kembali
        </AppButton>
      </template>
    </AppPageHeader>

    <div v-if="isLoading" class="space-y-4">
      <AppSkeleton height="120px" />
      <AppSkeleton height="350px" />
    </div>

    <!-- Guard Alert if not editable -->
    <div
      v-else-if="!isEditable"
      data-test="alert-uneditable"
      class="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3"
    >
      <AlertCircle class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div>
        <h4 class="text-sm font-bold text-amber-900">Pembayaran Tidak Dapat Diedit</h4>
        <p class="text-xs text-amber-700 mt-0.5">
          {{ uneditableReason }}
        </p>
        <div class="mt-3">
          <button
            type="button"
            class="text-xs font-semibold text-amber-800 underline"
            @click="handleCancel"
          >
            Kembali ke Detail Pembayaran
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Form -->
    <div v-else-if="payment && invoiceSummary">
      <InvoicePaymentForm
        :invoice-summary="invoiceSummary"
        :initial-data="payment"
        :is-submitting="isSubmitting"
        mode="edit"
        @submit="handleSubmitEdit"
        @cancel="handleCancel"
      />
    </div>
  </div>
</template>
