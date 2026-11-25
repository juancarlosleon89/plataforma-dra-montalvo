export type EstadoCita = "pendiente" | "confirmada" | "reprogramada" | "cancelada" | "atendida" | "no_asistio";

export const ESTADOS_CITA: { valor: EstadoCita; etiqueta: string }[] = [
  { valor: "pendiente", etiqueta: "Pendiente" },
  { valor: "confirmada", etiqueta: "Confirmada" },
  { valor: "reprogramada", etiqueta: "Reprogramada" },
  { valor: "cancelada", etiqueta: "Cancelada" },
  { valor: "atendida", etiqueta: "Atendida" },
  { valor: "no_asistio", etiqueta: "No asistió" },
];
export const etiquetaEstado = (e: string) => ESTADOS_CITA.find((x) => x.valor === e)?.etiqueta ?? e;

export interface ConfiguracionSitio {
  nombre_comercial: string; especialidad: string | null; logotipo_url: string | null; color_acento: string;
  telefono: string | null; email: string | null; whatsapp_url: string | null; whatsapp_numero: string | null;
  mensaje_whatsapp: string | null; direccion: string | null; referencias: string | null; ciudad: string | null;
  maps_query: string | null; redes: Record<string, string>; hero_titulo: string | null; hero_subtitulo: string | null;
  hero_imagen_url: string | null;
}

export interface Institucional {
  propuesta: string | null; presentacion: string | null; historia: string | null; mision: string | null; vision: string | null;
  valores: string[]; diferenciadores: { titulo: string; texto: string }[];
  perfil_nombre: string | null; perfil_titulo: string | null; perfil_biografia: string | null; perfil_experiencia: string | null;
  perfil_foto_url: string | null; perfil_especialidades: string[];
  perfil_formacion: { titulo: string; institucion?: string; anio?: string }[];
  perfil_certificaciones: string[]; perfil_cursos: string[]; perfil_enfoque: string | null;
}

export interface Servicio {
  id: string; slug: string; categoria_id: string | null; nombre: string; descripcion: string | null; objetivo: string | null;
  beneficios: string[]; indicaciones: string | null; imagen_url: string | null; duracion_minutos: number;
  precio: number | null; mostrar_precio: boolean; reservable: boolean; destacado: boolean; activo: boolean; orden: number;
}

export interface Categoria { id: string; nombre: string; descripcion: string | null; orden: number; activa: boolean }
export interface Horario { id: string; dia_semana: number; hora_inicio: string; hora_fin: string; activo: boolean }
export interface ConfiguracionAgenda {
  zona_horaria: string; intervalo_minutos: number; anticipacion_minima_horas: number; anticipacion_maxima_dias: number;
  cancelacion_minima_horas: number; permite_reprogramar: boolean; confirmacion_automatica: boolean;
  politica_cancelacion: string | null; horarios_provisionales: boolean;
}
export interface ItemGaleria { id: string; imagen_url: string; titulo: string; descripcion: string | null; categoria: string; orden: number; publicado: boolean }
export interface Pregunta { id: string; pregunta: string; respuesta: string; orden: number; publicado: boolean }
export interface Caso { id: string; servicio_id: string | null; titulo: string | null; imagen_antes_url: string; imagen_despues_url: string; descripcion: string | null; periodo: string | null; publicado: boolean; orden: number; autorizacion_id: string | null }
export interface Testimonio { id: string; nombre_autorizado: string; comentario: string; servicio_id: string | null; publicado: boolean; autorizacion_id: string | null }

export const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
