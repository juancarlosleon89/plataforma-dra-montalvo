import "server-only";
import { cache } from "react";
import { supabasePublico } from "@/lib/supabase/server";
import { combinarTextos } from "@/lib/textos";
import type {
  Caso, Categoria, ConfiguracionAgenda, ConfiguracionSitio, Horario, Institucional, ItemGaleria, Pregunta, Servicio, Testimonio,
} from "@/lib/tipos";

/** Consultas públicas (contenido publicado). Todas pasan por RLS como "anon". */
export const obtenerSitio = cache(async () => {
  const sb = supabasePublico();
  const [sitio, inst, agenda] = await Promise.all([
    sb.from("configuracion_sitio").select("*").eq("id", 1).single(),
    sb.from("informacion_institucional").select("*").eq("id", 1).single(),
    sb.from("configuracion_agenda").select("*").eq("id", 1).single(),
  ]);
  if (sitio.error) throw new Error("No se pudo leer la configuración del sitio: " + sitio.error.message);
  return {
    sitio: sitio.data as ConfiguracionSitio,
    inst: inst.data as Institucional,
    agenda: agenda.data as ConfiguracionAgenda,
  };
});

export const obtenerServicios = cache(async () => {
  const sb = supabasePublico();
  const [s, c] = await Promise.all([
    sb.from("servicios").select("*").eq("activo", true).order("orden"),
    sb.from("categorias_tratamiento").select("*").eq("activa", true).order("orden"),
  ]);
  return { servicios: (s.data ?? []) as Servicio[], categorias: (c.data ?? []) as Categoria[] };
});

export const obtenerServicio = cache(async (slug: string) => {
  const { data } = await supabasePublico().from("servicios").select("*").eq("slug", slug).eq("activo", true).maybeSingle();
  return data as Servicio | null;
});

export const obtenerContenido = cache(async () => {
  const sb = supabasePublico();
  const [g, f, p, t, h] = await Promise.all([
    sb.from("galeria").select("*").eq("publicado", true).order("orden"),
    sb.from("faq").select("*").eq("publicado", true).order("orden"),
    sb.from("portafolio").select("*").order("orden"),
    sb.from("testimonios").select("*"),
    sb.from("horarios").select("*").eq("activo", true).order("dia_semana").order("hora_inicio"),
  ]);
  return {
    galeria: (g.data ?? []) as ItemGaleria[],
    faq: (f.data ?? []) as Pregunta[],
    casos: (p.data ?? []) as Caso[],
    testimonios: (t.data ?? []) as Testimonio[],
    horarios: (h.data ?? []) as Horario[],
  };
});

/** Agrupa tramos por día para mostrar "Lunes a viernes: 09:00–13:00 · 15:00–17:30". */
export function resumenHorarios(horarios: Horario[]) {
  const nombres = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const porDia = new Map<number, string>();
  horarios.forEach((h) => {
    const t = `${h.hora_inicio.slice(0, 5)}–${h.hora_fin.slice(0, 5)}`;
    porDia.set(h.dia_semana, porDia.has(h.dia_semana) ? `${porDia.get(h.dia_semana)} · ${t}` : t);
  });
  const orden = [1, 2, 3, 4, 5, 6, 0];
  const grupos: { dias: number[]; texto: string }[] = [];
  orden.forEach((d) => {
    const t = porDia.get(d);
    if (!t) return;
    const ult = grupos[grupos.length - 1];
    if (ult && ult.texto === t && orden.indexOf(ult.dias[ult.dias.length - 1]) === orden.indexOf(d) - 1) ult.dias.push(d);
    else grupos.push({ dias: [d], texto: t });
  });
  return grupos.map((g) => ({
    dias: g.dias.length > 1 ? `${nombres[g.dias[0]]} a ${nombres[g.dias[g.dias.length - 1]].toLowerCase()}` : nombres[g.dias[0]],
    horas: g.texto,
  }));
}


/** Textos editables del sitio (Panel → Textos del sitio), combinados con los valores por defecto. */
export const obtenerTextos = cache(async () => {
  const { data } = await supabasePublico().from("textos_sitio").select("id, valor");
  return combinarTextos(data);
});
