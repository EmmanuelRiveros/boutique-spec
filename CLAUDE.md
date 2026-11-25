@AGENTS.md

# Boutique — contexto para Claude Code

Proyecto escolar: tienda en línea de ropa y prendas. **El objetivo principal es demostrar el flujo de desarrollo guiado por specs (SDD) con OpenSpec**, no solo tener la tienda. Responde al equipo en español.

## Regla de oro

Nada se programa sin una spec aprobada. Cada funcionalidad pasa por el ciclo de OpenSpec y el equipo revisa la propuesta **antes** de implementar. No te saltes la revisión aunque te pidan "hazlo todo".

Ciclo por cambio:
1. `/openspec-explore` — entender el problema (sin código)
2. `/openspec-propose <nombre>` — proposal.md, specs/, design.md, tasks.md
3. **Revisión del equipo** — esperar aprobación explícita
4. `/openspec-apply-change` — implementar; primero la prueba del escenario, luego el código
5. `/openspec-verify-change` — confirmar que se cumplen los escenarios
6. `/openspec-archive-change` — archivar (las specs pasan a `openspec/specs/`) y hacer un commit propio

El contexto del dominio, convenciones y reglas de las specs están en `openspec/config.yaml`. Léelo antes de proponer.

## Estado actual

- [x] **Fase 0 — Preparación**: Next.js 16 + TS + Tailwind 4, Prisma 7.10.1 con `@prisma/adapter-libsql`, Vitest, OpenSpec 2.x inicializado (specs en español).
- [ ] **Fase 1 — Cambios con OpenSpec** (en este orden):
  1. [x] `catalogo-productos` — productos, categorías, variantes (talla + color, SKU), filtros. Archivado en `openspec/changes/archive/2026-11-23-catalogo-productos/`; spec viva en `openspec/specs/catalogo-productos/`.
  2. [~] `inventario` — stock por variante; no vender sin stock. Implementado y verificado localmente; **falta aprobación del equipo y archivar** (`/openspec-archive-change`). Agrega `Variant.stock` (MODIFIED de la spec del catálogo); lógica en `src/lib/inventario/`.
  3. `carrito` — agregar/quitar, cantidades, validar stock
  4. `checkout-pedidos` — datos de envío, pago simulado, estados del pedido
  5. `panel-admin` — CRUD de productos y cambio de estado de pedidos
  6. `descuentos` — cupones/rebajas; **modifica** la spec de checkout ya archivada (sección MODIFIED). Es el cambio clave para la demo porque muestra cómo evolucionan las specs.
- [ ] **Fase 2 — Cierre**: pruebas Vitest ligadas a escenarios WHEN/THEN; README de evidencia (specs vivas, carpeta archive, historial git).
- [ ] **Fase 3 — Despliegue** (solo el día de entrega): Vercel + Turso.

Actualiza esta lista al terminar cada cambio.

## Decisiones técnicas ya tomadas

- **Prisma 7.10.1 (estable)**, no la 8 (está en release candidate). Config en `prisma.config.ts`; cliente generado en `src/generated/prisma` (se regenera con `npm install` por el `postinstall`).
- **Un solo cliente de BD** en `src/lib/db.ts` con el adaptador libSQL:
  - Local: `DATABASE_URL="file:./dev.db"` (SQLite en archivo, funciona sin internet)
  - Entrega: `DATABASE_URL="libsql://<db>.turso.io"` + `DATABASE_AUTH_TOKEN`
- Sin Google Fonts (fuentes del sistema) para que el build no dependa de la red.
- Precios en centavos (entero), moneda MXN.
- Lógica de negocio en `src/lib/<capacidad>/`, probable sin la interfaz; mutaciones con Server Actions.
- Pruebas en `tests/`, una por escenario de la spec. Usan una base aparte (`test.db`) que se recrea en cada corrida (`tests/helpers/global-setup.ts`).
- **Cache Components está activo**: un `notFound()` al momento de la petición responde 200. Para un 404 real se usa `src/proxy.ts`, que reescribe a una ruta inexistente (ver el design archivado de `catalogo-productos`). El detalle de producto usa `"use cache"` con la etiqueta `catalogo`; quien edite productos debe llamar a `revalidateTag("catalogo")`.
- El equipo trabaja en Windows (PowerShell).

## Comandos

```powershell
npm install
npm run dev          # http://localhost:3000
npm test
npm run build
npm run db:migrate   # prisma migrate dev (necesita .env; copia .env.example)
npm run db:seed      # datos de ejemplo del catálogo (se puede repetir)
openspec list        # cambios en curso
openspec validate --all
```
