import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/* Biblioteca de componentes de interfaz. Cada uno corresponde a un componente
   del archivo de Figma con el mismo nombre (ver docs/FIGMA.md). */

type Variante = "primario" | "acento" | "contorno";
const claseCta = (v: Variante = "primario", pequeño = false, extra = "") =>
  ["cta t-button", v === "acento" && "cta--accent", v === "contorno" && "cta--ghost", pequeño && "cta--small", extra].filter(Boolean).join(" ");

/** Botón / CTA. Con `href` se renderiza como enlace. */
export function Cta({ href, variante, pequeño, className, children, externo, ...rest }:
  { href?: string; variante?: Variante; pequeño?: boolean; externo?: boolean; className?: string; children: ReactNode } & ComponentProps<"button">) {
  const cls = claseCta(variante, pequeño, className);
  if (href) {
    return externo
      ? <a className={cls} href={href} target="_blank" rel="noopener noreferrer">{children}</a>
      : <Link className={cls} href={href}>{children}</Link>;
  }
  return <button className={cls} {...rest}>{children}</button>;
}

/** Enlace de navegación con texto que rueda y subrayado que crece. */
export function NavLink({ href, children, activo, externo, className = "" }:
  { href: string; children: string; activo?: boolean; externo?: boolean; className?: string }) {
  const contenido = <><span>{children}</span><span aria-hidden="true">{children}</span></>;
  const cls = `navlink t-label ${activo ? "is-active" : ""} ${className}`;
  return externo
    ? <a className={cls} href={href} target="_blank" rel="noopener noreferrer">{contenido}</a>
    : <Link className={cls} href={href}>{contenido}</Link>;
}

export const Tag = ({ children }: { children: ReactNode }) => <span className="tag t-label">{children}</span>;

export const Rotulo = ({ children, className = "" }: { children: ReactNode; className?: string }) =>
  <p className={`t-label ${className}`}>{children}</p>;

/** Tabla de datos de 2 columnas con filetes. */
export function SpecTable({ filas }: { filas: { etiqueta: string; valor: ReactNode }[] }) {
  return (
    <div className="spec-table">
      {filas.map((f) => (
        <div className="spec-row in" key={f.etiqueta}>
          <span className="t-label">{f.etiqueta}</span>
          <span className="t-body-l soft">{f.valor}</span>
        </div>
      ))}
    </div>
  );
}

/** Acordeón accesible con <details>. */
export function Acordeon({ items }: { items: { id: string; pregunta: string; respuesta: string }[] }) {
  return (
    <div className="faq__list">
      {items.map((i) => (
        <details className="faq__item" key={i.id}>
          <summary className="t-body"><span>{i.pregunta}</span><i className="faq__icon" aria-hidden="true" /></summary>
          <p className="t-body soft">{i.respuesta}</p>
        </details>
      ))}
    </div>
  );
}

/** Campo de formulario con etiqueta y error. */
export function Campo({ etiqueta, error, children, ayuda }: { etiqueta: string; error?: string; ayuda?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="t-label">{etiqueta}</span>
      {children}
      {ayuda && !error && <span className="t-caption soft">{ayuda}</span>}
      {error && <span className="t-caption field__error" role="alert">{error}</span>}
    </label>
  );
}

export function IconoWhatsapp({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="1.2" d="M4.5 19.5l1.1-3.6A8 8 0 1 1 8.4 18.6z" />
      <path fill="none" stroke="currentColor" strokeWidth="1.2" d="M9 8.6c.2-.5.6-.6.9-.6h.4c.2 0 .4 0 .5.4l.6 1.4c.1.2 0 .4-.1.6l-.5.6c.6 1.2 1.5 2 2.7 2.6l.6-.6c.2-.2.4-.2.6-.1l1.4.7c.3.1.4.3.3.6-.1.9-.9 1.6-1.8 1.6-2.9-.3-5.6-3-5.9-5.9 0-.4.1-.9.3-1.3z" />
    </svg>
  );
}


/** Logotipo pintado con el color del texto que lo rodea (máscara CSS sobre la imagen con transparencia). */
export function Logo({ src, className = "" }: { src: string | null | undefined; className?: string }) {
  if (!src) return null;
  return <span className={`logo ${className}`} aria-hidden="true" style={{ "--logo": `url("${src.replace(/"/g, "%22")}")` } as React.CSSProperties} />;
}
