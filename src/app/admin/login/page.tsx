import { Suspense } from "react";
import type { Metadata } from "next";
import { FormularioLogin } from "@/components/admin/Acceso";

export const metadata: Metadata = { title: "Ingreso al panel", robots: { index: false } };
export default function Login() {
  return <Suspense><FormularioLogin /></Suspense>;
}
