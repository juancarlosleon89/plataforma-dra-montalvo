import Link from "next/link";
import { Avisos, Encabezado, Seccion } from "@/components/admin/Piezas";
import { Formulario } from "@/components/admin/Formulario";
import { requerirPersonal, type DefCampo } from "@/lib/admin";
import { TEXTOS, combinarTextos, type ClaveTexto } from "@/lib/textos";
import { guardarTextos } from "../../acciones";

export const metadata = { title: "Textos del sitio" };

/** Todos los títulos, frases entre bloques, botones, menús y formularios del sitio público. */
export default async function TextosSitio({ searchParams }: PageProps<"/admin/textos">) {
  const sp = await searchParams;
  const { sb } = await requerirPersonal("admin");
  const { data } = await sb.from("textos_sitio").select("id, valor");
  const valores = combinarTextos(data);
  const cambiados = new Set((data ?? []).map((f) => f.id));

  const grupos = new Map<string, DefCampo[]>();
  for (const [clave, d] of Object.entries(TEXTOS) as [ClaveTexto, (typeof TEXTOS)[ClaveTexto]][]) {
    const tipo = "tipo" in d ? d.tipo : undefined;
    const campo: DefCampo = {
      nombre: clave,
      etiqueta: d.e + (cambiados.has(clave) ? " · modificado" : ""),
      tipo: tipo === "imagen" ? "imagen" : tipo === "area" ? "area" : "texto",
      ancho: tipo === "area" || tipo === "imagen" || d.v.length > 60 ? "completo" : undefined,
      ayuda: cambiados.has(clave) ? `Original: ${d.v.length > 140 ? d.v.slice(0, 140) + "…" : d.v}` : undefined,
    };
    grupos.set(d.g, [...(grupos.get(d.g) ?? []), campo]);
  }

  return (
    <>
      <Encabezado titulo="Textos del sitio" />
      <Avisos sp={sp} />
      <p className="t-body-s soft">
        Aquí puede cambiar cualquier título, frase entre secciones, botón, menú o texto de los formularios. Los contenidos con su propia sección
        (tratamientos, preguntas frecuentes, galería, perfil, portada y sección destacada) se editan en <Link className="underline" href="/admin/servicios">Tratamientos</Link>,{" "}
        <Link className="underline" href="/admin/contenido">Galería y contenido</Link> y <Link className="underline" href="/admin/configuracion">Configuración</Link>.
        Si borra un texto y guarda, vuelve a su valor original.
      </p>
      {[...grupos.entries()].map(([grupo, campos]) => (
        <Seccion key={grupo} titulo={grupo}>
          <Formulario accion={guardarTextos} campos={campos} valores={valores} boton="Guardar textos" />
        </Seccion>
      ))}
    </>
  );
}
