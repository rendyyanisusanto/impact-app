<script setup lang="ts">
export interface TabItem {
  id: string | number
  label: string
  badge?: string | number
  disabled?: boolean
}

export interface AppTabsProps {
  modelValue: string | number
  tabs: TabItem[]
}

const props = defineProps<AppTabsProps>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
  (e: 'change', value: string | number): void
}>()

function selectTab(tab: TabItem) {
  if (!tab.disabled) {
    emit('update:modelValue', tab.id)
    emit('change', tab.id)
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return

  const enabledTabs = props.tabs.filter(t => !t.disabled)
  const currentIndex = enabledTabs.findIndex(t => t.id === props.modelValue)
  if (currentIndex === -1) return

  event.preventDefault()
  let nextIndex = currentIndex

  if (event.key === 'ArrowRight') {
    nextIndex = currentIndex < enabledTabs.length - 1 ? currentIndex + 1 : 0
  } else if (event.key === 'ArrowLeft') {
    nextIndex = currentIndex > 0 ? currentIndex - 1 : enabledTabs.length - 1
  }

  const nextTab = enabledTabs[nextIndex]
  if (nextTab) {
    selectTab(nextTab)
  }
}
</script>

<template>
  <div class="border-b border-border" @keydown="handleKeyDown">
    <div class="flex gap-2 overflow-x-auto -mb-px" role="tablist" aria-orientation="horizontal">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-selected="modelValue === tab.id"
        :disabled="tab.disabled"
        class="py-2.5 px-3.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
        :class="[
          modelValue === tab.id
            ? 'border-primary text-primary font-semibold'
            : 'border-transparent text-content-secondary hover:text-content-primary hover:border-slate-300'
        ]"
        @click="selectTab(tab)"
      >
        <span>{{ tab.label }}</span>
        <span
          v-if="tab.badge !== undefined"
          class="rounded-full px-1.5 py-0.2 text-[10px] bg-slate-100 text-slate-700"
        >
          {{ tab.badge }}
        </span>
      </button>
    </div>
  </div>
</template>
