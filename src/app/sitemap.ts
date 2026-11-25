import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { obtenerServicios } from "@/lib/datos";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = ["", "/agendar", "/privacidad"].map((r) => ({
    url: `${env.sitioUrl}${r}`, changeFrequency: "weekly", priority: r === "" ? 1 : 0.7,
  }));
  try {
    const { servicios } = await obtenerServicios();
    return [...base, ...servicios.map((s) => ({ url: `${env.sitioUrl}/tratamientos/${s.slug}`, changeFrequency: "monthly" as const, priority: 0.6 }))];
  } catch {
    return base;
  }
}
