import Link from "next/link";
import { NavLink, Tag } from "@/components/ui";
import type { Servicio } from "@/lib/tipos";

/** Tarjeta de tratamiento (ProductCard en Figma). */
export function TarjetaServicio({ s, wa }: { s: Servicio; wa: string }) {
  return (
    <article className="card" data-cat={s.categoria_id ?? ""}>
      <Link href={`/tratamientos/${s.slug}`} className="card__media" aria-label={s.nombre}>
        {s.imagen_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={s.imagen_url} alt="" loading="lazy" />
          : <span className="card__mono" aria-hidden="true">{s.nombre.charAt(0)}</span>}
      </Link>
      <div className="card__line t-label">
        <Link href={`/tratamientos/${s.slug}`}>{s.nombre}{s.destacado && <Tag>Destacado</Tag>}</Link>
        {s.mostrar_precio && s.precio != null && <span>USD {Number(s.precio).toFixed(2)}</span>}
      </div>
      {s.descripcion && <p className="t-body-s soft">{s.descripcion}</p>}
      <div className="card__ctas">
        {s.reservable && <Link className="cta cta--small t-button" href={`/agendar?servicio=${s.slug}`}>Agendar</Link>}
        <NavLink href={wa} externo>Solicitar información</NavLink>
      </div>
    </article>
  );
}
