# Panduan Penggunaan Komponen (Component Guidelines) — Impact Furniture ERP v2

Dokumen ini merupakan panduan standar bagi tim pengembang dalam membuat dan menggunakan komponen antarmuka pada proyek **Impact Furniture ERP v2**.

---

## 1. Prinsip Utama Komponen

Setiap komponen yang dibangun dalam sistem wajib memenuhi aturan berikut:

1. **Composition API & TypeScript**: Menggunakan `<script setup lang="ts">`.
2. **Strict Props & Emits Typing**: Setiap props wajib didefinisikan dengan antarmuka TypeScript dan nilai default eksplisit menggunakan `withDefaults(defineProps<Props>(), { ... })`.
3. **Komunikasi Bebas Efek Samping**: Komponen presentasional tidak boleh memanggil API secara langsung atau mengubah props yang diterima (`no direct prop mutation`).
4. **Tailwind Tokens Only**: Menggunakan design tokens yang terdaftar pada `tailwind.config.js` dan `tokens.css`. Dilarang menuliskan nilai hex secara sembarangan.
5. **Aksesibilitas (a11y)**: Mendukung navigasi keyboard (Enter, Space, Escape, Arrow keys), fokus visual (`focus:ring-2`), dan atribut ARIA yang relevan.

---

## 2. Katalog Komponen & Panduan Penggunaan

### 2.1 Core UI Components (Task 5)

#### 2.1.1 AppButton & AppIconButton

- **Lokasi**: `@/shared/components/ui/AppButton.vue` & `@/shared/components/ui/AppIconButton.vue`
- **Variants**: `'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'`
- **Sizes**: `'xs' | 'sm' | 'md' | 'lg'`
- **Props**: `type`, `disabled`, `loading`, `block`, `label` (wajib untuk IconButton).

```vue
<AppButton variant="primary" size="sm" :loading="isLoading" @click="handleSave">
  <template #left-icon><SaveIcon class="w-4 h-4" /></template>
  Simpan Data
</AppButton>

<AppIconButton label="Hapus Baris" variant="danger" size="sm" @click="handleDelete">
  <TrashIcon class="w-4 h-4" />
</AppIconButton>
```

#### 2.1.2 Form Controls (AppInput, AppTextarea, AppSelect, AppCheckbox, AppRadio)

- **Lokasi**: `@/shared/components/ui/`
- **Dukungan**: `v-model` dua arah, status invalid (`invalid: boolean` / `error: boolean | string`), status disabled, placeholder, required indicator.

```vue
<!-- Input Teks -->
<AppInput v-model="customerName" placeholder="Nama PT / Customer" :invalid="hasError" />

<!-- Area Teks -->
<AppTextarea v-model="orderNotes" :rows="3" placeholder="Catatan khusus pesanan..." />

<!-- Dropdown Pilihan Native -->
<AppSelect v-model="selectedBank" :options="bankOptions" placeholder="-- Pilih Rekening Bank --" />

<!-- Checkbox -->
<AppCheckbox v-model="isTaxInclusive" label="Harga sudah termasuk PPN 11%" />

<!-- Radio Button -->
<AppRadio v-model="paymentTerm" value="cash" label="Tunai / Kas" name="payment_term" />
<AppRadio v-model="paymentTerm" value="tempo" label="Tempo 30 Hari" name="payment_term" />
```

#### 2.1.3 Form Layout & Validation (AppFormField, AppFormLabel, AppFormError, AppFormSection)

- **Lokasi**: `@/shared/components/forms/` (juga di `@/shared/components/ui/`)
- Menangani keterkaitan label-input melalui slot scoped `id`, pesan validasi dengan `role="alert"`, dan teks bantuan.

```vue
<AppFormSection title="Data Pengiriman" description="Alamat pabrik atau gudang tujuan">
  <AppFormField label="Alamat Gudang" required :error="errors.address">
    <template #default="{ id, isError }">
      <AppTextarea :id="id" v-model="form.address" :invalid="isError" />
    </template>
  </AppFormField>
</AppFormSection>
```

#### 2.1.4 Feedback & Loading (AppAlert, AppEmptyState, AppLoadingState, AppSpinner, AppSkeleton)

- **Lokasi**: `@/shared/components/feedback/` & `@/shared/components/ui/`

```vue
<!-- Alert Kontekstual -->
<AppAlert variant="warning" title="Batas Kredit Tercapai">
  Customer ini telah mencapai limit transaksi yang ditentukan.
</AppAlert>

<!-- Loading State & Skeleton -->
<AppLoadingState v-if="isLoading" text="Mengambil data jurnal..." />
<AppSkeleton v-if="isLoading" type="line" :count="4" height="20px" />

<!-- Empty State -->
<AppEmptyState
  v-if="!isLoading && items.length === 0"
  title="Belum Ada Item"
  description="Tambahkan bahan baku baru untuk memulai proses."
>
  <template #action>
    <AppButton variant="primary" size="sm" @click="openCreateModal">
      Tambah Item
    </AppButton>
  </template>
</AppEmptyState>
```

