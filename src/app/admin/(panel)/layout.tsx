import type { Metadata } from "next";
import Link from "next/link";
import { Menu } from "@/components/admin/Menu";
import { requerirPersonal } from "@/lib/admin";
import { cerrarSesion } from "../acciones";

export const metadata: Metadata = { title: { default: "Panel", template: "%s · Panel" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Protección de rutas: sin sesión → login (proxy); sin rol activo → /admin/sin-acceso. */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { yo, sb } = await requerirPersonal();
  const [m, s, c] = await Promise.all([
    sb.from("mensajes_contacto").select("id", { count: "exact", head: true }).eq("estado", "pendiente"),
    sb.from("solicitudes_derechos").select("id", { count: "exact", head: true }).in("estado", ["recibida", "en_proceso"]),
    sb.from("citas").select("id", { count: "exact", head: true }).eq("estado", "pendiente"),
  ]);
  return (
    <div className="adm">
      <aside className="adm-side">
        <Link href="/admin" className="adm-side__brand"><em>Dra.</em> Monserrath Montalvo</Link>
        <p className="t-label soft">Panel · {yo.rol === "admin" ? "Administración" : "Recepción"}</p>
        <Menu rol={yo.rol} avisos={{ "/admin/mensajes": m.count ?? 0, "/admin/privacidad": s.count ?? 0, "/admin/citas": c.count ?? 0 }} />
        <div className="adm-side__foot">
          <p className="t-body-s">{yo.nombre}<br /><span className="soft">{yo.email}</span></p>
          <Link className="t-label link" href="/" target="_blank">Ver sitio ↗</Link>
          <form action={cerrarSesion}><button className="t-label link">Cerrar sesión</button></form>
        </div>
      </aside>
      <div className="adm-main">{children}</div>
    </div>
  );
}
