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
  document.addEventListener('click', (e) => {
    const open = e.target.closest('[data-open]');
    if (open && modal) {
      lastFocus = open;
      modalBody.innerHTML = getModal(open.dataset.open);
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
