<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppModal from '@/shared/components/feedback/AppModal.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppInput from '@/shared/components/ui/AppInput.vue'
import AppTextarea from '@/shared/components/ui/AppTextarea.vue'
import AppSelect from '@/shared/components/ui/AppSelect.vue'
import { bugReportService, type BugPriority } from '../services/bug-report.service'
import { useToast } from '@/shared/composables/useToast'
import { UploadCloud, Image as ImageIcon, X } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    initialErrorCode?: string
  }>(),
  {
    initialErrorCode: ''
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submitted'): void
}>()

const route = useRoute()
const toast = useToast()

const title = ref('')
const moduleName = ref('')
const description = ref('')
const priority = ref<BugPriority>('MEDIUM')
const errorCode = ref('')
const pageUrl = ref('')

const screenshotBase64 = ref('')
const screenshotName = ref('')
const screenshotType = ref('')
const screenshotPreview = ref('')
const isSubmitting = ref(false)

const priorityOptions = [
  { value: 'LOW', label: 'Rendah (Low)' },
  { value: 'MEDIUM', label: 'Sedang (Medium)' },
  { value: 'HIGH', label: 'Tinggi (High)' },
  { value: 'CRITICAL', label: 'Kritis (Critical)' }
]

const moduleOptions = [
  { value: '', label: 'Pilih Modul Terkait...' },
  { value: 'auth', label: 'Autentikasi & Akun' },
  { value: 'sales', label: 'Penjualan (Sales)' },
  { value: 'procurement', label: 'Pengadaan (Procurement)' },
  { value: 'inventory', label: 'Persediaan & Gudang (Inventory)' },
  { value: 'production', label: 'Produksi' },
  { value: 'delivery', label: 'Pengiriman' },
  { value: 'hr', label: 'SDM & Karyawan' },
  { value: 'master', label: 'Master Data' },
  { value: 'system', label: 'System Setting & Admin' }
]

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      pageUrl.value = typeof window !== 'undefined' ? window.location.href : route.fullPath
      errorCode.value = props.initialErrorCode || ''
      title.value = ''
      description.value = ''
      screenshotBase64.value = ''
      screenshotName.value = ''
      screenshotType.value = ''
      screenshotPreview.value = ''
    }
  }
)

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    toast.error('File yang dipilih harus berupa gambar (PNG, JPG, WEBP).')
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    toast.error('Ukuran gambar tidak boleh melebihi 5MB.')
    return
  }

  screenshotName.value = file.name
  screenshotType.value = file.type

  const reader = new FileReader()
  reader.onload = () => {
    const res = reader.result as string
    screenshotPreview.value = res
    // Strip header prefix data:image/...;base64,
    const commaIdx = res.indexOf(',')
    screenshotBase64.value = commaIdx !== -1 ? res.substring(commaIdx + 1) : res
  }
  reader.readAsDataURL(file)
}

function removeScreenshot() {
  screenshotBase64.value = ''
  screenshotName.value = ''
  screenshotType.value = ''
  screenshotPreview.value = ''
}

async function handleSubmit() {
  if (!title.value.trim()) {
    toast.error('Judul laporan bug wajib diisi.')
    return
  }
  if (!description.value.trim()) {
    toast.error('Deskripsi masalah wajib diisi.')
    return
  }

  try {
    isSubmitting.value = true
    await bugReportService.create({
      title: title.value.trim(),
      description: description.value.trim(),
      module: moduleName.value || undefined,
      pageUrl: pageUrl.value,
      priority: priority.value,
      screenshotBase64: screenshotBase64.value || undefined,
      screenshotName: screenshotName.value || undefined,
      screenshotType: screenshotType.value || undefined
    })

    toast.success('Laporan bug berhasil dikirim. Tim teknis akan segera menindaklanjuti.')
    emit('update:modelValue', false)
    emit('submitted')
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Gagal mengirim laporan bug.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AppModal
    :model-value="modelValue"
    title="Laporkan Masalah / Bug Sistem"
    description="Kirim laporan kendala atau bug langsung ke tim teknis dengan detail halaman dan screenshot."
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <div>
        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
          Judul Masalah <span class="text-rose-500">*</span>
        </label>
        <AppInput
          v-model="title"
          placeholder="Contoh: Tombol simpan tidak merespons di form Bank"
          :disabled="isSubmitting"
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
            Modul Terkait
          </label>
          <AppSelect
            v-model="moduleName"
            :options="moduleOptions"
            :disabled="isSubmitting"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
            Tingkat Prioritas
          </label>
          <AppSelect
            v-model="priority"
            :options="priorityOptions"
            :disabled="isSubmitting"
          />
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
          URL Halaman Saat Masalah Terjadi
        </label>
        <AppInput
          v-model="pageUrl"
          readonly
          class="bg-slate-50 dark:bg-slate-800 text-slate-500 font-mono text-xs"
        />
      </div>

      <div v-if="errorCode">
        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
          Kode Error Terdeteksi
        </label>
        <AppInput
          v-model="errorCode"
          readonly
          class="bg-rose-50 dark:bg-rose-950/30 text-rose-600 font-mono text-xs font-semibold"
        />
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
          Deskripsi Lengkap <span class="text-rose-500">*</span>
        </label>
        <AppTextarea
          v-model="description"
          :rows="4"
          placeholder="Jelaskan langkah-langkah yang dilakukan sebelum error terjadi dan apa yang diharapkan..."
          :disabled="isSubmitting"
        />
      </div>

      <!-- Screenshot Upload Area -->
      <div>
        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
          Tangkapan Layar (Screenshot Opsional, Maks 5MB)
        </label>

        <div
          v-if="!screenshotPreview"
          class="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-4 text-center hover:border-teal-500 transition-colors cursor-pointer bg-slate-50/50 dark:bg-slate-800/50"
          @click="($refs.fileInput as HTMLInputElement)?.click()"
        >
          <input
            ref="fileInput"
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/webp"
            class="hidden"
            @change="handleFileChange"
          />
          <UploadCloud class="w-8 h-8 text-slate-400 mx-auto mb-1" />
          <p class="text-xs text-slate-600 dark:text-slate-300 font-medium">
            Klik untuk memilih gambar screenshot
          </p>
          <p class="text-[10px] text-slate-400">PNG, JPG, WEBP hingga 5MB</p>
        </div>

        <div
          v-else
          class="relative border border-slate-200 dark:border-slate-700 rounded-lg p-2 bg-slate-50 dark:bg-slate-800 flex items-center gap-3"
        >
          <img
            :src="screenshotPreview"
            alt="Preview screenshot"
            class="w-16 h-16 object-cover rounded border border-slate-200 dark:border-slate-700"
          />
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
              {{ screenshotName }}
            </p>
            <p class="text-[10px] text-teal-600 dark:text-teal-400 flex items-center gap-1 mt-0.5">
              <ImageIcon class="w-3 h-3" /> Siap diunggah bersama laporan
            </p>
          </div>
          <button
            type="button"
            class="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            @click="removeScreenshot"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <AppButton
          variant="outline"
          :disabled="isSubmitting"
          @click="emit('update:modelValue', false)"
        >
          Batal
        </AppButton>
        <AppButton
          variant="primary"
          :loading="isSubmitting"
          @click="handleSubmit"
        >
          Kirim Laporan
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>
