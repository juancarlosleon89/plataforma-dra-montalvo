import { notFound } from "next/navigation";
import { Avisos, Encabezado } from "@/components/admin/Piezas";
import { Formulario } from "@/components/admin/Formulario";
import { requerirPersonal } from "@/lib/admin";
import { DIAS } from "@/lib/tipos";
import { ENTIDADES } from "../../../entidades";
import { eliminar, guardar } from "../../../acciones";

export const metadata = { title: "Editar tratamiento" };

export default async function EditarServicio({ params, searchParams }: PageProps<"/admin/servicios/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const nuevo = id === "nuevo";
  const { sb } = await requerirPersonal("admin");
  const [{ data: s }, { data: cats }, { data: dias }] = await Promise.all([
    nuevo ? Promise.resolve({ data: null }) : sb.from("servicios").select("*").eq("id", id).maybeSingle(),
    sb.from("categorias_tratamiento").select("id, nombre").order("orden"),
    nuevo ? Promise.resolve({ data: [] as { dia_semana: number }[] }) : sb.from("servicio_dias").select("dia_semana").eq("servicio_id", id),
  ]);
  if (!nuevo && !s) notFound();
  const diasSel = new Set((dias ?? []).map((d) => d.dia_semana));
  const opciones = { categoria_id: (cats ?? []).map((c) => ({ valor: c.id, texto: c.nombre })) };
  const extra = !nuevo && (
    <fieldset className="adm-field adm-field--full adm-dias">
      <legend className="t-label">Días en que se ofrece (sin marcar ninguno = todos los días con horario)</legend>
      {DIAS.map((d, i) => <label key={d} className="adm-check t-body-s"><input type="checkbox" name="dias" value={i} defaultChecked={diasSel.has(i)} /> {d}</label>)}
    </fieldset>
  );
  return (
    <>
      <Encabezado titulo={nuevo ? "Nuevo tratamiento" : String(s!.nombre)} volver={{ href: "/admin/servicios", texto: "Tratamientos" }} />
      <Avisos sp={sp} />
      <Formulario accion={guardar.bind(null, "servicios", nuevo ? null : id)} campos={ENTIDADES.servicios.campos} opciones={opciones} extra={extra}
        valores={s ?? { activo: false, reservable: true, duracion_minutos: 60, orden: 99, beneficios: [] }} boton={nuevo ? "Crear" : "Guardar"} />
      {!nuevo && (
        <details className="adm-item">
          <summary className="adm-item__resumen"><span className="t-label adm-error">Eliminar tratamiento</span></summary>
          <p className="t-body-s">Si tiene citas registradas no se puede eliminar: desmarque «Visible en el sitio» para ocultarlo.</p>
          <form action={eliminar.bind(null, "servicios", id, "/admin/servicios")}><button className="cta cta--small t-button">Eliminar</button></form>
        </details>
      )}
    </>
  );
}
