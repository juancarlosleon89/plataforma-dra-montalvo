"use client";
import { useEffect, useState } from "react";
import { diaLocal, fechaLarga, hora, sumarDias } from "@/lib/formato";
import { etiquetaEstado } from "@/lib/tipos";

type Cita = { codigo: string; inicio: string; fin: string; estado: string; servicio_id: string; servicio: string; nombres: string;
  puede_modificar: boolean; puede_reprogramar: boolean; horas_minimas: number };

/** Página del enlace personal: ver, cancelar o reprogramar la cita según la política configurada. */
export function GestionCita({ token }: { token: string }) {
  const [cita, setCita] = useState<Cita | null | undefined>(undefined);
  const [modo, setModo] = useState<"ver" | "cancelar" | "reprogramar">("ver");
  const [fecha, setFecha] = useState(sumarDias(diaLocal(), 1));
  const [res, setRes] = useState<{ clave: string; h: { inicio: string }[] } | null>(null);
  const [version, setVersion] = useState(0);
  const [msg, setMsg] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    let vigente = true;
    fetch(`/api/citas/${token}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null))
      .then((c) => vigente && setCita(c)).catch(() => vigente && setCita(null));
    return () => { vigente = false; };
  }, [token, version]);
  const cargar = () => setVersion((v) => v + 1);

  const clave = `${cita?.servicio_id}|${fecha}`;
  const slots = res?.clave === clave ? res.h : null;
  useEffect(() => {
    if (modo !== "reprogramar" || !cita) return;
    let vigente = true;
    fetch(`/api/disponibilidad?servicio=${cita.servicio_id}&fecha=${fecha}`, { cache: "no-store" })
      .then((r) => r.json()).then((j) => vigente && setRes({ clave, h: j.horarios ?? [] })).catch(() => vigente && setRes({ clave, h: [] }));
    return () => { vigente = false; };
  }, [modo, fecha, cita, clave]);

  async function enviar(cuerpo: object) {
    setCargando(true); setMsg("");
    const r = await fetch(`/api/citas/${token}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) }).catch(() => null);
    const j = await r?.json().catch(() => ({}));
    setCargando(false);
    if (r?.ok) { setModo("ver"); setMsg(j.estado === "cancelada" ? "Su cita fue cancelada." : "Su cita fue reprogramada."); cargar(); }
    else setMsg(j?.error ?? "No se pudo completar la operación.");
  }

  if (cita === undefined) return <p className="t-body soft" role="status">Cargando…</p>;
  if (cita === null) return <p className="t-body soft">No encontramos esta cita. Revise el enlace de su correo o escríbanos por WhatsApp.</p>;

  return (
    <div className="form">
      {msg && <p className="wizard__alert t-body" role="status">{msg}</p>}
      <div className="spec-table">
        {[["Código", cita.codigo], ["Paciente", cita.nombres], ["Tratamiento", cita.servicio], ["Fecha", fechaLarga(cita.inicio)],
          ["Hora", `${hora(cita.inicio)} – ${hora(cita.fin)}`], ["Estado", etiquetaEstado(cita.estado)]].map(([k, v]) => (
          <div className="spec-row in" key={k}><span className="t-label">{k}</span><span className="t-body-l soft">{v}</span></div>
        ))}
      </div>

      {!cita.puede_modificar && ["pendiente", "confirmada", "reprogramada"].includes(cita.estado) && (
        <p className="t-body-s soft">Los cambios en línea se permiten hasta {cita.horas_minimas} horas antes. Para cambios de último momento, escríbanos por WhatsApp.</p>
      )}

      {cita.puede_modificar && modo === "ver" && (
        <div className="wizard__actions">
          {cita.puede_reprogramar && <button className="cta t-button" onClick={() => setModo("reprogramar")}>Reprogramar</button>}
          <button className="cta cta--ghost t-button" onClick={() => setModo("cancelar")}>Cancelar cita</button>
        </div>
      )}

      {modo === "cancelar" && (
        <div className="form__group">
          <p className="t-title"><em>¿Desea cancelar su cita?</em></p>
          <p className="t-body-s soft">El horario quedará libre para otro paciente.</p>
          <div className="wizard__actions">
            <button className="cta t-button" onClick={() => enviar({ accion: "cancelar" })} disabled={cargando}>{cargando ? "Cancelando…" : "Sí, cancelar"}</button>
            <button className="cta cta--ghost t-button" onClick={() => setModo("ver")}>Volver</button>
          </div>
        </div>
      )}

      {modo === "reprogramar" && (
        <div className="form__group">
          <p className="t-title"><em>Elija un nuevo horario</em></p>
          <label className="field"><span className="t-label">Fecha</span>
            <input type="date" value={fecha} min={sumarDias(diaLocal(), 1)} onChange={(e) => setFecha(e.target.value)} /></label>
          {slots === null && <p className="t-body soft">Consultando horarios…</p>}
          {slots?.length === 0 && <p className="t-body soft">No hay horarios ese día.</p>}
          <div className="slots">
            {slots?.map((s) => (
              <button key={s.inicio} className="option option--slot" disabled={cargando} onClick={() => enviar({ accion: "reprogramar", inicio: s.inicio })}>
                <span className="t-label">{hora(s.inicio)}</span>
              </button>
            ))}
          </div>
          <button className="cta cta--ghost t-button" onClick={() => setModo("ver")}>Volver</button>
        </div>
      )}
    </div>
  );
}
