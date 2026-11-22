import type {
  BomTemplateViewDetail,
  MaterialRequirementItem,
  MaterialRequirementSimulation
} from '../types/bom.types'
import { materialService } from '@/modules/inventory/materials/services/material.service'

/**
 * Decimal-safe rounder to avoid floating point precision artifacts
 */
export function roundToDecimal(value: number, decimals = 4): number {
  const factor = Math.pow(10, decimals)
  return Math.round((value + Number.EPSILON) * factor) / factor
}

/**
 * Calculate material requirements for a template given a production target
 * NOTE: Simulation only, does NOT mutate actual inventory stock balances!
 */
export function calculateMaterialRequirements(
  templateId: number,
  kodeTemplate: string,
  produkId: number,
  namaProduk: string,
  items: BomTemplateViewDetail[],
  targetProduksi: number
): MaterialRequirementSimulation {
  const safeTarget = Math.max(0, targetProduksi)
  const rawMaterials = materialService.getRawItems()
  const allKonversi = materialService.getRawKonversi()

  const requirementItems: MaterialRequirementItem[] = items.map(item => {
    const mat = rawMaterials.find(m => m.id === item.bahan_id)
    const stokTersedia = Number(mat?.qty ?? item.stok_tersedia ?? 0)
    const hargaSatuan = Number(mat?.harga_satuan ?? item.harga_satuan ?? 0)

    // Core formula: Total Kebutuhan = Qty per Produk x Target Produksi
    const totalKebutuhan = roundToDecimal(item.qty * safeTarget, 4)
    const selisihStok = roundToDecimal(stokTersedia - totalKebutuhan, 4)
    const kekuranganQty = selisihStok < 0 ? Math.abs(selisihStok) : 0
    const statusKetersediaan: 'CUKUP' | 'KURANG' = selisihStok >= 0 ? 'CUKUP' : 'KURANG'
    const estimasiTotalBiaya = roundToDecimal(totalKebutuhan * hargaSatuan, 2)

    // Lookup unit conversion info if available
    let konversiInfo: string | undefined
    const konv = allKonversi.find(k => k.bahan_id === item.bahan_id)
    if (konv) {
      konversiInfo = `1 unit beli = ${konv.nilai} ${item.nama_satuan}`
    }

    return {
      bahan_id: item.bahan_id,
      kode_bahan: item.kode_bahan,
      nama_bahan: item.nama_bahan,
      satuan_id: item.satuan_id,
      nama_satuan: item.nama_satuan,
      qty_per_unit: item.qty,
      target_produksi: safeTarget,
      total_kebutuhan: totalKebutuhan,
      stok_tersedia: stokTersedia,
      selisih_stok: selisihStok,
      status_ketersediaan: statusKetersediaan,
      kekurangan_qty: kekuranganQty,
      harga_satuan: hargaSatuan,
      estimasi_total_biaya: estimasiTotalBiaya,
      konversi_info: konversiInfo
    }
  })

  const jumlahBahanKurang = requirementItems.filter(i => i.status_ketersediaan === 'KURANG').length
  const jumlahBahanCukup = requirementItems.filter(i => i.status_ketersediaan === 'CUKUP').length
  const totalEstimasiBiaya = requirementItems.reduce((sum, i) => sum + i.estimasi_total_biaya, 0)
  const totalKebutuhanQty = requirementItems.reduce((sum, i) => sum + i.total_kebutuhan, 0)

  return {
    produk_id: produkId,
    nama_produk: namaProduk,
    template_id: templateId,
    kode_template: kodeTemplate,
    target_produksi: safeTarget,
    total_jenis_bahan: requirementItems.length,
    total_kebutuhan_qty: totalKebutuhanQty,
    total_estimasi_biaya: totalEstimasiBiaya,
    jumlah_bahan_kurang: jumlahBahanKurang,
    jumlah_bahan_cukup: jumlahBahanCukup,
    status_kelayakan: jumlahBahanKurang === 0 ? 'SIAP_PRODUKSI' : 'BAHAN_KURANG',
    items: requirementItems
  }
}
