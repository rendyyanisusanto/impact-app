<script setup lang="ts">
import AppFormField, { type AppFormFieldProps } from '@/shared/components/forms/AppFormField.vue'

defineProps<AppFormFieldProps>()
</script>

<template>
  <AppFormField v-bind="$props">
    <template v-for="(_, slotName) in $slots" #[slotName]="slotProps">
      <slot :name="slotName" v-bind="slotProps || {}" />
    </template>
  </AppFormField>
</template>
