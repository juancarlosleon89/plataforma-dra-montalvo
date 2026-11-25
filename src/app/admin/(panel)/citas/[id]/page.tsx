import Link from "next/link";
import { notFound } from "next/navigation";
import { Avisos, Encabezado, Estado, Seccion } from "@/components/admin/Piezas";
import { FormReprogramar, FormNota } from "@/components/admin/FormulariosCita";
import { requerirPersonal } from "@/lib/admin";
import { fechaHora, fechaLarga, hora, diaLocal } from "@/lib/formato";
import { cambiarEstadoCita, reencolarSincronizacion } from "../../../acciones";

export const metadata = { title: "Detalle de cita" };

export default async function DetalleCita({ params, searchParams }: PageProps<"/admin/citas/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const { sb } = await requerirPersonal();
  const { data: c } = await sb.from("citas")
    .select("*, servicios(id, nombre, duracion_minutos), pacientes(id, nombres, apellidos, telefono, email)")
    .eq("id", id).maybeSingle();
  if (!c) notFound();
  const { data: historial } = await sb.from("registro_actividad").select("fecha, usuario_email, accion, antes, despues")
    .eq("tabla", "citas").eq("registro_id", id).order("fecha", { ascending: false }).limit(20);
  const p = c.pacientes as { id: string; nombres: string; apellidos: string; telefono: string; email: string };
  const s = c.servicios as { id: string; nombre: string; duracion_minutos: number };
  const activa = ["pendiente", "confirmada", "reprogramada"].includes(c.estado);
  const accion = (estado: Parameters<typeof cambiarEstadoCita>[1]) => cambiarEstadoCita.bind(null, id, estado);

  return (
    <>
      <Encabezado titulo={`Cita ${c.codigo}`} volver={{ href: "/admin/citas", texto: "Citas" }}>
        <Estado e={c.estado} />
      </Encabezado>
      <Avisos sp={sp} />
      <div className="adm-dos">
        <Seccion titulo="Reserva">
          <div className="spec-table">
            {[
              ["Paciente", <Link key="p" className="link" href={`/admin/pacientes/${p.id}`}>{p.nombres} {p.apellidos}</Link>],
              ["Teléfono", <a key="t" className="link" href={`tel:${p.telefono}`}>{p.telefono}</a>],
              ["Correo", <a key="e" className="link" href={`mailto:${p.email}`}>{p.email}</a>],
              ["Tratamiento", `${s.nombre} (${s.duracion_minutos} min)`],
              ["Fecha", fechaLarga(c.inicio)],
              ["Hora", `${hora(c.inicio)} – ${hora(c.fin)}`],
              ["Origen", c.origen],
              ["Observaciones del paciente", c.observaciones_paciente ?? "—"],
              ["Creada", fechaHora(c.creado_en)],
              ["Google Calendar", c.sync_estado === "ok" ? `Sincronizada (${c.google_event_id?.slice(0, 12)}…)` : c.sync_estado === "error" ? "Error de sincronización (se reintenta)" : "Pendiente de sincronizar"],
            ].map(([k, v]) => <div className="spec-row in" key={String(k)}><span className="t-label">{k}</span><span className="t-body-l soft">{v}</span></div>)}
          </div>
        </Seccion>
        <Seccion titulo="Acciones">
          <div className="adm-botones">
            {c.estado === "pendiente" && <form action={accion("confirmada")}><button className="cta cta--small cta--accent t-button">Confirmar</button></form>}
            {activa && <form action={accion("atendida")}><button className="cta cta--small t-button">Marcar atendida</button></form>}
            {activa && <form action={accion("no_asistio")}><button className="cta cta--small cta--ghost t-button">No asistió</button></form>}
            {activa && <form action={accion("cancelada")}><button className="cta cta--small cta--ghost t-button">Cancelar cita</button></form>}
            {!activa && c.estado !== "pendiente" && <form action={accion("confirmada")}><button className="cta cta--small cta--ghost t-button">Reactivar como confirmada</button></form>}
            {c.sync_estado !== "ok" && <form action={reencolarSincronizacion.bind(null, id)}><button className="cta cta--small cta--ghost t-button">Reintentar sincronización</button></form>}
          </div>
          {activa && <FormReprogramar id={id} servicioId={s.id} diaInicial={diaLocal(new Date(c.inicio))} />}
          <FormNota id={id} valor={c.observaciones_admin ?? ""} />
        </Seccion>
      </div>
      <Seccion titulo="Historial">
        <ul className="adm-lista">
          {(historial ?? []).map((h, i) => {
            const antes = h.antes as { estado?: string; inicio?: string } | null, despues = h.despues as { estado?: string; inicio?: string } | null;
            const cambio = h.accion === "insert" ? "Creada" : antes?.estado !== despues?.estado ? `Estado: ${antes?.estado} → ${despues?.estado}` : antes?.inicio !== despues?.inicio ? `Horario: ${fechaHora(antes!.inicio!)} → ${fechaHora(despues!.inicio!)}` : "Observación actualizada";
            return <li key={i} className="adm-lista__fila"><span className="t-label">{fechaHora(h.fecha)}</span><span className="t-body-s">{cambio}</span><span className="t-caption soft">{h.usuario_email ?? "sitio web / sistema"}</span></li>;
          })}
        </ul>
      </Seccion>
    </>
  );
}
