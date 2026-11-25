# Manual de instalación

Tiempo estimado: 1 a 2 horas la primera vez. No requiere programar; sí seguir los pasos en orden.
Necesita: cuenta de GitHub, cuenta de Vercel, acceso a Supabase (ya existe el proyecto) y la cuenta de Google de la doctora.

## 1. Código en GitHub (su propiedad)
1. Cree un repositorio **privado** en GitHub (por ejemplo `plataforma-dra-montalvo`).
2. Suba el contenido de la carpeta `plataforma/` (GitHub Desktop: *Add existing repository* → *Publish*).
   El archivo `.env.local` NO debe subirse (ya está excluido en `.gitignore`).

## 2. Supabase (base de datos y usuarios)
El proyecto **ya está creado** y con la base de datos aplicada: `dra-montalvo`, región São Paulo, organización «Proyecto Juan Carlos León».
- URL: `https://iokxtudyzmuhjcytwlaq.supabase.co`
- Si alguna vez necesita recrearlo: cree un proyecto nuevo y ejecute, en orden, los 5 archivos de `supabase/migrations/` en *SQL Editor*.

Configuración pendiente en el panel de Supabase:
1. **Authentication → Providers → Email**: deje activo el correo; **desactive «Allow new users to sign up»** (solo se entra por invitación).
2. **Authentication → URL Configuration**: *Site URL* = `https://su-dominio`; *Redirect URLs* = `https://su-dominio/auth/confirmar` (y `http://localhost:3000/auth/confirmar` para pruebas locales).
3. **Authentication → Emails → SMTP** (recomendado): el correo integrado de Supabase está limitado a pocos mensajes por hora. Configure un SMTP propio (por ejemplo, el de Google Workspace o un proveedor gratuito) para invitaciones y recuperación de contraseña.
4. **Project Settings → API Keys**: copie la clave **publicable** (`sb_publishable_…`) y la **secreta** (`sb_secret_…`). La secreta es como una llave maestra: solo va en Vercel y en Apps Script.

### Primer usuario administrador
1. *Authentication → Users → Add user → Send invitation* con el correo de la doctora.
2. En *SQL Editor* ejecute (cambie el correo y el nombre):
   ```sql
   insert into public.administradores (id, email, nombre, rol)
   select id, email, 'Monserrath Montalvo', 'admin' from auth.users where email = 'correo-de-la-doctora@gmail.com';
   ```
3. La doctora abre el correo, crea su contraseña y entra en `https://su-dominio/admin`. Desde ahí invita al resto del personal (*Usuarios*), sin volver a usar SQL.

## 3. Vercel (publicación del sitio)
1. En <https://vercel.com> → *Add New → Project* → importe el repositorio de GitHub. Framework: Next.js (se detecta solo).
2. *Environment Variables* (copie de `.env.example`):
   | Variable | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://iokxtudyzmuhjcytwlaq.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_I5zas__FlxPoWIuR4HYPDg_pFxZFUhX` |
   | `SUPABASE_SECRET_KEY` | la clave secreta de Supabase |
   | `NEXT_PUBLIC_SITIO_URL` | `https://su-dominio` |
   | `APPS_SCRIPT_URL` | (paso 5) |
   | `APPS_SCRIPT_SECRET` | una cadena larga aleatoria (paso 5) |
   | `CONSENTIMIENTO_VERSION` | `2026-11` |
3. *Deploy*. Al terminar, el sitio queda en `https://<proyecto>.vercel.app`.
4. Cada vez que suba cambios a GitHub, Vercel publica una nueva versión automáticamente (y puede volver a la anterior con un clic en *Deployments → Promote*).

## 4. Dominio
1. Compre el dominio (por ejemplo `dramonserrathmontalvo.com` o un `.ec`).
2. Vercel → *Project → Settings → Domains* → agregue el dominio y siga las instrucciones de DNS (registro A o CNAME). HTTPS se activa solo.
3. Actualice `NEXT_PUBLIC_SITIO_URL` en Vercel y las URLs del paso 2.2 en Supabase. Vuelva a desplegar.

## 5. Google Calendar y correos (Apps Script)
Siga [apps-script/README.md](../apps-script/README.md). Al final tendrá la URL `…/exec` para `APPS_SCRIPT_URL` y el secreto compartido. Cárguelos en Vercel y vuelva a desplegar.

## 6. SEO y Google
1. [Google Search Console](https://search.google.com/search-console): agregue el dominio y envíe `https://su-dominio/sitemap.xml`.
2. [Perfil de Empresa en Google](https://business.google.com): cree o verifique el perfil con la **misma** dirección, teléfono y horarios del panel, y enlace al sitio y a `/agendar`.

## 7. Verificación final
Ejecute la lista de [tests/README.md](../tests/README.md) («Tras el despliegue»). Debe ver: una reserva de prueba en el panel, el evento en el calendario de la doctora en menos de 5 minutos y el correo de confirmación.
