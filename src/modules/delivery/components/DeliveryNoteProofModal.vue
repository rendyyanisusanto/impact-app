<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, FileCheck2, User, CheckCircle, ExternalLink } from 'lucide-vue-next'
import type { DeliveryProofPayload } from '../types/delivery-note.types'

interface Props {
  isOpen: boolean
  deliveryId?: number
  deliveryCode?: string
  recipientName?: string | null
  proofUrl?: string | null
  deliveryNoteText?: string | null
  mode?: 'view' | 'confirm'
  isSubmitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  deliveryId: 0,
  deliveryCode: '',
  recipientName: '',
  proofUrl: '',
  deliveryNoteText: '',
  mode: 'view',
  isSubmitting: false
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', payload: DeliveryProofPayload): void
}>()

const form = ref<DeliveryProofPayload>({
  penerima: '',
  tanggal_terima: new Date().toISOString().slice(0, 10),
  foto_bukti: '',
  note: ''
})

watch(
  () => props.isOpen,
  val => {
    if (val) {
      form.value = {
        penerima: props.recipientName || '',
        tanggal_terima: new Date().toISOString().slice(0, 10),
        foto_bukti:
          props.proofUrl ||
          'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80',
        note: props.deliveryNoteText || ''
      }
    }
  },
  { immediate: true }
)

const handleSubmit = () => {
  if (!form.value.penerima.trim()) {
    alert('Nama penerima barang wajib diisi.')
    return
  }
  if (!form.value.foto_bukti.trim()) {
    alert('Foto / bukti pengiriman wajib dilampirkan.')
    return
  }
  emit('confirm', { ...form.value })
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    data-test="proof-modal-overlay"
    @click.self="emit('close')"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <!-- Modal Header -->
      <div
        class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/80"
      >
        <div class="flex items-center gap-2.5">
          <div
            class="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
          >
            <FileCheck2 class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">
              {{ mode === 'confirm' ? 'Konfirmasi Bukti Pengiriman' : 'Bukti Pengiriman Barang' }}
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              No. Surat Jalan:
              <span class="font-mono font-medium text-gray-700 dark:text-gray-300">{{
                deliveryCode
              }}</span>
            </p>
          </div>
        </div>
        <button
          type="button"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          data-test="close-proof-modal-btn"
          @click="emit('close')"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Modal Content: VIEW MODE -->
      <div v-if="mode === 'view'" class="p-6 space-y-4">
        <div class="grid grid-cols-2 gap-4 text-xs">
          <div
            class="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700"
          >
            <span class="text-gray-400 block mb-1">Nama Penerima:</span>
            <span
              class="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-1.5"
            >
              <User class="w-4 h-4 text-primary-500" />
              {{ recipientName || '-' }}
            </span>
          </div>

          <div
            class="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700"
          >
            <span class="text-gray-400 block mb-1">Status Pengiriman:</span>
            <span
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
            >
              <CheckCircle class="w-3.5 h-3.5" />
              TERKIRIM
            </span>
          </div>
        </div>

        <div
          v-if="deliveryNoteText"
          class="text-xs p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40"
        >
          <span class="font-semibold block mb-0.5">Catatan Serah Terima:</span>
          {{ deliveryNoteText }}
        </div>

        <div>
          <span class="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-2"
            >Foto / Dokumen Tanda Terima:</span
          >
          <div
            v-if="proofUrl"
            class="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 dark:bg-gray-900 max-h-64 flex items-center justify-center relative group"
          >
            <img
              :src="proofUrl"
              alt="Bukti Pengiriman"
              class="w-full h-auto max-h-64 object-contain"
            />
            <a
              :href="proofUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="absolute bottom-2 right-2 px-2.5 py-1 text-xs font-medium rounded-lg bg-black/75 text-white flex items-center gap-1 hover:bg-black transition-colors"
            >
              <ExternalLink class="w-3.5 h-3.5" />
              Buka Penuh
            </a>
          </div>
          <div
            v-else
            class="py-8 text-center text-xs text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg"
          >
            Foto bukti pengiriman belum diunggah.
          </div>
        </div>
      </div>

      <!-- Modal Content: CONFIRM / UPLOAD MODE -->
      <form v-else class="p-6 space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Nama Penerima Barang <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.penerima"
            type="text"
            required
            placeholder="cth. Pak Hendro (Staff Gudang)"
            class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            data-test="input-proof-recipient"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Tanggal Diterima <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.tanggal_terima"
            type="date"
            required
            class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            data-test="input-proof-date"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            URL Foto / Bukti Tanda Terima <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.foto_bukti"
            type="url"
            required
            placeholder="https://..."
            class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-mono text-xs"
            data-test="input-proof-url"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Catatan Tambahan
          </label>
          <textarea
            v-model="form.note"
            rows="2"
            placeholder="cth. Diterima dengan kondisi baik, tanpa kerusakan..."
            class="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            data-test="input-proof-note"
          />
        </div>

        <div
          class="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700"
        >
          <button
            type="button"
            class="px-4 py-2 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            @click="emit('close')"
          >
            Batal
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm inline-flex items-center gap-1.5"
            data-test="submit-proof-btn"
          >
            <CheckCircle class="w-4 h-4" />
            {{ isSubmitting ? 'Menyimpan...' : 'Konfirmasi Terkirim' }}
          </button>
        </div>
      </form>

      <!-- View Mode Footer -->
      <div
        v-if="mode === 'view'"
        class="px-6 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex items-center justify-end"
      >
        <button
          type="button"
          class="px-4 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          @click="emit('close')"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
</template>
