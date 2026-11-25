import { createCategory, createProduct, createVariant } from "./registro";
import { CatalogError } from "./errors";
import { isValidPriceCents } from "./price";
import type { CatalogDb } from "./types";

type SeedProduct = {
  slug: string;
  name: string;
  description: string;
  category: string;
  priceCents: number;
  /** Prefijo del SKU; el SKU final es PREFIJO-TALLA-COLOR. */
  sku: string;
  variants: [size: string, color: string, stock: number][];
};

export const SEED_CATEGORIES = [
  { slug: "blusas", name: "Blusas" },
  { slug: "pantalones", name: "Pantalones" },
  { slug: "vestidos", name: "Vestidos" },
  { slug: "accesorios", name: "Accesorios" },
];

export const SEED_PRODUCTS: SeedProduct[] = [
  {
    slug: "blusa-lino",
    name: "Blusa de lino",
    description: "Blusa ligera de lino con botones al frente, ideal para clima cálido.",
    category: "blusas",
    priceCents: 45000,
    sku: "BLU-LIN",
    variants: [["CH", "Blanco", 10], ["M", "Blanco", 8], ["M", "Negro", 6], ["G", "Negro", 0]],
  },
  {
    slug: "blusa-seda-estampada",
    name: "Blusa de seda estampada",
    description: "Blusa de seda con estampado floral y manga tres cuartos.",
    category: "blusas",
    priceCents: 69900,
    sku: "BLU-SED",
    variants: [["CH", "Rosa", 5], ["M", "Rosa", 4], ["G", "Azul", 3]],
  },
  {
    slug: "camisa-mezclilla",
    name: "Camisa de mezclilla",
    description: "Camisa de mezclilla suave con bolsas al pecho.",
    category: "blusas",
    priceCents: 52000,
    sku: "CAM-MEZ",
    variants: [["M", "Azul", 7], ["G", "Azul", 6], ["XG", "Azul", 2]],
  },
  {
    slug: "pantalon-palazzo",
    name: "Pantalón palazzo",
    description: "Pantalón de pierna amplia y tiro alto con caída fluida.",
    category: "pantalones",
    priceCents: 58000,
    sku: "PAN-PAL",
    variants: [["CH", "Negro", 4], ["M", "Negro", 6], ["G", "Beige", 3], ["XG", "Beige", 2]],
  },
  {
    slug: "jeans-recto",
    name: "Jeans de corte recto",
    description: "Jeans clásicos de corte recto en mezclilla rígida.",
    category: "pantalones",
    priceCents: 64900,
    sku: "PAN-JEA",
    variants: [["CH", "Azul", 9], ["M", "Azul", 12], ["G", "Azul", 8], ["G", "Negro", 5]],
  },
  {
    slug: "vestido-midi-lino",
    name: "Vestido midi de lino",
    description: "Vestido midi de lino con cinturón y escote cuadrado.",
    category: "vestidos",
    priceCents: 89000,
    sku: "VES-MID",
    variants: [["CH", "Verde", 3], ["M", "Verde", 5], ["M", "Blanco", 1]],
  },
  {
    slug: "vestido-camisero",
    name: "Vestido camisero",
    description: "Vestido camisero a rayas con botones y bolsas laterales.",
    category: "vestidos",
    priceCents: 74500,
    sku: "VES-CAM",
    variants: [["M", "Azul", 6], ["G", "Azul", 4], ["XG", "Negro", 2]],
  },
  {
    slug: "bolsa-tejida",
    name: "Bolsa tejida",
    description: "Bolsa de mano tejida en palma con asas de piel.",
    category: "accesorios",
    priceCents: 39900,
    sku: "ACC-BOL",
    variants: [["M", "Beige", 10], ["M", "Negro", 0]],
  },
  {
    slug: "mascada-seda",
    name: "Mascada de seda",
    description: "Mascada cuadrada de seda con estampado geométrico.",
    category: "accesorios",
    priceCents: 25000,
    sku: "ACC-MAS",
    variants: [["CH", "Rojo", 15], ["CH", "Azul", 12]],
  },
];

function imagesFor(slug: string): string[] {
  return [1, 2].map((n) => `https://picsum.photos/seed/${slug}-${n}/600/800`);
}

export function skuFor(prefix: string, size: string, color: string): string {
  return `${prefix}-${size}-${color.slice(0, 3).toUpperCase()}`;
}

/**
 * Carga los datos de ejemplo del catálogo. Es idempotente: busca por slug o SKU
 * y solo crea lo que falta; los productos existentes se actualizan.
 * Las existencias de cada variante se fijan a la cantidad de ejemplo (datos de demostración,
 * no inventario real).
 */
export async function seedCatalog(db: CatalogDb) {
  const categoryIds = new Map<string, number>();
  for (const c of SEED_CATEGORIES) {
    const existing = await db.category.findUnique({ where: { slug: c.slug } });
    const category = existing
      ? await db.category.update({ where: { id: existing.id }, data: { name: c.name } })
      : await createCategory(db, c);
    categoryIds.set(c.slug, category.id);
  }

  for (const p of SEED_PRODUCTS) {
    const categoryId = categoryIds.get(p.category)!;
    const images = imagesFor(p.slug);
    const existing = await db.product.findUnique({ where: { slug: p.slug } });
    let productId: number;
    if (existing) {
      if (!isValidPriceCents(p.priceCents)) throw new CatalogError(`Precio inválido en ${p.slug}`);
      await db.productImage.deleteMany({ where: { productId: existing.id } });
      await db.product.update({
        where: { id: existing.id },
        data: {
          name: p.name,
          description: p.description,
          priceCents: p.priceCents,
          categoryId,
          images: { create: images.map((url, position) => ({ url, position })) },
        },
      });
      productId = existing.id;
    } else {
      const created = await createProduct(db, {
        name: p.name,
        slug: p.slug,
        description: p.description,
        priceCents: p.priceCents,
        categoryId,
        images,
      });
      productId = created.id;
    }

    for (const [size, color, stock] of p.variants) {
      const sku = skuFor(p.sku, size, color);
      const existingVariant = await db.variant.findUnique({ where: { sku } });
      if (!existingVariant) await createVariant(db, { productId, size, color, sku, stock });
      // Las existencias de ejemplo son fijas: se restablecen en cada carga (no se suman).
      else await db.variant.update({ where: { id: existingVariant.id }, data: { stock } });
    }
  }
}
