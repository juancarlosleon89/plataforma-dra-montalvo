"use client";
import { useEffect } from "react";
import { supabaseNavegador } from "@/lib/supabase/navegador";

/**
 * Las invitaciones enviadas desde el panel de Supabase regresan al sitio con la
 * sesión en el fragmento de la URL (#access_token=…&type=invite). El servidor no
 * ve ese fragmento, así que aquí se toma la sesión y se lleva al usuario a crear
 * su contraseña (invitación o recuperación) o al panel.
 */
export function EnlaceAuth() {
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash || !/(access_token|error_description)=/.test(hash)) return;
    const p = new URLSearchParams(hash);
    const limpiar = () => history.replaceState(null, "", window.location.pathname + window.location.search);

    const errorDesc = p.get("error_description");
    if (errorDesc) {
      limpiar();
      window.location.replace(`/admin/login?error=${encodeURIComponent("El enlace no es válido o ya expiró. Solicite uno nuevo con «¿Olvidó su contraseña?».")}`);
      return;
    }
    const access_token = p.get("access_token");
    const refresh_token = p.get("refresh_token");
    const tipo = p.get("type");
    if (!access_token || !refresh_token) return;

    supabaseNavegador().auth.setSession({ access_token, refresh_token }).then(({ error }) => {
      limpiar();
      if (error) {
        window.location.replace(`/admin/login?error=${encodeURIComponent("El enlace no es válido o ya expiró.")}`);
        return;
      }
      const crearClave = tipo === "invite" || tipo === "recovery" || tipo === "signup";
      window.location.replace(crearClave ? "/admin/actualizar-clave" : "/admin");
    });
  }, []);
  return null;
}
