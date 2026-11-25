import { Cabecera } from "@/components/sitio/Cabecera";
import { Pie } from "@/components/sitio/Pie";
import { obtenerSitio } from "@/lib/datos";

export const revalidate = 60;

export default async function SitioLayout({ children }: { children: React.ReactNode }) {
  const { sitio } = await obtenerSitio();
  // El color de acento se configura desde el panel (Configuración → Identidad).
  const acento = /^#[0-9a-f]{6}$/i.test(sitio.color_acento) ? sitio.color_acento : "#1d5c66";
  return (
    <>
      <style>{`:root{--color-accent:${acento}}`}</style>
      <a className="skip t-label" href="#main">Saltar al contenido</a>
      <Cabecera nombre={sitio.nombre_comercial} />
      <main id="main">{children}</main>
      <Pie sitio={sitio} />
    </>
  );
}
