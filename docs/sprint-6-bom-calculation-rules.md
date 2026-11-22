# Sprint 6 — Bill of Materials (BoM) Calculation & MRP Rules

## 1. Rumus Dasar Komposisi BoM

BoM merepresentasikan resep material untuk membuat tepat **1 unit produk jadi**.

### 1.1 Estimasi Biaya Bahan per 1 Unit Produk

Untuk setiap baris bahan baku ke-$i$:
$$\text{Subtotal Biaya}_i = \text{Qty per Produk}_i \times \text{Harga Satuan}_i$$

Total estimasi biaya bahan untuk 1 unit produk jadi:
$$\text{Total Estimasi Biaya per Unit} = \sum_{i=1}^{n} \text{Subtotal Biaya}_i$$

---

## 2. Simulasi Kebutuhan Bahan Produksi (MRP Preview)

Ketika perencana produksi menentukan target jumlah produk jadi yang akan diproduksi ($\text{Target Produksi} \ge 0$):

### 2.1 Total Kebutuhan Bahan

$$\text{Total Kebutuhan}_i = \text{Qty per Produk}_i \times \text{Target Produksi}$$

### 2.2 Selisih Stok dan Status Ketersediaan

$$\text{Selisih Stok}_i = \text{Stok Tersedia}_i - \text{Total Kebutuhan}_i$$

Status ketersediaan bahan dievaluasi secara biner:
$$\text{Status Ketersediaan}_i = \begin{cases} \text{CUKUP}, & \text{jika } \text{Selisih Stok}_i \ge 0 \\ \text{KURANG}, & \text{jika } \text{Selisih Stok}_i < 0 \end{cases}$$

### 2.3 Kekurangan Kuantitas

$$\text{Kekurangan Qty}_i = \begin{cases} 0, & \text{jika } \text{Selisih Stok}_i \ge 0 \\ |\text{Selisih Stok}_i|, & \text{jika } \text{Selisih Stok}_i < 0 \end{cases}$$

### 2.4 Estimasi Biaya Bahan untuk Target Produksi

$$\text{Estimasi Total Biaya}_i = \text{Total Kebutuhan}_i \times \text{Harga Satuan}_i$$

---

## 3. Ketentuan Presisi Desimal & Zero Side-Effects

1. **Presisi Desimal**: Seluruh perhitungan menggunakan utility `roundToDecimal` dengan 4 desimal untuk kuantitas dan 2 desimal untuk nilai rupiah guna mencegah rounding issue floating-point bawaan JavaScript.
2. **Read-Only MRP Guarantee**: Simulasi ini murni kalkulasi pada memori ViewModel. Tidak ada pemanggilan API mutasi stok gudang, tidak ada perubahan pada `master_data_bahan.qty`, dan tidak ada pencatatan ke `histori_stok_bahan`.
