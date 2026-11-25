/**
 * =====================================================================
 * Integración Google Calendar + correo · Plataforma Dra. Monserrath Montalvo
 * =====================================================================
 * Responsabilidades (ver docs/ARQUITECTURA.md):
 *  - Supabase es la FUENTE DE VERDAD de las citas y quien impide duplicados.
 *  - Este script es el AUTOMATIZADOR: lleva las citas al Google Calendar de la
 *    doctora, lee sus horas ocupadas, envía correos y reconcilia diferencias.
 *  - No autentica pacientes ni decide disponibilidad: solo ejecuta.
 *
 * Propiedades del script (Configuración del proyecto → Propiedades del script):
 *   SUPABASE_URL          https://xxxx.supabase.co
 *   SUPABASE_SECRET_KEY   clave secreta (sb_secret_… o service_role)
 *   WEBHOOK_SECRET        el mismo valor que APPS_SCRIPT_SECRET en Vercel
 *   CALENDAR_ID           "primary" o el ID del calendario de la doctora
 *   SITIO_URL             https://su-dominio
 *   CORREO_AVISOS         correo donde la doctora recibe avisos de nuevas citas
 *   NOMBRE_CONSULTORIO    Dra. Monserrath Montalvo
 *   DIRECCION             Edificio Movilab 2, calles Quito y Cuenca, Ambato
 *
 * Instalación: ejecute una vez `instalar()` (crea los disparadores) y
 * despliegue como aplicación web (ver apps-script/README.md).
 */

const ZONA = 'America/Guayaquil';
const DIAS_SINCRONIZAR = 60;
const ETIQUETA = 'mm_cita_id'; // marca de los eventos creados por la plataforma

function cfg_() {
  const p = PropertiesService.getScriptProperties().getProperties();
  ['SUPABASE_URL', 'SUPABASE_SECRET_KEY', 'WEBHOOK_SECRET'].forEach(function (k) {
    if (!p[k]) throw new Error('Falta la propiedad del script ' + k);
  });
  return {
    url: p.SUPABASE_URL.replace(/\/$/, ''), clave: p.SUPABASE_SECRET_KEY, secreto: p.WEBHOOK_SECRET,
    calendario: p.CALENDAR_ID || 'primary', sitio: (p.SITIO_URL || '').replace(/\/$/, ''),
    avisos: p.CORREO_AVISOS || '', nombre: p.NOMBRE_CONSULTORIO || 'Consultorio', direccion: p.DIRECCION || '',
  };
}

/* ---------------- Acceso a Supabase (REST) ---------------- */
function supabase_(ruta, opciones) {
  const c = cfg_();
  const cabeceras = { apikey: c.clave, 'Content-Type': 'application/json' };
  if (c.clave.indexOf('eyJ') === 0) cabeceras.Authorization = 'Bearer ' + c.clave; // claves heredadas (JWT)
  const r = UrlFetchApp.fetch(c.url + ruta, Object.assign({ headers: cabeceras, muteHttpExceptions: true }, opciones || {}));
  const codigo = r.getResponseCode(), texto = r.getContentText();
  if (codigo >= 300) throw new Error('Supabase ' + codigo + ': ' + texto.slice(0, 300));
  return texto ? JSON.parse(texto) : null;
}
function rpc_(funcion, parametros) {
  return supabase_('/rest/v1/rpc/' + funcion, { method: 'post', payload: JSON.stringify(parametros || {}) });
}
function registrarError_(mensaje, detalle) {
  try {
    supabase_('/rest/v1/registro_errores', { method: 'post', payload: JSON.stringify({ origen: 'apps-script', mensaje: String(mensaje).slice(0, 500), detalle: detalle || null }) });
  } catch (e) { console.error('No se pudo registrar el error: ' + e); }
}

