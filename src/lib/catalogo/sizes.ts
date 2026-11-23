import type { Size } from "@/generated/prisma/client";

/** Lista fija de tallas, en el orden en que se muestran. */
export const SIZES = ["CH", "M", "G", "XG"] as const satisfies readonly Size[];

export function isSize(value: unknown): value is Size {
  return typeof value === "string" && (SIZES as readonly string[]).includes(value);
}

/** Ordena tallas según SIZES y quita repetidas. */
export function sortSizes(sizes: readonly Size[]): Size[] {
  return SIZES.filter((s) => sizes.includes(s));
}
