import { cerrarSesion } from "../acciones";

export default function SinAcceso() {
  return (
    <main className="adm-auth">
      <div className="adm-auth__card">
        <h1 className="t-display">Sin acceso</h1>
        <p className="t-body soft">Su cuenta no está habilitada en el panel. Pida a la administradora que le dé acceso.</p>
        <form action={cerrarSesion}><button className="cta t-button">Cerrar sesión</button></form>
      </div>
    </main>
  );
}
