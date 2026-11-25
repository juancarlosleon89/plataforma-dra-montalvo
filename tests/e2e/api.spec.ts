import { test, expect } from "@playwright/test";

// IP de origen distinta por archivo (en local): el límite anti-spam es por IP (5 reservas / 10 min).
// En Vercel la plataforma reescribe X-Forwarded-For, así que no se puede falsificar.
test.use({ extraHTTPHeaders: { "X-Forwarded-For": `10.2.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}` } });

/** Pruebas de seguridad y concurrencia sobre la API pública. */
async function primerHorario(request: import("@playwright/test").APIRequestContext) {
  const html = await (await request.get("/")).text();
  void html;
  // El id del servicio se obtiene de la página de agendar (Reserva recibe los servicios)
  const pagina = await (await request.get("/agendar")).text();
  const id = /"id":"([0-9a-f-]{36})","slug":"valoracion"/.exec(pagina.replace(/\\"/g, '"'))?.[1];
  expect(id, "id del servicio de valoración").toBeTruthy();
  const { dias } = await (await request.get(`/api/disponibilidad?servicio=${id}`)).json();
  const dia = dias.find((d: { libres: number }) => d.libres > 0).fecha;
  const { horarios } = await (await request.get(`/api/disponibilidad?servicio=${id}&fecha=${dia}`)).json();
  return { id: id!, horarios: horarios as { inicio: string }[] };
}
const cuerpo = (id: string, inicio: string, n: number) => ({
  servicio_id: id, inicio, nombres: "Concurrente", apellidos: `N${n}`, telefono: "0999999999",
  email: `concurrente${n}.${Date.now()}@example.com`, observaciones: "", consentimiento: true, sitio_web: "",
});

test.describe.configure({ mode: "serial" });

test("A. Datos inválidos → 422 con detalle por campo", async ({ request }) => {
  const r = await request.post("/api/reservas", { data: { servicio_id: "x", inicio: "ayer", consentimiento: false } });
  expect(r.status()).toBe(422);
  expect((await r.json()).campos).toBeTruthy();
});

test("B. Origen externo bloqueado (CSRF) → 403", async ({ request }) => {
  const r = await request.post("/api/reservas", { data: {}, headers: { Origin: "https://sitio-malicioso.example" } });
  expect(r.status()).toBe(403);
});

test("C. Campo trampa anti-bots → rechazado", async ({ request }) => {
  const { id, horarios } = await primerHorario(request);
  const r = await request.post("/api/reservas", { data: { ...cuerpo(id, horarios[0].inicio, 0), sitio_web: "http://spam" } });
  expect([400, 422]).toContain(r.status());
});

test("D. 8 reservas simultáneas del mismo horario → solo 1 se confirma", async ({ playwright, baseURL }) => {
  const ctx = await playwright.request.newContext({ baseURL });
  const { id, horarios } = await primerHorario(ctx);
  const inicio = horarios[horarios.length - 1].inicio;
  const respuestas = await Promise.all(Array.from({ length: 8 }, (_, n) =>
    playwright.request.newContext({ baseURL, extraHTTPHeaders: { "X-Forwarded-For": `10.0.0.${n + 1}` } })
      .then((c) => c.post("/api/reservas", { data: cuerpo(id, inicio, n + 1) }))));
  const codigos = respuestas.map((r) => r.status()).sort();
  expect(codigos.filter((c) => c === 201)).toHaveLength(1);
  expect(codigos.filter((c) => c === 409)).toHaveLength(7);
  const { horarios: despues } = await (await ctx.get(`/api/disponibilidad?servicio=${id}&fecha=${inicio.slice(0, 10)}`)).json();
  expect(despues.find((h: { inicio: string }) => h.inicio === inicio)).toBeUndefined();
});

test("E. Límite de solicitudes por IP → 429", async ({ playwright, baseURL }) => {
  const ctx = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { "X-Forwarded-For": "10.9.9.9" } });
  const estados: number[] = [];
  for (let i = 0; i < 7; i++) estados.push((await ctx.post("/api/contacto", { data: { nombre: "Spam", telefono: "0999999999", mensaje: "hola" } })).status());
  expect(estados).toContain(429);
});

test("F. Enlace de gestión con token inválido → 404", async ({ request }) => {
  expect((await request.get("/api/citas/no-es-un-token")).status()).toBe(404);
  expect((await request.get(`/api/citas/${"a".repeat(48)}`)).status()).toBe(404);
});

test("G. Cabeceras de seguridad", async ({ request }) => {
  const r = await request.get("/");
  expect(r.headers()["x-frame-options"]).toBe("DENY");
  expect(r.headers()["x-content-type-options"]).toBe("nosniff");
  expect(r.headers()["x-powered-by"]).toBeUndefined();
});
