<script setup lang="ts">
import { ref, watch } from 'vue'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppFormField from '@/shared/components/ui/AppFormField.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import { ShieldCheck, Eye, EyeOff } from 'lucide-vue-next'
import { validatePin } from '../utils/user-validation'
import { userService } from '../services/user.service'
import { useToast } from '@/shared/composables/useToast'
import type { UserListItem } from '../types/user.types'

const props = defineProps<{
  isOpen: boolean
  user: UserListItem | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const toast = useToast()

const newPin = ref('')
const confirmPin = ref('')
const showPin = ref(false)
const errorMessage = ref('')
const isSubmitting = ref(false)

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      newPin.value = ''
      confirmPin.value = ''
      showPin.value = false
      errorMessage.value = ''
    }
  }
)

function toggleShowPin() {
  showPin.value = !showPin.value
}

async function handleSave() {
  if (!props.user) return

  const err = validatePin(newPin.value, true)
  if (err) {
    errorMessage.value = err
    return
  }

  if (newPin.value !== confirmPin.value) {
    errorMessage.value = 'Konfirmasi PIN tidak cocok.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const res = await userService.resetPin(props.user.id, newPin.value)
    toast.success(res.message)
    emit('saved')
    emit('close')
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'Gagal mereset PIN.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AppModal
    :model-value="isOpen"
    title="Reset PIN Otorisasi Transaksi"
    size="md"
    @update:model-value="emit('close')"
    @close="emit('close')"
  >
    <div class="space-y-4">
      <div class="flex items-start gap-3 p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-800">
        <ShieldCheck class="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
        <div>
          PIN digunakan untuk otorisasi tindakan sensitif (persetujuan, posting stok, dll.) pada akun
          <span class="font-bold">{{ user?.username }}</span>.
          Gunakan 4–8 digit angka rahasia.
        </div>
      </div>

      <div v-if="errorMessage" class="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
        {{ errorMessage }}
      </div>

      <AppFormField label="PIN Baru (4-8 Angka)" required>
        <div class="relative">
          <AppInput
            v-model="newPin"
            :type="showPin ? 'text' : 'password'"
            maxlength="8"
            placeholder="Contoh: 101711"
            autocomplete="off"
          />
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            @click="toggleShowPin"
          >
            <component :is="showPin ? EyeOff : Eye" class="w-4 h-4" />
          </button>
        </div>
      </AppFormField>

      <AppFormField label="Konfirmasi PIN Baru" required>
        <AppInput
          v-model="confirmPin"
          :type="showPin ? 'text' : 'password'"
          maxlength="8"
          placeholder="Ulangi PIN baru"
          autocomplete="off"
        />
      </AppFormField>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <AppButton variant="outline" :disabled="isSubmitting" @click="emit('close')">
          Batal
        </AppButton>
        <AppButton variant="primary" :is-loading="isSubmitting" @click="handleSave">
          Simpan PIN Baru
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>