# Revisión de la propuesta de inventario

Esta carpeta contiene una propuesta para revisión. Todavía no incluye implementación ni migraciones aplicadas.

## Decisiones confirmadas

- Las variantes del catálogo tendrán existencias propias.
- El seed asignará cantidades de ejemplo deterministas.
- El stock no puede ser negativo.
- No se permite validar disponibilidad para una cantidad mayor al stock.
- En este cambio se implementan lógica de dominio y pruebas, no una pantalla administrativa.

## Aspectos que requieren revisión del equipo antes de aprobar

1. Confirmar si las funciones de aumento, disminución y establecimiento absoluto de stock son suficientes para la operación que espera el equipo.
2. Confirmar las cantidades concretas que se asignarán a cada variante de demostración. La propuesta exige que sean deterministas, pero deja los valores exactos para definirlos al implementar el seed.
3. Confirmar que el descuento de stock en una compra se conectará al futuro checkout y no al carrito. La propuesta no implementa reservas temporales.
4. Confirmar que no se requiere historial de movimientos ni alertas de stock bajo en esta etapa.

## Alcance de esta revisión

Revisar `proposal.md`, `design.md`, `tasks.md` y ambas especificaciones en `specs/`. No ejecutar migraciones ni modificar código hasta que el equipo apruebe la propuesta.
