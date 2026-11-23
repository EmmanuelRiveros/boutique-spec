const pesos = new Intl.NumberFormat("es-MX", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 45000 -> "$450.00 MXN". El precio siempre se guarda en centavos enteros. */
export function formatPrice(cents: number): string {
  return `$${pesos.format(cents / 100)} MXN`;
}

export function isValidPriceCents(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}
