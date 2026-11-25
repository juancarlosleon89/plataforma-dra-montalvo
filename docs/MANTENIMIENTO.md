# Mantenimiento, respaldos y costos

## Cambios sin programar (desde el panel)
Textos, fotos, tratamientos, precios, horarios, bloqueos, preguntas, galería, testimonios, casos, datos de contacto, redes y color de acento.

## Cambios de código
1. Edite en su computadora (o pida el cambio a un desarrollador sobre **su** repositorio).
2. `npm run typecheck && npm run lint && npm run build` y, si puede, `npm run test:e2e`.
3. Suba a GitHub → Vercel publica solo. Para volver atrás: Vercel → *Deployments* → versión anterior → *Promote to Production*.
4. Cambios de base de datos: agregue un archivo nuevo en `supabase/migrations/` (nunca edite los ya aplicados) y ejecútelo en el *SQL Editor* de Supabase.

Actualizaciones de dependencias: cada 3 meses, `npm outdated`, luego `npm update` y repita el paso 2. Las versiones mayores de Next.js traen guía de migración en `node_modules/next/dist/docs/`.

## Respaldos
| Qué | Cómo | Frecuencia |
|---|---|---|
| Base de datos | GitHub Actions: `.github/workflows/respaldo.yml` genera un volcado SQL y lo guarda 30 días como artefacto privado | Semanal (y manual con *Run workflow*) |
| Base de datos (alternativa) | Supabase Pro incluye respaldos diarios automáticos (7 días) | Diario |
| Exportación manual | `npx supabase db dump --db-url "$SUPABASE_DB_URL" -f respaldo.sql` | Antes de cambios grandes |
| Fotos (Storage) | Supabase → Storage → bucket `publico` → descargar | Mensual |
| Código | GitHub (historial completo) | Continuo |
| Diseño | Figma (historial de versiones) | Continuo |

Para activar el respaldo semanal: GitHub → *Settings → Secrets → Actions* → `SUPABASE_DB_URL` = cadena de conexión de Supabase (*Project Settings → Database → Connection string → URI*, con la contraseña de la base).

**Restaurar:** cree un proyecto Supabase vacío, y en *SQL Editor* ejecute el volcado (o `psql "$NUEVA_URL" -f respaldo.sql`). Actualice las variables de Vercel y Apps Script.

## Servicios, límites y costos (verifique los precios vigentes)
| Servicio | Plan | Límites relevantes | Costo |
|---|---|---|---|
| Supabase | Free | 500 MB de base, 1 GB de archivos, pausa tras 7 días sin actividad (la tarea de Apps Script cada 5 min mantiene el proyecto activo), sin respaldos descargables | USD 0. Pro: ~USD 25/mes (respaldos diarios, sin pausa) |
| Vercel | Hobby | Uso **no comercial** según sus condiciones | USD 0. Para un consultorio corresponde Pro: ~USD 20/mes |
| Google Apps Script | Cuenta gratuita | Correos: ~100 destinatarios/día; tiempo de disparadores: 90 min/día | USD 0 (Workspace amplía las cuotas) |
| Dominio | — | — | ~USD 12–40/año según extensión |
| Figma | Starter | 3 páginas por archivo; su asiento actual es de solo lectura en algunos archivos de equipo | USD 0 |
| GitHub | Free | Repositorios privados ilimitados | USD 0 |

Costo mínimo recomendado para operar con respaldo y conforme a condiciones: ~USD 45/mes (Vercel Pro + Supabase Pro) + dominio. Arranque posible: USD 0/mes + dominio, aceptando las limitaciones anteriores.

## Señales a vigilar
- Panel → *Actividad y sincronización*: errores repetidos o «última lectura del calendario» antigua → revise Apps Script (*Ejecuciones*).
- Correos que no llegan → cuota de MailApp o SMTP de Supabase.
- Supabase → *Reports*: uso de base y almacenamiento.
