import { describe, expect, it } from "vitest";
import { formatPrice, sortSizes } from "@/lib/catalogo";

// Spec: catalogo-productos

describe("Requirement: Precio del producto en pesos mexicanos", () => {
  it("Scenario: Precio mostrado al cliente", () => {
    expect(formatPrice(45000)).toBe("$450.00 MXN");
    expect(formatPrice(125050)).toBe("$1,250.50 MXN");
  });
});

describe("Requirement: Tallas de una lista fija y ordenada", () => {
  it("Scenario: Orden de tallas al mostrarlas", () => {
    expect(sortSizes(["XG", "CH", "M"])).toEqual(["CH", "M", "XG"]);
  });
});
