/* admin.js — editor del contenido (data/content.json).
   Funciona de dos formas, detectadas solas:
   · Sin servidor (hosting estático / abriendo local): edita, previsualiza y DESCARGA content.json.
   · Con servidor (node server.js): además GUARDA directo en el sitio y sube imágenes. */

const $ = (s, r = document) => r.querySelector(s);
const DRAFT = 'ejrm-draft';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const get = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
const set = (o, p, v) => { const ks = p.split('.'); let c = o; for (let i = 0; i < ks.length - 1; i++) c = c[ks[i]] ??= {}; c[ks[ks.length - 1]] = v; };
const tr = (v) => (v == null ? '' : typeof v === 'string' ? v : v.es ?? '');

let data = null, original = '', serverMode = false, token = '';
try { token = sessionStorage.getItem('ejrm-token') || ''; } catch (_) {}
let tab = 'general';
const openItems = new Set();
const BLANK = {}, TITLE = {};

/* ---------- Esquema: define qué se puede editar ---------- */
const i18n = (k, label, area) => ({ k, t: area ? 'i18na' : 'i18n', label });
const txt = (k, label, hint) => ({ k, t: 'text', label, hint });
const ICONS = ['brand', 'social', 'video', 'web', 'code', 'game', 'spark'];
const CODES = ['Ps', 'Ai', 'Id', 'Xd', 'Pr', 'Ae', 'Lr', 'Au'];
const CATS = ['branding', 'social', 'video', 'web', 'ai'];
const blankI18n = () => ({ es: '', en: '' });

