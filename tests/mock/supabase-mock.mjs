// =====================================================================
// DOBLE DE PRUEBA de la API de Supabase (PostgREST) — SOLO PARA PRUEBAS.
// Permite compilar y probar la interfaz sin red. No se usa en producción.
// Reproduce las reglas de `disponibilidad` y `reservar_cita` (incluido el
// rechazo de horarios duplicados) con datos iguales a la migración 04.
// Uso: node tests/mock/supabase-mock.mjs  (puerto 54321)
// =====================================================================
import http from "node:http";
import { randomUUID, randomBytes, createHash } from "node:crypto";

const PORT = Number(process.env.MOCK_PORT ?? 54321);
const cat = { consulta: randomUUID(), rehab: randomUUID(), estetica: randomUUID() };
const svc = (slug, categoria_id, nombre, duracion_minutos, destacado, orden, imagen_url, descripcion) => ({
  id: randomUUID(), slug, categoria_id, nombre, descripcion, objetivo: "Objetivo de prueba.", beneficios: ["Beneficio A", "Beneficio B"],
  indicaciones: "Según valoración.", imagen_url, duracion_minutos, precio: null, mostrar_precio: false, reservable: true, destacado, activo: true, orden,
});
const db = {
  configuracion_sitio: [{ id: 1, nombre_comercial: "Dra. Monserrath Montalvo", especialidad: "Prótesis & Rehabilitación Oral", logotipo_url: null, color_acento: "#1d5c66",
    telefono: null, email: null, whatsapp_url: "https://wa.me/message/R7ZAG666US2AF1", whatsapp_numero: null, mensaje_whatsapp: "Hola",
    direccion: "Edificio Movilab 2, calles Quito y Cuenca", referencias: "Edificio de fachada de vidrio.", ciudad: "Ambato, Ecuador",
    maps_query: "Movilab 2, Quito y Cuenca, Ambato", redes: { instagram: "https://www.instagram.com/dra.monsemontalvo/" },
    hero_titulo: "Una sonrisa que vuelve a funcionar, y a sentirse propia.", hero_subtitulo: "Rehabilitación oral y prótesis dentales con un plan pensado para cada sonrisa.", hero_imagen_url: "/img/doctora-bata.webp", redes: { instagram: "https://www.instagram.com/prueba/" }, instagram_publicaciones: ["a","b","c","d","e","f","g"].map((c) => `https://www.instagram.com/reel/${c}${c}${c}/`) }],
  informacion_institucional: [{ id: 1, propuesta: "Rehabilitación oral y prótesis dentales.", presentacion: "Consultorio especializado en rehabilitación oral, prótesis dentales, diseño de sonrisa y estética dental en Ambato.",
    historia: null, mision: null, vision: null, valores: [], diferenciadores: [{ titulo: "Especialista en rehabilitación oral", texto: "La atención la dirige una especialista." }, { titulo: "Valoración antes de tratar", texto: "Plan explicado al paciente." }, { titulo: "Consultorio propio en Ambato", texto: "En Quito y Cuenca." }],
    perfil_nombre: "Dra. Monserrath Montalvo", perfil_titulo: "Especialista en Rehabilitación Oral", perfil_biografia: null, perfil_experiencia: null, perfil_foto_url: "/img/doctora-consultorio.webp",
    perfil_especialidades: ["Prótesis dentales", "Rehabilitación oral", "Diseño de sonrisa", "Estética dental"], perfil_formacion: [], perfil_certificaciones: [], perfil_cursos: [], perfil_enfoque: "Escuchar primero." }],
  configuracion_agenda: [{ id: 1, zona_horaria: "America/Guayaquil", intervalo_minutos: 30, anticipacion_minima_horas: 4, anticipacion_maxima_dias: 60, cancelacion_minima_horas: 24,
    permite_reprogramar: true, confirmacion_automatica: false, politica_cancelacion: "Puede cancelar o reprogramar hasta 24 horas antes.", horarios_provisionales: true }],
  categorias_tratamiento: [{ id: cat.consulta, nombre: "Consulta", orden: 1, activa: true }, { id: cat.rehab, nombre: "Rehabilitación y prótesis", orden: 2, activa: true }, { id: cat.estetica, nombre: "Estética dental", orden: 3, activa: true }],
  servicios: [
    svc("valoracion", cat.consulta, "Valoración y plan de tratamiento", 30, true, 1, "/img/doctora-consultorio.webp", "Primera consulta para revisar el estado de la boca."),
    svc("protesis-fijas", cat.rehab, "Prótesis fijas y coronas", 60, true, 2, "/img/protesis-circonio-detalle.webp", "Restauraciones fijas, incluidas las de circonio."),
    svc("protesis-removibles", cat.rehab, "Prótesis removibles y totales", 60, false, 3, null, "Prótesis parciales o completas."),
    svc("rehabilitacion-oral", cat.rehab, "Rehabilitación oral integral", 60, true, 4, "/img/doctora-bata.webp", "Plan completo para toda la boca."),
    svc("diseno-de-sonrisa", cat.estetica, "Diseño de sonrisa", 60, true, 5, null, "Planificación estética de la sonrisa."),
    svc("estetica-dental", cat.estetica, "Estética dental", 60, false, 6, null, "Mejoras de color y forma."),
  ],
  horarios: [1, 2, 3, 4, 5, 6].map((d) => ({ id: randomUUID(), dia_semana: d, hora_inicio: "09:00:00", hora_fin: "13:00:00", activo: true }))
    .concat([1, 2, 3, 4, 5].map((d) => ({ id: randomUUID(), dia_semana: d, hora_inicio: "15:00:00", hora_fin: "17:30:00", activo: true }))),
  galeria: [
    { id: randomUUID(), imagen_url: "/img/recepcion.webp", titulo: "Recepción", descripcion: "Recepción del consultorio", categoria: "recepcion", orden: 1, publicado: true },
    { id: randomUUID(), imagen_url: "/img/doctora-bata.webp", titulo: "Área de atención", descripcion: "La doctora en la recepción", categoria: "consultorio", orden: 2, publicado: true },
    { id: randomUUID(), imagen_url: "/img/doctora-consultorio.webp", titulo: "Consultorio", descripcion: "Espacio de atención", categoria: "consultorio", orden: 3, publicado: true },
  ],
  faq: [{ id: randomUUID(), pregunta: "¿Cómo agendo una cita?", respuesta: "Desde la sección Agendar.", orden: 1, publicado: true }, { id: randomUUID(), pregunta: "¿Puedo cancelar?", respuesta: "Sí, hasta 24 horas antes.", orden: 2, publicado: true }],
  portafolio: [], testimonios: [], citas: [], pacientes: [], mensajes_contacto: [], solicitudes_derechos: [], registro_errores: [],
};
const limites = new Map();
// Sesión simulada del panel (solo pruebas): token "token-admin-prueba"
const ADMIN = { id: "11111111-1111-1111-1111-111111111111", email: "admin@prueba.local", nombre: "Monserrath Montalvo", rol: "admin", activo: true, creado_en: new Date().toISOString() };
db.administradores = [ADMIN];
db.bloqueos_agenda = []; db.servicio_dias = []; db.autorizaciones_publicacion = []; db.cola_sincronizacion = []; db.calendario_ocupado = [];
db.registro_actividad = [{ fecha: new Date().toISOString(), usuario_email: ADMIN.email, tabla: "servicios", accion: "update", registro_id: "x" }];
db.mensajes_contacto.push({ id: randomUUID(), nombre: "Ana Pérez", telefono: "0991234567", email: "ana@example.com", motivo: "Información de tratamientos", mensaje: "Quisiera saber sobre prótesis.", estado: "pendiente", recibido_en: new Date().toISOString() });
function enriquecer(tabla, filas) {
  if (tabla === "citas") return filas.map((c) => ({ ...c, origen: c.origen ?? "web", sync_estado: c.sync_estado ?? "pendiente", creado_en: c.creado_en ?? new Date().toISOString(),
    servicios: db.servicios.find((s) => s.id === c.servicio_id), pacientes: db.pacientes.find((p) => p.id === c.paciente_id) }));
  if (tabla === "servicios") return filas.map((s) => ({ ...s, categorias_tratamiento: db.categorias_tratamiento.find((c) => c.id === s.categoria_id) ?? null }));
  if (tabla === "pacientes") return filas.map((p) => ({ estado: "activo", creado_en: new Date().toISOString(), consentimiento_en: new Date().toISOString(), consentimiento_version: "2026-11", ...p, citas: [{ count: db.citas.filter((c) => c.paciente_id === p.id).length }] }));
  return filas;
}

