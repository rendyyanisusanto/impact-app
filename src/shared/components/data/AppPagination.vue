<script setup lang="ts">
import AppPagination, {
  type AppPaginationProps
} from '@/shared/components/navigation/AppPagination.vue'

defineProps<AppPaginationProps>()
const emit = defineEmits<{
  (e: 'update:currentPage', page: number): void
  (e: 'update:pageSize', size: number): void
  (e: 'change', payload: { page: number; pageSize: number }): void
}>()
</script>

<template>
  <AppPagination
    v-bind="$props"
    @update:current-page="emit('update:currentPage', $event)"
    @update:page-size="emit('update:pageSize', $event)"
    @change="emit('change', $event)"
  />
</template>
