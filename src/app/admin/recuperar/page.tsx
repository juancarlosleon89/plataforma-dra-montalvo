import type { Metadata } from "next";
import { FormularioRecuperar } from "@/components/admin/Acceso";

export const metadata: Metadata = { title: "Recuperar contraseña", robots: { index: false } };
export default function Recuperar() { return <FormularioRecuperar />; }
