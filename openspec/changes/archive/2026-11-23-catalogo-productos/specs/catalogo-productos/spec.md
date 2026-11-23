# Spec Delta

## Purpose

Define cómo se organiza el catálogo de la boutique (categorías, productos y sus variantes de talla y color) y cómo un cliente lo consulta: listado, filtros y detalle de producto.

## ADDED Requirements

### Requirement: Producto pertenece a una categoría
Cada producto SHALL pertenecer exactamente a una categoría. Cada categoría MUST tener un nombre visible y un slug único.

#### Scenario: Producto asociado a su categoría
- **WHEN** se registra un producto en la categoría "Blusas"
- **THEN** el producto queda asociado solo a "Blusas" y aparece al filtrar por esa categoría

#### Scenario: Slug de categoría repetido
- **WHEN** se intenta registrar una categoría con un slug que ya usa otra categoría
- **THEN** el sistema rechaza el registro y la categoría existente no cambia

### Requirement: Variante identificada por talla, color y SKU
Cada variante SHALL pertenecer a un producto y tener una talla, un color y un SKU. El SKU MUST ser único en todo el catálogo y un producto MUST NOT tener dos variantes con la misma talla y el mismo color.

#### Scenario: Variante válida
- **WHEN** se registra la variante talla M, color "Negro", SKU "BLU-LIN-M-NEG" para un producto
- **THEN** la variante queda asociada a ese producto con esos datos

#### Scenario: SKU duplicado
- **WHEN** se intenta registrar una variante con un SKU que ya usa otra variante
- **THEN** el sistema rechaza el registro

#### Scenario: Combinación talla y color repetida
- **WHEN** se intenta registrar una segunda variante talla M y color "Negro" para el mismo producto
- **THEN** el sistema rechaza el registro

### Requirement: Tallas de una lista fija y ordenada
Las tallas SHALL tomarse de la lista fija CH, M, G, XG, y el sistema MUST mostrarlas siempre en ese orden.

#### Scenario: Talla fuera de la lista
- **WHEN** se intenta registrar una variante con talla "XXL"
- **THEN** el sistema rechaza el registro

#### Scenario: Orden de tallas al mostrarlas
- **WHEN** un producto tiene variantes en tallas XG, CH y M
- **THEN** sus tallas se muestran en el orden CH, M, XG

### Requirement: Precio del producto en pesos mexicanos
Cada producto SHALL tener un precio base en centavos de MXN, entero y mayor que cero, que aplica a todas sus variantes. El sistema MUST mostrarlo en pesos con dos decimales.

#### Scenario: Precio mostrado al cliente
- **WHEN** un producto tiene precio base de 45000 centavos
- **THEN** el cliente ve el precio como "$450.00 MXN" en el listado y en el detalle

#### Scenario: Precio inválido
- **WHEN** se intenta registrar un producto con precio base 0, negativo o con fracción de centavo
- **THEN** el sistema rechaza el registro

### Requirement: Datos de ejemplo del catálogo
El sistema SHALL incluir un proceso de carga de datos de ejemplo con al menos 3 categorías y 8 productos con variantes, imágenes y precios distintos, que pueda ejecutarse más de una vez sin duplicar datos.

#### Scenario: Carga en base de datos vacía
- **WHEN** se ejecuta la carga de datos de ejemplo sobre una base de datos vacía
- **THEN** el catálogo tiene al menos 3 categorías y 8 productos, cada uno con al menos una variante

#### Scenario: Carga repetida
- **WHEN** se ejecuta la carga de datos de ejemplo dos veces seguidas
- **THEN** el número de categorías, productos y variantes es el mismo que tras la primera carga

### Requirement: Listado del catálogo
El sistema SHALL mostrar una página pública con los productos del catálogo, ordenados del más reciente al más antiguo, mostrando de cada uno su nombre, categoría, precio e imagen principal. Los productos sin variantes MUST NOT aparecer.

#### Scenario: Ver el catálogo completo
- **WHEN** un cliente abre el catálogo sin filtros
- **THEN** ve todos los productos que tienen al menos una variante, del más reciente al más antiguo

#### Scenario: Producto sin variantes
- **WHEN** existe un producto sin ninguna variante
- **THEN** ese producto no aparece en el listado

### Requirement: Opciones de filtro disponibles
El listado SHALL ofrecer como opciones de filtro las categorías que tienen productos visibles, las tallas de la lista fija en su orden y los colores presentes en las variantes del catálogo.

#### Scenario: Opciones mostradas
- **WHEN** un cliente abre el catálogo
- **THEN** puede elegir entre las categorías con productos visibles, las tallas CH, M, G, XG en ese orden y los colores que existen en el catálogo

### Requirement: Filtro por categoría
El listado SHALL poder filtrarse por una categoría, mostrando solo los productos de esa categoría.

