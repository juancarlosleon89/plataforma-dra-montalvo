"use client";
import { createBrowserClient } from "@supabase/ssr";

/** Cliente del navegador (inicio de sesión del panel y subida de fotos). Usa solo la clave publicable. */
export function supabaseNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
