import { test, expect, type Page } from "@playwright/test";

// IP de origen distinta por archivo (en local): el límite anti-spam es por IP (5 reservas / 10 min).
// En Vercel la plataforma reescribe X-Forwarded-For, así que no se puede falsificar.
test.use({ extraHTTPHeaders: { "X-Forwarded-For": `10.1.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}` } });

const datos = { nombres: "Paciente", apellidos: "De Prueba", telefono: "0999999999" };
const correo = () => `prueba+${Date.now()}${Math.floor(Math.random() * 1000)}@example.com`;

async function reservarPorInterfaz(page: Page, diaDisponible = 0) {
  await page.goto("/agendar");
  await page.getByRole("button", { name: /Valoración y plan de tratamiento/ }).click();
  await page.locator(".cal__day.is-available").nth(diaDisponible).click();
  await page.locator(".option--slot").first().waitFor();
  const hora = await page.locator(".option--slot").first().innerText();
  await page.locator(".option--slot").first().click();
  await page.getByLabel("Nombres").fill(datos.nombres);
  await page.getByLabel("Apellidos").fill(datos.apellidos);
  await page.getByLabel("Teléfono").fill(datos.telefono);
  await page.getByLabel("Correo electrónico").fill(correo());
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Revisar" }).click();
  await expect(page.getByText("Revise su reserva")).toBeVisible();
  await page.getByRole("button", { name: /Confirmar reserva/ }).click();
  return hora;
}

test("1. Portada: secciones principales y botón de agendar", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Monserrath");
  for (const s of ["Un consultorio dedicado", "Tratamientos", "Resultados", "El consultorio", "Preguntas frecuentes", "Cómo llegar"]) {
    await expect(page.getByRole("heading", { name: new RegExp(s) }).first()).toBeVisible();
  }
  await expect(page.getByRole("link", { name: /Agendar cita/ }).first()).toBeVisible();
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
});

test("2. Ficha de tratamiento con URL amigable", async ({ page }) => {
  await page.goto("/tratamientos/protesis-fijas");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Prótesis fijas");
  await expect(page).toHaveTitle(/Prótesis fijas/);
});

test("3. Validación del formulario de reserva", async ({ page }) => {
  await page.goto("/agendar?servicio=valoracion");
  await page.locator(".cal__day.is-available").first().click();
  await page.locator(".option--slot").first().click();
  await page.getByLabel("Teléfono").fill("abc");
  await page.getByRole("button", { name: "Revisar" }).click();
  await expect(page.getByText("Escriba sus nombres")).toBeVisible();
  await expect(page.getByText("Teléfono no válido")).toBeVisible();
  await expect(page.getByText("Correo no válido")).toBeVisible();
  await expect(page.getByText("Debe aceptar la política de privacidad")).toBeVisible();
});

test("4. Reserva completa con confirmación y enlace de gestión", async ({ page }) => {
  await reservarPorInterfaz(page);
  await expect(page.getByText(/Recibimos su solicitud de cita|Su cita está confirmada/)).toBeVisible();
  await expect(page.getByText(/código [A-F0-9]{8}/)).toBeVisible();
  const enlace = await page.locator(".confirm__link a").getAttribute("href");
  expect(enlace).toMatch(/\/cita\/[a-f0-9]{48}$/);
});

test("5. El horario reservado deja de ofrecerse", async ({ page }) => {
  const hora = await reservarPorInterfaz(page);
  await expect(page.getByText(/código [A-F0-9]{8}/)).toBeVisible();
  await page.goto("/agendar?servicio=valoracion");
  await page.locator(".cal__day.is-available").first().click();
  await page.locator(".option--slot").first().waitFor();
  const horas = await page.locator(".option--slot").allInnerTexts();
  expect(horas).not.toContain(hora);
});

test("6. Gestión por enlace: cancelar libera el horario", async ({ page }) => {
  // Se elige el 3.er día disponible para quedar fuera del plazo mínimo de 24 h
  await reservarPorInterfaz(page, 2);
  const enlace = await page.locator(".confirm__link a").getAttribute("href");
  await page.goto(new URL(enlace!).pathname);
  await expect(page.getByText("Estado")).toBeVisible();
  await page.getByRole("button", { name: "Cancelar cita" }).click();
  await page.getByRole("button", { name: "Sí, cancelar" }).click();
  await expect(page.getByText("Su cita fue cancelada.")).toBeVisible();
  await expect(page.locator(".spec-row", { hasText: "Estado" })).toContainText("Cancelada");
});

test("6b. Dentro de las 24 h previas no se puede cancelar en línea", async ({ page }) => {
  await reservarPorInterfaz(page, 0);
  const enlace = await page.locator(".confirm__link a").getAttribute("href");
  await page.goto(new URL(enlace!).pathname);
  await expect(page.getByText("Estado")).toBeVisible();
  const cancelar = page.getByRole("button", { name: "Cancelar cita" });
  const dentro = await page.getByText(/Los cambios en línea se permiten hasta 24 horas antes/).isVisible();
  if (dentro) await expect(cancelar).toHaveCount(0); else await expect(cancelar).toBeVisible();
});

test("7. El panel exige inicio de sesión", async ({ page }) => {
  for (const ruta of ["/admin", "/admin/citas", "/admin/pacientes", "/admin/configuracion"]) {
    await page.goto(ruta);
    await expect(page).toHaveURL(/\/admin\/login/);
  }
  await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
});

test("8. Formulario de contacto y página de privacidad", async ({ page }) => {
  await page.goto("/privacidad");
  await expect(page.getByRole("heading", { name: "Política de privacidad" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sus derechos" })).toBeVisible();
  await page.goto("/#contacto");
  await page.locator('form.form--compact input[name="nombre"]').fill("Prueba");
  await page.locator('form.form--compact input[name="telefono"]').fill("0999999999");
  await page.locator('form.form--compact textarea[name="mensaje"]').fill("Mensaje de prueba automática");
  await page.getByRole("button", { name: "Enviar mensaje" }).click();
  await expect(page.getByText("Recibimos su mensaje")).toBeVisible();
});
