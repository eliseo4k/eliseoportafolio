/* ============================================================
   render.js — convierte data/content.json en HTML.
   Es "puro" (solo devuelve strings), así que lo usan:
   - el navegador (js/app.js) para actualizar el contenido
   - Node (tools/prerender.mjs) para generar el HTML estático que lee Google
   ============================================================ */

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Devuelve el texto en el idioma pedido (acepta string o {es,en}). */
export const tr = (v, lang) => (v == null ? '' : typeof v === 'string' ? v : v[lang] ?? v.es ?? '');

/* Colores de las herramientas: [texto, fondo] */
export const TOOLS = {
  Ps: ['#31a8ff', '#001e36'], Ai: ['#ff9a00', '#330000'], Id: ['#ff5c8a', '#49021f'],
  Pr: ['#9999ff', '#00005b'], Ae: ['#d291ff', '#1f0a4d'], Xd: ['#ff61f6', '#470137'],
  Lr: ['#4ab9ff', '#001d35'], Au: ['#00e4bb', '#00342c'],
  HTML: ['#ff9966', '#2a1208'], CSS: ['#5eb0ff', '#0a1a33'], JS: ['#ffd84d', '#2b2400'], DB: ['#6ee7b7', '#06261c']
};

/* Textos de interfaz (lo que no es "contenido" editable) */
export const UI = {
  es: {
    htmlLang: 'es', ogLocale: 'es_PR', other: 'en', otherLabel: 'English',
    nav: { about: 'Sobre mí', services: 'Servicios', skills: 'Skills', experience: 'Experiencia', portfolio: 'Portafolio', faq: 'Preguntas', contact: 'Contacto' },
    menu: 'Menú', mainNav: 'Navegación principal', cta: 'Hablemos', seePortfolio: 'Ver portafolio', contactMe: 'Contactar',
    tools: 'Trabajo con', hello: 'Perfil',
    aboutKicker: 'Sobre mí', servicesTitle: 'Servicios para agencias y marcas', servicesLead: 'Todo lo visual en un solo lugar: de la identidad al video y a la web.',
    skillsTitle: 'Herramientas que domino', skillsLead: 'Nivel de dominio en las herramientas que uso a diario.',
    expTitle: 'Agencias y empresas con las que he trabajado', expLead: 'Puerto Rico, Estados Unidos, Chile, Colombia y Venezuela.', eduTitle: 'Formación',
    portTitle: 'Portafolio', portLead: 'Una muestra por especialidad. Cada proyecto se puede abrir para ver más.',
    all: 'Todos', cats: { branding: 'Branding', social: 'Redes sociales', video: 'Video y motion', web: 'Web UI/UX', ai: 'Con IA' },
    open: 'Ver proyecto', visit: 'Visitar proyecto', close: 'Cerrar',
    procTitle: 'Cómo trabajamos', procLead: 'Cuatro pasos, sin sorpresas.',
    faqTitle: 'Preguntas frecuentes',
    contactTitle: '¿Tienes un proyecto en mente?', contactLead: 'Cuéntame qué necesitas y te respondo con una propuesta clara.',
    fName: 'Nombre', fEmail: 'Correo', fCompany: 'Empresa o agencia (opcional)', fService: 'Servicio', fMsg: 'Mensaje', fOther: 'Otro',
    send: 'Enviar mensaje', whatsapp: 'Escribir por WhatsApp', emailLabel: 'Correo', phoneLabel: 'WhatsApp', placeLabel: 'Ubicación', follow: 'Redes',
    sending: 'Enviando…', sent: 'Mensaje enviado. Te respondo pronto.', fail: 'No se pudo enviar. Escríbeme por WhatsApp o a mi correo.',
    mailOpened: 'Se abrió tu app de correo con el mensaje listo.', required: 'Completa nombre, correo y mensaje.',
    skip: 'Saltar al contenido', rights: 'Todos los derechos reservados.', top: 'Volver arriba',
    code: { role: 'rol', exp: 'experiencia', ai: 'conIA', aiVals: ['webs', 'juegos'], avail: 'disponible', name: 'eliseo' },
    photoAlt: 'Eliseo Romero, diseñador gráfico digital', years: 'años'
  },
  en: {
    htmlLang: 'en', ogLocale: 'en_US', other: 'es', otherLabel: 'Español',
    nav: { about: 'About', services: 'Services', skills: 'Skills', experience: 'Experience', portfolio: 'Portfolio', faq: 'FAQ', contact: 'Contact' },
    menu: 'Menu', mainNav: 'Main navigation', cta: "Let's talk", seePortfolio: 'View portfolio', contactMe: 'Contact me',
    tools: 'I work with', hello: 'Profile',
    aboutKicker: 'About', servicesTitle: 'Services for agencies and brands', servicesLead: 'Everything visual in one place: from identity to video to the web.',
    skillsTitle: 'Tools I master', skillsLead: 'Proficiency in the tools I use every day.',
    expTitle: "Agencies and companies I've worked with", expLead: 'Puerto Rico, United States, Chile, Colombia and Venezuela.', eduTitle: 'Education',
    portTitle: 'Portfolio', portLead: 'A sample for each specialty. Open any project to see more.',
    all: 'All', cats: { branding: 'Branding', social: 'Social media', video: 'Video & motion', web: 'Web UI/UX', ai: 'AI-made' },
    open: 'View project', visit: 'Visit project', close: 'Close',
    procTitle: 'How we work', procLead: 'Four steps, no surprises.',
    faqTitle: 'Frequently asked questions',
    contactTitle: 'Have a project in mind?', contactLead: 'Tell me what you need and I will reply with a clear proposal.',
    fName: 'Name', fEmail: 'Email', fCompany: 'Company or agency (optional)', fService: 'Service', fMsg: 'Message', fOther: 'Other',
    send: 'Send message', whatsapp: 'Message on WhatsApp', emailLabel: 'Email', phoneLabel: 'WhatsApp', placeLabel: 'Location', follow: 'Social',
    sending: 'Sending…', sent: 'Message sent. I will reply soon.', fail: 'Could not send. Reach me on WhatsApp or by email.',
    mailOpened: 'Your email app opened with the message ready.', required: 'Please fill in name, email and message.',
    skip: 'Skip to content', rights: 'All rights reserved.', top: 'Back to top',
    code: { role: 'role', exp: 'experience', ai: 'withAI', aiVals: ['sites', 'games'], avail: 'available', name: 'eliseo' },
    photoAlt: 'Eliseo Romero, digital graphic designer', years: 'years'
  }
};