const TABS = [
  { id: 'general', label: 'General y SEO', intro: 'Datos de contacto, dominio y textos que ve Google.', groups: [
    { title: 'Datos principales', fields: [
      txt('settings.siteUrl', 'Dominio del sitio', 'Con https://, sin barra final. Ej: https://eliseojrm.com. Importante para SEO (canonical y sitemap).'),
      txt('settings.brand', 'Nombre corto (logo)'), txt('settings.name', 'Nombre completo'),
      txt('settings.email', 'Correo'), txt('settings.phone', 'Teléfono (como se muestra)'),
      txt('settings.whatsapp', 'WhatsApp (solo números con código de país)', 'Ej: 584149809111'),
      txt('settings.formEndpoint', 'Formulario: URL de Formspree (opcional)', 'Si lo dejas vacío, el formulario abre el correo del visitante con el mensaje listo.'),
      { k: 'settings.available', t: 'bool', label: 'Mostrar "Disponible para nuevos proyectos"' },
      i18n('settings.location', 'Ubicación'),
      { k: 'settings.photo', t: 'img', label: 'Foto de perfil (cuadrada, mejor con fondo transparente)' }
    ] },
    { title: 'Redes sociales', fields: [txt('settings.socials.instagram', 'Instagram (URL)'), txt('settings.socials.tiktok', 'TikTok (URL)'), txt('settings.socials.facebook', 'Facebook (URL)')] },
    { title: 'SEO (lo que aparece en Google)', fields: [
      i18n('seo.title', 'Título (ideal: 50–60 caracteres)'), i18n('seo.description', 'Descripción (ideal: 140–160 caracteres)', true)
    ] }
  ] },
  { id: 'hero', label: 'Portada', intro: 'Lo primero que se ve al entrar.', groups: [
    { title: 'Portada', fields: [
      i18n('hero.greeting', 'Saludo (etiqueta pequeña)'), i18n('hero.title', 'Título principal (H1, importante para SEO)', true),
      i18n('hero.text', 'Texto de apoyo', true), i18n('hero.availableText', 'Texto de disponibilidad'),
      i18n('hero.tag', 'Rol (tarjeta de código)'), i18n('hero.years', 'Años de experiencia (tarjeta de código)')
    ] }
  ] },
  { id: 'about', label: 'Sobre mí', intro: 'Presentación, puntos fuertes y números.', groups: [
    { title: 'Texto', fields: [i18n('about.title', 'Título'), i18n('about.text', 'Texto', true),
      { k: 'about.points', t: 'list', of: 'i18n', label: 'Puntos fuertes', add: 'Añadir punto', blank: blankI18n, title: (x) => tr(x) }] },
    { title: 'Estadísticas', fields: [{ k: 'stats', t: 'list', label: 'Números', add: 'Añadir número', blank: () => ({ value: 0, suffix: '', label: blankI18n() }),
      title: (x) => `${x.value}${x.suffix} ${tr(x.label)}`, fields: [{ k: 'value', t: 'number', label: 'Valor' }, txt('suffix', 'Sufijo (ej: +)'), i18n('label', 'Etiqueta')] }] }
  ] },
  { id: 'services', label: 'Servicios', intro: 'Lo que ofreces a agencias y clientes.', groups: [
    { title: 'Servicios', fields: [{ k: 'services', t: 'list', label: 'Lista de servicios', add: 'Añadir servicio',
      blank: () => ({ id: 'nuevo-' + Date.now().toString(36), icon: 'spark', title: blankI18n(), text: blankI18n(), tools: [] }), title: (x) => tr(x.title),
      fields: [txt('id', 'ID (sin espacios)'), { k: 'icon', t: 'select', label: 'Icono', opts: ICONS }, i18n('title', 'Título'), i18n('text', 'Descripción', true),
        { k: 'tools', t: 'tags', label: 'Herramientas (separadas por coma)', hint: 'Ps, Ai, Id, Xd, Pr, Ae, Lr, Au, HTML, CSS, JS, DB' }] }] }
  ] },
  { id: 'skills', label: 'Skills', intro: 'Herramientas y niveles.', groups: [
    { title: 'Herramientas Adobe', fields: [{ k: 'skills.adobe', t: 'list', label: 'Barras de nivel', add: 'Añadir herramienta', blank: () => ({ code: 'Fg', name: '', level: 'Alto', color: '#a78bfa', bg: '#1a1a40' }),
      title: (x) => `${x.code} · ${x.name} · ${x.level}`,
      fields: [txt('code', 'Icono (1 a 3 letras)', 'Ej: Ps, Ai, Fg para Figma, Cv para Canva, Bl para Blender, Cc para CapCut'), txt('name', 'Nombre de la herramienta'),
        { k: 'level', t: 'select', label: 'Nivel', opts: ['Bajo', 'Medio', 'Alto', 'Avanzado'] },
        { k: 'color', t: 'color', label: 'Color de las letras', def: '#a78bfa' }, { k: 'bg', t: 'color', label: 'Color de fondo del icono', def: '#1a1a40' }] }] },
    { title: 'IA y código', fields: [i18n('skills.aiTitle', 'Título'), i18n('skills.aiText', 'Texto', true),
      { k: 'skills.ai', t: 'list', of: 'i18n', label: 'Etiquetas', add: 'Añadir etiqueta', blank: blankI18n, title: (x) => tr(x) }] }
  ] },
  { id: 'experience', label: 'Experiencia', intro: 'Agencias y empresas, y tu formación.', groups: [
    { title: 'Experiencia', fields: [{ k: 'experience', t: 'list', label: 'Empresas', add: 'Añadir empresa', blank: () => ({ company: '', place: blankI18n(), role: blankI18n() }),
      title: (x) => x.company, fields: [txt('company', 'Empresa'), i18n('place', 'País / lugar'), i18n('role', 'Cargo')] }] },
    { title: 'Formación', fields: [{ k: 'education', t: 'list', label: 'Estudios', add: 'Añadir estudio', blank: () => ({ title: blankI18n(), place: blankI18n() }),
      title: (x) => tr(x.title), fields: [i18n('title', 'Título'), i18n('place', 'Institución')] }] }
  ] },
  { id: 'projects', label: 'Proyectos', intro: 'Tu portafolio. Sustituye los ejemplos por tus trabajos reales.', groups: [
    { title: 'Proyectos', fields: [{ k: 'projects', t: 'list', label: 'Lista de proyectos', add: 'Añadir proyecto',
      blank: () => ({ id: 'proyecto-' + Date.now().toString(36), category: 'branding', cover: '', url: '', title: blankI18n(), desc: blankI18n(), tags: [], images: [] }),
      title: (x) => tr(x.title) || x.id,
      fields: [txt('id', 'ID (sin espacios ni tildes)'), { k: 'category', t: 'select', label: 'Categoría', opts: CATS },
        i18n('title', 'Título'), i18n('desc', 'Descripción', true),
        { k: 'cover', t: 'img', label: 'Imagen de portada (cualquier proporción: vertical, horizontal o cuadrada; se muestra completa)' },
        { k: 'images', t: 'gallery', label: 'Galería (se ve al abrir el proyecto)', hint: 'La portada ya se muestra primero en la galería: aquí añade solo las demás imágenes.' },
        txt('url', 'Enlace al proyecto (opcional)'), { k: 'tags', t: 'tags', label: 'Etiquetas (separadas por coma)' }] }] }
  ] },
  { id: 'process', label: 'Proceso y FAQ', intro: 'Cómo trabajas y preguntas frecuentes (también ayudan al SEO).', groups: [
    { title: 'Proceso', fields: [{ k: 'process', t: 'list', label: 'Pasos', add: 'Añadir paso', blank: () => ({ title: blankI18n(), text: blankI18n() }),
      title: (x) => tr(x.title), fields: [i18n('title', 'Título'), i18n('text', 'Texto', true)] }] },
    { title: 'Preguntas frecuentes', fields: [{ k: 'faq', t: 'list', label: 'Preguntas', add: 'Añadir pregunta', blank: () => ({ q: blankI18n(), a: blankI18n() }),
      title: (x) => tr(x.q), fields: [i18n('q', 'Pregunta'), i18n('a', 'Respuesta', true)] }] }
  ] }
];

