import { Avisos, Encabezado, Seccion } from "@/components/admin/Piezas";
import { FormInvitar } from "@/components/admin/FormSolicitud";
import { requerirPersonal } from "@/lib/admin";
import { fechaCorta } from "@/lib/formato";
import { cambiarUsuario } from "../../acciones";

export const metadata = { title: "Usuarios" };

export default async function Usuarios({ searchParams }: PageProps<"/admin/usuarios">) {
  const sp = await searchParams;
  const { sb, yo } = await requerirPersonal("admin");
  const { data } = await sb.from("administradores").select("*").order("creado_en");
  return (
    <>
      <Encabezado titulo="Usuarios del panel" />
      <Avisos sp={sp} />
      <div className="adm-tabla-wrap">
        <table className="adm-tabla">
          <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Desde</th><th></th></tr></thead>
          <tbody>
            {(data ?? []).map((u) => (
              <tr key={u.id}>
                <td>{u.nombre}{u.id === yo.id && <span className="soft"> (usted)</span>}</td><td>{u.email}</td>
                <td>{u.rol === "admin" ? "Administración" : "Recepción"}</td><td>{u.activo ? "Activo" : <span className="soft">Inactivo</span>}</td>
                <td>{fechaCorta(u.creado_en)}</td>
                <td className="adm-botones">
                  {u.id !== yo.id && <>
                    <form action={cambiarUsuario.bind(null, u.id, { rol: u.rol === "admin" ? "recepcion" : "admin" })}><button className="t-label link">{u.rol === "admin" ? "Pasar a recepción" : "Hacer administrador"}</button></form>
                    <form action={cambiarUsuario.bind(null, u.id, { activo: !u.activo })}><button className="t-label link">{u.activo ? "Desactivar" : "Activar"}</button></form>
                  </>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Seccion titulo="Invitar a una persona" descripcion="Recibirá un correo para crear su contraseña. Desactivar a un usuario le quita el acceso de inmediato.">
        <FormInvitar />
      </Seccion>
    </>
  );
}
