<script setup lang="ts">
import { Edit2, Trash2, CalendarX, Plus } from 'lucide-vue-next'
import AppButton from '@/shared/components/ui/AppButton.vue'
import HolidayExceptionSummary from './HolidayExceptionSummary.vue'
import type { HolidayItem } from '../types/holiday-settings.types'
import { formatDateShort } from '../utils/holiday-date'

defineProps<{
  items: HolidayItem[]
  isLoading?: boolean
  canUpdate?: boolean
  canDelete?: boolean
}>()

const emit = defineEmits<{
  (e: 'edit', item: HolidayItem): void
  (e: 'delete', item: HolidayItem): void
  (e: 'add'): void
}>()
</script>

<template>
  <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
    <!-- Skeleton loader -->
    <div v-if="isLoading" class="p-6 space-y-3">
      <div v-for="i in 5" :key="i" class="h-10 bg-slate-100 rounded-md animate-pulse" />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="items.length === 0"
      class="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div
        class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3"
      >
        <CalendarX class="w-6 h-6" />
      </div>
      <h3 class="text-sm font-semibold text-slate-800 mb-1">
        Tidak Ada Hari Libur pada Periode Ini
      </h3>
      <p class="text-xs text-slate-500 max-w-sm mb-4">
        Belum ada pengaturan hari libur nasional atau cuti bersama yang didaftarkan untuk bulan ini.
      </p>
      <AppButton v-if="canUpdate" variant="primary" size="sm" @click="emit('add')">
        <Plus class="w-4 h-4 mr-1.5" />
        Tambah Hari Libur
      </AppButton>
    </div>

    <!-- Table content -->
    <table v-else class="w-full text-left border-collapse text-xs">
      <thead>
        <tr
          class="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-600 uppercase tracking-wider"
        >
          <th scope="col" class="py-3 px-4 w-12 text-center">No</th>
          <th scope="col" class="py-3 px-4 w-44">Tanggal</th>
          <th scope="col" class="py-3 px-4 w-32">Hari</th>
          <th scope="col" class="py-3 px-4">Keterangan</th>
          <th scope="col" class="py-3 px-4 min-w-[220px]">Pengecualian Karyawan</th>
          <th scope="col" class="py-3 px-4 w-28 text-right">Aksi</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100 text-slate-700">
        <tr
          v-for="(item, idx) in items"
          :key="item.id"
          class="hover:bg-slate-50/80 transition-colors group"
        >
          <!-- No -->
          <td class="py-3 px-4 text-center font-mono text-slate-400">
            {{ idx + 1 }}
          </td>

          <!-- Tanggal -->
          <td class="py-3 px-4 whitespace-nowrap">
            <span class="font-medium text-slate-900 font-mono">
              {{ formatDateShort(item.tanggal) }}
            </span>
          </td>

          <!-- Hari -->
          <td class="py-3 px-4 whitespace-nowrap">
            <span
              :class="[
                'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold',
                item.hari === 'Minggu'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-slate-100 text-slate-700'
              ]"
            >
              {{ item.hari }}
            </span>
          </td>

          <!-- Keterangan -->
          <td class="py-3 px-4">
            <div class="flex items-center space-x-2">
              <span class="font-medium text-slate-900">
                {{ item.keterangan }}
              </span>
              <span
                v-if="item.uuid"
                class="inline-flex items-center text-[10px] text-slate-400 font-mono"
                title="ID Transaksi Legacy"
              >
                #{{ item.id }}
              </span>
            </div>
          </td>

          <!-- Pengecualian Karyawan -->
          <td class="py-3 px-4">
            <HolidayExceptionSummary
              :exceptions="item.exceptionEmployees"
              :holiday-date="formatDateShort(item.tanggal)"
              :holiday-description="item.keterangan"
              :max-visible="2"
            />
          </td>

          <!-- Aksi -->
          <td class="py-3 px-4 text-right whitespace-nowrap">
            <div class="inline-flex items-center justify-end space-x-1">
              <button
                v-if="canUpdate"
                type="button"
                class="p-1.5 text-slate-500 hover:text-[#0F766E] hover:bg-teal-50 rounded-md transition-colors"
                title="Ubah Hari Libur"
                @click="emit('edit', item)"
              >
                <Edit2 class="w-3.5 h-3.5" />
              </button>
              <button
                v-if="canDelete"
                type="button"
                class="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Hapus Hari Libur"
                @click="emit('delete', item)"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
