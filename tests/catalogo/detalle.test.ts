import { beforeEach, describe, expect, it } from "vitest";
import { db, resetDb } from "../helpers/db";
import {
  createCategory,
  createProduct,
  createVariant,
  getProductBySlug,
  isVisibleProductSlug,
} from "@/lib/catalogo";

// Spec: catalogo-productos — Requirement: Detalle de producto

let categoryId: number;

beforeEach(async () => {
  await resetDb();
  categoryId = (await createCategory(db, { name: "Blusas", slug: "blusas" })).id;
});

describe("Requirement: Detalle de producto", () => {
  it("Scenario: Ver detalle", async () => {
    const p = await createProduct(db, {
      name: "Blusa de lino",
      slug: "blusa-lino",
      description: "Blusa fresca",
      priceCents: 45000,
      categoryId,
      images: ["https://example.test/1.jpg", "https://example.test/2.jpg"],
    });
    for (const [size, color, sku] of [
      ["XG", "Negro", "A"],
      ["CH", "Blanco", "B"],
      ["M", "Negro", "C"],
    ]) {
      await createVariant(db, { productId: p.id, size, color, sku });
    }

    const detalle = await getProductBySlug(db, "blusa-lino");
    expect(detalle).toMatchObject({
      name: "Blusa de lino",
      description: "Blusa fresca",
      priceCents: 45000,
      category: { name: "Blusas", slug: "blusas" },
      images: ["https://example.test/1.jpg", "https://example.test/2.jpg"],
      sizes: ["CH", "M", "XG"],
      colors: ["Blanco", "Negro"],
    });
  });

  it("Scenario: Producto inexistente", async () => {
    expect(await getProductBySlug(db, "no-existe")).toBeNull();
  });

  it("Scenario: Producto sin variantes", async () => {
    await createProduct(db, {
      name: "Sin variantes",
      slug: "sin-variantes",
      description: "",
      priceCents: 10000,
      categoryId,
    });
    expect(await getProductBySlug(db, "sin-variantes")).toBeNull();
  });
});

// Usada por src/proxy.ts para responder 404 real (design.md §7).
describe("isVisibleProductSlug (Proxy del detalle)", () => {
  it("true solo para productos existentes con variantes", async () => {
    const con = await createProduct(db, { name: "Con", slug: "con", description: "", priceCents: 100, categoryId });
    await createVariant(db, { productId: con.id, size: "M", color: "Negro", sku: "CON-M" });
    await createProduct(db, { name: "Sin", slug: "sin", description: "", priceCents: 100, categoryId });

    expect(await isVisibleProductSlug(db, "con")).toBe(true);
    expect(await isVisibleProductSlug(db, "sin")).toBe(false);
    expect(await isVisibleProductSlug(db, "no-existe")).toBe(false);
  });
});
