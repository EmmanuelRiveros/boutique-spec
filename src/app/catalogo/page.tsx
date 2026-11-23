import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/db";
import {
  formatPrice,
  getCategorySlugs,
  getFilterOptions,
  listCatalogProducts,
  parseCatalogFilters,
  type CatalogFilters,
  type FilterOptions,
} from "@/lib/catalogo";

export const metadata = { title: "Catálogo · Boutique" };

export default function CatalogoPage({ searchParams }: PageProps<"/catalogo">) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 p-6 sm:p-8">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">Catálogo</h1>
      <Suspense fallback={<p className="text-neutral-500">Cargando productos…</p>}>
        <Catalogo searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Catalogo({ searchParams }: { searchParams: PageProps<"/catalogo">["searchParams"] }) {
  const params = await searchParams;
  const { filters, warnings } = parseCatalogFilters(params, await getCategorySlugs(db));
  const [products, options] = await Promise.all([
    listCatalogProducts(db, filters),
    getFilterOptions(db),
  ]);

  return (
    <div className="grid gap-8 md:grid-cols-[16rem_1fr]">
      <FilterForm filters={filters} options={options} />
      <section>
        {warnings.length > 0 && (
          <ul role="alert" className="mb-4 space-y-1 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        )}
        {products.length === 0 ? (
          <div className="rounded border border-dashed border-neutral-300 p-8 text-center">
            <p className="mb-3 text-neutral-700">No hay productos con esos filtros.</p>
            <Link href="/catalogo" className="text-sm underline">
              Ver todo el catálogo
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-6 lg:grid-cols-3">
            {products.map((p) => (
              <li key={p.id}>
                <Link href={`/productos/${p.slug}`} className="group block">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="aspect-[3/4] w-full rounded-lg bg-neutral-100 object-cover"
                    />
                  ) : (
                    <div className="aspect-[3/4] w-full rounded-lg bg-neutral-100" />
                  )}
                  <p className="mt-2 text-xs uppercase tracking-wide text-neutral-500">{p.category.name}</p>
                  <p className="font-medium group-hover:underline">{p.name}</p>
                  <p className="text-neutral-700">{formatPrice(p.priceCents)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const field = "w-full rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm";

function FilterForm({ filters, options }: { filters: CatalogFilters; options: FilterOptions }) {
  return (
    <form method="get" action="/catalogo" className="space-y-4" aria-label="Filtros del catálogo">
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Categoría</span>
        <select name="categoria" defaultValue={filters.categoria ?? ""} className={field}>
          <option value="">Todas</option>
          {options.categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Talla</span>
        <select name="talla" defaultValue={filters.talla ?? ""} className={field}>
          <option value="">Todas</option>
          {options.sizes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Color</span>
        <select name="color" defaultValue={filters.color ?? ""} className={field}>
          <option value="">Todos</option>
          {options.colors.map((c) => (
            <option key={c.key} value={c.key}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="text-sm">
        <legend className="mb-1 font-medium">Precio (MXN)</legend>
        <div className="flex gap-2">
          <input
            name="min"
            type="number"
            min={0}
            step={1}
            placeholder="Mín."
            defaultValue={filters.minPesos}
            className={field}
          />
          <input
            name="max"
            type="number"
            min={0}
            step={1}
            placeholder="Máx."
            defaultValue={filters.maxPesos}
            className={field}
          />
        </div>
      </fieldset>
      <div className="flex items-center gap-3">
        <button type="submit" className="rounded bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700">
          Filtrar
        </button>
        <Link href="/catalogo" className="text-sm underline">
          Quitar filtros
        </Link>
      </div>
    </form>
  );
}
