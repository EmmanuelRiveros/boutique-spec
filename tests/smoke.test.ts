import { describe, it, expect } from "vitest";

// Prueba de humo de la Fase 0: confirma que Vitest funciona.
// Las pruebas reales se escriben por cada cambio de OpenSpec,
// una por escenario (WHEN/THEN) de su spec.
describe("configuración", () => {
  it("Vitest está listo", () => {
    expect(1 + 1).toBe(2);
  });
});
