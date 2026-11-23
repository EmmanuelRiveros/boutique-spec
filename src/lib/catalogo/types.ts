import type { PrismaClient } from "@/generated/prisma/client";

/** Cliente de BD que reciben las funciones del catálogo. */
export type CatalogDb = Pick<PrismaClient, "category" | "product" | "variant" | "productImage">;
