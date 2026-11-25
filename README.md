# Plataforma de citas · Dra. Monserrath Montalvo

Sitio web corporativo + sistema de reservas en línea + panel administrativo privado para el consultorio de prótesis y rehabilitación oral de la Dra. Monserrath Montalvo (Ambato, Ecuador).

| Pieza | Tecnología | Dónde vive |
|---|---|---|
| Sitio público, reservas y panel | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 | Este repositorio → Vercel |
| Base de datos, inicio de sesión, archivos | Supabase (PostgreSQL + Auth + RLS + Storage) | Proyecto `dra-montalvo` (ref `iokxtudyzmuhjcytwlaq`, São Paulo) |
| Calendario y correos | Google Calendar + Google Apps Script | Cuenta de Google de la doctora (`apps-script/`) |
| Diseño | Figma | [Dra. Monserrath Montalvo · Plataforma de citas](https://www.figma.com/design/moMFe6Vu9Zvmblia2DejWB) |

## Documentación
| Documento | Para quién |
|---|---|
| [docs/INSTALACION.md](docs/INSTALACION.md) | Puesta en marcha: Supabase, Vercel, dominio, Google, primer usuario |
| [docs/MANUAL-ADMINISTRATIVO.md](docs/MANUAL-ADMINISTRATIVO.md) | La doctora y la recepción: uso diario del panel |
| [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) | Documentación técnica: responsabilidades, concurrencia, sincronización, seguridad, LOPDP |
| [docs/MANTENIMIENTO.md](docs/MANTENIMIENTO.md) | Actualizaciones, respaldos, costos y límites de los servicios |
| [docs/FIGMA.md](docs/FIGMA.md) | Archivo de diseño y correspondencia con los componentes React |
| [apps-script/README.md](apps-script/README.md) | Instalación de la integración con Google Calendar |
| [tests/README.md](tests/README.md) | Cómo ejecutar las pruebas y lista de verificación tras el despliegue |
| [tests/evidencias/](tests/evidencias/) | Evidencias de las pruebas realizadas |

## Estructura
```
src/
  app/
    (sitio)/            Páginas públicas: inicio, tratamientos, agendar, cita/[token], privacidad
    admin/              Panel: login, recuperar clave y (panel)/… protegido
    api/                Endpoints: disponibilidad, reservas, citas/[token], contacto, derechos
    auth/confirmar/     Enlaces de correo de Supabase Auth
  components/ui/        Biblioteca de componentes (Cta, NavLink, Tag, SpecTable, Acordeon, Campo)
  components/sitio/     Cabecera, Pie, Reserva, GestionCita, Interactivos…
  components/admin/     Formulario, Coleccion, Menú, Piezas (indicadores, gráfico)…
  lib/                  Supabase (servidor/navegador), datos, validación, formato, entorno
  proxy.ts              Sesión y protección optimista de /admin (antes "middleware")
supabase/migrations/    Esquema, funciones, seguridad (RLS), datos iniciales
apps-script/            Código de Google Apps Script y manifiesto
tests/                  SQL, e2e (Playwright), Apps Script, concurrencia, evidencias
```

## Desarrollo local
```bash
npm install
cp .env.example .env.local      # complete con los valores de Supabase
npm run dev                     # http://localhost:3000
npm run typecheck && npm run lint && npm run build
```

## Información provisional (editable desde el panel)
Teléfono, correo, número de WhatsApp, biografía y formación de la doctora, misión, visión, casos antes/después y testimonios **no se inventaron**: los campos vacíos no se muestran. Los **horarios de atención son provisionales** (lun–vie 09:00–13:00 y 15:00–17:30, sáb 09:00–13:00) y las duraciones de cita (30 min valoración, 60 min el resto) también: corríjalos en *Agenda y horarios* y *Tratamientos*. El panel → *Resumen* lo recuerda.