/* ---------- Pintado de campos ---------- */
function field(f, path) {
  const v = get(data, path);
  const label = f.label ? `<span>${esc(f.label)}</span>` : '';
  const hint = f.hint ? `<small>${esc(f.hint)}</small>` : '';
  switch (f.t) {
    case 'text': return `<label class="f">${label}<input type="text" data-path="${path}" value="${esc(v)}">${hint}</label>`;
    case 'number': return `<label class="f">${label}<input type="number" data-path="${path}" data-kind="number" value="${esc(v)}"></label>`;
    case 'bool': return `<label class="f f--check"><input type="checkbox" data-path="${path}" data-kind="bool" ${v ? 'checked' : ''}><span>${esc(f.label)}</span></label>`;
    case 'color': return `<label class="f f--color">${label}<input type="color" data-path="${path}" value="${esc(v || f.def || '#a78bfa')}"></label>`;
    case 'select': return `<label class="f">${label}<select data-path="${path}">${f.opts.map((o) => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`;
    case 'tags': return `<label class="f">${label}<input type="text" data-path="${path}" data-kind="tags" value="${esc((v || []).join(', '))}">${hint}</label>`;
    case 'i18n': case 'i18na': {
      const el = (l) => f.t === 'i18na'
        ? `<textarea data-path="${path}.${l}">${esc(v?.[l])}</textarea>` : `<input type="text" data-path="${path}.${l}" value="${esc(v?.[l])}">`;
      return `<div class="f">${label}<div class="two"><div><span class="lg">Español</span>${el('es')}</div><div><span class="lg">English</span>${el('en')}</div></div></div>`;
    }
    case 'img': return `<div class="f">${label}<div class="imgf" data-drop="${path}">
      <div class="imgf__prev"><span class="imgf__empty">Sin imagen</span>${v ? `<img src="${esc(imgSrc(v))}" alt="" data-prev="${path}" onerror="this.style.visibility='hidden'" onload="this.style.visibility='visible'">` : ''}</div>
      <div class="imgf__side">
        <div class="imgf__btns">
          <label class="btn btn--sm">${v ? 'Cambiar imagen' : 'Subir imagen'}<input type="file" accept="image/*" hidden data-upload="${path}"></label>
          ${v ? `<button type="button" class="btn btn--ghost btn--sm" data-act="clear" data-path="${path}">Quitar</button>` : ''}
        </div>
        <small>o arrastra una imagen hasta aquí</small>
        <details class="imgf__path"><summary>Ruta del archivo</summary>
          <input type="text" data-path="${path}" data-kind="img" value="${esc(v)}" placeholder="assets/projects/mi-imagen.webp"></details>
      </div></div></div>`;
    case 'gallery': return gallery(f, path);
    case 'list': return list(f, path);
  }
  return '';
}
function gallery(f, path) {
  const arr = get(data, path) || [];
  const btn = (act, i, txt, label, cls = '') => `<button type="button" class="${cls}" data-act="${act}" data-keep data-noconfirm data-path="${path}" data-i="${i}" aria-label="${label}">${txt}</button>`;
  const tiles = arr.map((v, i) => `<li class="tile"><img src="${esc(imgSrc(v))}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
    <span class="tile__n">${i + 1}</span>
    <span class="tile__ctl">${i > 0 ? btn('up', i, '←', 'Mover antes') : '<i></i>'}${i < arr.length - 1 ? btn('down', i, '→', 'Mover después') : '<i></i>'}${btn('del', i, '✕', 'Quitar imagen', 'is-del')}</span></li>`).join('');
  return `<div class="f">${f.label ? `<span>${esc(f.label)}</span>` : ''}${f.hint ? `<small>${esc(f.hint)}</small>` : ''}
    <label class="drop" data-drop="${path}" data-multi>
      <input type="file" accept="image/*" multiple hidden data-upload-multi="${path}">
      <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3"/></svg>
      <strong>Arrastra tus imágenes aquí</strong><span>o haz clic para elegir varias a la vez</span>
    </label>
    ${arr.length ? `<ul class="tiles">${tiles}</ul><small>${arr.length} ${arr.length === 1 ? 'imagen' : 'imágenes'} · el orden de aquí es el de la galería. Usa ← → para reordenar.</small>` : ''}</div>`;
}
const imgSrc = (v) => (/^(https?:|data:|\/)/.test(v || '') ? v : '../' + (v || ''));

