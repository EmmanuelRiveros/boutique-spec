import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { getProductBySlug } from "./consultas";

/** Etiqueta de caché del catálogo; panel-admin la invalidará con revalidateTag. */
export const CATALOG_CACHE_TAG = "catalogo";

/**
 * Detalle de producto con caché. Así la página puede llamar a notFound()
 * antes de empezar el streaming y responder con un 404 real.
 */
export async function getCachedProduct(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_CACHE_TAG);
  return getProductBySlug(db, slug);
}

/** Slugs de productos visibles, para generateStaticParams. */
export async function getCachedProductSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_CACHE_TAG);
  const rows = await db.product.findMany({
    where: { variants: { some: {} } },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}
