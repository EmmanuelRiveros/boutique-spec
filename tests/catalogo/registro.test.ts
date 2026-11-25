import { beforeEach, describe, expect, it } from "vitest";
import { db, resetDb } from "../helpers/db";
import {
  CatalogError,
  createCategory,
  createProduct,
  createVariant,
} from "@/lib/catalogo";

// Spec: catalogo-productos
// Requisitos: "Producto pertenece a una categoría", "Variante identificada por
// talla, color y SKU", "Tallas de una lista fija y ordenada" (registro) y
// "Precio del producto en pesos mexicanos" (precio inválido).

async function baseProduct() {
  const blusas = await createCategory(db, { name: "Blusas", slug: "blusas" });
  const product = await createProduct(db, {
    name: "Blusa de lino",
    slug: "blusa-lino",
    description: "Blusa fresca de lino",
    priceCents: 45000,
    categoryId: blusas.id,
  });
  return { blusas, product };
}

beforeEach(resetDb);

describe("Requirement: Producto pertenece a una categoría", () => {
  it("Scenario: Producto asociado a su categoría", async () => {
    const { blusas, product } = await baseProduct();
    const pantalones = await createCategory(db, { name: "Pantalones", slug: "pantalones" });

    expect(product.categoryId).toBe(blusas.id);
    const enBlusas = await db.product.findMany({ where: { category: { slug: "blusas" } } });
    const enPantalones = await db.product.findMany({ where: { categoryId: pantalones.id } });
    expect(enBlusas.map((p) => p.slug)).toEqual(["blusa-lino"]);
    expect(enPantalones).toEqual([]);
  });

  it("Scenario: Slug de categoría repetido", async () => {
    await createCategory(db, { name: "Blusas", slug: "blusas" });
    await expect(createCategory(db, { name: "Otra", slug: "blusas" })).rejects.toThrow(CatalogError);

    const categorias = await db.category.findMany();
    expect(categorias).toHaveLength(1);
    expect(categorias[0].name).toBe("Blusas");
  });
});

describe("Requirement: Variante identificada por talla, color, SKU y existencias", () => {
  it("Scenario: Variante válida", async () => {
    const { product } = await baseProduct();
    const v = await createVariant(db, {
      productId: product.id,
      size: "M",
      color: "Negro",
      sku: "BLU-LIN-M-NEG",
    });
    expect(v).toMatchObject({
      productId: product.id,
      size: "M",
      color: "Negro",
      sku: "BLU-LIN-M-NEG",
      stock: 0,
    });
  });

  it("Scenario: Variante con existencias iniciales", async () => {
    const { product } = await baseProduct();
    const v = await createVariant(db, {
      productId: product.id,
      size: "M",
      color: "Negro",
      sku: "SKU-STOCK",
      stock: 7,
    });
    expect(v.stock).toBe(7);
    const guardada = await db.variant.findUniqueOrThrow({ where: { sku: "SKU-STOCK" } });
    expect(guardada.stock).toBe(7);
  });

  it("Scenario: Stock inicial inválido", async () => {
    const { product } = await baseProduct();
    for (const [i, stock] of [-1, 2.5, Number.NaN].entries()) {
      await expect(
        createVariant(db, { productId: product.id, size: "M", color: "Negro", sku: `SKU-${i}`, stock }),
      ).rejects.toThrow(CatalogError);
    }
    expect(await db.variant.count()).toBe(0);
  });

  it("Scenario: SKU duplicado", async () => {
    const { product } = await baseProduct();
    await createVariant(db, { productId: product.id, size: "M", color: "Negro", sku: "SKU-1" });
    await expect(
      createVariant(db, { productId: product.id, size: "G", color: "Blanco", sku: "SKU-1" }),
    ).rejects.toThrow(CatalogError);
    expect(await db.variant.count()).toBe(1);
  });

  it("Scenario: Combinación talla y color repetida", async () => {
    const { product } = await baseProduct();
    await createVariant(db, { productId: product.id, size: "M", color: "Negro", sku: "SKU-1" });
    await expect(
      createVariant(db, { productId: product.id, size: "M", color: "Negro", sku: "SKU-2" }),
    ).rejects.toThrow(CatalogError);
    // Misma combinación con distinta capitalización también se rechaza.
    await expect(
      createVariant(db, { productId: product.id, size: "M", color: " negro ", sku: "SKU-3" }),
    ).rejects.toThrow(CatalogError);
    expect(await db.variant.count()).toBe(1);
  });
});

describe("Requirement: Tallas de una lista fija y ordenada", () => {
  it("Scenario: Talla fuera de la lista", async () => {
    const { product } = await baseProduct();
    await expect(
      createVariant(db, { productId: product.id, size: "XXL", color: "Negro", sku: "SKU-1" }),
    ).rejects.toThrow(CatalogError);
    expect(await db.variant.count()).toBe(0);
  });
});

describe("Requirement: Precio del producto en pesos mexicanos", () => {
  it("Scenario: Precio inválido", async () => {
    const cat = await createCategory(db, { name: "Blusas", slug: "blusas" });
    for (const priceCents of [0, -100, 450.5]) {
      await expect(
        createProduct(db, {
          name: "X",
          slug: `x-${String(priceCents).replace(/\W/g, "")}`,
          description: "",
          priceCents,
          categoryId: cat.id,
        }),
      ).rejects.toThrow(CatalogError);
    }
    expect(await db.product.count()).toBe(0);
  });
});