function fieldsAt(fields, base) { return fields.map((f) => field(f, base ? `${base}.${f.k}` : f.k)).join(''); }

function list(f, path) {
  BLANK[path] = f.blank; TITLE[path] = f.title;
  const arr = get(data, path) || [];
  const items = arr.map((it, i) => {
    const p = `${path}.${i}`;
    const body = f.of === 'i18n' ? field({ t: 'i18n' }, p) : f.of === 'img' ? field({ t: 'img' }, p) : fieldsAt(f.fields, p);
    return `<details class="item" data-p="${p}" data-lp="${path}" ${openItems.has(p) ? 'open' : ''}>
      <summary><span class="item__t">${esc(f.title(it, i) || '(sin título)')}</span>
        <span class="ctl"><button type="button" class="btn btn--ghost btn--sm" data-act="up" data-path="${path}" data-i="${i}" aria-label="Subir">↑</button>
        <button type="button" class="btn btn--ghost btn--sm" data-act="down" data-path="${path}" data-i="${i}" aria-label="Bajar">↓</button>
        <button type="button" class="btn btn--danger btn--sm" data-act="del" data-path="${path}" data-i="${i}" aria-label="Eliminar">✕</button></span></summary>
      <div class="item__body">${body}</div></details>`;
  }).join('');
  return `<div class="f">${f.label ? `<span>${esc(f.label)}</span>` : ''}<div class="list">${items}</div>
    <button type="button" class="btn btn--ghost btn--sm add" data-act="add" data-path="${path}">+ ${esc(f.add || 'Añadir')}</button></div>`;
}

