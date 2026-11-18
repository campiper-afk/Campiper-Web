/* =========================================================
   Campiper — Consentimiento de cookies
   - Las cookies de analítica NO se cargan hasta que la persona acepta.
   - La decisión se guarda en localStorage y se vuelve a pedir si cambia
     la versión o pasan más de 180 días.
   - Cualquier enlace con el atributo data-cookie-settings reabre el panel.
   ========================================================= */
(function () {
  'use strict';

  const CONFIG = {
    version: '2026-11',          // súbela cuando cambies las categorías o la política
    clave: 'campiper_cookies',
    vigenciaDias: 180,
    ga4: 'G-JP0QHCRVM5',         // Google Analytics 4
    clarity: 'zfq7z5p9fs'        // Microsoft Clarity
  };

  /* ---------- Preferencias guardadas ---------- */
  function leer() {
    try {
      const p = JSON.parse(localStorage.getItem(CONFIG.clave));
      if (!p || p.version !== CONFIG.version) return null;
      const dias = (Date.now() - new Date(p.fecha).getTime()) / 86400000;
      return dias > CONFIG.vigenciaDias ? null : p;
    } catch (e) { return null; }
  }

  function guardar(estadisticas, experiencia) {
    const prefs = {
      version: CONFIG.version,
      fecha: new Date().toISOString(),
      estadisticas: !!estadisticas,
      experiencia: !!experiencia
    };
    try { localStorage.setItem(CONFIG.clave, JSON.stringify(prefs)); } catch (e) {}
    return prefs;
  }

  /* ---------- Carga de terceros (solo con permiso) ---------- */
  function cargarAnalytics() {
    if (window.__ckGA) return;
    window.__ckGA = true;
    window['ga-disable-' + CONFIG.ga4] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + CONFIG.ga4;
    document.head.appendChild(s);
    window.gtag('js', new Date());
    window.gtag('config', CONFIG.ga4, { anonymize_ip: true });
  }

  function cargarClarity() {
    if (window.__ckClarity) return;
    window.__ckClarity = true;
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CONFIG.clarity);
  }

  function borrarCookiesDeAnalitica() {
    window['ga-disable-' + CONFIG.ga4] = true;
    const nombres = document.cookie.split(';')
      .map(c => c.split('=')[0].trim())
      .filter(n => /^(_ga|_gid|_gat|_clck|_clsk)/.test(n));
    const partes = location.hostname.split('.');
    const dominios = [null, location.hostname];
    for (let i = 1; i < partes.length - 1; i++) dominios.push('.' + partes.slice(i).join('.'));
    nombres.forEach(n => dominios.forEach(d => {
      document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (d ? '; domain=' + d : '');
    }));
  }

  function aplicar(prefs, previas) {
    if (prefs.estadisticas) cargarAnalytics();
    if (prefs.experiencia) cargarClarity();

    const retiro = previas && ((previas.estadisticas && !prefs.estadisticas) || (previas.experiencia && !prefs.experiencia));
    if (retiro || (!prefs.estadisticas && !prefs.experiencia)) borrarCookiesDeAnalitica();
    // Un script ya cargado no se puede descargar: al retirar un permiso se recarga la página.
    if (retiro && (window.__ckGA || window.__ckClarity)) setTimeout(() => location.reload(), 150);

    document.dispatchEvent(new CustomEvent('campiper:cookies', { detail: prefs }));
  }

  /* ---------- Interfaz ---------- */
  const CSS = `
    .ck{position:fixed;left:20px;bottom:20px;z-index:300;width:min(440px,calc(100vw - 40px));background:var(--charcoal-soft,#282830);color:var(--white,#f5f5f7);border:1px solid var(--line,rgba(245,245,247,.12));border-radius:14px;padding:22px;box-shadow:0 18px 50px rgba(0,0,0,.45);font-family:var(--body,Inter,sans-serif)}
    .ck h2{margin:0 0 8px;font:700 1rem/1.3 var(--heading,Poppins,sans-serif)}
    .ck p{margin:0;font-size:.84rem;line-height:1.55;color:var(--muted,#a9abb4)}
    .ck a{color:var(--blue-light,#82b8f3);text-decoration:underline;text-underline-offset:2px}
    .ck-opciones{margin-top:14px;border-top:1px solid var(--line,rgba(245,245,247,.12))}
    .ck-fila{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding:12px 0;border-bottom:1px solid var(--line,rgba(245,245,247,.12));cursor:pointer}
    .ck-fila b{display:block;font-size:.85rem}
    .ck-fila small{display:block;margin-top:2px;font-size:.76rem;line-height:1.45;color:var(--muted,#a9abb4)}
    .ck-fila input{flex:none;width:18px;height:18px;margin-top:2px;accent-color:var(--blue,#4a90e2)}
    .ck-acciones{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
    .ck-acciones button{flex:1 1 auto;padding:10px 14px;border-radius:8px;border:1px solid var(--line,rgba(245,245,247,.2));background:transparent;color:inherit;font-size:.82rem;font-weight:600;cursor:pointer}
    .ck-acciones button:hover{background:rgba(245,245,247,.07)}
    .ck-acciones .ck-igual{background:var(--blue,#4a90e2);border-color:var(--blue,#4a90e2);color:#fff}
    .ck-acciones .ck-igual:hover{background:var(--blue-deep,#3478c7)}
    .ck :focus-visible{outline:2px solid var(--blue-light,#82b8f3);outline-offset:2px}
    .ck[hidden]{display:none}
    @media (max-width:520px){.ck{left:10px;right:10px;bottom:10px;width:auto;padding:18px}}
  `;

  let panel = null;
  let expandido = false;

  function construir() {
    if (panel) return panel;
    const estilo = document.createElement('style');
    estilo.textContent = CSS;
    document.head.appendChild(estilo);

    panel = document.createElement('section');
    panel.className = 'ck';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute('aria-labelledby', 'ck-titulo');
    panel.setAttribute('aria-describedby', 'ck-desc');
    panel.innerHTML = `
      <h2 id="ck-titulo" tabindex="-1">Tu privacidad en Campiper</h2>
      <p id="ck-desc">Usamos cookies necesarias para que la plataforma funcione. Con tu permiso, también usamos cookies de analítica para entender cómo se usa el sitio y mejorarlo. Puedes cambiar tu decisión cuando quieras.
        <a href="cookies.html">Política de cookies</a> · <a href="politicas.html">Términos y datos personales</a></p>
      <div class="ck-opciones" id="ck-opciones" hidden>
        <label class="ck-fila"><span><b>Necesarias</b><small>Inicio de sesión, tu progreso y esta preferencia. Siempre activas.</small></span><input type="checkbox" checked disabled></label>
        <label class="ck-fila"><span><b>Estadísticas</b><small>Google Analytics: qué páginas se visitan y cómo rinde el sitio, de forma agregada.</small></span><input type="checkbox" id="ck-est"></label>
        <label class="ck-fila"><span><b>Experiencia de uso</b><small>Microsoft Clarity: mapas de clics y grabaciones anónimas de la sesión para detectar problemas de diseño.</small></span><input type="checkbox" id="ck-exp"></label>
      </div>
      <div class="ck-acciones">
        <button type="button" class="ck-igual" data-ck="rechazar">Rechazar opcionales</button>
        <button type="button" class="ck-igual" data-ck="aceptar">Aceptar todas</button>
        <button type="button" data-ck="personalizar" aria-expanded="false" aria-controls="ck-opciones">Personalizar</button>
      </div>`;
    document.body.appendChild(panel);

    panel.addEventListener('click', e => {
      const accion = e.target.closest('[data-ck]');
      if (!accion) return;
      const tipo = accion.dataset.ck;
      if (tipo === 'aceptar') decidir(true, true);
      else if (tipo === 'rechazar') decidir(false, false);
      else if (tipo === 'personalizar') {
        if (!expandido) alternar(true);
        else decidir(panel.querySelector('#ck-est').checked, panel.querySelector('#ck-exp').checked);
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !panel.hidden && leer()) cerrar();
    });
    return panel;
  }

  function alternar(abrir) {
    expandido = abrir;
    const boton = panel.querySelector('[data-ck="personalizar"]');
    panel.querySelector('#ck-opciones').hidden = !abrir;
    boton.textContent = abrir ? 'Guardar selección' : 'Personalizar';
    boton.setAttribute('aria-expanded', String(abrir));
  }

  function decidir(estadisticas, experiencia) {
    const previas = leer();
    const prefs = guardar(estadisticas, experiencia);
    cerrar();
    aplicar(prefs, previas);
  }

  function cerrar() {
    if (panel) panel.hidden = true;
  }

  function abrir(enfocar) {
    construir();
    const actuales = leer();
    panel.querySelector('#ck-est').checked = !!(actuales && actuales.estadisticas);
    panel.querySelector('#ck-exp').checked = !!(actuales && actuales.experiencia);
    alternar(!!actuales);
    panel.hidden = false;
    if (enfocar) panel.querySelector('#ck-titulo').focus();
  }

  /* ---------- Inicio ---------- */
  function iniciar() {
    const prefs = leer();
    if (prefs) aplicar(prefs, null); else abrir(false);

    document.addEventListener('click', e => {
      const enlace = e.target.closest('[data-cookie-settings]');
      if (!enlace) return;
      e.preventDefault();
      abrir(true);
    });
  }

  window.CampiperCookies = { abrir: () => abrir(true), estado: leer };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();