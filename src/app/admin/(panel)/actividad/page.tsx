import Link from "next/link";
import { Encabezado, Seccion } from "@/components/admin/Piezas";
import { requerirPersonal } from "@/lib/admin";
import { fechaHora } from "@/lib/formato";

export const metadata = { title: "Actividad y sincronización" };

export default async function Actividad() {
  const { sb } = await requerirPersonal("admin");
  const [{ data: registro }, { data: errores }, { data: cola }, { data: ocupados }] = await Promise.all([
    sb.from("registro_actividad").select("fecha, usuario_email, tabla, accion, registro_id").order("fecha", { ascending: false }).limit(100),
    sb.from("registro_errores").select("*").order("fecha", { ascending: false }).limit(30),
    sb.from("cola_sincronizacion").select("id, cita_id, accion, estado, intentos, ultimo_error, proximo_intento, creado_en").in("estado", ["pendiente", "procesando", "error"]).order("id").limit(50),
    sb.from("calendario_ocupado").select("actualizado_en").order("actualizado_en", { ascending: false }).limit(1),
  ]);
  return (
    <>
      <Encabezado titulo="Actividad y sincronización" />
      <Seccion titulo="Google Calendar" descripcion="Las citas se envían a una cola; Apps Script la procesa cada pocos minutos y reintenta los fallos con espera creciente.">
        <p className="t-body-s">Última lectura del calendario de la doctora: {ocupados?.[0] ? fechaHora(ocupados[0].actualizado_en) : <span className="adm-error">todavía ninguna (¿está configurado Apps Script?)</span>}</p>
        {cola?.length ? (
          <div className="adm-tabla-wrap"><table className="adm-tabla">
            <thead><tr><th>#</th><th>Acción</th><th>Estado</th><th>Intentos</th><th>Próximo intento</th><th>Error</th><th></th></tr></thead>
            <tbody>{cola.map((q) => (
              <tr key={q.id}><td>{q.id}</td><td>{q.accion}</td><td>{q.estado}</td><td>{q.intentos}</td><td>{fechaHora(q.proximo_intento)}</td>
                <td className="t-body-s">{q.ultimo_error ?? "—"}</td><td><Link className="t-label link" href={`/admin/citas/${q.cita_id}`}>Cita</Link></td></tr>
            ))}</tbody>
          </table></div>
        ) : <p className="t-body-s soft">No hay sincronizaciones pendientes.</p>}
      </Seccion>
      <Seccion titulo="Errores recientes">
        {errores?.length ? <ul className="adm-lista">{errores.map((e) => (
          <li key={e.id} className="adm-lista__fila"><span className="t-label">{fechaHora(e.fecha)}</span><span className="t-body-s">{e.origen}: {e.mensaje}</span></li>
        ))}</ul> : <p className="t-body-s soft">Sin errores.</p>}
      </Seccion>
      <Seccion titulo="Registro de actividad administrativa" descripcion="Quién cambió qué y cuándo (últimos 100 cambios).">
        <div className="adm-tabla-wrap"><table className="adm-tabla">
          <thead><tr><th>Fecha</th><th>Usuario</th><th>Sección</th><th>Acción</th></tr></thead>
          <tbody>{(registro ?? []).map((r, i) => (
            <tr key={i}><td>{fechaHora(r.fecha)}</td><td>{r.usuario_email ?? <span className="soft">sitio / sistema</span>}</td><td>{r.tabla}</td>
              <td>{{ insert: "creó", update: "modificó", delete: "eliminó" }[r.accion as string] ?? r.accion}{r.tabla === "citas" && r.registro_id && <> · <Link className="link" href={`/admin/citas/${r.registro_id}`}>ver</Link></>}</td></tr>
          ))}</tbody>
        </table></div>
      </Seccion>
    </>
  );
}
