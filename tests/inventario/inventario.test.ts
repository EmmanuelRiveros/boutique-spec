import { beforeEach, describe, expect, it } from "vitest";
import { db, resetDb } from "../helpers/db";
import { createCategory, createProduct, createVariant } from "@/lib/catalogo";
import {
  InventoryError,
  checkVariantAvailability,
  decreaseVariantStock,
  getVariantStock,
  increaseVariantStock,
  setVariantStock,
} from "@/lib/inventario";

// Spec: inventario — requisitos de existencias, establecer, aumentar, disminuir y disponibilidad.

let seq = 0;

/** Crea una variante con el stock dado y devuelve su id. */
async function variantWithStock(stock?: number): Promise<number> {
  seq += 1;
  const cat = await createCategory(db, { name: `Cat ${seq}`, slug: `cat-${seq}` });
  const product = await createProduct(db, {
    name: `Producto ${seq}`,
    slug: `producto-${seq}`,
    description: "",
    priceCents: 10000,
    categoryId: cat.id,
  });
  const v = await createVariant(db, {
    productId: product.id,
    size: "M",
    color: "Negro",
    sku: `SKU-${seq}`,
    ...(stock !== undefined && { stock }),
  });
  return v.id;
}

const stockOf = async (id: number) => (await db.variant.findUniqueOrThrow({ where: { id } })).stock;

async function codeOf(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise;
  } catch (e) {
    if (e instanceof InventoryError) return e.code;
    throw e;
  }
  return undefined;
}

const INVALIDAS = [-1, 2.5, Number.NaN, Number.POSITIVE_INFINITY, "5" as unknown as number];

beforeEach(resetDb);

describe("Requirement: Existencias por variante", () => {
  it("Scenario: Variante nueva sin stock asignado", async () => {
    const id = await variantWithStock();
    expect(await stockOf(id)).toBe(0);
  });

  it("Scenario: Consultar existencias de una variante", async () => {
    const id = await variantWithStock(9);
    expect(await getVariantStock(db, id)).toBe(9);
  });

  it("Scenario: Consultar variante inexistente", async () => {
    const antes = await db.variant.count();
    expect(await codeOf(getVariantStock(db, 99999))).toBe("VARIANTE_INEXISTENTE");
    await expect(getVariantStock(db, 99999)).rejects.toThrow(InventoryError);
    expect(await db.variant.count()).toBe(antes);
  });
});

describe("Requirement: Establecer existencias", () => {
  it("Scenario: Establecer existencias válidas", async () => {
    const id = await variantWithStock(3);
    await setVariantStock(db, id, 12);
    expect(await stockOf(id)).toBe(12);
  });

  it("Scenario: Establecer stock en cero", async () => {
    const id = await variantWithStock(5);
    await setVariantStock(db, id, 0);
    expect(await stockOf(id)).toBe(0);
  });

  it("Scenario: Rechazar cantidad inválida al establecer stock", async () => {
    const id = await variantWithStock(5);
    for (const q of INVALIDAS) {
      expect(await codeOf(setVariantStock(db, id, q))).toBe("CANTIDAD_INVALIDA");
    }
    expect(await stockOf(id)).toBe(5);
  });

  it("establecer en una variante inexistente falla sin crear registros", async () => {
    expect(await codeOf(setVariantStock(db, 99999, 3))).toBe("VARIANTE_INEXISTENTE");
    expect(await db.variant.count()).toBe(0);
  });
});

describe("Requirement: Aumentar existencias", () => {
  it("Scenario: Aumento válido de existencias", async () => {
    const id = await variantWithStock(5);
    await increaseVariantStock(db, id, 3);
    expect(await stockOf(id)).toBe(8);
  });

  it("Scenario: Rechazar aumento inválido", async () => {
    const id = await variantWithStock(5);
    for (const q of [0, ...INVALIDAS]) {
      expect(await codeOf(increaseVariantStock(db, id, q))).toBe("CANTIDAD_INVALIDA");
    }
    expect(await stockOf(id)).toBe(5);
  });

  it("aumentar una variante inexistente falla", async () => {
    expect(await codeOf(increaseVariantStock(db, 99999, 1))).toBe("VARIANTE_INEXISTENTE");
  });
});

describe("Requirement: Disminuir existencias sin permitir valores negativos", () => {
  it("Scenario: Disminución válida", async () => {
    const id = await variantWithStock(8);
    await decreaseVariantStock(db, id, 3);
    expect(await stockOf(id)).toBe(5);
  });

  it("Scenario: Descuento igual al stock disponible", async () => {
    const id = await variantWithStock(4);
    await decreaseVariantStock(db, id, 4);
    expect(await stockOf(id)).toBe(0);
  });

  it("Scenario: Stock insuficiente para disminuir", async () => {
    const id = await variantWithStock(2);
    expect(await codeOf(decreaseVariantStock(db, id, 3))).toBe("STOCK_INSUFICIENTE");
    expect(await stockOf(id)).toBe(2);
  });

  it("Scenario: Rechazar disminución inválida", async () => {
    const id = await variantWithStock(5);
    for (const q of [0, ...INVALIDAS]) {
      expect(await codeOf(decreaseVariantStock(db, id, q))).toBe("CANTIDAD_INVALIDA");
    }
    expect(await stockOf(id)).toBe(5);
  });

  it("disminuir una variante inexistente distingue el error del stock insuficiente", async () => {
    expect(await codeOf(decreaseVariantStock(db, 99999, 1))).toBe("VARIANTE_INEXISTENTE");
  });

  it("descuentos simultáneos nunca dejan el stock negativo", async () => {
    const id = await variantWithStock(5);
    const resultados = await Promise.allSettled(
      Array.from({ length: 8 }, () => decreaseVariantStock(db, id, 1)),
    );
    const exitos = resultados.filter((r) => r.status === "fulfilled").length;
    expect(exitos).toBe(5);
    expect(await stockOf(id)).toBe(0);
  });
});

describe("Requirement: Validar disponibilidad solicitada", () => {
  it("Scenario: Cantidad solicitada disponible", async () => {
    const id = await variantWithStock(6);
    expect(await checkVariantAvailability(db, id, 4)).toMatchObject({ available: true, stock: 6 });
    expect(await stockOf(id)).toBe(6);
  });

  it("Scenario: Cantidad solicitada igual al stock", async () => {
    const id = await variantWithStock(6);
    expect(await checkVariantAvailability(db, id, 6)).toMatchObject({ available: true, stock: 6 });
    expect(await stockOf(id)).toBe(6);
  });

  it("Scenario: Cantidad solicitada superior al stock", async () => {
    const id = await variantWithStock(3);
    expect(await checkVariantAvailability(db, id, 4)).toMatchObject({ available: false, stock: 3 });
    expect(await stockOf(id)).toBe(3);
  });

  it("Scenario: Variante agotada", async () => {
    const id = await variantWithStock(0);
    expect(await checkVariantAvailability(db, id, 1)).toMatchObject({ available: false, stock: 0 });
    expect(await stockOf(id)).toBe(0);
  });

  it("Scenario: Cantidad solicitada inválida", async () => {
    const id = await variantWithStock(5);
    for (const q of [0, ...INVALIDAS]) {
      expect(await codeOf(checkVariantAvailability(db, id, q))).toBe("CANTIDAD_INVALIDA");
    }
    expect(await stockOf(id)).toBe(5);
  });

  it("validar una variante inexistente falla", async () => {
    expect(await codeOf(checkVariantAvailability(db, 99999, 1))).toBe("VARIANTE_INEXISTENTE");
  });
});
