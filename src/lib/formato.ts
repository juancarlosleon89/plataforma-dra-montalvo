/** Fechas siempre en la hora del consultorio (Ecuador continental, UTC-5). */
export const ZONA = "America/Guayaquil";

export const fechaLarga = (iso: string | Date) =>
  new Intl.DateTimeFormat("es-EC", { timeZone: ZONA, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
export const fechaCorta = (iso: string | Date) =>
  new Intl.DateTimeFormat("es-EC", { timeZone: ZONA, day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso));
export const hora = (iso: string | Date) =>
  new Intl.DateTimeFormat("es-EC", { timeZone: ZONA, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
export const fechaHora = (iso: string | Date) => `${fechaCorta(iso)} · ${hora(iso)}`;

/** AAAA-MM-DD de una fecha en la zona del consultorio. */
export function diaLocal(d: Date = new Date()) {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)!.value;
  return `${g("year")}-${g("month")}-${g("day")}`;
}

/** Convierte "AAAA-MM-DD" + "HH:MM" (hora local) a ISO con desfase -05:00. */
export const isoLocal = (dia: string, hm: string) => `${dia}T${hm}:00-05:00`;

export const sumarDias = (dia: string, n: number) => {
  const d = new Date(`${dia}T12:00:00-05:00`);
  d.setUTCDate(d.getUTCDate() + n);
  return diaLocal(d);
};

/** Lunes de la semana del día dado (AAAA-MM-DD). */
export const lunesDe = (dia: string) => {
  const d = new Date(`${dia}T12:00:00-05:00`);
  const dow = (d.getUTCDay() + 6) % 7;
  return sumarDias(dia, -dow);
};

export const hhmm = (t: string) => t.slice(0, 5);

export function enlaceWhatsapp(c: { whatsapp_numero?: string | null; whatsapp_url?: string | null; mensaje_whatsapp?: string | null }) {
  if (c.whatsapp_numero) return `https://wa.me/${c.whatsapp_numero.replace(/\D/g, "")}?text=${encodeURIComponent(c.mensaje_whatsapp ?? "")}`;
  return c.whatsapp_url ?? "#";
}

export const urlImagen = (u: string | null | undefined) => u || null;
