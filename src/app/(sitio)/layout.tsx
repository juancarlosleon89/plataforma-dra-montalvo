import { Cabecera } from "@/components/sitio/Cabecera";
import { Pie } from "@/components/sitio/Pie";
import { Movimiento } from "@/components/sitio/Movimiento";
import { obtenerSitio, obtenerTextos } from "@/lib/datos";
import { TextosProvider } from "@/components/sitio/TextosContexto";

export const revalidate = 60;

export default async function SitioLayout({ children }: { children: React.ReactNode }) {
  const [{ sitio }, textos] = await Promise.all([obtenerSitio(), obtenerTextos()]);
  // El color de acento se configura desde el panel (Configuración → Identidad).
  const acento = /^#[0-9a-f]{6}$/i.test(sitio.color_acento) ? sitio.color_acento : "#1d5c66";
  return (
    <>
      <style>{`:root{--color-accent:${acento}}`}</style>
      <TextosProvider textos={textos}>
      <a className="skip t-label" href="#main">Saltar al contenido</a>
      <Cabecera nombre={sitio.nombre_comercial} logo={sitio.logotipo_url} />
      <main id="main">{children}</main>
      <Pie sitio={sitio} tx={textos} />
      <Movimiento />
      </TextosProvider>
    </>
  );
}
