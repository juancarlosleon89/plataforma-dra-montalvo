"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { diaLocal, fechaLarga, hora } from "@/lib/formato";
import { useTextos } from "@/components/sitio/TextosContexto";
import { lineas } from "@/lib/textos";

type Svc = { id: string; slug: string; nombre: string; duracion: number; descripcion: string | null };
type Slot = { inicio: string; fin: string };
type Datos = { nombres: string; apellidos: string; telefono: string; email: string; observaciones: string; consentimiento: boolean; sitio_web: string };
type Confirmacion = { codigo: string; inicio: string; fin: string; estado: string; enlace: string; correo_enviado: boolean };

const vacio: Datos = { nombres: "", apellidos: "", telefono: "", email: "", observaciones: "", consentimiento: false, sitio_web: "" };

/**
 * Flujo de reserva: 1 tratamiento → 2 fecha → 3 horario (en tiempo real) → 4 datos → 5 revisión → confirmación.
 * La validación definitiva y el bloqueo de horarios ocurren en el servidor.
 */
export function Reserva({ servicios, inicial, whatsapp, direccion }: { servicios: Svc[]; inicial?: string; whatsapp: string; direccion: string }) {
  const t = useTextos();
  const PASOS = lineas(t["ag.pasos"]);
  const preseleccion = servicios.find((s) => s.slug === inicial || s.id === inicial);
  const [paso, setPaso] = useState(preseleccion ? 1 : 0);
  const [svc, setSvc] = useState<Svc | undefined>(preseleccion);
  const [mes, setMes] = useState(() => diaLocal().slice(0, 7));
  const [dias, setDias] = useState<Record<string, number>>({});
  const [fecha, setFecha] = useState<string>();
  const [res, setRes] = useState<{ clave: string; h: Slot[] } | null>(null);
  const [version, setVersion] = useState(0); // fuerza recarga tras un conflicto
  const [slot, setSlot] = useState<Slot>();
  const [datos, setDatos] = useState<Datos>(vacio);
  const [errores, setErrores] = useState<Partial<Record<keyof Datos, string>>>({});
  const [aviso, setAviso] = useState<string>("");
  const [cargando, setCargando] = useState(false);
  const [ok, setOk] = useState<Confirmacion>();

  // Días con disponibilidad (6 semanas desde hoy)
  useEffect(() => {
    if (!svc) return;
    const ctrl = new AbortController();
    fetch(`/api/disponibilidad?servicio=${svc.id}&desde=${diaLocal()}`, { signal: ctrl.signal, cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setDias(Object.fromEntries((j.dias ?? []).map((d: { fecha: string; libres: number }) => [d.fecha, d.libres]))))
      .catch(() => {});
    return () => ctrl.abort();
  }, [svc]);

  // Horarios del día elegido: se consultan al entrar al paso 3 (tiempo real, sin caché)
  const clave = `${svc?.id}|${fecha}|${version}`;
  const slots = res?.clave === clave ? res.h : null;
  useEffect(() => {
    if (!svc || !fecha || paso !== 2) return;
    let vigente = true;
    fetch(`/api/disponibilidad?servicio=${svc.id}&fecha=${fecha}`, { cache: "no-store" })
      .then((r) => r.json()).then((j) => vigente && setRes({ clave, h: j.horarios ?? [] }))
      .catch(() => vigente && setRes({ clave, h: [] }));
    return () => { vigente = false; };
  }, [svc, fecha, paso, clave]);

  function validarDatos() {
    const e: typeof errores = {};
    if (!datos.nombres.trim()) e.nombres = "Escriba sus nombres";
    if (!datos.apellidos.trim()) e.apellidos = "Escriba sus apellidos";
    if (!/^\+?[0-9 ()-]{7,20}$/.test(datos.telefono.trim())) e.telefono = "Teléfono no válido";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(datos.email.trim())) e.email = "Correo no válido";
    if (!datos.consentimiento) e.consentimiento = "Debe aceptar la política de privacidad";
    setErrores(e);
    return Object.keys(e).length === 0;
  }

  async function confirmar() {
    if (!svc || !slot) return;
    setCargando(true); setAviso("");
    const r = await fetch("/api/reservas", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ servicio_id: svc.id, inicio: slot.inicio, ...datos }),
    }).catch(() => null);
    const j = await r?.json().catch(() => ({}));
    setCargando(false);
    if (r?.status === 201) { setOk(j); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    if (r?.status === 409) {
      setAviso(j?.error ?? "Ese horario se acaba de ocupar. Elija otro.");
      setSlot(undefined); setPaso(2); setVersion((v) => v + 1);
      return;
    }
    if (r?.status === 422 && j?.campos) {
      setErrores(Object.fromEntries(Object.entries(j.campos).map(([k, v]) => [k, (v as string[])[0]])));
      setPaso(3);
    }
    setAviso(j?.error ?? "No pudimos completar la reserva. Revise su conexión e intente de nuevo.");
  }

  if (ok) return <ConfirmacionReserva ok={ok} svc={svc!} direccion={direccion} whatsapp={whatsapp} />;

  return (
    <div className="wizard">
      <ol className="wizard__steps" aria-label="Pasos de la reserva">
        {PASOS.slice(0, 5).map((p, i) => (
          <li key={p} className={`t-label ${i === paso ? "is-current" : ""} ${i < paso ? "is-done" : ""}`} aria-current={i === paso ? "step" : undefined}>
            {i < paso ? <button onClick={() => setPaso(i)}>{String(i + 1).padStart(2, "0")} {p}</button> : <span>{String(i + 1).padStart(2, "0")} {p}</span>}
          </li>
        ))}
      </ol>

      {aviso && <p className="wizard__alert t-body" role="alert">{aviso}</p>}

      {paso === 0 && (
        <fieldset className="form__group">
          <legend className="t-title"><em>{t["ag.p1_titulo"]}</em></legend>
          <p className="t-body-s soft">{t["ag.p1_ayuda"]}</p>
          <div className="options">
            {servicios.map((s) => (
              <button key={s.id} type="button" className={`option option--tall ${svc?.id === s.id ? "is-selected" : ""}`} aria-pressed={svc?.id === s.id}
                onClick={() => { setSvc(s); setFecha(undefined); setSlot(undefined); setPaso(1); }}>
                <span className="t-label">{s.nombre}</span>
                <span className="t-body-s option__desc">{s.duracion} min</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {paso === 1 && svc && (
        <div className="form__group">
          <p className="t-title"><em>{t["ag.p2_titulo"]}</em></p>
          <p className="t-body-s soft">{svc.nombre} · {svc.duracion} min. {t["ag.p2_ayuda"]}</p>
          <Calendario mes={mes} setMes={setMes} dias={dias} seleccion={fecha}
            elegir={(d) => { setFecha(d); setSlot(undefined); setPaso(2); }} />
        </div>
      )}

      {paso === 2 && fecha && (
        <div className="form__group">
          <p className="t-title"><em>{fechaLarga(`${fecha}T12:00:00-05:00`)}</em></p>
          {slots === null && <p className="t-body soft" role="status">{t["ag.consultando"]}</p>}
          {slots && slots.length === 0 && (
            <p className="t-body soft">{t["ag.sin_horarios"]} <button className="link" onClick={() => setPaso(1)}>{t["ag.otro_dia"]}</button></p>
          )}
          {slots && slots.length > 0 && (
            <div className="slots" role="listbox" aria-label="Horarios disponibles">
              {slots.map((s) => (
                <button key={s.inicio} role="option" aria-selected={slot?.inicio === s.inicio}
                  className={`option option--slot ${slot?.inicio === s.inicio ? "is-selected" : ""}`}
                  onClick={() => { setSlot(s); setAviso(""); setPaso(3); }}>
                  <span className="t-label">{hora(s.inicio)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {paso === 3 && (
        <form className="form" noValidate onSubmit={(e) => { e.preventDefault(); if (validarDatos()) setPaso(4); }}>
          <p className="t-title"><em>{t["ag.p4_titulo"]}</em></p>
          <p className="t-body-s soft">{t["ag.p4_ayuda"]}</p>
          <input type="text" name="sitio_web" tabIndex={-1} autoComplete="off" className="trampa" aria-hidden="true"
            value={datos.sitio_web} onChange={(e) => setDatos({ ...datos, sitio_web: e.target.value })} />
          <div className="form__row">
            <Campo etiqueta={t["ag.nombres"]} error={errores.nombres}>
              <input value={datos.nombres} onChange={(e) => setDatos({ ...datos, nombres: e.target.value })} autoComplete="given-name" maxLength={80} required aria-invalid={!!errores.nombres} />
            </Campo>
            <Campo etiqueta={t["ag.apellidos"]} error={errores.apellidos}>
              <input value={datos.apellidos} onChange={(e) => setDatos({ ...datos, apellidos: e.target.value })} autoComplete="family-name" maxLength={80} required aria-invalid={!!errores.apellidos} />
            </Campo>
          </div>
          <div className="form__row">
            <Campo etiqueta={t["ag.telefono"]} error={errores.telefono}>
              <input type="tel" inputMode="tel" value={datos.telefono} onChange={(e) => setDatos({ ...datos, telefono: e.target.value })} autoComplete="tel" placeholder="09XXXXXXXX" required aria-invalid={!!errores.telefono} />
            </Campo>
            <Campo etiqueta={t["ag.correo"]} error={errores.email}>
              <input type="email" inputMode="email" value={datos.email} onChange={(e) => setDatos({ ...datos, email: e.target.value })} autoComplete="email" required aria-invalid={!!errores.email} />
            </Campo>
          </div>
          <Campo etiqueta={t["ag.observaciones"]}>
            <textarea rows={3} maxLength={500} value={datos.observaciones} onChange={(e) => setDatos({ ...datos, observaciones: e.target.value })} placeholder={t["ag.observaciones_ej"]} />
          </Campo>
          <label className="check t-body-s">
            <input type="checkbox" checked={datos.consentimiento} onChange={(e) => setDatos({ ...datos, consentimiento: e.target.checked })} aria-invalid={!!errores.consentimiento} />
            <span>{t["ag.consentimiento"]} <Link href="/privacidad" target="_blank" className="underline">{t["ag.consentimiento_enlace"]}</Link>.</span>
          </label>
          {errores.consentimiento && <p className="t-caption field__error" role="alert">{errores.consentimiento}</p>}
          <button className="cta t-button" type="submit"><span>{t["ag.revisar"]}</span><span aria-hidden="true">→</span></button>
        </form>
      )}

      {paso === 4 && svc && slot && (
        <div className="form__group">
          <p className="t-title"><em>{t["ag.p5_titulo"]}</em></p>
          <div className="spec-table">
            {[
              [PASOS[0] ?? "Tratamiento", svc.nombre],
              [PASOS[1] ?? "Fecha", fechaLarga(slot.inicio)],
              [PASOS[2] ?? "Horario", `${hora(slot.inicio)} – ${hora(slot.fin)}`],
              [t["ag.r_paciente"], `${datos.nombres} ${datos.apellidos}`],
              [t["ag.telefono"], datos.telefono],
              [t["ag.correo"], datos.email],
              ...(datos.observaciones ? [[t["ag.r_observaciones"], datos.observaciones]] : []),
              [t["ag.r_lugar"], direccion],
            ].map(([k, v]) => (
              <div className="spec-row in" key={k}><span className="t-label">{k}</span><span className="t-body-l soft">{v}</span></div>
            ))}
          </div>
          <div className="wizard__actions">
            <button className="cta cta--accent t-button" onClick={confirmar} disabled={cargando}>
              <span>{cargando ? t["ag.reservando"] : t["ag.confirmar"]}</span><span aria-hidden="true">→</span>
            </button>
            <button className="cta cta--ghost t-button" onClick={() => setPaso(3)} disabled={cargando}>{t["ag.corregir"]}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Campo({ etiqueta, error, children }: { etiqueta: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span className="t-label">{etiqueta}</span>
      {children}
      {error && <span className="t-caption field__error" role="alert">{error}</span>}
    </label>
  );
}

function Calendario({ mes, setMes, dias, seleccion, elegir }:
  { mes: string; setMes: (m: string) => void; dias: Record<string, number>; seleccion?: string; elegir: (d: string) => void }) {
  const hoy = diaLocal();
  const [a, m] = mes.split("-").map(Number);
  const celdas = useMemo(() => {
    const primero = new Date(Date.UTC(a, m - 1, 1));
    const offset = (primero.getUTCDay() + 6) % 7; // semana empieza en lunes
    const total = new Date(Date.UTC(a, m, 0)).getUTCDate();
    return [...Array(offset).fill(null), ...Array.from({ length: total }, (_, i) => `${mes}-${String(i + 1).padStart(2, "0")}`)];
  }, [a, m, mes]);
  const mover = (n: number) => { const d = new Date(Date.UTC(a, m - 1 + n, 1)); setMes(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`); };
  const titulo = new Intl.DateTimeFormat("es-EC", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(a, m - 1, 1)));
  const minMes = hoy.slice(0, 7);
  return (
    <div className="cal">
      <div className="cal__head">
        <button className="btn-icon" onClick={() => mover(-1)} disabled={mes <= minMes} aria-label="Mes anterior">←</button>
        <p className="t-label">{titulo}</p>
        <button className="btn-icon" onClick={() => mover(1)} aria-label="Mes siguiente">→</button>
      </div>
      <div className="cal__grid" role="grid">
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => <span key={i} className="cal__dow t-label soft" aria-hidden="true">{d}</span>)}
        {celdas.map((d, i) => {
          if (!d) return <span key={`v${i}`} />;
          const libres = dias[d] ?? 0;
          const disponible = libres > 0;
          return (
            <button key={d} className={`cal__day ${disponible ? "is-available" : ""} ${seleccion === d ? "is-selected" : ""}`}
              disabled={!disponible} onClick={() => elegir(d)}
              aria-label={`${fechaLarga(`${d}T12:00:00-05:00`)}${disponible ? `, ${libres} horarios libres` : ", sin horarios"}`}>
              {Number(d.slice(8))}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ConfirmacionReserva({ ok, svc, direccion, whatsapp }: { ok: Confirmacion; svc: Svc; direccion: string; whatsapp: string }) {
  const t = useTextos();
  return (
    <div className="confirm" role="status">
      <p className="t-label">Reserva registrada · código {ok.codigo}</p>
      <h2 className="t-display">{ok.estado === "confirmada" ? t["ag.ok_confirmada"] : t["ag.ok_pendiente"]}</h2>
      <p className="t-body-l soft">
        {svc.nombre}, {fechaLarga(ok.inicio)} a las {hora(ok.inicio)}. {direccion}.
      </p>
      {ok.estado !== "confirmada" && <p className="t-body soft">{t["ag.ok_revision"]}</p>}
      <p className="t-body soft">
        {ok.correo_enviado ? `${t["ag.ok_correo"]} ` : ""}{t["ag.ok_enlace"]}
      </p>
      <p className="t-body confirm__link"><a href={ok.enlace}>{ok.enlace}</a></p>
      <div className="wizard__actions">
        <Link className="cta t-button" href="/">{t["ag.ok_volver"]}</Link>
        <a className="cta cta--ghost t-button" href={whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a>
      </div>
    </div>
  );
}
