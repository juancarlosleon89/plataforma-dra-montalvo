// Prueba unitaria del código de Apps Script con dobles en memoria de
// CalendarApp, MailApp, UrlFetchApp (Supabase) y servicios de Google.
// Uso: node tests/apps-script/prueba-apps-script.mjs
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const codigo = fs.readFileSync(new URL("../../apps-script/Codigo.gs", import.meta.url), "utf8");

function entorno() {
  const eventos = new Map(); let sec = 0;
  const correos = []; const resultados = []; const reencolados = []; let ocupados = null; let falla = false;
  const cola = [];
  const nuevoEvento = (titulo, ini, fin, op) => {
    const id = `ev${++sec}@google.com`; const tags = {};
    const ev = { id, titulo, ini, fin, op, color: null,
      getId: () => id, getStartTime: () => ev.ini, getEndTime: () => ev.fin, setTitle: (t) => (ev.titulo = t), setTime: (a, b) => { ev.ini = a; ev.fin = b; },
      setDescription: () => {}, setColor: (c) => (ev.color = c), setTag: (k, v) => (tags[k] = v), getTag: (k) => tags[k] ?? null,
      deleteEvent: () => eventos.delete(id), isAllDayEvent: () => false };
    eventos.set(id, ev); return ev;
  };
  const cal = { getName: () => "Agenda Dra.", createEvent: (t, a, b, o) => { if (falla) throw new Error("Calendar no disponible"); return nuevoEvento(t, a, b, o); },
    getEventById: (id) => eventos.get(id) ?? null, getEvents: (a, b) => [...eventos.values()].filter((e) => e.ini < b && e.fin > a) };
  const props = { SUPABASE_URL: "https://x.supabase.co", SUPABASE_SECRET_KEY: "sb_secret_prueba", WEBHOOK_SECRET: "secreto-largo-de-prueba",
    CALENDAR_ID: "primary", SITIO_URL: "https://sitio", CORREO_AVISOS: "doctora@example.com", NOMBRE_CONSULTORIO: "Dra. Prueba", DIRECCION: "Ambato" };
  const rpc = {
    sync_tomar_lote: () => cola.splice(0, cola.length),
    sync_resultado: (p) => { resultados.push(p); return null; },
    sync_reemplazar_ocupados: (p) => { ocupados = p; return p.p_eventos.length; },
    sync_citas_rango: () => citasRango, sync_reencolar: (p) => { reencolados.push(p); return null; },
  };
  let citasRango = [];
  const UrlFetchApp = { fetch: (url, o) => {
    const m = url.match(/\/rest\/v1\/rpc\/(\w+)/);
    let cuerpo = null, codigo = 200;
    if (m) cuerpo = rpc[m[1]](JSON.parse(o.payload || "{}"));
    else if (url.includes("/rest/v1/citas")) cuerpo = [{ id: "c1", codigo: "ABC12345", inicio: "2026-12-01T14:00:00Z", fin: "2026-12-01T14:30:00Z", estado: "pendiente", servicios: { nombre: "Valoración" }, pacientes: { nombres: "Ana", apellidos: "Pérez", email: "ana@example.com" } }];
    else if (url.includes("registro_errores")) cuerpo = null;
    else if (url.includes("configuracion_agenda")) cuerpo = [{ zona_horaria: "America/Guayaquil" }];
    if (!o.headers.apikey) codigo = 401;
    return { getResponseCode: () => codigo, getContentText: () => (cuerpo === null ? "" : JSON.stringify(cuerpo)) };
  } };
  const ctx = {
    console, Date, JSON, String, Object, Math, Error,
    PropertiesService: { getScriptProperties: () => ({ getProperties: () => props }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
    CalendarApp: { getDefaultCalendar: () => cal, getCalendarById: () => cal, EventColor: { YELLOW: "Y", CYAN: "C", GRAY: "G", RED: "R" } },
    MailApp: { sendEmail: (...a) => correos.push(a.length === 1 ? a[0] : { to: a[0], subject: a[1], body: a[2] }) },
    ContentService: { createTextOutput: (t) => ({ t, setMimeType() { return JSON.parse(this.t); } }), MimeType: { JSON: "json" } },
    Utilities: { formatDate: (d, z, f) => (f === "HH:mm" ? d.toISOString().slice(11, 16) : d.toISOString().slice(0, 10)) },
    ScriptApp: {}, UrlFetchApp,
  };
  vm.createContext(ctx); vm.runInContext(codigo, ctx);
  return { ctx, eventos, correos, resultados, reencolados, cola, get ocupados() { return ocupados; }, setFalla: (v) => (falla = v), setCitasRango: (c) => (citasRango = c) };
}
const item = (cola_id, accion, cita) => ({ cola_id, accion, intento: 1, servicio: "Valoración", paciente: { nombre: "Ana Pérez", email: "ana@example.com", telefono: "099" },
  cita: { id: "c1", codigo: "ABC12345", origen: "web", google_event_id: null, inicio: "2026-12-01T14:00:00Z", fin: "2026-12-01T14:30:00Z", estado: "pendiente", ...cita } });

const pruebas = [];
const prueba = (nombre, fn) => pruebas.push([nombre, fn]);

prueba("Crear: la cita nueva genera un evento etiquetado y devuelve su ID", () => {
  const e = entorno(); e.cola.push(item(1, "crear", {})); e.ctx.procesarCola();
  assert.equal(e.eventos.size, 1); const ev = [...e.eventos.values()][0];
  assert.equal(ev.getTag("mm_cita_id"), "c1"); assert.match(ev.titulo, /^\[Por confirmar\] Valoración · Ana P\.$/);
  assert.deepEqual(e.resultados[0], { p_cola_id: 1, p_ok: true, p_google_event_id: ev.id, p_error: null });
});
prueba("El evento no incluye apellidos completos ni datos clínicos en el título", () => {
  const e = entorno(); e.cola.push(item(1, "crear", {})); e.ctx.procesarCola();
  assert.ok(![...e.eventos.values()][0].titulo.includes("Pérez"));
});
prueba("Actualizar: reprogramar mueve el mismo evento y avisa al paciente", () => {
  const e = entorno(); e.cola.push(item(1, "crear", {})); e.ctx.procesarCola(); const id = [...e.eventos.keys()][0];
  e.cola.push(item(2, "actualizar", { google_event_id: id, estado: "reprogramada", inicio: "2026-12-02T15:00:00Z", fin: "2026-12-02T15:30:00Z" })); e.ctx.procesarCola();
  assert.equal(e.eventos.size, 1); assert.equal(e.eventos.get(id).ini.toISOString(), "2026-12-02T15:00:00.000Z");
  assert.ok(e.correos.some((c) => /reprogramada/i.test(c.subject)));
});
prueba("Cancelar: elimina el evento y envía correo de cancelación", () => {
  const e = entorno(); e.cola.push(item(1, "crear", {})); e.ctx.procesarCola(); const id = [...e.eventos.keys()][0];
  e.cola.push(item(2, "cancelar", { google_event_id: id, estado: "cancelada" })); e.ctx.procesarCola();
  assert.equal(e.eventos.size, 0); assert.ok(e.correos.some((c) => /cancelada/i.test(c.subject)));
});
prueba("Idempotencia: si el evento fue borrado a mano, se vuelve a crear", () => {
  const e = entorno(); e.cola.push(item(1, "actualizar", { google_event_id: "inexistente@google.com", estado: "confirmada" })); e.ctx.procesarCola();
  assert.equal(e.eventos.size, 1); assert.equal(e.resultados[0].p_ok, true);
});
prueba("Error de Calendar: se informa a Supabase para reintentar (sin perder la cita)", () => {
  const e = entorno(); e.setFalla(true); e.cola.push(item(1, "crear", {})); e.ctx.procesarCola();
  assert.equal(e.resultados[0].p_ok, false); assert.match(e.resultados[0].p_error, /Calendar no disponible/);
});
prueba("Ocupados: solo se envían eventos ajenos a la plataforma", () => {
  const e = entorno(); e.cola.push(item(1, "crear", { inicio: new Date(Date.now() + 86400e3).toISOString(), fin: new Date(Date.now() + 86400e3 + 1800e3).toISOString() })); e.ctx.procesarCola();
  e.ctx.CalendarApp.getDefaultCalendar().createEvent("Congreso", new Date(Date.now() + 2 * 86400e3), new Date(Date.now() + 2 * 86400e3 + 7200e3), {});
  e.ctx.sincronizarOcupados();
  assert.equal(e.ocupados.p_eventos.length, 1); assert.ok(e.ocupados.p_eventos[0].id);
});
prueba("Reconciliación: evento movido a mano → se reencola 'actualizar' (Supabase manda)", () => {
  const e = entorno(); const ini = new Date(Date.now() + 86400e3), fin = new Date(ini.getTime() + 1800e3);
  e.cola.push(item(1, "crear", { inicio: ini.toISOString(), fin: fin.toISOString() })); e.ctx.procesarCola();
  const [id, ev] = [...e.eventos.entries()][0]; ev.setTime(new Date(ini.getTime() + 3600e3), new Date(fin.getTime() + 3600e3));
  e.setCitasRango([{ id: "c1", codigo: "ABC", inicio: ini.toISOString(), fin: fin.toISOString(), estado: "confirmada", google_event_id: id }]);
  e.ctx.reconciliar(); assert.deepEqual(e.reencolados[0], { p_cita: "c1", p_accion: "actualizar" });
});
prueba("Reconciliación: evento huérfano de la plataforma se elimina", () => {
  const e = entorno(); const ini = new Date(Date.now() + 86400e3);
  const ev = e.ctx.CalendarApp.getDefaultCalendar().createEvent("x", ini, new Date(ini.getTime() + 1800e3), {}); ev.setTag("mm_cita_id", "no-existe");
  e.setCitasRango([]); e.ctx.reconciliar(); assert.equal(e.eventos.size, 0);
});
prueba("Webhook: secreto incorrecto → rechazado", () => {
  const e = entorno(); const r = e.ctx.doPost({ postData: { contents: JSON.stringify({ secreto: "malo", evento: "reserva" }) } });
  assert.equal(r.ok, false); assert.equal(r.error, "No autorizado");
});
prueba("Webhook: reserva válida → correo al paciente con enlace y aviso a la doctora", () => {
  const e = entorno(); const r = e.ctx.doPost({ postData: { contents: JSON.stringify({ secreto: "secreto-largo-de-prueba", evento: "reserva", cita_id: "c1", enlace: "https://sitio/cita/abc" }) } });
  assert.equal(r.ok, true); assert.ok(e.correos.some((c) => c.to === "ana@example.com" && c.body.includes("https://sitio/cita/abc")));
  assert.ok(e.correos.some((c) => c.to === "doctora@example.com"));
});

let ok = 0;
for (const [n, fn] of pruebas) { try { fn(); ok++; console.log("OK    " + n); } catch (err) { console.log("FALLO " + n + "\n      " + err.message); } }
console.log(`\n${ok}/${pruebas.length} pruebas de Apps Script superadas`);
process.exit(ok === pruebas.length ? 0 : 1);
