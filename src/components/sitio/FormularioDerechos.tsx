"use client";
import { useState } from "react";

export function FormularioDerechos() {
  const [estado, setEstado] = useState({ ok: false, texto: "" });
  const [enviando, setEnviando] = useState(false);
  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    if (!f.checkValidity()) { f.reportValidity(); return; }
    setEnviando(true);
    const r = await fetch("/api/derechos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(f))) }).catch(() => null);
    const j = await r?.json().catch(() => ({}));
    setEnviando(false);
    if (r?.ok) { f.reset(); setEstado({ ok: true, texto: "Recibimos su solicitud. Le responderemos al correo indicado." }); }
    else setEstado({ ok: false, texto: j?.error ?? "No se pudo enviar." });
  }
  return (
    <form className="form" onSubmit={enviar} noValidate>
      <input type="text" name="sitio_web" tabIndex={-1} autoComplete="off" className="trampa" aria-hidden="true" />
      <div className="form__row">
        <label className="field"><span className="t-label">Nombre completo</span><input name="nombre" required maxLength={120} autoComplete="name" /></label>
        <label className="field"><span className="t-label">Correo usado en la reserva</span><input name="email" type="email" required autoComplete="email" /></label>
      </div>
      <div className="form__row">
        <label className="field"><span className="t-label">Teléfono (opcional)</span><input name="telefono" type="tel" autoComplete="tel" /></label>
        <label className="field"><span className="t-label">Tipo de solicitud</span>
          <select name="tipo" required defaultValue="acceso">
            <option value="acceso">Acceso a mis datos</option><option value="rectificacion">Rectificación o actualización</option>
            <option value="eliminacion">Eliminación</option><option value="oposicion">Oposición</option>
            <option value="portabilidad">Portabilidad</option><option value="suspension">Suspensión del tratamiento</option>
          </select></label>
      </div>
      <label className="field"><span className="t-label">Detalle</span><textarea name="detalle" rows={3} maxLength={2000} /></label>
      <button className="cta t-button" type="submit" disabled={enviando}>{enviando ? "Enviando…" : "Enviar solicitud"}</button>
      <p className={`t-body-s form__status ${estado.ok ? "" : "is-error"}`} role="status" aria-live="polite">{estado.texto}</p>
    </form>
  );
}
