import { beforeEach, describe, expect, it } from "vitest";
import { db, resetDb } from "../helpers/db";
import { SEED_PRODUCTS, seedCatalog, skuFor } from "@/lib/catalogo/seed";

// Spec: catalogo-productos — Requirement: Datos de ejemplo del catálogo

async function counts() {
  return {
    categorias: await db.category.count(),
    productos: await db.product.count(),
    variantes: await db.variant.count(),
    imagenes: await db.productImage.count(),
  };
}

/** Stock esperado por SKU, tomado de las definiciones del seed. */
function expectedStock(): Map<string, number> {
  const m = new Map<string, number>();
  for (const p of SEED_PRODUCTS) for (const [size, color, stock] of p.variants) m.set(skuFor(p.sku, size, color), stock);
  return m;
}

async function stockBySku(): Promise<Map<string, number>> {
  const rows = await db.variant.findMany({ select: { sku: true, stock: true } });
  return new Map(rows.map((r) => [r.sku, r.stock]));
}

beforeEach(resetDb);

describe("Requirement: Datos de ejemplo del catálogo", () => {
  it("Scenario: Carga en base de datos vacía", async () => {
    await seedCatalog(db);

    const c = await counts();
    expect(c.categorias).toBeGreaterThanOrEqual(3);
    expect(c.productos).toBeGreaterThanOrEqual(8);
    const sinVariantes = await db.product.count({ where: { variants: { none: {} } } });
    expect(sinVariantes).toBe(0);
    const precios = await db.product.findMany({ select: { priceCents: true } });
    expect(new Set(precios.map((p) => p.priceCents)).size).toBeGreaterThan(1);
    const sinImagen = await db.product.count({ where: { images: { none: {} } } });
    expect(sinImagen).toBe(0);
    // Cada variante de ejemplo tiene la cantidad de stock definida por el seed.
    expect(await stockBySku()).toEqual(expectedStock());
    expect([...expectedStock().values()].some((s) => s > 0)).toBe(true);
  });

  it("Scenario: Carga repetida", async () => {
    await seedCatalog(db);
    const primera = await counts();
    await seedCatalog(db);
    expect(await counts()).toEqual(primera);
    // El stock no se suma ni cambia entre cargas.
    expect(await stockBySku()).toEqual(expectedStock());
  });

  it("Scenario: Ejecutar el seed repetidamente restablece el stock de ejemplo (también en variantes ya existentes)", async () => {
    await seedCatalog(db);
    // Simula una base ya sembrada antes de la migración de inventario (stock 0) y un ajuste manual.
    await db.variant.updateMany({ data: { stock: 0 } });
    await seedCatalog(db);
    expect(await stockBySku()).toEqual(expectedStock());
  });
});
