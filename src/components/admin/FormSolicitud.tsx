"use client";
import { useActionState } from "react";
import { actualizarSolicitud, invitarUsuario } from "@/app/admin/acciones";
import { Enviar } from "./Formulario";

export function FormSolicitud({ id, estado, respuesta }: { id: string; estado: string; respuesta: string }) {
  const [r, accion] = useActionState(actualizarSolicitud.bind(null, id), null);
  return (
    <form action={accion} className="adm-form">
      <label className="adm-field"><span className="t-label">Estado</span>
        <select name="estado" defaultValue={estado}><option value="recibida">Recibida</option><option value="en_proceso">En proceso</option><option value="resuelta">Resuelta</option><option value="rechazada">Rechazada</option></select></label>
      <label className="adm-field adm-field--full"><span className="t-label">Respuesta / gestión realizada</span><textarea name="respuesta" rows={3} defaultValue={respuesta} /></label>
      <div className="adm-form__acciones"><Enviar texto="Guardar" />{r && <p className={`t-body-s ${r.ok ? "adm-ok" : "adm-error"}`}>{r.mensaje}</p>}</div>
    </form>
  );
}

export function FormInvitar() {
  const [r, accion] = useActionState(invitarUsuario, null);
  return (
    <form action={accion} className="adm-form">
      <label className="adm-field"><span className="t-label">Nombre</span><input name="nombre" required /></label>
      <label className="adm-field"><span className="t-label">Correo</span><input name="email" type="email" required /></label>
      <label className="adm-field"><span className="t-label">Rol</span>
        <select name="rol" defaultValue="recepcion"><option value="recepcion">Recepción (agenda y pacientes)</option><option value="admin">Administración (todo)</option></select></label>
      <div className="adm-form__acciones"><Enviar texto="Enviar invitación" />{r && <p className={`t-body-s ${r.ok ? "adm-ok" : "adm-error"}`}>{r.mensaje}</p>}</div>
    </form>
  );
}
