import type { Size } from "@/generated/prisma/client";
import { buildProductWhere, type CatalogFilters } from "./filtros";
import { SIZES, sortSizes } from "./sizes";
import type { CatalogDb } from "./types";

export type CatalogListItem = {
  id: number;
  slug: string;
  name: string;
  priceCents: number;
  category: { name: string; slug: string };
  imageUrl: string | null;
};

/** Productos visibles que cumplen los filtros, del más reciente al más antiguo. */
export async function listCatalogProducts(
  db: CatalogDb,
  filters: CatalogFilters,
): Promise<CatalogListItem[]> {
  const rows = await db.product.findMany({
    where: buildProductWhere(filters),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      priceCents: true,
      category: { select: { name: true, slug: true } },
      images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
    },
  });
  return rows.map(({ images, ...p }) => ({ ...p, imageUrl: images[0]?.url ?? null }));
}

export type FilterOptions = {
  categories: { slug: string; name: string }[];
  sizes: Size[];
  colors: { key: string; name: string }[];
};

/** Opciones para el formulario de filtros. */
export async function getFilterOptions(db: CatalogDb): Promise<FilterOptions> {
  const [categories, variants] = await Promise.all([
    db.category.findMany({
      where: { products: { some: { variants: { some: {} } } } },
      orderBy: { name: "asc" },
      select: { slug: true, name: true },
    }),
    db.variant.findMany({ select: { colorKey: true, color: true }, orderBy: { id: "asc" } }),
  ]);

  const colors = new Map<string, string>();
  for (const v of variants) if (!colors.has(v.colorKey)) colors.set(v.colorKey, v.color);

  return {
    categories,
    sizes: [...SIZES],
    colors: [...colors]
      .map(([key, name]) => ({ key, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "es")),
  };
}

/** Slugs de todas las categorías, para validar el filtro de categoría. */
export async function getCategorySlugs(db: CatalogDb): Promise<string[]> {
  const rows = await db.category.findMany({ select: { slug: true } });
  return rows.map((r) => r.slug);
}

export type ProductDetail = {
  id: number;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  category: { name: string; slug: string };
  images: string[];
  sizes: Size[];
  colors: string[];
};

/** true si el slug es de un producto visible (existe y tiene variantes). Usada por el Proxy. */
export async function isVisibleProductSlug(db: CatalogDb, slug: string): Promise<boolean> {
  const p = await db.product.findFirst({
    where: { slug, variants: { some: {} } },
    select: { id: true },
  });
  return p !== null;
}

/** Detalle de un producto visible; null si no existe o no tiene variantes. */
export async function getProductBySlug(db: CatalogDb, slug: string): Promise<ProductDetail | null> {
  const p = await db.product.findUnique({
    where: { slug },
    include: {
      category: { select: { name: true, slug: true } },
      images: { orderBy: { position: "asc" }, select: { url: true } },
      variants: { orderBy: { id: "asc" }, select: { size: true, color: true, colorKey: true } },
    },
  });
  if (!p || p.variants.length === 0) return null;

  const colors = new Map<string, string>();
  for (const v of p.variants) if (!colors.has(v.colorKey)) colors.set(v.colorKey, v.color);

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    priceCents: p.priceCents,
    category: p.category,
    images: p.images.map((i) => i.url),
    sizes: sortSizes(p.variants.map((v) => v.size)),
    colors: [...colors.values()].sort((a, b) => a.localeCompare(b, "es")),
  };
}