/* ---------- Iconos ---------- */
const svg = (inner, cls = 'ico') =>
  `<svg class="${cls}" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner}</svg>`;

export const ICONS = {
  brand: '<path d="M12 2.5l5 8-5 11-5-11z"/><circle cx="12" cy="10" r="1.6"/>',
  social: '<rect x="7" y="2.5" width="10" height="19" rx="2.8"/><path d="M10.5 18.5h3"/>',
  video: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5v5l4.5-2.5z"/>',
  web: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 9h18M6.5 6.5h.01M9.5 6.5h.01"/>',
  code: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>',
  game: '<rect x="2.5" y="7" width="19" height="11" rx="5.5"/><path d="M7 10.5v4M5 12.5h4M16 11.5h.01M18 13.5h.01"/>',
  instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="3.8"/><path d="M17 7h.01"/>',
  tiktok: '<path d="M14 3.5v11a3.6 3.6 0 1 1-3.6-3.6M14 3.5c.3 2.4 1.9 4.1 4.5 4.3"/>',
  facebook: '<path d="M14.5 21v-7.5h2.7l.5-3.2h-3.2V8.4c0-.9.4-1.6 1.7-1.6h1.6V4c-.4 0-1.4-.2-2.5-.2-2.5 0-4.1 1.5-4.1 4.2v2.3H8.5v3.2h2.7V21"/>',
  whatsapp: '<path d="M3.5 20.5l1.4-4.4A8.5 8.5 0 1 1 8 19.2z"/><path d="M9 8.8c0 3 3.2 6.2 6.2 6.2l1.1-1.5-2-1-1 .8c-1-.5-1.8-1.3-2.3-2.3l.8-1-1-2z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.8"/><path d="M3.8 7.5l8.2 6 8.2-6"/>',
  pin: '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  grad: '<path d="M2.5 9L12 4.5 21.5 9 12 13.5z"/><path d="M6 11.5v4.5c0 1.2 2.7 2.5 6 2.5s6-1.3 6-2.5v-4.5"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>'
};
const ico = (name, cls) => svg(ICONS[name] || '', cls);

