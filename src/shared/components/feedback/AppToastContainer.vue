<script setup lang="ts">
import { useToast } from '@/shared/composables/useToast'
import AppToast from './AppToast.vue'

const { toasts, dismiss } = useToast()
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      <TransitionGroup
        enter-active-class="transform ease-out duration-200 transition"
        enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
        enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <AppToast v-for="toast in toasts" :key="toast.id" :item="toast" @dismiss="dismiss" />
      </TransitionGroup>
    </div>
  </Teleport>
</template>
