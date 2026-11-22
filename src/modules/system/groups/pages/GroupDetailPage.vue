<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import GroupPermissionSummary from '../components/GroupPermissionSummary.vue'
import { groupService } from '../services/group.service'
import type { GroupDetailViewModel } from '../types/group.types'
import { usePermission } from '@/shared/composables/usePermission'
import { useToast } from '@/shared/composables/useToast'
import {
  ArrowLeft,
  Edit2,
  Users,
  Check,
  X,
  RefreshCw,
  LayoutDashboard,
  ShieldCheck,
  Clock
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const { hasPermission } = usePermission()

const canUpdate = computed(() => hasPermission('system:update') || hasPermission('system.groups:update'))
const groupId = Number(route.params.id)
const detail = ref<GroupDetailViewModel | null>(null)
const isLoading = ref(true)

async function loadDetail() {
  isLoading.value = true
  try {
    detail.value = await groupService.getDetailViewModel(groupId)
  } catch (err: unknown) {
    toast.error(err instanceof Error ? err.message : 'Gagal memuat detail group.')
    router.push('/system/groups')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadDetail()
})

function handleBack() {
  router.push('/system/groups')
}

function handleEdit() {
  router.push(`/system/groups/${groupId}/edit`)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <AppPageHeader
      :title="`Detail Group Role - ${detail?.group.name ? detail.group.name.toUpperCase() : ''}`"
      subtitle="Inspeksi konfigurasi hak akses submenu dan dashboard role grup pengguna"
      :breadcrumbs="[
        { label: 'System Setting', to: '/system/groups' },
        { label: 'Master Data Groups (Role)', to: '/system/groups' },
        { label: 'Detail Groups' }
      ]"
    >
      <template #actions>
        <div class="flex items-center gap-2">
          <AppButton
            variant="outline"
            size="sm"
            @click="handleBack"
          >
            <ArrowLeft class="w-4 h-4 mr-1.5" />
            Kembali
          </AppButton>
          <AppButton
            v-if="canUpdate"
            variant="primary"
            size="sm"
            @click="handleEdit"
          >
            <Edit2 class="w-4 h-4 mr-1.5" />
            Ubah Groups
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <!-- Loading State -->
    <div v-if="isLoading" class="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
      <RefreshCw class="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
      <p class="text-sm text-slate-500">Memuat detail hak akses...</p>
    </div>

    <template v-else-if="detail">
      <!-- Summary metrics -->
      <GroupPermissionSummary :summary="detail.summary" />

      <!-- Group Info Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Card 1: Profil Group -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
            <ShieldCheck class="w-4 h-4 text-teal-600" />
            <span>Informasi Identitas Group</span>
          </h3>

          <div class="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            <div class="py-2.5 flex items-center justify-between">
              <span class="text-slate-500 font-medium">Nama Group</span>
              <span class="font-bold text-slate-900 dark:text-white uppercase">{{ detail.group.name }}</span>
            </div>
            <div class="py-2.5 flex items-center justify-between">
              <span class="text-slate-500 font-medium">Deskripsi</span>
              <span class="text-slate-800 dark:text-slate-200 text-right">{{ detail.group.description || '-' }}</span>
            </div>
            <div class="py-2.5 flex items-center justify-between">
              <span class="text-slate-500 font-medium">Jumlah User Terkait</span>
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
                <Users class="w-3.5 h-3.5" />
                {{ detail.group.userCount || 0 }} User
              </span>
            </div>
          </div>
        </div>

        <!-- Card 2: Assigned Users & Audit -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
            <Users class="w-4 h-4 text-blue-600" />
            <span>Daftar User Terkait</span>
          </h3>

          <div v-if="detail.assignedUserNames.length > 0" class="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            <div
              v-for="(uName, i) in detail.assignedUserNames"
              :key="i"
              class="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-teal-500" />
              <span>{{ uName }}</span>
            </div>
          </div>
          <div v-else class="text-xs text-slate-400 italic py-2">
            Belum ada user yang terhubung dengan group ini.
          </div>

          <div class="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center gap-4">
            <span class="flex items-center gap-1">
              <Clock class="w-3 h-3" /> Dibuat: {{ detail.group.createdAt || '-' }}
            </span>
            <span class="flex items-center gap-1">
              Oleh: {{ detail.group.createdBy || '-' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Dashboard Access Table matching look_page -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 space-y-3">
        <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <LayoutDashboard class="w-4 h-4 text-purple-600" />
          <span>Dashboard Access</span>
        </h3>

        <div class="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table class="w-full text-xs text-left">
            <thead class="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th class="px-4 py-2.5 w-60">Dashboard Name</th>
                <th class="px-4 py-2.5">Description</th>
                <th class="px-4 py-2.5 w-32 text-center">Column Width</th>
              </tr>
            </thead>
            <tbody v-if="detail.dashboardWidgets.length === 0">
              <tr>
                <td colspan="3" class="px-4 py-6 text-center text-slate-400 italic">
                  Tidak ada widget dashboard yang diizinkan untuk group ini.
                </td>
              </tr>
            </tbody>
            <tbody v-else class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-for="w in detail.dashboardWidgets" :key="w.id">
                <td class="px-4 py-2.5 font-semibold text-slate-900 dark:text-white">
                  {{ w.name }}
                </td>
                <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                  {{ w.keterangan }}
                </td>
                <td class="px-4 py-2.5 text-center font-mono">
                  {{ w.column || 6 }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Menu Access Matrix matching legacy look_page -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 space-y-4">
        <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <ShieldCheck class="w-4 h-4 text-teal-600" />
          <span>Menu &amp; Submenu Access</span>
        </h3>

        <div class="space-y-4">
          <div
            v-for="cat in detail.menuCategories"
            :key="cat.id"
            class="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            <div class="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 font-bold text-xs text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
              {{ cat.name }}
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-xs text-left">
                <thead class="bg-slate-100/40 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th class="w-16 px-3 py-2 text-center">ID</th>
                    <th class="px-4 py-2">Submenu</th>
                    <th class="px-4 py-2 font-mono text-[11px]">Resource</th>
                    <th class="w-20 px-3 py-2 text-center">Create</th>
                    <th class="w-20 px-3 py-2 text-center">Read</th>
                    <th class="w-20 px-3 py-2 text-center">Update</th>
                    <th class="w-20 px-3 py-2 text-center">Delete</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr v-for="sub in cat.submenus" :key="sub.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td class="px-3 py-2 text-center font-mono text-slate-400">
                      {{ sub.id }}
                    </td>
                    <td class="px-4 py-2 font-medium text-slate-900 dark:text-white">
                      {{ sub.name }}
                    </td>
                    <td class="px-4 py-2 font-mono text-slate-500 text-[11px]">
                      {{ sub.resource }}
                    </td>
                    <td class="px-3 py-2 text-center">
                      <Check v-if="sub.c" class="w-4 h-4 text-emerald-600 mx-auto" />
                      <X v-else class="w-4 h-4 text-red-500 mx-auto" />
                    </td>
                    <td class="px-3 py-2 text-center">
                      <Check v-if="sub.r" class="w-4 h-4 text-emerald-600 mx-auto" />
                      <X v-else class="w-4 h-4 text-red-500 mx-auto" />
                    </td>
                    <td class="px-3 py-2 text-center">
                      <template v-if="sub.allowedActions.u">
                        <Check v-if="sub.u" class="w-4 h-4 text-emerald-600 mx-auto" />
                        <X v-else class="w-4 h-4 text-red-500 mx-auto" />
                      </template>
                      <span v-else class="text-slate-300">-</span>
                    </td>
                    <td class="px-3 py-2 text-center">
                      <template v-if="sub.allowedActions.d">
                        <Check v-if="sub.d" class="w-4 h-4 text-emerald-600 mx-auto" />
                        <X v-else class="w-4 h-4 text-red-500 mx-auto" />
                      </template>
                      <span v-else class="text-slate-300">-</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