const badge = (code, extra = '', custom = null) => {
  const [fg, bg] = custom || TOOLS[code] || ['#c9c6ff', '#1a1a40'];
  return `<span class="tool ${code.length > 2 ? 'tool--txt ' : ''}${extra}" style="--fg:${esc(fg)};--bg:${esc(bg)}" title="${esc(code)}">${esc(code)}</span>`;
};

const asset = (root, p) => (/^(https?:|data:|\/)/.test(p || '') ? p : root + (p || ''));
const waLink = (s, msg = '') => `https://wa.me/${s.whatsapp}${msg ? '?text=' + encodeURIComponent(msg) : ''}`;

/* ---------- Secciones ---------- */
export function renderHeader(d, lang, root) {
  const u = UI[lang];
  const otherHref = lang === 'es' ? root + 'en/' : root || './';
  const links = ['about', 'services', 'skills', 'experience', 'portfolio', 'faq', 'contact']
    .map((k) => `<a href="#${k}">${esc(u.nav[k])}</a>`).join('');
  return `<a class="skip" href="#main">${esc(u.skip)}</a>
<header class="nav" id="nav">
  <div class="wrap nav__in">
    <a class="brand" href="#top" aria-label="${esc(d.settings.brand)}"><span class="brand__mark" aria-hidden="true">E</span><span class="brand__name">${esc(d.settings.brand)}</span></a>
    <nav class="nav__links" id="menu" aria-label="${esc(u.mainNav)}">${links}</nav>
    <div class="nav__end">
      <a class="lang" href="${otherHref}" hreflang="${u.other}" lang="${u.other}" title="${esc(u.otherLabel)}">${u.other.toUpperCase()}</a>
      <a class="btn btn--sm nav__cta" href="#contact">${esc(u.cta)}</a>
      <button class="burger" type="button" aria-expanded="false" aria-controls="menu" aria-label="${esc(u.menu)}"><span></span><span></span></button>
    </div>
  </div>
</header>`;
}

function codeCard(d, lang) {
  const c = UI[lang].code;
  const aiVals = c.aiVals.map((v) => `<i class="s">"${esc(v)}"</i>`).join(', ');
  return `<div class="codecard" aria-hidden="true">
  <div class="codecard__bar"><i></i><i></i><i></i><span>profile.js</span></div>
<pre><code><b class="k">const</b> <b class="f">${c.name}</b> = {
  ${c.role}: <i class="s">"${esc(tr(d.hero.tag, lang))}"</i>,
  ${c.exp}: <i class="s">"${esc(tr(d.hero.years, lang))}"</i>,
  ${c.ai}: [${aiVals}],
  ${c.avail}: <b class="k">${d.settings.available ? 'true' : 'false'}</b>
};</code></pre>
</div>`;
}