const OFF = -5 * 3600e3;
const localParts = (d) => { const x = new Date(d.getTime() + OFF); return { y: x.getUTCFullYear(), m: x.getUTCMonth(), d: x.getUTCDate(), dow: x.getUTCDay() }; };
function disponibilidad(servicioId, fecha, ignorar) {
  const s = db.servicios.find((x) => x.id === servicioId && x.activo && x.reservable); if (!s) return [];
  const cfg = db.configuracion_agenda[0];
  const [Y, M, D] = fecha.split("-").map(Number);
  const dow = new Date(Date.UTC(Y, M - 1, D)).getUTCDay();
  const ahora = Date.now(), min = ahora + cfg.anticipacion_minima_horas * 3600e3, max = ahora + cfg.anticipacion_maxima_dias * 86400e3;
  const out = [];
  for (const h of db.horarios.filter((x) => x.activo && x.dia_semana === dow)) {
    const t0 = Date.parse(`${fecha}T${h.hora_inicio.slice(0, 5)}:00-05:00`), t1 = Date.parse(`${fecha}T${h.hora_fin.slice(0, 5)}:00-05:00`);
    for (let t = t0; t + s.duracion_minutos * 60e3 <= t1; t += cfg.intervalo_minutos * 60e3) {
      const e = t + s.duracion_minutos * 60e3;
      if (t < min || t > max) continue;
      if (db.citas.some((c) => c.id !== ignorar && ["pendiente", "confirmada", "reprogramada"].includes(c.estado) && Date.parse(c.inicio) < e && Date.parse(c.fin) > t)) continue;
      out.push({ slot_inicio: new Date(t).toISOString(), slot_fin: new Date(e).toISOString() });
    }
  }
  return out;
}
const err = (res, status, message, code = "P0001") => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify({ code, message, details: null, hint: null })); };
const ok = (res, data, status = 200) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(data)); };
const hash = (t) => createHash("sha256").update(t).digest("hex");

