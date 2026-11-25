import Link from "next/link";
import { etiquetaEstado } from "@/lib/tipos";

export function Encabezado({ titulo, children, volver }: { titulo: string; children?: React.ReactNode; volver?: { href: string; texto: string } }) {
  return (
    <header className="adm-head">
      <div>
        {volver && <Link className="t-label link" href={volver.href}>← {volver.texto}</Link>}
        <h1 className="t-display">{titulo}</h1>
      </div>
      {children && <div className="adm-head__acciones">{children}</div>}
    </header>
  );
}

/** Mensajes de resultado que llegan por la URL (?ok= / ?error=) tras una acción. */
export function Avisos({ sp }: { sp: Record<string, string | string[] | undefined> }) {
  const ok = typeof sp.ok === "string" ? sp.ok : null;
  const err = typeof sp.error === "string" ? (sp.error === "permiso" ? "Su rol no tiene acceso a esa sección." : sp.error) : null;
  return (
    <>
      {ok && <p className="adm-aviso adm-aviso--ok t-body-s" role="status">{ok}</p>}
      {err && <p className="adm-aviso adm-aviso--error t-body-s" role="alert">{err}</p>}
    </>
  );
}

export const Estado = ({ e }: { e: string }) => <span className={`adm-estado adm-estado--${e} t-label`}>{etiquetaEstado(e)}</span>;

export function Seccion({ titulo, children, descripcion }: { titulo: string; descripcion?: string; children: React.ReactNode }) {
  return (
    <section className="adm-sec">
      <h2 className="t-title"><em>{titulo}</em></h2>
      {descripcion && <p className="t-body-s soft">{descripcion}</p>}
      {children}
    </section>
  );
}

/** Gráfico de barras apiladas simple (SVG, accesible con tabla oculta). */
export function GraficoSemanas({ datos }: { datos: { semana: string; atendidas: number; activas: number; canceladas: number }[] }) {
  if (!datos.length) return <p className="t-body-s soft">Aún no hay citas para graficar.</p>;
  const max = Math.max(1, ...datos.map((d) => d.atendidas + d.activas + d.canceladas));
  const W = 640, H = 200, b = W / datos.length;
  const series = [
    { k: "atendidas" as const, color: "var(--color-ink)", texto: "Atendidas" },
    { k: "activas" as const, color: "var(--color-accent)", texto: "Agendadas" },
    { k: "canceladas" as const, color: "rgba(15,15,15,.25)", texto: "Canceladas / no asistió" },
  ];
  return (
    <figure className="adm-chart">
      <svg viewBox={`0 0 ${W} ${H + 24}`} role="img" aria-label="Citas por semana">
        {datos.map((d, i) => {
          let y = H;
          return (
            <g key={d.semana}>
              {series.map((s) => {
                const h = (d[s.k] / max) * (H - 10);
                y -= h;
                return h > 0 ? <rect key={s.k} x={i * b + b * 0.2} y={y} width={b * 0.6} height={h} fill={s.color} /> : null;
              })}
              <text x={i * b + b / 2} y={H + 16} textAnchor="middle" fontSize="10" fill="currentColor" opacity=".65">{d.semana.slice(5).replace("-", "/")}</text>
            </g>
          );
        })}
        <line x1="0" x2={W} y1={H} y2={H} stroke="rgba(15,15,15,.2)" />
      </svg>
      <figcaption className="adm-chart__legend t-label">
        {series.map((s) => <span key={s.k}><i style={{ background: s.color }} /> {s.texto}</span>)}
      </figcaption>
      <table className="sr-only"><caption>Citas por semana</caption><tbody>
        {datos.map((d) => <tr key={d.semana}><th>{d.semana}</th><td>{d.atendidas} atendidas, {d.activas} agendadas, {d.canceladas} canceladas</td></tr>)}
      </tbody></table>
    </figure>
  );
}
