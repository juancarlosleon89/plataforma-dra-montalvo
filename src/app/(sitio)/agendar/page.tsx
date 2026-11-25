import type { Metadata } from "next";
import { Reserva } from "@/components/sitio/Reserva";
import { obtenerServicios, obtenerSitio, obtenerTextos } from "@/lib/datos";
import { enlaceWhatsapp } from "@/lib/formato";

export const metadata: Metadata = {
  title: "Agendar cita",
  description: "Reserve su cita con la Dra. Monserrath Montalvo en Ambato: elija tratamiento, día y horario disponible.",
  alternates: { canonical: "/agendar" },
};

export default async function Agendar({ searchParams }: PageProps<"/agendar">) {
  const { servicio } = await searchParams;
  const [{ servicios }, { sitio, agenda }, t] = await Promise.all([obtenerServicios(), obtenerSitio(), obtenerTextos()]);
  const reservables = servicios.filter((s) => s.reservable).map((s) => ({
    id: s.id, slug: s.slug, nombre: s.nombre, duracion: s.duracion_minutos, descripcion: s.descripcion,
  }));
  return (
    <section className="section page-top booking-page" aria-labelledby="agendar-title">
      <div className="booking-page__head">
        <p className="t-label">{t["ag.rotulo"]}</p>
        <h1 id="agendar-title" className="t-display">{t["ag.titulo"]}</h1>
        <p className="t-body soft">{agenda.politica_cancelacion}</p>
      </div>
      <Reserva
        servicios={reservables}
        inicial={typeof servicio === "string" ? servicio : undefined}
        whatsapp={enlaceWhatsapp(sitio)}
        direccion={`${sitio.direccion ?? ""}${sitio.ciudad ? `, ${sitio.ciudad}` : ""}`}
      />
    </section>
  );
}
