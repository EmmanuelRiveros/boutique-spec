import { db } from "./db";
import { createCategory, createProduct, createVariant } from "@/lib/catalogo";

type Item = {
  slug: string;
  category: "blusas" | "pantalones";
  priceCents: number;
  variants: [size: string, color: string][];
};

/**
 * Catálogo pequeño y conocido para las pruebas de listado y filtros.
 * Se crean en este orden, así que el más reciente es el último.
 */
export const ITEMS: Item[] = [
  { slug: "blusa-a", category: "blusas", priceCents: 20000, variants: [["M", "Negro"], ["CH", "Blanco"]] },
  // M y Negro solo en variantes distintas:
  { slug: "blusa-b", category: "blusas", priceCents: 35000, variants: [["M", "Blanco"], ["G", "Negro"]] },
  { slug: "blusa-c", category: "blusas", priceCents: 50000, variants: [["XG", "Rojo"]] },
  { slug: "pantalon-a", category: "pantalones", priceCents: 60000, variants: [["G", "Azul"]] },
  { slug: "pantalon-b", category: "pantalones", priceCents: 80000, variants: [["G", "Negro"], ["M", "Negro"]] },
  { slug: "pantalon-sin-variantes", category: "pantalones", priceCents: 30000, variants: [] },
];

export async function seedTestCatalog() {
  const blusas = await createCategory(db, { name: "Blusas", slug: "blusas" });
  const pantalones = await createCategory(db, { name: "Pantalones", slug: "pantalones" });
  await createCategory(db, { name: "Vacía", slug: "vacia" });
  const ids = { blusas: blusas.id, pantalones: pantalones.id };

  for (const it of ITEMS) {
    const p = await createProduct(db, {
      name: it.slug,
      slug: it.slug,
      description: `Descripción de ${it.slug}`,
      priceCents: it.priceCents,
      categoryId: ids[it.category],
      images: [`https://example.test/${it.slug}.jpg`],
    });
    for (const [size, color] of it.variants) {
      await createVariant(db, { productId: p.id, size, color, sku: `${it.slug}-${size}-${color}` });
    }
  }
}
