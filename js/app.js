/* app.js — arranque de la web.
   1) Si data/content.json cambió respecto al HTML estático, vuelve a pintar el contenido.
   2) Activa la interfaz (menú, filtros, ventana de proyecto, formulario) y los efectos. */
import { renderHeader, renderMain, renderFooter, projectModal, hashText } from './render.js';
import { initUI } from './ui.js';
import { initFx } from './fx.js';

const body = document.body;
const lang = body.dataset.lang;
const root = body.dataset.root || '';

async function loadData() {
  const preview = new URLSearchParams(location.search).get('preview') === '1';
  if (preview) {
    try {
      const draft = localStorage.getItem('ejrm-draft');
      if (draft) return { data: JSON.parse(draft), hash: 'preview', preview: true };
    } catch (_) { /* sin almacenamiento */ }
  }
  const res = await fetch(root + 'data/content.json', { cache: 'no-cache' });
  const text = await res.text();
  return { data: JSON.parse(text), hash: hashText(text) };
}

let DATA = null;

async function boot() {
  try {
    const { data, hash, preview } = await loadData();
    DATA = data;
    if (hash !== body.dataset.hash) {
      // El contenido cambió: se actualiza sin recargar
      document.getElementById('siteHeader').innerHTML = renderHeader(data, lang, root);
      document.getElementById('main').innerHTML = renderMain(data, lang, root);
      document.getElementById('siteFooter').innerHTML = renderFooter(data, lang);
      body.dataset.hash = hash;
    }
    if (preview) document.title = '[Vista previa] ' + document.title;
  } catch (err) {
    console.warn('No se pudo cargar content.json; se usa el HTML estático.', err);
  }
  initUI({ getModal: (id) => (DATA ? projectModal(DATA, id, lang, root) : '') });
  initFx();
}

boot();
