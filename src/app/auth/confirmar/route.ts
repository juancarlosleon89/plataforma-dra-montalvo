import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseServidor } from "@/lib/supabase/server";

/** Destino de los enlaces de correo de Supabase Auth (invitación y recuperación de contraseña). */
export async function GET(req: NextRequest) {
  const u = req.nextUrl;
  const siguiente = u.searchParams.get("siguiente") ?? "/admin";
  const destino = siguiente.startsWith("/admin") ? siguiente : "/admin";
  const sb = await supabaseServidor();
  const code = u.searchParams.get("code");
  const tokenHash = u.searchParams.get("token_hash");
  const tipo = u.searchParams.get("type") as EmailOtpType | null;
  const { error } = code
    ? await sb.auth.exchangeCodeForSession(code)
    : tokenHash && tipo ? await sb.auth.verifyOtp({ token_hash: tokenHash, type: tipo }) : { error: new Error("Enlace incompleto") };
  if (error) return NextResponse.redirect(new URL(`/admin/login?error=${encodeURIComponent("El enlace no es válido o ya expiró.")}`, req.url));
  return NextResponse.redirect(new URL(destino, req.url));
}
