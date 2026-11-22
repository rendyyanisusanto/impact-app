<script setup lang="ts">
import { computed, ref } from 'vue'
import { Users, UserX, ExternalLink } from 'lucide-vue-next'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import type { HolidayExceptionEmployee } from '../types/holiday-settings.types'

const props = withDefaults(
  defineProps<{
    exceptions?: HolidayExceptionEmployee[]
    holidayDate?: string
    holidayDescription?: string
    maxVisible?: number
  }>(),
  {
    exceptions: () => [],
    holidayDate: '',
    holidayDescription: '',
    maxVisible: 2
  }
)

const isModalOpen = ref(false)

const count = computed(() => props.exceptions.length)

const visibleList = computed(() => {
  return props.exceptions.slice(0, props.maxVisible)
})

const remainingCount = computed(() => {
  return Math.max(0, count.value - props.maxVisible)
})

function openDetail() {
  isModalOpen.value = true
}
</script>

<template>
  <div class="inline-flex items-center">
    <!-- Empty state: No exceptions -->
    <div v-if="count === 0" class="inline-flex items-center text-xs text-slate-400 italic">
      <UserX class="w-3.5 h-3.5 mr-1 text-slate-300" />
      <span>Semua Libur</span>
    </div>

    <!-- Exceptions list with pill badges -->
    <div v-else class="flex flex-wrap items-center gap-1.5">
      <span
        v-for="emp in visibleList"
        :key="emp.id"
        class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
        :title="`${emp.nama} (${emp.kode}) - ${emp.jabatan}`"
      >
        <span
          v-if="emp.grupColor"
          class="w-1.5 h-1.5 rounded-full mr-1.5 shrink-0"
          :style="{ backgroundColor: emp.grupColor }"
        />
        <span class="truncate max-w-[120px]">{{ emp.nama }}</span>
      </span>

      <!-- More pill button -->
      <button
        v-if="remainingCount > 0"
        type="button"
        class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-300 transition-colors cursor-pointer"
        :title="`Klik untuk melihat total ${count} karyawan yang dikecualikan`"
        @click="openDetail"
      >
        <Users class="w-3 h-3 mr-1 text-slate-500" />
        <span>+{{ remainingCount }} lainnya</span>
      </button>

      <!-- View all icon button if count > 0 -->
      <button
        v-if="count > 0 && remainingCount === 0"
        type="button"
        class="p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors"
        title="Lihat rincian pengecualian"
        @click="openDetail"
      >
        <ExternalLink class="w-3 h-3" />
      </button>
    </div>

    <!-- Full Exceptions Detail Modal -->
    <AppModal
      v-model="isModalOpen"
      size="lg"
      :title="`Daftar Karyawan Dikecualikan (${count})`"
      :description="`${holidayDescription || 'Hari Libur'} — ${holidayDate}`"
    >
      <div class="space-y-4">
        <p class="text-xs text-slate-600">
          Karyawan di bawah ini <strong>tetap dihitung masuk kerja</strong> pada hari libur ini
          sesuai jadwal kerja reguler mereka:
        </p>

        <div
          class="max-h-80 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100"
        >
          <div
            v-for="(emp, idx) in exceptions"
            :key="emp.id"
            class="flex items-center justify-between px-3 py-2 text-xs hover:bg-slate-50 transition-colors"
          >
            <div class="flex items-center space-x-2.5">
              <span class="text-slate-400 font-mono w-6 text-right">{{ idx + 1 }}.</span>
              <div
                v-if="emp.grupColor"
                class="w-2.5 h-2.5 rounded-full shrink-0"
                :style="{ backgroundColor: emp.grupColor }"
                :title="emp.grupNama || 'Grup'"
              />
              <div>
                <p class="font-semibold text-slate-900">{{ emp.nama }}</p>
                <p class="text-[11px] text-slate-500 font-mono">
                  {{ emp.kode }} &bull; {{ emp.jabatan }}
                </p>
              </div>
            </div>

            <div class="text-right">
              <span
                v-if="emp.grupNama"
                class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700"
              >
                {{ emp.grupNama }}
              </span>
              <span v-else class="text-[11px] text-slate-400 italic"> Tanpa Grup </span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <button
          type="button"
          class="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          @click="isModalOpen = false"
        >
          Tutup
        </button>
      </template>
    </AppModal>
  </div>
</template>
