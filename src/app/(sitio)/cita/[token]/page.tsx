import type { Metadata } from "next";
import { GestionCita } from "@/components/sitio/GestionCita";

export const metadata: Metadata = { title: "Mi cita", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PaginaCita({ params }: PageProps<"/cita/[token]">) {
  const { token } = await params;
  return (
    <section className="section page-top narrow" aria-labelledby="cita-title">
      <p className="t-label">Gestión de cita</p>
      <h1 id="cita-title" className="t-display">Mi cita</h1>
      <GestionCita token={token} />
    </section>
  );
}
