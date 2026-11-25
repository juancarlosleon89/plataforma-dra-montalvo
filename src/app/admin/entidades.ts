import type { DefCampo, Rol } from "@/lib/admin";

/**
 * Registro central de lo que el panel puede editar. Cada entidad define su tabla,
 * el rol mínimo, los campos del formulario y las rutas públicas que se regeneran.
 * Agregar un campo editable = agregarlo aquí (y a la tabla en Supabase).
 */
export type Entidad = { tabla: string; rol: Rol; campos: DefCampo[]; revalidar: string[]; unico?: boolean; orden?: string };

const SI_NO = (n: string, e: string): DefCampo => ({ nombre: n, etiqueta: e, tipo: "booleano" });
const AUT = [{ valor: "pendiente", texto: "Pendiente" }, { valor: "otorgada", texto: "Otorgada" }, { valor: "revocada", texto: "Revocada" }];

export const ENTIDADES = {
  servicios: {
    tabla: "servicios", rol: "admin", revalidar: ["/", "/tratamientos", "/agendar"], orden: "orden",
    campos: [
      { nombre: "nombre", etiqueta: "Nombre", tipo: "texto", requerido: true },
      { nombre: "slug", etiqueta: "Dirección web (minúsculas y guiones)", tipo: "texto", requerido: true, ayuda: "Ej.: diseno-de-sonrisa → /tratamientos/diseno-de-sonrisa" },
      { nombre: "categoria_id", etiqueta: "Categoría", tipo: "seleccion" },
      { nombre: "imagen_url", etiqueta: "Fotografía", tipo: "imagen", ancho: "completo" },
      { nombre: "descripcion", etiqueta: "Descripción", tipo: "area", ancho: "completo" },
      { nombre: "objetivo", etiqueta: "Objetivo del procedimiento", tipo: "area", ancho: "completo" },
      { nombre: "beneficios", etiqueta: "Beneficios (uno por línea)", tipo: "lista", ancho: "completo" },
      { nombre: "indicaciones", etiqueta: "Indicaciones generales", tipo: "area", ancho: "completo" },
      { nombre: "duracion_minutos", etiqueta: "Duración de la cita (minutos)", tipo: "numero", requerido: true },
      { nombre: "orden", etiqueta: "Orden", tipo: "numero" },
      { nombre: "precio", etiqueta: "Precio (USD)", tipo: "numero" },
      SI_NO("mostrar_precio", "Mostrar el precio en el sitio (solo con autorización de la doctora)"),
      SI_NO("reservable", "Se puede reservar en línea"),
      SI_NO("destacado", "Destacado en la portada"),
      SI_NO("activo", "Visible en el sitio"),
    ],
  },
  categorias: {
    tabla: "categorias_tratamiento", rol: "admin", revalidar: ["/tratamientos"], orden: "orden",
    campos: [{ nombre: "nombre", etiqueta: "Nombre", tipo: "texto", requerido: true }, { nombre: "orden", etiqueta: "Orden", tipo: "numero" }, SI_NO("activa", "Activa")],
  },
  horarios: {
    tabla: "horarios", rol: "admin", revalidar: ["/", "/agendar"], orden: "dia_semana",
    campos: [
      { nombre: "dia_semana", etiqueta: "Día", tipo: "seleccion", opciones: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"].map((d, i) => ({ valor: String(i), texto: d })) },
      { nombre: "hora_inicio", etiqueta: "Desde", tipo: "hora", requerido: true },
      { nombre: "hora_fin", etiqueta: "Hasta", tipo: "hora", requerido: true },
      SI_NO("activo", "Activo"),
    ],
  },
  bloqueos: {
    tabla: "bloqueos_agenda", rol: "recepcion", revalidar: ["/agendar"], orden: "inicio",
    campos: [
      { nombre: "tipo", etiqueta: "Tipo", tipo: "seleccion", opciones: [{ valor: "bloqueo", texto: "Bloqueo" }, { valor: "vacaciones", texto: "Vacaciones" }, { valor: "feriado", texto: "Feriado" }, { valor: "no_laborable", texto: "Día no laborable" }] },
      { nombre: "inicio", etiqueta: "Desde", tipo: "fechahora", requerido: true },
      { nombre: "fin", etiqueta: "Hasta", tipo: "fechahora", requerido: true },
      { nombre: "motivo", etiqueta: "Motivo (interno)", tipo: "texto" },
    ],
  },
  agenda: {
    tabla: "configuracion_agenda", rol: "admin", unico: true, revalidar: ["/agendar"],
    campos: [
      { nombre: "intervalo_minutos", etiqueta: "Intervalo entre horarios (min)", tipo: "numero", requerido: true },
      { nombre: "anticipacion_minima_horas", etiqueta: "Anticipación mínima para reservar (horas)", tipo: "numero", requerido: true },
      { nombre: "anticipacion_maxima_dias", etiqueta: "Anticipación máxima (días)", tipo: "numero", requerido: true },
      { nombre: "cancelacion_minima_horas", etiqueta: "Cancelar o reprogramar hasta (horas antes)", tipo: "numero", requerido: true },
      SI_NO("permite_reprogramar", "El paciente puede reprogramar en línea"),
      SI_NO("confirmacion_automatica", "Confirmar automáticamente (si no, entran como «pendiente»)"),
      SI_NO("horarios_provisionales", "Horarios provisionales (marca interna)"),
      { nombre: "politica_cancelacion", etiqueta: "Política de cancelación (texto público)", tipo: "area", ancho: "completo" },
    ],
  },
  sitio: {
    tabla: "configuracion_sitio", rol: "admin", unico: true, revalidar: ["/", "/tratamientos", "/agendar", "/privacidad"],
    campos: [
      { nombre: "nombre_comercial", etiqueta: "Nombre comercial", tipo: "texto", requerido: true },
      { nombre: "especialidad", etiqueta: "Especialidad (subtítulo)", tipo: "texto" },
      { nombre: "color_acento", etiqueta: "Color de acento", tipo: "color", ayuda: "Un solo color oscuro y saturado (contraste ≥ 4.5:1 con blanco)." },
      { nombre: "logotipo_url", etiqueta: "Logotipo", tipo: "imagen" },
      { nombre: "telefono", etiqueta: "Teléfono", tipo: "texto" },
      { nombre: "email", etiqueta: "Correo electrónico", tipo: "texto" },
      { nombre: "whatsapp_url", etiqueta: "Enlace de WhatsApp", tipo: "texto" },
      { nombre: "whatsapp_numero", etiqueta: "Número de WhatsApp (5939…)", tipo: "texto", ayuda: "Si se completa, los botones abren el chat con un mensaje precargado." },
      { nombre: "mensaje_whatsapp", etiqueta: "Mensaje inicial de WhatsApp", tipo: "texto", ancho: "completo" },
      { nombre: "direccion", etiqueta: "Dirección", tipo: "texto" },
      { nombre: "ciudad", etiqueta: "Ciudad", tipo: "texto" },
      { nombre: "referencias", etiqueta: "Referencias para llegar", tipo: "area", ancho: "completo" },
      { nombre: "maps_query", etiqueta: "Búsqueda para Google Maps", tipo: "texto", ancho: "completo" },
      { nombre: "redes", etiqueta: "Redes sociales (JSON)", tipo: "json", ancho: "completo", ayuda: '{"instagram":"https://…","facebook":"https://…"}' },
      { nombre: "hero_titulo", etiqueta: "Portada: frase principal", tipo: "texto", ancho: "completo" },
      { nombre: "hero_subtitulo", etiqueta: "Portada: texto de apoyo", tipo: "area", ancho: "completo" },
      { nombre: "hero_imagen_url", etiqueta: "Portada: fotografía", tipo: "imagen", ancho: "completo" },
    ],
  },
  institucional: {
    tabla: "informacion_institucional", rol: "admin", unico: true, revalidar: ["/"],
    campos: [
      { nombre: "propuesta", etiqueta: "Propuesta de valor", tipo: "texto", ancho: "completo" },
      { nombre: "presentacion", etiqueta: "Presentación institucional", tipo: "area", ancho: "completo" },
      { nombre: "historia", etiqueta: "Historia del consultorio", tipo: "area", ancho: "completo" },
      { nombre: "mision", etiqueta: "Misión", tipo: "area" },
      { nombre: "vision", etiqueta: "Visión", tipo: "area" },
      { nombre: "valores", etiqueta: "Valores (uno por línea)", tipo: "lista", ancho: "completo" },
      { nombre: "diferenciadores", etiqueta: "Diferenciadores (JSON)", tipo: "json", ancho: "completo", ayuda: '[{"titulo":"…","texto":"…"}]' },
      { nombre: "perfil_nombre", etiqueta: "Perfil: nombre", tipo: "texto" },
      { nombre: "perfil_titulo", etiqueta: "Perfil: título profesional", tipo: "texto" },
      { nombre: "perfil_foto_url", etiqueta: "Perfil: fotografía", tipo: "imagen", ancho: "completo" },
      { nombre: "perfil_biografia", etiqueta: "Perfil: biografía", tipo: "area", ancho: "completo" },
      { nombre: "perfil_experiencia", etiqueta: "Perfil: experiencia", tipo: "area", ancho: "completo" },
      { nombre: "perfil_especialidades", etiqueta: "Perfil: especialidades (una por línea)", tipo: "lista" },
      { nombre: "perfil_certificaciones", etiqueta: "Perfil: certificaciones (una por línea)", tipo: "lista" },
      { nombre: "perfil_cursos", etiqueta: "Perfil: cursos (uno por línea)", tipo: "lista" },
      { nombre: "perfil_formacion", etiqueta: "Perfil: formación (JSON)", tipo: "json", ayuda: '[{"titulo":"…","institucion":"…","anio":"…"}]' },
      { nombre: "perfil_enfoque", etiqueta: "Perfil: enfoque de atención", tipo: "area", ancho: "completo" },
    ],
  },
  galeria: {
    tabla: "galeria", rol: "admin", revalidar: ["/"], orden: "orden",
    campos: [
      { nombre: "titulo", etiqueta: "Título", tipo: "texto", requerido: true },
      { nombre: "imagen_url", etiqueta: "Fotografía", tipo: "imagen", requerido: true, ancho: "completo" },
      { nombre: "descripcion", etiqueta: "Descripción (texto alternativo)", tipo: "texto", ancho: "completo" },
      { nombre: "categoria", etiqueta: "Espacio", tipo: "seleccion", opciones: ["fachada", "recepcion", "espera", "consultorio", "equipamiento", "otros"].map((v) => ({ valor: v, texto: v[0].toUpperCase() + v.slice(1) })) },
      { nombre: "orden", etiqueta: "Orden", tipo: "numero" }, SI_NO("publicado", "Publicado"),
    ],
  },
  faq: {
    tabla: "faq", rol: "admin", revalidar: ["/"], orden: "orden",
    campos: [{ nombre: "pregunta", etiqueta: "Pregunta", tipo: "texto", requerido: true, ancho: "completo" }, { nombre: "respuesta", etiqueta: "Respuesta", tipo: "area", requerido: true, ancho: "completo" }, { nombre: "orden", etiqueta: "Orden", tipo: "numero" }, SI_NO("publicado", "Publicado")],
  },
  autorizaciones: {
    tabla: "autorizaciones_publicacion", rol: "admin", revalidar: ["/"], orden: "creado_en",
    campos: [
      { nombre: "titular", etiqueta: "Titular (quien autoriza)", tipo: "texto", requerido: true },
      { nombre: "alcance", etiqueta: "Alcance", tipo: "seleccion", opciones: [{ valor: "fotografias", texto: "Fotografías" }, { valor: "testimonio", texto: "Testimonio" }, { valor: "ambos", texto: "Ambos" }] },
      { nombre: "estado", etiqueta: "Estado", tipo: "seleccion", opciones: AUT },
      { nombre: "fecha_firma", etiqueta: "Fecha de firma", tipo: "fecha" },
      { nombre: "documento_path", etiqueta: "Referencia del documento firmado", tipo: "texto" },
      { nombre: "observaciones", etiqueta: "Observaciones", tipo: "area", ancho: "completo" },
    ],
  },
  portafolio: {
    tabla: "portafolio", rol: "admin", revalidar: ["/"], orden: "orden",
    campos: [
      { nombre: "titulo", etiqueta: "Título interno", tipo: "texto" },
      { nombre: "servicio_id", etiqueta: "Tratamiento", tipo: "seleccion" },
      { nombre: "imagen_antes_url", etiqueta: "Foto ANTES", tipo: "imagen", requerido: true },
      { nombre: "imagen_despues_url", etiqueta: "Foto DESPUÉS", tipo: "imagen", requerido: true },
      { nombre: "descripcion", etiqueta: "Descripción breve", tipo: "area", ancho: "completo" },
      { nombre: "periodo", etiqueta: "Fecha o periodo", tipo: "texto" },
      { nombre: "autorizacion_id", etiqueta: "Autorización del paciente", tipo: "seleccion", ayuda: "Solo se publica si la autorización está «Otorgada»." },
      { nombre: "orden", etiqueta: "Orden", tipo: "numero" }, SI_NO("publicado", "Publicado"),
    ],
  },
  testimonios: {
    tabla: "testimonios", rol: "admin", revalidar: ["/"], orden: "creado_en",
    campos: [
      { nombre: "nombre_autorizado", etiqueta: "Nombre o identificación autorizada", tipo: "texto", requerido: true },
      { nombre: "comentario", etiqueta: "Opinión (textual)", tipo: "area", requerido: true, ancho: "completo" },
      { nombre: "servicio_id", etiqueta: "Tratamiento relacionado", tipo: "seleccion" },
      { nombre: "autorizacion_id", etiqueta: "Autorización", tipo: "seleccion", ayuda: "Solo se publica con autorización «Otorgada»." },
      SI_NO("publicado", "Publicado"),
    ],
  },
  pacientes: {
    tabla: "pacientes", rol: "recepcion", revalidar: [],
    campos: [
      { nombre: "nombres", etiqueta: "Nombres", tipo: "texto", requerido: true },
      { nombre: "apellidos", etiqueta: "Apellidos", tipo: "texto", requerido: true },
      { nombre: "telefono", etiqueta: "Teléfono", tipo: "texto", requerido: true },
      { nombre: "email", etiqueta: "Correo", tipo: "texto", requerido: true },
      { nombre: "estado", etiqueta: "Estado", tipo: "seleccion", opciones: [{ valor: "activo", texto: "Activo" }, { valor: "inactivo", texto: "Inactivo" }] },
      { nombre: "notas_admin", etiqueta: "Notas administrativas (sin datos clínicos)", tipo: "area", ancho: "completo" },
    ],
  },
} satisfies Record<string, Entidad>;

export type NombreEntidad = keyof typeof ENTIDADES;
