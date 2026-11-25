import Link from "next/link";
import { Avisos, Encabezado, Estado } from "@/components/admin/Piezas";
import { requerirPersonal } from "@/lib/admin";
import { diaLocal, fechaCorta, hora, lunesDe, sumarDias } from "@/lib/formato";
import { ESTADOS_CITA } from "@/lib/tipos";

export const metadata = { title: "Citas" };

type Fila = { id: string; codigo: string; inicio: string; fin: string; estado: string; origen: string; sync_estado: string;
  servicios: { nombre: string } | null; pacientes: { nombres: string; apellidos: string; telefono: string; email: string } | null };

export default async function Citas({ searchParams }: PageProps<"/admin/citas">) {
  const sp = await searchParams;
  const g = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const vista = g("vista") === "semana" ? "semana" : "lista";
  const { sb } = await requerirPersonal();
  const { data: servicios } = await sb.from("servicios").select("id, nombre").order("orden");

  const semana = lunesDe(g("semana") || diaLocal());
  const desde = vista === "semana" ? semana : g("desde");
  const hasta = vista === "semana" ? sumarDias(semana, 7) : g("hasta") ? sumarDias(g("hasta"), 1) : "";

  let q = sb.from("citas").select("id, codigo, inicio, fin, estado, origen, sync_estado, servicios(nombre), pacientes!inner(nombres, apellidos, telefono, email)")
    .order("inicio", { ascending: vista === "semana" || !!desde }).limit(300);
  if (desde) q = q.gte("inicio", `${desde}T00:00:00-05:00`);
  if (hasta) q = q.lt("inicio", `${hasta}T00:00:00-05:00`);
  if (g("estado")) q = q.eq("estado", g("estado"));
  if (g("servicio")) q = q.eq("servicio_id", g("servicio"));
  if (g("q")) {
    const t = g("q").replace(/[%,()]/g, " ").trim();
    q = q.or(`nombres.ilike.%${t}%,apellidos.ilike.%${t}%,telefono.ilike.%${t}%,email.ilike.%${t}%`, { referencedTable: "pacientes" });
  }
  const { data, error } = await q;
  const citas = (data ?? []) as unknown as Fila[];

  const enlace = (extra: Record<string, string>) => {
    const p = new URLSearchParams(Object.fromEntries(Object.entries({ ...Object.fromEntries(Object.entries(sp).filter(([, v]) => typeof v === "string")), ...extra }).filter(([, v]) => v)) as Record<string, string>);
    return `/admin/citas?${p.toString()}`;
  };

  return (
    <>
      <Encabezado titulo="Citas">
        <Link className={`cta cta--small t-button ${vista === "lista" ? "" : "cta--ghost"}`} href={enlace({ vista: "lista" })}>Lista</Link>
        <Link className={`cta cta--small t-button ${vista === "semana" ? "" : "cta--ghost"}`} href={enlace({ vista: "semana" })}>Calendario</Link>
        <Link className="cta cta--small cta--accent t-button" href="/admin/citas/nueva">Nueva cita</Link>
      </Encabezado>
      <Avisos sp={sp} />
      {error && <p className="adm-aviso adm-aviso--error">{error.message}</p>}

      <form className="adm-filtros" action="/admin/citas">
        <input type="hidden" name="vista" value={vista} />
        <label className="adm-field"><span className="t-label">Paciente</span><input name="q" defaultValue={g("q")} placeholder="Nombre, teléfono o correo" /></label>
        <label className="adm-field"><span className="t-label">Estado</span>
          <select name="estado" defaultValue={g("estado")}><option value="">Todos</option>{ESTADOS_CITA.map((e) => <option key={e.valor} value={e.valor}>{e.etiqueta}</option>)}</select></label>
        <label className="adm-field"><span className="t-label">Tratamiento</span>
          <select name="servicio" defaultValue={g("servicio")}><option value="">Todos</option>{servicios?.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}</select></label>
        {vista === "lista" ? <>
          <label className="adm-field"><span className="t-label">Desde</span><input type="date" name="desde" defaultValue={g("desde")} /></label>
          <label className="adm-field"><span className="t-label">Hasta</span><input type="date" name="hasta" defaultValue={g("hasta")} /></label>
        </> : <label className="adm-field"><span className="t-label">Semana del</span><input type="date" name="semana" defaultValue={semana} /></label>}
        <button className="cta cta--small t-button">Filtrar</button>
        <Link className="t-label link" href={`/admin/citas?vista=${vista}`}>Limpiar</Link>
      </form>

      {vista === "lista" ? (
        citas.length ? (
          <div className="adm-tabla-wrap">
            <table className="adm-tabla">
              <thead><tr><th>Fecha</th><th>Hora</th><th>Paciente</th><th>Tratamiento</th><th>Estado</th><th>Calendar</th><th></th></tr></thead>
              <tbody>
                {citas.map((c) => (
                  <tr key={c.id}>
                    <td>{fechaCorta(c.inicio)}</td><td>{hora(c.inicio)}</td>
                    <td>{c.pacientes?.nombres} {c.pacientes?.apellidos}<br /><span className="soft t-body-s">{c.pacientes?.telefono}</span></td>
                    <td>{c.servicios?.nombre}</td><td><Estado e={c.estado} /></td>
                    <td className="t-label">{c.sync_estado === "ok" ? "✓" : c.sync_estado === "error" ? <span className="adm-error">Error</span> : <span className="soft">…</span>}</td>
                    <td><Link className="t-label link" href={`/admin/citas/${c.id}`}>Abrir</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="t-body soft">No hay citas con esos filtros.</p>
      ) : (
        <Semana lunes={semana} citas={citas} anterior={enlace({ semana: sumarDias(semana, -7) })} siguiente={enlace({ semana: sumarDias(semana, 7) })} />
      )}
    </>
  );
}

function Semana({ lunes, citas, anterior, siguiente }: { lunes: string; citas: Fila[]; anterior: string; siguiente: string }) {
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
  const H0 = 8, H1 = 19, alto = 48; // px por hora
  const nombres = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const hoy = diaLocal();
  return (
    <div className="adm-semana">
      <div className="adm-semana__nav">
        <Link className="btn-icon" href={anterior} aria-label="Semana anterior">←</Link>
        <p className="t-label">Semana del {fechaCorta(`${lunes}T12:00:00-05:00`)}</p>
        <Link className="btn-icon" href={siguiente} aria-label="Semana siguiente">→</Link>
      </div>
      <div className="adm-semana__grid" style={{ ["--alto" as string]: `${alto}px`, ["--horas" as string]: H1 - H0 }}>
        <div className="adm-semana__horas">{Array.from({ length: H1 - H0 }, (_, i) => <span key={i} className="t-caption soft">{String(H0 + i).padStart(2, "0")}:00</span>)}</div>
        {dias.map((d, i) => (
          <div key={d} className={`adm-semana__dia ${d === hoy ? "is-hoy" : ""}`}>
            <p className="adm-semana__titulo t-label">{nombres[i]} {d.slice(8)}</p>
            <div className="adm-semana__col">
              {citas.filter((c) => diaLocal(new Date(c.inicio)) === d).map((c) => {
                const [h, m] = hora(c.inicio).split(":").map(Number);
                const dur = (new Date(c.fin).getTime() - new Date(c.inicio).getTime()) / 60000;
                return (
                  <Link key={c.id} href={`/admin/citas/${c.id}`} className={`adm-evento adm-evento--${c.estado}`}
                    style={{ top: ((h - H0) + m / 60) * alto, height: Math.max(22, (dur / 60) * alto - 2) }}>
                    <span className="t-label">{hora(c.inicio)}</span> <span className="t-body-s">{c.pacientes?.nombres} {c.pacientes?.apellidos?.charAt(0)}.</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
