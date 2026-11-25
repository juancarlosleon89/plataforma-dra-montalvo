import type { NextRequest } from "next/server";
import { esquemaReserva, mensajeError } from "@/lib/validacion";
import { supabaseServicio } from "@/lib/supabase/server";
import { avisarAppsScript, dentroDelLimite, json, origenValido, registrarError } from "@/lib/servidor";
import { env } from "@/lib/env";

/**
 * POST /api/reservas — crea una cita.
 * Capas: origen (CSRF) → límite por IP → validación (zod) → función `reservar_cita`
 * en la base de datos (candado + restricción de exclusión: nunca dos citas en el mismo horario).
 */
export async function POST(req: NextRequest) {
  if (!origenValido(req)) return json({ error: "Origen no permitido" }, 403);
  if (!(await dentroDelLimite(req, "reserva", 5, 600))) {
    return json({ error: "Demasiados intentos. Espere unos minutos o escríbanos por WhatsApp." }, 429);
  }

  const cuerpo = await req.json().catch(() => null);
  const p = esquemaReserva.safeParse(cuerpo);
  if (!p.success) {
    return json({ error: "Revise los datos del formulario.", campos: p.error.flatten().fieldErrors }, 422);
  }
  if (p.data.sitio_web) return json({ error: "Solicitud no válida" }, 400);

  const sb = supabaseServicio();
  const { data, error } = await sb.rpc("reservar_cita", {
    p_servicio: p.data.servicio_id,
    p_inicio: p.data.inicio,
    p_nombres: p.data.nombres,
    p_apellidos: p.data.apellidos,
    p_telefono: p.data.telefono,
    p_email: p.data.email,
    p_observaciones: p.data.observaciones,
    p_consentimiento_version: env.consentimientoVersion,
  });

  if (error) {
    const conflicto = error.message.includes("HORARIO_NO_DISPONIBLE");
    if (!conflicto && !error.message.match(/DATOS_INVALIDOS|CONSENTIMIENTO|LIMITE_CITAS/)) {
      await registrarError("api-reservas", error.message);
    }
    return json({ error: mensajeError(error.message), codigo: conflicto ? "HORARIO_NO_DISPONIBLE" : undefined }, conflicto ? 409 : 422);
  }

  const r = data as { cita_id: string; codigo: string; token: string; inicio: string; fin: string; estado: string };
  const enlace = `${env.sitioUrl}/cita/${r.token}`;

  // Correo de confirmación + creación inmediata del evento (si falla, el disparador periódico lo reintenta).
  const aviso = await avisarAppsScript("reserva", { cita_id: r.cita_id, enlace });

  return json({ codigo: r.codigo, inicio: r.inicio, fin: r.fin, estado: r.estado, enlace, correo_enviado: aviso.ok }, 201);
}
