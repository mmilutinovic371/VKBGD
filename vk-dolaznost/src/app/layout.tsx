import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dolaznost — VK Beograd",
  description: "Najava dolaska i evidencija prisustva za vaterpolo ekipu.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr-Latn">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
