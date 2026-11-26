"use client";
import { useEffect, useRef, useState } from "react";

type Video = { tipo: string; codigo: string };

/**
 * Carrusel de videos de Instagram. Usa el reproductor oficial (iframe /embed/) recortado:
 * la cabecera (perfil y «Ver perfil», 54 px) queda por encima del marco y el pie
 * («Ver más en Instagram», me gusta, comentarios) por debajo, así solo se ve el video (4:5).
 */
export function CarruselInstagram({ videos }: { videos: Video[] }) {
  const pista = useRef<HTMLDivElement>(null);
  const [extremos, setExtremos] = useState({ inicio: true, fin: false });

  useEffect(() => {
    const el = pista.current;
    if (!el) return;
    const medir = () => setExtremos({ inicio: el.scrollLeft < 8, fin: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 });
    medir();
    el.addEventListener("scroll", medir, { passive: true });
    window.addEventListener("resize", medir);
    return () => { el.removeEventListener("scroll", medir); window.removeEventListener("resize", medir); };
  }, []);

  const mover = (dir: 1 | -1) => {
    const el = pista.current;
    if (!el) return;
    const tarjeta = el.querySelector<HTMLElement>(".insta-car__item");
    const paso = tarjeta ? tarjeta.offsetWidth + parseFloat(getComputedStyle(el).columnGap || "0") : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * paso, behavior: "smooth" });
  };

  return (
    <div className="insta-car" role="region" aria-roledescription="carrusel" aria-label="Videos de Instagram">
      <div className="insta-car__pista" ref={pista} tabIndex={0}>
        {videos.map((v, i) => (
          <div className="insta-car__item" key={v.codigo} aria-label={`Video ${i + 1} de ${videos.length}`}>
            <iframe
              title={`Video de Instagram ${i + 1}`}
              src={`https://www.instagram.com/${v.tipo}/${v.codigo}/embed/`}
              loading="lazy"
              scrolling="no"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            />
          </div>
        ))}
      </div>
      {videos.length > 1 && (
        <div className="insta-car__nav">
          <button type="button" className="insta-car__btn" onClick={() => mover(-1)} disabled={extremos.inicio} aria-label="Videos anteriores">←</button>
          <button type="button" className="insta-car__btn" onClick={() => mover(1)} disabled={extremos.fin} aria-label="Videos siguientes">→</button>
        </div>
      )}
    </div>
  );
}