export function renderHero(d, lang, root) {
  const u = UI[lang], s = d.settings, h = d.hero;
  const tools = ['Ps', 'Ai', 'Id', 'Xd', 'Pr', 'Ae', 'Lr', 'Au'].map((t) => badge(t)).join('');
  return `<section class="hero" id="top">
  <div class="wrap hero__in">
    <div class="hero__copy">
      <p class="hero__hi">${esc(tr(h.greeting, lang))}</p>
      <h1>${esc(tr(h.title, lang))}</h1>
      <p class="hero__lead">${esc(tr(h.text, lang))}</p>
      <div class="hero__cta">
        <a class="btn" href="#portfolio">${esc(u.seePortfolio)}${ico('arrow', 'ico ico--sm')}</a>
        <a class="btn btn--ghost" href="#contact">${esc(u.contactMe)}</a>
      </div>
      ${s.available ? `<p class="avail"><span class="avail__dot" aria-hidden="true"></span>${esc(tr(h.availableText, lang))}</p>` : ''}
      <div class="hero__tools" aria-label="${esc(u.tools)}"><span>${esc(u.tools)}</span><div class="tools-row">${tools}</div></div>
    </div>
    <div class="artboard">
      <div class="artboard__glow" aria-hidden="true"></div>
      <div class="artboard__sel">
        <span class="h h1"></span><span class="h h2"></span><span class="h h3"></span><span class="h h4"></span>
        <span class="sel__tag">${esc(s.brand)} · ${esc(tr(h.tag, lang))}</span>
        <img class="artboard__photo" src="${esc(asset(root, s.photo))}" width="600" height="600" alt="${esc(u.photoAlt)}" fetchpriority="high" decoding="async">
      </div>
      <span class="fl fl--1" aria-hidden="true">${badge('Ps', 'tool--lg')}</span>
      <span class="fl fl--2" aria-hidden="true">${badge('Ai', 'tool--lg')}</span>
      <span class="fl fl--3" aria-hidden="true">${badge('Ae', 'tool--lg')}</span>
      <span class="fl fl--4" aria-hidden="true">${badge('Xd', 'tool--lg')}</span>
      ${codeCard(d, lang)}
    </div>
  </div>
</section>`;
}

export function renderAbout(d, lang) {
  const u = UI[lang], a = d.about;
  const stats = d.stats.map((x) => `<li><strong data-count="${x.value}" data-suffix="${esc(x.suffix)}">${x.value}${esc(x.suffix)}</strong><span>${esc(tr(x.label, lang))}</span></li>`).join('');
  const points = a.points.map((p) => `<li>${ico('spark', 'ico ico--sm')}<span>${esc(tr(p, lang))}</span></li>`).join('');
  return `<section class="section" id="about" aria-labelledby="about-t">
  <div class="wrap about">
    <div class="about__copy">
      <p class="kicker">${esc(u.aboutKicker)}</p>
      <h2 id="about-t">${esc(tr(a.title, lang))}</h2>
      <p>${esc(tr(a.text, lang))}</p>
      <ul class="points">${points}</ul>
    </div>
    <ul class="stats" aria-label="${esc(u.aboutKicker)}">${stats}</ul>
  </div>
</section>`;
}

export function renderServices(d, lang) {
  const u = UI[lang];
  const cards = d.services.map((s) => `<article class="card service">
    <span class="service__ico">${ico(s.icon)}</span>
    <h3>${esc(tr(s.title, lang))}</h3>
    <p>${esc(tr(s.text, lang))}</p>
    <div class="tools-row tools-row--sm">${(s.tools || []).map((t) => badge(t)).join('')}</div>
  </article>`).join('');
  return `<section class="section section--alt" id="services" aria-labelledby="services-t">
  <div class="wrap">
    <header class="section__head"><h2 id="services-t">${esc(u.servicesTitle)}</h2><p>${esc(u.servicesLead)}</p></header>
    <div class="grid grid--3">${cards}</div>
  </div>
</section>`;
}

/* Niveles: solo 4 pasos. La barra y la etiqueta salen del mismo valor.
   Se guarda como texto ("Bajo", "Medio", "Alto", "Avanzado"). Si hay un número
   antiguo (0-100) se convierte solo, para no romper contenido anterior. */
const LEVEL_KEYS = ['bajo', 'medio', 'alto', 'avanzado'];
const LEVELS = {
  es: ['Bajo', 'Medio', 'Alto', 'Avanzado'],
  en: ['Low', 'Medium', 'High', 'Advanced']
};
export function levelIndex(v) {
  if (typeof v === 'number' || /^\d+$/.test(String(v).trim())) {
    const n = Number(v);
    return n < 50 ? 0 : n < 75 ? 1 : n < 90 ? 2 : 3;
  }
  const i = LEVEL_KEYS.indexOf(String(v).trim().toLowerCase());
  return i < 0 ? 2 : i;
}
export function levelLabel(v, lang) {
  return (LEVELS[lang] || LEVELS.es)[levelIndex(v)];
}

