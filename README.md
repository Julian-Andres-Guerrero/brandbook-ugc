# Brandbook UGC

Plataforma web multiusuario para creadores de contenido UGC:

- **Perfil público** tipo link en bio + portafolio en `/@usuario`, bilingüe inglés/español, pensado primero para celular.
- **Panel privado** por usuario para registrar productos recibidos, valor comercial, pagos en efectivo y **facturas adjuntas**, con totales por año y plataforma, resumen fiscal imprimible y exportación CSV/JSON.

Autor: **Julian Andres Guerrero Vasquez**, ingeniero de sistemas y creador UGC.

| Capa | Tecnología |
| --- | --- |
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS 4 + React Router |
| Backend | Supabase: Postgres con Row Level Security, Auth (email + contraseña, TOTP 2FA), Storage y Edge Functions |
| Hosting | Cloudflare Workers con archivos estáticos (gratis), desplegado desde GitHub |
| Pruebas | Vitest (lógica del panel) y pruebas SQL de seguridad RLS |

---

## Índice

1. [Estructura del proyecto](#estructura-del-proyecto)
2. [Correr el proyecto en tu PC](#correr-el-proyecto-en-tu-pc)
3. [Conectar Supabase (producción)](#conectar-supabase-producción)
4. [Desplegar en Cloudflare desde GitHub](#desplegar-en-cloudflare-desde-github)
5. [Cargar tu perfil y tus registros reales](#cargar-tu-perfil-y-tus-registros-reales)
6. [Cómo queda protegido el panel](#cómo-queda-protegido-el-panel)
7. [Regla de cuentas inactivas](#regla-de-cuentas-inactivas)
8. [Cómo agregar campañas nuevas a un perfil](#cómo-agregar-campañas-nuevas-a-un-perfil)
9. [Legal y cumplimiento](#legal-y-cumplimiento)
10. [Límites del plan gratuito](#límites-del-plan-gratuito)
11. [Cifrado adicional por campo (evaluación)](#cifrado-adicional-por-campo-evaluación)

---

## Estructura del proyecto

```
brandbook-ugc/
├── public/
│   ├── _headers          # Cabeceras de seguridad (CSP, HSTS, noindex del panel) para Cloudflare
│   └── robots.txt        # El panel y el login no se indexan
├── src/
│   ├── config.ts         # Nombre de la plataforma, correo legal, límites de archivos
│   ├── lib/              # Cliente Supabase, sesión, i18n, cookies, lógica pura del panel (+ pruebas)
│   ├── components/       # UI, layout, banner de cookies, íconos
│   └── pages/
│       ├── public/       # Inicio, perfil /@usuario, 404
│       ├── auth/         # Entrar (con 2FA), registro, recuperar contraseña
│       ├── panel/        # Resumen, registros, factura, resumen fiscal, campañas, perfil, cuenta
│       └── legal/        # Términos, privacidad, cookies, contenido/DMCA (EN/ES)
├── supabase/
│   ├── config.toml       # Configuración local (contraseñas, rate limiting, 2FA)
│   ├── migrations/       # Esquema, RLS, Storage, auditoría y regla de inactividad
│   ├── seed/             # Usuario local de prueba + tus datos reales
│   ├── functions/inactivity-sweeper/  # Edge Function diaria (aviso y borrado por inactividad)
│   └── tests/            # Pruebas de seguridad RLS
└── scripts/test-db.sh    # Corre las pruebas RLS en un Postgres sin Docker
```

---

## Correr el proyecto en tu PC

Requisitos: **Node.js 20+** y **Docker Desktop** (para el Supabase local).

```bash
npm install
npx supabase start          # levanta Postgres, Auth y Storage en Docker (la primera vez tarda)
npx supabase db reset       # aplica migraciones y carga los datos de ejemplo
```

`supabase start` imprime una `API URL` y una `anon key`. Copia `.env.example` como `.env.local` y pégalas:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<anon key que te mostró supabase start>
VITE_SITE_URL=http://localhost:5173
```

```bash
npm run dev
```

- Perfil público: http://localhost:5173/@julianguerrero
- Panel: http://localhost:5173/entrar con el usuario **local** `julian@local.test` y la contraseña `LocalDev2026!` (solo existe en tu Docker; nunca en producción).
- Correos locales (confirmación, recuperar contraseña): http://localhost:54324 (Mailpit).

Otros comandos:

| Comando | Qué hace |
| --- | --- |
| `npm run build` | Compila TypeScript y genera `dist/` |
| `npm test` | Pruebas de la lógica del panel (totales, filtros, pendientes, CSV) |
| `npm run test:db` | Pruebas de seguridad RLS (necesita `psql` y un Postgres; ver el script) |
| `npm run lint` | Revisión de código con oxlint |

---

## Conectar Supabase (producción)

1. Crea un proyecto en [supabase.com](https://supabase.com) (plan Free). Elige una región cercana (por ejemplo `East US`).
2. Instala la CLI y enlaza el proyecto (te pide el *database password*, no lo guardes en el código):
   ```bash
   npx supabase login
   npx supabase link --project-ref <tu-project-ref>
   npx supabase db push        # crea tablas, RLS, buckets y funciones
   ```
3. **Authentication > URL Configuration**: `Site URL` = tu dominio (ej. `https://brandbook-ugc.pages.dev`) y agrega `https://tu-dominio/**` en *Redirect URLs*.
4. **Authentication > Providers > Email**: activa *Confirm email*.
5. **Authentication > Sign In / Providers > Password**: longitud mínima 10 y *lowercase, uppercase and digits*. Activa *Leaked password protection* si tu plan lo permite.
6. **Authentication > Multi-Factor**: activa **TOTP** (2FA con app de autenticación).
7. **Authentication > Rate Limits**: revisa los límites de inicio de sesión por IP. Para más protección activa **CAPTCHA** con Cloudflare Turnstile (Authentication > Attack Protection).
8. **Authentication > Emails > SMTP**: configura un SMTP propio (por ejemplo Resend) para que los correos de confirmación y recuperación no tengan el límite del correo de prueba de Supabase.
9. **Project Settings > API**: copia `Project URL` y `anon public key`. Son las únicas claves que usa el frontend. La `service_role` **nunca** va en el frontend ni en GitHub.

Los buckets `invoices` (privado, 10 MB, PDF/JPG/PNG/WebP) y `avatars` (público, 2 MB) los crea la migración.

---

## Desplegar en Cloudflare desde GitHub

El proyecto se despliega como **Cloudflare Worker con archivos estáticos** (plan Free), configurado en `wrangler.jsonc`.

1. En Cloudflare: **Workers & Pages > Create > Import a repository** y elige `brandbook-ugc`.
2. Build command: `npm run build` · Deploy command: `npx wrangler deploy`.
3. En **Advanced settings > Build variables** (se usan al compilar):
   - `VITE_SUPABASE_URL` = Project URL de Supabase
   - `VITE_SUPABASE_ANON_KEY` = publishable/anon key
   - `VITE_SITE_URL` = opcional; si lo dejas vacío usa la dirección actual del sitio
   - `VITE_CF_ANALYTICS_TOKEN` = opcional (solo se carga si el visitante acepta)
4. Deploy. Cada `git push` a `main` vuelve a publicar. La dirección será `https://brandbook-ugc.<tu-subdominio>.workers.dev`.
5. En Supabase > Authentication > URL Configuration pon esa dirección como `Site URL` y agrega `https://<esa-direccion>/**` en Redirect URLs.

`wrangler.jsonc` activa el modo SPA (`/@usuario` y el panel funcionan al recargar) y `public/_headers` agrega HSTS, CSP, anti-clickjacking y `noindex` para el panel.

## Cargar tu perfil y tus registros reales

En producción:

1. Entra a `/registro` y crea tu cuenta con tu usuario (el de Julian es **`julianguerrero`**; si usas otro, cámbialo en la línea `v_username` del script). Confirma tu correo.
2. En Supabase, abre **SQL Editor**, pega el contenido de `supabase/seed/10_julian_data.sql` y ejecútalo.

Eso carga tu perfil (nichos, servicios, redes, contacto), las 5 campañas públicas con sus videos y los 3 registros privados del panel. El script busca tu cuenta por el nombre de usuario y no duplica los registros si lo corres dos veces.

**No** ejecutes `seed/00_local_user.sql` en producción: crea un usuario de prueba con contraseña conocida y solo sirve para Docker.

---

## Cómo queda protegido el panel

La seguridad no depende de la interfaz. La impone la base de datos en cada consulta.

| Medida | Dónde está |
| --- | --- |
| **HTTPS/TLS** en todo | Cloudflare y Supabase solo sirven HTTPS. `_headers` agrega HSTS y `upgrade-insecure-requests`. |
| **Cifrado en reposo AES-256** | Supabase cifra la base de datos, los respaldos y Storage por defecto. |
| **Contraseñas con hash** (bcrypt) | Supabase Auth. Nadie puede ver una contraseña, ni el dueño de la plataforma. |
| **Row Level Security** | `supabase/migrations/*_init.sql`: cada tabla tiene políticas `user_id = auth.uid()`. Si alguien llama la API directamente con el id de otro usuario, Postgres devuelve 0 filas o un error. |
| **Separación público/privado** | Tablas públicas (`profiles`, `social_links`, `campaigns`, `campaign_videos`) y privadas (`product_records`, `audit_log`). Al rol anónimo se le quitó hasta el `GRANT` sobre las privadas. |
| **Facturas privadas** | Bucket `invoices` privado. Cada archivo vive en `<user_id>/...` y las políticas de Storage solo permiten al dueño. Se abren con un **enlace firmado de 60 segundos**. |
| **2FA (TOTP)** | Opcional por usuario. Si está activo, una política *restrictiva* exige sesión `aal2` para leer registros y facturas. |
| **Rate limiting** | Límite de intentos por IP en Supabase Auth (`config.toml` y panel), más un freno de 5 intentos en el navegador. |
| **Cerrar otras sesiones** | Cuenta y seguridad > *Cerrar sesión en otros dispositivos*. También al cambiar la contraseña desde el enlace de recuperación. |
| **Auditoría** | Triggers registran creaciones, ediciones (solo los nombres de los campos, nunca los valores) y borrados. Los inicios de sesión y exportaciones también quedan. El usuario ve su historial y no puede modificarlo. |
| **Secretos fuera del código** | Solo variables de entorno. `.env*` está en `.gitignore`. |
| **noindex** | Meta `robots`, `X-Robots-Tag` y `robots.txt` para `/panel`, `/entrar`, etc. |
| **Respaldos** | Supabase hace respaldos cifrados de la base de datos (en el plan Pro se pueden restaurar 7 días). En Free conviene sacar un respaldo propio con `npx supabase db dump -f respaldo.sql` y guardarlo cifrado. Además cada usuario puede exportar su respaldo JSON. |

Las pruebas en `supabase/tests/rls.test.sql` lo comprueban: un visitante anónimo no puede leer registros, otra usuaria no ve, edita, borra ni sube facturas a la carpeta de Julian, el 2FA bloquea sesiones `aal1`, un perfil privado desaparece, y eliminar una cuenta borra todo en cascada.

```bash
# Con Docker y la CLI de Supabase:
npx supabase db reset && psql "$(npx supabase status -o env | grep DB_URL | cut -d= -f2- | tr -d '"')" -f supabase/tests/rls.test.sql
# Sin Docker, con cualquier Postgres 15+ local:
PGHOST=localhost PGUSER=postgres npm run test:db
```

---

## Regla de cuentas inactivas

- **60 días** sin actividad (iniciar sesión o usar el panel): se envía un aviso por correo.
- **10 días** después del aviso, si sigue sin actividad: se borran la cuenta, el perfil, las campañas, los registros, las facturas y el historial. Es irreversible.
- Iniciar sesión cancela el proceso.

La regla está en `supabase/migrations/*_inactivity.sql` y la ejecuta la Edge Function `inactivity-sweeper` una vez al día. Para activarla en producción:

1. Crea una cuenta gratis en [Resend](https://resend.com) y verifica tu dominio de envío.
2. Configura los secretos (nunca en el código):
   ```bash
   npx supabase secrets set CRON_SECRET=<una-clave-larga-aleatoria> RESEND_API_KEY=<tu-key> \
     MAIL_FROM="Brandbook UGC <no-reply@tudominio.com>" SITE_URL=https://tudominio.com
   npx supabase functions deploy inactivity-sweeper
   ```
3. Prueba sin enviar ni borrar nada: `npx supabase secrets set DRY_RUN=true` y llama la función una vez. Revisa el reporte y luego quita `DRY_RUN`.
4. Programa la ejecución diaria en **Integrations > Cron** de Supabase (activa `pg_cron` y `pg_net`). Crea un job HTTP diario, por ejemplo a las 09:00 UTC, que haga `POST` a `https://<project-ref>.supabase.co/functions/v1/inactivity-sweeper` con el header `x-cron-secret: <CRON_SECRET>`. El valor del secreto se guarda en Vault desde la misma pantalla y no en una migración.

---

## Cómo agregar campañas nuevas a un perfil

Desde el panel, sin tocar código:

1. Entra y ve a **Campañas públicas > + Nueva campaña**.
2. Llena marca, título en inglés (y en español si quieres), estado (*En curso / Publicada / Completada*) y la plataforma por la que llegó (*Vía*).
3. Agrega uno o más links de video. La red (TikTok, Instagram, YouTube…) se detecta sola por la URL.
4. Guarda. Aparece al instante en `/@tu-usuario`. Con las flechas ↑ ↓ cambias el orden y con *Visible en mi perfil* la ocultas sin borrarla.

Los montos de esa campaña van aparte, en **Registros**, que nunca se muestran en público.

---

## Legal y cumplimiento

- Páginas en inglés y español, enlazadas en el pie de página: `/legal/terminos`, `/legal/privacidad`, `/legal/cookies`, `/legal/contenido` (licencia de exhibición y procedimiento DMCA).
- Banner de cookies: la analítica (Cloudflare Web Analytics) no se carga hasta que el visitante acepta. Se puede rechazar y cambiar desde *Preferencias de cookies*. Los videos se enlazan y no se incrustan, así que no hay cookies de terceros.
- Derechos del usuario (GDPR, CCPA/CPRA, Ley 1581 de 2012): ver, corregir, exportar (JSON/CSV) y eliminar la cuenta desde el panel.
- Registro solo para mayores de 18 años, con casilla obligatoria y aceptación de Términos.
- Accesibilidad (WCAG 2.1 AA): contraste verificado en el tema oscuro, foco visible, enlace "saltar al contenido", etiquetas en todos los campos y textos alternativos.
- El sitio dice que está construido **alineado** con ISO/IEC 27001, 27701 y WCAG, y nunca que está certificado.
- Los textos legales son una plantilla redactada para esta plataforma. Conviene que un abogado los revise antes de operar comercialmente. El nombre y el correo legal se cambian en `src/config.ts`.

---

## Límites del plan gratuito

| Servicio | Límite Free | Cómo lo maneja la app |
| --- | --- | --- |
| Supabase base de datos | 500 MB | Los registros pesan muy poco: caben decenas de miles. |
| Supabase Storage | 1 GB en total, hasta 50 MB por archivo | Límite de **10 MB por factura** (visible en la interfaz). Las fotos más grandes se reducen solas en el navegador antes de subir. Un PDF grande muestra un mensaje claro. |
| Supabase pausa | Proyecto pausado tras 7 días sin uso | Se reactiva desde el panel de Supabase. |
| Cloudflare Pages | 500 builds/mes, ancho de banda sin límite | Suficiente. |
| Resend | 3.000 correos/mes | Suficiente para avisos y recuperación de contraseña. |

---

## Cifrado adicional por campo (evaluación)

Además del cifrado en reposo de Supabase, se evaluó cifrar en el navegador los campos más sensibles (notas y montos) con una clave que solo conoce el usuario.

- **Ventaja:** ni siquiera alguien con acceso a la base de datos podría leer esos campos.
- **Contrapartida:** si el usuario pierde su clave, esos datos **no se pueden recuperar**, y los totales, filtros y exportaciones solo funcionarían en el navegador después de desbloquear.

La versión 1 no lo incluye, porque la combinación de RLS, cifrado en reposo, TLS, 2FA y facturas con enlaces firmados ya protege bien los datos, y perder la clave borraría soportes fiscales. Si se activa más adelante, el lugar natural es `src/lib/` con Web Crypto (AES-GCM y una clave derivada con PBKDF2), guardando el texto cifrado en columnas nuevas.
