<script setup lang="ts">
import { ref, watch } from 'vue'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppFormField from '@/shared/components/ui/AppFormField.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import { KeyRound, Eye, EyeOff } from 'lucide-vue-next'
import { validatePassword } from '../utils/user-validation'
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

const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const errorMessage = ref('')
const isSubmitting = ref(false)

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      newPassword.value = ''
      confirmPassword.value = ''
      showPassword.value = false
      errorMessage.value = ''
    }
  }
)

function toggleShowPassword() {
  showPassword.value = !showPassword.value
}

async function handleSave() {
  if (!props.user) return

  const err = validatePassword(newPassword.value, true, confirmPassword.value)
  if (err) {
    errorMessage.value = err
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const res = await userService.resetPassword(props.user.id, newPassword.value)
    toast.success(res.message)
    emit('saved')
    emit('close')
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'Gagal mereset password.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AppModal
    :model-value="isOpen"
    title="Reset Password Pengguna"
    size="md"
    @update:model-value="emit('close')"
    @close="emit('close')"
  >
    <div class="space-y-4">
      <div class="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
        <KeyRound class="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          Anda akan mengatur ulang password untuk akun
          <span class="font-bold">{{ user?.username }}</span>
          ({{ user?.firstName }}). Pastikan kredensial baru disampaikan secara aman kepada pengguna.
        </div>
      </div>

      <div v-if="errorMessage" class="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
        {{ errorMessage }}
      </div>

      <AppFormField label="Password Baru" required>
        <div class="relative">
          <AppInput
            v-model="newPassword"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Minimal 6 karakter"
            autocomplete="new-password"
          />
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            @click="toggleShowPassword"
          >
            <component :is="showPassword ? EyeOff : Eye" class="w-4 h-4" />
          </button>
        </div>
      </AppFormField>

      <AppFormField label="Konfirmasi Password Baru" required>
        <AppInput
          v-model="confirmPassword"
          :type="showPassword ? 'text' : 'password'"
          placeholder="Ulangi password baru"
          autocomplete="new-password"
        />
      </AppFormField>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <AppButton variant="outline" :disabled="isSubmitting" @click="emit('close')">
          Batal
        </AppButton>
        <AppButton variant="primary" :is-loading="isSubmitting" @click="handleSave">
          Simpan Password Baru
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>