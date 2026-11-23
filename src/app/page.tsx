import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">Boutique</h1>
      <p className="max-w-md text-neutral-600">
        Ropa y prendas para todos los días. Cada parte de la tienda se
        construye a partir de sus specs en <code>openspec/</code>.
      </p>
      <Link
        href="/catalogo"
        className="rounded bg-neutral-900 px-5 py-2.5 text-white hover:bg-neutral-700"
      >
        Ver el catálogo
      </Link>
    </main>
  );
}
