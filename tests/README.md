# Pruebas

| Tipo | Comando | Contra qué |
|---|---|---|
| Tipos y estilo | `npm run typecheck && npm run lint` | Código |
| Compilación | `npm run build` | Código |
| Base de datos (30 pruebas) | Pegar `tests/sql/pruebas_bd.sql` en *SQL Editor* de Supabase | Supabase real (crea y borra sus datos) |
| Extremo a extremo (32 pruebas) | `npx playwright install chromium` y luego `BASE_URL=https://su-dominio npx playwright test` | Sitio publicado |
| Panel con usuario real | `E2E_ADMIN_EMAIL=… E2E_ADMIN_PASSWORD=… BASE_URL=… npx playwright test tests/e2e/admin.spec.ts` | Sitio publicado |
| Concurrencia real | `BASE_URL=https://su-dominio N=8 node tests/concurrencia.mjs` | Sitio publicado + Supabase real |
| Apps Script (11 pruebas) | `node tests/apps-script/prueba-apps-script.mjs` | Código del script con dobles en memoria |

> Las pruebas e2e crean reservas reales de prueba (correos `@example.com`). Cancélelas o bórrelas después:
> `delete from citas where paciente_id in (select id from pacientes where email like '%@example.com'); delete from pacientes where email like '%@example.com';`
> El límite anti-spam (5 reservas por IP cada 10 min) puede hacer que algunas fallen con 429 si se repiten seguidas: espere 10 minutos.

## Pruebas locales sin red (doble de Supabase)
```bash
node tests/mock/supabase-mock.mjs &                 # puerto 54321
# .env.local con NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321 y claves de prueba
npm run build && npm start &
npx playwright test
```
El doble reproduce las reglas de disponibilidad y de reserva; **no sustituye** las pruebas contra Supabase real.

## Tras el despliegue (lista de verificación manual)
1. [ ] Abrir el sitio en un teléfono Android y en un iPhone: portada, menú, tratamientos, mapa.
2. [ ] Reservar una cita → ver la confirmación con código y enlace.
3. [ ] Recibir el correo de confirmación (Apps Script).
4. [ ] La cita aparece en el panel como «Pendiente» y en el Google Calendar de la doctora (≤ 5 min) en amarillo.
5. [ ] Confirmarla en el panel → el evento cambia a cian y llega el correo de confirmación.
6. [ ] Reprogramarla desde el enlace del correo → el evento se mueve y llega el aviso.
7. [ ] Crear un evento personal en Google Calendar → ese horario desaparece de `/agendar` (≤ 5 min).
8. [ ] Mover a mano el evento de una cita en Calendar → vuelve a su hora en la siguiente reconciliación (≤ 1 h).
9. [ ] Cancelar desde el panel → el evento desaparece y llega el correo.
10. [ ] Entrar al panel, cerrar sesión, intentar `/admin` → pide inicio de sesión.
11. [ ] Recuperar contraseña con el enlace del correo.
12. [ ] Invitar un usuario de Recepción → no ve Configuración ni Usuarios.
13. [ ] `node tests/concurrencia.mjs` → «solo una reserva obtuvo el horario».
14. [ ] Desactivar temporalmente Apps Script (o poner un `APPS_SCRIPT_URL` incorrecto), reservar → la cita se guarda; al restaurarlo, la cola la sincroniza (recuperación ante errores).