export function renderSkills(d, lang) {
  const u = UI[lang], k = d.skills;
  const bars = k.adobe.map((s) => `<li class="bar">
      ${badge(s.code, '', s.color ? [s.color, s.bg || '#1a1a40'] : null)}
      <div class="bar__body"><div class="bar__top"><span>${esc(s.name)}</span><b>${levelLabel(s.level, lang)}</b></div>
      <div class="bar__track" role="img" aria-label="${esc(s.name)}: ${levelLabel(s.level, lang)}"><i style="--v:${(levelIndex(s.level) + 1) * 25}"></i></div></div>
    </li>`).join('');
  const chips = k.ai.map((c) => `<li>${esc(tr(c, lang))}</li>`).join('');
  return `<section class="section" id="skills" aria-labelledby="skills-t">
  <div class="wrap">
    <header class="section__head"><h2 id="skills-t">${esc(u.skillsTitle)}</h2><p>${esc(u.skillsLead)}</p></header>
    <div class="skills">
      <ul class="bars">${bars}</ul>
      <aside class="card aicard">
        <span class="service__ico service__ico--ai">${ico('spark')}</span>
        <h3>${esc(tr(k.aiTitle, lang))}</h3>
        <p>${esc(tr(k.aiText, lang))}</p>
        <ul class="chips">${chips}</ul>
      </aside>
    </div>
  </div>
</section>`;
}

export function renderExperience(d, lang) {
  const u = UI[lang];
  const items = d.experience.map((e) => `<li class="tl__item"><h3>${esc(e.company)}</h3><p>${esc(tr(e.role, lang))} · <span>${esc(tr(e.place, lang))}</span></p></li>`).join('');
  const edu = d.education.map((e) => `<li class="edu__item">${ico('grad')}<div><h3>${esc(tr(e.title, lang))}</h3><p>${esc(tr(e.place, lang))}</p></div></li>`).join('');
  return `<section class="section section--alt" id="experience" aria-labelledby="exp-t">
  <div class="wrap exp">
    <div>
      <header class="section__head section__head--left"><h2 id="exp-t">${esc(u.expTitle)}</h2><p>${esc(u.expLead)}</p></header>
      <ol class="tl">${items}</ol>
    </div>
    <aside class="card edu"><h3 class="edu__title">${esc(u.eduTitle)}</h3><ul>${edu}</ul></aside>
  </div>
</section>`;
}

export function renderPortfolio(d, lang, root) {
  const u = UI[lang];
  const cats = [...new Set(d.projects.map((p) => p.category))];
  const filters = [`<button type="button" class="chip-btn is-on" data-filter="all" aria-pressed="true">${esc(u.all)}</button>`]
    .concat(cats.map((c) => `<button type="button" class="chip-btn" data-filter="${esc(c)}" aria-pressed="false">${esc(u.cats[c] || c)}</button>`)).join('');
  const cards = d.projects.map((p) => `<article class="proj" data-cat="${esc(p.category)}">
    <button class="proj__btn" type="button" data-open="${esc(p.id)}" aria-haspopup="dialog" aria-label="${esc(u.open)}: ${esc(tr(p.title, lang))}">
      <span class="proj__img"><img src="${esc(asset(root, p.cover))}" width="1200" height="800" loading="lazy" decoding="async" alt="${esc(tr(p.title, lang))}"></span>
      <span class="proj__info">
        <span class="proj__cat">${esc(u.cats[p.category] || p.category)}</span>
        <h3>${esc(tr(p.title, lang))}</h3>
        <span class="proj__desc">${esc(tr(p.desc, lang))}</span>
      </span>
    </button>
  </article>`).join('');
  return `<section class="section" id="portfolio" aria-labelledby="port-t">
  <div class="wrap">
    <header class="section__head"><h2 id="port-t">${esc(u.portTitle)}</h2><p>${esc(u.portLead)}</p></header>
    <div class="filters" role="group" aria-label="${esc(u.portTitle)}">${filters}</div>
    <div class="grid grid--3 proj-grid" id="projGrid">${cards}</div>
  </div>
</section>`;
}

