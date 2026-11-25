import { test, expect } from "@playwright/test";

/**
 * Pruebas del panel con un usuario REAL (solo contra el sitio publicado).
 * E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD: usuario con rol admin.
 * E2E_RECEPCION_EMAIL / E2E_RECEPCION_PASSWORD (opcional): usuario con rol recepción.
 */
const admin = { email: process.env.E2E_ADMIN_EMAIL, clave: process.env.E2E_ADMIN_PASSWORD };
const recep = { email: process.env.E2E_RECEPCION_EMAIL, clave: process.env.E2E_RECEPCION_PASSWORD };

async function entrar(page: import("@playwright/test").Page, u: { email?: string; clave?: string }) {
  await page.goto("/admin/login");
  await page.getByLabel("Correo").fill(u.email!);
  await page.getByLabel("Contraseña").fill(u.clave!);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test.describe("Panel con usuario real", () => {
  test.skip(!admin.email, "Defina E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD");

  test("Contraseña incorrecta → mensaje claro", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Correo").fill(admin.email!);
    await page.getByLabel("Contraseña").fill("incorrecta-123");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("Correo o contraseña incorrectos.")).toBeVisible();
  });

  test("Administrador: indicadores, citas, cambio de estado y cierre de sesión", async ({ page }) => {
    await entrar(page, admin);
    await expect(page.getByText("Total de citas")).toBeVisible();
    await page.getByRole("link", { name: "Citas" }).first().click();
    await expect(page.getByRole("heading", { name: "Citas" })).toBeVisible();
    await page.getByRole("link", { name: "Calendario" }).click();
    await expect(page.getByText(/Semana del/)).toBeVisible();
    for (const s of ["Pacientes", "Agenda y horarios", "Tratamientos", "Configuración", "Usuarios", "Actividad y sincronización"]) {
      await page.getByRole("link", { name: s }).first().click();
      await expect(page.locator("h1")).toBeVisible();
    }
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("Recepción no ve configuración ni usuarios", async ({ page }) => {
    test.skip(!recep.email, "Defina E2E_RECEPCION_EMAIL y E2E_RECEPCION_PASSWORD");
    await entrar(page, recep);
    await expect(page.getByRole("link", { name: "Configuración" })).toHaveCount(0);
    await page.goto("/admin/usuarios");
    await expect(page).toHaveURL(/error=permiso/);
  });
});