#### Scenario: Filtrar por categoría
- **WHEN** un cliente filtra por la categoría "Blusas"
- **THEN** solo ve productos de la categoría "Blusas"

### Requirement: Filtro por talla y color en la misma variante
El listado SHALL poder filtrarse por talla, por color o por ambos. Con ambos, un producto MUST aparecer solo si tiene una misma variante con esa talla y ese color. La comparación de color MUST ignorar mayúsculas y minúsculas.

#### Scenario: Filtrar solo por talla
- **WHEN** un cliente filtra por talla M
- **THEN** solo ve productos con al menos una variante en talla M

#### Scenario: Filtrar por talla y color existentes en la misma variante
- **WHEN** un cliente filtra por talla M y color "Negro" y un producto tiene la variante M "Negro"
- **THEN** ese producto aparece en el listado

#### Scenario: Talla y color solo en variantes distintas
- **WHEN** un cliente filtra por talla M y color "Negro" y un producto tiene las variantes M "Blanco" y G "Negro", pero no M "Negro"
- **THEN** ese producto no aparece en el listado

#### Scenario: Color con distinta capitalización
- **WHEN** un cliente filtra por color "negro" y un producto tiene una variante de color "Negro"
- **THEN** ese producto aparece en el listado

### Requirement: Filtro por rango de precio
El listado SHALL poder filtrarse por precio mínimo, máximo o ambos, expresados en pesos enteros e inclusivos, comparados contra el precio base del producto.

#### Scenario: Filtrar por rango de precio
- **WHEN** un cliente filtra con mínimo 200 y máximo 500 pesos
- **THEN** solo ve productos con precio base entre $200.00 y $500.00 MXN, incluidos ambos extremos

#### Scenario: Solo precio mínimo
- **WHEN** un cliente filtra solo con mínimo 300 pesos
- **THEN** solo ve productos con precio base de $300.00 MXN o más

### Requirement: Combinación de filtros
Todos los filtros activos SHALL aplicarse a la vez: un producto MUST cumplir cada uno para aparecer. Los filtros MUST quedar reflejados en la dirección de la página para poder compartirla o recargarla con el mismo resultado.

#### Scenario: Categoría, talla y precio juntos
- **WHEN** un cliente filtra por categoría "Pantalones", talla G y máximo 600 pesos
- **THEN** solo ve pantalones con variante en talla G y precio base de $600.00 MXN o menos

#### Scenario: Recargar con filtros
- **WHEN** un cliente recarga o comparte la dirección de un listado filtrado
- **THEN** quien la abre ve el mismo resultado con los mismos filtros seleccionados

### Requirement: Valores de filtro inválidos
El sistema SHALL ignorar cada valor de filtro inválido, aplicar los filtros válidos restantes y mostrar un aviso en español que indique qué filtro se ignoró. El listado MUST NOT mostrar una página de error por un filtro inválido.

#### Scenario: Precio no numérico o negativo
- **WHEN** un cliente abre el catálogo con precio mínimo "abc" o "-50"
- **THEN** el filtro de precio mínimo se ignora, se aplican los demás filtros y se muestra un aviso

#### Scenario: Mínimo mayor que máximo
- **WHEN** un cliente filtra con mínimo 800 y máximo 300 pesos
- **THEN** el filtro de rango de precio se ignora y se muestra un aviso de rango inválido

#### Scenario: Categoría inexistente
- **WHEN** un cliente abre el catálogo filtrando por una categoría que no existe
- **THEN** el filtro de categoría se ignora y se muestra un aviso de categoría no encontrada

#### Scenario: Talla fuera de la lista
- **WHEN** un cliente filtra por talla "XXL"
- **THEN** el filtro de talla se ignora y se muestra un aviso

### Requirement: Listado sin resultados
Cuando ningún producto cumple los filtros, el listado SHALL mostrar un mensaje en español indicando que no hay productos y una forma de quitar los filtros.

#### Scenario: Filtros sin coincidencias
- **WHEN** un cliente aplica filtros válidos que ningún producto cumple
- **THEN** ve el mensaje de que no hay productos con esos filtros y un enlace para ver todo el catálogo

### Requirement: Detalle de producto
El sistema SHALL mostrar una página pública por producto, identificada por un slug único, con su nombre, descripción, categoría, precio, imágenes y las tallas y colores de sus variantes.

#### Scenario: Ver detalle
- **WHEN** un cliente abre el detalle de un producto existente con variantes
- **THEN** ve su nombre, descripción, categoría, precio, imágenes, las tallas disponibles en orden CH, M, G, XG y los colores disponibles

#### Scenario: Producto inexistente
- **WHEN** un cliente abre el detalle con un slug que no corresponde a ningún producto
- **THEN** ve una página de "producto no encontrado" en español con respuesta 404

#### Scenario: Producto sin variantes
- **WHEN** un cliente abre el detalle de un producto que no tiene variantes
- **THEN** ve la misma página de "producto no encontrado" con respuesta 404
