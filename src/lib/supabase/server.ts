import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createPlainClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

/** Cliente con la sesión del usuario (panel). Respeta RLS. */
export async function supabaseServidor() {
  const store = await cookies();
  return createServerClient(env.supabaseUrl, env.supabaseKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (lista) => {
        try {
          lista.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* En componentes de servidor no se pueden escribir cookies; el proxy las renueva. */
        }
      },
    },
  });
}

/** Cliente público sin sesión (lectura de contenido publicado). Respeta RLS como "anon". */
export function supabasePublico() {
  return createPlainClient(env.supabaseUrl, env.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Cliente con la clave secreta. SOLO en rutas de servidor que validan la entrada
 * (reservas, contacto, gestión por enlace). Nunca se importa en código de navegador.
 */
export function supabaseServicio() {
  if (!env.supabaseSecret) throw new Error("Falta SUPABASE_SECRET_KEY en el servidor.");
  if (env.supabaseSecret.startsWith("sb_publishable_") || env.supabaseSecret === env.supabaseKey) {
    throw new Error("SUPABASE_SECRET_KEY contiene la clave PUBLICABLE. Pegue en Vercel la clave secreta (sb_secret_…) de Supabase → Project Settings → API Keys.");
  }
  return createPlainClient(env.supabaseUrl, env.supabaseSecret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
