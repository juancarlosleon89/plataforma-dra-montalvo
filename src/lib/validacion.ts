import { z } from "zod";

const texto = (max: number) => z.string().trim().min(1, "Obligatorio").max(max, `Máximo ${max} caracteres`);
export const telefono = z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, "Teléfono no válido (7 a 20 dígitos)");
export const correo = z.string().trim().toLowerCase().email("Correo no válido").max(160);

export const esquemaReserva = z.object({
  servicio_id: z.string().uuid(),
  inicio: z.string().datetime({ offset: true }),
  nombres: texto(80),
  apellidos: texto(80),
  telefono,
  email: correo,
  observaciones: z.string().trim().max(500).optional().default(""),
  consentimiento: z.literal(true, { message: "Debe aceptar la política de privacidad" }),
  sitio_web: z.string().max(0).optional().default(""), // campo trampa anti-bots: debe llegar vacío
});

export const esquemaContacto = z.object({
  nombre: texto(120),
  telefono,
  email: z.union([correo, z.literal("")]).optional().default(""),
  motivo: z.string().trim().max(120).optional().default(""),
  mensaje: texto(2000),
  sitio_web: z.string().max(0).optional().default(""),
});

export const esquemaDerechos = z.object({
  nombre: texto(120),
  email: correo,
  telefono: z.union([telefono, z.literal("")]).optional().default(""),
  tipo: z.enum(["acceso", "rectificacion", "eliminacion", "oposicion", "portabilidad", "suspension"]),
  detalle: z.string().trim().max(2000).optional().default(""),
  sitio_web: z.string().max(0).optional().default(""),
});

/** Traduce los códigos de error de la base de datos a mensajes para el paciente. */
export function mensajeError(codigo: string | undefined) {
  const c = codigo ?? "";
  if (c.includes("HORARIO_NO_DISPONIBLE")) return "Ese horario acaba de ocuparse o ya no está disponible. Elija otro, por favor.";
  if (c.includes("DATOS_INVALIDOS")) return "Revise sus datos de contacto.";
  if (c.includes("CONSENTIMIENTO")) return "Debe aceptar la política de privacidad para reservar.";
  if (c.includes("LIMITE_CITAS")) return "Ya tiene varias citas activas. Para agendar otra, escríbanos por WhatsApp.";
  if (c.includes("FUERA_DE_PLAZO")) return "El plazo para modificar esta cita en línea ya pasó. Escríbanos por WhatsApp.";
  if (c.includes("CITA_NO_MODIFICABLE")) return "Esta cita ya no se puede modificar.";
  if (c.includes("CITA_NO_ENCONTRADA")) return "No encontramos la cita. Revise el enlace de su correo.";
  if (c.includes("REPROGRAMACION_DESACTIVADA")) return "La reprogramación en línea no está disponible. Escríbanos por WhatsApp.";
  return "No pudimos completar la operación. Intente de nuevo en unos minutos.";
}
