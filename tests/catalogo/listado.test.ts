import { beforeEach, describe, expect, it } from "vitest";
import { db, resetDb } from "../helpers/db";
import { seedTestCatalog } from "../helpers/catalogo";
import {
  buildCatalogHref,
  getFilterOptions,
  listCatalogProducts,
  parseCatalogFilters,
} from "@/lib/catalogo";

// Spec: catalogo-productos — listado, opciones de filtro, filtros y casos de error.

const CATEGORIAS = ["blusas", "pantalones", "vacia"];

/** Lee los parámetros como lo haría la página y devuelve slugs y avisos. */
async function catalogo(params: Record<string, string>) {
  const { filters, warnings } = parseCatalogFilters(params, CATEGORIAS);
  const products = await listCatalogProducts(db, filters);
  return { slugs: products.map((p) => p.slug), warnings, products, filters };
}

beforeEach(async () => {
  await resetDb();
  await seedTestCatalog();
});

describe("Requirement: Listado del catálogo", () => {
  it("Scenario: Ver el catálogo completo", async () => {
    const { slugs, warnings, products } = await catalogo({});
    expect(slugs).toEqual(["pantalon-b", "pantalon-a", "blusa-c", "blusa-b", "blusa-a"]);
    expect(warnings).toEqual([]);
    expect(products[0]).toMatchObject({
      name: "pantalon-b",
      priceCents: 80000,
      category: { name: "Pantalones" },
      imageUrl: "https://example.test/pantalon-b.jpg",
    });
  });

  it("Scenario: Producto sin variantes", async () => {
    const { slugs } = await catalogo({});
    expect(slugs).not.toContain("pantalon-sin-variantes");
  });
});

describe("Requirement: Opciones de filtro disponibles", () => {
  it("Scenario: Opciones mostradas", async () => {
    const options = await getFilterOptions(db);
    // "vacia" no tiene productos visibles.
    expect(options.categories.map((c) => c.slug)).toEqual(["blusas", "pantalones"]);
    expect(options.sizes).toEqual(["CH", "M", "G", "XG"]);
    expect(options.colors.map((c) => c.name)).toEqual(["Azul", "Blanco", "Negro", "Rojo"]);
  });
});

describe("Requirement: Filtro por categoría", () => {
  it("Scenario: Filtrar por categoría", async () => {
    const { slugs } = await catalogo({ categoria: "blusas" });
    expect(slugs).toEqual(["blusa-c", "blusa-b", "blusa-a"]);
  });
});

describe("Requirement: Filtro por talla y color en la misma variante", () => {
  it("Scenario: Filtrar solo por talla", async () => {
    const { slugs } = await catalogo({ talla: "M" });
    expect(slugs).toEqual(["pantalon-b", "blusa-b", "blusa-a"]);
  });

  it("Scenario: Filtrar por talla y color existentes en la misma variante", async () => {
    const { slugs } = await catalogo({ talla: "M", color: "Negro" });
    expect(slugs).toContain("blusa-a");
  });

  it("Scenario: Talla y color solo en variantes distintas", async () => {
    const { slugs } = await catalogo({ talla: "M", color: "Negro" });
    expect(slugs).not.toContain("blusa-b");
    expect(slugs).toEqual(["pantalon-b", "blusa-a"]);
  });

  it("Scenario: Color con distinta capitalización", async () => {
    const { slugs } = await catalogo({ color: "negro" });
    expect(slugs).toEqual(["pantalon-b", "blusa-b", "blusa-a"]);
  });
});

describe("Requirement: Filtro por rango de precio", () => {
  it("Scenario: Filtrar por rango de precio", async () => {
    // Extremos incluidos: blusa-a = $200 y pantalon-a = $600.
    const { slugs } = await catalogo({ min: "200", max: "600" });
    expect(slugs).toEqual(["pantalon-a", "blusa-c", "blusa-b", "blusa-a"]);
  });

  it("Scenario: Solo precio mínimo", async () => {
    const { slugs } = await catalogo({ min: "500" });
    expect(slugs).toEqual(["pantalon-b", "pantalon-a", "blusa-c"]);
  });
});

describe("Requirement: Combinación de filtros", () => {
  it("Scenario: Categoría, talla y precio juntos", async () => {
    const { slugs } = await catalogo({ categoria: "pantalones", talla: "G", max: "600" });
    expect(slugs).toEqual(["pantalon-a"]);
  });

  it("Scenario: Recargar con filtros", async () => {
    const original = { categoria: "pantalones", talla: "G", color: "negro", min: "100", max: "900" };
    const primera = await catalogo(original);

    const href = buildCatalogHref(primera.filters);
    expect(href.startsWith("/catalogo?")).toBe(true);
    const recargada = await catalogo(Object.fromEntries(new URL(href, "http://x").searchParams));

    expect(recargada.filters).toEqual(primera.filters);
    expect(recargada.slugs).toEqual(primera.slugs);
    expect(buildCatalogHref({})).toBe("/catalogo");
  });
});

describe("Requirement: Valores de filtro inválidos", () => {
  it("Scenario: Precio no numérico o negativo", async () => {
    for (const min of ["abc", "-50"]) {
      const { slugs, warnings, filters } = await catalogo({ min, categoria: "blusas" });
      expect(filters.minPesos).toBeUndefined();
      expect(slugs).toEqual(["blusa-c", "blusa-b", "blusa-a"]);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toMatch(/precio mínimo/i);
    }
  });

  it("Scenario: Mínimo mayor que máximo", async () => {
    const { slugs, warnings, filters } = await catalogo({ min: "800", max: "300" });
    expect(filters.minPesos).toBeUndefined();
    expect(filters.maxPesos).toBeUndefined();
    expect(slugs).toHaveLength(5);
    expect(warnings).toEqual([expect.stringMatching(/rango de precio/i)]);
  });

  it("Scenario: Categoría inexistente", async () => {
    const { slugs, warnings, filters } = await catalogo({ categoria: "zapatos", talla: "XG" });
    expect(filters.categoria).toBeUndefined();
    expect(slugs).toEqual(["blusa-c"]);
    expect(warnings).toEqual([expect.stringMatching(/categoría.*no (existe|encontrada)/i)]);
  });

  it("Scenario: Talla fuera de la lista", async () => {
    const { slugs, warnings, filters } = await catalogo({ talla: "XXL" });
    expect(filters.talla).toBeUndefined();
    expect(slugs).toHaveLength(5);
    expect(warnings).toEqual([expect.stringMatching(/talla/i)]);
  });
});

describe("Requirement: Listado sin resultados", () => {
  it("Scenario: Filtros sin coincidencias", async () => {
    const { slugs, warnings } = await catalogo({ categoria: "blusas", min: "700" });
    expect(slugs).toEqual([]);
    expect(warnings).toEqual([]);
  });
});
