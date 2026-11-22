<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle2, Clock } from 'lucide-vue-next'

const props = defineProps<{
  status: number
  size?: 'sm' | 'md'
}>()

const isPosted = computed(() => props.status === 1)
</script>

<template>
  <span
    v-if="isPosted"
    :class="[
      'inline-flex items-center gap-1 font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200',
      size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
    ]"
    title="Mutasi telah diverifikasi dan stok telah dipotong"
  >
    <CheckCircle2 :class="size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'" />
    <span>Selesai</span>
  </span>

  <span
    v-else
    :class="[
      'inline-flex items-center gap-1 font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200',
      size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
    ]"
    title="Mutasi masih berupa draft"
  >
    <Clock :class="size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'" />
    <span>Draft</span>
  </span>
</template>
