# Google Apps Script · Integración con Google Calendar y correo

Este script vive **en la cuenta de Google de la doctora** (la dueña del calendario). Supabase decide la disponibilidad y bloquea los duplicados; el script solo ejecuta: crea y actualiza eventos, lee las horas ocupadas, envía correos y corrige diferencias.

## Qué hace
| Función | Cuándo | Qué hace |
|---|---|---|
| `doPost` | Cada reserva, cambio o mensaje (aviso del servidor) | Envía el correo de confirmación con el enlace de gestión, avisa a la doctora y sincroniza al instante |
| `tareaPeriodica` | Cada 5 minutos | Procesa la cola de sincronización (con reintentos) y copia las horas ocupadas del calendario a Supabase |
| `reconciliar` | Cada hora | Compara Supabase con el calendario y corrige: recrea eventos borrados, devuelve a su hora los movidos a mano, elimina huérfanos |
| `enviarRecordatorios` | Cada día a las 18:00 | Recordatorio por correo de las citas del día siguiente |

**Eventos en el calendario:** el título es «Tratamiento · Nombre I.» (sin apellidos completos ni datos clínicos), con el código de cita en la descripción y una etiqueta interna con el ID de la cita. Colores: amarillo = por confirmar, cian = confirmada, gris = atendida, rojo = no asistió.

**Horas ocupadas:** cualquier evento que la doctora cree en su calendario (congreso, trámite, vacaciones de día completo) bloquea esos horarios en la web en un máximo de 5 minutos.

## Instalación (una sola vez, ~15 minutos)
1. Entre a <https://script.google.com> **con la cuenta de la doctora** → *Nuevo proyecto*. Nómbrelo «Citas Dra. Montalvo».
2. Pegue el contenido de `Codigo.gs` en el archivo `Código.gs`.
3. *Configuración del proyecto* (engranaje) → marque «Mostrar el archivo de manifiesto appsscript.json» → reemplace su contenido por el de `appsscript.json`.
4. *Configuración del proyecto → Propiedades del script* → agregue:
   | Propiedad | Valor |
   |---|---|
   | `SUPABASE_URL` | `https://iokxtudyzmuhjcytwlaq.supabase.co` |
   | `SUPABASE_SECRET_KEY` | Supabase → Project Settings → API Keys → clave secreta (`sb_secret_…`) |
   | `WEBHOOK_SECRET` | Una cadena larga aleatoria (la misma que `APPS_SCRIPT_SECRET` en Vercel) |
   | `CALENDAR_ID` | `primary` (o el ID de un calendario específico) |
   | `SITIO_URL` | `https://su-dominio` |
   | `CORREO_AVISOS` | Correo donde la doctora quiere recibir avisos |
   | `NOMBRE_CONSULTORIO` | `Dra. Monserrath Montalvo` |
   | `DIRECCION` | `Edificio Movilab 2, calles Quito y Cuenca, Ambato` |
5. Seleccione la función `probarConexion` → *Ejecutar*. Google pedirá permisos (calendario, correo, conexiones externas, disparadores): acéptelos. El registro debe decir «Supabase OK… Calendario: …».
6. Seleccione `instalar` → *Ejecutar*. Crea los tres disparadores (puede verlos en el reloj de la izquierda).
7. *Implementar → Nueva implementación → Aplicación web*: «Ejecutar como: yo», «Quién tiene acceso: cualquier usuario». Copie la URL que termina en `/exec`.
8. En Vercel cargue `APPS_SCRIPT_URL` (la URL del paso 7) y `APPS_SCRIPT_SECRET` (el mismo valor de `WEBHOOK_SECRET`) y vuelva a desplegar.

> «Cualquier usuario» es necesario para que el servidor pueda llamar al script. La seguridad la da el secreto compartido: sin él, el script rechaza la petición.

## Permisos de Google Workspace
- `calendar`: crear, mover y borrar los eventos de las citas, y leer las horas ocupadas.
- `script.send_mail`: correos de confirmación, cambios y recordatorios (límite de cuentas gratuitas: 100 destinatarios/día; Workspace: 1.500/día).
- `script.external_request`: hablar con Supabase.
- `script.scriptapp`: crear los disparadores.

## Si algo falla
- **La cita queda guardada igual**: Supabase es la fuente de verdad. La cola reintenta con esperas crecientes (2, 4, 8… hasta 240 minutos, máximo 8 intentos).
- Los errores se ven en el panel → *Actividad y sincronización* y en *Ejecuciones* del editor de Apps Script.
- Para forzar una sincronización: panel → cita → «Reintentar sincronización», o ejecute `procesarCola` en el editor.
- Si cambia el código, haga *Implementar → Administrar implementaciones → Editar → Nueva versión* (la URL no cambia).

## Pruebas
`node tests/apps-script/prueba-apps-script.mjs` ejecuta 11 pruebas del script con dobles en memoria de Calendar, correo y Supabase.
