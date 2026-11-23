import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/catalogo";
import { getCachedProduct, getCachedProductSlugs } from "@/lib/catalogo/cache";

export async function generateStaticParams() {
  const slugs = await getCachedProductSlugs();
  // Con Cache Components debe haber al menos un parámetro; el marcador responde 404.
  return slugs.length > 0 ? slugs.map((slug) => ({ slug })) : [{ slug: "__sin-productos__" }];
}

export default async function ProductoPage({ params }: PageProps<"/productos/[slug]">) {
  const { slug } = await params;
  const product = await getCachedProduct(slug);
  if (!product) notFound();

  const [principal, ...resto] = product.images;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-6 sm:p-8">
      <Link href="/catalogo" className="text-sm text-neutral-600 hover:underline">
        ← Volver al catálogo
      </Link>
      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <div className="space-y-3">
          {principal ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={principal}
              alt={product.name}
              className="aspect-[3/4] w-full rounded-lg bg-neutral-100 object-cover"
            />
          ) : (
            <div className="aspect-[3/4] w-full rounded-lg bg-neutral-100" />
          )}
          {resto.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {resto.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={url} src={url} alt="" className="aspect-[3/4] w-full rounded bg-neutral-100 object-cover" />
              ))}
            </div>
          )}
        </div>
        <div className="space-y-4">
          <Link
            href={`/catalogo?categoria=${product.category.slug}`}
            className="text-sm uppercase tracking-wide text-neutral-500 hover:underline"
          >
            {product.category.name}
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight">{product.name}</h1>
          <p className="text-2xl">{formatPrice(product.priceCents)}</p>
          <p className="text-neutral-700">{product.description}</p>
          <section>
            <h2 className="mb-2 text-sm font-medium">Tallas disponibles</h2>
            <ul className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <li key={s} className="rounded border border-neutral-300 px-3 py-1 text-sm">
                  {s}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="mb-2 text-sm font-medium">Colores disponibles</h2>
            <ul className="flex flex-wrap gap-2">
              {product.colors.map((c) => (
                <li key={c} className="rounded border border-neutral-300 px-3 py-1 text-sm">
                  {c}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
