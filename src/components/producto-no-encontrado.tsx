import Link from "next/link";

/**
 * Mensaje de "no encontrado". Lo usan el not-found raíz (al que el Proxy manda
 * los productos inexistentes con estado 404) y el not-found del detalle.
 */
export function ProductoNoEncontrado() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Producto no encontrado</h1>
      <p className="max-w-md text-neutral-600">
        El producto o la página que buscas no existe o ya no está disponible.
      </p>
      <Link href="/catalogo" className="rounded bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-700">
        Ver el catálogo
      </Link>
    </main>
  );
}
