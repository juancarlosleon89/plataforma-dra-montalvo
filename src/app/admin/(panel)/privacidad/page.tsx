import Link from "next/link";
import { Encabezado, Seccion } from "@/components/admin/Piezas";
import { FormSolicitud } from "@/components/admin/FormSolicitud";
import { requerirPersonal } from "@/lib/admin";
import { fechaHora } from "@/lib/formato";

export const metadata = { title: "Protección de datos" };

const TIPOS: Record<string, string> = { acceso: "Acceso", rectificacion: "Rectificación", eliminacion: "Eliminación", oposicion: "Oposición", portabilidad: "Portabilidad", suspension: "Suspensión" };

export default async function Privacidad() {
  const { sb } = await requerirPersonal();
  const { data } = await sb.from("solicitudes_derechos").select("*").order("creado_en", { ascending: false });
  return (
    <>
      <Encabezado titulo="Protección de datos personales" />
      <p className="t-body-s soft">Solicitudes de los titulares (LOPDP). Responda dentro del plazo legal. Para «Acceso» o «Portabilidad», use los datos del paciente; para «Eliminación», abra la ficha del paciente y use «Eliminar datos personales».</p>
      <Seccion titulo="Solicitudes">
        <div className="adm-coleccion">
          {(data ?? []).map((s) => (
            <details key={s.id} className="adm-item" open={s.estado === "recibida"}>
              <summary className="adm-item__resumen">
                <span className="t-body"><strong>{TIPOS[s.tipo]}</strong> · {s.nombre} · {s.email} · <span className="soft">{fechaHora(s.creado_en)}</span></span>
                <span className="t-label">{s.estado}</span>
              </summary>
              {s.detalle && <p className="t-body">{s.detalle}</p>}
              {s.paciente_id ? <p className="t-body-s"><Link className="link" href={`/admin/pacientes/${s.paciente_id}`}>Abrir ficha del paciente</Link></p> : <p className="t-body-s soft">No hay un paciente registrado con ese correo.</p>}
              <FormSolicitud id={s.id} estado={s.estado} respuesta={s.respuesta ?? ""} />
            </details>
          ))}
          {!data?.length && <p className="t-body soft">No hay solicitudes.</p>}
        </div>
      </Seccion>
    </>
  );
}
