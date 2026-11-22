# Sprint 6 — Bill of Materials (BoM) Schema Mapping

## 1. Database Schema Audit & Legacy Verification

Audit dilakukan terhadap skrip SQL legacy `u1573701_smm.sql` untuk mengidentifikasi struktur tabel, relasi foreign key, tipe data, indeks, default sequence auto-numbering, dan trigger terkait modul komposisi produk furniture.

### 1.1 Tabel `template_produk` (Header BoM / Resep Master)

Tabel ini merepresentasikan header resep atau komposisi material untuk produk jadi:

```sql
CREATE TABLE `template_produk` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `kode` varchar(255) DEFAULT NULL,
  `nama` varchar(255) DEFAULT NULL,
  `produk_id` int(11) DEFAULT NULL,
  `status_aktif` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `produk_id` (`produk_id`),
  CONSTRAINT `template_produk_ibfk_1` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
```

**Karakteristik Kunci:**

- Tidak memiliki trigger database apapun (`TRIGGER` stok tidak ada).
- Merupakan master data murni (recipe/spec sheet).
- Mengacu langsung pada entitas `produk.id` (1 Produk dapat memiliki 1 atau lebih Template BoM).

### 1.2 Tabel `detail_template_produk` (Rincian Komposisi Bahan Baku)

Tabel ini merepresentasikan rincian komponen bahan baku per 1 unit produk jadi:

```sql
CREATE TABLE `detail_template_produk` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `produk_id` int(11) DEFAULT NULL,
  `bahan_id` int(11) DEFAULT NULL,
  `satuan_id` int(11) DEFAULT NULL,
  `qty` int(11) DEFAULT NULL,
  `template_produk_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `template_produk_id` (`template_produk_id`),
  KEY `bahan_id` (`bahan_id`),
  KEY `satuan_id` (`satuan_id`),
  CONSTRAINT `detail_template_produk_ibfk_1` FOREIGN KEY (`template_produk_id`) REFERENCES `template_produk` (`id`) ON DELETE CASCADE,
  CONSTRAINT `detail_template_produk_ibfk_2` FOREIGN KEY (`bahan_id`) REFERENCES `master_data_bahan` (`id`),
  CONSTRAINT `detail_template_produk_ibfk_3` FOREIGN KEY (`satuan_id`) REFERENCES `satuan_pakai` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
```

**Karakteristik Kunci:**

- `qty` pada sistem legacy berupa kuantitas kebutuhan pemakaian per 1 unit produk. Pada v2 didukung bilangan desimal hingga 4 digit di belakang koma untuk kebutuhan presisi material (misal kayu 2.5 m3 atau lem 0.75 kg).
- `satuan_id` terikat ke `satuan_pakai.id`.
- Foreign key cascade delete dari header `template_produk`.
- MURNI master data — tidak ada trigger pengeluaran stok.

### 1.3 Perbandingan Kontras: BoM vs Transaksi Produksi

Berdasarkan audit SQL legacy:

- `template_produk` & `detail_template_produk` = **0 Trigger**. Menyimpan, mengedit, atau menghapus template BoM sama sekali **TIDAK MENGUBAH STOK** (`master_data_bahan.qty` tetap utuh, dan tidak ada baris baru di `histori_stok_bahan`).
- Kontras dengan tabel transaksi `detail_bahan_produksi` yang memiliki trigger `stok_produksi`:
  ```sql
  CREATE TRIGGER `stok_produksi` AFTER INSERT ON `detail_bahan_produksi`
  FOR EACH ROW BEGIN
      UPDATE master_data_bahan SET qty = qty - NEW.qty WHERE id = NEW.bahan_id;
      INSERT INTO histori_stok_bahan (...) VALUES (...);
  END
  ```
- Sprint 6 Task 1–6 fokus pada Master BoM / Resep Template, sehingga mutasi stok mutlak tidak dilakukan.

### 1.4 Setting Auto-Numbering Legacy

Pada tabel `setting`:

```sql
(40, 'template_produk', 'kode', 'Template-{rand}', NULL)
```

Pada Impact Furniture v2, format sequence disempurnakan dengan prefix modern yang konsisten dengan legacy pattern: `TPL-YYYYMM-XXX` (contoh: `TPL-202611-001`).

---

## 2. TypeScript Domain Models

### `app/src/modules/production/types/bom.types.ts`

```typescript
export interface TemplateProduk {
  id: number
  kode: string
  nama: string
  produk_id: number
  status_aktif: number
}

export interface DetailTemplateProduk {
  id: number
  template_produk_id: number
  produk_id: number
  bahan_id: number
  satuan_id: number
  qty: number
}
```

Field relasional diperkaya pada ViewModel (`BomTemplateWithItems`, `BomListItem`, `BomMaterialRow`) untuk keperluan grid spreadsheet, auto calculation, dan simulasi kebutuhan material.
