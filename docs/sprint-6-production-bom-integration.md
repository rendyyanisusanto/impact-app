# Sprint 6 — Production BoM (Bill of Materials) Integration

## 1. Integrasi Resep Komposisi Produk ke Transaksi Produksi

Pada Sprint 6 Fitur 1 (Task 1–6), modul Bill of Materials (`template_produk` & `detail_template_produk`) telah diimplementasikan sebagai master data resep pemakaian bahan baku per 1 unit produk jadi.

Pada Fitur 2 (Task 7–12), data resep tersebut diintegrasikan secara langsung ke dalam alur kerja Transaksi Produksi untuk dua tujuan utama:

1. **Material Requirement Planning (MRP) Live Preview**: Memberikan visibilitas instan kepada operator/PPIC mengenai berapa banyak bahan baku yang dibutuhkan dan apakah stok di gudang saat ini mencukupi sebelum produksi dimulai.
2. **Automated Stock Deduction**: Memotong saldo bahan baku secara presisi saat status produksi diselesaikan (`status_produksi = 2`).

---

## 2. Logika Agregasi Kebutuhan Bahan Baku

Kalkulasi kebutuhan bahan baku dijalankan oleh pure function `calculateProductionMaterialRequirements`:

$$\text{Total Kebutuhan Bahan}_j = \sum_{i=1}^{N} \left( \text{Qty Produk}_i \times \text{Rasio Pemakaian BoM}_{i, j} \right)$$

Di mana:

- $i$ adalah indeks produk jadi yang terdapat pada spreadsheet transaksi produksi.
- $\text{Qty Produk}_i$ adalah kuantitas unit produk ke-$i$ yang akan diproduksi.
- $\text{Rasio Pemakaian BoM}_{i, j}$ adalah rasio pemakaian bahan baku $j$ per 1 unit produk jadi $i$ yang diambil dari template BoM produk tersebut.

### Contoh Kasus Agregasi Multi-Produk:

Misalkan transaksi produksi memiliki 2 item produk jadi:

1. **Kursi Makan Minimalis** (Qty = 10 unit)
   - Kayu Jati: $0.15 \text{ m}^3 / \text{unit} \times 10 = 1.50 \text{ m}^3$
   - Sekrup 2 Inch: $8 \text{ pcs} / \text{unit} \times 10 = 80 \text{ pcs}$
   - Lem Kayu Fox: $0.20 \text{ kg} / \text{unit} \times 10 = 2.00 \text{ kg}$
2. **Meja Makan Jati 6 Kursi** (Qty = 2 unit)
   - Kayu Jati: $0.80 \text{ m}^3 / \text{unit} \times 2 = 1.60 \text{ m}^3$
   - Sekrup 2 Inch: $24 \text{ pcs} / \text{unit} \times 2 = 48 \text{ pcs}$
   - Plitur Melamine: $1.50 \text{ kaleng} / \text{unit} \times 2 = 3.00 \text{ kaleng}$

### Hasil Agregasi Kebutuhan Terkonsolidasi:

- **Kayu Jati**: $1.50 + 1.60 = 3.10 \text{ m}^3$
- **Sekrup 2 Inch**: $80 + 48 = 128 \text{ pcs}$
- **Lem Kayu Fox**: $2.00 \text{ kg}$
- **Plitur Melamine**: $3.00 \text{ kaleng}$

---

## 3. Komponen `ProductionMaterialRequirements.vue`

Panel preview kebutuhan bahan baku ditampilkan di bawah spreadsheet transaksi:

- **Tabel Preview**:
  - Nama Bahan Baku & Kode Bahan.
  - Total Kebutuhan (dihitung real-time sesuai perubahan Qty di spreadsheet).
  - Stok Gudang Saat Ini (diambil dari `master_data_bahan.qty`).
  - Satuan Pemakaian (diambil dari relasi `satuan_pakai`).
  - Indikator Status Kecukupan:
    - **CUKUP** (Badge hijau): Jika $\text{Stok Gudang} \ge \text{Total Kebutuhan}$.
    - **KURANG** (Badge merah): Jika $\text{Stok Gudang} < \text{Total Kebutuhan}$, menampilkan jumlah kekurangan unit yang harus diadakan oleh bagian pengadaan/purchasing.
- **Handling Produk Tanpa BoM**:
  - Jika suatu produk belum memiliki template BoM terdaftar, sistem menampilkan badge peringatan kuning: _"Belum ada BoM"_.
  - Transaksi produksi tetap diizinkan disimpan, tetapi agregasi bahan untuk produk tersebut diabaikan hingga template BoM didefinisikan.
