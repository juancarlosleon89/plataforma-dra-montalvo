import Link from "next/link";
import { notFound } from "next/navigation";
import { Avisos, Encabezado, Estado, Seccion } from "@/components/admin/Piezas";
import { Formulario } from "@/components/admin/Formulario";
import { requerirPersonal } from "@/lib/admin";
import { fechaHora } from "@/lib/formato";
import { ENTIDADES } from "../../../entidades";
import { anonimizarPaciente, guardar } from "../../../acciones";

export const metadata = { title: "Paciente" };

export default async function Paciente({ params, searchParams }: PageProps<"/admin/pacientes/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const { sb, yo } = await requerirPersonal();
  const [{ data: p }, { data: citas }, { data: solicitudes }] = await Promise.all([
    sb.from("pacientes").select("*").eq("id", id).maybeSingle(),
    sb.from("citas").select("id, codigo, inicio, estado, servicios(nombre)").eq("paciente_id", id).order("inicio", { ascending: false }),
    sb.from("solicitudes_derechos").select("id, tipo, estado, creado_en").eq("paciente_id", id),
  ]);
  if (!p) notFound();
  const anonimo = p.estado === "anonimizado";
  return (
    <>
      <Encabezado titulo={`${p.nombres} ${p.apellidos}`} volver={{ href: "/admin/pacientes", texto: "Pacientes" }}>
        {!anonimo && <Link className="cta cta--small cta--accent t-button" href={`/admin/citas/nueva?paciente=${id}`}>Nueva cita</Link>}
      </Encabezado>
      <Avisos sp={sp} />
      <div className="adm-dos">
        <Seccion titulo="Datos" descripcion={`Consentimiento: ${p.consentimiento_en ? `${fechaHora(p.consentimiento_en)} (versión ${p.consentimiento_version})` : "registrado en el consultorio"}`}>
          {anonimo ? <p className="t-body soft">Los datos personales de este titular fueron eliminados (anonimizados). Se conservan sus citas solo con fines estadísticos.</p>
            : <Formulario accion={guardar.bind(null, "pacientes", id)} campos={ENTIDADES.pacientes.campos} valores={p} />}
        </Seccion>
        <Seccion titulo="Historial de citas">
          <ul className="adm-lista">
            {(citas ?? []).map((c) => (
              <li key={c.id}><Link href={`/admin/citas/${c.id}`} className="adm-lista__fila">
                <span className="t-label">{fechaHora(c.inicio)}</span>
                <span className="t-body-s">{(c.servicios as unknown as { nombre: string })?.nombre}</span><Estado e={c.estado} />
              </Link></li>
            ))}
          </ul>
          {!citas?.length && <p className="t-body-s soft">Sin citas.</p>}
        </Seccion>
      </div>
      <Seccion titulo="Protección de datos" descripcion="Derechos del titular según la LOPDP.">
        {solicitudes?.length ? <p className="t-body-s">Solicitudes: {solicitudes.map((s) => `${s.tipo} (${s.estado})`).join(", ")} · <Link className="link" href="/admin/privacidad">Gestionar</Link></p> : <p className="t-body-s soft">Sin solicitudes registradas.</p>}
        {yo.rol === "admin" && !anonimo && (
          <details className="adm-item">
            <summary className="adm-item__resumen"><span className="t-label adm-error">Eliminar datos personales (anonimizar)</span></summary>
            <p className="t-body-s">Se reemplazan nombre, teléfono y correo, y se borran sus observaciones. Las citas quedan como registro estadístico sin datos personales. Esta acción no se puede deshacer.</p>
            <form action={anonimizarPaciente.bind(null, id)}><button className="cta cta--small t-button">Confirmar eliminación</button></form>
          </details>
        )}
      </Seccion>
    </>
  );
}
