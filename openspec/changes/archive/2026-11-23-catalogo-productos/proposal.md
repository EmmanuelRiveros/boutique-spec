# Proposal

## Why

La tienda todavía no tiene productos: el esquema de Prisma está vacío y la página principal solo muestra un mensaje de bienvenida. El catálogo es la base de los cambios siguientes (inventario, carrito, checkout y panel de administración), así que primero hay que fijar qué es un producto, cómo se organiza en categorías y cómo se distinguen sus variantes de talla y color.

## What Changes

- Nuevos modelos de datos: **Categoría**, **Producto** (con precio base en centavos MXN) y **Variante** (talla + color, con SKU único y una sola variante por combinación de producto, talla y color).
- Lista fija y ordenada de tallas: CH, M, G, XG.
- Datos de ejemplo cargados con un seed (categorías, productos, variantes e imágenes por URL), porque en este cambio no hay alta de productos desde la interfaz.
- Página pública de **listado del catálogo** con los productos más recientes primero.
- **Filtros** del listado por categoría, talla, color y rango de precio, combinables con Y y expresados en la URL. Talla y color se cumplen en la misma variante.
- Manejo de casos de error: rango de precio inválido, categoría inexistente, filtros sin resultados.
- Página pública de **detalle de producto** por slug, con sus tallas y colores disponibles y una página 404 en español si no existe.
- Los productos sin variantes no se muestran en el catálogo.

### Fuera de alcance

- **Stock** por variante y la regla de no vender sin stock: llegan con el cambio `inventario`, que modificará esta capacidad.
- **Alta, edición y baja** de productos y **subida de imágenes**: llegan con `panel-admin`.
- **Búsqueda por texto**.
- **Precio por variante**: todas las variantes de un producto cuestan su precio base.
- **Subcategorías** o jerarquías de categorías: cada producto pertenece a una sola categoría plana.
- **Selector de orden** en el listado (por precio, nombre, etc.): el orden es fijo.
- Paginación: el catálogo de ejemplo es pequeño.
- Carrito, pedidos y descuentos.

## Capabilities

### New Capabilities

- `catalogo-productos`: estructura del catálogo (categorías, productos, variantes con SKU) y su consulta pública: listado, filtros y detalle de producto.

### Modified Capabilities

Ninguna (es la primera capacidad del proyecto).

## Impact

- `prisma/schema.prisma`: primeros modelos y primera migración de la base de datos.
- Nuevo script de seed con datos de ejemplo y su comando en `package.json`.
- Nueva lógica de consulta en `src/lib/catalogo/` (filtros y validación de parámetros), probada con Vitest sin la interfaz.
- Nuevas rutas en `src/app/`: listado del catálogo y detalle de producto; la página principal enlazará al catálogo.
- `tests/`: una prueba por escenario de la spec.
- Sin dependencias externas nuevas.
