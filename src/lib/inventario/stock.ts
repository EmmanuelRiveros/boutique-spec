import { InventoryError } from "./errors";
import type { InventoryDb } from "./types";

const isInt = (v: unknown): v is number => typeof v === "number" && Number.isSafeInteger(v);

/** Cantidad a sumar, restar o solicitar: entero seguro mayor que cero. */
function requirePositive(quantity: unknown): number {
  if (!isInt(quantity) || quantity <= 0) {
    throw new InventoryError("CANTIDAD_INVALIDA", "La cantidad debe ser un número entero mayor que cero.");
  }
  return quantity;
}

function notFound(variantId: number): InventoryError {
  return new InventoryError("VARIANTE_INEXISTENTE", `La variante ${variantId} no existe.`);
}

function isRecordNotFound(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: unknown }).code === "P2025";
}

/** Existencias actuales de una variante. */
export async function getVariantStock(db: InventoryDb, variantId: number): Promise<number> {
  const v = await db.variant.findUnique({ where: { id: variantId }, select: { stock: true } });
  if (!v) throw notFound(variantId);
  return v.stock;
}

/** Fija las existencias a una cantidad absoluta (entero >= 0). */
export async function setVariantStock(db: InventoryDb, variantId: number, quantity: number): Promise<number> {
  if (!isInt(quantity) || quantity < 0) {
    throw new InventoryError("CANTIDAD_INVALIDA", "Las existencias deben ser un número entero mayor o igual a cero.");
  }
  try {
    const v = await db.variant.update({ where: { id: variantId }, data: { stock: quantity }, select: { stock: true } });
    return v.stock;
  } catch (e) {
    if (isRecordNotFound(e)) throw notFound(variantId);
    throw e;
  }
}

/** Suma una cantidad entera positiva a las existencias. */
export async function increaseVariantStock(db: InventoryDb, variantId: number, quantity: number): Promise<number> {
  const q = requirePositive(quantity);
  try {
    const v = await db.variant.update({
      where: { id: variantId },
      data: { stock: { increment: q } },
      select: { stock: true },
    });
    return v.stock;
  } catch (e) {
    if (isRecordNotFound(e)) throw notFound(variantId);
    throw e;
  }
}

/**
 * Resta una cantidad entera positiva solo si alcanza. La condición `stock >= quantity` va en
 * la propia actualización, así dos descuentos simultáneos no pueden dejar el stock negativo.
 */
export async function decreaseVariantStock(db: InventoryDb, variantId: number, quantity: number): Promise<number> {
  const q = requirePositive(quantity);
  const { count } = await db.variant.updateMany({
    where: { id: variantId, stock: { gte: q } },
    data: { stock: { decrement: q } },
  });
  // Una sola lectura posterior: distingue "no existe" de "no alcanza" y devuelve el stock actual.
  const actual = await db.variant.findUnique({ where: { id: variantId }, select: { stock: true } });
  if (!actual) throw notFound(variantId);
  if (count === 0) {
    throw new InventoryError(
      "STOCK_INSUFICIENTE",
      `Stock insuficiente: hay ${actual.stock} unidades y se pidieron ${q}.`,
    );
  }
  return actual.stock;
}

export type Availability = { available: boolean; stock: number; requested: number };

/** Indica si hay existencias para la cantidad pedida. No modifica el stock. */
export async function checkVariantAvailability(
  db: InventoryDb,
  variantId: number,
  requestedQuantity: number,
): Promise<Availability> {
  const requested = requirePositive(requestedQuantity);
  const stock = await getVariantStock(db, variantId);
  return { available: stock >= requested, stock, requested };
}
