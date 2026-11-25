# Documentación técnica

## 1. Vista general
```
Paciente ──HTTPS──▶ Vercel (Next.js)
                     ├─ Páginas públicas (servidor, caché 60 s + revalidación al guardar en el panel)
                     ├─ /api/* (validación zod, límite por IP, CSRF) ──clave secreta──▶ Supabase
                     └─ Panel /admin (sesión Supabase Auth, RLS) ───────────────────▶ Supabase
Supabase (PostgreSQL)
  ├─ Reglas de negocio en funciones SQL (disponibilidad, reservar_cita, *_por_token)
  ├─ Restricción de exclusión: nunca dos citas activas solapadas
  ├─ Disparadores: auditoría + cola_sincronizacion
  └─ RLS en todas las tablas
Google Apps Script (cuenta de la doctora)
  ├─ doPost: avisos del servidor (correo de confirmación, sincronización inmediata)
  ├─ cada 5 min: cola → Google Calendar; Google Calendar (ocupados) → Supabase
  ├─ cada hora: reconciliación
  └─ 18:00: recordatorios
```

## 2. Responsabilidades (quién manda en qué)
| Operación | Responsable | Notas |
|---|---|---|
| Disponibilidad | Supabase (`disponibilidad`) | Horarios + duración + intervalo + anticipación + citas + bloqueos + ocupados de Calendar |
| Crear/modificar/cancelar citas | Supabase (funciones y RLS) | La app nunca escribe citas sin pasar por estas reglas |
| Impedir duplicados | Supabase | Candado transaccional + restricción de exclusión `citas_sin_solape` |
| Autenticación y permisos | Supabase Auth + tabla `administradores` + RLS | Apps Script no autentica a nadie |
| Calendario de la doctora | Google Calendar (copia operativa) | Escrito solo por Apps Script |
| Eventos personales de la doctora | Google Calendar → `calendario_ocupado` | Bloquean horarios en la web |
| Correos al paciente y avisos | Apps Script (MailApp) | Si falla, la cita sigue válida |
| Validación de entradas | Servidor (zod + funciones SQL) | El navegador solo valida para la comodidad del usuario |

**Resolución de inconsistencias:** Supabase es la fuente de verdad de las citas. Si un evento de la plataforma se borra o se mueve a mano en Calendar, la reconciliación horaria lo restaura. Si queda un evento de la plataforma sin cita, se elimina. Los eventos que no son de la plataforma nunca se modifican: solo se leen como «ocupado».

## 3. Control de concurrencia
1. `reservar_cita` toma `pg_advisory_xact_lock(hashtext('agenda-citas'))`: las reservas se ejecutan de a una dentro de la base de datos.
2. Dentro del candado vuelve a calcular la disponibilidad y exige que el inicio coincida exactamente con un horario libre.
3. La tabla `citas` tiene `EXCLUDE USING gist (tstzrange(inicio, fin) WITH &&) WHERE estado activo`: aunque alguien insertara saltándose la función, PostgreSQL rechaza el solape (`exclusion_violation` → `HORARIO_NO_DISPONIBLE`, HTTP 409).
4. La interfaz, ante un 409, vuelve al paso de horarios, recarga la disponibilidad y lo explica al paciente.
La reprogramación (paciente y panel) usa el mismo candado y la misma restricción.

## 4. Sincronización con Google Calendar
- Cada inserción o cambio relevante de una cita encola una fila en `cola_sincronizacion` (disparador).
- `sync_tomar_lote` entrega solo la acción más reciente por cita (`FOR UPDATE SKIP LOCKED`) y descarta las anteriores.
- Apps Script aplica la acción de forma **idempotente** según el estado actual de la cita: crea, actualiza o borra el evento; guarda `google_event_id` con `sync_resultado`.
- Errores: estado `error`, reintento con espera exponencial (2^n minutos, máximo 240, hasta 8 intentos) y registro en `registro_errores`; visible en el panel.
- Eventos: título «Tratamiento · Nombre I.», descripción con código y teléfono, etiqueta `mm_cita_id`. Sin datos clínicos.

