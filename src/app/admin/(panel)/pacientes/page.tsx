import Link from "next/link";
import { Avisos, Encabezado } from "@/components/admin/Piezas";
import { requerirPersonal } from "@/lib/admin";
import { fechaCorta } from "@/lib/formato";

export const metadata = { title: "Pacientes" };

export default async function Pacientes({ searchParams }: PageProps<"/admin/pacientes">) {
  const sp = await searchParams;
  const texto = typeof sp.q === "string" ? sp.q.replace(/[%,()]/g, " ").trim() : "";
  const { sb } = await requerirPersonal();
  let q = sb.from("pacientes").select("id, nombres, apellidos, telefono, email, estado, creado_en, citas(count)").order("apellidos").limit(200);
  if (texto) q = q.or(`nombres.ilike.%${texto}%,apellidos.ilike.%${texto}%,telefono.ilike.%${texto}%,email.ilike.%${texto}%`);
  const { data } = await q;
  return (
    <>
      <Encabezado titulo="Pacientes" />
      <Avisos sp={sp} />
      <form className="adm-filtros" action="/admin/pacientes">
        <label className="adm-field adm-field--grow"><span className="t-label">Buscar por nombre, teléfono o correo</span><input name="q" defaultValue={texto} autoFocus /></label>
        <button className="cta cta--small t-button">Buscar</button>
      </form>
      <div className="adm-tabla-wrap">
        <table className="adm-tabla">
          <thead><tr><th>Paciente</th><th>Teléfono</th><th>Correo</th><th>Citas</th><th>Registro</th><th></th></tr></thead>
          <tbody>
            {(data ?? []).map((p) => (
              <tr key={p.id} className={p.estado === "anonimizado" ? "soft" : ""}>
                <td>{p.apellidos}, {p.nombres}{p.estado !== "activo" && <span className="t-label soft"> · {p.estado}</span>}</td>
                <td>{p.telefono}</td><td>{p.email}</td>
                <td>{(p.citas as unknown as { count: number }[])[0]?.count ?? 0}</td>
                <td>{fechaCorta(p.creado_en)}</td>
                <td><Link className="t-label link" href={`/admin/pacientes/${p.id}`}>Abrir</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!data?.length && <p className="t-body soft">Sin resultados.</p>}
    </>
  );
}
