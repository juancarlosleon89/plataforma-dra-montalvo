import { Formulario } from "./Formulario";
import { ENTIDADES, type NombreEntidad } from "@/app/admin/entidades";
import { eliminar, guardar } from "@/app/admin/acciones";

/**
 * Lista editable de una entidad: cada registro se abre y se edita en su lugar,
 * con opción de eliminar, y al final un formulario para agregar uno nuevo.
 */
export function Coleccion({ entidad, filas, titulo, opciones, nuevo = {}, volverA, textoNuevo = "Agregar" }: {
  entidad: NombreEntidad; filas: Record<string, unknown>[]; titulo: (f: Record<string, unknown>) => React.ReactNode;
  opciones?: Record<string, { valor: string; texto: string }[]>; nuevo?: Record<string, unknown>; volverA: string; textoNuevo?: string;
}) {
  const def = ENTIDADES[entidad];
  return (
    <div className="adm-coleccion">
      {filas.length === 0 && <p className="t-body-s soft">Todavía no hay registros.</p>}
      {filas.map((f) => (
        <details key={String(f.id)} className="adm-item">
          <summary className="adm-item__resumen">{titulo(f)}<span className="t-label soft">Editar</span></summary>
          <Formulario accion={guardar.bind(null, entidad, String(f.id))} campos={def.campos} valores={f} opciones={opciones} />
          <form action={eliminar.bind(null, entidad, String(f.id), volverA)} className="adm-item__borrar">
            <button className="t-label link adm-error" type="submit">Eliminar</button>
          </form>
        </details>
      ))}
      <details className="adm-item adm-item--nuevo">
        <summary className="adm-item__resumen"><span className="t-label">+ {textoNuevo}</span></summary>
        <Formulario accion={guardar.bind(null, entidad, null)} campos={def.campos} valores={nuevo} opciones={opciones} boton="Crear" reiniciar />
      </details>
    </div>
  );
}
