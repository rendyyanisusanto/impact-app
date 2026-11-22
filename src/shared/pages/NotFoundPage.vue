<script setup lang="ts"></script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
    <div
      class="max-w-md w-full bg-white rounded-lg border border-slate-200 shadow-sm p-8 space-y-4"
    >
      <p class="text-3xl font-bold text-slate-400 font-mono">404</p>
      <h1 class="text-lg font-bold text-slate-900">Halaman Tidak Ditemukan</h1>
      <p class="text-xs text-slate-600">Halaman yang Anda tuju tidak tersedia.</p>
      <div class="pt-2">
        <RouterLink
          to="/dashboard"
          class="inline-flex items-center justify-center px-4 py-2 text-xs font-medium rounded-md bg-teal-700 text-white hover:bg-teal-800 transition-colors"
        >
          Kembali ke Dashboard
        </RouterLink>
      </div>
    </div>
  </div>
</template>
