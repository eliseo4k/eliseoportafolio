# Portafolio · Eliseo JRM

Web de currículum y portafolio en **HTML, CSS y JavaScript puros** (sin frameworks), bilingüe (ES en `/`, EN en `/en/`), con SEO técnico y un panel admin.

## Estructura

```
index.html            Página en español (generada, no la edites a mano)
en/index.html         Página en inglés (generada)
data/content.json     TODO el contenido: textos, servicios, skills, proyectos, FAQ, contacto
css/                  tokens (colores/tipos) · base · sections · components · responsive
js/render.js          Convierte content.json en HTML (lo usan el navegador y Node)
js/app.js ui.js fx.js Arranque, menú/filtros/modal/formulario, efectos
templates/page.html   Plantilla de la página
tools/prerender.mjs   Genera index.html, en/index.html, sitemap.xml, robots.txt y manifest
admin/                Panel para crear y editar contenido
assets/img            Foto, favicon, imagen para redes (og-image)
assets/projects       Portadas de ejemplo de los proyectos (reemplázalas)
server.js             Servidor opcional para que el admin guarde directo (sin dependencias)
```

## Cómo editar el contenido

**Opción A, sin servidor (hosting estático):** abre `/admin/`, edita, pulsa *Descargar content.json*, reemplaza `data/content.json` y súbelo. La web se actualiza sola al cargar.
Para dejar también el HTML estático al día (mejor para Google): `node tools/prerender.mjs`.

**Opción B, con servidor Node (VPS, Render, Railway…):**
```
ADMIN_PASSWORD="una-clave-larga" node server.js
```
Entra a `http://localhost:3000/admin/`, edita y pulsa *Guardar en el sitio*: guarda, hace copia de seguridad en `data/backups/` y regenera el HTML. Las imágenes subidas quedan en `assets/uploads/`.

> En hosting estático el admin es público pero **no puede modificar el sitio** (solo descarga un archivo). Está en `noindex` y bloqueado en `robots.txt`.

## Antes de publicar (SEO)

1. En el admin → *General y SEO* → **Dominio del sitio** (hoy es `https://tu-dominio.com`). Luego ejecuta `node tools/prerender.mjs` para actualizar canonical, hreflang, sitemap y datos estructurados.
2. Reemplaza los proyectos de ejemplo por tus trabajos reales (imágenes 1200×800 en `.webp`, menos de 150 KB cada una).
3. Cambia `assets/img/eliseo.webp` por una foto tuya de mejor resolución si tienes.
4. Sube el sitio a Netlify, Cloudflare Pages, Vercel o GitHub Pages y conecta tu dominio (HTTPS).
5. En Google Search Console: añade tu dominio y envía `https://tudominio.com/sitemap.xml`.
6. Opcional: crea un perfil de LinkedIn/Behance y añádelos en *Redes sociales* para reforzar la señal de identidad.

## Formulario de contacto

Sin configurar nada, abre el correo del visitante con el mensaje listo. Para recibir mensajes directos, crea un formulario gratis en formspree.io y pega su URL en el admin (*Formulario: URL de Formspree*).
