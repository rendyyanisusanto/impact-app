<script setup lang="ts">
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import { Save } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    isEdit?: boolean
    loading?: boolean
    submitDisabled?: boolean
    size?: 'sm' | 'md' | 'lg' | 'xl'
  }>(),
  {
    modelValue: false,
    isEdit: false,
    loading: false,
    submitDisabled: false,
    size: 'lg'
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'submit'): void
  (e: 'cancel'): void
}>()
</script>

<template>
  <AppModal
    :model-value="modelValue"
    :title="isEdit ? `Ubah Data — ${title}` : `Tambah Data — ${title}`"
    :size="size"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form @submit.prevent="emit('submit')">
      <!-- Form Content Slot -->
      <div class="space-y-4">
        <slot />
      </div>

      <!-- Action Buttons in Modal Footer -->
      <div class="mt-6 pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
        <AppButton
          type="button"
          variant="ghost"
          size="sm"
          :disabled="loading"
          @click="emit('cancel')"
        >
          Batal
        </AppButton>

        <AppButton
          type="submit"
          variant="primary"
          size="sm"
          :loading="loading"
          :disabled="submitDisabled"
        >
          <template #left-icon>
            <Save class="w-3.5 h-3.5" />
          </template>
          <span>{{ isEdit ? 'Simpan Perubahan' : 'Simpan Data' }}</span>
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>
