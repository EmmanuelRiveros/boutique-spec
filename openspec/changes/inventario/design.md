# Design

## Context

El catálogo existente define `Product` y `Variant` en `prisma/schema.prisma`. Una variante representa una combinación única de producto, talla y color, y tiene un `sku` único. El inventario debe pertenecer a `Variant`, no a `Product`, porque las existencias pueden ser distintas entre tallas y colores del mismo producto.

El proyecto usa Prisma 7 con SQLite local, un cliente compartido en `src/lib/db.ts`, lógica de negocio en `src/lib/<capacidad>/` y Vitest en `tests/`. Las funciones de dominio reciben el cliente de base de datos como parámetro para poder probarse sin interfaz.

## Goals / Non-Goals

### Goals

- Mantener una cantidad entera de existencias para cada variante.
- Garantizar que el stock nunca sea negativo mediante validación de dominio y operaciones condicionales en la base de datos.
- Ofrecer una validación reutilizable para que carrito/checkout rechacen cantidades mayores a las disponibles.
- Proporcionar datos de ejemplo repetibles para el entorno local.
- Probar cada escenario con Vitest.

### Non-Goals

- Construir la interfaz administrativa.
- Implementar carrito, pedidos, pagos o reservas.
- Descontar stock al agregar artículos al carrito.
- Diseñar reportes, alertas o bitácoras de movimientos.

## Decisions

### 1. El stock pertenece a Variant

Agregar `stock Int @default(0)` a `Variant`.

Justificación: una misma prenda puede tener existencias distintas por talla y color. Un campo en `Product` no permitiría conocer la disponibilidad exacta de una variante.

Las variantes existentes recibirán `0` al aplicar la migración, por el valor predeterminado. El seed asignará cantidades de ejemplo explícitas a las variantes de demostración.

### 2. Cantidades enteras y no negativas

Todas las cantidades recibidas por las funciones serán números enteros seguros. Para ajustes y consultas de disponibilidad, la cantidad solicitada deberá ser mayor que cero. Para establecer el stock absoluto, se permitirá cero, pero no valores negativos, fraccionarios, `NaN` o infinitos.

La base SQLite almacenará el valor entero. La capa de dominio validará los argumentos antes de escribir.

### 3. API de dominio

Crear `src/lib/inventario/` con funciones independientes de la interfaz:

- `getVariantStock(db, variantId)`: devuelve la existencia actual o un error de variante inexistente.
- `setVariantStock(db, variantId, quantity)`: establece el stock absoluto; acepta cero o un entero positivo.
- `increaseVariantStock(db, variantId, quantity)`: suma una cantidad entera positiva.
- `decreaseVariantStock(db, variantId, quantity)`: resta una cantidad positiva solo si el stock actual alcanza; si no alcanza, no modifica la variante y devuelve un error de stock insuficiente.
- `checkVariantAvailability(db, variantId, requestedQuantity)`: devuelve disponibilidad y stock actual, o resultado no disponible cuando la cantidad solicitada supera el stock.

Los errores de dominio tendrán mensajes en español y tipos/códigos distinguibles para: cantidad inválida, variante inexistente y stock insuficiente.

### 4. Evitar stock negativo en operaciones concurrentes

`decreaseVariantStock` no debe realizar una secuencia insegura de leer y luego escribir sin condición. Debe ejecutar una actualización condicional en la base de datos que solo reste cuando `id` coincida y `stock >= quantity` (por ejemplo, `updateMany` con condición `stock: { gte: quantity }`). Si ninguna fila se actualiza, vuelve a consultar para distinguir variante inexistente de stock insuficiente.

Esto protege la operación de disminución ante solicitudes concurrentes. No implementa todavía una compra ni una reserva; el futuro checkout deberá usar la operación atómica dentro de su propio flujo transaccional.

### 5. Validación de disponibilidad sin mutación

`checkVariantAvailability` no cambia existencias. Solo valida que la variante exista, que la cantidad solicitada sea válida y que `stock >= requestedQuantity`. Esta función podrá ser utilizada por el carrito/checkout futuro.

Agregar al carrito no descontará existencias. El descuento efectivo corresponde al flujo de confirmación de pedido, que está fuera de este cambio.

### 6. Datos de ejemplo

Actualizar el seed existente para asignar cantidades deterministas a cada variante. La carga debe continuar siendo idempotente: ejecutarla varias veces debe dejar las mismas existencias de ejemplo, no sumar cantidades repetidamente.

Las cantidades exactas serán valores pequeños y explícitos adecuados para demostración. No se inferirá stock a partir del número de variantes ni del precio.

### 7. Migración

Crear una migración Prisma que agregue `stock` con `NOT NULL` y valor predeterminado `0`. La migración no debe borrar productos ni variantes existentes.

## Risks / Trade-offs

- [El seed puede sobrescribir ajustes manuales locales] → El seed de demostración establece cantidades deterministas; se documentará que es para datos de ejemplo y no para inventario real de producción.
- [Una futura compra podría validar stock y después descontarlo en una operación separada] → El checkout deberá utilizar decremento condicional dentro de una transacción/flujo atómico; no bastará con confiar en una validación previa.
- [Las variantes creadas sin asignación explícita tendrán stock cero] → Es el comportamiento seguro por defecto: una variante nueva no se ofrece como disponible hasta que se carguen existencias.

## Migration Plan

1. Agregar `stock Int @default(0)` al modelo `Variant`.
2. Crear y aplicar la migración con `npm run db:migrate`.
3. Actualizar el seed para fijar cantidades de ejemplo por variante y comprobar su idempotencia.
4. Implementar primero las pruebas Vitest y después las funciones de dominio.
5. Ejecutar `npm test`, `npm run lint` y `npm run build`.
6. Validar OpenSpec con `openspec validate inventario --strict`.

Rollback local: revertir el commit del cambio y recrear la base local de demostración si fuera necesario. No se contemplan datos reales de producción en este proyecto escolar.
