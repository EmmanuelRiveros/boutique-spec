import { beforeEach, describe, expect, it } from "vitest";
import { db, resetDb } from "../helpers/db";
import { seedCatalog } from "@/lib/catalogo/seed";

// Spec: catalogo-productos — Requirement: Datos de ejemplo del catálogo

async function counts() {
  return {
    categorias: await db.category.count(),
    productos: await db.product.count(),
    variantes: await db.variant.count(),
    imagenes: await db.productImage.count(),
  };
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
  });

  it("Scenario: Carga repetida", async () => {
    await seedCatalog(db);
    const primera = await counts();
    await seedCatalog(db);
    expect(await counts()).toEqual(primera);
  });
});
