import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isVisibleProductSlug } from "@/lib/catalogo/consultas";

// Con Cache Components, notFound() en el detalle llega después del armazón y la
// respuesta queda en 200. Aquí se revisa el slug antes de renderizar. Si el
// producto no es visible, se reescribe a una ruta que no existe: Next sirve
// entonces src/app/not-found.tsx con estado 404 real (design.md §7).
// Nota: el `status` de NextResponse.rewrite se ignora si el destino es una
// página existente, por eso el destino es una ruta inexistente.
const RUTA_INEXISTENTE = "/__producto-no-encontrado__";

export async function proxy(request: NextRequest) {
  let slug: string | null;
  try {
    slug = decodeURIComponent(request.nextUrl.pathname.split("/")[2] ?? "");
  } catch {
    slug = null; // URL mal formada (p. ej. "%E0"): se trata como inexistente.
  }
  if (slug && (await isVisibleProductSlug(db, slug))) return NextResponse.next();
  return NextResponse.rewrite(new URL(RUTA_INEXISTENTE, request.url));
}

export const config = {
  matcher: "/productos/:slug",
};
