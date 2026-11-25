import { Logo, NavLink, IconoWhatsapp } from "@/components/ui";
import type { ConfiguracionSitio } from "@/lib/tipos";
import { enlaceWhatsapp } from "@/lib/formato";
import type { Textos } from "@/lib/textos";

export function Pie({ sitio, tx: t }: { sitio: ConfiguracionSitio; tx: Textos }) {
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
          <div><p className="t-label dim">{t["pie.consultorio"]}</p>
            <NavLink href="/#nosotros">{t["menu.nosotros"]}</NavLink><NavLink href="/#doctora">{t["menu.doctora"]}</NavLink><NavLink href="/#instalaciones">{t["menu.instalaciones"]}</NavLink></div>
          <div><p className="t-label dim">{t["pie.pacientes"]}</p>
            <NavLink href="/tratamientos">{t["menu.tratamientos"]}</NavLink><NavLink href="/agendar">{t["pie.agendar"]}</NavLink><NavLink href="/privacidad">{t["pie.privacidad"]}</NavLink></div>
          <div><p className="t-label dim">{t["pie.redes"]}</p>
            {Object.entries(sitio.redes ?? {}).filter(([, u]) => u).map(([red, url]) => (
              <NavLink key={red} href={url} externo>{red.charAt(0).toUpperCase() + red.slice(1)}</NavLink>
            ))}
            <NavLink href={wa} externo>WhatsApp</NavLink></div>
        </div>
        <div className="footer__bottom t-caption">
          <span>© {new Date().getFullYear()} {sitio.nombre_comercial}</span>
          <NavLink href="/admin">{t["pie.administracion"]}</NavLink>
        </div>
      </footer>
      <a className="wa-float" href={wa} target="_blank" rel="noopener noreferrer" aria-label="Escribir por WhatsApp"><IconoWhatsapp /></a>
    </>
  );
}
