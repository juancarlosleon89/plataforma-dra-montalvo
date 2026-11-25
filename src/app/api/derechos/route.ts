import type { NextRequest } from "next/server";
import { esquemaDerechos } from "@/lib/validacion";
import { supabaseServicio } from "@/lib/supabase/server";
import { avisarAppsScript, dentroDelLimite, json, origenValido, registrarError } from "@/lib/servidor";

/** Solicitudes de derechos del titular (LOPDP): acceso, rectificación, eliminación, oposición, portabilidad, suspensión. */
export async function POST(req: NextRequest) {
  if (!origenValido(req)) return json({ error: "Origen no permitido" }, 403);
  if (!(await dentroDelLimite(req, "derechos", 3, 3600))) return json({ error: "Demasiadas solicitudes. Intente más tarde." }, 429);
  const p = esquemaDerechos.safeParse(await req.json().catch(() => null));
  if (!p.success) return json({ error: "Revise los datos del formulario.", campos: p.error.flatten().fieldErrors }, 422);
  if (p.data.sitio_web) return json({ error: "Solicitud no válida" }, 400);
  const sb = supabaseServicio();
  const { data: paciente } = await sb.from("pacientes").select("id").ilike("email", p.data.email).neq("estado", "anonimizado").maybeSingle();
  const { error } = await sb.from("solicitudes_derechos").insert({
    paciente_id: paciente?.id ?? null, nombre: p.data.nombre, email: p.data.email,
    telefono: p.data.telefono || null, tipo: p.data.tipo, detalle: p.data.detalle || null,
  });
  if (error) {
    await registrarError("api-derechos", error.message);
    return json({ error: "No pudimos registrar su solicitud. Escríbanos al correo del consultorio." }, 500);
  }
  await avisarAppsScript("derechos", { tipo: p.data.tipo });
  return json({ ok: true }, 201);
}
