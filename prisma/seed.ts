import "dotenv/config";
import { db } from "../src/lib/db";
import { seedCatalog } from "../src/lib/catalogo/seed";

// Datos de ejemplo del catálogo. Se puede correr varias veces sin duplicar datos.
async function main() {
  await seedCatalog(db);
  const [categorias, productos, variantes] = await Promise.all([
    db.category.count(),
    db.product.count(),
    db.variant.count(),
  ]);
  console.log(`Catálogo listo: ${categorias} categorías, ${productos} productos, ${variantes} variantes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
