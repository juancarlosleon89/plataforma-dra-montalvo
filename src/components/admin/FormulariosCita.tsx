"use client";
import { useActionState, useEffect, useState } from "react";
import { crearCita, guardarNotaCita, reprogramarCita } from "@/app/admin/acciones";
import { Enviar } from "./Formulario";
import { hora } from "@/lib/formato";

/** Horarios libres reales (misma función que usa el sitio público). */
function useHorarios(servicioId: string, dia: string) {
  const clave = `${servicioId}|${dia}`;
  const [res, setRes] = useState<{ clave: string; h: { inicio: string }[] } | null>(null);
  useEffect(() => {
    if (!servicioId || !dia) return;
    let vigente = true;
    fetch(`/api/disponibilidad?servicio=${servicioId}&fecha=${dia}`, { cache: "no-store" })
      .then((r) => r.json()).then((j) => vigente && setRes({ clave, h: j.horarios ?? [] })).catch(() => vigente && setRes({ clave, h: [] }));
    return () => { vigente = false; };
  }, [servicioId, dia, clave]);
  return res?.clave === clave ? res.h : null;
}

function SelectorHorario({ servicioId, diaInicial }: { servicioId: string; diaInicial: string }) {
  const [dia, setDia] = useState(diaInicial);
  const [forzar, setForzar] = useState(false);
  const horarios = useHorarios(servicioId, dia);
  return (
    <>
      <div className="adm-form__fila">
        <label className="adm-field"><span className="t-label">Fecha</span><input type="date" name="dia" value={dia} onChange={(e) => setDia(e.target.value)} required /></label>
        <label className="adm-field"><span className="t-label">Hora</span>
          {forzar
            ? <input type="time" name="hora" required step={300} />
            : <select name="hora" required>
                <option value="">{horarios === null ? "Consultando…" : horarios.length ? "Elegir" : "Sin horarios libres"}</option>
                {horarios?.map((h) => <option key={h.inicio} value={hora(h.inicio)}>{hora(h.inicio)}</option>)}
              </select>}
        </label>
      </div>
      <label className="adm-check t-body-s"><input type="checkbox" name="forzar" checked={forzar} onChange={(e) => setForzar(e.target.checked)} /> Fuera de horario (sobrecupo autorizado; igual se impide el choque con otra cita)</label>
    </>
  );
}

export function FormReprogramar({ id, servicioId, diaInicial }: { id: string; servicioId: string; diaInicial: string }) {
  const [estado, accion] = useActionState(reprogramarCita.bind(null, id), null);
  return (
    <form action={accion} className="adm-form adm-form--bloque">
      <p className="t-label">Reprogramar</p>
      <SelectorHorario servicioId={servicioId} diaInicial={diaInicial} />
      <div className="adm-form__acciones"><Enviar texto="Reprogramar" variante="primario" />
        {estado && <p className={`t-body-s ${estado.ok ? "adm-ok" : "adm-error"}`}>{estado.mensaje}</p>}</div>
    </form>
  );
}

export function FormNota({ id, valor }: { id: string; valor: string }) {
  const [estado, accion] = useActionState(guardarNotaCita.bind(null, id), null);
  return (
    <form action={accion} className="adm-form adm-form--bloque">
      <label className="adm-field adm-field--full"><span className="t-label">Observaciones administrativas (sin datos clínicos)</span>
        <textarea name="observaciones_admin" rows={3} defaultValue={valor} maxLength={2000} /></label>
      <div className="adm-form__acciones"><Enviar texto="Guardar observación" variante="contorno" />
        {estado && <p className={`t-body-s ${estado.ok ? "adm-ok" : "adm-error"}`}>{estado.mensaje}</p>}</div>
    </form>
  );
}

export function FormNuevaCita({ servicios, pacientes, hoy, pacienteInicial }: {
  servicios: { id: string; nombre: string }[]; pacientes: { id: string; nombre: string }[]; hoy: string; pacienteInicial?: string;
}) {
  const [estado, accion] = useActionState(crearCita, null);
  const [servicio, setServicio] = useState(servicios[0]?.id ?? "");
  const [paciente, setPaciente] = useState(pacienteInicial ?? "");
  return (
    <form action={accion} className="adm-form">
      <label className="adm-field"><span className="t-label">Paciente</span>
        <select name="paciente_id" value={paciente} onChange={(e) => setPaciente(e.target.value)}>
          <option value="">+ Paciente nuevo</option>
          {pacientes.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select></label>
      {!paciente && <>
        <label className="adm-field"><span className="t-label">Nombres *</span><input name="nombres" required /></label>
        <label className="adm-field"><span className="t-label">Apellidos *</span><input name="apellidos" required /></label>
        <label className="adm-field"><span className="t-label">Teléfono *</span><input name="telefono" type="tel" required /></label>
        <label className="adm-field"><span className="t-label">Correo *</span><input name="email" type="email" required /></label>
      </>}
      <label className="adm-field"><span className="t-label">Tratamiento</span>
        <select name="servicio_id" value={servicio} onChange={(e) => setServicio(e.target.value)}>{servicios.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}</select></label>
      <label className="adm-field"><span className="t-label">Origen</span>
        <select name="origen" defaultValue="telefono"><option value="telefono">Teléfono</option><option value="whatsapp">WhatsApp</option><option value="presencial">Presencial</option><option value="panel">Otro</option></select></label>
      <div className="adm-field--full"><SelectorHorario servicioId={servicio} diaInicial={hoy} /></div>
      <label className="adm-field adm-field--full"><span className="t-label">Observaciones administrativas</span><textarea name="observaciones_admin" rows={2} /></label>
      <div className="adm-form__acciones"><Enviar texto="Crear cita" />
        {estado && <p className={`t-body-s ${estado.ok ? "adm-ok" : "adm-error"}`}>{estado.mensaje}</p>}</div>
    </form>
  );
}
