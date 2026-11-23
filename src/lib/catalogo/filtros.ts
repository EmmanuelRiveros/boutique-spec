import type { Prisma, Size } from "@/generated/prisma/client";
import { toColorKey } from "./color";
import { isSize } from "./sizes";

/** Filtros válidos del listado. Los precios van en pesos enteros, como en la URL. */
export type CatalogFilters = {
  categoria?: string;
  talla?: Size;
  /** Clave normalizada del color (ver toColorKey). */
  color?: string;
  minPesos?: number;
  maxPesos?: number;
};

export type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  const t = v?.trim();
  return t ? t : undefined;
}

function parsePesos(value: string | undefined): number | null | undefined {
  if (value === undefined) return undefined;
  return /^\d+$/.test(value) ? Number(value) : null;
}

/**
 * Lee los parámetros de la URL. Cada valor inválido se ignora y genera un aviso
 * en español; los filtros válidos restantes se conservan.
 */
export function parseCatalogFilters(
  params: SearchParams,
  categorySlugs: readonly string[],
): { filters: CatalogFilters; warnings: string[] } {
  const filters: CatalogFilters = {};
  const warnings: string[] = [];

  const categoria = first(params.categoria);
  if (categoria !== undefined) {
    if (categorySlugs.includes(categoria)) filters.categoria = categoria;
    else warnings.push(`La categoría "${categoria}" no existe; se muestran todas las categorías.`);
  }

  const talla = first(params.talla);
  if (talla !== undefined) {
    if (isSize(talla)) filters.talla = talla;
    else warnings.push(`La talla "${talla}" no es válida; se muestran todas las tallas.`);
  }

  const color = first(params.color);
  if (color !== undefined) filters.color = toColorKey(color);

  const minRaw = first(params.min);
  const maxRaw = first(params.max);
  const min = parsePesos(minRaw);
  const max = parsePesos(maxRaw);
  if (min === null) warnings.push(`El precio mínimo "${minRaw}" no es válido; usa un número entero de pesos.`);
  if (max === null) warnings.push(`El precio máximo "${maxRaw}" no es válido; usa un número entero de pesos.`);

  if (typeof min === "number" && typeof max === "number" && min > max) {
    warnings.push("El rango de precio no es válido: el mínimo es mayor que el máximo.");
  } else {
    if (typeof min === "number") filters.minPesos = min;
    if (typeof max === "number") filters.maxPesos = max;
  }

  return { filters, warnings };
}

/** Condición de Prisma para los filtros. Solo productos con al menos una variante. */
export function buildProductWhere(filters: CatalogFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {
    // Talla y color en UN solo `some`: deben cumplirse en la misma variante.
    variants: {
      some: {
        ...(filters.talla && { size: filters.talla }),
        ...(filters.color && { colorKey: filters.color }),
      },
    },
  };
  if (filters.categoria) where.category = { slug: filters.categoria };
  if (filters.minPesos !== undefined || filters.maxPesos !== undefined) {
    where.priceCents = {
      ...(filters.minPesos !== undefined && { gte: filters.minPesos * 100 }),
      ...(filters.maxPesos !== undefined && { lte: filters.maxPesos * 100 }),
    };
  }
  return where;
}

/** URL del listado con los filtros dados, para compartir o recargar. */
export function buildCatalogHref(filters: CatalogFilters): string {
  const params = new URLSearchParams();
  if (filters.categoria) params.set("categoria", filters.categoria);
  if (filters.talla) params.set("talla", filters.talla);
  if (filters.color) params.set("color", filters.color);
  if (filters.minPesos !== undefined) params.set("min", String(filters.minPesos));
  if (filters.maxPesos !== undefined) params.set("max", String(filters.maxPesos));
  const qs = params.toString();
  return qs ? `/catalogo?${qs}` : "/catalogo";
}
