<script setup lang="ts">
import { useRoute } from 'vue-router'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppCard from '@/shared/components/ui/AppCard.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppBadge from '@/shared/components/ui/AppBadge.vue'
import {
  Calendar as CalendarIcon,
  Layers as LayersIcon,
  ArrowLeft as ArrowLeftIcon,
  CheckCircle2 as CheckIcon
} from 'lucide-vue-next'

export interface ModulePlaceholderProps {
  moduleName: string
  pageTitle: string
  targetSprint?: string
  description?: string
  plannedFeatures?: string[]
}

withDefaults(defineProps<ModulePlaceholderProps>(), {
  targetSprint: 'Sprint 2 — Sprint 4',
  description:
    'Modul ini merupakan bagian dari remigrasi sistem PHP 5/CI3 ke arsitektur Vue 3 + NestJS. Fondasi layout, perizinan, dan antarmuka telah siap pada Sprint 1.',
  plannedFeatures: () => [
    'Integrasi data tabel dengan pagination dan sorting server-side',
    'Form CRUD lengkap dengan validasi skema',
    'Sinkronisasi otorisasi RBAC granular',
    'Ekspor laporan Excel / PDF sesuai format operasional lama'
  ]
})

const route = useRoute()
</script>

<template>
  <div>
    <AppPageHeader :title="pageTitle" :subtitle="`Modul: ${moduleName} • Path: ${route.path}`">
      <template #actions>
        <AppBadge variant="primary" size="md">
          <CalendarIcon class="w-3.5 h-3.5 mr-1" />
          {{ targetSprint }}
        </AppBadge>
      </template>
    </AppPageHeader>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-5">
        <AppCard title="Status Modul" subtitle="Informasi Perencanaan & Kesiapan Arsitektur">
          <div class="space-y-4">
            <div
              class="p-3.5 rounded-card bg-teal-50/60 border border-teal-200/80 text-teal-900 text-xs sm:text-sm leading-relaxed flex items-start gap-3"
            >
              <LayersIcon class="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <strong class="font-semibold text-primary block mb-0.5"
                  >Fondasi Frontend Siap</strong
                >
                {{ description }}
              </div>
            </div>

            <div>
              <h4
                class="text-xs font-semibold text-content-primary uppercase tracking-wider mb-2.5"
              >
                Rencana Implementasi Modul Ini:
              </h4>
              <ul class="space-y-2 text-xs text-content-secondary">
                <li
                  v-for="(feat, idx) in plannedFeatures"
                  :key="idx"
                  class="flex items-center gap-2"
                >
                  <CheckIcon class="w-4 h-4 text-primary shrink-0" />
                  <span>{{ feat }}</span>
                </li>
              </ul>
            </div>
          </div>

          <template #footer>
            <div class="flex items-center justify-between">
              <RouterLink to="/dashboard">
                <AppButton variant="outline" size="sm">
                  <template #left-icon>
                    <ArrowLeftIcon class="w-4 h-4" />
                  </template>
                  Kembali ke Dashboard
                </AppButton>
              </RouterLink>

              <RouterLink to="/dev/design-system">
                <AppButton variant="secondary" size="sm"> Lihat Design System </AppButton>
              </RouterLink>
            </div>
          </template>
        </AppCard>
      </div>

      <div>
        <AppCard title="Detail Navigasi" subtitle="Metadata Route ERP">
          <dl class="space-y-3 text-xs">
            <div>
              <dt class="text-content-secondary">Nama Route:</dt>
              <dd class="font-mono text-content-primary font-semibold mt-0.5">
                {{ String(route.name) }}
              </dd>
            </div>
            <div>
              <dt class="text-content-secondary">Path URL:</dt>
              <dd class="font-mono text-teal-700 font-semibold mt-0.5">
                {{ route.path }}
              </dd>
            </div>
            <div>
              <dt class="text-content-secondary">Perizinan Diperlukan:</dt>
              <dd class="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded w-fit mt-0.5">
                {{ route.meta.permission || 'Umum (Login)' }}
              </dd>
            </div>
            <div>
              <dt class="text-content-secondary">Layout:</dt>
              <dd class="text-content-primary font-medium mt-0.5">
                Desktop Horizontal Nav (Impact Standard)
              </dd>
            </div>
          </dl>
        </AppCard>
      </div>
    </div>
  </div>
</template>
