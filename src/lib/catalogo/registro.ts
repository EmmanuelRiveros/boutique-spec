import { CatalogError, isUniqueViolation } from "./errors";
import { toColorKey } from "./color";
import { isValidPriceCents } from "./price";
import { isSize } from "./sizes";
import type { CatalogDb } from "./types";

export type NewCategory = { name: string; slug: string };

export type NewProduct = {
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  categoryId: number;
  images?: string[];
};

export type NewVariant = { productId: number; size: string; color: string; sku: string };

function requireText(value: string, field: string): string {
  const v = value.trim();
  if (!v) throw new CatalogError(`El campo "${field}" es obligatorio.`);
  return v;
}

export async function createCategory(db: CatalogDb, input: NewCategory) {
  const name = requireText(input.name, "nombre");
  const slug = requireText(input.slug, "slug");
  try {
    return await db.category.create({ data: { name, slug } });
  } catch (e) {
    if (isUniqueViolation(e)) throw new CatalogError(`Ya existe una categoría con el slug "${slug}".`);
    throw e;
  }
}

export async function createProduct(db: CatalogDb, input: NewProduct) {
  const name = requireText(input.name, "nombre");
  const slug = requireText(input.slug, "slug");
  if (!isValidPriceCents(input.priceCents)) {
    throw new CatalogError("El precio debe ser un número entero de centavos mayor que cero.");
  }
  try {
    return await db.product.create({
      data: {
        name,
        slug,
        description: input.description.trim(),
        priceCents: input.priceCents,
        categoryId: input.categoryId,
        images: { create: (input.images ?? []).map((url, position) => ({ url, position })) },
      },
    });
  } catch (e) {
    if (isUniqueViolation(e)) throw new CatalogError(`Ya existe un producto con el slug "${slug}".`);
    throw e;
  }
}

export async function createVariant(db: CatalogDb, input: NewVariant) {
  if (!isSize(input.size)) {
    throw new CatalogError(`La talla "${input.size}" no es válida. Usa CH, M, G o XG.`);
  }
  const color = requireText(input.color, "color").replace(/\s+/g, " ");
  const sku = requireText(input.sku, "SKU");
  try {
    return await db.variant.create({
      data: { productId: input.productId, size: input.size, color, colorKey: toColorKey(color), sku },
    });
  } catch (e) {
    if (isUniqueViolation(e)) {
      throw new CatalogError(
        `Ya existe una variante con el SKU "${sku}" o con la talla ${input.size} y el color "${color}" en este producto.`,
      );
    }
    throw e;
  }
}
