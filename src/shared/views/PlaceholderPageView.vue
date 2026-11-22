<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ModulePlaceholder from '@/shared/components/ui/ModulePlaceholder.vue'

const route = useRoute()

const pageTitle = computed(() => (route.meta.title as string) || 'Halaman')
const moduleName = computed(() => (route.meta.module as string) || 'ERP Modul')
const targetSprint = computed(() => (route.meta.sprint as string) || 'Sprint 2 — Sprint 4')
</script>

<template>
  <ModulePlaceholder
    :page-title="pageTitle"
    :module-name="moduleName"
    :target-sprint="targetSprint"
  />
</template>
