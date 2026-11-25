export type InventoryErrorCode = "CANTIDAD_INVALIDA" | "VARIANTE_INEXISTENTE" | "STOCK_INSUFICIENTE";

/** Error de reglas del inventario, con mensaje en español y un código distinguible. */
export class InventoryError extends Error {
  readonly code: InventoryErrorCode;
  constructor(code: InventoryErrorCode, message: string) {
    super(message);
    this.name = "InventoryError";
    this.code = code;
  }
}
