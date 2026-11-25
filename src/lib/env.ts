/** Configuración centralizada. Las variables sin NEXT_PUBLIC_ solo existen en el servidor. */
export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  supabaseSecret: process.env.SUPABASE_SECRET_KEY ?? "",
  sitioUrl: (process.env.NEXT_PUBLIC_SITIO_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  appsScriptUrl: process.env.APPS_SCRIPT_URL ?? "",
  appsScriptSecret: process.env.APPS_SCRIPT_SECRET ?? "",
  consentimientoVersion: process.env.CONSENTIMIENTO_VERSION ?? "2026-11",
  zonaHoraria: "America/Guayaquil",
};
