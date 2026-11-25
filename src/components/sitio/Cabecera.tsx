"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Logo, NavLink } from "@/components/ui";
import { useTextos } from "@/components/sitio/TextosContexto";

const SECCIONES = [
  { href: "/#nosotros", clave: "menu.nosotros" },
  { href: "/#doctora", clave: "menu.doctora" },
  { href: "/#servicios", clave: "menu.tratamientos" },
  { href: "/#resultados", clave: "menu.resultados" },
  { href: "/#instalaciones", clave: "menu.instalaciones" },
  { href: "/#preguntas", clave: "menu.preguntas" },
  { href: "/#contacto", clave: "menu.contacto" },
  { href: "/agendar", clave: "menu.agendar" },
] as const;

/** Cabecera fija: transparente, fondo papel al subir, se oculta al bajar. Mega-menú con velo. */
export function Cabecera({ nombre, logo }: { nombre: string; logo?: string | null }) {
  const [menu, setMenu] = useState<string | null>(null); // ruta en la que se abrió el menú
  const [estado, setEstado] = useState({ conFondo: false, oculta: false });
  const ultimoY = useRef(0);
  const ruta = usePathname();
  const t = useTextos();
  const abierto = menu === ruta; // al navegar, el menú se cierra solo
  const setAbierto = (v: boolean) => setMenu(v ? ruta : null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setEstado({ conFondo: y > 40, oculta: y > ultimoY.current && y > 300 });
      ultimoY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null);
    window.addEventListener("keydown", esc);
    document.body.classList.toggle("menu-open", abierto);
    return () => window.removeEventListener("keydown", esc);
  }, [abierto]);

  const apellido = nombre.replace(/^Dra\.\s*/, "");
  return (
    <>
      <header className={`header ${estado.conFondo || ruta !== "/" ? "is-scrolled" : ""} ${estado.oculta && !abierto ? "is-hidden" : ""}`}>
        <div className="header__left">
          <button className="menu-btn t-button" aria-expanded={abierto} aria-controls="megamenu" onClick={() => setAbierto(!abierto)}>
            <span className="menu-btn__dots" aria-hidden="true"><i /><i /><i /><i /></span>
            <span>{abierto ? t["cab.cerrar"] : t["cab.menu"]}</span>
          </button>
        </div>
        <Link className="wordmark" href="/" aria-label={`${nombre}, inicio`}>
          <Logo src={logo} className="wordmark__logo" />
          <span><span className="wordmark__pre">Dra.</span> {apellido}</span>
        </Link>
        <div className="header__right">
          <NavLink href="/#contacto" className="hide-sm">{t["cab.contacto"]}</NavLink>
          <Link className="cta cta--small t-button" href="/agendar">{t["cab.agendar"]}</Link>
        </div>
      </header>
      {abierto && (
        <div className="megamenu" id="megamenu">
          <div className="megamenu__panel">
            <div className="megamenu__cards">
              <Link className="megamenu__card" href="/#servicios"><span className="t-label">{t["menu.tarjeta1"]}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t["menu.tarjeta1_img"]} alt="" width={432} height={220} /></Link>
              <Link className="megamenu__card" href="/#instalaciones"><span className="t-label">{t["menu.tarjeta2"]}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t["menu.tarjeta2_img"]} alt="" width={512} height={380} /></Link>
            </div>
            <nav className="megamenu__links" aria-label="Secciones">
              {SECCIONES.map((s) => (
                <span key={s.href} onClick={() => setAbierto(false)}><NavLink href={s.href}>{t[s.clave]}</NavLink></span>
              ))}
            </nav>
          </div>
          <div className="megamenu__veil" onClick={() => setAbierto(false)} />
        </div>
      )}
    </>
  );
}