const RPC = {
  disponibilidad_publica: (b) => disponibilidad(b.p_servicio, b.p_fecha),
  dias_disponibles: (b) => {
    const out = []; let d = new Date(`${b.p_desde}T12:00:00-05:00`);
    for (let i = 0; i < 42; i++) { const p = localParts(d); const f = `${p.y}-${String(p.m + 1).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`; out.push({ fecha: f, libres: disponibilidad(b.p_servicio, f).length }); d = new Date(d.getTime() + 86400e3); }
    return out;
  },
  verificar_limite: (b) => { const n = (limites.get(b.p_clave) ?? 0) + 1; limites.set(b.p_clave, n); return n <= b.p_maximo; },
  reservar_cita: (b) => {
    if (!/^\+?[0-9 ()-]{7,20}$/.test(b.p_telefono)) throw new Error("DATOS_INVALIDOS: telefono");
    const fecha = new Date(Date.parse(b.p_inicio) + OFF).toISOString().slice(0, 10);
    const slot = disponibilidad(b.p_servicio, fecha).find((s) => Date.parse(s.slot_inicio) === Date.parse(b.p_inicio));
    if (!slot) throw new Error("HORARIO_NO_DISPONIBLE");
    let p = db.pacientes.find((x) => x.email === b.p_email.toLowerCase());
    if (!p) { p = { id: randomUUID(), nombres: b.p_nombres, apellidos: b.p_apellidos, telefono: b.p_telefono, email: b.p_email.toLowerCase() }; db.pacientes.push(p); }
    const token = randomBytes(24).toString("hex");
    const c = { id: randomUUID(), codigo: randomBytes(4).toString("hex").toUpperCase(), paciente_id: p.id, servicio_id: b.p_servicio, inicio: slot.slot_inicio, fin: slot.slot_fin, estado: "pendiente", token_hash: hash(token) };
    db.citas.push(c);
    return { cita_id: c.id, codigo: c.codigo, token, inicio: c.inicio, fin: c.fin, estado: c.estado };
  },
  admin_indicadores: () => ({ total: db.citas.length, pendientes: db.citas.filter((c) => c.estado === "pendiente").length, confirmadas: 0, canceladas: db.citas.filter((c) => c.estado === "cancelada").length,
    atendidas: 0, no_asistio: 0, proximas: db.citas.filter((c) => c.estado !== "cancelada").length, pacientes: db.pacientes.length, mensajes_pendientes: 1, solicitudes_pendientes: 0, sync_errores: 0,
    por_semana: [{ semana: "2026-11-16", atendidas: 3, activas: 1, canceladas: 1 }, { semana: "2026-11-23", atendidas: 1, activas: db.citas.length, canceladas: 0 }], por_servicio: [{ servicio: "Valoración y plan de tratamiento", total: db.citas.length }] }),
  cita_por_token: (b) => {
    const c = db.citas.find((x) => x.token_hash === hash(b.p_token)); if (!c) return null;
    const s = db.servicios.find((x) => x.id === c.servicio_id), p = db.pacientes.find((x) => x.id === c.paciente_id);
    return { codigo: c.codigo, inicio: c.inicio, fin: c.fin, estado: c.estado, servicio_id: c.servicio_id, servicio: s.nombre, nombres: p.nombres,
      puede_modificar: ["pendiente", "confirmada", "reprogramada"].includes(c.estado) && Date.parse(c.inicio) - Date.now() >= 24 * 3600e3, puede_reprogramar: true, horas_minimas: 24 };
  },
  cancelar_por_token: (b) => {
    const c = db.citas.find((x) => x.token_hash === hash(b.p_token)); if (!c) throw new Error("CITA_NO_ENCONTRADA");
    if (!["pendiente", "confirmada", "reprogramada"].includes(c.estado)) throw new Error("CITA_NO_MODIFICABLE");
    c.estado = "cancelada"; return { codigo: c.codigo, estado: "cancelada" };
  },
  reprogramar_por_token: (b) => {
    const c = db.citas.find((x) => x.token_hash === hash(b.p_token)); if (!c) throw new Error("CITA_NO_ENCONTRADA");
    const fecha = new Date(Date.parse(b.p_nuevo_inicio) + OFF).toISOString().slice(0, 10);
    const slot = disponibilidad(c.servicio_id, fecha, c.id).find((s) => Date.parse(s.slot_inicio) === Date.parse(b.p_nuevo_inicio));
    if (!slot) throw new Error("HORARIO_NO_DISPONIBLE");
    Object.assign(c, { inicio: slot.slot_inicio, fin: slot.slot_fin, estado: "reprogramada" });
    return { codigo: c.codigo, estado: "reprogramada", inicio: c.inicio, fin: c.fin };
  },
};

