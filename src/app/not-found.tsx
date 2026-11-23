import type { Metadata } from "next";
import { ProductoNoEncontrado } from "@/components/producto-no-encontrado";

// 404 de toda la tienda. El Proxy (src/proxy.ts) manda aquí los productos
// inexistentes para que la respuesta salga con estado 404 real.
export const metadata: Metadata = { title: "No encontrado · Boutique" };

export default function NotFound() {
  return <ProductoNoEncontrado />;
}
