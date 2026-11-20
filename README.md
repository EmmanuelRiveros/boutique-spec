# Boutique

Tienda de ropa y prendas construida con **desarrollo guiado por specs (SDD)** usando [OpenSpec](https://github.com/Fission-AI/OpenSpec). Nada se programa sin una spec acordada.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4
- Prisma 7 con adaptador libSQL: **SQLite en archivo** en local, **Turso** el día de la entrega (Vercel)
- Vitest para pruebas
- OpenSpec 2.x (skills para Claude Code en `.claude/skills/` y `.agents/skills/`)

## Arrancar en local (Windows)

Requisitos: Node.js 22.20 o superior y Git.

```powershell
npm install          # instala dependencias y genera el cliente de Prisma
copy .env.example .env
npm run dev          # http://localhost:3000
npm test             # pruebas
```

Para usar los comandos de OpenSpec en la terminal (opcional; Claude Code ya trae las skills):

```powershell
npm install -g @fission-ai/openspec@latest
openspec list
```

## Flujo de trabajo (por cada cambio)

| Paso | Skill | Resultado |
|---|---|---|
| 1. Explorar | `/openspec-explore` | Entender el problema, sin tocar código |
| 2. Proponer | `/openspec-propose <idea>` | `proposal.md`, `specs/`, `design.md`, `tasks.md` |
| 3. **Revisión del equipo** | — | Se aprueba la spec antes de programar |
| 4. Implementar | `/openspec-apply-change` | Código + pruebas por escenario |
| 5. Verificar | `/openspec-verify-change` | ¿El código cumple los escenarios? |
| 6. Archivar | `/openspec-archive-change` | La spec pasa a `openspec/specs/` + commit |

## Plan de cambios

1. `catalogo-productos` — productos, categorías, variantes (talla + color), filtros
2. `inventario` — stock por variante; no vender sin stock
3. `carrito` — agregar/quitar, cantidades, validar stock
4. `checkout-pedidos` — datos de envío, pago simulado, estados del pedido
5. `panel-admin` — gestión de productos y estados de pedidos
6. `descuentos` — modifica la spec de checkout ya archivada (demuestra un cambio `MODIFIED`)

## Estructura

```
openspec/
  config.yaml          # contexto del proyecto: stack, convenciones, glosario, reglas
  specs/               # specs vigentes (la "verdad" del sistema)
  changes/             # cambios en curso
    archive/           # cambios terminados, con fecha
prisma/schema.prisma   # modelos (se agregan en cada cambio)
src/lib/db.ts          # cliente de base de datos
tests/                 # pruebas Vitest, ligadas a escenarios de las specs
```

## Despliegue (solo el día de entrega)

1. Crear una base en Turso y obtener URL (`libsql://...`) y token.
2. Aplicar el esquema a Turso.
3. En Vercel, importar el repo y definir `DATABASE_URL` y `DATABASE_AUTH_TOKEN`.
