<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { ChevronDown, Search, Check, Plus, X } from 'lucide-vue-next'

export interface SearchableOption {
  label: string
  value: string | number
  disabled?: boolean
  description?: string
  [key: string]: unknown
}

export interface AppSearchableSelectProps {
  modelValue?: string | number | null
  options?: SearchableOption[]
  placeholder?: string
  disabled?: boolean
  required?: boolean
  invalid?: boolean
  error?: boolean | string
  size?: 'sm' | 'md' | 'lg'
  allowClear?: boolean
  actionText?: string
  id?: string
  limit?: number
  /** Jika true, pencarian dilakukan di server (emit 'search'), tanpa filter lokal. */
  remote?: boolean
}

const props = withDefaults(defineProps<AppSearchableSelectProps>(), {
  modelValue: null,
  options: () => [],
  placeholder: '-- Pilih --',
  disabled: false,
  required: false,
  invalid: false,
  error: false,
  size: 'md',
  allowClear: true,
  actionText: '',
  id: undefined,
  limit: undefined,
  remote: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | null): void
  (e: 'change', value: string | number | null): void
  (e: 'action'): void
  (e: 'search', query: string): void
}>()

const isOpen = ref(false)
const searchQuery = ref('')
const containerRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)

const isError = computed(() => Boolean(props.error || props.invalid))

const selectedOption = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined || props.modelValue === '') {
    return null
  }
  return props.options.find(opt => String(opt.value) === String(props.modelValue)) || null
})

const allFilteredOptions = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query || props.remote) {
    return props.options
  }
  return props.options.filter(opt => {
    const labelMatch = opt.label.toLowerCase().includes(query)
    const descMatch = opt.description ? opt.description.toLowerCase().includes(query) : false
    return labelMatch || descMatch
  })
})

const totalFilteredCount = computed(() => allFilteredOptions.value.length)

const hasMoreOptions = computed(() => {
  if (!props.limit || props.limit <= 0) return false
  return allFilteredOptions.value.length > props.limit
})

const filteredOptions = computed(() => {
  const all = allFilteredOptions.value
  if (!props.limit || props.limit <= 0 || all.length <= props.limit) {
    return all
  }
  const selected = selectedOption.value
  const sliced = all.slice(0, props.limit)
  if (selected && !sliced.some(o => String(o.value) === String(selected.value))) {
    const inAll = all.some(o => String(o.value) === String(selected.value))
    if (inAll) {
      return [
        selected,
        ...all.filter(o => String(o.value) !== String(selected.value)).slice(0, props.limit - 1)
      ]
    }
  }
  return sliced
})

watch(searchQuery, q => {
  if (props.remote) emit('search', q.trim())
})

function toggleDropdown() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    searchQuery.value = ''
    setTimeout(() => {
      searchInputRef.value?.focus()
    }, 50)
  }
}

function selectOption(option: SearchableOption) {
  if (option.disabled) return
  emit('update:modelValue', option.value)
  emit('change', option.value)
  isOpen.value = false
  searchQuery.value = ''
}

function handleClear(event?: Event) {
  if (event) {
    event.stopPropagation()
  }
  emit('update:modelValue', null)
  emit('change', null)
  searchQuery.value = ''
}

function handleAction() {
  isOpen.value = false
  emit('action')
}

function handleClickOutside(event: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isOpen.value) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'py-1 pl-2.5 pr-7 text-xs min-h-[30px]'
    case 'lg':
      return 'py-2.5 pl-3.5 pr-9 text-base min-h-[44px]'
    case 'md':
    default:
      return 'py-1.5 pl-3 pr-8 text-sm min-h-[36px]'
  }
})
</script>

