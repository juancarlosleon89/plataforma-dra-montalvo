import { Avisos, Encabezado, Seccion } from "@/components/admin/Piezas";
import { Formulario } from "@/components/admin/Formulario";
import { requerirPersonal } from "@/lib/admin";
import { ENTIDADES } from "../../entidades";
import { guardar } from "../../acciones";

export const metadata = { title: "Configuración" };

export default async function Configuracion({ searchParams }: PageProps<"/admin/configuracion">) {
  const sp = await searchParams;
  const { sb } = await requerirPersonal("admin");
  const [{ data: sitio }, { data: inst }] = await Promise.all([
    sb.from("configuracion_sitio").select("*").eq("id", 1).single(),
    sb.from("informacion_institucional").select("*").eq("id", 1).single(),
  ]);
  return (
    <>
      <Encabezado titulo="Configuración" />
      <Avisos sp={sp} />
      <p className="t-body-s soft">Los cambios se publican en el sitio en segundos. Los campos vacíos no se muestran. No publique información que no pueda verificarse (títulos, certificaciones, testimonios).</p>
      <Seccion titulo="Identidad, contacto y portada">
        <Formulario accion={guardar.bind(null, "sitio", null)} campos={ENTIDADES.sitio.campos} valores={sitio ?? {}} />
      </Seccion>
      <Seccion titulo="Consultorio y perfil profesional">
        <Formulario accion={guardar.bind(null, "institucional", null)} campos={ENTIDADES.institucional.campos} valores={inst ?? {}} />
      </Seccion>
    </>
  );
}