function renderPanel() {
  const t = TABS.find((x) => x.id === tab);
  const note = serverMode
    ? '<p class="note">Modo servidor: el botón <b>Guardar en el sitio</b> publica los cambios y regenera el HTML para Google.</p>'
    : '<p class="note">Modo sin servidor: tus cambios se guardan en este navegador. Cuando termines, pulsa <b>Descargar content.json</b>, reemplaza el archivo <code>data/content.json</code> de tu sitio y listo (la web se actualiza sola). Para el SEO óptimo, ejecuta además <code>node tools/prerender.mjs</code>.</p>';
  $('#panel').innerHTML = `<h2>${esc(t.label)}</h2><p style="margin:0;color:var(--muted)">${esc(t.intro)}</p>${note}` +
    t.groups.map((g) => `<section class="group"><h3>${esc(g.title)}</h3>${fieldsAt(g.fields, '')}</section>`).join('');
  $('#tabs').innerHTML = TABS.map((x) => `<button type="button" data-tab="${x.id}" ${x.id === tab ? 'aria-current="true"' : ''}>${esc(x.label)}</button>`).join('');
}

/* ---------- Estado, borrador y avisos ---------- */
function status() {
  const dirty = JSON.stringify(data, null, 2) !== original;
  const s = $('#status');
  s.textContent = dirty ? 'Cambios sin publicar (borrador guardado en este navegador)' : 'Sin cambios';
  s.classList.toggle('dirty', dirty);
  return dirty;
}
function saveDraft() { try { localStorage.setItem(DRAFT, JSON.stringify(data)); } catch (_) {} status(); }
let toastT;
function toast(msg, err, ms = 3600) { const t = $('#toast'); t.textContent = msg; t.className = 'toast on' + (err ? ' err' : ''); clearTimeout(toastT); toastT = setTimeout(() => (t.className = 'toast'), ms); }

/* ---------- Eventos ---------- */
document.addEventListener('input', (e) => {
  const el = e.target.closest('[data-path]');
  if (!el) return;
  let v = el.value;
  if (el.dataset.kind === 'number') v = Number(v);
  else if (el.dataset.kind === 'bool') v = el.checked;
  else if (el.dataset.kind === 'tags') v = v.split(',').map((s) => s.trim()).filter(Boolean);
  set(data, el.dataset.path, v);
  if (el.dataset.kind === 'img') { const im = document.querySelector(`[data-prev="${el.dataset.path}"]`); if (im) im.src = imgSrc(v); }
  const it = el.closest('.item');
  if (it) { const f = TITLE[it.dataset.lp]; if (f) it.querySelector('.item__t').textContent = f(get(data, it.dataset.p)) || '(sin título)'; }
  saveDraft();
});

document.addEventListener('toggle', (e) => { const d = e.target; if (d.dataset?.p) d.open ? openItems.add(d.dataset.p) : openItems.delete(d.dataset.p); }, true);