/* ---------------- Webhook (llamado por el servidor de Next.js) ---------------- */
function doPost(e) {
  let datos;
  try { datos = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'JSON inválido' }); }
  if (!secretoValido_(datos.secreto)) return json_({ ok: false, error: 'No autorizado' });
  try {
    switch (datos.evento) {
      case 'reserva':
      case 'reserva_panel':
        if (datos.enlace && datos.cita_id) correoConfirmacionInicial_(datos.cita_id, datos.enlace);
        avisarDoctora_(datos.cita_id);
        break;
      case 'mensaje':
        if (cfg_().avisos) MailApp.sendEmail(cfg_().avisos, 'Nuevo mensaje en el sitio web', 'Recibió un mensaje de ' + (datos.nombre || 'un visitante') + '. Revíselo en ' + cfg_().sitio + '/admin/mensajes');
        return json_({ ok: true });
      case 'derechos':
        if (cfg_().avisos) MailApp.sendEmail(cfg_().avisos, 'Solicitud de protección de datos (' + datos.tipo + ')', 'Revísela en ' + cfg_().sitio + '/admin/privacidad. Debe responderse dentro del plazo legal.');
        return json_({ ok: true });
    }
    procesarCola(); // sincroniza al instante; si falla, el disparador periódico reintenta
    return json_({ ok: true });
  } catch (err) {
    registrarError_('Webhook ' + datos.evento + ': ' + err.message);
    return json_({ ok: false, error: err.message });
  }
}
function doGet() { return json_({ ok: true, servicio: 'integracion-calendario', hora: new Date().toISOString() }); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function secretoValido_(s) {
  const esperado = cfg_().secreto;
  if (typeof s !== 'string' || s.length !== esperado.length) return false;
  let dif = 0; for (let i = 0; i < s.length; i++) dif |= s.charCodeAt(i) ^ esperado.charCodeAt(i);
  return dif === 0;
}

/* ---------------- 1. Cola: Supabase → Google Calendar ---------------- */
function procesarCola() {
  const candado = LockService.getScriptLock();
  if (!candado.tryLock(20000)) return; // otra ejecución ya está procesando
  try {
    const cal = calendario_();
    const lote = rpc_('sync_tomar_lote', { p_limite: 25 }) || [];
    lote.forEach(function (item) {
      try {
        const idEvento = aplicarEnCalendario_(cal, item);
        rpc_('sync_resultado', { p_cola_id: item.cola_id, p_ok: true, p_google_event_id: idEvento, p_error: null });
        notificarPaciente_(item);
      } catch (err) {
        rpc_('sync_resultado', { p_cola_id: item.cola_id, p_ok: false, p_google_event_id: null, p_error: String(err.message || err) });
      }
    });
  } finally { candado.releaseLock(); }
}

/** Idempotente: decide según el estado ACTUAL de la cita, no según la acción encolada. */
function aplicarEnCalendario_(cal, item) {
  const c = item.cita;
  let evento = c.google_event_id ? buscarEvento_(cal, c.google_event_id) : null;
  if (c.estado === 'cancelada') {
    if (evento) evento.deleteEvent();
    return null;
  }
  const titulo = (c.estado === 'pendiente' ? '[Por confirmar] ' : '') + item.servicio + ' · ' + abreviar_(item.paciente.nombre);
  const descripcion = 'Código de cita: ' + c.codigo + '\nEstado: ' + c.estado + '\nTeléfono: ' + item.paciente.telefono +
    '\nPanel: ' + cfg_().sitio + '/admin/citas/' + c.id + '\n\n(Evento creado por la plataforma de citas. Para cambios, use el panel.)';
  const inicio = new Date(c.inicio), fin = new Date(c.fin);
  if (!evento) {
    evento = cal.createEvent(titulo, inicio, fin, { description: descripcion, location: cfg_().direccion });
    evento.setTag(ETIQUETA, c.id);
  } else {
    evento.setTitle(titulo); evento.setTime(inicio, fin); evento.setDescription(descripcion);
  }
  const colores = { pendiente: CalendarApp.EventColor.YELLOW, confirmada: CalendarApp.EventColor.CYAN, reprogramada: CalendarApp.EventColor.CYAN,
    atendida: CalendarApp.EventColor.GRAY, no_asistio: CalendarApp.EventColor.RED };
  if (colores[c.estado]) evento.setColor(colores[c.estado]);
  return evento.getId();
}

function buscarEvento_(cal, id) {
  try { const ev = cal.getEventById(id); return ev && ev.getStartTime() ? ev : null; } catch (e) { return null; }
}
function calendario_() {
  const id = cfg_().calendario;
  const cal = id === 'primary' ? CalendarApp.getDefaultCalendar() : CalendarApp.getCalendarById(id);
  if (!cal) throw new Error('No se encontró el calendario ' + id);
  return cal;
}
function abreviar_(nombre) { // en el calendario solo nombre e inicial del apellido
  const p = String(nombre || '').trim().split(/\s+/);
  return p.length > 1 ? p[0] + ' ' + p[p.length - 1].charAt(0) + '.' : p[0];
}

/* ---------------- 2. Google Calendar → Supabase (horas ocupadas) ---------------- */
function sincronizarOcupados() {
  const cal = calendario_();
  const desde = new Date(), hasta = new Date(desde.getTime() + DIAS_SINCRONIZAR * 86400000);
  const eventos = cal.getEvents(desde, hasta)
    .filter(function (ev) { return !ev.getTag(ETIQUETA); })            // ignora los creados por la plataforma
    .filter(function (ev) { return ev.getTransparency ? ev.getTransparency() !== CalendarApp.EventTransparency.TRANSPARENT : true; })
    .map(function (ev) {
      return { id: ev.getId(), inicio: (ev.isAllDayEvent() ? ev.getAllDayStartDate() : ev.getStartTime()).toISOString(),
               fin: (ev.isAllDayEvent() ? ev.getAllDayEndDate() : ev.getEndTime()).toISOString() };
    });
  rpc_('sync_reemplazar_ocupados', { p_desde: desde.toISOString(), p_hasta: hasta.toISOString(), p_eventos: eventos });
}

/* ---------------- 3. Reconciliación (Supabase manda) ---------------- */
function reconciliar() {
  const cal = calendario_();
  const desde = new Date(Date.now() - 86400000), hasta = new Date(Date.now() + DIAS_SINCRONIZAR * 86400000);
  const citas = rpc_('sync_citas_rango', { p_desde: desde.toISOString(), p_hasta: hasta.toISOString() }) || [];
  const porId = {};
  citas.forEach(function (c) { porId[c.id] = c; });
  let corregidas = 0;
  citas.forEach(function (c) {
    const activa = ['pendiente', 'confirmada', 'reprogramada', 'atendida', 'no_asistio'].indexOf(c.estado) >= 0;
    const ev = c.google_event_id ? buscarEvento_(cal, c.google_event_id) : null;
    if (activa && !ev) { rpc_('sync_reencolar', { p_cita: c.id, p_accion: 'crear' }); corregidas++; }
    else if (activa && ev && (ev.getStartTime().getTime() !== new Date(c.inicio).getTime() || ev.getEndTime().getTime() !== new Date(c.fin).getTime())) {
      rpc_('sync_reencolar', { p_cita: c.id, p_accion: 'actualizar' }); corregidas++; // alguien movió el evento a mano: se restaura
    } else if (c.estado === 'cancelada' && ev) { rpc_('sync_reencolar', { p_cita: c.id, p_accion: 'cancelar' }); corregidas++; }
  });
  // Eventos de la plataforma sin cita correspondiente (huérfanos)
  cal.getEvents(desde, hasta).forEach(function (ev) {
    const id = ev.getTag(ETIQUETA);
    if (id && !porId[id]) { ev.deleteEvent(); corregidas++; }
  });
  if (corregidas) { console.log('Reconciliación: ' + corregidas + ' corrección(es)'); procesarCola(); }
}

/* ---------------- 4. Notificaciones ---------------- */
function correoConfirmacionInicial_(citaId, enlace) {
  const c = obtenerCita_(citaId); if (!c || !c.pacientes) return;
  const cf = cfg_();
  const cuerpo = 'Hola ' + c.pacientes.nombres + ',\n\n' +
    (c.estado === 'confirmada' ? 'Su cita está confirmada:' : 'Recibimos su solicitud de cita. Le confirmaremos pronto:') + '\n\n' +
    '• Tratamiento: ' + c.servicios.nombre + '\n• Fecha: ' + fecha_(c.inicio) + '\n• Hora: ' + hora_(c.inicio) + '\n• Lugar: ' + cf.direccion + '\n• Código: ' + c.codigo + '\n\n' +
    'Para reprogramar o cancelar: ' + enlace + '\n\n' + cf.nombre;
  MailApp.sendEmail({ to: c.pacientes.email, subject: 'Su cita · ' + cf.nombre, body: cuerpo, name: cf.nombre, replyTo: cf.avisos || undefined });
}

function notificarPaciente_(item) {
  const c = item.cita, cf = cfg_();
  if (!item.paciente.email || item.paciente.email.indexOf('@invalid.local') > 0) return;
  let asunto = null, texto = null;
  if (item.accion === 'cancelar' && c.estado === 'cancelada') { asunto = 'Cita cancelada'; texto = 'Su cita del ' + fecha_(c.inicio) + ' a las ' + hora_(c.inicio) + ' fue cancelada.'; }
  else if (item.accion === 'actualizar' && c.estado === 'reprogramada') { asunto = 'Cita reprogramada'; texto = 'Su cita fue reprogramada para el ' + fecha_(c.inicio) + ' a las ' + hora_(c.inicio) + '.'; }
  else if (item.accion === 'actualizar' && c.estado === 'confirmada') { asunto = 'Cita confirmada'; texto = 'Su cita del ' + fecha_(c.inicio) + ' a las ' + hora_(c.inicio) + ' está confirmada.'; }
  if (!asunto) return;
  MailApp.sendEmail({ to: item.paciente.email, subject: asunto + ' · ' + cf.nombre, name: cf.nombre, replyTo: cf.avisos || undefined,
    body: 'Hola ' + item.paciente.nombre.split(' ')[0] + ',\n\n' + texto + '\nTratamiento: ' + item.servicio + '\nCódigo: ' + c.codigo + '\nLugar: ' + cf.direccion + '\n\n' + cf.nombre });
}

function avisarDoctora_(citaId) {
  const cf = cfg_(); if (!cf.avisos || !citaId) return;
  const c = obtenerCita_(citaId); if (!c) return;
  MailApp.sendEmail(cf.avisos, 'Nueva cita ' + (c.estado === 'pendiente' ? 'por confirmar' : '') + ' · ' + fecha_(c.inicio) + ' ' + hora_(c.inicio),
    c.servicios.nombre + ' · ' + c.pacientes.nombres + ' ' + c.pacientes.apellidos + '\nConfirme o gestione en: ' + cf.sitio + '/admin/citas/' + citaId);
}

/** Recordatorio diario (18:00): citas de mañana. */
function enviarRecordatorios() {
  const manana = Utilities.formatDate(new Date(Date.now() + 86400000), ZONA, 'yyyy-MM-dd');
  const citas = supabase_('/rest/v1/citas?select=codigo,inicio,estado,servicios(nombre),pacientes(nombres,email)' +
    '&estado=in.(confirmada,reprogramada,pendiente)&inicio=gte.' + manana + 'T00:00:00-05:00&inicio=lt.' + manana + 'T23:59:59-05:00', { method: 'get' }) || [];
  const cf = cfg_();
  citas.forEach(function (c) {
    if (!c.pacientes || !c.pacientes.email || c.pacientes.email.indexOf('@invalid.local') > 0) return;
    MailApp.sendEmail({ to: c.pacientes.email, subject: 'Recordatorio: su cita de mañana · ' + cf.nombre, name: cf.nombre, replyTo: cf.avisos || undefined,
      body: 'Hola ' + c.pacientes.nombres + ',\n\nLe recordamos su cita de mañana a las ' + hora_(c.inicio) + ' (' + c.servicios.nombre + ').\nLugar: ' + cf.direccion + '\nCódigo: ' + c.codigo + '\n\n' + cf.nombre });
  });
}

function obtenerCita_(id) {
  const r = supabase_('/rest/v1/citas?id=eq.' + encodeURIComponent(id) + '&select=id,codigo,inicio,fin,estado,servicios(nombre),pacientes(nombres,apellidos,email)', { method: 'get' });
  return r && r[0];
}
function fecha_(iso) { return Utilities.formatDate(new Date(iso), ZONA, "EEEE d 'de' MMMM 'de' yyyy"); }
function hora_(iso) { return Utilities.formatDate(new Date(iso), ZONA, 'HH:mm'); }

/* ---------------- Disparadores ---------------- */
/** Tarea periódica (cada 5 minutos): cola + horas ocupadas. */
function tareaPeriodica() {
  try { procesarCola(); } catch (e) { registrarError_('procesarCola: ' + e.message); }
  try { sincronizarOcupados(); } catch (e) { registrarError_('sincronizarOcupados: ' + e.message); }
}

/** Ejecute UNA vez desde el editor para crear los disparadores. */
function instalar() {
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('tareaPeriodica').timeBased().everyMinutes(5).create();
  ScriptApp.newTrigger('reconciliar').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('enviarRecordatorios').timeBased().atHour(18).everyDays(1).inTimezone(ZONA).create();
  probarConexion();
}

/** Diagnóstico: ejecútelo tras configurar las propiedades. */
function probarConexion() {
  const c = cfg_();
  const agenda = supabase_('/rest/v1/configuracion_agenda?select=zona_horaria&id=eq.1', { method: 'get' });
  const cal = calendario_();
  console.log('Supabase OK (zona ' + agenda[0].zona_horaria + '). Calendario: ' + cal.getName() + '. Sitio: ' + c.sitio);
}
