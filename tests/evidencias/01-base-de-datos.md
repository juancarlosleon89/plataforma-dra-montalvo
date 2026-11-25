# Evidencia 01 · Pruebas de base de datos

- Fecha: 2026-11-24 (hora de Ecuador)
- Proyecto: Supabase `dra-montalvo` (ref `iokxtudyzmuhjcytwlaq`, región sa-east-1)
- Script: `tests/sql/pruebas_bd.sql` (se ejecuta en el editor SQL de Supabase; crea y borra sus propios datos)

| # | Prueba | Resultado | Detalle |
|---|---|---|---|
| 1 | Disponibilidad lunes (30 min, 09-13 y 15-17:30) | OK | 13 horarios |
| 2 | Domingo sin horarios | OK | 0 |
| 3 | Reserva válida | OK | código generado, estado pendiente |
| 4 | Mismo horario rechazado | OK | HORARIO_NO_DISPONIBLE |
| 5 | Restricción de solape en la tabla (sin pasar por la función) | OK | exclusion_violation |
| 6 | Horario reservado ya no se ofrece | OK | |
| 7 | Datos inválidos rechazados | OK | DATOS_INVALIDOS |
| 8 | Consentimiento obligatorio | OK | CONSENTIMIENTO_REQUERIDO |
| 9 | Hora fuera de la grilla rechazada | OK | HORARIO_NO_DISPONIBLE |
| 10 | Bloqueo (vacaciones) elimina la tarde | OK* | 7 horarios |
| 11 | Evento ajeno de Google Calendar bloquea el horario | OK | |
| 12 | La reserva encola "crear" para Calendar | OK | |
| 13 | Error de sincronización programa reintento (espera exponencial) | OK | |
| 14 | Reintento exitoso guarda el ID del evento | OK | |
| 15 | Consulta por enlace del paciente | OK | |
| 16 | Reprogramación por el paciente | OK | |
| 17 | El horario anterior queda libre | OK | |
| 18 | Cancelación por el paciente encola "cancelar" | OK | |
| 19 | Cita cancelada no se modifica de nuevo | OK | CITA_NO_MODIFICABLE |
| 20 | Cancelar libera el horario | OK | |
| 21 | Cancelación fuera de plazo rechazada | OK | FUERA_DE_PLAZO |
| 22 | Límite de solicitudes (anti-spam) | OK | 4.ª bloqueada |
| 23 | Público lee servicios activos | OK | 6 |
| 24 | Público NO ve pacientes | OK | 0 filas |
| 25 | Público NO ve citas | OK | 0 filas |
| 26 | Público NO puede llamar `reservar_cita` | OK | permiso denegado |
| 27 | Público NO puede crear servicios | OK | RLS |
| 28 | Público NO accede a indicadores | OK | permiso denegado |
| 29 | Usuario registrado sin rol NO ve pacientes | OK | 0 filas |
| 30 | Usuario sin rol NO accede al panel | OK | NO_AUTORIZADO |

\* La primera ejecución dio FALLO en la prueba 10 por un error del propio script (precedencia de `AT TIME ZONE`); se corrigió el script y se volvió a ejecutar: OK.

**Concurrencia.** La reserva toma un candado transaccional (`pg_advisory_xact_lock`) y la tabla tiene una restricción de exclusión `citas_sin_solape`; PostgreSQL garantiza que, aunque dos transacciones lleguen al mismo tiempo, solo una confirma. La prueba 5 demuestra que la restricción rechaza el solape incluso fuera de la función. La prueba de carga con peticiones simultáneas reales (`tests/concurrencia.mjs`) se ejecuta contra la URL desplegada; ver `02-aplicacion.md`.

**Análisis de seguridad de Supabase:** tras la migración 05 quedan solo avisos esperados (funciones `SECURITY DEFINER` que verifican el rol por dentro y la disponibilidad pública sin datos personales).
