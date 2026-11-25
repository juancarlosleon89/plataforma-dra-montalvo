"use client";
import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import type { DefCampo } from "@/lib/admin";
import { supabaseNavegador } from "@/lib/supabase/navegador";

type Resultado = { ok: boolean; mensaje: string } | null;
type Accion = (prev: Resultado, fd: FormData) => Promise<Resultado>;

/** Formulario genérico del panel: pinta los campos definidos en `entidades.ts` y muestra el resultado. */
export function Formulario({ accion, campos, valores = {}, boton = "Guardar", opciones = {}, extra, reiniciar = false }: {
  accion: Accion; campos: DefCampo[]; valores?: Record<string, unknown>; boton?: string;
  opciones?: Record<string, { valor: string; texto: string }[]>; extra?: React.ReactNode; reiniciar?: boolean;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [estado, enviar] = useActionState(async (p: Resultado, fd: FormData) => {
    const r = await accion(p, fd);
    if (r?.ok && reiniciar) ref.current?.reset();
    return r;
  }, null);
  return (
    <form ref={ref} action={enviar} className="adm-form">
      {campos.map((c) => <CampoAdmin key={c.nombre} c={c} valor={valores[c.nombre]} opciones={opciones[c.nombre] ?? c.opciones} />)}
      {extra}
      <div className="adm-form__acciones">
        <Enviar texto={boton} />
        {estado && <p className={`t-body-s ${estado.ok ? "adm-ok" : "adm-error"}`} role="status">{estado.mensaje}</p>}
      </div>
    </form>
  );
}

export function Enviar({ texto, variante = "acento" }: { texto: string; variante?: "acento" | "primario" | "contorno" }) {
  const { pending } = useFormStatus();
  const cls = variante === "acento" ? "cta--accent" : variante === "contorno" ? "cta--ghost" : "";
  return <button className={`cta cta--small t-button ${cls}`} type="submit" disabled={pending}>{pending ? "Guardando…" : texto}</button>;
}

function aTexto(v: unknown, tipo: string) {
  if (v === null || v === undefined) return "";
  if (tipo === "lista" && Array.isArray(v)) return v.join("\n");
  if (tipo === "json") return JSON.stringify(v, null, 2);
  if (tipo === "hora") return String(v).slice(0, 5);
  if (tipo === "fechahora") {
    const d = new Date(String(v));
    const p = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guayaquil", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(d);
    const g = (t: string) => p.find((x) => x.type === t)?.value;
    return `${g("year")}-${g("month")}-${g("day")}T${g("hour")}:${g("minute")}`;
  }
  return String(v);
}

export function CampoAdmin({ c, valor, opciones }: { c: DefCampo; valor: unknown; opciones?: { valor: string; texto: string }[] }) {
  const v = aTexto(valor, c.tipo);
  const comun = { name: c.nombre, id: `f-${c.nombre}`, required: c.requerido };
  let input: React.ReactNode;
  switch (c.tipo) {
    case "booleano":
      return <label className="adm-check t-body-s"><input type="checkbox" name={c.nombre} defaultChecked={valor === true} /> {c.etiqueta}</label>;
    case "area": case "lista": case "json":
      input = <textarea {...comun} rows={c.tipo === "json" ? 5 : 4} defaultValue={v} />; break;
    case "seleccion":
      input = <select {...comun} defaultValue={v}>{!c.requerido && <option value="">—</option>}{(opciones ?? []).map((o) => <option key={o.valor} value={o.valor}>{o.texto}</option>)}</select>; break;
    case "imagen":
      return <div className={`adm-field ${c.ancho === "completo" ? "adm-field--full" : ""}`}><span className="t-label">{c.etiqueta}</span><ImagenCampo nombre={c.nombre} inicial={v} requerido={c.requerido} /></div>;
    case "numero": input = <input {...comun} type="number" step="any" defaultValue={v} />; break;
    case "hora": input = <input {...comun} type="time" defaultValue={v} />; break;
    case "fecha": input = <input {...comun} type="date" defaultValue={v} />; break;
    case "fechahora": input = <input {...comun} type="datetime-local" defaultValue={v} />; break;
    case "color": input = <input {...comun} type="color" defaultValue={v || "#1d5c66"} />; break;
    default: input = <input {...comun} defaultValue={v} />;
  }
  return (
    <label className={`adm-field ${c.ancho === "completo" || ["area", "lista", "json"].includes(c.tipo) ? "adm-field--full" : ""}`} htmlFor={comun.id}>
      <span className="t-label">{c.etiqueta}{c.requerido ? " *" : ""}</span>
      {input}
      {c.ayuda && <span className="t-caption soft">{c.ayuda}</span>}
    </label>
  );
}

/** Sube la imagen al bucket público de Supabase Storage (solo administradores) y guarda la URL. */
export function ImagenCampo({ nombre, inicial, requerido }: { nombre: string; inicial: string; requerido?: boolean }) {
  const [url, setUrl] = useState(inicial);
  const [estado, setEstado] = useState("");
  async function subir(f: File) {
    if (f.size > 5 * 1024 * 1024) { setEstado("La imagen supera 5 MB."); return; }
    setEstado("Subiendo…");
    const sb = supabaseNavegador();
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const ruta = `sitio/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await sb.storage.from("publico").upload(ruta, f, { cacheControl: "31536000", contentType: f.type });
    if (error) { setEstado("No se pudo subir: " + error.message); return; }
    setUrl(sb.storage.from("publico").getPublicUrl(ruta).data.publicUrl);
    setEstado("Imagen subida. Recuerde guardar.");
  }
  return (
    <div className="adm-img">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url ? <img src={url} alt="" /> : <span className="adm-img__vacia t-label">Sin imagen</span>}
      <div className="adm-img__ctrl">
        <input name={nombre} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/img/archivo.webp o URL" required={requerido} />
        <label className="cta cta--small cta--ghost t-button">Subir foto<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={(e) => e.target.files?.[0] && subir(e.target.files[0])} /></label>
        {estado && <span className="t-caption soft">{estado}</span>}
      </div>
    </div>
  );
}
