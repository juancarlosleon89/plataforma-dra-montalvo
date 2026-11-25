"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { leerCampos, mensajeBD, requerirPersonal } from "@/lib/admin";
import { supabaseServicio, supabaseServidor } from "@/lib/supabase/server";
import { avisarAppsScript } from "@/lib/servidor";
import { env } from "@/lib/env";
import { ENTIDADES, type NombreEntidad } from "./entidades";
import { TEXTOS, type ClaveTexto } from "@/lib/textos";

export type Resultado = { ok: boolean; mensaje: string } | null;
const ok = (mensaje = "Cambios guardados.") => ({ ok: true, mensaje });
const fallo = (e: unknown) => ({ ok: false, mensaje: mensajeBD(e instanceof Error ? e.message : String(e)) });

function regenerar(rutas: string[]) {
  rutas.forEach((r) => revalidatePath(r));
  revalidatePath("/admin", "layout");
}

/* ---------- CRUD genérico (cada tabla protegida además por RLS) ---------- */
export async function guardar(entidad: NombreEntidad, id: string | null, _prev: Resultado, fd: FormData): Promise<Resultado> {
  const def = ENTIDADES[entidad];
  if (!def) return { ok: false, mensaje: "Entidad desconocida" };
  try {
    const { sb } = await requerirPersonal(def.rol);
    const datos = leerCampos(fd, def.campos);
    if (entidad === "horarios" && datos.hora_inicio && datos.hora_fin && String(datos.hora_fin) <= String(datos.hora_inicio)) throw new Error("La hora final debe ser posterior a la inicial.");
    const q = "unico" in def && def.unico
      ? sb.from(def.tabla).update(datos).eq("id", 1)
      : id ? sb.from(def.tabla).update(datos).eq("id", id) : sb.from(def.tabla).insert(datos);
    const { error } = await q;
    if (error) throw new Error(error.message);
    if (entidad === "servicios" && id) {
      const dias = fd.getAll("dias").map(Number);
      await sb.from("servicio_dias").delete().eq("servicio_id", id);
      if (dias.length && dias.length < 7) await sb.from("servicio_dias").insert(dias.map((d) => ({ servicio_id: id, dia_semana: d })));
    }
    regenerar(def.revalidar);
    return ok(id || ("unico" in def && def.unico) ? "Cambios guardados." : "Registro creado.");
  } catch (e) { return fallo(e); }
}

export async function eliminar(entidad: NombreEntidad, id: string, volverA?: string) {
  const def = ENTIDADES[entidad];
  const { sb } = await requerirPersonal(def.rol);
  const { error } = await sb.from(def.tabla).delete().eq("id", id);
  if (error) redirect(`${volverA ?? "/admin"}?error=${encodeURIComponent(mensajeBD(error.message))}`);
  regenerar(def.revalidar);
  if (volverA) redirect(volverA);
}

/* ---------- Citas ---------- */
const ESTADOS = ["pendiente", "confirmada", "cancelada", "atendida", "no_asistio"] as const;

export async function cambiarEstadoCita(id: string, estado: (typeof ESTADOS)[number]) {
  if (!ESTADOS.includes(estado)) return;
  const { sb } = await requerirPersonal();
  const extra = estado === "cancelada" ? { cancelada_por: "consultorio" } : {};
  const { data, error } = await sb.from("citas").update({ estado, ...extra }).eq("id", id).select("codigo").single();
  if (error) redirect(`/admin/citas/${id}?error=${encodeURIComponent(mensajeBD(error.message))}`);
  await avisarAppsScript(estado === "cancelada" ? "cancelacion" : "cambio_estado", { codigo: data?.codigo });
  regenerar(["/agendar"]);
  redirect(`/admin/citas/${id}?ok=${encodeURIComponent("Estado actualizado.")}`);
}

export async function reprogramarCita(id: string, _prev: Resultado, fd: FormData): Promise<Resultado> {
  try {
    const { sb } = await requerirPersonal();
    const dia = String(fd.get("dia") ?? ""), hm = String(fd.get("hora") ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dia) || !/^\d{2}:\d{2}$/.test(hm)) throw new Error("Elija fecha y hora.");
    const { data, error } = await sb.rpc("admin_reprogramar_cita", { p_cita: id, p_nuevo_inicio: `${dia}T${hm}:00-05:00`, p_forzar: fd.get("forzar") === "on" });
    if (error) throw new Error(error.message);
    await avisarAppsScript("reprogramacion", { cita_id: id });
    regenerar(["/agendar"]);
    return ok(`Cita reprogramada al ${dia} ${hm}.` + (data ? "" : ""));
  } catch (e) { return fallo(e); }
}

export async function guardarNotaCita(id: string, _prev: Resultado, fd: FormData): Promise<Resultado> {
  try {
    const { sb } = await requerirPersonal();
    const { error } = await sb.from("citas").update({ observaciones_admin: String(fd.get("observaciones_admin") ?? "").slice(0, 2000) || null }).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath(`/admin/citas/${id}`);
    return ok("Observación guardada.");
  } catch (e) { return fallo(e); }
}

export async function reencolarSincronizacion(id: string) {
  await requerirPersonal();
  // La cola solo la escribe el servidor: se usa la clave de servicio tras verificar la sesión.
  await supabaseServicio().rpc("sync_reencolar", { p_cita: id, p_accion: "actualizar" });
  await avisarAppsScript("sincronizar", {});
  redirect(`/admin/citas/${id}?ok=${encodeURIComponent("Sincronización solicitada.")}`);
}

