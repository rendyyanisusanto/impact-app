<script setup lang="ts">
import AppToast from '@/shared/components/feedback/AppToast.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col justify-center items-center bg-background px-4 py-8">
    <div class="w-full max-w-md">
      <div class="text-center mb-6">
        <div
          class="inline-flex w-12 h-12 rounded-lg bg-primary text-white items-center justify-center font-bold text-lg mb-2 shadow"
        >
          IF
        </div>
        <h1 class="text-xl font-bold text-content-primary">Impact Furniture ERP v2</h1>
        <p class="text-xs text-content-secondary mt-1">
          Sistem Informasi Manajemen Perusahaan Furniture
        </p>
      </div>

      <div class="bg-surface border border-border rounded-card shadow-card p-6">
        <RouterView />
      </div>

      <p class="text-center text-xs text-content-secondary mt-6">
        &copy; {{ new Date().getFullYear() }} PT Impact Furniture Indonesia
      </p>
    </div>

    <AppToast />
  </div>
</template>