document.addEventListener('click', (e) => {
  const tb = e.target.closest('[data-tab]');
  if (tb) { tab = tb.dataset.tab; renderPanel(); window.scrollTo(0, 0); return; }
  const b = e.target.closest('[data-act]');
  if (!b) return;
  e.preventDefault();
  const path = b.dataset.path, arr = get(data, path), i = Number(b.dataset.i);
  if (b.dataset.act === 'clear') { set(data, path, ''); saveDraft(); renderPanel(); return; }
  const keep = b.dataset.keep !== undefined;   // en la galería no se cierra el proyecto abierto
  if (b.dataset.act === 'add') { arr.push(BLANK[path]()); openItems.add(`${path}.${arr.length - 1}`); }
  if (b.dataset.act === 'del') { if (b.dataset.noconfirm === undefined && !confirm('¿Eliminar este elemento?')) return; arr.splice(i, 1); if (!keep) openItems.clear(); }
  if (b.dataset.act === 'up' && i > 0) { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; if (!keep) openItems.clear(); }
  if (b.dataset.act === 'down' && i < arr.length - 1) { [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; if (!keep) openItems.clear(); }
  saveDraft(); renderPanel();
});

/* Subida de imágenes (una o varias): en servidor se guardan como archivo; sin servidor se comprimen e incrustan */
async function addImages(list, path, multi) {
  let files = [...list].filter((f) => /^image\//.test(f.type));
  if (!files.length) return toast('Elige archivos de imagen (JPG, PNG, WEBP…)', true);
  if (multi) files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })); else files = files.slice(0, 1);
  const useServer = serverMode && (await ensureLogin());
  const done = []; let failed = 0, deploying = false, big = false;
  for (let i = 0; i < files.length; i++) {
    toast(files.length > 1 ? `Subiendo imagen ${i + 1} de ${files.length}…` : 'Subiendo imagen…', false, 180000);
    try {
      const dataUrl = await compress(files[i], 1600);
      if (useServer) { const r = await api('/api/upload', { name: files[i].name, dataUrl }); done.push(r.path); deploying = deploying || !!r.deploying; }
      else { done.push(dataUrl); big = big || dataUrl.length > 350000; }
    } catch (err) { failed++; console.warn(files[i].name, err); }
  }
  if (done.length) {
    if (multi) { let arr = get(data, path); if (!Array.isArray(arr)) { arr = []; set(data, path, arr); } arr.push(...done); }
    else set(data, path, done[0]);
    saveDraft(); renderPanel();
  }
  const msg = [done.length ? `${done.length} ${done.length === 1 ? 'imagen lista' : 'imágenes listas'}.` : '',
    failed ? `${failed} no se pudo${failed > 1 ? 'ieron' : ''} procesar.` : '',
    deploying ? 'Aparecerán en la web cuando Vercel termine de publicar (1 o 2 minutos).' : '',
    big ? 'Hay imágenes incrustadas en el archivo: considera subirlas como archivo.' : ''].filter(Boolean).join(' ');
  toast(msg, failed > 0 && !done.length, 5200);
}

document.addEventListener('change', async (e) => {
  const up = e.target.closest('[data-upload], [data-upload-multi]');
  if (!up || !up.files.length) return;
  const multi = up.dataset.uploadMulti !== undefined;
  await addImages(up.files, multi ? up.dataset.uploadMulti : up.dataset.upload, multi);
  up.value = '';
});

/* Arrastrar y soltar */
const dropZone = (e) => e.target.closest?.('[data-drop]');
['dragenter', 'dragover'].forEach((ev) => document.addEventListener(ev, (e) => {
  if (!e.dataTransfer?.types?.includes('Files')) return;
  e.preventDefault();                          // evita que el navegador abra la imagen soltada fuera de la zona
  dropZone(e)?.classList.add('is-over');
}));
document.addEventListener('dragleave', (e) => { const z = dropZone(e); if (z && !z.contains(e.relatedTarget)) z.classList.remove('is-over'); });
document.addEventListener('drop', (e) => {
  if (!e.dataTransfer?.types?.includes('Files')) return;
  e.preventDefault();
  const z = dropZone(e);
  document.querySelectorAll('.is-over').forEach((n) => n.classList.remove('is-over'));
  if (z) addImages(e.dataTransfer.files, z.dataset.drop, z.dataset.multi !== undefined);
});

function compress(file, max) {
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      const webp = c.toDataURL('image/webp', 0.84);
      res(webp.startsWith('data:image/webp') ? webp : c.toDataURL('image/jpeg', 0.86));
    };
    img.onerror = () => rej(new Error('formato no válido'));
    img.src = url;
  });
}

