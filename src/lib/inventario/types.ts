import type { PrismaClient } from "@/generated/prisma/client";

/** Cliente de BD que reciben las funciones del inventario. */
export type InventoryDb = Pick<PrismaClient, "variant">;
