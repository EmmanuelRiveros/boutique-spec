# Design

## Context

- `prisma/schema.prisma` no tiene modelos; este cambio crea la primera migración. El cliente único vive en `src/lib/db.ts` (adaptador libSQL, SQLite en archivo en local).
- `next.config.ts` tiene `cacheComponents: true`: leer `searchParams`, `params` o la base de datos sin caché exige un límite `<Suspense>` (ver `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md`).
- Vitest corre en entorno `node` sobre `tests/**/*.test.ts`, con el alias `@` → `src`.
- Motivación y alcance: ver `proposal.md`. Requisitos y escenarios: ver `specs/catalogo-productos/spec.md`.

## Goals / Non-Goals

**Goals:**
- Un modelo de datos que `inventario`, `carrito` y `panel-admin` puedan extender sin rehacerlo.
- Toda la lógica (validación de datos, lectura de filtros, consultas) en `src/lib/catalogo/`, probada sin la interfaz.
- Las páginas solo leen parámetros, llaman a la lógica y pintan el resultado.

**Non-Goals:**
- Caché del listado: `/catalogo` se lee fresco en cada petición. (El detalle sí usa caché; ver §7.)
- Componentes de cliente para los filtros: el formulario de filtros es un `<form method="get">` normal, sin JavaScript propio.

## Decisions

### 1. Modelo de datos

```
Category (id, name, slug @unique, createdAt)
   1
   |
   *
Product  (id, name, slug @unique, description, priceCents Int, categoryId, createdAt)
   1                      1
   |                      |
   *                      *
Variant  (id, productId, size Size, color, colorKey, sku @unique)
          @@unique([productId, size, colorKey])
ProductImage (id, productId, url, position)

enum Size { CH  M  G  XG }
```

- **`priceCents Int`** solo en `Product`: decidido en la exploración (un precio por producto). Alternativa descartada: precio opcional por variante, que complica el filtro de precio y el carrito.
- **`enum Size`** en Prisma (SQLite admite enums desde Prisma 6.2) en vez de texto libre: la base rechaza tallas fuera de la lista. El **orden** de visualización no depende de la base: lo define la constante `SIZES = ["CH","M","G","XG"]` en `src/lib/catalogo/`.
- **`colorKey`**: el color normalizado (minúsculas, sin espacios sobrantes y sin acentos). Con SQLite, Prisma no admite `mode: "insensitive"`, así que la comparación sin distinguir mayúsculas se hace contra `colorKey`. La unicidad producto + talla + color también usa `colorKey`, así "Negro" y "negro" cuentan como el mismo color. `color` conserva el nombre visible.
- **`ProductImage`** como tabla con `position`, en vez de una columna JSON: conserva el orden, deja la primera como imagen principal y está lista para la subida de archivos de `panel-admin`.
- Sin campo `stock`: lo agrega `inventario`.

### 2. Validación en funciones de registro, no solo en la base

Las reglas que SQLite no puede expresar (precio entero > 0, talla válida antes de llegar a la base, color no vacío) se validan en `createCategory`, `createProduct` y `createVariant` de `src/lib/catalogo/`. Estas funciones reciben el cliente de BD como parámetro. Las usan el seed y, más adelante, `panel-admin`. Los slugs y SKU duplicados los rechaza la base (`@unique`), y la función traduce ese error a un error del dominio en español.

Alternativa descartada: validar solo en el formulario de administración. Dejaría el seed y las pruebas sin protección.

### 3. Filtros: leer, validar y consultar por separado

```
searchParams --> parseCatalogFilters(params, categorySlugs) --> { filters, warnings[] }
                                                                     |
                                       buildProductWhere(filters) <--+
                                                 |
                                       listCatalogProducts(db, filters) --> productos
```

- `parseCatalogFilters` es una **función pura**: recibe los parámetros de la URL y los slugs de categoría existentes, y devuelve los filtros válidos y la lista de avisos en español de lo que ignoró. Se prueba sin base de datos.
- Parámetros de URL: `categoria` (slug), `talla` (CH, M, G o XG), `color`, `min` y `max` (**pesos enteros**, que se convierten a centavos). Usar pesos en la URL es más legible para el cliente que los centavos.
- Talla y color en la misma variante: el `where` usa **un solo** `variants: { some: { size, colorKey } }`, no dos `some` separados (con dos, bastaría que cada condición se cumpliera en variantes distintas).
- Todo listado incluye siempre `variants: { some: {} }`, para excluir productos sin variantes.
- `buildCatalogHref(filters)` genera la URL a partir de los filtros. La prueba "recargar con filtros" comprueba el viaje de ida y vuelta `parse(href(filters)) == filters`.

### 4. Páginas con Cache Components

