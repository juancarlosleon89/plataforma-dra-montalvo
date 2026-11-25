import "server-only";
import { redirect } from "next/navigation";
import { supabaseServidor } from "@/lib/supabase/server";

export type Rol = "admin" | "recepcion";
export type Sesion = { id: string; email: string; nombre: string; rol: Rol };

/** Verifica sesión + registro activo en `administradores`. Redirige si no corresponde. */
export async function requerirPersonal(rolMinimo: Rol = "recepcion"): Promise<{ yo: Sesion; sb: Awaited<ReturnType<typeof supabaseServidor>> }> {
  const sb = await supabaseServidor();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) redirect("/admin/login");
  const { data: a } = await sb.from("administradores").select("id, email, nombre, rol, activo").eq("id", u.user.id).maybeSingle();
  if (!a || !a.activo) redirect("/admin/sin-acceso");
  if (rolMinimo === "admin" && a.rol !== "admin") redirect("/admin?error=permiso");
  return { yo: { id: a.id, email: a.email, nombre: a.nombre, rol: a.rol as Rol }, sb };
}

/* ---------- Lectura de formularios ---------- */
export type TipoCampo = "texto" | "area" | "numero" | "booleano" | "lista" | "seleccion" | "imagen" | "hora" | "fecha" | "fechahora" | "color" | "json";
export type DefCampo = { nombre: string; etiqueta: string; tipo: TipoCampo; opciones?: { valor: string; texto: string }[]; requerido?: boolean; ayuda?: string; ancho?: "completo" };

export function leerCampos(fd: FormData, campos: DefCampo[]) {
  const out: Record<string, unknown> = {};
  for (const c of campos) {
    const v = fd.get(c.nombre);
    const s = typeof v === "string" ? v.trim() : "";
    switch (c.tipo) {
      case "booleano": out[c.nombre] = v === "on" || v === "true"; break;
      case "numero": out[c.nombre] = s === "" ? null : Number(s); break;
      case "lista": out[c.nombre] = s.split("\n").map((x) => x.trim()).filter(Boolean); break;
      case "json": try { out[c.nombre] = s ? JSON.parse(s) : []; } catch { throw new Error(`"${c.etiqueta}" no tiene un formato válido`); } break;
      case "fechahora": out[c.nombre] = s ? `${s}:00-05:00` : null; break;
      default: out[c.nombre] = s === "" ? null : s;
    }
    if (c.requerido && (out[c.nombre] === null || out[c.nombre] === "")) throw new Error(`"${c.etiqueta}" es obligatorio`);
  }
  return out;
}

export const mensajeBD = (m: string) => {
  if (m.includes("HORARIO_NO_DISPONIBLE")) return "Ese horario no está disponible (ocupado, bloqueado o fuera del horario de atención).";
  if (m.includes("citas_sin_solape")) return "Ya existe otra cita activa en ese horario.";
  if (m.includes("violates foreign key") || m.includes("restrict")) return "No se puede eliminar: hay registros que dependen de este elemento. Desactívelo en su lugar.";
  if (m.includes("duplicate key")) return "Ya existe un registro con ese valor (por ejemplo, el mismo identificador o correo).";
  if (m.includes("row-level security") || m.includes("NO_AUTORIZADO")) return "No tiene permiso para esta acción.";
  return m;
};
