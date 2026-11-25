# Proposal

## Why

El catálogo ya organiza los productos por variantes de talla y color, y cada variante tiene un SKU único. Sin embargo, todavía no registra cuántas unidades existen de cada variante. Sin esa información, la boutique no puede conocer la disponibilidad real ni validar si una cantidad solicitada puede atenderse.

El cambio `inventario` agrega existencias por variante y reglas de negocio para consultar y modificar esas existencias sin permitir cantidades negativas. También proporciona una validación de disponibilidad que podrá utilizar el futuro módulo de carrito y checkout.

## What Changes

- Agregar el campo `stock` al modelo `Variant`, con valor predeterminado `0` y almacenamiento como entero.
- Asignar cantidades de ejemplo deterministas a las variantes creadas por el seed del catálogo.
- Crear lógica de dominio en `src/lib/inventario/` para consultar existencias, establecerlas, aumentarlas, disminuirlas y validar disponibilidad.
- Rechazar cantidades inválidas, variantes inexistentes y operaciones que dejarían existencias negativas.
- Impedir que la validación de disponibilidad acepte una cantidad solicitada mayor que las existencias actuales.
- Mantener la lógica separada de la interfaz para poder probarla con Vitest y reutilizarla desde futuras Server Actions.
- Modificar la capacidad `catalogo-productos` para documentar que cada variante tiene existencias y que el seed las proporciona.

### Fuera de alcance

- Pantalla o panel visual para administrar inventario; se realizará dentro del cambio `panel-admin`.
- Carrito, checkout, pedidos y confirmación de compras; se realizarán en sus cambios correspondientes.
- Descuento automático de existencias al agregar un producto al carrito. Agregar al carrito no representa una compra confirmada.
- Reservas temporales de stock, vencimiento de reservas y liberación automática.
- Historial/auditoría de movimientos, alertas de stock bajo, notificaciones y múltiples almacenes.
- Integración con proveedores, compras o sistemas externos de inventario.

## Capabilities

### New Capabilities

- `inventario`: consulta y modificación de existencias por variante, y validación de disponibilidad solicitada.

### Modified Capabilities

- `catalogo-productos`: las variantes incorporan existencias y los datos de ejemplo incluyen cantidades de stock.

## Impact

- `prisma/schema.prisma`: agregar `Variant.stock` como entero no negativo con valor predeterminado `0`.
- `prisma/migrations/`: nueva migración compatible con SQLite y las variantes existentes.
- `src/lib/catalogo/seed.ts` y/o `prisma/seed.ts`: asignar stock de ejemplo de forma repetible.
- `src/lib/inventario/`: funciones de dominio y errores del inventario.
- `tests/`: pruebas Vitest para cada escenario de las capacidades nuevas y modificadas.
- No se agregan dependencias ni rutas o componentes de interfaz en este cambio.