function filtrar(rows, params) {
  let out = rows.slice();
  for (const [k, v] of params) {
    if (["select", "order", "limit", "offset"].includes(k)) continue;
    const [op, ...rest] = v.split("."); const val = rest.join(".");
    const cmp = (r) => String(r[k]);
    if (op === "eq") out = out.filter((r) => cmp(r) === val);
    else if (op === "neq") out = out.filter((r) => cmp(r) !== val);
    else if (op === "ilike") out = out.filter((r) => cmp(r).toLowerCase() === val.replace(/\*/g, "").toLowerCase());
    else if (op === "in") { const vals = val.replace(/[()]/g, "").split(","); out = out.filter((r) => vals.includes(cmp(r))); }
    else if (op === "gte") out = out.filter((r) => cmp(r) >= val);
  }
  const order = params.get("order");
  if (order) { const [col, dir] = order.split(","); const [c, d] = col.split("."); out.sort((a, b) => (a[c] > b[c] ? 1 : -1) * (d === "desc" || dir === "desc" ? -1 : 1)); }
  return out;
}

http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    if (url.pathname.startsWith("/auth/v1/user")) {
      if ((req.headers.authorization ?? "").includes("token-admin-prueba")) return ok(res, { id: ADMIN.id, email: ADMIN.email, aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {}, created_at: ADMIN.creado_en });
      return err(res, 401, "JWT missing", "401");
    }
    if (url.pathname.startsWith("/auth/v1/")) return err(res, 401, "JWT missing", "401");
    const m = url.pathname.match(/^\/rest\/v1\/(rpc\/)?([a-z_]+)$/);
    if (!m) return err(res, 404, "not found", "404");
    const [, esRpc, nombre] = m;
    if (esRpc) {
      const fn = RPC[nombre]; if (!fn) return err(res, 404, `function ${nombre} not mocked`, "PGRST202");
      try { return ok(res, fn(body ? JSON.parse(body) : {})); } catch (e) { return err(res, 400, e.message); }
    }
    const tabla = db[nombre]; if (!tabla) return err(res, 404, `table ${nombre} not mocked`, "42P01");
    if (req.method === "POST") { const fila = JSON.parse(body || "{}"); (Array.isArray(fila) ? fila : [fila]).forEach((f) => tabla.push({ id: randomUUID(), ...f })); return ok(res, [], 201); }
    const filas = enriquecer(nombre, filtrar(tabla, url.searchParams));
    if (req.method === "HEAD" || (req.headers.prefer ?? "").includes("count=exact")) {
      res.writeHead(200, { "Content-Type": "application/json", "Content-Range": `0-${Math.max(0, filas.length - 1)}/${filas.length}` });
      return res.end(req.method === "HEAD" ? undefined : JSON.stringify(filas));
    }
    if ((req.headers.accept ?? "").includes("vnd.pgrst.object")) {
      if (filas.length !== 1) return filas.length === 0 && url.searchParams.size ? ok(res, null) : err(res, 406, "JSON object requested, multiple (or no) rows returned", "PGRST116");
      return ok(res, filas[0]);
    }
    return ok(res, filas);
  });
}).listen(PORT, () => console.log(`Doble de prueba de Supabase en http://localhost:${PORT}`));