<template>
  <div :id="id" ref="containerRef" class="relative w-full text-left">
    <!-- Trigger Button -->
    <button
      type="button"
      :disabled="disabled"
      class="w-full flex items-center justify-between rounded-input border bg-surface text-content-primary transition-colors focus:outline-none focus:ring-2 text-left select-none"
      :class="[
        sizeClasses,
        disabled
          ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
          : 'cursor-pointer hover:border-slate-300',
        isError
          ? 'border-semantic-danger focus:border-semantic-danger focus:ring-red-400/25'
          : isOpen
            ? 'border-primary ring-2 ring-primary/20'
            : 'border-border focus:border-primary focus:ring-primary/25'
      ]"
      @click="toggleDropdown"
    >
      <span
        class="truncate pr-2"
        :class="[!selectedOption ? 'text-slate-400' : 'text-slate-800 font-medium']"
      >
        {{ selectedOption ? selectedOption.label : placeholder }}
      </span>

      <div class="flex items-center gap-1 shrink-0 ml-1">
        <!-- Clear button -->
        <span
          v-if="allowClear && selectedOption && !disabled"
          role="button"
          tabindex="0"
          class="p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          title="Hapus pilihan"
          @click="handleClear"
          @keydown.enter.prevent="handleClear"
        >
          <X class="w-3.5 h-3.5" />
        </span>

        <!-- Chevron -->
        <ChevronDown
          class="w-3.5 h-3.5 text-slate-400 transition-transform duration-200"
          :class="[isOpen ? 'rotate-180 text-teal-700' : '']"
        />
      </div>
    </button>

    <!-- Dropdown Panel -->
    <div
      v-if="isOpen"
      class="absolute left-0 right-0 mt-1 z-50 bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150"
    >
      <!-- Search Input Header -->
      <div class="p-2 border-b border-slate-100 bg-slate-50/75 flex items-center gap-2">
        <Search class="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <input
          ref="searchInputRef"
          v-model="searchQuery"
          type="text"
          placeholder="Ketik untuk mencari..."
          class="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
          @keydown.enter.prevent="
            filteredOptions.length > 0 ? selectOption(filteredOptions[0]) : null
          "
        />
        <button
          v-if="searchQuery"
          type="button"
          class="text-slate-400 hover:text-slate-600"
          @click="searchQuery = ''"
        >
          <X class="w-3 h-3" />
        </button>
      </div>

      <!-- Option List -->
      <ul class="max-h-52 overflow-y-auto py-1 divide-y divide-slate-50 text-xs">
        <li
          v-for="opt in filteredOptions"
          :key="String(opt.value)"
          class="px-3 py-2 flex items-center justify-between cursor-pointer transition-colors"
          :class="[
            opt.disabled
              ? 'opacity-50 cursor-not-allowed bg-slate-50'
              : String(opt.value) === String(modelValue)
                ? 'bg-teal-50/80 text-teal-900 font-semibold'
                : 'hover:bg-slate-50 text-slate-700'
          ]"
          @click="selectOption(opt)"
        >
          <div class="flex flex-col truncate pr-2">
            <span class="truncate">{{ opt.label }}</span>
            <span v-if="opt.description" class="text-[10px] text-slate-400 truncate">
              {{ opt.description }}
            </span>
          </div>

          <Check
            v-if="String(opt.value) === String(modelValue)"
            class="w-4 h-4 text-teal-700 shrink-0"
          />
        </li>

        <!-- Empty State in Search -->
        <li
          v-if="filteredOptions.length === 0"
          class="px-3 py-4 text-center text-slate-400 text-xs"
        >
          Tidak ada opsi yang cocok dengan "{{ searchQuery }}"
        </li>

        <!-- Limit Footer Info -->
        <li
          v-if="hasMoreOptions"
          class="px-3 py-2 text-[11px] text-center text-slate-500 bg-slate-50/90 border-t border-slate-100 font-medium"
        >
          Menampilkan {{ limit }} dari {{ totalFilteredCount }} data. Ketik kata kunci untuk mencari lebih spesifik.
        </li>
      </ul>

      <!-- Bottom Action Slot/Button (e.g. + Tambah Baru) -->
      <div v-if="actionText" class="p-1.5 border-t border-slate-100 bg-slate-50">
        <button
          type="button"
          class="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 hover:bg-teal-50 rounded transition-colors"
          @click="handleAction"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>{{ actionText }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
