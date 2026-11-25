import { Avisos, Encabezado, Seccion } from "@/components/admin/Piezas";
import { Coleccion } from "@/components/admin/Coleccion";
import { requerirPersonal } from "@/lib/admin";

export const metadata = { title: "Galería y contenido" };

export default async function Contenido({ searchParams }: PageProps<"/admin/contenido">) {
  const sp = await searchParams;
  const { sb } = await requerirPersonal("admin");
  const [g, f, p, t, a, s] = await Promise.all([
    sb.from("galeria").select("*").order("orden"),
    sb.from("faq").select("*").order("orden"),
    sb.from("portafolio").select("*").order("orden"),
    sb.from("testimonios").select("*").order("creado_en", { ascending: false }),
    sb.from("autorizaciones_publicacion").select("*").order("creado_en", { ascending: false }),
    sb.from("servicios").select("id, nombre").order("orden"),
  ]);
  const autorizaciones = (a.data ?? []).map((x) => ({ valor: x.id, texto: `${x.titular} · ${x.alcance} · ${x.estado}` }));
  const servicios = (s.data ?? []).map((x) => ({ valor: x.id, texto: x.nombre }));
  const opc = { servicio_id: servicios, autorizacion_id: autorizaciones };
  const est = (aid: unknown) => (a.data ?? []).find((x) => x.id === aid)?.estado;
  return (
    <>
      <Encabezado titulo="Galería y contenido" />
      <Avisos sp={sp} />
      <Seccion titulo="Instalaciones" descripcion="Fotografías reales del consultorio. Se muestran en la sección «El consultorio».">
        <Coleccion entidad="galeria" filas={g.data ?? []} volverA="/admin/contenido" textoNuevo="Agregar fotografía" nuevo={{ publicado: true, categoria: "consultorio" }}
          titulo={(x) => <span className="adm-item__mini">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={String(x.imagen_url)} alt="" /><span className="t-body">{String(x.titulo)}{!x.publicado && <span className="soft"> (oculta)</span>}</span></span>} />
      </Seccion>
      <Seccion titulo="Autorizaciones de publicación" descripcion="Registre aquí cada consentimiento firmado. Los casos y testimonios solo aparecen en el sitio si su autorización está «Otorgada».">
        <Coleccion entidad="autorizaciones" filas={a.data ?? []} volverA="/admin/contenido" textoNuevo="Registrar autorización" nuevo={{ estado: "pendiente", alcance: "ambos" }}
          titulo={(x) => <span className="t-body">{String(x.titular)} · {String(x.alcance)} · <strong>{String(x.estado)}</strong></span>} />
      </Seccion>
      <Seccion titulo="Resultados antes y después" descripcion="Use solo fotografías reales, sin retoque, con la misma luz y encuadre.">
        <Coleccion entidad="portafolio" filas={p.data ?? []} volverA="/admin/contenido" opciones={opc} textoNuevo="Agregar caso"
          titulo={(x) => <span className="t-body">{String(x.titulo ?? "Caso")} · {x.publicado ? (est(x.autorizacion_id) === "otorgada" ? "publicado" : <span className="adm-error">publicado sin autorización otorgada (no se muestra)</span>) : <span className="soft">oculto</span>}</span>} />
      </Seccion>
      <Seccion titulo="Testimonios" descripcion="Solo opiniones reales, con el texto tal como lo dio el paciente.">
        <Coleccion entidad="testimonios" filas={t.data ?? []} volverA="/admin/contenido" opciones={opc} textoNuevo="Agregar testimonio"
          titulo={(x) => <span className="t-body">{String(x.nombre_autorizado)} · {x.publicado ? (est(x.autorizacion_id) === "otorgada" ? "publicado" : <span className="adm-error">sin autorización otorgada (no se muestra)</span>) : <span className="soft">oculto</span>}</span>} />
      </Seccion>
      <Seccion titulo="Preguntas frecuentes">
        <Coleccion entidad="faq" filas={f.data ?? []} volverA="/admin/contenido" textoNuevo="Agregar pregunta" nuevo={{ publicado: true }}
          titulo={(x) => <span className="t-body">{String(x.pregunta)}{!x.publicado && <span className="soft"> (oculta)</span>}</span>} />
      </Seccion>
    </>
  );
}
