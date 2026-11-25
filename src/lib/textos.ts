/**
 * Registro de todos los textos fijos del sitio público. Cada uno se puede cambiar desde
 * Panel → Textos del sitio; en la base (`textos_sitio`) solo se guardan los modificados.
 * Para añadir un texto nuevo: agréguelo aquí y úselo con `t(textos, "clave")`.
 */
type Def = { g: string; e: string; v: string; tipo?: "area" | "imagen" };

export const TEXTOS = {
  /* Cabecera y menú */
  "cab.menu": { g: "Cabecera y menú", e: "Botón del menú", v: "Menú" },
  "cab.cerrar": { g: "Cabecera y menú", e: "Botón del menú abierto", v: "Cerrar" },
  "cab.tratamientos": { g: "Cabecera y menú", e: "Enlace superior izquierdo", v: "Tratamientos" },
  "cab.contacto": { g: "Cabecera y menú", e: "Enlace superior derecho", v: "Contacto" },
  "cab.agendar": { g: "Cabecera y menú", e: "Botón superior derecho", v: "Agendar" },
  "menu.tarjeta1": { g: "Cabecera y menú", e: "Menú: tarjeta 1, título", v: "Tratamientos" },
  "menu.tarjeta1_img": { g: "Cabecera y menú", e: "Menú: tarjeta 1, imagen", v: "/img/protesis-circonio-detalle.webp", tipo: "imagen" },
  "menu.tarjeta2": { g: "Cabecera y menú", e: "Menú: tarjeta 2, título", v: "Consultorio" },
  "menu.tarjeta2_img": { g: "Cabecera y menú", e: "Menú: tarjeta 2, imagen", v: "/img/recepcion.webp", tipo: "imagen" },
  "menu.nosotros": { g: "Cabecera y menú", e: "Menú y pie: Nosotros", v: "Nosotros" },
  "menu.doctora": { g: "Cabecera y menú", e: "Menú y pie: La doctora", v: "La doctora" },
  "menu.tratamientos": { g: "Cabecera y menú", e: "Menú y pie: Tratamientos", v: "Tratamientos" },
  "menu.resultados": { g: "Cabecera y menú", e: "Menú: Resultados", v: "Resultados" },
  "menu.instalaciones": { g: "Cabecera y menú", e: "Menú y pie: Instalaciones", v: "Instalaciones" },
  "menu.preguntas": { g: "Cabecera y menú", e: "Menú: Preguntas", v: "Preguntas" },
  "menu.contacto": { g: "Cabecera y menú", e: "Menú: Ubicación y contacto", v: "Ubicación y contacto" },
  "menu.agendar": { g: "Cabecera y menú", e: "Menú y pie: Agendar", v: "Agendar cita" },

  /* Inicio */
  "inicio.rotulo": { g: "Inicio · Portada", e: "Rótulo sobre la frase principal ({especialidad} se reemplaza por la especialidad de Configuración)", v: "{especialidad} · Ambato" },
  "inicio.boton_agendar": { g: "Inicio · Portada", e: "Botón principal", v: "Agendar cita" },
  "inicio.boton_whatsapp": { g: "Inicio · Portada", e: "Botón secundario", v: "Escribir por WhatsApp" },
  "inicio.frase": { g: "Inicio · Frase entre bloques", e: "Frase después de la portada", v: "Escuchar primero. Explicar cada opción. Tratar solo cuando el plan está claro y el paciente lo entiende.", tipo: "area" },
  "inicio.nosotros_rotulo": { g: "Inicio · Nosotros", e: "Rótulo", v: "Nosotros" },
  "inicio.nosotros_titulo": { g: "Inicio · Nosotros", e: "Título", v: "Un consultorio dedicado a devolver función y estética." },
  "inicio.historia": { g: "Inicio · Nosotros", e: "Subtítulo de la historia", v: "Historia" },
  "inicio.mision": { g: "Inicio · Nosotros", e: "Subtítulo de la misión", v: "Misión" },
  "inicio.vision": { g: "Inicio · Nosotros", e: "Subtítulo de la visión", v: "Visión" },
  "inicio.perfil_rotulo": { g: "Inicio · Perfil de la doctora", e: "Rótulo", v: "Perfil profesional" },
  "perfil.especialidades": { g: "Inicio · Perfil de la doctora", e: "Fila: especialidades", v: "Especialidades" },
  "perfil.formacion": { g: "Inicio · Perfil de la doctora", e: "Fila: formación", v: "Formación" },
  "perfil.experiencia": { g: "Inicio · Perfil de la doctora", e: "Fila: experiencia", v: "Experiencia" },
  "perfil.certificaciones": { g: "Inicio · Perfil de la doctora", e: "Fila: certificaciones", v: "Certificaciones" },
  "perfil.cursos": { g: "Inicio · Perfil de la doctora", e: "Fila: cursos", v: "Cursos" },
  "inicio.tratamientos_titulo": { g: "Inicio · Tratamientos", e: "Título", v: "Tratamientos" },
  "inicio.ver_todos": { g: "Inicio · Tratamientos", e: "Enlace a todos", v: "Ver todos" },
  "tarjeta.destacado": { g: "Inicio · Tratamientos", e: "Etiqueta de tratamiento destacado", v: "Destacado" },
  "tarjeta.agendar": { g: "Inicio · Tratamientos", e: "Botón de la tarjeta", v: "Agendar" },
  "tarjeta.informacion": { g: "Inicio · Tratamientos", e: "Enlace de la tarjeta", v: "Solicitar información" },
  "inicio.resultados_rotulo": { g: "Inicio · Resultados", e: "Rótulo", v: "Antes y después" },
  "inicio.resultados_titulo": { g: "Inicio · Resultados", e: "Título", v: "Resultados" },
  "inicio.resultados_texto": { g: "Inicio · Resultados", e: "Texto", v: "Casos reales de pacientes que autorizaron su publicación. Fotografías sin retoque, con la misma luz y encuadre antes y después.", tipo: "area" },
  "inicio.resultados_vacio": { g: "Inicio · Resultados", e: "Texto cuando aún no hay casos", v: "Pronto publicaremos casos reales con autorización de los pacientes.", tipo: "area" },
  "inicio.consultorio_titulo": { g: "Inicio · El consultorio", e: "Título", v: "El consultorio" },
  "inicio.consultorio_texto": { g: "Inicio · El consultorio", e: "Texto", v: "Conozca el espacio antes de su primera cita." },
  "inicio.experiencias_rotulo": { g: "Inicio · Experiencias", e: "Rótulo", v: "Pacientes" },
  "inicio.experiencias_titulo": { g: "Inicio · Experiencias", e: "Título", v: "Experiencias" },
  "inicio.experiencias_vacio": { g: "Inicio · Experiencias", e: "Texto cuando aún no hay testimonios", v: "Aquí se publicarán opiniones de pacientes que autoricen compartir su experiencia.", tipo: "area" },
  "inicio.experiencias_enlace": { g: "Inicio · Experiencias", e: "Enlace a Instagram", v: "Ver el consultorio en Instagram" },
  "inicio.agenda_rotulo": { g: "Inicio · Llamado a agendar", e: "Rótulo", v: "Agenda en línea" },
  "inicio.agenda_titulo": { g: "Inicio · Llamado a agendar", e: "Título", v: "Elija el día y la hora que le convienen." },
  "inicio.agenda_texto": { g: "Inicio · Llamado a agendar", e: "Texto", v: "Los horarios se actualizan en tiempo real. Recibirá la confirmación por correo, con un enlace para reprogramar o cancelar.", tipo: "area" },
  "inicio.agenda_boton": { g: "Inicio · Llamado a agendar", e: "Botón", v: "Ver horarios disponibles" },
  "inicio.instagram_titulo": { g: "Inicio · Instagram", e: "Título", v: "Instagram" },
  "inicio.instagram_boton": { g: "Inicio · Instagram", e: "Botón", v: "Seguir en Instagram" },
  "inicio.faq_titulo": { g: "Inicio · Preguntas frecuentes", e: "Título", v: "Preguntas frecuentes" },
  "inicio.contacto_rotulo": { g: "Inicio · Ubicación y contacto", e: "Rótulo", v: "Ubicación y contacto" },
  "inicio.contacto_titulo": { g: "Inicio · Ubicación y contacto", e: "Título", v: "Cómo llegar" },
  "contacto.direccion": { g: "Inicio · Ubicación y contacto", e: "Fila: dirección", v: "Dirección" },
  "contacto.referencias": { g: "Inicio · Ubicación y contacto", e: "Fila: referencias", v: "Referencias" },
  "contacto.horarios": { g: "Inicio · Ubicación y contacto", e: "Fila: horarios", v: "Horarios" },
  "contacto.telefono": { g: "Inicio · Ubicación y contacto", e: "Fila: teléfono", v: "Teléfono" },
  "contacto.correo": { g: "Inicio · Ubicación y contacto", e: "Fila: correo", v: "Correo" },
  "contacto.redes": { g: "Inicio · Ubicación y contacto", e: "Fila: redes", v: "Redes" },
  "contacto.boton_mapa": { g: "Inicio · Ubicación y contacto", e: "Botón del mapa", v: "Abrir en Google Maps" },
  "contacto.boton_whatsapp": { g: "Inicio · Ubicación y contacto", e: "Botón de WhatsApp", v: "WhatsApp" },
  "contacto.aviso": { g: "Inicio · Ubicación y contacto", e: "Aviso bajo el formulario", v: "Sus datos se usan solo para responder su mensaje." },
  "contacto.aviso_enlace": { g: "Inicio · Ubicación y contacto", e: "Enlace a la política", v: "Política de privacidad" },

  /* Formulario de contacto */
  "form.titulo": { g: "Formulario «Escríbanos»", e: "Título", v: "Escríbanos" },
  "form.nombre": { g: "Formulario «Escríbanos»", e: "Campo nombre", v: "Nombre" },
  "form.telefono": { g: "Formulario «Escríbanos»", e: "Campo teléfono", v: "Teléfono" },
  "form.correo": { g: "Formulario «Escríbanos»", e: "Campo correo", v: "Correo" },
  "form.motivo": { g: "Formulario «Escríbanos»", e: "Campo motivo", v: "Motivo" },
  "form.motivos": { g: "Formulario «Escríbanos»", e: "Opciones del motivo (una por línea)", v: "Información de tratamientos\nAgendar o reprogramar\nOtro", tipo: "area" },
  "form.mensaje": { g: "Formulario «Escríbanos»", e: "Campo mensaje", v: "Mensaje" },
  "form.enviar": { g: "Formulario «Escríbanos»", e: "Botón", v: "Enviar mensaje" },
  "form.enviando": { g: "Formulario «Escríbanos»", e: "Botón mientras envía", v: "Enviando…" },
  "form.ok": { g: "Formulario «Escríbanos»", e: "Mensaje enviado", v: "Gracias. Recibimos su mensaje y le responderemos pronto." },
  "form.error": { g: "Formulario «Escríbanos»", e: "Error al enviar", v: "No se pudo enviar. Escríbanos por WhatsApp." },

  /* Pie de página */
  "pie.consultorio": { g: "Pie de página", e: "Columna 1", v: "Consultorio" },
  "pie.pacientes": { g: "Pie de página", e: "Columna 2", v: "Pacientes" },
  "pie.redes": { g: "Pie de página", e: "Columna 3", v: "Redes" },
  "pie.agendar": { g: "Pie de página", e: "Enlace agendar", v: "Agendar" },
  "pie.privacidad": { g: "Pie de página", e: "Enlace privacidad", v: "Privacidad" },
  "pie.administracion": { g: "Pie de página", e: "Enlace al panel", v: "Administración" },

  /* Tratamientos */
  "trat.titulo": { g: "Página de tratamientos", e: "Título", v: "Tratamientos" },
  "trat.todos": { g: "Página de tratamientos", e: "Filtro de todas las categorías", v: "Todos" },
  "det.ruta": { g: "Detalle de un tratamiento", e: "Enlace de regreso", v: "Tratamientos" },
  "det.nota": { g: "Detalle de un tratamiento", e: "Nota bajo el título", v: "La valoración define si este tratamiento es adecuado para su caso." },
  "det.agendar": { g: "Detalle de un tratamiento", e: "Botón principal", v: "Agendar cita" },
  "det.informacion": { g: "Detalle de un tratamiento", e: "Botón secundario", v: "Solicitar información" },
  "det.objetivo": { g: "Detalle de un tratamiento", e: "Fila: objetivo", v: "Objetivo" },
  "det.beneficios": { g: "Detalle de un tratamiento", e: "Fila: beneficios", v: "Beneficios" },
  "det.indicaciones": { g: "Detalle de un tratamiento", e: "Fila: indicaciones", v: "Indicaciones" },

  /* Agendar */
  "ag.rotulo": { g: "Agendar cita", e: "Rótulo", v: "Agenda en línea" },
  "ag.titulo": { g: "Agendar cita", e: "Título", v: "Agendar cita" },
  "ag.pasos": { g: "Agendar cita", e: "Nombres de los 5 pasos (uno por línea)", v: "Tratamiento\nFecha\nHorario\nSus datos\nRevisión", tipo: "area" },
  "ag.p1_titulo": { g: "Agendar cita", e: "Paso 1: pregunta", v: "¿Qué tratamiento necesita?" },
  "ag.p1_ayuda": { g: "Agendar cita", e: "Paso 1: ayuda", v: "Si no está seguro, elija la valoración." },
  "ag.p2_titulo": { g: "Agendar cita", e: "Paso 2: título", v: "Elija el día" },
  "ag.p2_ayuda": { g: "Agendar cita", e: "Paso 2: ayuda", v: "Los días marcados tienen horarios libres." },
  "ag.consultando": { g: "Agendar cita", e: "Paso 3: cargando", v: "Consultando horarios…" },
  "ag.sin_horarios": { g: "Agendar cita", e: "Paso 3: sin horarios", v: "No quedan horarios este día." },
  "ag.otro_dia": { g: "Agendar cita", e: "Paso 3: enlace", v: "Elegir otro día" },
  "ag.p4_titulo": { g: "Agendar cita", e: "Paso 4: título", v: "Sus datos de contacto" },
  "ag.p4_ayuda": { g: "Agendar cita", e: "Paso 4: ayuda", v: "Solo pedimos lo necesario para gestionar su cita. No escriba información médica." },
  "ag.nombres": { g: "Agendar cita", e: "Campo nombres", v: "Nombres" },
  "ag.apellidos": { g: "Agendar cita", e: "Campo apellidos", v: "Apellidos" },
  "ag.telefono": { g: "Agendar cita", e: "Campo teléfono", v: "Teléfono" },
  "ag.correo": { g: "Agendar cita", e: "Campo correo", v: "Correo electrónico" },
  "ag.observaciones": { g: "Agendar cita", e: "Campo observaciones", v: "Observaciones (opcional)" },
  "ag.observaciones_ej": { g: "Agendar cita", e: "Ejemplo en observaciones", v: "Por ejemplo: prefiero que me llamen por la tarde." },
  "ag.consentimiento": { g: "Agendar cita", e: "Casilla de consentimiento", v: "Acepto que mis datos se usen para gestionar esta cita, según la" },
  "ag.consentimiento_enlace": { g: "Agendar cita", e: "Enlace de la casilla", v: "política de privacidad" },
  "ag.revisar": { g: "Agendar cita", e: "Botón del paso 4", v: "Revisar" },
  "ag.p5_titulo": { g: "Agendar cita", e: "Paso 5: título", v: "Revise su reserva" },
  "ag.r_paciente": { g: "Agendar cita", e: "Resumen: fila paciente", v: "Paciente" },
  "ag.r_observaciones": { g: "Agendar cita", e: "Resumen: fila observaciones", v: "Observaciones" },
  "ag.r_lugar": { g: "Agendar cita", e: "Resumen: fila lugar", v: "Lugar" },
  "ag.confirmar": { g: "Agendar cita", e: "Botón confirmar", v: "Confirmar reserva" },
  "ag.reservando": { g: "Agendar cita", e: "Botón mientras reserva", v: "Reservando…" },
  "ag.corregir": { g: "Agendar cita", e: "Botón corregir", v: "Corregir datos" },
  "ag.ok_confirmada": { g: "Agendar cita", e: "Confirmación: cita confirmada", v: "Su cita está confirmada." },
  "ag.ok_pendiente": { g: "Agendar cita", e: "Confirmación: solicitud recibida", v: "Recibimos su solicitud de cita." },
  "ag.ok_revision": { g: "Agendar cita", e: "Confirmación: aviso de revisión", v: "El consultorio revisará la solicitud y le confirmará por correo o WhatsApp." },
  "ag.ok_correo": { g: "Agendar cita", e: "Confirmación: correo enviado", v: "Le enviamos un correo con estos datos." },
  "ag.ok_enlace": { g: "Agendar cita", e: "Confirmación: guardar enlace", v: "Guarde este enlace para reprogramar o cancelar:" },
  "ag.ok_volver": { g: "Agendar cita", e: "Confirmación: botón", v: "Volver al inicio" },
} satisfies Record<string, Def>;

export type ClaveTexto = keyof typeof TEXTOS;
export type Textos = Record<ClaveTexto, string>;

/** Valores por defecto (los del código). */
export function textosPorDefecto(): Textos {
  return Object.fromEntries(Object.entries(TEXTOS).map(([k, d]) => [k, d.v])) as Textos;
}

/** Combina los valores guardados en la base con los valores por defecto. */
export function combinarTextos(filas: { id: string; valor: string }[] | null | undefined): Textos {
  const t = textosPorDefecto();
  for (const f of filas ?? []) if (f.id in t && f.valor.trim() !== "") t[f.id as ClaveTexto] = f.valor;
  return t;
}

/** Líneas no vacías de un texto de varias líneas. */
export const lineas = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