## 5. Seguridad
| Medida | Implementación |
|---|---|
| HTTPS y HSTS | Vercel + cabecera `Strict-Transport-Security` |
| Cabeceras | `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, sin `X-Powered-By` |
| Claves | La clave secreta solo existe en variables del servidor (Vercel) y en Propiedades de Apps Script. El navegador usa la publicable |
| RLS | Activo y forzado en todas las tablas. Público: solo contenido publicado y disponibilidad (sin datos personales). Recepción: agenda y pacientes. Admin: todo |
| Funciones | `EXECUTE` revocado a `public/anon/authenticated`; solo se concede lo necesario. `reservar_cita`, `*_por_token`, `sync_*` solo con clave de servicio |
| Inyección SQL | Consultas parametrizadas (PostgREST/RPC); sin SQL dinámico con datos del usuario |
| XSS | React escapa todo; JSON-LD con `<` escapado; limpieza de caracteres de control y `<>` en la base |
| CSRF | Rutas públicas verifican `Origin`; el panel usa Server Actions (protección de origen integrada de Next.js) |
| Spam y abuso | Límite por IP en base de datos (reservas 5/10 min, contacto 4/10 min, derechos 3/h), campo trampa, máximo 3 citas activas por paciente |
| Enlace del paciente | Token aleatorio de 192 bits; en la base solo se guarda su hash SHA-256 |
| Panel | Proxy (comprobación optimista) + verificación de rol activo en cada página + RLS. Sin registro abierto: solo por invitación |
| Auditoría | `registro_actividad`: usuario, tabla, acción, antes/después, fecha |
| Errores | `registro_errores` + registros de Vercel y Apps Script |

## 6. Protección de datos (LOPDP Ecuador)
- **Transparencia:** página `/privacidad` (texto base: revíselo con un abogado).
- **Finalidad y minimización:** solo nombre, teléfono, correo y observaciones opcionales; sin datos clínicos.
- **Consentimiento:** casilla obligatoria; se guarda fecha y versión (`consentimiento_en`, `consentimiento_version`).
- **Derechos:** formulario público → `solicitudes_derechos` → gestión en el panel; rectificación editando la ficha; eliminación con `admin_anonimizar_paciente` (borra datos personales y su rastro en auditoría, conserva la cita como estadística).
- **Seguridad:** RLS, cifrado en tránsito y en reposo (Supabase), mínimo privilegio, auditoría.
- **Encargados:** Supabase, Vercel y Google (declarados en la política).

## 7. Modelo de datos (resumen)
`administradores`, `configuracion_sitio`, `informacion_institucional`, `configuracion_agenda`, `categorias_tratamiento`, `servicios`, `servicio_dias`, `horarios`, `bloqueos_agenda`, `calendario_ocupado`, `pacientes`, `citas`, `cola_sincronizacion`, `registro_actividad`, `registro_errores`, `solicitudes_derechos`, `limites_solicitudes`, `autorizaciones_publicacion`, `portafolio`, `galeria`, `testimonios`, `faq`, `mensajes_contacto`. Estados de cita: pendiente, confirmada, reprogramada, cancelada, atendida, no_asistio. Detalle completo en `supabase/migrations/`.

## 8. Decisiones técnicas
- **Next.js 16 sin Cache Components:** se usa el modelo de caché clásico (`revalidate` + `revalidatePath`), documentado y más simple de mantener.
- **Proxy en lugar de middleware:** convención de Next.js 16.
- **Estilos:** tokens CSS del sistema visual expuestos a Tailwind (`bg-tinta`, `text-suave`…) + clases de componente (`.cta`, `.option`, `.spec-row`…). Cambiar la identidad = editar tokens.
- **Gráficos sin dependencias:** SVG propio (menos peso y mantenimiento).
- **Correo por Apps Script:** gratis y en la cuenta de la doctora. Si el volumen supera la cuota, se puede cambiar a un proveedor (Resend, Brevo) modificando solo `notificar*` del script.
