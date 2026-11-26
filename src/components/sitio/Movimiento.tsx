"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Animaciones al desplazarse:
 *  - Aparición (desvanecido + subida) de títulos, textos, tarjetas, fotos y filas,
 *    escalonada dentro de cada grupo.
 *  - Zoom suave de las imágenes al entrar en pantalla.
 *  - Paralaje ligero de la foto de portada.
 * Solo se activa con JavaScript (sin JS todo se ve normal) y se desactiva por
 * completo si el usuario pidió reducir el movimiento.
 */
const OBJETIVOS = [
  "main section > .t-label", "main section > h1", "main section > h2", "main section > p",
  ".section__head", ".narrow > *", ".hero__intro > *", ".hero__action > *",
  ".statement p", ".doctor__media", ".doctor__info > *",
  ".cards > *", ".cases > *", ".gallery > *", ".insta-car", ".insta__cta", ".feature__media", ".feature > div > *",
  ".faq__item", ".location > *", ".spec-table__row", ".specs__item",
  ".booking-page__head > *", ".footer__top > *", ".footer__links > *",
].join(",");
const GRUPOS = ".cards, .cases, .gallery, .hero__copy, .doctor__info, .narrow, .faq, .location, .spec-table, .footer";

export function Movimiento() {
  const ruta = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const raiz = document.documentElement;
    raiz.classList.add("mov");

    const elementos = Array.from(document.querySelectorAll<HTMLElement>(OBJETIVOS))
      .filter((el) => !el.closest(".adm") && !el.classList.contains("rv") && !el.classList.contains("sr-only"));
    // Escalonado: posición del elemento dentro de su grupo.
    const contadores = new Map<Element, number>();
    for (const el of elementos) {
      const grupo = el.parentElement?.closest(GRUPOS) ?? el.parentElement ?? document.body;
      const n = contadores.get(grupo) ?? 0;
      contadores.set(grupo, n + 1);
      el.style.setProperty("--rv-i", String(Math.min(n, 6)));
      el.classList.add("rv");
      if (el.matches(".doctor__media, .feature__media, .cards > *, .gallery > *, .cases > *")) el.classList.add("rv-img");
    }

    const io = new IntersectionObserver((entradas) => {
      for (const e of entradas) {
        if (e.isIntersecting) { e.target.classList.add("rv-in"); io.unobserve(e.target); }
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    elementos.forEach((el) => io.observe(el));

    // Paralaje de la portada.
    const foto = document.querySelector<HTMLElement>(".hero__figure img");
    let marco = 0;
    const alDesplazar = () => {
      if (!foto || marco) return;
      marco = requestAnimationFrame(() => {
        marco = 0;
        const y = Math.min(window.scrollY, window.innerHeight);
        foto.style.transform = `translate3d(0, ${y * 0.18}px, 0) scale(${1.04 + y * 0.00006})`;
      });
    };
    if (foto) { foto.classList.add("hero-in"); window.addEventListener("scroll", alDesplazar, { passive: true }); alDesplazar(); }

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", alDesplazar);
      if (marco) cancelAnimationFrame(marco);
    };
  }, [ruta]);

  return null;
}
