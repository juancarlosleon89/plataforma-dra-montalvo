import { Avisos, Encabezado, Seccion } from "@/components/admin/Piezas";
import { Coleccion } from "@/components/admin/Coleccion";
import { Formulario } from "@/components/admin/Formulario";
import { requerirPersonal } from "@/lib/admin";
import { fechaHora, hhmm } from "@/lib/formato";
import { DIAS } from "@/lib/tipos";
import { ENTIDADES } from "../../entidades";
import { guardar } from "../../acciones";

export const metadata = { title: "Agenda y horarios" };

export default async function Agenda({ searchParams }: PageProps<"/admin/agenda">) {
  const sp = await searchParams;
  const { sb, yo } = await requerirPersonal();
  const [{ data: cfg }, { data: horarios }, { data: bloqueos }] = await Promise.all([
    sb.from("configuracion_agenda").select("*").eq("id", 1).single(),
    sb.from("horarios").select("*").order("dia_semana").order("hora_inicio"),
    sb.from("bloqueos_agenda").select("*").gte("fin", new Date().toISOString()).order("inicio"),
  ]);
  const admin = yo.rol === "admin";
  return (
    <>
      <Encabezado titulo="Agenda y horarios" />
      <Avisos sp={sp} />
      {admin && (
        <Seccion titulo="Horario de atención" descripcion="Varios tramos por día: el espacio entre tramos es el descanso (por ejemplo, el almuerzo). Domingo = 0.">
          <Coleccion entidad="horarios" filas={horarios ?? []} volverA="/admin/agenda" textoNuevo="Agregar tramo"
            nuevo={{ dia_semana: 1, hora_inicio: "09:00", hora_fin: "13:00", activo: true }}
            titulo={(h) => <span className="t-body">{DIAS[Number(h.dia_semana)]} · {hhmm(String(h.hora_inicio))}–{hhmm(String(h.hora_fin))}{!h.activo && <span className="soft"> (inactivo)</span>}</span>} />
        </Seccion>
      )}
      <Seccion titulo="Bloqueos, vacaciones y días no laborables" descripcion="Durante un bloqueo no se ofrecen horarios. Las citas ya agendadas en ese periodo no se cancelan solas: revíselas en Citas.">
        <Coleccion entidad="bloqueos" filas={bloqueos ?? []} volverA="/admin/agenda" textoNuevo="Agregar bloqueo" nuevo={{ tipo: "vacaciones" }}
          titulo={(b) => <span className="t-body">{String(b.tipo)} · {fechaHora(String(b.inicio))} → {fechaHora(String(b.fin))}{b.motivo ? <span className="soft"> · {String(b.motivo)}</span> : null}</span>} />
      </Seccion>
      {admin && cfg && (
        <Seccion titulo="Reglas de reserva" descripcion="La duración de cada cita se define en cada tratamiento. La disponibilidad por servicio (días) también se configura en Tratamientos.">
          <Formulario accion={guardar.bind(null, "agenda", null)} campos={ENTIDADES.agenda.campos} valores={cfg} />
        </Seccion>
      )}
    </>
  );
}
