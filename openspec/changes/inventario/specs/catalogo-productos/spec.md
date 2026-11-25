# Spec Delta

## RENAMED Requirements
- FROM: `### Requirement: Variante identificada por talla, color y SKU`
- TO: `### Requirement: Variante identificada por talla, color, SKU y existencias`

## MODIFIED Requirements

### Requirement: Variante identificada por talla, color, SKU y existencias
Cada variante SHALL pertenecer a un producto y tener una talla, un color, un SKU y una cantidad de existencias. El SKU MUST ser único en todo el catálogo, un producto MUST NOT tener dos variantes con la misma talla y el mismo color, y las existencias MUST ser un número entero no negativo. Una variante nueva MUST iniciar con cero existencias cuando no se indique una cantidad explícita.

#### Scenario: Variante válida
- **WHEN** se registra la variante talla M, color "Negro", SKU "BLU-LIN-M-NEG" para un producto sin especificar stock
- **THEN** la variante queda asociada a ese producto con esos datos y stock igual a cero

#### Scenario: Variante con existencias iniciales
- **WHEN** se registra una variante válida con 7 unidades de stock
- **THEN** la variante queda asociada al producto con 7 unidades disponibles

#### Scenario: SKU duplicado
- **WHEN** se intenta registrar una variante con un SKU que ya usa otra variante
- **THEN** el sistema rechaza el registro

#### Scenario: Combinación talla y color repetida
- **WHEN** se intenta registrar una segunda variante talla M y color "Negro" para el mismo producto
- **THEN** el sistema rechaza el registro

#### Scenario: Stock inicial inválido
- **WHEN** se intenta registrar una variante con stock negativo o fraccionario
- **THEN** el sistema rechaza el registro

### Requirement: Datos de ejemplo del catálogo
El sistema SHALL incluir un proceso de carga de datos de ejemplo con al menos 3 categorías y 8 productos con variantes, imágenes y precios distintos, que pueda ejecutarse más de una vez sin duplicar datos. El proceso MUST asignar a cada variante una cantidad de existencias explícita y determinista.

#### Scenario: Carga en base de datos vacía
- **WHEN** se ejecuta la carga de datos de ejemplo sobre una base de datos vacía
- **THEN** el catálogo tiene al menos 3 categorías y 8 productos, cada uno con al menos una variante, y todas las variantes de ejemplo tienen las cantidades de stock definidas por el seed

#### Scenario: Carga repetida
- **WHEN** se ejecuta la carga de datos de ejemplo dos veces seguidas
- **THEN** el número de categorías, productos y variantes, así como el stock de cada variante, es el mismo que tras la primera carga