/* ---------- Servidor opcional ---------- */
async function api(url, body) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { if (r.status === 401) { token = ''; try { sessionStorage.removeItem('ejrm-token'); } catch (_) {} } throw new Error(j.error || r.status); }
  return j;
}
function ensureLogin() {
  if (token) return Promise.resolve(true);
  return new Promise((resolve) => {
    const box = $('#login'), form = $('#loginForm');
    box.hidden = false; $('#loginPass').focus();
    const done = (ok) => { box.hidden = true; form.onsubmit = null; $('#loginCancel').onclick = null; resolve(ok); };
    $('#loginCancel').onclick = () => done(false);
    form.onsubmit = async (e) => {
      e.preventDefault();
      try {
        const r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: $('#loginPass').value }) });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Contraseña incorrecta');
        token = j.token; try { sessionStorage.setItem('ejrm-token', token); } catch (_) {}
        $('#loginPass').value = ''; done(true);
      } catch (err) { toast(err.message, true); }
    };
  });
}

function download() {
  const blob = new Blob([JSON.stringify(data, null, 2) + '\n'], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'content.json' });
  a.click(); URL.revokeObjectURL(a.href);
}

$('#btnSave').onclick = async () => {
  if (!serverMode) { download(); toast('content.json descargado. Reemplaza data/content.json en tu sitio.'); return; }
  if (!(await ensureLogin())) return;
  try {
    const r = await api('/api/save', data);
    original = JSON.stringify(data, null, 2);
    // En Vercel el sitio tarda 1-2 minutos en republicarse: se conserva el borrador hasta que coincida con lo publicado
    if (!r.deploying) { try { localStorage.removeItem(DRAFT); } catch (_) {} }
    status(); toast(r.deploying ? 'Guardado. En 1 o 2 minutos Vercel publica la nueva versión.' : 'Guardado y publicado');
  } catch (err) { toast('No se pudo guardar: ' + err.message, true); }
};
$('#btnPreview').onclick = () => { saveDraft(); window.open('../?preview=1', '_blank'); };
$('#btnImport').onclick = () => $('#fileImport').click();
$('#fileImport').onchange = async (e) => {
  const f = e.target.files[0]; if (!f) return;
  try { const j = JSON.parse(await f.text()); if (!j.settings || !j.projects) throw new Error('no parece un content.json'); data = j; saveDraft(); renderPanel(); toast('Archivo importado'); }
  catch (err) { toast('Archivo inválido: ' + err.message, true); }
  e.target.value = '';
};
$('#btnReset').onclick = async () => {
  if (!confirm('¿Descartar el borrador y volver al contenido publicado?')) return;
  try { localStorage.removeItem(DRAFT); } catch (_) {}
  await load(true); toast('Borrador descartado');
};

/* ---------- Arranque ---------- */
async function load(forceServer) {
  const res = await fetch('../data/content.json', { cache: 'no-cache' });
  const text = await res.text();
  original = JSON.stringify(JSON.parse(text), null, 2);
  let draft = null;
  if (!forceServer) { try { draft = localStorage.getItem(DRAFT); } catch (_) {} }
  if (draft && JSON.stringify(JSON.parse(draft), null, 2) === original) { try { localStorage.removeItem(DRAFT); } catch (_) {} draft = null; }
  data = draft ? JSON.parse(draft) : JSON.parse(text);
  renderPanel(); status();
}

(async () => {
  try { const r = await fetch('/api/ping'); serverMode = r.ok && (await r.json()).ok === true; } catch (_) { serverMode = false; }
  $('#btnSave').textContent = serverMode ? 'Guardar en el sitio' : 'Descargar content.json';
  try { await load(); } catch (err) { $('#panel').innerHTML = `<p class="note">No se pudo leer ../data/content.json (${esc(err.message)}). Abre el admin desde un servidor (no con doble clic en el archivo): <code>node server.js</code> o <code>python3 -m http.server</code>.</p>`; }
})();
