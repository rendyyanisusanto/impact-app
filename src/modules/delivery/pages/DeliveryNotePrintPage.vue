<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Printer } from 'lucide-vue-next'
import AppPageHeader from '@/shared/components/navigation/AppPageHeader.vue'
import AppButton from '@/shared/components/ui/AppButton.vue'
import AppSkeleton from '@/shared/components/ui/AppSkeleton.vue'
import DeliveryNotePrintDocument from '../components/DeliveryNotePrintDocument.vue'
import { deliveryNoteService } from '../services/delivery-note.service'
import type { DeliveryNoteWithDetails } from '../types/delivery-note.types'
import { useToast } from '@/shared/composables/useToast'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const deliveryId = computed(() => Number(route.params.id))
const delivery = ref<DeliveryNoteWithDetails | null>(null)
const isLoading = ref(true)

const loadDelivery = async () => {
  const idNum = deliveryId.value
  if (!idNum || isNaN(idNum)) {
    isLoading.value = false
    return
  }

  isLoading.value = true
  try {
    const data = await deliveryNoteService.getDeliveryNoteById(idNum)
    delivery.value = data
  } catch (err) {
    console.error(err)
    toast.error('Gagal memuat Surat Jalan untuk dicetak.')
    router.push('/delivery/notes')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadDelivery()
})

const handlePrint = () => {
  window.print()
}
</script>

<template>
  <div class="space-y-6 w-full print:m-0 print:p-0">
    <!-- Non-print toolbar -->
    <div class="print:hidden">
      <AppPageHeader
        :title="`Cetak Surat Jalan: ${delivery?.kode || '...'}`"
        :breadcrumbs="[
          { label: 'Beranda', to: '/' },
          { label: 'Pengiriman', to: '/delivery/notes' },
          { label: 'Surat Jalan', to: '/delivery/notes' },
          { label: 'Cetak' }
        ]"
      >
        <template #actions>
          <div class="flex items-center gap-2.5">
            <AppButton variant="outline" @click="router.push(`/delivery/notes/${deliveryId}`)">
              <template #icon>
                <ArrowLeft class="w-4 h-4" />
              </template>
              Kembali
            </AppButton>

            <AppButton variant="primary" data-test="btn-trigger-print" @click="handlePrint">
              <template #icon>
                <Printer class="w-4 h-4" />
              </template>
              Cetak Dokumen
            </AppButton>
          </div>
        </template>
      </AppPageHeader>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="p-8 space-y-4 print:hidden">
      <AppSkeleton class="h-16 w-full" />
      <AppSkeleton class="h-96 w-full" />
    </div>

    <!-- Printable Document Component -->
    <div v-else-if="delivery" class="pt-4 print:pt-0">
      <DeliveryNotePrintDocument :delivery="delivery" />
    </div>
  </div>
</template>
