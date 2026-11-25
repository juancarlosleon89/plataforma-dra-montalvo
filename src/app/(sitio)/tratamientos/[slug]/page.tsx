import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Cta, NavLink, Rotulo, SpecTable, Tag } from "@/components/ui";
import { obtenerServicio, obtenerServicios, obtenerSitio, obtenerTextos } from "@/lib/datos";
import { enlaceWhatsapp } from "@/lib/formato";

export async function generateStaticParams() {
  try {
    const { servicios } = await obtenerServicios();
    return servicios.map((s) => ({ slug: s.slug }));
  } catch {
    return []; // si la base no está disponible en la compilación, se generan bajo demanda
  }
}

export async function generateMetadata({ params }: PageProps<"/tratamientos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const s = await obtenerServicio(slug);
  if (!s) return {};
  return { title: `${s.nombre} en Ambato`, description: s.descripcion ?? undefined, alternates: { canonical: `/tratamientos/${s.slug}` } };
}

/** Ficha del tratamiento: plantilla "ficha de producto" (imagen sticky + información). */
export default async function FichaTratamiento({ params }: PageProps<"/tratamientos/[slug]">) {
  const { slug } = await params;
  const [s, { sitio }, t] = await Promise.all([obtenerServicio(slug), obtenerSitio(), obtenerTextos()]);
  if (!s) notFound();
  const wa = enlaceWhatsapp({ ...sitio, mensaje_whatsapp: `Hola, quisiera información sobre ${s.nombre}.` });
  const filas = [
    s.objetivo && { etiqueta: t["det.objetivo"], valor: s.objetivo },
    s.beneficios.length > 0 && { etiqueta: t["det.beneficios"], valor: s.beneficios.join(" · ") },
    s.indicaciones && { etiqueta: t["det.indicaciones"], valor: s.indicaciones },
    s.mostrar_precio && s.precio != null && { etiqueta: "Precio", valor: `USD ${Number(s.precio).toFixed(2)}` },
  ].filter(Boolean) as { etiqueta: string; valor: string }[];

  return (
    <section className="pdp" aria-labelledby="pdp-title">
      <div className="pdp__media">
        {s.imagen_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={s.imagen_url} alt={s.nombre} />
          : <span className="card__mono" aria-hidden="true">{s.nombre.charAt(0)}</span>}
      </div>
      <div className="pdp__info">
        <nav aria-label="Ruta" className="pdp__crumbs"><NavLink href="/#servicios">{t["det.ruta"]}</NavLink></nav>
        <h1 id="pdp-title" className="t-display">{s.nombre} {s.destacado && <Tag>{t["tarjeta.destacado"]}</Tag>}</h1>
        {s.descripcion && <p className="t-body-l soft">{s.descripcion}</p>}
        <SpecTable filas={filas} />
        <p className="t-body-s soft">{t["det.nota"]}</p>
        <div className="pdp__ctas">
          {s.reservable && <Cta href={`/agendar?servicio=${s.slug}`} variante="acento"><span>{t["det.agendar"]}</span><span aria-hidden="true">→</span></Cta>}
          <Cta href={wa} variante="contorno" externo><span>{t["det.informacion"]}</span></Cta>
        </div>
        <Rotulo className="soft">{sitio.direccion}</Rotulo>
      </div>
    </section>
  );
}
