<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {
  ChevronDown,
  History,
  Calendar,
  Eye,
  Receipt,
  Truck,
  Edit2,
  XCircle
} from 'lucide-vue-next'
import type { SalesOrderListItem } from '../types/sales-order.types'
import { usePermission } from '@/shared/composables/usePermission'

const props = defineProps<{
  order: SalesOrderListItem
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'history', order: SalesOrderListItem): void
  (e: 'edit-date', order: SalesOrderListItem): void
  (e: 'view', order: SalesOrderListItem): void
  (e: 'invoice', order: SalesOrderListItem): void
  (e: 'print-delivery', order: SalesOrderListItem): void
  (e: 'edit', order: SalesOrderListItem): void
  (e: 'cancel', order: SalesOrderListItem): void
}>()

const { hasPermission } = usePermission()
const canUpdate = hasPermission('sales', 'update')
const canDelete = hasPermission('sales', 'delete')

const isOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

function toggleMenu(): void {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

function closeMenu(): void {
  isOpen.value = false
}

function handleClickOutside(event: MouseEvent): void {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    closeMenu()
  }
}

function handleKeyDown(event: KeyboardEvent): void {
  if (!isOpen.value) return
  if (event.key === 'Escape') {
    closeMenu()
    event.stopPropagation()
  }
}

onMounted(() => {
  window.addEventListener('click', handleClickOutside)
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
  window.removeEventListener('keydown', handleKeyDown)
})

function triggerAction(
  action: 'history' | 'edit-date' | 'view' | 'invoice' | 'print-delivery' | 'edit' | 'cancel'
): void {
  closeMenu()
  switch (action) {
    case 'history':
      emit('history', props.order)
      break
    case 'edit-date':
      emit('edit-date', props.order)
      break
    case 'view':
      emit('view', props.order)
      break
    case 'invoice':
      emit('invoice', props.order)
      break
    case 'print-delivery':
      emit('print-delivery', props.order)
      break
    case 'edit':
      emit('edit', props.order)
      break
    case 'cancel':
      emit('cancel', props.order)
      break
  }
}
</script>

<template>
  <div ref="menuRef" class="relative inline-block text-left">
    <!-- Trigger Button -->
    <button
      :id="`actions-btn-${order.id}`"
      type="button"
      data-testid="actions-trigger"
      :disabled="disabled"
      class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-xs hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      :aria-expanded="isOpen"
      aria-haspopup="true"
      @click.stop="toggleMenu"
    >
      <span>Aksi</span>
      <ChevronDown
        class="w-3.5 h-3.5 text-slate-400 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <!-- Dropdown Menu -->
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen"
        data-testid="actions-dropdown-menu"
        class="absolute right-0 z-50 mt-1 w-52 origin-top-right rounded-xl bg-white border border-slate-200 shadow-xl py-1 focus:outline-none text-xs text-slate-700 divide-y divide-slate-100"
        role="menu"
        aria-orientation="vertical"
        tabindex="-1"
      >
        <!-- Primary Menu Items -->
        <div class="py-1">
          <!-- 1. History Sales Order -->
          <button
            type="button"
            data-testid="action-history"
            class="w-full flex items-center gap-2.5 px-3.5 py-2 text-left hover:bg-slate-50 hover:text-teal-700 transition-colors cursor-pointer"
            role="menuitem"
            @click="triggerAction('history')"
          >
            <History class="w-4 h-4 text-slate-500" />
            <span class="font-medium">History Sales Order</span>
          </button>

          <!-- 2. Edit Tanggal -->
          <button
            type="button"
            data-testid="action-edit-date"
            :disabled="!canUpdate || order.status_aktif === 0"
            class="w-full flex items-center gap-2.5 px-3.5 py-2 text-left hover:bg-slate-50 hover:text-teal-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            role="menuitem"
            @click="triggerAction('edit-date')"
          >
            <Calendar class="w-4 h-4 text-slate-500" />
            <span class="font-medium">Edit Tanggal</span>
          </button>

          <!-- 3. Lihat -->
          <button
            type="button"
            data-testid="action-view"
            class="w-full flex items-center gap-2.5 px-3.5 py-2 text-left hover:bg-slate-50 hover:text-teal-700 transition-colors cursor-pointer"
            role="menuitem"
            @click="triggerAction('view')"
          >
            <Eye class="w-4 h-4 text-slate-500" />
            <span class="font-medium">Lihat</span>
          </button>

          <!-- 4. Invoice -->
          <button
            type="button"
            data-testid="action-invoice"
            class="w-full flex items-center gap-2.5 px-3.5 py-2 text-left hover:bg-slate-50 hover:text-teal-700 transition-colors cursor-pointer"
            role="menuitem"
            @click="triggerAction('invoice')"
          >
            <Receipt class="w-4 h-4 text-slate-500" />
            <span class="font-medium">Invoice</span>
          </button>

          <!-- 5. Cetak Surat Jalan -->
          <button
            type="button"
            data-testid="action-print-delivery"
            class="w-full flex items-center justify-between px-3.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
            role="menuitem"
            @click="triggerAction('print-delivery')"
          >
            <div class="flex items-center gap-2.5">
              <Truck class="w-4 h-4 text-slate-500" />
              <span class="font-medium">Cetak Surat Jalan</span>
            </div>
          </button>

          <!-- 6. Ubah -->
          <button
            type="button"
            data-testid="action-edit"
            :disabled="!canUpdate || order.status_aktif === 0 || order.status === 1"
            class="w-full flex items-center gap-2.5 px-3.5 py-2 text-left hover:bg-slate-50 hover:text-amber-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            role="menuitem"
            @click="triggerAction('edit')"
          >
            <Edit2 class="w-4 h-4 text-slate-500" />
            <span class="font-medium">Ubah</span>
          </button>
        </div>

        <!-- 7. Batalkan Transaksi (Destructive action) -->
        <div class="py-1">
          <button
            type="button"
            data-testid="action-cancel"
            :disabled="!canDelete || order.status_aktif === 0 || order.terbayar > 0"
            class="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            role="menuitem"
            @click="triggerAction('cancel')"
          >
            <XCircle class="w-4 h-4 text-rose-500" />
            <span class="font-medium">Batalkan Transaksi</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
