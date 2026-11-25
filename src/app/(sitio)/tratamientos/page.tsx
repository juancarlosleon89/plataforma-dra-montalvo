import type { Metadata } from "next";
import { TarjetaServicio } from "@/components/sitio/TarjetaServicio";
import { FiltroCategorias } from "@/components/sitio/FiltroCategorias";
import { obtenerServicios, obtenerSitio, obtenerTextos } from "@/lib/datos";
import { enlaceWhatsapp } from "@/lib/formato";

export const metadata: Metadata = {
  title: "Tratamientos odontológicos en Ambato",
  description: "Prótesis fijas y removibles, rehabilitación oral, diseño de sonrisa y estética dental en Ambato. Agende su valoración en línea.",
  alternates: { canonical: "/tratamientos" },
};

export default async function Tratamientos() {
  const [{ servicios, categorias }, { sitio }, t] = await Promise.all([obtenerServicios(), obtenerSitio(), obtenerTextos()]);
  const wa = enlaceWhatsapp(sitio);
  const usadas = categorias.filter((c) => servicios.some((s) => s.categoria_id === c.id));
  return (
    <section className="section page-top" aria-labelledby="t-title">
      <div className="section__head">
        <h1 id="t-title" className="t-display">{t["trat.titulo"]} <sup className="t-label">{servicios.length}</sup></h1>
        <FiltroCategorias categorias={usadas.map((c) => ({ id: c.id, nombre: c.nombre }))} />
      </div>
      <div className="cards" id="lista-tratamientos">{servicios.map((s) => <TarjetaServicio key={s.id} s={s} wa={wa} tx={t} />)}</div>
    </section>
  );
}
