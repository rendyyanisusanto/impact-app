import type { CalculatedMaterialRequirement } from '../types/production.types'
import type { BomTemplateWithItems } from '../types/bom.types'

/**
 * Generate formatted production code matching legacy setting:
 * `PD{month}{year}-{last_number}`
 * Example: For date 2026-11-01 and sequence 1 -> PD1126-0001 (or PD1126-1)
 */
export function formatProductionCode(
  date: Date = new Date(),
  lastNumber: number = 1,
  padDigits: number = 4
): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear()).slice(-2)
  const numStr = String(lastNumber).padStart(padDigits, '0')
  return `PD${month}${year}-${numStr}`
}

/**
 * Parses a production code to extract year, month, and sequence number
 */
export function parseProductionCode(code: string): {
  prefix: string
  month: number
  year: number
  sequence: number
} | null {
  const match = code.match(/^PD(\d{2})(\d{2})-(\d+)$/)
  if (!match) return null

  return {
    prefix: 'PD',
    month: parseInt(match[1], 10),
    year: parseInt(match[2], 10),
    sequence: parseInt(match[3], 10)
  }
}

/**
 * Round decimal values safely to avoid IEEE floating-point anomalies
 */
export function roundToPrecision(value: number, decimals = 4): number {
  const factor = 10 ** decimals
  return Math.round((value + Number.EPSILON) * factor) / factor
}

/**
 * Calculate distinct product count and total quantity for production items
 */
export function calculateProductionTotals(
  rows: Array<{ produk_id?: number | null; qty?: number | null }>
): {
  distinctProducts: number
  totalQty: number
} {
  const validRows = rows.filter(r => (r.produk_id || 0) > 0 && (r.qty || 0) > 0)
  const distinctProductIds = new Set(validRows.map(r => r.produk_id))

  const totalQty = validRows.reduce((sum, r) => sum + Number(r.qty || 0), 0)

  return {
    distinctProducts: distinctProductIds.size,
    totalQty
  }
}

export interface MaterialStockInfo {
  id: number
  kode: string
  nama: string
  satuan_id: number
  satuan_nama: string
  qty: number // current available stock in warehouse
}

/**
 * Aggregate material requirements across multiple products and their BoM templates
 */
export function calculateProductionMaterialRequirements(
  productionItems: Array<{ produk_id: number; qty: number }>,
  productBomMap: Map<number, BomTemplateWithItems | null>,
  materialsList: MaterialStockInfo[]
): CalculatedMaterialRequirement[] {
  const requirementsMap = new Map<
    number,
    {
      bahan_id: number
      kode_bahan: string
      nama_bahan: string
      satuan_id: number
      satuan_nama: string
      total_kebutuhan: number
    }
  >()

  // 1. Traverse each production product item
  for (const item of productionItems) {
    if (!item.produk_id || item.qty <= 0) continue

    const bom = productBomMap.get(item.produk_id)
    if (!bom || !bom.items || bom.items.length === 0) continue

    // 2. Multiply each material item by product production quantity
    for (const matRow of bom.items) {
      if (!matRow.bahan_id || matRow.qty <= 0) continue

      const current = requirementsMap.get(matRow.bahan_id)
      const neededForThisProduct = roundToPrecision(matRow.qty * item.qty, 4)

      if (current) {
        current.total_kebutuhan = roundToPrecision(
          current.total_kebutuhan + neededForThisProduct,
          4
        )
      } else {
        requirementsMap.set(matRow.bahan_id, {
          bahan_id: matRow.bahan_id,
          kode_bahan: matRow.kode_bahan || `MAT-${matRow.bahan_id}`,
          nama_bahan: matRow.nama_bahan || `Bahan #${matRow.bahan_id}`,
          satuan_id: matRow.satuan_id || 1,
          satuan_nama: matRow.nama_satuan || 'Satuan',
          total_kebutuhan: neededForThisProduct
        })
      }
    }
  }

  // 3. Compare aggregated requirements with actual warehouse stocks
  const results: CalculatedMaterialRequirement[] = []

  for (const req of requirementsMap.values()) {
    const mat = materialsList.find(m => m.id === req.bahan_id)
    const stokTersedia = Number(mat?.qty || 0)
    const selisih = roundToPrecision(stokTersedia - req.total_kebutuhan, 4)
    const isCukup = selisih >= 0
    const kekurangan = isCukup ? 0 : roundToPrecision(Math.abs(selisih), 4)

    results.push({
      bahan_id: req.bahan_id,
      kode_bahan: req.kode_bahan,
      nama_bahan: req.nama_bahan,
      satuan_id: req.satuan_id,
      satuan_nama: req.satuan_nama,
      total_kebutuhan: req.total_kebutuhan,
      stok_tersedia: stokTersedia,
      selisih,
      status: isCukup ? 'CUKUP' : 'KURANG',
      kekurangan
    })
  }

  // Sort alphabetically by material name
  return results.sort((a, b) => a.nama_bahan.localeCompare(b.nama_bahan))
}
