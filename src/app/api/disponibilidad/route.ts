import type { NextRequest } from "next/server";
import { z } from "zod";
import { supabasePublico } from "@/lib/supabase/server";
import { json } from "@/lib/servidor";
import { diaLocal, sumarDias } from "@/lib/formato";

const consulta = z.object({
  servicio: z.string().uuid(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/**
 * GET /api/disponibilidad?servicio=<uuid>&fecha=AAAA-MM-DD → horarios libres de ese día
 * GET /api/disponibilidad?servicio=<uuid>&desde=AAAA-MM-DD → días con horarios (próximas 6 semanas)
 * Se calcula en la base de datos en cada consulta (tiempo real, sin caché).
 */
export async function GET(req: NextRequest) {
  const p = consulta.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!p.success) return json({ error: "Parámetros no válidos" }, 400);
  const sb = supabasePublico();

  if (p.data.fecha) {
    const { data, error } = await sb.rpc("disponibilidad_publica", { p_servicio: p.data.servicio, p_fecha: p.data.fecha });
    if (error) return json({ error: "No se pudo consultar la disponibilidad" }, 502);
    return json({ horarios: (data ?? []).map((h: { slot_inicio: string; slot_fin: string }) => ({ inicio: h.slot_inicio, fin: h.slot_fin })) });
  }

  const desde = p.data.desde ?? diaLocal();
  const { data, error } = await sb.rpc("dias_disponibles", { p_servicio: p.data.servicio, p_desde: desde, p_hasta: sumarDias(desde, 41) });
  if (error) return json({ error: "No se pudo consultar la disponibilidad" }, 502);
  return json({ dias: (data ?? []).map((d: { fecha: string; libres: number }) => ({ fecha: d.fecha, libres: d.libres })) });
}
