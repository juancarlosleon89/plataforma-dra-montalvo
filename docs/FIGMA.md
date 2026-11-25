# Diseño en Figma

Archivo: **[Dra. Monserrath Montalvo · Plataforma de citas](https://www.figma.com/design/moMFe6Vu9Zvmblia2DejWB)** (equipo «El equipo de Juan Carlos Barrera León»).

## Contenido (3 páginas: límite del plan Starter)
| Página | Contenido |
|---|---|
| Sistema de diseño | Hoja de fundamentos (colores y tipografía) y sección «Componentes» |
| Sitio público | Portada (escritorio) y Agendar · Horario (escritorio y móvil), construidas con instancias |
| Panel administrativo | Resumen del panel (escritorio), construido con instancias |

**Variables** (colección «Tokens»): 13 colores, 11 espaciados y 4 radios, cada una con su sintaxis web `var(--…)` igual al CSS del proyecto.
**Estilos de texto:** Display, Statement, Heading, Title, Claim, Body L, Body, Body S, Label, Button (Newsreader y Zalando Sans).

## Correspondencia Figma ↔ código
| Figma | React / CSS |
|---|---|
| `Button` (Variante: Primario, Acento, Contorno · Tamaño: Normal, Pequeño) | `<Cta variante pequeño>` · `.cta`, `.cta--accent`, `.cta--ghost`, `.cta--small` (`src/components/ui`) |
| `NavLink` (Estado: Normal, Activo) | `<NavLink activo>` · `.navlink`, `.is-active` |
| `Tag` | `<Tag>` · `.tag` |
| `EstadoCita` (6 estados) | `<Estado e>` · `.adm-estado--*` (`components/admin/Piezas`) |
| `OptionTile` (Normal, Seleccionado) | `.option`, `.option.is-selected` (`components/sitio/Reserva`) |
| `Campo` (Normal, Error) | `<Campo>` · `.field`, `.field__error` |
| `SpecRow` | `<SpecTable filas>` · `.spec-row` |
| `Indicador` | `.adm-stat` (panel → Resumen) |
| `TarjetaServicio` | `<TarjetaServicio>` (`components/sitio`) |
| Variables `color/*` | `--color-*` en `src/app/globals.css` |
| Estilos de texto | Clases `.t-display`, `.t-title`, `.t-body`, `.t-label`, `.t-button`… |

## Qué se sincroniza y qué no (posibilidades reales)
- **No hay sincronización automática bidireccional.** Cambiar un color o componente en Figma **no** cambia el sitio, y cambiar el código no cambia Figma.
- La aplicación **no depende de Figma**: el código funciona aunque el archivo se borre.
- Flujo recomendado para un cambio visual: 1) diséñelo en Figma usando los componentes; 2) aplique el mismo valor en `globals.css` (los nombres de las variables coinciden con los del CSS) o en el componente React indicado en la tabla; 3) publique.
- Con un plan pago de Figma se puede añadir **Code Connect** (enlaza cada componente de Figma con su archivo React en el modo Dev); no está configurado porque requiere plan Organization/Enterprise.
- Las capturas exactas de lo implementado (todas las pantallas, 375–1440 px) están en `tests/evidencias/capturas/`.
