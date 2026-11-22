<script setup lang="ts">
import type { CoaAccount, CoaTreeNodeAccount } from '../types/coa.types'
import { AlertTriangle, Lock, Trash2 } from 'lucide-vue-next'

defineProps<{
  isOpen: boolean
  account: CoaAccount | CoaTreeNodeAccount | null
  isLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm-delete', accountId: number): void
  (e: 'deactivate-instead', account: CoaAccount | CoaTreeNodeAccount): void
}>()
</script>

<template>
  <div
    v-if="isOpen && account"
    class="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-2xs flex items-center justify-center p-4"
    @click.self="emit('close')"
  >
    <div class="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200">
      <!-- In-Use State (CANNOT DELETE) -->
      <div v-if="account.is_used" class="p-6">
        <div class="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mx-auto mb-4">
          <Lock class="w-6 h-6" />
        </div>

        <h3 class="text-base font-bold text-gray-900 text-center">
          Rekening Tidak Dapat Dihapus
        </h3>

        <div class="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
          <p class="font-semibold mb-1">
            Rekening [{{ account.no_ref }}] {{ account.nama }}
          </p>
          <p class="text-amber-800">
            Rekening ini sudah digunakan dalam {{ account.transaction_count || 0 }} transaksi akuntansi dan tidak dapat dihapus demi menjaga integritas data jurnal serta neraca historis.
          </p>
        </div>

        <p class="text-xs text-gray-500 text-center mt-3">
          Anda dapat menonaktifkan rekening ini agar tidak dapat dipilih lagi untuk pencatatan transaksi baru.
        </p>

        <div class="mt-6 flex items-center justify-end space-x-2">
          <button
            type="button"
            class="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            @click="emit('close')"
          >
            Tutup
          </button>
          <button
            type="button"
            class="px-4 py-2 text-xs font-semibold text-amber-700 bg-amber-100 border border-amber-300 rounded-lg hover:bg-amber-200"
            @click="emit('deactivate-instead', account)"
          >
            Nonaktifkan Rekening Ini
          </button>
        </div>
      </div>

      <!-- Safe to Delete State -->
      <div v-else class="p-6">
        <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mx-auto mb-4">
          <AlertTriangle class="w-6 h-6" />
        </div>

        <h3 class="text-base font-bold text-gray-900 text-center">
          Konfirmasi Hapus Rekening
        </h3>

        <p class="text-xs text-gray-600 text-center mt-2">
          Apakah Anda yakin ingin menghapus rekening berikut?
        </p>

        <div class="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-center font-mono">
          <span class="font-bold text-gray-900">[{{ account.no_ref }}] {{ account.nama }}</span>
        </div>

        <p class="text-2xs text-gray-400 text-center mt-2">
          Rekening ini belum pernah digunakan dalam transaksi akuntansi.
        </p>

        <div class="mt-6 flex items-center justify-end space-x-2">
          <button
            type="button"
            class="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            @click="emit('close')"
          >
            Batal
          </button>
          <button
            type="button"
            :disabled="isLoading"
            class="px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
            @click="emit('confirm-delete', account.id)"
          >
            <Trash2 class="w-3.5 h-3.5 mr-1.5" />
            Ya, Hapus Rekening
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-2xs {
  font-size: 0.6875rem;
  line-height: 0.875rem;
}
</style>
