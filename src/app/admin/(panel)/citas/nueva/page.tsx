import { Encabezado } from "@/components/admin/Piezas";
import { FormNuevaCita } from "@/components/admin/FormulariosCita";
import { requerirPersonal } from "@/lib/admin";
import { diaLocal } from "@/lib/formato";

export const metadata = { title: "Nueva cita" };

export default async function NuevaCita({ searchParams }: PageProps<"/admin/citas/nueva">) {
  const sp = await searchParams;
  const { sb } = await requerirPersonal();
  const [{ data: servicios }, { data: pacientes }] = await Promise.all([
    sb.from("servicios").select("id, nombre").eq("activo", true).order("orden"),
    sb.from("pacientes").select("id, nombres, apellidos, telefono").neq("estado", "anonimizado").order("apellidos").limit(1000),
  ]);
  return (
    <>
      <Encabezado titulo="Nueva cita" volver={{ href: "/admin/citas", texto: "Citas" }} />
      <p className="t-body-s soft">Para citas tomadas por teléfono, WhatsApp o en el consultorio. Se sincroniza con Google Calendar igual que las reservas del sitio.</p>
      <FormNuevaCita servicios={servicios ?? []} hoy={diaLocal()} pacienteInicial={typeof sp.paciente === "string" ? sp.paciente : undefined}
        pacientes={(pacientes ?? []).map((p) => ({ id: p.id, nombre: `${p.apellidos}, ${p.nombres} · ${p.telefono}` }))} />
    </>
  );
}
