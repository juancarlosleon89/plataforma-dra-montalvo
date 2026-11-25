import Link from "next/link";
import { Avisos, Encabezado, Seccion } from "@/components/admin/Piezas";
import { Coleccion } from "@/components/admin/Coleccion";
import { requerirPersonal } from "@/lib/admin";

export const metadata = { title: "Tratamientos" };

export default async function Servicios({ searchParams }: PageProps<"/admin/servicios">) {
  const sp = await searchParams;
  const { sb } = await requerirPersonal("admin");
  const [{ data: servicios }, { data: categorias }] = await Promise.all([
    sb.from("servicios").select("id, nombre, slug, duracion_minutos, activo, reservable, destacado, categorias_tratamiento(nombre)").order("orden"),
    sb.from("categorias_tratamiento").select("*").order("orden"),
  ]);
  return (
    <>
      <Encabezado titulo="Tratamientos"><Link className="cta cta--small cta--accent t-button" href="/admin/servicios/nuevo">Nuevo tratamiento</Link></Encabezado>
      <Avisos sp={sp} />
      <div className="adm-tabla-wrap">
        <table className="adm-tabla">
          <thead><tr><th>Tratamiento</th><th>Categoría</th><th>Duración</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {(servicios ?? []).map((s) => (
              <tr key={s.id}>
                <td>{s.nombre}<br /><span className="t-caption soft">/tratamientos/{s.slug}</span></td>
                <td>{(s.categorias_tratamiento as unknown as { nombre: string } | null)?.nombre ?? "—"}</td>
                <td>{s.duracion_minutos} min</td>
                <td className="t-label">{s.activo ? "Visible" : <span className="soft">Oculto</span>}{s.activo && !s.reservable && " · sin reserva"}{s.destacado && " · destacado"}</td>
                <td><Link className="t-label link" href={`/admin/servicios/${s.id}`}>Editar</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Seccion titulo="Categorías">
        <Coleccion entidad="categorias" filas={categorias ?? []} volverA="/admin/servicios" textoNuevo="Agregar categoría" nuevo={{ activa: true }}
          titulo={(c) => <span className="t-body">{String(c.nombre)}{!c.activa && <span className="soft"> (inactiva)</span>}</span>} />
      </Seccion>
    </>
  );
}
