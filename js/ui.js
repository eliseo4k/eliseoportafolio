/* ui.js — comportamiento: menú móvil, enlace activo, filtros, ventana de proyecto y formulario */

export function initUI({ getModal }) {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* Barra de navegación: borde al hacer scroll */
  const nav = $('#nav');
  const onScroll = () => nav && nav.classList.toggle('is-stuck', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Menú móvil */
  const burger = $('.burger'), menu = $('#menu');
  const setMenu = (open) => {
    if (!burger || !menu) return;
    burger.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('open', open);
  };
  burger?.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  menu?.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* Enlace activo según la sección visible */
  const links = $$('.nav__links a');
  const sections = links.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => io.observe(s));
  }

  /* Filtros del portafolio */
  const filters = $$('.chip-btn');
  filters.forEach((btn) => btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    filters.forEach((b) => { const on = b === btn; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
    $$('.proj').forEach((p) => { p.hidden = !(f === 'all' || p.dataset.cat === f); });
  }));

  /* Ventana de proyecto */
  const modal = $('#modal'), modalBody = $('#modalBody');
  let lastFocus = null;

  /* Visor de imágenes en grande (se crea solo, encima de la ventana del proyecto) */
  const lb = document.createElement('dialog');
  lb.className = 'lb'; lb.setAttribute('aria-label', 'Galería');
  lb.innerHTML = `<button type="button" class="lb__btn lb__close" data-lb="close" aria-label="${modal?.querySelector('.modal__close')?.getAttribute('aria-label') || 'Close'}">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    <button type="button" class="lb__btn lb__nav lb__prev" data-lb="prev" aria-label="‹"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
    <button type="button" class="lb__btn lb__nav lb__next" data-lb="next" aria-label="›"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>
    <figure class="lb__fig"><img class="lb__img" alt=""></figure>
    <p class="lb__count" aria-live="polite"></p>`;
  document.body.appendChild(lb);
  const lbImg = $('.lb__img', lb), lbCount = $('.lb__count', lb);
  let shots = [], cur = 0, alt = '';
  const showShot = (i) => {
    if (!shots.length) return;
    cur = (i + shots.length) % shots.length;
    lbImg.classList.remove('is-in');
    lbImg.src = shots[cur]; lbImg.alt = `${alt} ${cur + 1}`;
    lbCount.textContent = shots.length > 1 ? `${cur + 1} / ${shots.length}` : '';
    lb.classList.toggle('lb--single', shots.length < 2);
    requestAnimationFrame(() => lbImg.classList.add('is-in'));
    // precarga la siguiente para que el cambio sea instantáneo
    if (shots.length > 1) new Image().src = shots[(cur + 1) % shots.length];
  };
  const openShot = (gal, i) => {
    shots = $$('[data-full]', gal).map((b) => b.dataset.full); alt = gal.dataset.alt || '';
    showShot(i);
    if (typeof lb.showModal === 'function') lb.showModal(); else lb.setAttribute('open', '');
  };
  lb.addEventListener('click', (e) => {
    const a = e.target.closest('[data-lb]')?.dataset.lb;
    if (a === 'prev') showShot(cur - 1);
    else if (a === 'next') showShot(cur + 1);
    else if (a === 'close' || e.target === lb || e.target.classList.contains('lb__fig')) lb.close();
  });
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); showShot(cur - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); showShot(cur + 1); }
  });
  let x0 = null;   // deslizar con el dedo
  lb.addEventListener('touchstart', (e) => { x0 = e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) showShot(cur + (dx < 0 ? 1 : -1));
  }, { passive: true });

  document.addEventListener('click', (e) => {
    const zoom = e.target.closest('[data-zoom]');
    if (zoom) { openShot(zoom.closest('.gal'), Number(zoom.dataset.zoom)); return; }
    const open = e.target.closest('[data-open]');
    if (open && modal) {
      lastFocus = open;
      modalBody.innerHTML = getModal(open.dataset.open);
      modal.scrollTop = 0;
      if (typeof modal.showModal === 'function') modal.showModal(); else modal.setAttribute('open', '');
      return;
    }
    if (e.target.closest('.modal__close') || e.target === modal) modal?.close();
  });
  modal?.addEventListener('close', () => lastFocus?.focus());

  /* Formulario de contacto */
  const form = $('#contactForm');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const note = $('.form__note', form), d = form.dataset;
    const fd = new FormData(form);
    const set = (msg, cls = '') => { note.textContent = msg; note.className = 'form__note ' + cls; };
    if (fd.get('website')) return; // anti-spam (campo trampa)
    if (!fd.get('name')?.trim() || !/^\S+@\S+\.\S+$/.test(fd.get('email') || '') || !fd.get('message')?.trim()) return set(d.msgRequired, 'err');

    if (d.endpoint) {
      set(d.msgSending);
      try {
        const res = await fetch(d.endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: fd });
        if (!res.ok) throw new Error(res.status);
        form.reset(); set(d.msgSent, 'ok');
      } catch (_) { set(d.msgFail, 'err'); }
      return;
    }
    // Sin servicio de formularios: abre el correo con el mensaje listo
    const subject = `${fd.get('service')} — ${fd.get('name')}`;
    const text = `${fd.get('message')}\n\n${fd.get('name')}${fd.get('company') ? ' · ' + fd.get('company') : ''}\n${fd.get('email')}`;
    window.location.href = `mailto:${d.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    set(d.msgMail, 'ok');
  });
}
