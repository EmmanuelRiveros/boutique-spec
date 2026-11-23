# Tasks

> Regla de cada tarea de prueba: escribir primero la prueba del escenario, verla fallar, luego el código que la cumple, y correr `npm test` antes de marcarla.

## 1. Modelo de datos y base de pruebas

- [x] 1.1 Agregar a `prisma/schema.prisma` los modelos `Category`, `Product`, `Variant`, `ProductImage` y el enum `Size` según design.md §1; verificar con `npx prisma validate`
- [x] 1.2 Crear la migración `catalogo_productos` con `npm run db:migrate`; verificar que se genera `prisma/migrations/*_catalogo_productos/` y que `npm run dev` arranca sin errores
- [x] 1.3 Configurar la base de pruebas (`globalSetup` que recrea `test.db` con `prisma migrate deploy`, `fileParallelism: false`, utilidad para limpiar tablas); verificar que `npm test` pasa con la prueba de humo

## 2. Registro de categorías, productos y variantes (`src/lib/catalogo/`)

- [x] 2.1 Prueba "Producto asociado a su categoría" + `createCategory`/`createProduct`; verificar con `npm test`
- [x] 2.2 Prueba "Slug de categoría repetido" (error de dominio en español); verificar con `npm test`
- [x] 2.3 Prueba "Variante válida" + `createVariant`; verificar con `npm test`
- [x] 2.4 Prueba "SKU duplicado"; verificar con `npm test`
- [x] 2.5 Prueba "Combinación talla y color repetida", incluida la variante con distinta capitalización ("Negro" / "negro") que normaliza `colorKey`; verificar con `npm test`
- [x] 2.6 Prueba "Talla fuera de la lista" (registro con talla "XXL"); verificar con `npm test`
- [x] 2.7 Prueba "Precio inválido" (0, negativo y no entero); verificar con `npm test`

## 3. Formato de precio y orden de tallas

- [x] 3.1 Prueba "Precio mostrado al cliente" + `formatPrice` (45000 → "$450.00 MXN"); verificar con `npm test`
- [x] 3.2 Prueba "Orden de tallas al mostrarlas" + constante `SIZES` y función de ordenamiento; verificar con `npm test`

## 4. Datos de ejemplo

- [x] 4.1 Prueba "Carga en base de datos vacía" + `prisma/seed.ts` con al menos 3 categorías y 8 productos con variantes e imágenes, usando las funciones del grupo 2; verificar con `npm test`
- [x] 4.2 Prueba "Carga repetida" (idempotencia con `upsert`); verificar con `npm test`
- [x] 4.3 Registrar el seed en `prisma.config.ts` y agregar el script `db:seed` a `package.json`; verificar que `npm run db:seed` corre dos veces sin error sobre `dev.db`

## 5. Listado y filtros (`src/lib/catalogo/`)

- [x] 5.1 Prueba "Ver el catálogo completo" + `listCatalogProducts` (orden más reciente primero); verificar con `npm test`
- [x] 5.2 Prueba "Producto sin variantes" (no aparece en el listado); verificar con `npm test`
- [x] 5.3 Prueba "Opciones mostradas" + `getFilterOptions`; verificar con `npm test`
- [x] 5.4 Prueba "Filtrar por categoría" + `parseCatalogFilters` y `buildProductWhere`; verificar con `npm test`
- [x] 5.5 Prueba "Filtrar solo por talla"; verificar con `npm test`
- [x] 5.6 Prueba "Filtrar por talla y color existentes en la misma variante"; verificar con `npm test`
- [x] 5.7 Prueba "Talla y color solo en variantes distintas" (un solo `some` en el `where`); verificar con `npm test`
- [x] 5.8 Prueba "Color con distinta capitalización"; verificar con `npm test`
- [x] 5.9 Prueba "Filtrar por rango de precio" (pesos enteros, extremos inclusivos); verificar con `npm test`
- [x] 5.10 Prueba "Solo precio mínimo"; verificar con `npm test`
- [x] 5.11 Prueba "Categoría, talla y precio juntos"; verificar con `npm test`
- [x] 5.12 Prueba "Recargar con filtros" + `buildCatalogHref` (viaje de ida y vuelta parse ↔ href); verificar con `npm test`
- [x] 5.13 Prueba "Precio no numérico o negativo" (filtro ignorado y aviso); verificar con `npm test`
- [x] 5.14 Prueba "Mínimo mayor que máximo"; verificar con `npm test`
- [x] 5.15 Prueba "Categoría inexistente"; verificar con `npm test`
- [x] 5.16 Prueba "Talla fuera de la lista" para el filtro del listado; verificar con `npm test`
- [x] 5.17 Prueba "Filtros sin coincidencias" (lista vacía sin avisos); verificar con `npm test`

## 6. Detalle de producto (`src/lib/catalogo/`)

- [x] 6.1 Prueba "Ver detalle" + `getProductBySlug` (tallas ordenadas y colores únicos); verificar con `npm test`
- [x] 6.2 Prueba "Producto inexistente" (`getProductBySlug` devuelve `null`); verificar con `npm test`
- [x] 6.3 Prueba "Producto sin variantes" (`getProductBySlug` devuelve `null`); verificar con `npm test`

## 7. Páginas

- [x] 7.1 Crear `src/app/catalogo/page.tsx` (armazón + componente asíncrono en `<Suspense>`, formulario GET de filtros, avisos, cuadrícula y estado vacío con enlace a "ver todo"); verificar en `npm run dev` que `/catalogo` lista los productos del seed y que los filtros cambian la URL y el resultado
- [x] 7.2 Crear `src/app/productos/[slug]/page.tsx` y su `not-found.tsx` en español; verificar en `npm run dev` el detalle de un producto del seed y que un slug inventado muestra "Producto no encontrado"
- [x] 7.3 Enlazar el catálogo desde `src/app/page.tsx`; verificar que el enlace lleva a `/catalogo`
- [x] 7.4 Prueba de `isVisibleProductSlug` (existente con variantes → true; inexistente o sin variantes → false) + `src/proxy.ts` con matcher `/productos/:slug` que reescribe a una ruta inexistente para servir `src/app/not-found.tsx` con 404 (design.md §7); verificar con `npm test` y con `curl` contra `next start`

## 8. Integración

- [x] 8.1 Confirmar que `npm test` y `npm run build` pasan, y que `curl -I` a `/productos/no-existe` responde 404 en `next start` (producción), no solo en `next dev`
- [x] 8.2 Correr `openspec validate catalogo-productos --strict` y verificar que no hay errores ni advertencias

## Workflow follow-up

- Verificar el cambio con `/openspec-verify-change`.
- Archivar con `/openspec-archive-change` y hacer el commit propio del cambio (Conventional Commits).
- Marcar `catalogo-productos` como terminado en la lista de estado de `CLAUDE.md`.
