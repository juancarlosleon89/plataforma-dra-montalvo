# Evidencia 03 · Integración con Google Calendar (Apps Script)

- Script: `apps-script/Codigo.gs` (sintaxis verificada con `node --check`)
- Prueba: `node tests/apps-script/prueba-apps-script.mjs` → **11/11 OK** (salida en `apps-script-salida.txt`)

| Prueba | Resultado |
|---|---|
| Crear: cita nueva → evento etiquetado, ID devuelto a Supabase | OK |
| Título sin apellidos completos ni datos clínicos | OK |
| Reprogramar mueve el mismo evento y avisa al paciente | OK |
| Cancelar elimina el evento y envía correo | OK |
| Idempotencia: evento borrado a mano → se recrea | OK |
| Error de Calendar → se informa a Supabase para reintentar | OK |
| Horas ocupadas: solo eventos ajenos a la plataforma | OK |
| Reconciliación: evento movido a mano → se reencola (Supabase manda) | OK |
| Reconciliación: evento huérfano → se elimina | OK |
| Webhook con secreto incorrecto → rechazado | OK |
| Webhook de reserva → correo al paciente con enlace + aviso a la doctora | OK |

La parte de base de datos de la sincronización (cola, reintentos con espera exponencial, guardado del ID del evento, bloqueo por eventos del calendario) se probó en Supabase real: pruebas 11–14 de `01-base-de-datos.md`.

**Pendiente tras la instalación en la cuenta de la doctora:** prueba en vivo (crear una cita → ver el evento en su calendario en menos de 5 minutos; crear un evento personal → ver que ese horario desaparece de la web). La lista de verificación está en `tests/README.md`.
