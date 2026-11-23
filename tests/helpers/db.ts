import { db } from "@/lib/db";

// Deja las tablas del catálogo vacías (hijos primero).
export async function resetDb() {
  await db.productImage.deleteMany();
  await db.variant.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
}

export { db };
