import { defineConfig, devices } from "@playwright/test";

/**
 * Pruebas de extremo a extremo.
 * - Contra un despliegue real:  BASE_URL=https://su-dominio npx playwright test
 * - En local con el doble de Supabase: ver tests/README.md
 */
const ejecutable = process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {};
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 45_000,
  fullyParallel: false,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: { baseURL: process.env.BASE_URL ?? "http://localhost:3000", locale: "es-EC", timezoneId: "America/Guayaquil", screenshot: "only-on-failure", launchOptions: ejecutable },
  projects: [
    { name: "escritorio", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 933 }, launchOptions: ejecutable } },
    { name: "movil", use: { ...devices["Pixel 7"], launchOptions: ejecutable } },
  ],
});
