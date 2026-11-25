import type { Metadata } from "next";
import { FormularioDerechos } from "@/components/sitio/FormularioDerechos";
import { obtenerSitio } from "@/lib/datos";

export const metadata: Metadata = { title: "Política de privacidad", alternates: { canonical: "/privacidad" } };

/**
 * Texto base conforme a la Ley Orgánica de Protección de Datos Personales del Ecuador (LOPDP).
 * Debe revisarlo un profesional del derecho antes de publicarse definitivamente.
 */
export default async function Privacidad() {
  const { sitio } = await obtenerSitio();
  const contacto = sitio.email ?? "el correo del consultorio (pendiente de configurar)";
  return (
    <article className="section page-top narrow legal" aria-labelledby="priv-title">
      <p className="t-label">Protección de datos personales</p>
      <h1 id="priv-title" className="t-display">Política de privacidad</h1>
      <p className="t-body soft">Versión 2026-11. Aplicable al sitio web y al sistema de citas de {sitio.nombre_comercial}.</p>

      <h2 className="t-title">Responsable del tratamiento</h2>
      <p className="t-body">{sitio.nombre_comercial}, {sitio.direccion}, {sitio.ciudad}. Contacto para temas de datos personales: {contacto}.</p>

      <h2 className="t-title">Qué datos tratamos y para qué</h2>
      <p className="t-body">Al reservar una cita: nombres, apellidos, teléfono, correo electrónico y, si las escribe, observaciones. Al enviar un mensaje: nombre, teléfono, correo y su mensaje. Los usamos únicamente para gestionar su cita, recordarle la fecha, responder su consulta y cumplir obligaciones legales. No pedimos información clínica en el sitio web.</p>

      <h2 className="t-title">Base legal</h2>
      <p className="t-body">Su consentimiento, que otorga al marcar la casilla del formulario, y la ejecución de la relación de servicio que usted solicita. Puede retirar su consentimiento en cualquier momento.</p>

      <h2 className="t-title">Principios que aplicamos</h2>
      <p className="t-body">Transparencia (esta política), finalidad (solo los usos indicados), minimización (solo los datos necesarios), exactitud, conservación limitada y seguridad. Los datos se guardan cifrados en tránsito y en reposo, con acceso restringido al personal autorizado y registro de las operaciones administrativas.</p>

      <h2 className="t-title">Encargados y transferencias</h2>
      <p className="t-body">Usamos proveedores tecnológicos que actúan como encargados del tratamiento: Supabase (base de datos), Vercel (alojamiento del sitio) y Google Workspace (calendario y correo). Algunos de sus servidores están fuera del Ecuador; trabajamos con proveedores que ofrecen garantías de seguridad adecuadas. No vendemos ni cedemos sus datos.</p>

      <h2 className="t-title">Conservación</h2>
      <p className="t-body">Conservamos los datos de citas mientras exista la relación con el consultorio y durante el tiempo exigido por la normativa aplicable. Después se eliminan o se anonimizan.</p>

      <h2 className="t-title">Sus derechos</h2>
      <p className="t-body">Puede solicitar acceso, rectificación y actualización, eliminación, oposición, portabilidad y suspensión del tratamiento. Responderemos en el plazo que establece la ley. Si considera que sus derechos no fueron atendidos, puede acudir a la Superintendencia de Protección de Datos Personales.</p>

      <h2 className="t-title" id="solicitud">Presentar una solicitud</h2>
      <FormularioDerechos />
    </article>
  );
}
