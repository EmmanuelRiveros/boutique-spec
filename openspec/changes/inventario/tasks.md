# Tasks

> Regla: escribir primero la prueba del escenario, verla fallar, luego el código que la cumple. Ejecutar `npm test` antes de marcar cada tarea como completa.

## 1. Modelo de datos y migración

- [x] 1.1 Agregar `stock Int @default(0)` a `Variant` en `prisma/schema.prisma`; verificar con `npx prisma validate`.
- [x] 1.2 Crear la migración `inventario` con `npm run db:migrate`; verificar que las variantes existentes reciben stock cero y que no se pierden datos.

## 2. Registro de variantes con existencias (`src/lib/catalogo/registro.ts`)

- [x] 2.1 Prueba "Variante válida" (actualizada: stock 0 por omisión) y "Variante nueva sin stock asignado" + campo opcional `stock` en `NewVariant`/`createVariant`; verificar con `npm test`.
- [x] 2.2 Prueba "Variante con existencias iniciales" (7 unidades); verificar con `npm test`.
- [x] 2.3 Prueba "Stock inicial inválido" (negativo y fraccionario); verificar con `npm test`.

## 2b. Datos de ejemplo

- [x] 2b.1 Actualizar la prueba del seed para comprobar que cada variante de ejemplo recibe su cantidad de stock definida.
- [x] 2b.2 Agregar el stock por variante a los datos de `SEED_PRODUCTS` y actualizar `seedCatalog` para que también **actualice el stock de variantes que ya existen** (hoy solo crea las que faltan; una `dev.db` ya sembrada quedaría con stock 0 tras la migración); verificar con `npm test`.
- [x] 2b.3 Probar la idempotencia del seed: ejecutarlo dos veces y comprobar que el stock no se suma ni cambia; verificar con `npm test`.

## 3. Consultar y establecer existencias (`src/lib/inventario/`)

- [x] 3.1 Prueba "Consultar existencias de una variante" + `getVariantStock`; verificar con `npm test`.
- [x] 3.2 Prueba "Consultar variante inexistente"; verificar con `npm test`.
- [x] 3.3 Prueba "Establecer existencias válidas" y "Establecer stock en cero" + `setVariantStock`; verificar con `npm test`.
- [x] 3.4 Prueba "Rechazar cantidad inválida al establecer stock"; verificar con `npm test`.

## 4. Aumentar existencias

- [x] 4.1 Prueba "Aumento válido de existencias" + `increaseVariantStock`; verificar con `npm test`.
- [x] 4.2 Prueba "Rechazar aumento inválido"; verificar con `npm test`.

## 5. Disminuir existencias

- [x] 5.1 Prueba "Disminución válida" + `decreaseVariantStock`; verificar con `npm test`.
- [x] 5.2 Prueba "Descuento igual al stock disponible"; verificar con `npm test`.
- [x] 5.3 Prueba "Stock insuficiente para disminuir" y comprobar que el valor no cambia; verificar con `npm test`.
- [x] 5.4 Prueba "Rechazar disminución inválida"; verificar con `npm test`.
- [x] 5.5 Implementar disminución condicional en la base de datos para evitar stock negativo ante operaciones concurrentes; verificar con `npm test`.

## 6. Validar disponibilidad

- [x] 6.1 Prueba "Cantidad solicitada disponible" + `checkVariantAvailability`; verificar con `npm test`.
- [x] 6.2 Prueba "Cantidad solicitada igual al stock"; verificar con `npm test`.
- [x] 6.3 Prueba "Cantidad solicitada superior al stock" y comprobar que no modifica existencias; verificar con `npm test`.
- [x] 6.4 Prueba "Variante agotada"; verificar con `npm test`.
- [x] 6.5 Prueba "Cantidad solicitada inválida"; verificar con `npm test`.

## 7. Integración y validación

- [x] 7.1 Exportar las funciones y errores desde `src/lib/inventario/index.ts` sin acoplarlos a componentes visuales.
- [x] 7.2 Ejecutar `npm test`, `npm run lint` y `npm run build`; corregir cualquier fallo.
- [x] 7.3 Ejecutar `openspec validate inventario --strict` y revisar también la modificación de `catalogo-productos`.

## Workflow follow-up

- Verificar el cambio con `/openspec-verify-change`.
- Revisar y aprobar todos los escenarios antes de implementar.
- Archivar con `/openspec-archive-change` únicamente después de verificar pruebas y build.
- Crear un commit propio con formato Conventional Commits.
