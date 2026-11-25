"use client";
import { useEffect, useRef, useState } from "react";

/** Manifiesto: cada palabra pasa de opacidad .15 a 1 según el avance del scroll. */
export function RevelarPalabras({ texto }: { texto: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [n, setN] = useState(0);
  const palabras = texto.trim().split(/\s+/);
  useEffect(() => {
    const onScroll = () => {
      const r = ref.current?.getBoundingClientRect(); if (!r) return;
      const prog = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.4)));
      setN(Math.round(prog * palabras.length));
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, [palabras.length]);
  return (
    <p ref={ref} className="t-statement" aria-label={texto}>
      {palabras.map((w, i) => <span key={i} aria-hidden="true" className={`w ${i < n ? "on" : ""}`}>{w} </span>)}
    </p>
  );
}

/** Comparador antes/después con control deslizante y vista ampliada. */
export function Comparador({ antes, despues, titulo }: { antes: string; despues: string; titulo: string }) {
  const [pos, setPos] = useState(50);
  const [zoom, setZoom] = useState(false);
  return (
    <div className="ba" style={{ ["--pos" as string]: `${pos}%` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <div className="ba__img ba__before"><img src={antes} alt={`${titulo}: antes`} loading="lazy" /></div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <div className="ba__img ba__after"><img src={despues} alt={`${titulo}: después`} loading="lazy" /></div>
      <span className="ba__handle" aria-hidden="true" />
      <input className="ba__range" type="range" min={0} max={100} value={pos} onChange={(e) => setPos(+e.target.value)} aria-label="Comparar antes y después" />
      <button className="ba__zoom t-label" onClick={() => setZoom(true)}>Ampliar</button>
      {zoom && <Visor src={despues} alt={`${titulo}: después`} cerrar={() => setZoom(false)} />}
    </div>
  );
}

function Visor({ src, alt, cerrar }: { src: string; alt: string; cerrar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return (
    <dialog ref={ref} className="lightbox" onClose={cerrar} onClick={(e) => e.target === ref.current && ref.current?.close()}>
      <button className="lightbox__close t-button" onClick={() => ref.current?.close()}>Cerrar</button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} />
    </dialog>
  );
}

/** Galería con vista ampliada. */
export function Galeria({ items }: { items: { id: string; imagen_url: string; titulo: string; descripcion: string | null }[] }) {
  const [activo, setActivo] = useState<null | { src: string; alt: string }>(null);
  return (
    <div className="gallery">
      {items.map((g) => (
        <figure className="gallery__item" key={g.id}>
          <button className="gallery__btn" onClick={() => setActivo({ src: g.imagen_url, alt: g.descripcion ?? g.titulo })} aria-label={`Ampliar: ${g.titulo}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={g.imagen_url} alt={g.descripcion ?? g.titulo} loading="lazy" />
          </button>
          <figcaption className="t-label">{g.titulo}</figcaption>
        </figure>
      ))}
      {activo && <Visor src={activo.src} alt={activo.alt} cerrar={() => setActivo(null)} />}
    </div>
  );
}

/** Formulario de contacto: guarda el mensaje en Supabase vía /api/contacto. */
export function FormularioContacto() {
  const [estado, setEstado] = useState<{ tipo: "" | "ok" | "error"; texto: string }>({ tipo: "", texto: "" });
  const [enviando, setEnviando] = useState(false);
  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    setEnviando(true);
    const datos = Object.fromEntries(new FormData(form));
    const r = await fetch("/api/contacto", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos) }).catch(() => null);
    const cuerpo = await r?.json().catch(() => ({}));
    setEnviando(false);
    if (r?.ok) { form.reset(); setEstado({ tipo: "ok", texto: "Gracias. Recibimos su mensaje y le responderemos pronto." }); }
    else setEstado({ tipo: "error", texto: cuerpo?.error ?? "No se pudo enviar. Escríbanos por WhatsApp." });
  }
  return (
    <form className="form form--compact" onSubmit={enviar} noValidate>
      <h3 className="t-title"><em>Escríbanos</em></h3>
      <input type="text" name="sitio_web" tabIndex={-1} autoComplete="off" className="trampa" aria-hidden="true" />
      <div className="form__row">
        <label className="field"><span className="t-label">Nombre</span><input name="nombre" autoComplete="name" required maxLength={120} /></label>
        <label className="field"><span className="t-label">Teléfono</span><input name="telefono" type="tel" autoComplete="tel" required pattern="\+?[0-9 ()\-]{7,20}" /></label>
      </div>
      <div className="form__row">
        <label className="field"><span className="t-label">Correo</span><input name="email" type="email" autoComplete="email" /></label>
        <label className="field"><span className="t-label">Motivo</span>
          <select name="motivo"><option>Información de tratamientos</option><option>Agendar o reprogramar</option><option>Otro</option></select></label>
      </div>
      <label className="field"><span className="t-label">Mensaje</span><textarea name="mensaje" rows={3} required maxLength={2000} /></label>
      <button className="cta t-button" type="submit" disabled={enviando}>{enviando ? "Enviando…" : "Enviar mensaje"}</button>
      <p className={`t-body-s form__status ${estado.tipo === "error" ? "is-error" : ""}`} role="status" aria-live="polite">{estado.texto}</p>
    </form>
  );
}
