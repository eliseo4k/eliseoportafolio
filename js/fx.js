/* fx.js — efectos sutiles: brillo del cursor, contadores y barras de habilidad */

export function initFx() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $$ = (s) => [...document.querySelectorAll(s)];

  /* Brillo que sigue al ratón (solo dispositivos con puntero fino) */
  const glow = document.getElementById('glow');
  if (glow && !reduce && window.matchMedia('(pointer: fine)').matches) {
    let raf = 0;
    window.addEventListener('pointermove', (e) => {
      glow.classList.add('on');
      if (raf) return;
      raf = requestAnimationFrame(() => {
        glow.style.setProperty('--mx', e.clientX + 'px');
        glow.style.setProperty('--my', e.clientY + 'px');
        raf = 0;
      });
    }, { passive: true });
  }

  if (!('IntersectionObserver' in window)) {
    $$('.bar').forEach((b) => b.classList.add('is-in'));
    return;
  }

  /* Barras de habilidad: se llenan al entrar en pantalla */
  const barIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); barIO.unobserve(en.target); } });
  }, { threshold: 0.4 });
  $$('.bar').forEach((b) => barIO.observe(b));

  /* Contadores de estadísticas */
  if (reduce) return;
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      countIO.unobserve(en.target);
      const el = en.target, end = Number(el.dataset.count), suffix = el.dataset.suffix || '';
      const t0 = performance.now(), dur = 1200;
      const tick = (t) => {
        const p = Math.min((t - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(end * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => countIO.observe(el));
}
