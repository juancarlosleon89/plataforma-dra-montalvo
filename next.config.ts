import type { NextConfig } from "next";

/**
 * Configuración de Next.js.
 * Se usa el modelo de caché clásico (sin `cacheComponents`): las páginas públicas
 * se regeneran cada 60 s y al instante cuando el panel guarda cambios (revalidatePath).
 */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : "localhost";

const seguridad = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }],
  },
  async redirects() {
    // La página con el listado de tratamientos se retiró: los tratamientos se muestran en el inicio.
    return [{ source: "/tratamientos", destination: "/#servicios", permanent: true }];
  },
  async headers() {
    return [{ source: "/:path*", headers: seguridad }];
  },
  turbopack: {
    rules: { "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" } },
  },
};

export default nextConfig;
