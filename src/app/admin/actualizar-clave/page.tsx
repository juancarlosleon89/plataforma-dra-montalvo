import type { Metadata } from "next";
import { FormularioClave } from "@/components/admin/Acceso";

export const metadata: Metadata = { title: "Nueva contraseña", robots: { index: false } };
export default function ActualizarClave() { return <FormularioClave />; }
