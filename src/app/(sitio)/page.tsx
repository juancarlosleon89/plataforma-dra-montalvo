import Link from "next/link";
import { CarruselInstagram } from "@/components/sitio/CarruselInstagram";
import { Acordeon, Cta, NavLink, Rotulo, SpecTable } from "@/components/ui";
import { Comparador, FormularioContacto, Galeria, RevelarPalabras } from "@/components/sitio/Interactivos";
import { TarjetaServicio } from "@/components/sitio/TarjetaServicio";
import { obtenerContenido, obtenerServicios, obtenerSitio, obtenerTextos, resumenHorarios } from "@/lib/datos";
import { enlaceWhatsapp } from "@/lib/formato";
import { env } from "@/lib/env";

export default async function Inicio() {
  const [{ sitio, inst }, { servicios }, contenido, t] = await Promise.all([obtenerSitio(), obtenerServicios(), obtenerContenido(), obtenerTextos()]);
  const wa = enlaceWhatsapp(sitio);
  const horarios = resumenHorarios(contenido.horarios);
  const nombreServicio = (id: string | null) => servicios.find((s) => s.id === id)?.nombre;
  const instagram = (sitio.instagram_publicaciones ?? [])
    .map((u) => u.match(/instagram\.com\/(?:[\w.]+\/)?(p|reel|tv)\/([\w-]+)/))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => ({ tipo: m[1] === "tv" ? "p" : m[1], codigo: m[2] }))
    .slice(0, 12);
  // El carrusel muestra solo videos (reels); si no hay ninguno, usa las publicaciones disponibles.
  const reels = instagram.filter((p) => p.tipo === "reel");
  const videosInstagram = reels.length ? reels : instagram;
  const perfilInstagram = sitio.redes?.instagram || null;
  const usuarioInstagram = perfilInstagram?.match(/instagram\.com\/([\w.]+)/)?.[1] ?? "instagram";
  const mapsQ = encodeURIComponent(sitio.maps_query ?? sitio.direccion ?? "");

  const perfilFilas = [
    inst.perfil_especialidades.length > 0 && { etiqueta: t["perfil.especialidades"], valor: inst.perfil_especialidades.join(" · ") },
    inst.perfil_formacion.length > 0 && { etiqueta: t["perfil.formacion"], valor: inst.perfil_formacion.map((f) => [f.titulo, f.institucion, f.anio].filter(Boolean).join(", ")).join(" / ") },
    inst.perfil_experiencia && { etiqueta: t["perfil.experiencia"], valor: inst.perfil_experiencia },
    inst.perfil_certificaciones.length > 0 && { etiqueta: t["perfil.certificaciones"], valor: inst.perfil_certificaciones.join(" · ") },
    inst.perfil_cursos.length > 0 && { etiqueta: t["perfil.cursos"], valor: inst.perfil_cursos.join(" · ") },
  ].filter(Boolean) as { etiqueta: string; valor: string }[];

  const contactoFilas = [
    { etiqueta: t["contacto.direccion"], valor: `${sitio.direccion ?? ""}${sitio.ciudad ? `, ${sitio.ciudad}` : ""}` },
    sitio.referencias && { etiqueta: t["contacto.referencias"], valor: sitio.referencias },
    horarios.length > 0 && { etiqueta: t["contacto.horarios"], valor: <>{horarios.map((h) => <span key={h.dias} className="block">{h.dias}: {h.horas}</span>)}</> },
    sitio.telefono && { etiqueta: t["contacto.telefono"], valor: <a href={`tel:${sitio.telefono}`}>{sitio.telefono}</a> },
    sitio.email && { etiqueta: t["contacto.correo"], valor: <a href={`mailto:${sitio.email}`}>{sitio.email}</a> },
    sitio.redes?.instagram && { etiqueta: t["contacto.redes"], valor: <a href={sitio.redes.instagram} target="_blank" rel="noopener noreferrer">Instagram</a> },
  ].filter(Boolean) as { etiqueta: string; valor: React.ReactNode }[];

  const jsonLd = {
    "@context": "https://schema.org", "@type": "Dentist",
    name: `${sitio.nombre_comercial} · ${sitio.especialidad ?? ""}`, url: env.sitioUrl, image: `${env.sitioUrl}/img/recepcion.webp`,
    address: { "@type": "PostalAddress", streetAddress: sitio.direccion, addressLocality: "Ambato", addressRegion: "Tungurahua", addressCountry: "EC" },
    ...(sitio.telefono ? { telephone: sitio.telefono } : {}),
    sameAs: Object.values(sitio.redes ?? {}).filter(Boolean),
    openingHoursSpecification: contenido.horarios.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][h.dia_semana],
      opens: h.hora_inicio.slice(0, 5), closes: h.hora_fin.slice(0, 5),
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* Portada */}
      <section className="hero" aria-labelledby="hero-title">
        <h1 id="hero-title" className="sr-only">{sitio.nombre_comercial} · {sitio.especialidad} en Ambato</h1>
        <figure className="hero__figure">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sitio.hero_imagen_url ?? "/img/doctora-bata.webp"} alt={`${sitio.nombre_comercial} en su consultorio`} width={1440} height={810} fetchPriority="high" />
        </figure>
        <div className="hero__copy">
          <div className="hero__intro">
            <p className="hero__claim">{sitio.hero_titulo}</p>
          </div>
          <div className="hero__action">
            <p className="t-body hero__sub">{sitio.hero_subtitulo}</p>
            <div className="hero__ctas">
              <Cta href="/agendar" variante="acento"><span>{t["inicio.boton_agendar"]}</span><span aria-hidden="true">→</span></Cta>
              <Cta href={wa} variante="contorno" externo><span>{t["inicio.boton_whatsapp"]}</span></Cta>
            </div>
          </div>
        </div>
      </section>

      <section className="statement" aria-label="Filosofía de atención">
        <RevelarPalabras texto={t["inicio.frase"]} />
      </section>

      {/* Nosotros */}
      <section className="section narrow" id="nosotros" aria-labelledby="nosotros-title">
        <Rotulo>{t["inicio.nosotros_rotulo"]}</Rotulo>
        <h2 id="nosotros-title" className="t-display">{t["inicio.nosotros_titulo"]}</h2>
        {inst.presentacion && <p className="t-body-l soft">{inst.presentacion}</p>}
        {inst.historia && <div><h3 className="t-label">{t["inicio.historia"]}</h3><p className="t-body">{inst.historia}</p></div>}
        {(inst.mision || inst.vision) && (
          <div className="two">
            {inst.mision && <div><h3 className="t-label">{t["inicio.mision"]}</h3><p className="t-body">{inst.mision}</p></div>}
            {inst.vision && <div><h3 className="t-label">{t["inicio.vision"]}</h3><p className="t-body">{inst.vision}</p></div>}
          </div>
        )}
        {inst.valores.length > 0 && <p className="t-body soft">{inst.valores.join(" · ")}</p>}
      </section>

      {/* Doctora */}
      <section className="section doctor" id="doctora" aria-labelledby="doctora-title">
        <div className="doctor__media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={inst.perfil_foto_url ?? "/img/doctora-consultorio.webp"} alt={`Retrato de ${inst.perfil_nombre}`} width={288} height={512} loading="lazy" />
        </div>
        <div className="doctor__info">
          <Rotulo>{t["inicio.perfil_rotulo"]}</Rotulo>
          <h2 id="doctora-title" className="t-display">{inst.perfil_nombre}</h2>
          <p className="t-title doctor__role">{inst.perfil_titulo}</p>
          {inst.perfil_biografia && <p className="t-body-l soft">{inst.perfil_biografia}</p>}
          <SpecTable filas={perfilFilas} />
          {inst.perfil_enfoque && <p className="t-body soft"><em>{inst.perfil_enfoque}</em></p>}
        </div>
      </section>

      {/* Servicios */}
      <section className="section" id="servicios" aria-labelledby="servicios-title">
        <div className="section__head">
          <h2 id="servicios-title" className="t-display">{t["inicio.tratamientos_titulo"]} <sup className="t-label">{servicios.length}</sup></h2>
        </div>
        <div className="cards">{servicios.map((s) => <TarjetaServicio key={s.id} s={s} wa={wa} tx={t} />)}</div>
      </section>

      {/* Resultados */}
      <section className="section" id="resultados" aria-labelledby="resultados-title">
        <div className="narrow center">
          <Rotulo>{t["inicio.resultados_rotulo"]}</Rotulo>
          <h2 id="resultados-title" className="t-display">{t["inicio.resultados_titulo"]}</h2>
          <p className="t-body soft">{t["inicio.resultados_texto"]}</p>
        </div>
        {contenido.casos.length > 0 ? (
          <div className="cases">
            {contenido.casos.map((c) => (
              <article className="case" key={c.id}>
                <Comparador antes={c.imagen_antes_url} despues={c.imagen_despues_url} titulo={c.titulo ?? nombreServicio(c.servicio_id) ?? "Caso"} />
                <div className="card__line t-label"><span>{nombreServicio(c.servicio_id) ?? c.titulo}</span>{c.periodo && <span>{c.periodo}</span>}</div>
                {c.descripcion && <p className="t-body-s soft">{c.descripcion}</p>}
              </article>
            ))}
          </div>
        ) : (
          <p className="t-body soft center empty">{t["inicio.resultados_vacio"]}</p>
        )}
      </section>

      {/* Sección destacada (editable en Configuración) */}
      {sitio.destacado_visible !== false && sitio.destacado_titulo && (
        <section className="section feature" aria-labelledby="feature-title">
          {sitio.destacado_imagen_url && (
            <figure className="feature__media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sitio.destacado_imagen_url} alt={sitio.destacado_titulo} loading="lazy" />
            </figure>
          )}
          <div className="narrow center">
            {sitio.destacado_rotulo && <Rotulo>{sitio.destacado_rotulo}</Rotulo>}
            <h2 id="feature-title" className="t-heading">{sitio.destacado_titulo}</h2>
            {sitio.destacado_texto && <p className="t-body soft">{sitio.destacado_texto}</p>}
            {sitio.destacado_boton_texto && (
              <Cta href={sitio.destacado_boton_enlace || "/agendar"} externo={/^https?:/.test(sitio.destacado_boton_enlace ?? "")}><span>{sitio.destacado_boton_texto}</span></Cta>
            )}
          </div>
        </section>
      )}

      {/* Instalaciones */}
      <section className="section" id="instalaciones" aria-labelledby="instalaciones-title">
        <div className="section__head">
          <h2 id="instalaciones-title" className="t-display">{t["inicio.consultorio_titulo"]}</h2>
          <p className="t-body soft section__aside">{t["inicio.consultorio_texto"]}</p>
        </div>
        <Galeria items={contenido.galeria} />
      </section>

      {/* Testimonios */}
      <section className="section narrow center" id="testimonios" aria-labelledby="testimonios-title">
        <Rotulo>{t["inicio.experiencias_rotulo"]}</Rotulo>
        <h2 id="testimonios-title" className="t-display">{t["inicio.experiencias_titulo"]}</h2>
        <div className="testimonials">
          {contenido.testimonios.length > 0 ? contenido.testimonios.map((t) => (
            <blockquote className="quote" key={t.id}>
              <p className="t-title"><em>“{t.comentario}”</em></p>
              <footer className="t-label">{t.nombre_autorizado}{t.servicio_id && <> · <span className="soft">{nombreServicio(t.servicio_id)}</span></>}</footer>
            </blockquote>
          )) : (
            <>
              <p className="t-body soft">{t["inicio.experiencias_vacio"]}</p>
              {sitio.redes?.instagram && <NavLink href={sitio.redes.instagram} externo>{t["inicio.experiencias_enlace"]}</NavLink>}
            </>
          )}
        </div>
      </section>

      {/* Llamado a agendar */}
      <section className="section narrow center" aria-labelledby="agenda-cta">
        <Rotulo>{t["inicio.agenda_rotulo"]}</Rotulo>
        <h2 id="agenda-cta" className="t-display">{t["inicio.agenda_titulo"]}</h2>
        <p className="t-body soft">{t["inicio.agenda_texto"]}</p>
        <div><Cta href="/agendar"><span>{t["inicio.agenda_boton"]}</span><span aria-hidden="true">→</span></Cta></div>
      </section>

      {/* Instagram */}
      {(videosInstagram.length > 0 || perfilInstagram) && (
        <section className="section" id="instagram" aria-labelledby="instagram-title">
          <div className="section__head">
            <h2 id="instagram-title" className="t-display">{t["inicio.instagram_titulo"]}</h2>
            {perfilInstagram && <NavLink href={perfilInstagram} externo>{`@${usuarioInstagram} ↗`}</NavLink>}
          </div>
          {videosInstagram.length > 0 && <CarruselInstagram videos={videosInstagram} />}
          {perfilInstagram && (
            <div className="center insta__cta">
              <Cta href={perfilInstagram} externo variante="contorno"><span>{t["inicio.instagram_boton"]}</span><span aria-hidden="true">↗</span></Cta>
            </div>
          )}
        </section>
      )}

      {/* Preguntas */}
      <section className="section faq" id="preguntas" aria-labelledby="faq-title">
        <h2 id="faq-title" className="t-display center">{t["inicio.faq_titulo"]}</h2>
        <Acordeon items={contenido.faq} />
      </section>

      {/* Ubicación y contacto */}
      <section className="section location" id="contacto" aria-labelledby="contacto-title">
        <div className="location__map">
          <iframe title="Mapa del consultorio" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={`https://www.google.com/maps?q=${mapsQ}&output=embed`} />
        </div>
        <div className="location__info">
          <Rotulo>{t["inicio.contacto_rotulo"]}</Rotulo>
          <h2 id="contacto-title" className="t-display">{t["inicio.contacto_titulo"]}</h2>
          <SpecTable filas={contactoFilas} />
          <div className="location__ctas">
            <Cta href={`https://www.google.com/maps/search/?api=1&query=${mapsQ}`} externo><span>{t["contacto.boton_mapa"]}</span><span aria-hidden="true">↗</span></Cta>
            <Cta href={wa} variante="contorno" externo><span>{t["contacto.boton_whatsapp"]}</span></Cta>
          </div>
          <FormularioContacto />
          <p className="t-caption soft">{t["contacto.aviso"]} <Link href="/privacidad" className="underline">{t["contacto.aviso_enlace"]}</Link>.</p>
        </div>
      </section>
    </>
  );
}
