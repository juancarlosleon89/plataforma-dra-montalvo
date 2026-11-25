import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { supabaseServicio } from "@/lib/supabase/server";

export const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });

export function ipCliente(req: NextRequest) {
  return (req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "local").trim();
}

/** Protección CSRF para formularios públicos: el origen debe ser el propio sitio. */
export function origenValido(req: NextRequest) {
  const origen = req.headers.get("origin");
  if (!origen) return true; // peticiones del mismo origen sin cabecera (algunos navegadores)
  try {
    const host = new URL(origen).host;
    return host === req.headers.get("host") || host === new URL(env.sitioUrl).host;
  } catch {
    return false;
  }
}

/** Límite de solicitudes por IP y acción (tabla en Supabase, compartida entre instancias). */
export async function dentroDelLimite(req: NextRequest, accion: string, maximo: number, ventanaSeg: number) {
  let sb;
  try { sb = supabaseServicio(); } catch (e) { console.error(`[limite] ${(e as Error).message}`); return true; }
  const { data, error } = await sb.rpc("verificar_limite", {
    p_clave: `${accion}:${ipCliente(req)}`, p_maximo: maximo, p_ventana_segundos: ventanaSeg,
  });
  if (error) { console.error(`[limite] ${error.message}`); return true; } // si falla el contador no se bloquea al paciente; queda el resto de validaciones
  return data === true;
}

export async function registrarError(origen: string, mensaje: string, detalle?: unknown) {
  console.error(`[${origen}] ${mensaje}`);
  try {
    await supabaseServicio().from("registro_errores").insert({ origen, mensaje: mensaje.slice(0, 500), detalle: detalle ?? null });
  } catch {
    /* no interrumpir la respuesta al paciente */
  }
}

/**
 * Avisa a Google Apps Script para que sincronice al instante y envíe el correo.
 * Si falla, la cita ya está guardada: el disparador periódico de Apps Script la
 * sincroniza después (reintentos con espera exponencial).
 */
export async function avisarAppsScript(evento: string, datos: Record<string, unknown>) {
  if (!env.appsScriptUrl || !env.appsScriptSecret) return { ok: false, motivo: "sin-configurar" };
  try {
    const r = await fetch(env.appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secreto: env.appsScriptSecret, evento, ...datos }),
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });
    const cuerpo = await r.json().catch(() => ({}));
    if (!r.ok || cuerpo?.ok === false) throw new Error(cuerpo?.error ?? `HTTP ${r.status}`);
    return { ok: true };
  } catch (e) {
    await registrarError("api-apps-script", `Aviso "${evento}" no entregado: ${(e as Error).message}`, { evento });
    return { ok: false, motivo: (e as Error).message };
  }
}