- `src/app/catalogo/page.tsx`: la página es un armazón estático. Un componente asíncrono dentro de `<Suspense>` hace `await searchParams`, llama a la lógica y pinta los avisos, el formulario de filtros y la cuadrícula o el estado vacío.
- `src/app/productos/[slug]/page.tsx`: llama a `getProductBySlug(db, slug)`, que devuelve `null` si el producto no existe o no tiene variantes, y en ese caso usa `notFound()`. Un `not-found.tsx` en español muestra "Producto no encontrado". El estado 404 real lo garantiza el Proxy (§7).
- `src/app/page.tsx` enlaza al catálogo.
- Formato de precio con `formatPrice(cents)`, que devuelve `"$450.00 MXN"`, en `src/lib/catalogo/`.

### 5. Seed

- `prisma/seed.ts` se ejecuta con `tsx` y se registra en `prisma.config.ts` (`migrations.seed`). Además se agrega el script `npm run db:seed`.
- Es **idempotente**: usa `upsert` por `slug` (categorías y productos) y por `sku` (variantes), y reemplaza las imágenes de cada producto. Correrlo dos veces deja los mismos conteos.
- Las imágenes son URLs de placeholders públicos. Si no hay red, el catálogo funciona igual, solo sin fotos.

### 6. Pruebas con base de datos

- Las pruebas que tocan la base usan un archivo SQLite aparte, `file:./test.db` (ya ignorado por `*.db` en `.gitignore`). Un `globalSetup` de Vitest borra el archivo y aplica las migraciones con `prisma migrate deploy` antes de la corrida.
- Cada archivo de prueba limpia las tablas en `beforeEach` y crea sus propios datos con las funciones de registro. No depende del seed, salvo las pruebas del propio seed.
- `fileParallelism: false` en Vitest para que los archivos no compartan la base al mismo tiempo.
- Las pruebas de la capa de páginas (404, aviso visible) se prueban a nivel de lógica (`getProductBySlug` devuelve `null`; `parseCatalogFilters` devuelve el aviso) y se confirman a mano en `npm run dev` durante la verificación.

### 7. Estado 404 del detalle con un Proxy (decidido durante la implementación)

Durante la implementación se confirmó el riesgo: con Cache Components, Next envía primero el armazón prerenderizado con estado 200. Un `notFound()` que se ejecuta al momento de la petición ya no puede cambiarlo; solo agrega `noindex` (ver `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md`, "Status codes"). En `next dev` sí se ve 404, pero en `next start` no.

- `src/proxy.ts`, con matcher `/productos/:slug`, consulta `isVisibleProductSlug(db, slug)` (una búsqueda por índice único, que devuelve solo `id`). Si el producto no existe o no tiene variantes, o la URL está mal formada, **reescribe a una ruta que no existe**. Next sirve entonces `src/app/not-found.tsx` (en español, con `noindex`) con estado 404 real.
- Se probó primero `NextResponse.rewrite(<página existente>, { status: 404 })`. Next ignora ese `status` cuando el destino es una página de la app, sea estática o dinámica, y responde 200. Por eso se reescribe a una ruta inexistente.
- `src/app/not-found.tsx` y `src/app/productos/[slug]/not-found.tsx` comparten el componente `ProductoNoEncontrado`: el título "Producto no encontrado" y un texto que también cubre páginas inexistentes, porque el not-found raíz atiende cualquier URL desconocida.
- El detalle usa `generateStaticParams` (los slugs visibles, o un marcador si no hay ninguno, porque Cache Components exige al menos uno) y `getCachedProduct` con `"use cache"` + `cacheTag("catalogo")`. Así el detalle de los productos existentes se prerenderiza, y `panel-admin` podrá invalidarlo con `revalidateTag("catalogo")`.
- Alternativas descartadas: aceptar 200 + `noindex` (cambia un escenario aprobado) y `dynamicParams = false` (los productos nuevos no tendrían página hasta volver a compilar).

## Risks / Trade-offs

- [Proxy agrega una consulta a la base por cada visita al detalle] → Es una búsqueda por índice único que devuelve solo `id`. El Proxy solo corre en `/productos/:slug`.
- [Caché del detalle: un cambio en la base no se ve hasta que expire (`cacheLife("hours")`) o se invalide] → En este cambio los datos solo cambian con el seed (en local, reiniciar `npm run dev`). `panel-admin` llamará a `revalidateTag("catalogo")` al editar.
- [`colorKey` puede desincronizarse si alguien escribe variantes sin pasar por `createVariant`] → Todas las escrituras (seed y futuro admin) pasan por la función. Se agrega una prueba de que la función normaliza el color.
- [La base de pruebas compartida hace que la suite sea secuencial y un poco más lenta] → El catálogo es pequeño. Se puede pasar a una base en memoria por archivo si crece.
- [Placeholders de imágenes externos] → No se suben al repositorio ni se necesitan para las pruebas. Con `panel-admin` llegarán las imágenes propias.

## Migration Plan

1. `npm run db:migrate` crea la migración `catalogo_productos` con los cuatro modelos y el enum.
2. `npm run db:seed` carga los datos de ejemplo.
3. Rollback local: borrar `dev.db` y la carpeta de la migración. No hay datos reales en riesgo.
