"use client";
import { useState } from "react";

/** Subnavegación de categorías: oculta las tarjetas que no corresponden (sin recargar). */
export function FiltroCategorias({ categorias }: { categorias: { id: string; nombre: string }[] }) {
  const [activa, setActiva] = useState("todas");
  const elegir = (id: string) => {
    setActiva(id);
    document.querySelectorAll<HTMLElement>("#lista-tratamientos .card").forEach((c) => {
      c.hidden = id !== "todas" && c.dataset.cat !== id;
    });
  };
  const boton = (id: string, nombre: string) => (
    <button key={id} className={`navlink t-label ${activa === id ? "is-active" : ""}`} onClick={() => elegir(id)} aria-pressed={activa === id}>
      <span>{nombre}</span><span aria-hidden="true">{nombre}</span>
    </button>
  );
  return <nav className="subnav" aria-label="Categorías">{boton("todas", "Todos")}{categorias.map((c) => boton(c.id, c.nombre))}</nav>;
}
