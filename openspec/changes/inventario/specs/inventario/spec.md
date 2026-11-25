# Spec Delta

## ADDED Requirements

### Requirement: Existencias por variante
Cada variante SHALL tener una cantidad de existencias almacenada como número entero no negativo. Una variante nueva MUST iniciar con cero existencias salvo que el proceso de carga de datos le asigne una cantidad explícita.

#### Scenario: Variante nueva sin stock asignado
- **WHEN** se registra una variante sin especificar existencias
- **THEN** la variante queda registrada con stock igual a cero

#### Scenario: Consultar existencias de una variante
- **WHEN** se consultan las existencias de una variante existente
- **THEN** el sistema devuelve la cantidad entera almacenada para esa variante

#### Scenario: Consultar variante inexistente
- **WHEN** se consultan las existencias usando un identificador de variante inexistente
- **THEN** el sistema devuelve un error de variante inexistente y no crea registros

### Requirement: Establecer existencias
El sistema SHALL permitir establecer la cantidad absoluta de existencias de una variante mediante lógica de dominio. La cantidad MUST ser un entero mayor o igual a cero.

#### Scenario: Establecer existencias válidas
- **WHEN** se establece el stock de una variante en 12 unidades
- **THEN** la variante queda con exactamente 12 unidades disponibles

#### Scenario: Establecer stock en cero
- **WHEN** se establece el stock de una variante en cero
- **THEN** la variante queda sin unidades disponibles

#### Scenario: Rechazar cantidad inválida al establecer stock
- **WHEN** se intenta establecer el stock con un valor negativo, fraccionario, no numérico o no finito
- **THEN** el sistema rechaza la operación y conserva las existencias anteriores

### Requirement: Aumentar existencias
El sistema SHALL permitir aumentar las existencias de una variante mediante una cantidad entera positiva.

#### Scenario: Aumento válido de existencias
- **WHEN** una variante tiene 5 unidades y se aumentan 3 unidades
- **THEN** la variante queda con 8 unidades

#### Scenario: Rechazar aumento inválido
- **WHEN** se intenta aumentar existencias con cero, un valor negativo o una cantidad no entera
- **THEN** el sistema rechaza la operación y conserva las existencias anteriores

### Requirement: Disminuir existencias sin permitir valores negativos
El sistema SHALL permitir disminuir las existencias de una variante solo cuando la cantidad a descontar sea un entero positivo y no supere el stock actual. La operación MUST evitar que el stock quede negativo.

#### Scenario: Disminución válida
- **WHEN** una variante tiene 8 unidades y se descuentan 3 unidades
- **THEN** la variante queda con 5 unidades

#### Scenario: Descuento igual al stock disponible
- **WHEN** una variante tiene 4 unidades y se descuentan 4 unidades
- **THEN** la variante queda con cero unidades

#### Scenario: Stock insuficiente para disminuir
- **WHEN** una variante tiene 2 unidades y se intenta descontar 3
- **THEN** el sistema rechaza la operación, informa que el stock es insuficiente y conserva las 2 unidades

#### Scenario: Rechazar disminución inválida
- **WHEN** se intenta disminuir existencias con cero, un valor negativo o una cantidad no entera
- **THEN** el sistema rechaza la operación y conserva las existencias anteriores

### Requirement: Validar disponibilidad solicitada
El sistema SHALL validar que una variante exista, que la cantidad solicitada sea un entero positivo y que las existencias actuales sean iguales o mayores a dicha cantidad. Esta validación MUST NOT modificar el stock.

#### Scenario: Cantidad solicitada disponible
- **WHEN** una variante tiene 6 unidades y se solicitan 4
- **THEN** el sistema indica que la cantidad está disponible y conserva las 6 unidades

#### Scenario: Cantidad solicitada igual al stock
- **WHEN** una variante tiene 6 unidades y se solicitan 6
- **THEN** el sistema indica que la cantidad está disponible y conserva las 6 unidades

#### Scenario: Cantidad solicitada superior al stock
- **WHEN** una variante tiene 3 unidades y se solicitan 4
- **THEN** el sistema indica que no hay existencias suficientes, informa el stock actual y conserva las 3 unidades

#### Scenario: Variante agotada
- **WHEN** una variante tiene cero unidades y se solicita al menos una
- **THEN** el sistema indica que la variante no está disponible y conserva el stock en cero

#### Scenario: Cantidad solicitada inválida
- **WHEN** se solicita una cantidad igual a cero, negativa, fraccionaria o no numérica
- **THEN** el sistema rechaza la validación con un error de cantidad inválida y no modifica el stock

### Requirement: Datos de ejemplo de inventario
El proceso de carga de datos de ejemplo SHALL asignar cantidades explícitas y deterministas a las variantes del catálogo. La carga MUST ser idempotente y no aumentar las existencias cada vez que se ejecuta.

#### Scenario: Cargar existencias de ejemplo
- **WHEN** se ejecuta el seed del catálogo
- **THEN** las variantes de ejemplo quedan con las cantidades de stock definidas para cada una

#### Scenario: Ejecutar el seed repetidamente
- **WHEN** se ejecuta el seed dos veces seguidas
- **THEN** cada variante conserva la misma cantidad de ejemplo que quedó después de la primera ejecución
