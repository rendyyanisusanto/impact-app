# Laporan Implementasi Sprint 1 — Task 5

## Core UI Components

### 1. Ringkasan Eksekutif

Task 5 membangun fondasi komponen antarmuka dasar yang dapat digunakan kembali (_reusable_) di seluruh modul ERP Impact Furniture v2 tanpa ketergantungan pada UI framework pihak ketiga (seperti PrimeVue, Vuetify, Bootstrap, dll.). Seluruh komponen dibangun murni menggunakan Vue 3 Composition API, TypeScript strict, dan Tailwind CSS design tokens.

### 2. Komponen yang Dihasilkan

1. **Buttons**:
   - `AppButton.vue`: Varian `primary`, `secondary`, `outline`, `ghost`, `danger`. Ukuran `xs`, `sm`, `md`, `lg`. Status `loading`, `disabled`.
   - `AppIconButton.vue`: Tombol berbasis ikon dengan `aria-label` wajib dan status loading/disabled.
2. **Form Controls**:
   - `AppInput.vue`: Input teks, nomor, email, password, search, tanggal, clearable, invalid state, dan focus ring tokens.
   - `AppTextarea.vue`: Area teks dengan kendali baris, invalid state, dan pembatasan panjang karakter.
   - `AppSelect.vue`: Elemen select native yang terstandarisasi dengan opsi bertipe `SelectOption[]`.
   - `AppCheckbox.vue`: Mendukung model boolean dan array untuk seleksi multi-opsi.
   - `AppRadio.vue`: Mendukung penentuan nilai tunggal bertipe jelas.
3. **Form Layouts**:
   - `AppFormField.vue`: Mengintegrasikan label, error alert, dan helper text dengan kontrol slot.
   - `AppFormLabel.vue`: Label form dengan penanda tanda bintang merah untuk field wajib (`required`).
   - `AppFormError.vue`: Pesan kesalahan validasi dengan `role="alert"` untuk aksesibilitas pembaca layar.
   - `AppFormSection.vue`: Pembagi bagian formulir dengan judul dan deskripsi kelompok.
4. **Visual & Status**:
   - `AppBadge.vue`: Label tag status semantik (`neutral`, `success`, `warning`, `danger`, `info`).
   - `AppCard.vue`: Kartu kontainer padat informasi dengan slot header, actions, default, dan footer.
   - `AppDivider.vue`: Garis pembatas horizontal dan vertikal dengan opsi teks label.
5. **Loading & Feedback**:
   - `AppSpinner.vue`: Indikator pemuatan berputar dengan `role="status"` dan fallback screen reader.
   - `AppSkeleton.vue`: Kerangka animasi pulsa untuk tata letak pemuatan data.
   - `AppLoadingState.vue`: Tampilan status pemuatan data sentral dengan pesan kustom.
   - `AppAlert.vue`: Kotak pemberitahuan kontekstual dengan ikon semantik dan tombol tutup opsional.
   - `AppEmptyState.vue`: Tampilan representasi status data kosong dengan slot tombol aksi.

### 3. Hasil Pengujian Unit

Komponen diuji secara perilaku (_behavioral testing_) mencakup validasi props, emits, v-model, disabled state, loading state, dan aksesibilitas:

- `AppButton.spec.ts`: 5 lulus
- `AppIconButton.spec.ts`: 3 lulus
- `AppInput.spec.ts`: 5 lulus
- `AppTextarea.spec.ts`: 2 lulus
- `AppSelect.spec.ts`: 4 lulus
- `AppCheckbox.spec.ts`: 3 lulus
- `AppRadio.spec.ts`: 3 lulus
- `AppBadge.spec.ts`: 3 lulus
- `AppCard.spec.ts`: 3 lulus
- `AppFormField.spec.ts`: 4 lulus
- `AppLoadingState.spec.ts`: 3 lulus
- `AppEmptyState.spec.ts`: 2 lulus
- `AppAlert.spec.ts`: 2 lulus
  Total pengujian Task 5: 42 pengujian unit lulus 100%.
