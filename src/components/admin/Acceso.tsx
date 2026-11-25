"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { supabaseNavegador } from "@/lib/supabase/navegador";


function traducirError(m: string) {
  if (/rate limit/i.test(m)) return "Se enviaron demasiados correos en poco tiempo. Espere unos minutos (hasta una hora) e inténtelo de nuevo.";
  if (/same.*password|different from the old/i.test(m)) return "La nueva contraseña debe ser distinta de la anterior.";
  if (/weak|at least/i.test(m)) return "La contraseña es demasiado débil: use al menos 8 caracteres con letras y números.";
  if (/session|jwt|expired/i.test(m)) return "Su enlace expiró. Solicite uno nuevo con «¿Olvidó su contraseña?».";
  return m;
}

function Marco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <main className="adm-auth">
      <div className="adm-auth__card">
        <Link href="/" className="wordmark"><em>Dra.</em> Monserrath Montalvo</Link>
        <p className="t-label soft">Panel de administración</p>
        <h1 className="t-display">{titulo}</h1>
        {children}
      </div>
    </main>
  );
}

export function FormularioLogin() {
  const router = useRouter();
  const sp = useSearchParams();
  const [error, setError] = useState(sp.get("error") ?? "");
  const [cargando, setCargando] = useState(false);
  async function entrar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCargando(true); setError("");
    const fd = new FormData(e.currentTarget);
    const { error } = await supabaseNavegador().auth.signInWithPassword({ email: String(fd.get("email")), password: String(fd.get("password")) });
    setCargando(false);
    if (error) { setError(error.message === "Invalid login credentials" ? "Correo o contraseña incorrectos." : error.message); return; }
    const sig = sp.get("siguiente");
    router.replace(sig && sig.startsWith("/admin") ? sig : "/admin");
    router.refresh();
  }
  return (
    <Marco titulo="Iniciar sesión">
      <form className="form" onSubmit={entrar}>
        <label className="field"><span className="t-label">Correo</span><input name="email" type="email" autoComplete="username" required /></label>
        <label className="field"><span className="t-label">Contraseña</span><input name="password" type="password" autoComplete="current-password" required minLength={8} /></label>
        {error && <p className="t-body-s adm-error" role="alert">{error}</p>}
        <button className="cta t-button" disabled={cargando}>{cargando ? "Entrando…" : "Entrar"}</button>
        <Link className="t-label link" href="/admin/recuperar">¿Olvidó su contraseña?</Link>
      </form>
    </Marco>
  );
}

export function FormularioRecuperar() {
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");
  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email"));
    const { error } = await supabaseNavegador().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirmar?siguiente=/admin/actualizar-clave`,
    });
    if (error) setError(traducirError(error.message)); else setEnviado(true);
  }
  return (
    <Marco titulo="Recuperar contraseña">
      {enviado
        ? <p className="t-body soft">Si el correo está registrado, recibirá un enlace para crear una nueva contraseña.</p>
        : <form className="form" onSubmit={enviar}>
            <label className="field"><span className="t-label">Correo</span><input name="email" type="email" required /></label>
            {error && <p className="t-body-s adm-error">{error}</p>}
            <button className="cta t-button">Enviar enlace</button>
          </form>}
      <Link className="t-label link" href="/admin/login">Volver</Link>
    </Marco>
  );
}

export function FormularioClave() {
  const router = useRouter();
  const [error, setError] = useState("");
  async function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const p1 = String(fd.get("p1")), p2 = String(fd.get("p2"));
    if (p1.length < 10) { setError("Use al menos 10 caracteres."); return; }
    if (p1 !== p2) { setError("Las contraseñas no coinciden."); return; }
    const { error } = await supabaseNavegador().auth.updateUser({ password: p1 });
    if (error) { setError(traducirError(error.message)); return; }
    router.replace("/admin"); router.refresh();
  }
  return (
    <Marco titulo="Nueva contraseña">
      <form className="form" onSubmit={guardar}>
        <label className="field"><span className="t-label">Contraseña nueva</span><input name="p1" type="password" autoComplete="new-password" required minLength={10} /></label>
        <label className="field"><span className="t-label">Repetir</span><input name="p2" type="password" autoComplete="new-password" required minLength={10} /></label>
        {error && <p className="t-body-s adm-error">{error}</p>}
        <button className="cta t-button">Guardar</button>
      </form>
    </Marco>
  );
}
