import type { NextRequest } from "next/server";
import { z } from "zod";
import { supabaseServicio } from "@/lib/supabase/server";
import { avisarAppsScript, dentroDelLimite, json, origenValido } from "@/lib/servidor";
import { mensajeError } from "@/lib/validacion";

const token = z.string().regex(/^[a-f0-9]{48}$/);
const accion = z.discriminatedUnion("accion", [
  z.object({ accion: z.literal("cancelar") }),
  z.object({ accion: z.literal("reprogramar"), inicio: z.string().datetime({ offset: true }) }),
]);

/** GET: datos mínimos de la cita del enlace. POST: cancelar o reprogramar según la política configurada. */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/citas/[token]">) {
  const { token: t } = await ctx.params;
  if (!token.safeParse(t).success) return json({ error: "Enlace no válido" }, 404);
  if (!(await dentroDelLimite(req, "cita-consulta", 30, 600))) return json({ error: "Demasiadas consultas" }, 429);
  const { data } = await supabaseServicio().rpc("cita_por_token", { p_token: t });
  if (!data) return json({ error: "No encontramos la cita" }, 404);
  return json(data);
}

export async function POST(req: NextRequest, ctx: RouteContext<"/api/citas/[token]">) {
  const { token: t } = await ctx.params;
  if (!origenValido(req)) return json({ error: "Origen no permitido" }, 403);
  if (!token.safeParse(t).success) return json({ error: "Enlace no válido" }, 404);
  if (!(await dentroDelLimite(req, "cita-cambio", 10, 600))) return json({ error: "Demasiados intentos" }, 429);

  const p = accion.safeParse(await req.json().catch(() => null));
  if (!p.success) return json({ error: "Solicitud no válida" }, 400);

  const sb = supabaseServicio();
  const r = p.data.accion === "cancelar"
    ? await sb.rpc("cancelar_por_token", { p_token: t })
    : await sb.rpc("reprogramar_por_token", { p_token: t, p_nuevo_inicio: p.data.inicio });
  if (r.error) {
    const conflicto = r.error.message.includes("HORARIO_NO_DISPONIBLE");
    return json({ error: mensajeError(r.error.message) }, conflicto ? 409 : 422);
  }
  await avisarAppsScript(p.data.accion === "cancelar" ? "cancelacion" : "reprogramacion", { codigo: (r.data as { codigo: string }).codigo });
  return json(r.data);
}
