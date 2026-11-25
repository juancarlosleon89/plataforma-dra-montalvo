import Link from "next/link";
import { Avisos, Encabezado, Estado, GraficoSemanas, Seccion } from "@/components/admin/Piezas";
import { requerirPersonal } from "@/lib/admin";
import { fechaCorta, hora } from "@/lib/formato";

export const metadata = { title: "Resumen" };

type Ind = { total: number; pendientes: number; confirmadas: number; canceladas: number; atendidas: number; no_asistio: number; proximas: number;
  pacientes: number; mensajes_pendientes: number; solicitudes_pendientes: number; sync_errores: number;
  por_semana: { semana: string; atendidas: number; activas: number; canceladas: number }[]; por_servicio: { servicio: string; total: number }[] };

export default async function Resumen({ searchParams }: PageProps<"/admin">) {
  const sp = await searchParams;
  const { sb, yo } = await requerirPersonal();
  const [{ data: ind }, { data: proximas }, { data: agenda }] = await Promise.all([
    sb.rpc("admin_indicadores"),
    sb.from("citas").select("id, inicio, estado, servicios(nombre), pacientes(nombres, apellidos)")
      .gte("inicio", new Date().toISOString()).in("estado", ["pendiente", "confirmada", "reprogramada"]).order("inicio").limit(8),
    sb.from("configuracion_agenda").select("horarios_provisionales").eq("id", 1).single(),
  ]);
  const i = (ind ?? {}) as Ind;
  const tarjetas = [
    { t: "Total de citas", n: i.total, href: "/admin/citas" },
    { t: "Pendientes", n: i.pendientes, href: "/admin/citas?estado=pendiente" },
    { t: "Confirmadas", n: i.confirmadas, href: "/admin/citas?estado=confirmada" },
    { t: "Canceladas", n: i.canceladas, href: "/admin/citas?estado=cancelada" },
    { t: "Atendidas", n: i.atendidas, href: "/admin/citas?estado=atendida" },
    { t: "Próximas", n: i.proximas, href: "/admin/citas?vista=semana" },
    { t: "Pacientes", n: i.pacientes, href: "/admin/pacientes" },
    { t: "No asistió", n: i.no_asistio, href: "/admin/citas?estado=no_asistio" },
  ];
  return (
    <>
      <Encabezado titulo={`Hola, ${yo.nombre.split(" ")[0]}`}>
        <Link className="cta cta--small cta--accent t-button" href="/admin/citas/nueva">Nueva cita</Link>
      </Encabezado>
      <Avisos sp={sp} />
      {agenda?.horarios_provisionales && <p className="adm-aviso t-body-s">Los horarios de atención están marcados como <strong>provisionales</strong>. Revíselos en <Link className="link" href="/admin/agenda">Agenda y horarios</Link>.</p>}
      {i.sync_errores > 0 && <p className="adm-aviso adm-aviso--error t-body-s">{i.sync_errores} cita(s) no se pudieron sincronizar con Google Calendar. Se reintentan solas; vea <Link className="link" href="/admin/actividad">Actividad</Link>.</p>}
      {(i.mensajes_pendientes > 0 || i.solicitudes_pendientes > 0) && (
        <p className="adm-aviso t-body-s">
          {i.mensajes_pendientes > 0 && <><Link className="link" href="/admin/mensajes">{i.mensajes_pendientes} mensaje(s) sin atender</Link>. </>}
          {i.solicitudes_pendientes > 0 && <Link className="link" href="/admin/privacidad">{i.solicitudes_pendientes} solicitud(es) de datos personales</Link>}
        </p>
      )}
      <div className="adm-stats">
        {tarjetas.map((t) => <Link key={t.t} href={t.href} className="adm-stat"><span className="t-label">{t.t}</span><span className="adm-stat__n">{t.n ?? 0}</span></Link>)}
      </div>
      <div className="adm-dos">
        <Seccion titulo="Citas por semana" descripcion="Últimas 8 semanas y próximas 4.">
          <GraficoSemanas datos={i.por_semana ?? []} />
        </Seccion>
        <Seccion titulo="Próximas citas">
          {proximas?.length ? (
            <ul className="adm-lista">
              {proximas.map((c) => {
                const p = c.pacientes as unknown as { nombres: string; apellidos: string } | null;
                const s = c.servicios as unknown as { nombre: string } | null;
                return (
                  <li key={c.id}><Link href={`/admin/citas/${c.id}`} className="adm-lista__fila">
                    <span className="t-label">{fechaCorta(c.inicio)} · {hora(c.inicio)}</span>
                    <span className="t-body">{p?.nombres} {p?.apellidos}<br /><span className="soft t-body-s">{s?.nombre}</span></span>
                    <Estado e={c.estado} />
                  </Link></li>
                );
              })}
            </ul>
          ) : <p className="t-body-s soft">No hay citas próximas.</p>}
        </Seccion>
      </div>
      {i.por_servicio?.length > 0 && (
        <Seccion titulo="Citas por tratamiento">
          <div className="spec-table">
            {i.por_servicio.map((s) => <div className="spec-row in" key={s.servicio}><span className="t-label">{s.servicio}</span><span className="t-body-l soft">{s.total}</span></div>)}
          </div>
        </Seccion>
      )}
    </>
  );
}
