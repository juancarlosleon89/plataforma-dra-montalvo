import { Logo, NavLink, IconoWhatsapp } from "@/components/ui";
import type { ConfiguracionSitio } from "@/lib/tipos";
import { enlaceWhatsapp } from "@/lib/formato";

export function Pie({ sitio }: { sitio: ConfiguracionSitio }) {
  const wa = enlaceWhatsapp(sitio);
  const apellido = sitio.nombre_comercial.replace(/^Dra\.\s*/, "");
  return (
    <>
      <footer className="footer">
        <div className="footer__top">
          <p className="footer__brand"><Logo src={sitio.logotipo_url} className="footer__logo" />{apellido}</p>
          <p className="t-body-s">{sitio.especialidad}<br />{sitio.direccion}{sitio.ciudad ? `, ${sitio.ciudad}` : ""}</p>
        </div>
        <div className="footer__links">
          <div><p className="t-label dim">Consultorio</p>
            <NavLink href="/#nosotros">Nosotros</NavLink><NavLink href="/#doctora">La doctora</NavLink><NavLink href="/#instalaciones">Instalaciones</NavLink></div>
          <div><p className="t-label dim">Pacientes</p>
            <NavLink href="/tratamientos">Tratamientos</NavLink><NavLink href="/agendar">Agendar</NavLink><NavLink href="/privacidad">Privacidad</NavLink></div>
          <div><p className="t-label dim">Redes</p>
            {Object.entries(sitio.redes ?? {}).filter(([, u]) => u).map(([red, url]) => (
              <NavLink key={red} href={url} externo>{red.charAt(0).toUpperCase() + red.slice(1)}</NavLink>
            ))}
            <NavLink href={wa} externo>WhatsApp</NavLink></div>
        </div>
        <div className="footer__bottom t-caption">
          <span>© {new Date().getFullYear()} {sitio.nombre_comercial}</span>
          <NavLink href="/admin">Administración</NavLink>
        </div>
      </footer>
      <a className="wa-float" href={wa} target="_blank" rel="noopener noreferrer" aria-label="Escribir por WhatsApp"><IconoWhatsapp /></a>
    </>
  );
}