export async function crearCita(_prev: Resultado, fd: FormData): Promise<Resultado> {
  let nuevaId: string | null = null;
  try {
    const { sb } = await requerirPersonal();
    let paciente = String(fd.get("paciente_id") ?? "");
    if (!paciente) {
      const p = leerCampos(fd, ENTIDADES.pacientes.campos.slice(0, 4));
      const { data, error } = await sb.from("pacientes").insert(p).select("id").single();
      if (error) throw new Error(error.message);
      paciente = data.id;
    }
    const dia = String(fd.get("dia") ?? ""), hm = String(fd.get("hora") ?? "");
    const { data, error } = await sb.rpc("admin_crear_cita", {
      p_paciente: paciente, p_servicio: String(fd.get("servicio_id")), p_inicio: `${dia}T${hm}:00-05:00`,
      p_origen: String(fd.get("origen") ?? "panel"), p_observaciones: String(fd.get("observaciones_admin") ?? "") || null, p_forzar: fd.get("forzar") === "on",
    });
    if (error) throw new Error(error.message);
    nuevaId = data as string;
    await avisarAppsScript("reserva_panel", { cita_id: nuevaId });
    regenerar(["/agendar"]);
  } catch (e) { return fallo(e); }
  redirect(`/admin/citas/${nuevaId}?ok=${encodeURIComponent("Cita creada.")}`);
}

/* ---------- Pacientes / LOPDP ---------- */
export async function anonimizarPaciente(id: string) {
  const { sb } = await requerirPersonal("admin");
  const { error } = await sb.rpc("admin_anonimizar_paciente", { p_paciente: id });
  if (error) redirect(`/admin/pacientes/${id}?error=${encodeURIComponent(mensajeBD(error.message))}`);
  redirect(`/admin/pacientes/${id}?ok=${encodeURIComponent("Datos personales eliminados (anonimizados).")}`);
}

export async function actualizarSolicitud(id: string, _prev: Resultado, fd: FormData): Promise<Resultado> {
  try {
    const { sb } = await requerirPersonal();
    const estado = String(fd.get("estado"));
    const { error } = await sb.from("solicitudes_derechos").update({
      estado, respuesta: String(fd.get("respuesta") ?? "") || null,
      resuelto_en: ["resuelta", "rechazada"].includes(estado) ? new Date().toISOString() : null,
    }).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/privacidad");
    return ok("Solicitud actualizada.");
  } catch (e) { return fallo(e); }
}

export async function marcarMensaje(id: string, estado: "pendiente" | "atendido") {
  const { sb } = await requerirPersonal();
  await sb.from("mensajes_contacto").update({ estado }).eq("id", id);
  revalidatePath("/admin/mensajes");
}

/* ---------- Usuarios del panel ---------- */
export async function invitarUsuario(_prev: Resultado, fd: FormData): Promise<Resultado> {
  try {
    await requerirPersonal("admin");
    const email = String(fd.get("email") ?? "").trim().toLowerCase();
    const nombre = String(fd.get("nombre") ?? "").trim();
    const rol = fd.get("rol") === "admin" ? "admin" : "recepcion";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !nombre) throw new Error("Escriba nombre y correo válidos.");
    const srv = supabaseServicio();
    const { data, error } = await srv.auth.admin.inviteUserByEmail(email, { redirectTo: `${env.sitioUrl}/auth/confirmar?siguiente=/admin/actualizar-clave` });
    let uid = data?.user?.id;
    if (error) {
      // Si ya existe en Auth, se busca su id
      const lista = await srv.auth.admin.listUsers({ perPage: 1000 });
      uid = lista.data.users.find((u) => u.email?.toLowerCase() === email)?.id;
      if (!uid) throw new Error(error.message);
    }
    const { sb } = await requerirPersonal("admin");
    const { error: e2 } = await sb.from("administradores").upsert({ id: uid, email, nombre, rol, activo: true });
    if (e2) throw new Error(e2.message);
    revalidatePath("/admin/usuarios");
    return ok(`Invitación enviada a ${email}.`);
  } catch (e) { return fallo(e); }
}

export async function cambiarUsuario(id: string, cambios: { rol?: "admin" | "recepcion"; activo?: boolean }) {
  const { sb, yo } = await requerirPersonal("admin");
  if (id === yo.id) redirect(`/admin/usuarios?error=${encodeURIComponent("No puede cambiar su propio rol o acceso.")}`);
  await sb.from("administradores").update(cambios).eq("id", id);
  revalidatePath("/admin/usuarios");
}

/* ---------- Sesión ---------- */
export async function cerrarSesion() {
  const sb = await supabaseServidor();
  await sb.auth.signOut();
  redirect("/admin/login");
}


/* ---------- Textos del sitio ---------- */
/** Guarda los textos enviados. Un texto vacío o igual al original vuelve al valor por defecto. */
export async function guardarTextos(_prev: Resultado, fd: FormData): Promise<Resultado> {
  try {
    const { sb } = await requerirPersonal("admin");
    const cambiar: { id: string; valor: string; actualizado_en: string }[] = [];
    const restaurar: string[] = [];
    for (const [clave, bruto] of fd.entries()) {
      if (!(clave in TEXTOS) || typeof bruto !== "string") continue;
      const valor = bruto.replace(/\r\n/g, "\n").trim();
      if (!valor || valor === TEXTOS[clave as ClaveTexto].v) restaurar.push(clave);
      else cambiar.push({ id: clave, valor: valor.slice(0, 4000), actualizado_en: new Date().toISOString() });
    }
    if (cambiar.length) {
      const { error } = await sb.from("textos_sitio").upsert(cambiar);
      if (error) throw new Error(error.message);
    }
    if (restaurar.length) {
      const { error } = await sb.from("textos_sitio").delete().in("id", restaurar);
      if (error) throw new Error(error.message);
    }
    revalidatePath("/", "layout");
    return ok("Textos guardados. Ya se ven en el sitio.");
  } catch (e) { return fallo(e); }
}