export function projectModal(d, id, lang, root) {
  const u = UI[lang];
  const p = d.projects.find((x) => x.id === id);
  if (!p) return '';
  const extra = (p.images || []).map((im) => `<img src="${esc(asset(root, im))}" loading="lazy" alt="${esc(tr(p.title, lang))}">`).join('');
  return `<div class="modal__media"><img src="${esc(asset(root, p.cover))}" alt="${esc(tr(p.title, lang))}">${extra}</div>
<div class="modal__body">
  <p class="proj__cat">${esc(u.cats[p.category] || p.category)}</p>
  <h3 id="modalTitle">${esc(tr(p.title, lang))}</h3>
  <p>${esc(tr(p.desc, lang))}</p>
  <ul class="chips">${(p.tags || []).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
  ${p.url ? `<a class="btn" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(u.visit)}${ico('arrow', 'ico ico--sm')}</a>` : ''}
</div>`;
}

export function renderProcess(d, lang) {
  const u = UI[lang];
  const steps = d.process.map((s, i) => `<li class="step"><span class="step__n">${i + 1}</span><h3>${esc(tr(s.title, lang))}</h3><p>${esc(tr(s.text, lang))}</p></li>`).join('');
  return `<section class="section section--alt" id="process" aria-labelledby="proc-t">
  <div class="wrap">
    <header class="section__head"><h2 id="proc-t">${esc(u.procTitle)}</h2><p>${esc(u.procLead)}</p></header>
    <ol class="steps">${steps}</ol>
  </div>
</section>`;
}

export function renderFaq(d, lang) {
  const u = UI[lang];
  const items = d.faq.map((f) => `<details class="faq__item"><summary><span>${esc(tr(f.q, lang))}</span>${ico('down', 'ico ico--sm faq__chev')}</summary><p>${esc(tr(f.a, lang))}</p></details>`).join('');
  return `<section class="section" id="faq" aria-labelledby="faq-t">
  <div class="wrap wrap--narrow">
    <header class="section__head"><h2 id="faq-t">${esc(u.faqTitle)}</h2></header>
    <div class="faq">${items}</div>
  </div>
</section>`;
}

export function renderContact(d, lang) {
  const u = UI[lang], s = d.settings;
  const social = ['instagram', 'tiktok', 'facebook'].filter((k) => s.socials?.[k])
    .map((k) => `<a class="soc" href="${esc(s.socials[k])}" target="_blank" rel="noopener me" aria-label="${k}">${ico(k)}</a>`).join('');
  const opts = d.services.map((x) => `<option>${esc(tr(x.title, lang))}</option>`).join('') + `<option>${esc(u.fOther)}</option>`;
  return `<section class="section section--alt" id="contact" aria-labelledby="contact-t">
  <div class="wrap contact">
    <div class="contact__copy">
      <h2 id="contact-t">${esc(u.contactTitle)}</h2>
      <p>${esc(u.contactLead)}</p>
      <ul class="clist">
        <li>${ico('mail')}<div><span>${esc(u.emailLabel)}</span><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></div></li>
        <li>${ico('whatsapp')}<div><span>${esc(u.phoneLabel)}</span><a href="${waLink(s)}" target="_blank" rel="noopener">${esc(s.phone)}</a></div></li>
        <li>${ico('pin')}<div><span>${esc(u.placeLabel)}</span><b>${esc(tr(s.location, lang))}</b></div></li>
      </ul>
      <div class="contact__soc"><span>${esc(u.follow)}</span>${social}</div>
      <a class="btn btn--wa" href="${waLink(s)}" target="_blank" rel="noopener">${ico('whatsapp', 'ico ico--sm')}${esc(u.whatsapp)}</a>
    </div>
    <form class="card form" id="contactForm" novalidate data-endpoint="${esc(s.formEndpoint || '')}" data-email="${esc(s.email)}"
      data-msg-sending="${esc(u.sending)}" data-msg-sent="${esc(u.sent)}" data-msg-fail="${esc(u.fail)}" data-msg-mail="${esc(u.mailOpened)}" data-msg-required="${esc(u.required)}">
      <label>${esc(u.fName)}<input name="name" type="text" autocomplete="name" required></label>
      <label>${esc(u.fEmail)}<input name="email" type="email" autocomplete="email" required></label>
      <label>${esc(u.fCompany)}<input name="company" type="text" autocomplete="organization"></label>
      <label>${esc(u.fService)}<select name="service">${opts}</select></label>
      <label>${esc(u.fMsg)}<textarea name="message" rows="5" required></textarea></label>
      <input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
      <button class="btn" type="submit">${esc(u.send)}${ico('arrow', 'ico ico--sm')}</button>
      <p class="form__note" role="status" aria-live="polite"></p>
    </form>
  </div>
</section>`;
}

