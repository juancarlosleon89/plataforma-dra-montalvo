"use client";
import { createContext, useContext } from "react";
import { textosPorDefecto, type Textos } from "@/lib/textos";

const Contexto = createContext<Textos>(textosPorDefecto());

/** Hace llegar los textos editables a los componentes interactivos (menú, reserva, formularios). */
export function TextosProvider({ textos, children }: { textos: Textos; children: React.ReactNode }) {
  return <Contexto.Provider value={textos}>{children}</Contexto.Provider>;
}

export const useTextos = () => useContext(Contexto);
