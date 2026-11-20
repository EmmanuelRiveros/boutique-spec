import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Boutique",
  description: "Tienda de ropa y prendas — proyecto con desarrollo guiado por specs (OpenSpec)",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
