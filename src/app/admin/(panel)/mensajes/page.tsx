import { Encabezado } from "@/components/admin/Piezas";
import { requerirPersonal } from "@/lib/admin";
import { fechaHora } from "@/lib/formato";
import { marcarMensaje } from "../../acciones";

export const metadata = { title: "Mensajes" };

export default async function Mensajes({ searchParams }: PageProps<"/admin/mensajes">) {
  const sp = await searchParams;
  const estado = sp.estado === "atendido" ? "atendido" : sp.estado === "todos" ? "todos" : "pendiente";
  const texto = typeof sp.q === "string" ? sp.q.replace(/[%,()]/g, " ").trim() : "";
  const { sb } = await requerirPersonal();
  let q = sb.from("mensajes_contacto").select("*").order("recibido_en", { ascending: false }).limit(200);
  if (estado !== "todos") q = q.eq("estado", estado);
  if (texto) q = q.or(`nombre.ilike.%${texto}%,telefono.ilike.%${texto}%,email.ilike.%${texto}%`);
  if (typeof sp.fecha === "string" && sp.fecha) q = q.gte("recibido_en", `${sp.fecha}T00:00:00-05:00`).lt("recibido_en", `${sp.fecha}T23:59:59-05:00`);
  const { data } = await q;
  return (
    <>
      <Encabezado titulo="Mensajes de contacto" />
      <form className="adm-filtros" action="/admin/mensajes">
        <label className="adm-field"><span className="t-label">Estado</span>
          <select name="estado" defaultValue={estado}><option value="pendiente">Pendientes</option><option value="atendido">Atendidos</option><option value="todos">Todos</option></select></label>
        <label className="adm-field"><span className="t-label">Nombre, teléfono o correo</span><input name="q" defaultValue={texto} /></label>
        <label className="adm-field"><span className="t-label">Fecha</span><input type="date" name="fecha" defaultValue={typeof sp.fecha === "string" ? sp.fecha : ""} /></label>
        <button className="cta cta--small t-button">Filtrar</button>
      </form>
      <div className="adm-coleccion">
        {(data ?? []).map((m) => (
          <article key={m.id} className="adm-mensaje">
            <div className="adm-mensaje__head">
              <p className="t-body"><strong>{m.nombre}</strong> · <a className="link" href={`tel:${m.telefono}`}>{m.telefono}</a>{m.email && <> · <a className="link" href={`mailto:${m.email}`}>{m.email}</a></>}</p>
              <span className="t-caption soft">{fechaHora(m.recibido_en)}</span>
            </div>
            {m.motivo && <p className="t-label soft">{m.motivo}</p>}
            <p className="t-body">{m.mensaje}</p>
            <form action={marcarMensaje.bind(null, m.id, m.estado === "pendiente" ? "atendido" : "pendiente")}>
              <button className={`cta cta--small t-button ${m.estado === "pendiente" ? "" : "cta--ghost"}`}>{m.estado === "pendiente" ? "Marcar atendido" : "Volver a pendiente"}</button>
            </form>
          </article>
        ))}
        {!data?.length && <p className="t-body soft">No hay mensajes.</p>}
      </div>
    </>
  );
}
