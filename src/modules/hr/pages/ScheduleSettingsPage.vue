<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Info,
  RotateCcw,
  Save
} from 'lucide-vue-next'
import AppAlert from '@/shared/components/feedback/AppAlert.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import { usePermission } from '@/shared/composables/usePermission'
import WeeklyScheduleTable from '../components/WeeklyScheduleTable.vue'
import { useScheduleSettings } from '../composables/useScheduleSettings'

const { canUpdate: checkCanUpdate } = usePermission()

// RBAC Permissions: checks update permission on hr.schedules or hr parent
const canUpdate = computed(() => {
  return checkCanUpdate('hr.schedules') || checkCanUpdate('hr')
})

const {
  scheduleItems,
  isLoading,
  isSaving,
  isDirty,
  validation,
  hasErrors,
  errorMessage,
  successMessage,
  loadSchedule,
  updateTime,
  resetChanges,
  saveSchedule
} = useScheduleSettings()

const showUnsavedDialog = ref(false)
const pendingNavigation = ref<(() => void) | null>(null)

onMounted(async () => {
  await loadSchedule()
})

// Unsaved changes route guard
onBeforeRouteLeave((_to, _from, next) => {
  if (isDirty.value && !isSaving.value) {
    showUnsavedDialog.value = true
    pendingNavigation.value = () => next()
  } else {
    next()
  }
})

function confirmDiscardChanges() {
  showUnsavedDialog.value = false
  if (pendingNavigation.value) {
    pendingNavigation.value()
    pendingNavigation.value = null
  }
}

function cancelDiscardChanges() {
  showUnsavedDialog.value = false
  pendingNavigation.value = null
}

async function handleSave() {
  if (!canUpdate.value) return
  await saveSchedule()
}

function handleReset() {
  resetChanges()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <AppPageHeader
      title="Master Data Jadwal"
      subtitle="Pengaturan jadwal kerja mingguan, rentang waktu kehadiran, dan jam istirahat karyawan."
    >
      <template #icon>
        <CalendarClock class="w-6 h-6 text-[#0F766E]" />
      </template>

      <template #actions>
        <div class="flex items-center space-x-2.5">
          <!-- Reset button -->
          <AppButton
            v-if="canUpdate"
            variant="secondary"
            size="sm"
            :disabled="!isDirty || isSaving || isLoading"
            @click="handleReset"
          >
            <RotateCcw class="w-4 h-4 mr-1.5" />
            Batalkan Perubahan
          </AppButton>

          <!-- Save button -->
          <AppButton
            v-if="canUpdate"
            variant="primary"
            size="sm"
            :disabled="!isDirty || hasErrors || isSaving || isLoading"
            :loading="isSaving"
            @click="handleSave"
          >
            <Save class="w-4 h-4 mr-1.5" />
            Simpan Setting Jadwal
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <!-- Read-Only Banner if User lacks update rights -->
    <div
      v-if="!canUpdate"
      class="flex items-center space-x-2.5 p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800"
    >
      <Info class="w-4 h-4 text-blue-600 shrink-0" />
      <span>
        <strong>Mode Hanya Baca:</strong> Anda memiliki izin untuk melihat jadwal kerja mingguan,
        tetapi tidak memiliki hak akses untuk mengubah atau menyimpan pengaturan.
      </span>
    </div>

    <!-- Success Feedback Alert -->
    <AppAlert
      v-if="successMessage"
      variant="success"
      class="transition-opacity"
      @dismiss="successMessage = null"
    >
      <div class="flex items-center space-x-2">
        <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
        <span>{{ successMessage }}</span>
      </div>
    </AppAlert>

    <!-- Error Summary Alert -->
    <AppAlert v-if="errorMessage" variant="danger" @dismiss="errorMessage = null">
      <div class="space-y-1">
        <div class="flex items-center space-x-2 font-medium">
          <AlertCircle class="w-4 h-4 text-red-600 shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>
        <ul
          v-if="validation.errorSummary.length > 0"
          class="list-disc list-inside text-xs pl-6 space-y-0.5 text-red-700"
        >
          <li v-for="(summary, idx) in validation.errorSummary" :key="idx">
            {{ summary }}
          </li>
        </ul>
      </div>
    </AppAlert>

    <!-- Main Card -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <!-- Section Header -->
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/50 gap-2"
      >
        <div>
          <h2 class="text-base font-semibold text-slate-900 flex items-center space-x-2">
            <span>Setting Jadwal</span>
            <span
              v-if="isDirty"
              class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
              Perubahan Belum Disimpan
            </span>
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">
            Atur rentang jam masuk, jam pulang, serta batas mulai dan selesai istirahat untuk 7 hari
            dalam sepekan.
          </p>
        </div>

        <div class="flex items-center space-x-2 text-xs text-slate-500">
          <Clock class="w-4 h-4 text-slate-400" />
          <span>Format waktu: 24 Jam (HH:mm)</span>
        </div>
      </div>

      <!-- Skeleton Loading State -->
      <div v-if="isLoading" class="p-6 space-y-3">
        <div v-for="i in 7" :key="i" class="h-12 bg-slate-100 rounded-lg animate-pulse" />
      </div>

      <!-- Schedule Table -->
      <div v-else class="p-4 sm:p-5">
        <WeeklyScheduleTable
          :items="scheduleItems"
          :disabled="!canUpdate || isSaving"
          :errors="validation.errors"
          @update:time="updateTime"
        />

        <!-- Bottom Action Bar (matching legacy screenshot ergonomics) -->
        <div
          class="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3"
        >
          <div class="text-xs text-slate-500">
            Total <strong>7 hari</strong> dikonfigurasi. Setiap hari memiliki 4 pasang rentang waktu
            (total 56 input).
          </div>

          <div v-if="canUpdate" class="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
            <AppButton
              variant="secondary"
              size="sm"
              :disabled="!isDirty || isSaving"
              @click="handleReset"
            >
              <RotateCcw class="w-4 h-4 mr-1.5" />
              Batalkan Perubahan
            </AppButton>

            <AppButton
              variant="primary"
              size="sm"
              :disabled="!isDirty || hasErrors || isSaving"
              :loading="isSaving"
              @click="handleSave"
            >
              <Save class="w-4 h-4 mr-1.5" />
              Simpan Setting Jadwal
            </AppButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Unsaved Changes Dialog -->
    <AppConfirmDialog
      v-model="showUnsavedDialog"
      title="Perubahan Belum Disimpan"
      message="Anda memiliki perubahan pengaturan jadwal kerja mingguan yang belum disimpan. Apakah Anda yakin ingin meninggalkan halaman ini? Perubahan akan hilang."
      confirm-text="Tinggalkan Halaman"
      cancel-text="Tetap di Sini"
      variant="danger"
      @confirm="confirmDiscardChanges"
      @cancel="cancelDiscardChanges"
    />
  </div>
</template>
