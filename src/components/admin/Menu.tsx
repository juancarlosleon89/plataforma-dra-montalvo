"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS: { href: string; texto: string; solo?: "admin" }[] = [
  { href: "/admin", texto: "Resumen" },
  { href: "/admin/citas", texto: "Citas" },
  { href: "/admin/pacientes", texto: "Pacientes" },
  { href: "/admin/agenda", texto: "Agenda y horarios" },
  { href: "/admin/mensajes", texto: "Mensajes" },
  { href: "/admin/servicios", texto: "Tratamientos", solo: "admin" },
  { href: "/admin/contenido", texto: "Galería y contenido", solo: "admin" },
  { href: "/admin/textos", texto: "Textos del sitio", solo: "admin" },
  { href: "/admin/configuracion", texto: "Configuración", solo: "admin" },
  { href: "/admin/privacidad", texto: "Protección de datos" },
  { href: "/admin/usuarios", texto: "Usuarios", solo: "admin" },
  { href: "/admin/actividad", texto: "Actividad y sincronización", solo: "admin" },
];

export function Menu({ rol, avisos }: { rol: string; avisos: Record<string, number> }) {
  const ruta = usePathname();
  return (
    <nav className="adm-nav" aria-label="Panel">
      {ITEMS.filter((i) => !i.solo || i.solo === rol).map((i) => {
        const activo = i.href === "/admin" ? ruta === "/admin" : ruta.startsWith(i.href);
        const n = avisos[i.href];
        return (
          <Link key={i.href} href={i.href} className={`adm-nav__link t-label ${activo ? "is-active" : ""}`} aria-current={activo ? "page" : undefined}>
            {i.texto}{n ? <span className="adm-badge">{n}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
