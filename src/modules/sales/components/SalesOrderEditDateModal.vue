<script setup lang="ts">
import { ref, watch } from 'vue'
import { Calendar, AlertCircle } from 'lucide-vue-next'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppTextarea from '@/shared/components/ui/AppTextarea.vue'
import { useToast } from '@/shared/composables/useToast'
import type { SalesOrderListItem } from '../types/sales-order.types'
import { salesOrderTransactionService } from '../services/sales-order-transaction.service'

const props = defineProps<{
  isOpen: boolean
  order: SalesOrderListItem | null
}>()

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void
  (e: 'success'): void
}>()

const toast = useToast()

const newDate = ref('')
const reason = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')

watch(
  () => [props.isOpen, props.order],
  ([isOpen]) => {
    if (isOpen && props.order) {
      newDate.value = props.order.tanggal
      reason.value = ''
      errorMessage.value = ''
    }
  }
)

async function handleSubmit(): Promise<void> {
  if (!props.order) return

  if (!newDate.value) {
    errorMessage.value = 'Tanggal baru wajib diisi.'
    return
  }

  if (newDate.value === props.order.tanggal) {
    errorMessage.value = 'Tanggal baru harus berbeda dari tanggal lama.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const success = await salesOrderTransactionService.updateOrderDate(
      props.order.id,
      newDate.value,
      reason.value || undefined
    )

    if (success) {
      toast.success(
        `Tanggal Sales Order ${props.order.kode} berhasil diperbarui ke ${newDate.value}.`
      )
      emit('success')
      emit('update:isOpen', false)
    } else {
      errorMessage.value = 'Gagal memperbarui tanggal transaksi.'
    }
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AppModal
    :model-value="isOpen"
    title="Edit Tanggal Sales Order"
    size="md"
    @update:model-value="emit('update:isOpen', $event)"
  >
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <!-- Error Alert -->
      <div
        v-if="errorMessage"
        class="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-700"
      >
        <AlertCircle class="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
        <span>{{ errorMessage }}</span>
      </div>

      <!-- No. Sales Order (Read-only) -->
      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1"> Nomor Sales Order </label>
        <input
          type="text"
          :value="order?.kode"
          disabled
          class="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-300 rounded-lg text-slate-600 font-mono font-medium cursor-not-allowed select-none"
        />
      </div>

      <!-- Tanggal Lama (Read-only) -->
      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1"> Tanggal Lama </label>
        <input
          type="text"
          :value="order?.tanggal"
          disabled
          class="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-300 rounded-lg text-slate-600 font-mono cursor-not-allowed select-none"
        />
      </div>

      <!-- Tanggal Baru (Editable) -->
      <div>
        <label for="new-so-date" class="block text-xs font-semibold text-slate-700 mb-1">
          Tanggal Baru <span class="text-rose-500">*</span>
        </label>
        <div class="relative">
          <AppInput
            id="new-so-date"
            v-model="newDate"
            type="date"
            class="w-full"
            required
            :disabled="isSubmitting"
          />
        </div>
        <p class="text-[11px] text-slate-500 mt-1">
          Perubahan tanggal akan dicatat ke audit log histori Sales Order.
        </p>
      </div>

      <!-- Alasan Perubahan -->
      <div>
        <label for="edit-date-reason" class="block text-xs font-semibold text-slate-700 mb-1">
          Alasan Perubahan (Opsional)
        </label>
        <AppTextarea
          id="edit-date-reason"
          v-model="reason"
          :rows="3"
          placeholder="Tuliskan alasan penyesuaian tanggal dokumen..."
          :disabled="isSubmitting"
        />
      </div>

      <!-- Footer Buttons -->
      <div class="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
        <AppButton
          type="button"
          variant="outline"
          size="sm"
          :disabled="isSubmitting"
          @click="emit('update:isOpen', false)"
        >
          Batal
        </AppButton>
        <AppButton type="submit" variant="primary" size="sm" :loading="isSubmitting">
          <template #iconLeft>
            <Calendar class="w-4 h-4" />
          </template>
          Simpan Perubahan
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>