export function renderFooter(d, lang, year = new Date().getFullYear()) {
  const u = UI[lang], s = d.settings;
  const social = ['instagram', 'tiktok', 'facebook'].filter((k) => s.socials?.[k])
    .map((k) => `<a class="soc" href="${esc(s.socials[k])}" target="_blank" rel="noopener me" aria-label="${k}">${ico(k)}</a>`).join('');
  return `<footer class="footer">
  <div class="wrap footer__in">
    <p>© ${year} ${esc(s.name)}. ${esc(u.rights)}</p>
    <div class="footer__soc">${social}</div>
    <a href="#top">${esc(u.top)}</a>
  </div>
</footer>`;
}

export function renderMain(d, lang, root) {
  return [renderHero(d, lang, root), renderAbout(d, lang), renderServices(d, lang), renderSkills(d, lang), renderExperience(d, lang),
    renderPortfolio(d, lang, root), renderProcess(d, lang), renderFaq(d, lang), renderContact(d, lang)].join('\n');
}

/* ---------- SEO ---------- */
export function renderSeo(d, lang) {
  const u = UI[lang], base = d.settings.siteUrl.replace(/\/$/, '');
  const url = lang === 'es' ? base + '/' : base + '/en/';
  const title = tr(d.seo.title, lang), desc = tr(d.seo.description, lang), img = base + '/assets/img/og-image.jpg';
  return `<title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <meta name="author" content="${esc(d.settings.name)}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
  <link rel="canonical" href="${url}">
  <link rel="alternate" hreflang="es" href="${base}/">
  <link rel="alternate" hreflang="en" href="${base}/en/">
  <link rel="alternate" hreflang="x-default" href="${base}/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(d.settings.brand)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${img}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(UI[lang].photoAlt)}">
  <meta property="og:locale" content="${u.ogLocale}">
  <meta property="og:locale:alternate" content="${UI[u.other].ogLocale}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  <meta name="twitter:image" content="${img}">`;
}

export function renderJsonLd(d, lang) {
  const base = d.settings.siteUrl.replace(/\/$/, '');
  const url = lang === 'es' ? base + '/' : base + '/en/';
  const sameAs = Object.values(d.settings.socials || {}).filter(Boolean);
  const graph = [
    {
      '@type': 'Person', '@id': base + '/#person', name: d.settings.name, alternateName: d.settings.brand,
      jobTitle: tr(d.hero.tag, lang), image: base + '/' + d.settings.photo, url, email: d.settings.email, sameAs,
      address: { '@type': 'PostalAddress', addressLocality: 'El Tigre', addressRegion: 'Anzoátegui', addressCountry: 'VE' },
      knowsAbout: ['Graphic design', 'Branding', 'Social media design', 'Video editing', 'Motion graphics', 'UI/UX design', 'Web development with AI', 'Game development with AI'],
      worksFor: d.experience.slice(0, 1).map((e) => ({ '@type': 'Organization', name: e.company }))
    },
    {
      '@type': 'ProfessionalService', '@id': base + '/#service', name: d.settings.brand, url, image: base + '/assets/img/og-image.jpg',
      description: tr(d.seo.description, lang), founder: { '@id': base + '/#person' },
      areaServed: [{ '@type': 'Country', name: 'United States' }, { '@type': 'Place', name: 'Puerto Rico' }],
      serviceType: d.services.map((s) => tr(s.title, lang)), sameAs
    },
    { '@type': 'WebSite', '@id': base + '/#site', url: base + '/', name: d.settings.brand, inLanguage: lang },
    {
      '@type': 'FAQPage', mainEntity: d.faq.map((f) => ({ '@type': 'Question', name: tr(f.q, lang), acceptedAnswer: { '@type': 'Answer', text: tr(f.a, lang) } }))
    }
  ];
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')}</script>`;
}

/** Hash simple (FNV-1a) para saber si content.json cambió respecto al HTML estático. */
export function hashText(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36);
}