---

### 2.2 Advanced Shared Components (Task 6)

#### 2.2.1 AppModal

- **Lokasi**: `@/shared/components/feedback/AppModal.vue`
- **Fitur**: `v-model` kontrol buka/tutup, modal dialog ARIA, focus trap otomatis, penguncian scroll body, penutupan via backdrop atau tombol Escape, ukuran dinamis (`sm`, `md`, `lg`, `xl`).

```vue
<AppModal v-model="isModalOpen" size="lg" title="Tambah Bahan Baku">
  <div class="space-y-4">
    <AppFormField label="Kode Bahan" required>
      <AppInput v-model="newMaterial.code" />
    </AppFormField>
  </div>
  <template #footer>
    <AppButton variant="secondary" size="sm" @click="isModalOpen = false">Batal</AppButton>
    <AppButton variant="primary" size="sm" @click="handleSaveMaterial">Simpan</AppButton>
  </template>
</AppModal>
```

#### 2.2.2 AppConfirmDialog & useConfirm

- **Lokasi**: `@/shared/components/feedback/AppConfirmDialog.vue` & `@/shared/composables/useConfirm.ts`
- Menyediakan konfirmasi berbasis Promise tanpa perlu boilerplate ref modal di tiap template.

```ts
import { useConfirm } from '@/shared/composables/useConfirm'
const { confirm } = useConfirm()

async function handleDelete(id: number) {
  const confirmed = await confirm({
    title: 'Hapus Pesanan Penjualan?',
    message: 'Tindakan ini tidak dapat dibatalkan dan akan mempengaruhi alokasi stok.',
    variant: 'danger',
    confirmText: 'Ya, Hapus Data',
    cancelText: 'Batal'
  })

  if (confirmed) {
    // Jalankan aksi hapus
  }
}
```

#### 2.2.3 Sistem Notifikasi Toast (useToast & AppToastContainer)

- **Lokasi**: `@/shared/composables/useToast.ts` & `@/shared/components/feedback/AppToastContainer.vue`
- Menyediakan antrean notifikasi reaktif global dengan tipe `'success' | 'danger' | 'warning' | 'info'`.

```ts
import { useToast } from '@/shared/composables/useToast'
const toast = useToast()

toast.success('Sales order SO-2026-001 berhasil diterbitkan!')
toast.error('Gagal memproses faktur: stok tidak mencukupi.')
```

#### 2.2.4 AppDataTable & AppTableToolbar

- **Lokasi**: `@/shared/components/data/AppDataTable.vue` & `@/shared/components/data/AppTableToolbar.vue`
- Komponen tabel transaksi utama ERP dengan dukungan:
  - Definisi kolom bertipe kuat (`TableColumn<T>[]`)
  - Sorting client-side atau server-side
  - Paginasi client-side atau server-side
  - Seleksi baris tunggal maupun massal (select all)
  - Desain densitas padat khas ERP (`density="compact" | "comfortable"`)
  - Slot kustom untuk sel nominal, tanggal, status, dan tombol aksi

```vue
<AppDataTable
  :columns="columns"
  :data="suppliers"
  selectable
  density="compact"
  v-model:selectedRows="selectedSuppliers"
  @sort="handleSortChange"
>
  <template #toolbar>
    <AppTableToolbar v-model:searchQuery="searchQuery" searchPlaceholder="Cari suplier...">
      <template #actions>
        <AppButton variant="primary" size="sm" @click="openModal">Tambah Suplier</AppButton>
      </template>
    </AppTableToolbar>
  </template>

  <template #cell-status="{ value }">
    <AppStatusBadge :status="value" />
  </template>

  <template #actions="{ row }">
    <AppIconButton label="Edit" variant="ghost" size="sm" @click="handleEdit(row)">
      <EditIcon class="w-4 h-4" />
    </AppIconButton>
  </template>
</AppDataTable>
```

#### 2.2.5 AppTabs & AppPagination

- **Lokasi**: `@/shared/components/navigation/AppTabs.vue` & `@/shared/components/navigation/AppPagination.vue`
- `AppTabs`: Navigasi tab berbasis ARIA dengan dukungan tombol panah kiri/kanan keyboard.
- `AppPagination`: Menghitung nomor halaman, batasan data, dan pemilih ukuran halaman secara presisi.
