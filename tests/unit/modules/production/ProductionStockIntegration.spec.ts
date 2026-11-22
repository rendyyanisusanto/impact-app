import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { productionService } from '@/modules/production/services/production.service'
import { productService } from '@/modules/inventory/products/services/product.service'
import { materialService } from '@/modules/inventory/materials/services/material.service'
import { bomService } from '@/modules/production/services/bom.service'

describe('Sprint 6 — Task 11: Production Stock & BoM Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    productionService.reset()
    productService.reset()
    materialService.reset()
    bomService.reset()
  })

  it('11.1 calculates material requirements accurately from active BoM templates', async () => {
    // Production #3 has Product 43 (IC-74, target qty: 15)
    const prod = await productionService.getProductionById(3)
    expect(prod).not.toBeNull()
    expect(prod!.material_requirements).toBeDefined()
    expect(prod!.material_requirements!.length).toBeGreaterThan(0)

    // Product 43 uses:
    // Bahan 2 (Busa): 1 per unit -> 1 * 15 = 15
    // Bahan 4 (Kain): 2 per unit -> 2 * 15 = 30
    // Bahan 6 (Sekrup): 16 per unit -> 16 * 15 = 240
    const busaReq = prod!.material_requirements!.find(r => r.bahan_id === 2)
    expect(busaReq).toBeDefined()
    expect(busaReq!.total_kebutuhan).toBe(15)

    const kainReq = prod!.material_requirements!.find(r => r.bahan_id === 4)
    expect(kainReq).toBeDefined()
    expect(kainReq!.total_kebutuhan).toBe(30)
  })

  it('11.2 aggregates shared materials across multiple products in the same production order', async () => {
    // Create new production with Product 43 (qty: 10) AND Product 44 (qty: 5)
    // Both products use Bahan 2 (Busa Density 32):
    // Product 43 uses 1 sheet per unit -> 10 * 1 = 10 sheets
    // Product 44 uses 4 sheets per unit -> 5 * 4 = 20 sheets
    // Total aggregate needed for Bahan 2 = 10 + 20 = 30 sheets!
    const created = await productionService.createProduction({
      kode: 'PD1126-0099',
      jenis_produksi: 1,
      tanggal: '2026-11-01',
      status_produksi: 0,
      items: [
        { produk_id: 43, qty: 10 },
        { produk_id: 44, qty: 5 }
      ]
    })

    const detail = await productionService.getProductionById(created.id)
    const busaReq = detail!.material_requirements!.find(r => r.bahan_id === 2)
    expect(busaReq).toBeDefined()
    expect(busaReq!.total_kebutuhan).toBe(30)
  })

  it('11.3 posts finished goods and deducts raw materials atomically when completed', async () => {
    // Initial finished product stock
    const initialProduct = productService.getRawItems().find(p => p.id === 43)
    const initialProductQty = initialProduct?.qty || 0

    // Initial raw material stock (Bahan 2: Busa)
    const initialMat = materialService.getRawItems().find(m => m.id === 2)
    const initialMatQty = Number(initialMat?.qty || 0)

    // Create production order for 5 units of Product 43
    const newProd = await productionService.createProduction({
      kode: 'PD1126-0088',
      jenis_produksi: 0,
      tanggal: '2026-11-01',
      status_produksi: 1, // Proses
      items: [{ produk_id: 43, qty: 5 }]
    })

    // Before posting: stocks MUST NOT change!
    const intermediateProd = productService.getRawItems().find(p => p.id === 43)
    expect(intermediateProd?.qty).toBe(initialProductQty)
    const intermediateMat = materialService.getRawItems().find(m => m.id === 2)
    expect(Number(intermediateMat?.qty)).toBe(initialMatQty)

    // Now post production
    const postResult = await productionService.postProduction(newProd.id)
    expect(postResult.posted).toBe(true)
    expect(postResult.finishedGoodsAdded).toBe(5)

    // Finished product stock MUST increase by 5
    const finalProduct = productService.getRawItems().find(p => p.id === 43)
    expect(finalProduct?.qty).toBe(initialProductQty + 5)

    // Raw material (Busa) stock MUST decrease by 5 (1 * 5)
    const finalMat = materialService.getRawItems().find(m => m.id === 2)
    expect(Number(finalMat?.qty)).toBe(initialMatQty - 5)

    // Entry added to kartu_stok_produk
    const stockCards = productionService.getRawProductStockCards()
    const lastCard = stockCards[stockCards.length - 1]
    expect(lastCard.produk_id).toBe(43)
    expect(lastCard.masuk).toBe(5)
    expect(lastCard.keluar).toBe(0)
  })

  it('11.4 IDEMPOTENCY GUARD: prevents double posting of the same production order', async () => {
    const newProd = await productionService.createProduction({
      kode: 'PD1126-0077',
      jenis_produksi: 0,
      tanggal: '2026-11-01',
      status_produksi: 1,
      items: [{ produk_id: 43, qty: 4 }]
    })

    // First posting
    const res1 = await productionService.postProduction(newProd.id)
    expect(res1.posted).toBe(true)
    expect(res1.finishedGoodsAdded).toBe(4)

    const prodAfterFirst = productService.getRawItems().find(p => p.id === 43)?.qty

    // Second posting of the exact same production ID
    const res2 = await productionService.postProduction(newProd.id)
    expect(res2.posted).toBe(true)
    expect(res2.finishedGoodsAdded).toBe(0) // No new items added!

    // Stock should not change again
    const prodAfterSecond = productService.getRawItems().find(p => p.id === 43)?.qty
    expect(prodAfterSecond).toBe(prodAfterFirst)
  })

  it('11.5 REVERSAL: safely reverses finished goods and restores raw materials upon cancellation', async () => {
    const initialProductQty = productService.getRawItems().find(p => p.id === 43)?.qty || 0
    const initialMatQty = Number(materialService.getRawItems().find(m => m.id === 2)?.qty || 0)

    // Create & complete production of 6 units
    const prod = await productionService.createProduction({
      kode: 'PD1126-0066',
      jenis_produksi: 1,
      tanggal: '2026-11-01',
      status_produksi: 2, // Selesai
      items: [{ produk_id: 43, qty: 6 }]
    })

    expect(productService.getRawItems().find(p => p.id === 43)?.qty).toBe(initialProductQty + 6)
    expect(Number(materialService.getRawItems().find(m => m.id === 2)?.qty)).toBe(initialMatQty - 6)

    // Now cancel the production order (reversal)
    const cancelRes = await productionService.cancelProduction(prod.id)
    expect(cancelRes).toBe(true)

    // Finished goods stock must be reverted back to initial
    expect(productService.getRawItems().find(p => p.id === 43)?.qty).toBe(initialProductQty)

    // Raw materials stock must be restored back to initial
    expect(Number(materialService.getRawItems().find(m => m.id === 2)?.qty)).toBe(initialMatQty)

    // Double reversal attempt must be rejected
    await expect(productionService.cancelProduction(prod.id)).rejects.toThrow(
      'sudah dibatalkan sebelumnya'
    )
  })
})
