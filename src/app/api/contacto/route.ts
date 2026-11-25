import type { NextRequest } from "next/server";
import { esquemaContacto } from "@/lib/validacion";
import { supabaseServicio } from "@/lib/supabase/server";
import { avisarAppsScript, dentroDelLimite, json, origenValido, registrarError } from "@/lib/servidor";

export async function POST(req: NextRequest) {
  if (!origenValido(req)) return json({ error: "Origen no permitido" }, 403);
  if (!(await dentroDelLimite(req, "contacto", 4, 600))) return json({ error: "Demasiados mensajes. Intente más tarde." }, 429);
  const p = esquemaContacto.safeParse(await req.json().catch(() => null));
  if (!p.success) return json({ error: "Revise los datos del formulario.", campos: p.error.flatten().fieldErrors }, 422);
  if (p.data.sitio_web) return json({ error: "Solicitud no válida" }, 400);
  const { sitio_web: _trampa, ...datos } = p.data;
  void _trampa;
  const { error } = await supabaseServicio().from("mensajes_contacto").insert({ ...datos, email: datos.email || null });
  if (error) {
    await registrarError("api-contacto", error.message);
    return json({ error: "No pudimos enviar su mensaje. Escríbanos por WhatsApp." }, 500);
  }
  await avisarAppsScript("mensaje", { nombre: datos.nombre, motivo: datos.motivo });
  return json({ ok: true }, 201);
}
