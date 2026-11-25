# Evidencia 02 · Pruebas de la aplicación

- Fecha: 2026-11-24
- Versión: Next.js 16.4.6, React 19.3, TypeScript 5, Tailwind 4.3

## 1. Calidad estática
| Comprobación | Resultado |
|---|---|
| `npx tsc --noEmit` (tipos) | Sin errores |
| `npx eslint src` | Sin errores ni avisos |
| `npx next build` | Compila: 32 rutas (sitio, API, panel) |

## 2. Pruebas de extremo a extremo (Playwright) — 32/32 OK
Ejecutadas en escritorio (1440×933) y móvil (Pixel 7). Salida completa: `e2e-salida.txt`.

| Prueba | Escritorio | Móvil |
|---|---|---|
| Portada con secciones, botón de agendar y datos estructurados | OK | OK |
| Ficha de tratamiento con URL amigable y título SEO | OK | OK |
| Validación del formulario (nombres, teléfono, correo, consentimiento) | OK | OK |
| Reserva completa → confirmación con código y enlace de gestión | OK | OK |
| El horario reservado deja de ofrecerse | OK | OK |
| Cancelación por enlace libera el horario | OK | OK |
| Dentro de las 24 h previas no se permite cancelar en línea | OK | OK |
| El panel exige inicio de sesión (4 rutas) | OK | OK |
| Contacto y página de privacidad | OK | OK |
| API: datos inválidos → 422 | OK | OK |
| API: origen externo (CSRF) → 403 | OK | OK |
| API: campo trampa anti-bots → rechazado | OK | OK |
| API: 8 reservas simultáneas del mismo horario → 1 creada, 7 con 409 | OK | OK |
| API: límite por IP → 429 | OK | OK |
| API: token de gestión inválido → 404 | OK | OK |
| Cabeceras de seguridad (X-Frame-Options, nosniff, sin X-Powered-By) | OK | OK |

**Importante:** estas pruebas se ejecutaron contra un **doble de prueba local de Supabase** (`tests/mock/supabase-mock.mjs`), porque el entorno de desarrollo no tiene salida de red hacia supabase.co. El doble reproduce las reglas de las funciones reales. Las reglas de la base de datos real (incluidos duplicados, RLS y concurrencia) se probaron directamente en Supabase: ver `01-base-de-datos.md`.

Las mismas pruebas se ejecutan contra el sitio publicado:
`BASE_URL=https://su-dominio npx playwright test` (ver `tests/README.md`).

## 3. Panel administrativo (sesión simulada)
Las 13 secciones del panel, el detalle de cita, la ficha de paciente y la edición de tratamiento se cargaron con una sesión simulada: **HTTP 200, sin errores de JavaScript**. Capturas en `capturas/admin-*.png`.
El inicio de sesión real, la recuperación de contraseña y los permisos por rol se verifican tras el despliegue con `tests/e2e/admin.spec.ts` (requiere un usuario de prueba) y la lista de `tests/README.md`.

## 4. Diseño adaptable
Capturas a 375, 768, 1024 y 1440 px de portada y del flujo de reserva: `capturas/inicio-*.png`, `capturas/agendar-*.png`.
