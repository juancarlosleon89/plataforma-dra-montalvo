import type { Metadata, Viewport } from "next";
import "./globals.css";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(env.sitioUrl),
  title: {
    default: "Dra. Monserrath Montalvo · Prótesis y Rehabilitación Oral en Ambato",
    template: "%s · Dra. Monserrath Montalvo",
  },
  description:
    "Consultorio de la Dra. Monserrath Montalvo, especialista en rehabilitación oral en Ambato: prótesis dentales, diseño de sonrisa y estética dental. Agende su cita en línea.",
  openGraph: { type: "website", locale: "es_EC", siteName: "Dra. Monserrath Montalvo", images: ["/img/doctora-bata.webp"] },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#efeee9", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-EC">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;1,6..72,300;1,6..72,400&family=Zalando+Sans:wght@400;500;600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
