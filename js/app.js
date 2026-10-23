/* =========================================================
   Campiper — JavaScript compartido por todas las páginas
   Cada función solo se ejecuta si encuentra sus elementos.
   ========================================================= */

/* =========================================================
   FIREBASE (Authentication + Firestore)
   ========================================================= */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDicr1FaMUZMtKT_qThtaKv_TFGdeYhFpE",
  authDomain: "campiper-7414d.firebaseapp.com",
  projectId: "campiper-7414d",
  storageBucket: "campiper-7414d.firebasestorage.app",
  messagingSenderId: "984212599762",
  appId: "1:984212599762:web:0a0299a4350edcb2818e0b"
};
const FIREBASE_VERSION = '10.13.1';
const FIREBASE_ACTIVO = !String(FIREBASE_CONFIG.apiKey).startsWith('PEGA');

// Curso al que se inscribe automáticamente o manualmente.
const CURSO_ID = 'davinci-resolve';

// Carga Firebase dinámicamente cuando hace falta
let _firebase = null;
function cargarFirebase() {
  if (!_firebase) {
    const base = 'https://www.gstatic.com/firebasejs/' + FIREBASE_VERSION + '/';
    _firebase = Promise.all([
      import(base + 'firebase-app.js'),
      import(base + 'firebase-auth.js'),
      import(base + 'firebase-firestore.js')
    ]).then(([appMod, authMod, fsMod]) => {
      const app = appMod.initializeApp(FIREBASE_CONFIG);
      return { auth: authMod.getAuth(app), db: fsMod.getFirestore(app), authMod: authMod, fsMod: fsMod };
    }).catch(error => {
      _firebase = null;
      throw error;
    });
  }
  return _firebase;
}

/* ---------- Sesión en LocalStorage ---------- */
const Sesion = {
  CLAVE: 'campiper_sesion',
  obtener() {
    try { return JSON.parse(localStorage.getItem(this.CLAVE)); } catch (e) { return null; }
  },
  iniciar(usuario) {
    try { localStorage.setItem(this.CLAVE, JSON.stringify(usuario)); } catch (e) {}
  },
  cerrar() {
    try { localStorage.removeItem(this.CLAVE); } catch (e) {}
  }
};

function nombreDesdeCorreo(correo) {
  return String(correo || '').split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, letra => letra.toUpperCase());
}

/* ---------- Gestión de Cuentas (Firebase / Demo) ---------- */
function cuentasFirebase() {
  const datosUsuario = u => ({ nombre: u.displayName || nombreDesdeCorreo(u.email), correo: u.email || '' });

  async function guardarPerfil(usuario, nombre, extra) {
    try {
      const { db, fsMod } = await cargarFirebase();
      const ref = fsMod.doc(db, 'users', usuario.uid);
      const datos = Object.assign({ nombre: nombre || '', correo: usuario.email || '' }, extra || {});
      
      const existente = await fsMod.getDoc(ref);

      if (!datos.creadoEn) {
        if (!existente.exists() || !existente.data().creadoEn) {
          const creacion = usuario.metadata && usuario.metadata.creationTime ? new Date(usuario.metadata.creationTime) : null;
          datos.creadoEn = creacion && !isNaN(creacion.getTime())
            ? fsMod.Timestamp.fromDate(creacion)
            : fsMod.serverTimestamp();
        }
      }

      // [CAMBIO PAGOS] Ya no se inscribe automáticamente: el curso lo activa el pago
      // (verificación con Apps Script, ver apps-script/Codigo.gs) o un administrador desde admin.html.

      await fsMod.setDoc(ref, datos, { merge: true });
    } catch (error) {
      console.error('No se pudo guardar el perfil en Firestore:', error);
    }
  }

  return {
    async registrar(nombre, correo, clave) {
      const { auth, authMod, fsMod } = await cargarFirebase();
      const credencial = await authMod.createUserWithEmailAndPassword(auth, correo, clave);
      await authMod.updateProfile(credencial.user, { displayName: nombre });
      await guardarPerfil(credencial.user, nombre, { creadoEn: fsMod.serverTimestamp() });
      Sesion.iniciar({ nombre: nombre, correo: correo });
    },
    async entrar(correo, clave) {
      const { auth, authMod } = await cargarFirebase();
      const credencial = await authMod.signInWithEmailAndPassword(auth, correo, clave);
      Sesion.iniciar(datosUsuario(credencial.user));
    },
    async entrarConGoogle() {
      const { auth, authMod } = await cargarFirebase();
      const proveedor = new authMod.GoogleAuthProvider();
      proveedor.setCustomParameters({ prompt: 'select_account' });
      
      const credencial = await authMod.signInWithPopup(auth, proveedor);
      await guardarPerfil(credencial.user, credencial.user.displayName);
      Sesion.iniciar(datosUsuario(credencial.user));
    },
    async recuperar(correo) {
      const { auth, authMod } = await cargarFirebase();
      try {
        await authMod.sendPasswordResetEmail(auth, correo);
      } catch (error) {
        if (error.code !== 'auth/user-not-found') throw error;
      }
    },
    async salir() {
      try {
        const { auth, authMod } = await cargarFirebase();
        await authMod.signOut(auth);
      } finally {
        Sesion.cerrar();
      }
    },
    alCambiar(callback) {
      cargarFirebase().then(({ auth, authMod }) => {
        authMod.onAuthStateChanged(auth, usuario => callback(usuario ? datosUsuario(usuario) : null));
      }).catch(() => callback(Sesion.obtener()));
    }
  };
}

function cuentasDemo() {
  const CLAVE_USUARIOS = 'campiper_usuarios';
  function leerUsuarios() {
    try { return JSON.parse(localStorage.getItem(CLAVE_USUARIOS)) || {}; } catch (e) { return {}; }
  }
  function guardarUsuario(correo, nombre) {
    try {
      const usuarios = leerUsuarios();
      usuarios[correo] = { nombre: nombre };
      localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(usuarios));
    } catch (e) {}
  }

  return {
    async registrar(nombre, correo) {
      guardarUsuario(correo, nombre);
      Sesion.iniciar({ nombre: nombre, correo: correo });
    },
    async entrar(correo) {
      const cuenta = leerUsuarios()[correo];
      Sesion.iniciar({ nombre: cuenta ? cuenta.nombre : nombreDesdeCorreo(correo), correo: correo });
    },
    async entrarConGoogle() {
      Sesion.iniciar({ nombre: 'Estudiante', correo: '' });
    },
    async recuperar() {},
    async salir() {
      Sesion.cerrar();
    },
    alCambiar(callback) {
      callback(Sesion.obtener());
    }
  };
}

const Cuentas = FIREBASE_ACTIVO ? cuentasFirebase() : cuentasDemo();

/* ---------- Control UI de Sesión ---------- */
function pintarSesion(usuario) {
  document.querySelectorAll('[data-solo="visitante"]').forEach(el => { el.hidden = !!usuario; });
  document.querySelectorAll('[data-solo="usuario"]').forEach(el => { el.hidden = !usuario; });

  if (usuario) {
    const nombre = (usuario.nombre || '').trim() || 'Estudiante';
    const iniciales = nombre.split(/\s+/).slice(0, 2).map(p => p.charAt(0).toUpperCase()).join('');
    document.querySelectorAll('[data-usuario-nombre]').forEach(el => { el.textContent = nombre; });
    document.querySelectorAll('[data-usuario-inicial]').forEach(el => { el.textContent = iniciales; });
  }
}

function initSesion() {
  const guardada = Sesion.obtener();
  const requiereSesion = document.body.hasAttribute('data-requiere-sesion');

  if (!requiereSesion || guardada) pintarSesion(guardada);

  Cuentas.alCambiar(usuario => {
    if (usuario) Sesion.iniciar(usuario); else Sesion.cerrar();
    if (requiereSesion && !usuario) {
      window.location.replace('registro.html');
      return;
    }
    pintarSesion(usuario);
  });

  document.querySelectorAll('[data-salir]').forEach(boton => {
    boton.addEventListener('click', async (e) => {
      e.preventDefault();
      try { await Cuentas.salir(); } catch (e) { Sesion.cerrar(); }
      window.location.href = 'index.html';
    });
  });
}

/* ---------- Botón "Panel admin" (solo para administradores) ----------
   No guardamos la lista de correos en el navegador. Para saber si la cuenta
   es admin hacemos la misma lectura que hace admin.html (traer 1 documento de
   "users"): las reglas de Firestore la permiten solo a los administradores.
   Si Firestore responde "permission-denied", la persona no es admin. */
const CACHE_ADMIN = 'campiper_es_admin';

async function consultarEsAdmin(uid) {
  const { db, fsMod } = await cargarFirebase();
  try {
    await fsMod.getDocs(fsMod.query(fsMod.collection(db, 'users'), fsMod.limit(1)));
    return true;
  } catch (error) {
    if (error && error.code === 'permission-denied') return false;
    throw error;
  }
}

async function initBotonAdmin() {
  const botones = document.querySelectorAll('[data-admin-link]');
  if (botones.length === 0 || !FIREBASE_ACTIVO) return;

  const mostrar = visible => botones.forEach(b => { b.hidden = !visible; });

  // Pintado inmediato con el último resultado conocido (evita parpadeo)
  let cache = null;
  try { cache = JSON.parse(sessionStorage.getItem(CACHE_ADMIN)); } catch (e) {}

  try {
    const { auth, authMod } = await cargarFirebase();
    authMod.onAuthStateChanged(auth, async usuario => {
      if (!usuario) {
        try { sessionStorage.removeItem(CACHE_ADMIN); } catch (e) {}
        mostrar(false);
        return;
      }
      if (cache && cache.uid === usuario.uid) mostrar(cache.admin);
      try {
        const admin = await consultarEsAdmin(usuario.uid);
        cache = { uid: usuario.uid, admin: admin };
        try { sessionStorage.setItem(CACHE_ADMIN, JSON.stringify(cache)); } catch (e) {}
        mostrar(admin);
      } catch (error) {
        console.error('No se pudo verificar el rol de administrador:', error);
        mostrar(false);
      }
    });
  } catch (error) {
    console.error('No se pudo iniciar la verificación de administrador:', error);
  }
}

/* ---------- [CAMBIO PAGOS] Compra del curso (botones con data-comprar) ----------
   Sin sesión → registro. Con sesión → pasarela de Mercado Pago.
   PAGOS_API = URL de la aplicación web de Google Apps Script
   (apps-script/Codigo.gs), tipo https://script.google.com/macros/s/XXXX/exec
   Mientras esté vacía se usa el enlace fijo de data-pago-fallback
   (se puede pagar, pero el curso NO se activa solo). */
const PAGOS_API = 'https://script.google.com/macros/s/AKfycbyWBoY4N3z98bf6WS0uIDbR2oG3RcVbAGlOqmPVGnGyQJSVuEpebliDLtJSYuqLZQwZ6Q/exec';

// El ID token va en el cuerpo (Apps Script no lee cabeceras personalizadas).
// Sin Content-Type el navegador envía text/plain y no exige preflight CORS.
async function llamarPagos(accion, usuario) {
  const idToken = await usuario.getIdToken();
  const respuesta = await fetch(PAGOS_API, {
    method: 'POST',
    body: JSON.stringify({ accion: accion, idToken: idToken })
  });
  let datos = {};
  try { datos = JSON.parse(await respuesta.text()); } catch (e) {}
  if (!datos.ok) throw new Error(datos.error || 'No se pudo completar la acción');
  return datos;
}

function esperarUsuarioFirebase() {
  return cargarFirebase().then(({ auth, authMod }) => new Promise(resolve => {
    const cancelar = authMod.onAuthStateChanged(auth, usuario => { cancelar(); resolve(usuario); });
  }));
}

function initCompra() {
  const botones = document.querySelectorAll('[data-comprar]');
  if (botones.length === 0) return;

  window.addEventListener('pageshow', () => botones.forEach(b => b.removeAttribute('aria-busy')));

  botones.forEach(boton => {
    boton.addEventListener('click', async (e) => {
      e.preventDefault();
      if (boton.getAttribute('aria-busy') === 'true') return;
      boton.setAttribute('aria-busy', 'true');

      try {
        const usuario = FIREBASE_ACTIVO ? await esperarUsuarioFirebase() : Sesion.obtener();
        if (!usuario) { window.location.href = 'registro.html?modo=registro'; return; }

        if (!PAGOS_API || !FIREBASE_ACTIVO) {
          window.location.href = boton.dataset.pagoFallback || 'mis-cursos.html';
          return;
        }

        const datos = await llamarPagos('crear', usuario);
        window.location.href = datos.yaInscrito ? 'mis-cursos.html' : datos.url;
      } catch (error) {
        console.error('No se pudo iniciar el pago:', error);
        alert('No pudimos iniciar el pago. Inténtalo de nuevo en unos segundos.');
        boton.removeAttribute('aria-busy');
      }
    });
  });
}

/* ---------- [CAMBIO INSCRITO] Index: qué ve quien ya pagó el curso ----------
   Oculta la oferta (precio y cuenta regresiva) y convierte el botón
   "Empezar el curso" en "Continuar el curso", que lleva a leccion.html. */
const CACHE_INSCRITO = 'campiper_inscrito';

function aplicarEstadoInscrito(inscrito) {
  document.querySelectorAll('[data-oferta]').forEach(el => { el.hidden = inscrito; });
  const boton = document.getElementById('btn-oferta');
  if (boton) {
    boton.dataset.inscrito = inscrito ? 'true' : 'false';
    const texto = document.getElementById('btn-oferta-texto');
    if (texto) texto.textContent = inscrito ? 'Continuar el curso' : 'Empezar el curso';
  }
}

async function initAccesoCurso() {
  if (!document.getElementById('btn-oferta') && !document.querySelector('[data-oferta]')) return;
  if (!FIREBASE_ACTIVO) return;

  // Pintado inmediato con el último resultado conocido (evita parpadeo)
  const guardada = Sesion.obtener();
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_INSCRITO));
    if (cache && guardada && cache.correo === String(guardada.correo || '').toLowerCase()) {
      aplicarEstadoInscrito(!!cache.inscrito);
    }
  } catch (e) {}

  try {
    const { auth, db, authMod, fsMod } = await cargarFirebase();
    authMod.onAuthStateChanged(auth, async usuario => {
      if (!usuario) {
        try { localStorage.removeItem(CACHE_INSCRITO); } catch (e) {}
        aplicarEstadoInscrito(false);
        return;
      }
      try {
        const doc = await fsMod.getDoc(fsMod.doc(db, 'users', usuario.uid));
        const cursos = doc.exists() && Array.isArray(doc.data().cursos) ? doc.data().cursos : [];
        const inscrito = cursos.includes(CURSO_ID);
        try {
          localStorage.setItem(CACHE_INSCRITO, JSON.stringify({ correo: String(usuario.email || '').toLowerCase(), inscrito: inscrito }));
        } catch (e) {}
        aplicarEstadoInscrito(inscrito);
      } catch (error) {
        console.error('No se pudo comprobar la inscripción:', error);
      }
    });
  } catch (error) {
    console.error('No se pudo iniciar la comprobación de inscripción:', error);
  }
}

/* ---------- Efectos Reutilizables ---------- */
const Efectos = {
  revelar() {},
  ripple() {}
};

function inyectarEstilosBase() {
  if (document.getElementById('campiper-estilos-base')) return;
  const estilo = document.createElement('style');
  estilo.id = 'campiper-estilos-base';
  estilo.textContent = `
    [data-solo][hidden], [data-admin-link][hidden], [data-oferta][hidden] { display: none !important; }
    [data-comprar][aria-busy="true"] { opacity: 0.6; pointer-events: none; }
    .auth-status { margin: 0.75rem 0 0; font-size: 0.9rem; line-height: 1.4; }
    .auth-status[hidden] { display: none; }
    .dashboard-grid[hidden], .empty-courses[hidden], .courses-loading[hidden], .enroll-feedback[hidden] { display: none !important; }
    .auth-status--error { color: #ff8a8a; }
    input[aria-invalid="true"] { border-color: #ff8a8a !important; }
    .catalog-empty { grid-column: 1 / -1; text-align: center; opacity: 0.85; }
    .catalog-empty--error { color: #ff8a8a; opacity: 1; }
  `;
  document.head.appendChild(estilo);
}

function escaparHTML(valor) {
  return String(valor == null ? '' : valor).replace(/[&<>"']/g, caracter => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[caracter]));
}

/* ---------- Catálogo desde Firestore ---------- */
async function initCatalogo() {
  const grid = document.getElementById('course-grid');
  if (!grid) return;

  const IMAGEN_POR_DEFECTO = 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
  const botonesFiltro = document.querySelectorAll('.filter-btn');

  function mostrarMensaje(texto, esError) {
    grid.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'catalog-empty' + (esError ? ' catalog-empty--error' : '');
    p.textContent = texto;
    grid.appendChild(p);
  }

  function crearTarjeta(curso) {
    const tarjeta = document.createElement('article');
    tarjeta.className = 'course-card';
    tarjeta.innerHTML = `
      <div class="course-card-media">
        <img src="${escaparHTML(curso.imagen || IMAGEN_POR_DEFECTO)}" alt="${escaparHTML(curso.titulo)}" loading="lazy">
        <span class="badge">${escaparHTML(curso.nivel || 'Módulo')}</span>
      </div>
      <div class="course-card-body">
        <h3>${escaparHTML(curso.titulo || 'Sin título')}</h3>
        <p>${escaparHTML(curso.descripcion || 'Sin descripción')}</p>
        <div class="course-card-footer">
          <span class="course-card-price">${escaparHTML(curso.precio || '')}</span>
          <a class="button" href="detalle.html?modulo=${encodeURIComponent(curso.id)}">Ver detalle</a>
        </div>
      </div>
    `;
    return tarjeta;
  }

  function renderizarCursos(cursos) {
    if (cursos.length === 0) {
      mostrarMensaje('No hay cursos disponibles en esta categoría.');
      return;
    }
    grid.innerHTML = '';
    const tarjetas = cursos.map(crearTarjeta);
    tarjetas.forEach(tarjeta => grid.appendChild(tarjeta));
    Efectos.revelar(tarjetas);
    Efectos.ripple(grid.querySelectorAll('button, .button'));
  }

  function configurarFiltros(cursos) {
    botonesFiltro.forEach(boton => {
      boton.addEventListener('click', () => {
        botonesFiltro.forEach(btn => btn.classList.remove('active'));
        boton.classList.add('active');

        const categoria = boton.getAttribute('data-filter');
        if (!categoria || categoria === 'todos') {
          renderizarCursos(cursos);
        } else {
          renderizarCursos(cursos.filter(curso => curso.categoria === categoria));
        }
      });
    });
  }

  mostrarMensaje('Cargando cursos desde la base de datos...');

  try {
    const { db, fsMod } = await cargarFirebase();
    const resultado = await fsMod.getDocs(fsMod.collection(db, 'cursos'));

    const cursos = [];
    resultado.forEach(doc => {
      const data = doc.data();
      cursos.push({
        id: doc.id,
        titulo: data.titulo,
        categoria: data.categoria || 'edicion',
        nivel: data.nivel,
        precio: data.precio || '',
        imagen: data.imagen,
        descripcion: data.descripcion
      });
    });

    if (cursos.length === 0) {
      mostrarMensaje('No hay cursos publicados todavía. Ve al Admin a crear uno.');
      return;
    }

    renderizarCursos(cursos);
    configurarFiltros(cursos);
  } catch (error) {
    console.error('Error al cargar cursos de Firebase:', error);
    mostrarMensaje('Error de conexión. Revisa la consola.', true);
  }
}

/* ---------- Precio del curso desde Firestore ---------- */
const PRECIO_CACHE = 'campiper_precio';

function aNumeroPrecio(valor) {
  const numero = typeof valor === 'number' ? valor : Number(String(valor == null ? '' : valor).replace(/\D/g, ''));
  return Number.isFinite(numero) && numero > 0 ? numero : null;
}

function formatoPrecio(numero) {
  return '$' + String(Math.round(numero)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function pintarPrecio(datos) {
  const precio = aNumeroPrecio(datos && datos.precio);
  if (!precio) return;
  const anterior = aNumeroPrecio(datos.precioAnterior);
  const hayDescuento = !!anterior && anterior > precio;

  document.querySelectorAll('[data-precio]').forEach(el => { el.textContent = formatoPrecio(precio); });
  document.querySelectorAll('[data-precio-descuento]').forEach(el => { el.hidden = !hayDescuento; });
  if (hayDescuento) {
    document.querySelectorAll('[data-precio-anterior]').forEach(el => { el.textContent = formatoPrecio(anterior); });
    document.querySelectorAll('[data-precio-ahorro]').forEach(el => { el.textContent = formatoPrecio(anterior - precio); });
  }
}

async function initPrecio() {
  if (!document.querySelector('[data-precio]')) return;

  try {
    const guardado = JSON.parse(localStorage.getItem(PRECIO_CACHE));
    if (guardado) pintarPrecio(guardado);
  } catch (e) {}

  if (!FIREBASE_ACTIVO) return;

  try {
    const { db, fsMod } = await cargarFirebase();
    const documento = await fsMod.getDoc(fsMod.doc(db, 'config', 'curso'));
    if (!documento.exists()) return;
    const datos = documento.data();
    pintarPrecio(datos);
    try {
      localStorage.setItem(PRECIO_CACHE, JSON.stringify({ precio: datos.precio, precioAnterior: datos.precioAnterior }));
    } catch (e) {}
  } catch (error) {
    console.error('No se pudo cargar el precio desde Firestore:', error);
  }
}

/* ---------- Mis cursos: el curso aparece solo si el usuario está inscrito ---------- */
async function initMisCursos() {
  const panel = document.getElementById('courses-dashboard');
  if (!panel) return;

  const cargando = document.getElementById('courses-loading');
  const vacio = document.getElementById('empty-courses');
  const contador = document.getElementById('courses-count');
  const estado = document.getElementById('course-status');
  const porcentaje = document.getElementById('course-progress-text');
  const barra = document.getElementById('course-progress-bar');
  const barraInterna = barra ? barra.querySelector('span') : null;
  const certTexto = document.getElementById('certificate-progress-text');
  const certBarra = document.getElementById('certificate-progress-bar');

  // [CAMBIO PAGOS] Al volver de Mercado Pago (?pago=ok | pendiente) esperamos a que el servidor active el curso
  const retornoPago = new URLSearchParams(window.location.search).get('pago');
  let esperaTerminada = false;
  let ultimoEstado = { inscrito: false, progreso: 0 };

  function mostrar(inscrito, progreso) {
    ultimoEstado = { inscrito: inscrito, progreso: progreso };
    const esperandoPago = !inscrito && !esperaTerminada && (retornoPago === 'ok' || retornoPago === 'pendiente');
    let aviso = '';
    if (esperandoPago) {
      aviso = retornoPago === 'pendiente'
        ? 'Tu pago está pendiente de confirmación. Cuando se apruebe, tu curso aparecerá aquí automáticamente.'
        : 'Estamos confirmando tu pago. Tu curso aparecerá aquí en unos segundos…';
    } else if (!inscrito && retornoPago === 'ok') {
      aviso = 'Si ya pagaste y aún no ves tu curso, pulsa «Ya pagué, verificar mi pago» o escríbenos a soporte@campiper.com antes de volver a pagar.';
    }
    if (cargando) { cargando.textContent = aviso; cargando.hidden = !aviso; }
    panel.hidden = !inscrito;
    if (vacio) vacio.hidden = inscrito || esperandoPago;
    if (contador) contador.textContent = inscrito ? '1 curso activo' : '0 cursos';
    if (!inscrito) return;

    const pct = Number.isFinite(progreso) ? Math.max(0, Math.min(100, Math.round(progreso))) : 0;
    if (estado) estado.textContent = pct > 0 ? 'Llevas el ' + pct + ' % del curso' : 'Listo para empezar';
    if (porcentaje) porcentaje.textContent = pct + '%';
    if (barra) {
      barra.setAttribute('aria-valuenow', pct);
      barra.setAttribute('aria-label', pct + ' por ciento completado');
    }
    if (barraInterna) barraInterna.style.width = pct + '%';
    if (certTexto) certTexto.textContent = pct + ' % COMPLETADO';
    if (certBarra) certBarra.style.width = pct + '%';
  }

  if (retornoPago === 'ok') { // [CAMBIO PAGOS]
    setTimeout(() => { esperaTerminada = true; mostrar(ultimoEstado.inscrito, ultimoEstado.progreso); }, 45000);
  }

  // [CAMBIO PAGOS] Sin servidor propio: le preguntamos al Apps Script si ya hay un pago aprobado
  // de esta cuenta. Si lo hay, él activa el curso en Firestore y onSnapshot actualiza la pantalla.
  let verificando = false;
  async function verificarPago() {
    if (!PAGOS_API || !FIREBASE_ACTIVO || verificando) return null;
    verificando = true;
    try {
      const usuario = await esperarUsuarioFirebase();
      if (!usuario) return null;
      const datos = await llamarPagos('verificar', usuario);
      return datos.estado; // 'activo' | 'pendiente' | 'ninguno'
    } catch (error) {
      console.error('No se pudo verificar el pago:', error);
      return null;
    } finally {
      verificando = false;
    }
  }

  let verificacionIniciada = false;
  function iniciarVerificacion() {
    if (verificacionIniciada) return;
    verificacionIniciada = true;
    verificarPago(); // una vez al entrar sin curso
    if (retornoPago === 'ok') { // recién pagado: reintentar mientras Mercado Pago lo registra
      const inicio = Date.now();
      const temporizador = setInterval(() => {
        if (ultimoEstado.inscrito || Date.now() - inicio > 45000) { clearInterval(temporizador); return; }
        verificarPago();
      }, 7000);
    }
  }

  const btnVerificar = document.getElementById('btn-verificar-pago');
  const avisoVerificar = document.getElementById('verificar-pago-aviso');
  function avisarVerificacion(texto) {
    if (!avisoVerificar) return;
    avisoVerificar.textContent = texto;
    avisoVerificar.hidden = !texto;
  }
  if (btnVerificar) {
    btnVerificar.addEventListener('click', async () => {
      if (!PAGOS_API) {
        avisarVerificacion('La verificación automática aún no está activa. Escríbenos a soporte@campiper.com.');
        return;
      }
      btnVerificar.disabled = true;
      avisarVerificacion('Verificando tu pago…');
      const estado = await verificarPago();
      btnVerificar.disabled = false;
      if (estado === 'activo') avisarVerificacion('¡Pago confirmado! Tu curso se está activando…');
      else if (estado === 'pendiente') avisarVerificacion('Tu pago aún está pendiente de confirmación. Cuando se apruebe, vuelve a pulsar este botón.');
      else if (estado === 'ninguno') avisarVerificacion('No encontramos un pago aprobado en tu cuenta. Si acabas de pagar, espera un minuto e inténtalo de nuevo.');
      else avisarVerificacion('No pudimos verificar el pago. Inténtalo de nuevo en unos segundos.');
    });
  }

  if (!FIREBASE_ACTIVO) { mostrar(true, 45); return; }

  try {
    const { auth, db, authMod, fsMod } = await cargarFirebase();

    const usuario = await new Promise(resolve => {
      const cancelar = authMod.onAuthStateChanged(auth, u => { cancelar(); resolve(u); });
    });
    if (!usuario) return;

    fsMod.onSnapshot(fsMod.doc(db, 'users', usuario.uid), snap => {
      const datos = snap.exists() ? snap.data() : {};
      const cursos = Array.isArray(datos.cursos) ? datos.cursos : [];
      mostrar(cursos.includes(CURSO_ID), Number(datos.progreso != null ? datos.progreso : datos.progress));
      if (!cursos.includes(CURSO_ID)) iniciarVerificacion(); // [CAMBIO PAGOS]
    }, error => {
      console.error('No se pudo leer la inscripción:', error);
      if (cargando) { cargando.textContent = 'No pudimos cargar tus cursos. Recarga la página.'; cargando.hidden = false; }
    });
  } catch (error) {
    console.error('Error al cargar Mis cursos:', error);
    if (cargando) { cargando.textContent = 'No pudimos cargar tus cursos. Recarga la página.'; cargando.hidden = false; }
  }
}

/* ---------- Autenticación (Login / Registro) ---------- */
function initAuth() {
  const PAGINA_DESTINO = 'mis-cursos.html';
  const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  let mode = 'login';

  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const kickerText = document.getElementById('auth-kicker-text');
  const titleText = document.getElementById('auth-title-text');
  const subtitleText = document.getElementById('auth-subtitle-text');

  const fieldName = document.getElementById('field-name');
  const fieldPasswordRepeat = document.getElementById('field-password-repeat');
  const btnForgotPassword = document.getElementById('btn-forgot-password');
  const passwordHelper = document.getElementById('password-helper');
  const submitBtn = document.getElementById('auth-submit-btn');

  const switchLabel = document.getElementById('switch-label');
  const btnSwitchMode = document.getElementById('btn-switch-mode');

  const form = document.getElementById('auth-form');
  const btnGoogle = document.getElementById('btn-google');

  const passwordInput = document.getElementById('password');
  const btnTogglePassword = document.getElementById('btn-toggle-password');
  const togglePasswordText = document.getElementById('toggle-password-text');

  const nameInput = fieldName ? fieldName.querySelector('input') : null;
  const repeatInput = fieldPasswordRepeat ? fieldPasswordRepeat.querySelector('input') : null;
  const emailInput = form ? form.querySelector('input[type="email"], #email, input[name="email"]') : null;

  const reglas = new Map();
  let statusEl = null;

  function updateAuthUI() {
    if (mode === 'login') {
      if (tabLogin) { tabLogin.classList.add('active'); tabLogin.setAttribute('aria-selected', 'true'); }
      if (tabRegister) { tabRegister.classList.remove('active'); tabRegister.setAttribute('aria-selected', 'false'); }

      if (kickerText) kickerText.textContent = 'QUÉ BUENO VERTE';
      if (titleText) titleText.textContent = 'Bienvenido de nuevo';
      if (subtitleText) subtitleText.textContent = 'Entra con tu correo y contraseña.';

      if (fieldName) fieldName.style.display = 'none';
      if (fieldPasswordRepeat) fieldPasswordRepeat.style.display = 'none';
      if (btnForgotPassword) btnForgotPassword.style.display = 'inline-block';
      if (passwordHelper) passwordHelper.style.display = 'none';

      if (submitBtn) submitBtn.textContent = 'Iniciar sesión';
      if (switchLabel) switchLabel.textContent = '¿Aún no tienes cuenta?';
      if (btnSwitchMode) btnSwitchMode.textContent = 'Crear cuenta';
      document.title = 'Iniciar sesión - Campiper';
    } else {
      if (tabRegister) { tabRegister.classList.add('active'); tabRegister.setAttribute('aria-selected', 'true'); }
      if (tabLogin) { tabLogin.classList.remove('active'); tabLogin.setAttribute('aria-selected', 'false'); }

      if (kickerText) kickerText.textContent = 'EMPIEZA A CREAR';
      if (titleText) titleText.textContent = 'Crea tu cuenta';
      if (subtitleText) subtitleText.textContent = 'Tu nombre, un correo y una contraseña.';

      if (fieldName) fieldName.style.display = 'grid';
      if (fieldPasswordRepeat) fieldPasswordRepeat.style.display = 'grid';
      if (btnForgotPassword) btnForgotPassword.style.display = 'none';
      if (passwordHelper) passwordHelper.style.display = 'block';

      if (submitBtn) submitBtn.textContent = 'Crear cuenta';
      if (switchLabel) switchLabel.textContent = '¿Ya tienes cuenta?';
      if (btnSwitchMode) btnSwitchMode.textContent = 'Iniciar sesión';
      document.title = 'Crear cuenta - Campiper';
    }
    limpiarErrores();
  }

  if (tabLogin) tabLogin.addEventListener('click', () => { mode = 'login'; updateAuthUI(); });
  if (tabRegister) tabRegister.addEventListener('click', () => { mode = 'register'; updateAuthUI(); });
  if (btnSwitchMode) btnSwitchMode.addEventListener('click', () => {
    mode = mode === 'login' ? 'register' : 'login';
    updateAuthUI();
  });

  if (btnTogglePassword && passwordInput) {
    let passwordVisible = false;
    btnTogglePassword.addEventListener('click', () => {
      passwordVisible = !passwordVisible;
      passwordInput.type = passwordVisible ? 'text' : 'password';
      if (togglePasswordText) togglePasswordText.textContent = passwordVisible ? 'Ocultar' : 'Mostrar';
      btnTogglePassword.setAttribute('aria-label', passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña');
    });
  }

  if (!emailInput) return;

  statusEl = document.getElementById('auth-status');
  if (!statusEl && submitBtn) {
    statusEl = document.createElement('p');
    statusEl.id = 'auth-status';
    statusEl.className = 'auth-status';
    statusEl.setAttribute('role', 'status');
    statusEl.setAttribute('aria-live', 'polite');
    statusEl.hidden = true;
    submitBtn.insertAdjacentElement('afterend', statusEl);
  }

  function mostrarEstado(mensaje, tipo) {
    if (!statusEl) return;
    statusEl.textContent = mensaje || '';
    statusEl.hidden = !mensaje;
    statusEl.classList.toggle('auth-status--error', tipo === 'error');
  }

  if (nameInput) reglas.set(nameInput, () => nameInput.value.trim().length < 2 ? 'Escribe tu nombre.' : '');
  reglas.set(emailInput, () => {
    const valor = emailInput.value.trim();
    if (!valor) return 'Escribe tu correo electrónico.';
    if (!REGEX_CORREO.test(valor)) return 'Revisa el correo: debe verse como nombre@correo.com.';
    return '';
  });
  if (passwordInput) {
    reglas.set(passwordInput, () => {
      if (!passwordInput.value) return mode === 'login' ? 'Escribe tu contraseña.' : 'Crea una contraseña.';
      if (mode === 'register' && passwordInput.value.length < 8) return 'Usa al menos 8 caracteres.';
      return '';
    });
  }
  if (repeatInput) {
    reglas.set(repeatInput, () => {
      if (!repeatInput.value) return 'Repite la contraseña.';
      if (repeatInput.value !== passwordInput.value) return 'Las contraseñas no coinciden.';
      return '';
    });
  }

  function huecoDeError(input) {
    return input.id ? document.getElementById(input.id + '-error') : null;
  }

  function marcar(input, mensaje) {
    if (mensaje) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    const hueco = huecoDeError(input);
    if (hueco) hueco.textContent = mensaje || '';
    return mensaje;
  }

  function limpiarErrores() {
    reglas.forEach((regla, input) => marcar(input, ''));
    mostrarEstado('');
  }

  function camposActivos() {
    return Array.from(reglas.keys()).filter(input =>
      mode === 'register' || (input !== nameInput && input !== repeatInput));
  }

  function validarCampos(campos) {
    const errores = campos
      .map(input => ({ input, mensaje: marcar(input, reglas.get(input)()) }))
      .filter(e => e.mensaje);
    if (errores.length === 0) return true;

    errores[0].input.focus();
    const sinHueco = errores.find(e => !huecoDeError(e.input));
    if (sinHueco) mostrarEstado(sinHueco.mensaje, 'error');
    return false;
  }

  reglas.forEach((regla, input) => {
    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') marcar(input, regla());
      if (statusEl && statusEl.classList.contains('auth-status--error')) mostrarEstado('');
      if (input === passwordInput && repeatInput && repeatInput.value) {
        marcar(repeatInput, reglas.get(repeatInput)());
      }
    });
  });

  function bloquear(boton, textoCargando) {
    boton.dataset.textoOriginal = boton.textContent;
    boton.disabled = true;
    boton.textContent = textoCargando;
  }
  function desbloquear(boton) {
    boton.disabled = false;
    if (boton.dataset.textoOriginal) boton.textContent = boton.dataset.textoOriginal;
  }

  function mensajeDeError(error) {
    const mensajes = {
      'auth/email-already-in-use': 'Ese correo ya tiene una cuenta. Prueba iniciando sesión.',
      'auth/invalid-credential': 'Correo o contraseña incorrectos.',
      'auth/invalid-login-credentials': 'Correo o contraseña incorrectos.',
      'auth/wrong-password': 'Correo o contraseña incorrectos.',
      'auth/user-not-found': 'Correo o contraseña incorrectos.',
      'auth/invalid-email': 'Revisa el correo: debe verse como nombre@correo.com.',
      'auth/weak-password': 'La contraseña es muy débil. Usa al menos 8 caracteres.',
      'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
      'auth/network-request-failed': 'No hay conexión. Revisa tu internet e inténtalo de nuevo.',
      'auth/popup-blocked': 'Tu navegador bloqueó la ventana de Google.',
      'auth/operation-not-allowed': 'Este método de acceso no está activado.',
      'auth/unauthorized-domain': 'Este dominio no está autorizado.'
    };
    return mensajes[error && error.code] || 'No pudimos completar la acción. Inténtalo de nuevo.';
  }

  function esCancelacion(error) {
    return error && (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request');
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      mostrarEstado('');
      if (!validarCampos(camposActivos())) return;

      const correo = emailInput.value.trim().toLowerCase();
      bloquear(submitBtn, mode === 'register' ? 'Creando cuenta…' : 'Entrando…');
      try {
        if (mode === 'register') {
          await Cuentas.registrar(nameInput ? nameInput.value.trim() : '', correo, passwordInput.value);
          mostrarEstado('Cuenta creada. Te llevamos a tus cursos…');
          setTimeout(() => { window.location.href = PAGINA_DESTINO; }, 900);
        } else {
          await Cuentas.entrar(correo, passwordInput.value);
          window.location.href = PAGINA_DESTINO;
        }
      } catch (error) {
        desbloquear(submitBtn);
        mostrarEstado(mensajeDeError(error), 'error');
      }
    });
  }

  if (btnForgotPassword) {
    btnForgotPassword.addEventListener('click', async (e) => {
      e.preventDefault();
      mostrarEstado('');

      const mensaje = marcar(emailInput, reglas.get(emailInput)());
      if (mensaje) {
        emailInput.focus();
        mostrarEstado('Escribe tu correo para enviarte el enlace de recuperación.', 'error');
        return;
      }

      const correo = emailInput.value.trim().toLowerCase();
      btnForgotPassword.disabled = true;
      try {
        await Cuentas.recuperar(correo);
        mostrarEstado('Si ' + correo + ' tiene una cuenta, te enviamos un enlace para crear una nueva contraseña.');
      } catch (error) {
        mostrarEstado(mensajeDeError(error), 'error');
      } finally {
        btnForgotPassword.disabled = false;
      }
    });
  }

  if (btnGoogle) {
    btnGoogle.addEventListener('click', async () => {
      mostrarEstado('');
      btnGoogle.disabled = true;
      mostrarEstado('Conectando con Google…');
      try {
        await Cuentas.entrarConGoogle();
        window.location.href = PAGINA_DESTINO;
      } catch (error) {
        btnGoogle.disabled = false;
        mostrarEstado(esCancelacion(error) ? '' : mensajeDeError(error), esCancelacion(error) ? '' : 'error');
      }
    });
  }

  const modo = new URLSearchParams(window.location.search).get('modo');
  if (modo === 'registro' || modo === 'register') {
    mode = 'register';
    updateAuthUI();
  }
}

/* =========================================================
   DOM CONTENT LOADED — INICIALIZACIÓN GENERAL
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 0. SESIÓN Y ESTILOS BASE
  inyectarEstilosBase();
  initSesion();
  initBotonAdmin();
  initCompra(); // [CAMBIO PAGOS]
  initAccesoCurso(); // [CAMBIO INSCRITO]

  // LÓGICA DE LA VENTANA MI PERFIL (MODAL)
  const btnMiPerfil = document.getElementById('btn-mi-perfil');
  const profileModal = document.getElementById('profile-modal-backdrop');
  const btnCloseProfile = document.getElementById('btn-close-profile-modal');

  if (btnMiPerfil && profileModal) {
    btnMiPerfil.addEventListener('click', (e) => {
      e.preventDefault();
      profileModal.style.display = 'flex';
      
      const usuarioActivo = Sesion.obtener();
      if (usuarioActivo) {
        const titleEl = document.getElementById('profile-modal-title');
        const emailEl = document.getElementById('profile-modal-email');
        const avatarEl = document.getElementById('profile-avatar');
        
        if (titleEl) titleEl.textContent = usuarioActivo.nombre || 'Estudiante';
        if (emailEl) emailEl.textContent = usuarioActivo.correo || 'Sin correo';
        
        if (avatarEl) {
          const iniciales = (usuarioActivo.nombre || 'Estudiante')
            .split(/\s+/)
            .slice(0, 2)
            .map(p => p.charAt(0).toUpperCase())
            .join('');
          avatarEl.textContent = iniciales;
        }
      }
    });

    if (btnCloseProfile) {
      btnCloseProfile.addEventListener('click', () => { profileModal.style.display = 'none'; });
    }
    profileModal.addEventListener('click', (e) => {
      if (e.target === profileModal) profileModal.style.display = 'none';
    });
  }

  // 1. EFECTOS GLOBALES Y DE SCROLL
  if (!isReducedMotion) {
    document.body.classList.add("motion-ready");

    const progress = document.createElement("div");
    progress.className = "page-progress";
    progress.setAttribute("aria-hidden", "true");
    document.body.appendChild(progress);

    const glow = document.createElement("div");
    glow.className = "ambient-pointer";
    glow.setAttribute("aria-hidden", "true");
    document.body.appendChild(glow);

    const revealSelectors = "main > section, .learning-card, .module, .hardware-row, .course-card, .lessons-panel, .active-course-card, .resources-card, .certificate-card, .auth-intro, .auth-card, .admin-stat-card, .report-card, .admin-panel";
    const revealItems = document.querySelectorAll(revealSelectors);
    
    revealItems.forEach((item, index) => {
      item.classList.add("scroll-reveal");
      item.style.setProperty("--reveal-delay", `${(index % 4) * 65}ms`);
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    revealItems.forEach((item) => observer.observe(item));

    Efectos.revelar = (items) => {
      Array.from(items).forEach((item, index) => {
        item.classList.add("scroll-reveal");
        item.style.setProperty("--reveal-delay", `${(index % 4) * 65}ms`);
        observer.observe(item);
      });
    };

    window.addEventListener("scroll", () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const amount = scrollable > 0 ? window.scrollY / scrollable : 0;
      progress.style.transform = `scaleX(${Math.min(1, Math.max(0, amount))})`;
    }, { passive: true });

    window.addEventListener("pointermove", (event) => {
      glow.style.setProperty("--pointer-x", `${event.clientX}px`);
      glow.style.setProperty("--pointer-y", `${event.clientY}px`);
      glow.classList.add("is-active");
    }, { passive: true });

    const attachRipple = (item) => {
      if (item.classList.contains("ripple-target")) return;
      item.classList.add("ripple-target");
      item.addEventListener("pointerdown", (event) => {
        const bounds = item.getBoundingClientRect();
        item.style.setProperty("--ripple-x", `${event.clientX - bounds.left}px`);
        item.style.setProperty("--ripple-y", `${event.clientY - bounds.top}px`);
        item.classList.remove("is-rippling");
        void item.offsetWidth; 
        item.classList.add("is-rippling");
        setTimeout(() => item.classList.remove("is-rippling"), 650);
      });
    };

    document.querySelectorAll("button, .button").forEach(attachRipple);
    Efectos.ripple = (items) => Array.from(items).forEach(attachRipple);
  }

  // 2. FONDO ANIMADO DEL TIMELINE (Inicio)
  const cinematicBg = document.querySelector('.cinematic-timeline');
  if (cinematicBg && !isReducedMotion) {
    let frame = 0;
    window.addEventListener("pointermove", (e) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 12;
        const y = (e.clientY / window.innerHeight - 0.5) * 8;
        cinematicBg.style.setProperty("--cinema-x", `${x}px`);
        cinematicBg.style.setProperty("--cinema-y", `${y}px`);
      });
    }, { passive: true });
  }

  // 3. MENÚ MÓVIL (Global)
  const mobileBtn = document.querySelector('.mobile-menu');
  const nav = document.querySelector('.navbar nav');
  const navLinks = document.querySelectorAll('.navbar nav a');

  if (mobileBtn && nav) {
    mobileBtn.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      mobileBtn.setAttribute('aria-expanded', isOpen);
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        mobileBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 4. ACORDEÓN DEL TEMARIO (Inicio)
  const modules = document.querySelectorAll('.module');
  modules.forEach((mod) => {
    const btn = mod.querySelector('.module-trigger');
    if (btn) {
      btn.addEventListener('click', () => {
        const wasOpen = mod.classList.contains('open');
        
        modules.forEach(m => {
          m.classList.remove('open');
          m.querySelector('.module-trigger').setAttribute('aria-expanded', 'false');
          m.querySelector('.module-content').setAttribute('aria-hidden', 'true');
        });

        if (!wasOpen) {
          mod.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
          mod.querySelector('.module-content').setAttribute('aria-hidden', 'false');
        }
      });
    }
  });

  // 5. BOTÓN SCROLL DIRECTO A OFERTA (Inicio)
  const btnOferta = document.getElementById('btn-oferta');
  if (btnOferta) {
    btnOferta.addEventListener('click', () => {
      // [CAMBIO INSCRITO] Quien ya pagó va directo a la lección
      if (btnOferta.dataset.inscrito === 'true') { window.location.href = 'leccion.html?leccion=1'; return; }
      document.querySelector('#oferta')?.scrollIntoView({ behavior: "smooth" });
    });
  }

  // 6. CUENTA REGRESIVA (Inicio)
  const hoursEl = document.getElementById('count-hours');
  const minsEl = document.getElementById('count-mins');
  const secsEl = document.getElementById('count-secs');

  if (hoursEl && minsEl && secsEl) {
    let remaining = 11 * 3600 + 42 * 60 + 18;
    
    setInterval(() => {
      remaining = remaining > 0 ? remaining - 1 : 24 * 3600;
      hoursEl.textContent = String(Math.floor(remaining / 3600)).padStart(2, "0");
      minsEl.textContent = String(Math.floor((remaining % 3600) / 60)).padStart(2, "0");
      secsEl.textContent = String(remaining % 60).padStart(2, "0");
    }, 1000);
  }

  // 7. LÓGICA DE LA PÁGINA DE DETALLE (detalle.html)
  if (document.querySelector('.detail-page')) {
    const modulesData = {
      "01": {
        label: "Primer módulo",
        title: "Primeros pasos en DaVinci Resolve",
        description: "Este módulo introductorio establece las bases para comenzar a utilizar el software, guiándote a través del proceso de instalación y su configuración inicial.",
        lessons: [
          "Instalación y configuración inicial",
          "Conociendo la interfaz: Media, Cut, Edit y Deliver",
          "Organización de tu primer proyecto y atajos de teclado"
        ],
        duration: "48 min"
      },
      "02": {
        label: "Segundo módulo",
        title: "Edición básica de video",
        description: "En esta sección aprenderás a dominar la edición básica manejando cortes, transiciones y la línea de tiempo.",
        lessons: [
          "Cortes, transiciones y uso de la línea de tiempo",
          "Trabajando con múltiples pistas de video",
          "Ajustes de velocidad y duración de clips"
        ],
        duration: "1 h 35 min"
      },
      "03": {
        label: "Tercer módulo",
        title: "Introducción al color grading",
        description: "Explora la rueda de color primaria para distinguir entre corrección de color y estilización, dominando también el uso de scopes como el waveform.",
        lessons: [
          "La rueda de color primaria y nodos básicos",
          "Corrección de color vs. estilización (LUTs)",
          "Uso de scopes: waveform y vectorscopio"
        ],
        duration: "1 h 20 min"
      },
      "04": {
        label: "Cuarto módulo",
        title: "Audio y entrega final",
        description: "Aplica la mezcla básica de audio en Fairlight y configura los ajustes de exportación para optimizar tus videos en redes sociales.",
        lessons: [
          "Mezcla básica de audio y reducción de ruido en Fairlight",
          "Formatos y ajustes de exportación (Render)",
          "Optimización del video para YouTube, Instagram y TikTok"
        ],
        duration: "1 h 27 min"
      }
    };

    const params = new URLSearchParams(window.location.search);
    let currentKey = params.get("modulo") || params.get("mod") || "01";
    if (/^\d$/.test(currentKey)) currentKey = currentKey.padStart(2, "0");
    if (!modulesData[currentKey]) currentKey = "01";

    const mod = modulesData[currentKey];

    document.title = `${mod.title} - Campiper`;
    document.getElementById('mod-key').textContent = currentKey;
    document.getElementById('mod-label').textContent = mod.label;
    document.getElementById('mod-title').textContent = mod.title;
    document.getElementById('mod-desc').textContent = mod.description;
    document.getElementById('mod-duration').textContent = mod.duration;

    const lessonsList = document.getElementById('mod-lessons');
    mod.lessons.forEach((lesson, index) => {
      const num = String(index + 1).padStart(2, "0");
      const li = document.createElement('li');
      
      let lessonTitleHTML = `<strong>${lesson}</strong>`;
      if (currentKey === "02") {
        lessonTitleHTML = `<strong><a href="leccion.html?leccion=${index + 1}">${lesson}</a></strong>`;
      }

      li.innerHTML = `
        <span class="lesson-number">${num}</span>
        <span class="detail-play"><svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="m9 7 8 5-8 5V7Z" /></svg></span>
        ${lessonTitleHTML}
        <span class="lesson-status"><svg aria-hidden="true" fill="none" height="17" viewBox="0 0 24 24" width="17"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m5 12 4 4L19 6" /></svg> Incluida</span>
      `;
      lessonsList.appendChild(li);
    });

    const keys = Object.keys(modulesData);
    const currentIndex = keys.indexOf(currentKey);

    const btnPrev = document.getElementById('btn-prev');
    if (currentIndex > 0) {
      const prevKey = keys[currentIndex - 1];
      btnPrev.href = `detalle.html?modulo=${prevKey}`;
      document.getElementById('prev-title').textContent = modulesData[prevKey].title;
      btnPrev.style.visibility = 'visible';
    }

    const btnNext = document.getElementById('btn-next');
    if (currentIndex < keys.length - 1) {
      const nextKey = keys[currentIndex + 1];
      btnNext.href = `detalle.html?modulo=${nextKey}`;
      document.getElementById('next-title').textContent = modulesData[nextKey].title;
      btnNext.style.visibility = 'visible';
    }
  }

  // 8. LÓGICA DE LA PÁGINA DE LECCIÓN (leccion.html)
  if (document.querySelector('.lesson-page')) {
    const lessonsData = {
      "1": {
        title: "Cortes, transiciones y uso de la línea de tiempo",
        description: "Aprende a navegar por el panel de edición (Edit Page) de DaVinci Resolve. Veremos cómo importar tus clips, hacer los primeros cortes de precisión y añadir transiciones básicas para darle fluidez a tu video.",
        material: "Clips del ejercicio práctico",
        file: "Descargar ZIP (350 MB)",
        duration: "18:24"
      },
      "2": {
        title: "Trabajando con múltiples pistas de video",
        description: "Organiza diferentes capas de video, imágenes y gráficos dentro del timeline. Aprenderás a controlar la visibilidad, el orden y la sincronización de cada pista.",
        material: "Proyecto multicámara de práctica",
        file: "Descargar ZIP (420 MB)",
        duration: "22:10"
      },
      "3": {
        title: "Ajustes de velocidad y duración de clips",
        description: "Controla el ritmo de tu edición utilizando cambios de velocidad, cámara lenta y congelados. Ajusta cada clip sin perder el control de tu montaje.",
        material: "Clips para practicar velocidad",
        file: "Descargar ZIP (280 MB)",
        duration: "16:42"
      }
    };

    const params = new URLSearchParams(window.location.search);
    let currentLessonKey = params.get("leccion") || "1";
    if (!lessonsData[currentLessonKey]) currentLessonKey = "1";

    const lesson = lessonsData[currentLessonKey];
    const lessonNumber = Number(currentLessonKey);

    document.title = `${lesson.title} - Campiper`;
    document.getElementById('lesson-eyebrow').textContent = `MÓDULO 2 · LECCIÓN ${lessonNumber}`;
    document.getElementById('lesson-title').textContent = lesson.title;
    document.getElementById('lesson-desc').textContent = lesson.description;
    document.getElementById('lesson-duration').textContent = lesson.duration;
    document.getElementById('material-title').textContent = lesson.material;
    document.getElementById('material-file').textContent = lesson.file;

    const btnNextLesson = document.getElementById('btn-next-lesson');
    if (lessonNumber < 3) {
      btnNextLesson.href = `leccion.html?leccion=${lessonNumber + 1}`;
      document.getElementById('next-lesson-text').textContent = 'Siguiente lección';
    } else {
      btnNextLesson.href = `detalle.html?modulo=03`;
      document.getElementById('next-lesson-text').textContent = 'Siguiente módulo';
    }

    let isPlaying = false;
    const videoPlayer = document.getElementById('video-player');
    const btnPlay = document.getElementById('btn-play');
    const pathPlay = document.getElementById('path-play');
    const pathPause = document.getElementById('path-pause');
    const statusText = document.getElementById('video-status-text');

    btnPlay.addEventListener('click', () => {
      isPlaying = !isPlaying;
      if (isPlaying) {
        videoPlayer.classList.add('playing');
        pathPlay.style.display = 'none';
        pathPause.style.display = 'block';
        statusText.textContent = 'REPRODUCIENDO';
        btnPlay.setAttribute('aria-label', 'Pausar lección');
      } else {
        videoPlayer.classList.remove('playing');
        pathPlay.style.display = 'block';
        pathPause.style.display = 'none';
        statusText.textContent = 'VISTA PREVIA';
        btnPlay.setAttribute('aria-label', 'Reproducir lección');
      }
    });

    const btnDownload = document.getElementById('btn-download');
    btnDownload.addEventListener('click', () => {
      document.getElementById('material-title').textContent = "Material preparado";
      document.getElementById('material-file').textContent = "La descarga comenzará en breve";
    });
  }

  // 9. LÓGICA DE LA PÁGINA MIS CURSOS (mis-cursos.html)
  if (document.querySelector('.courses-page')) {
    initMisCursos();
    const resourceBtns = document.querySelectorAll('.btn-resource-dl');
    resourceBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const title = btn.getAttribute('data-title') || 'el archivo';
        alert(`${title}: la descarga comenzará en breve.`);
      });
    });
  }

  // 10. LÓGICA DE LA PÁGINA DE REGISTRO / LOGIN (registro.html)
  if (document.querySelector('.auth-page')) {
    initAuth();
  }

  // 11. CATÁLOGO DESDE FIRESTORE (catalogo.html)
  initCatalogo();

  // 11b. PRECIO DEL CURSO DESDE FIRESTORE (index.html y detalle.html)
  initPrecio();

  // 12. LÓGICA DE LA PÁGINA DE ADMINISTRACIÓN (admin.html)
  if (document.querySelector('.admin-page')) {
    let students = []; 

    let courses = [
      { id: "01", title: "Primeros pasos en DaVinci Resolve", category: "Edición", level: "Primer módulo", lessons: 6, students: 1200 },
      { id: "02", title: "Edición básica de video", category: "Edición", level: "Segundo módulo", lessons: 8, students: 943 },
      { id: "03", title: "Introducción al color grading", category: "Color", level: "Tercer módulo", lessons: 9, students: 716 },
      { id: "04", title: "Audio y entrega final", category: "Audio", level: "Cuarto módulo", lessons: 9, students: 584 }
    ];

    let currentView = "students";

    const sidebar = document.getElementById('admin-sidebar');
    const mobileToggle = document.getElementById('admin-mobile-toggle');
    const backdrop = document.getElementById('admin-nav-backdrop');
    const sidebarClose = document.getElementById('admin-sidebar-close');

    const navStudents = document.getElementById('nav-students');
    const navReports = document.getElementById('nav-reports');
    const navCourses = document.getElementById('nav-courses');

    const viewKicker = document.getElementById('admin-kicker');
    const viewTitle = document.getElementById('admin-title');
    const viewCopy = document.getElementById('admin-copy');
    const actionContainer = document.getElementById('admin-action-container');

    const viewStudentsSec = document.getElementById('view-students');
    const viewReportsSec = document.getElementById('view-reports');
    const viewCoursesSec = document.getElementById('view-courses');

    const studentTableBody = document.getElementById('student-table-body');
    const studentSearchInput = document.getElementById('student-search-input');
    const studentEmptyState = document.getElementById('student-empty-state');

    const courseAdminList = document.getElementById('course-admin-list');

    const studentModal = document.getElementById('student-modal-backdrop');
    const btnCloseStudentModal = document.getElementById('btn-close-student-modal');

    const courseModal = document.getElementById('course-modal-backdrop');
    const btnCloseCourseModal = document.getElementById('btn-close-course-modal');
    const courseForm = document.getElementById('course-form');
    const courseModalTitle = document.getElementById('course-modal-title');
    const courseFormSubmit = document.getElementById('course-form-submit');

    function downloadCSV(filename, content) {
      const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    }

    const viewDetails = {
      students: {
        kicker: "COMUNIDAD",
        title: "Gestión de estudiantes",
        copy: "Consulta el avance, estado y actividad de las personas inscritas.",
        buttonHTML: `<button class="admin-primary-button" id="btn-export-students"><svg aria-hidden="true" fill="none" height="17" viewBox="0 0 24 24" width="17"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 20h14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" /></svg> Exportar CSV</button>`
      },
      reports: {
        kicker: "RENDIMIENTO",
        title: "Ventas y reportes",
        copy: "Una vista clara de los ingresos y el crecimiento de Campiper.",
        buttonHTML: `<button class="admin-primary-button" id="btn-export-reports"><svg aria-hidden="true" fill="none" height="17" viewBox="0 0 24 24" width="17"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 20h14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" /></svg> Descargar reporte</button>`
      },
      courses: {
        kicker: "CONTENIDO",
        title: "Gestión de cursos",
        copy: "Administra los módulos, lecciones y categorías de la plataforma.",
        buttonHTML: `<button class="admin-primary-button" id="btn-new-course"><svg aria-hidden="true" fill="none" height="17" viewBox="0 0 24 24" width="17"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" /></svg> Nuevo curso</button>`
      }
    };

    function switchView(targetView) {
      currentView = targetView;
      [navStudents, navReports, navCourses].forEach(btn => btn && btn.classList.remove('active'));

      if (viewStudentsSec) viewStudentsSec.style.display = 'none';
      if (viewReportsSec) viewReportsSec.style.display = 'none';
      if (viewCoursesSec) viewCoursesSec.style.display = 'none';

      if (targetView === 'students' && viewStudentsSec) {
        if (navStudents) navStudents.classList.add('active');
        viewStudentsSec.style.display = 'block';
      } else if (targetView === 'reports' && viewReportsSec) {
        if (navReports) navReports.classList.add('active');
        viewReportsSec.style.display = 'block';
      } else if (targetView === 'courses' && viewCoursesSec) {
        if (navCourses) navCourses.classList.add('active');
        viewCoursesSec.style.display = 'block';
      }

      const info = viewDetails[targetView];
      if (viewKicker) viewKicker.textContent = info.kicker;
      if (viewTitle) viewTitle.textContent = info.title;
      if (viewCopy) viewCopy.textContent = info.copy;
      if (actionContainer) actionContainer.innerHTML = info.buttonHTML;

      bindHeaderButtons();
      closeMobileMenu();
    }

    function bindHeaderButtons() {
      const btnExportStudents = document.getElementById('btn-export-students');
      if (btnExportStudents) {
        btnExportStudents.addEventListener('click', () => {
          const rows = [
            ["Nombre", "Correo", "Inscripción", "Progreso", "Estado"],
            ...students.map(s => [s.name, s.email, s.enrolled, `${s.progress}%`, s.status])
          ];
          const csvContent = "\uFEFF" + rows.map(r => r.map(cell => `"${cell}"`).join(",")).join("\n");
          downloadCSV("estudiantes-campiper.csv", csvContent);
        });
      }

      const btnExportReports = document.getElementById('btn-export-reports');
      if (btnExportReports) {
        btnExportReports.addEventListener('click', () => {
          const csvContent = "\uFEFFMétrica,Valor\nIngresos totales,$149.000 COP\nCursos vendidos,1\nEstudiantes activos,10\nProgreso promedio,60%\n";
          downloadCSV("reporte-mensual-campiper.csv", csvContent);
        });
      }

      const btnNewCourse = document.getElementById('btn-new-course');
      if (btnNewCourse) {
        btnNewCourse.addEventListener('click', () => openCourseModal());
      }
    }

    function openMobileMenu() {
      if (sidebar) sidebar.classList.add('open');
      if (backdrop) backdrop.style.display = 'block';
    }

    function closeMobileMenu() {
      if (sidebar) sidebar.classList.remove('open');
      if (backdrop) backdrop.style.display = 'none';
    }

    if (mobileToggle) mobileToggle.addEventListener('click', openMobileMenu);
    if (backdrop) backdrop.addEventListener('click', closeMobileMenu);
    if (sidebarClose) sidebarClose.addEventListener('click', closeMobileMenu);

    if (navStudents) navStudents.addEventListener('click', () => switchView('students'));
    if (navReports) navReports.addEventListener('click', () => switchView('reports'));
    if (navCourses) navCourses.addEventListener('click', () => switchView('courses'));

    function renderStudents(filterTerm = "") {
      if (!studentTableBody) return;
      studentTableBody.innerHTML = "";
      const term = filterTerm.trim().toLowerCase();

      const filtered = students.filter(s =>
        s.name.toLowerCase().includes(term) || s.email.toLowerCase().includes(term)
      );

      if (filtered.length === 0) {
        if (studentEmptyState) studentEmptyState.style.display = 'flex';
      } else {
        if (studentEmptyState) studentEmptyState.style.display = 'none';
        filtered.forEach(student => {
          const progreso = Number(student.progress) || 0;
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>
              <div class="student-cell">
                <span>${escaparHTML(student.initials)}</span>
                <div><strong>${escaparHTML(student.name)}</strong><small>${escaparHTML(student.email)}</small></div>
              </div>
            </td>
            <td data-label="Inscripción">${escaparHTML(student.enrolled)}</td>
            <td data-label="Progreso">
              <div class="admin-progress" role="progressbar" aria-valuenow="${progreso}" aria-valuemin="0" aria-valuemax="100" style="--progress: ${progreso}%;">
                <span></span><strong>${progreso}%</strong>
              </div>
            </td>
            <td data-label="Estado"><span class="status-pill"><i></i>${escaparHTML(student.status)}</span>${student.inscrito ? '<span class="enrolled-tag">' + (student.accesoOrigen === 'pago' ? 'Pagado' : 'Con curso') + '</span>' : ''}</td>
            <td>
              <button class="icon-action btn-view-student" aria-label="Ver a ${escaparHTML(student.name)}" data-id="${escaparHTML(student.id)}">
                <svg aria-hidden="true" fill="none" height="17" viewBox="0 0 24 24" width="17"><g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6S2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.5" /></g></svg>
              </button>
            </td>
          `;
          studentTableBody.appendChild(tr);
        });

        document.querySelectorAll('.btn-view-student').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const student = students.find(s => s.id === id);
            if (student) openStudentModal(student);
          });
        });
      }
    }

    if (studentSearchInput) {
      studentSearchInput.addEventListener('input', (e) => {
        renderStudents(e.target.value);
      });
    }

    /* ---------- Inscripción manual (users/{uid}.cursos) ---------- */
    let estudianteAbierto = null;
    const btnToggleEnroll = document.getElementById('btn-toggle-enroll');
    const enrollFeedback = document.getElementById('enroll-feedback');

    function mostrarAvisoInscripcion(mensaje, esError) {
      if (!enrollFeedback) return;
      enrollFeedback.textContent = mensaje || '';
      enrollFeedback.hidden = !mensaje;
      enrollFeedback.classList.toggle('is-error', !!esError);
    }

    function pintarInscripcion(student) {
      const celda = document.getElementById('modal-student-course');
      if (celda) { // [CAMBIO PAGOS]
        celda.textContent = !student.inscrito
          ? 'Sin inscripción'
          : student.accesoOrigen === 'pago'
            ? 'Inscrito · pagó el ' + formatoFecha(student.pagoEn)
            : 'Inscrito en DaVinci Resolve (activado a mano)';
      }
      if (btnToggleEnroll) {
        btnToggleEnroll.disabled = false;
        btnToggleEnroll.classList.toggle('is-remove', student.inscrito);
        btnToggleEnroll.querySelector('span').textContent = student.inscrito ? 'Quitar inscripción' : 'Inscribir al curso';
      }
      mostrarAvisoInscripcion('');
    }

    async function cambiarInscripcion(student, inscribir) {
      const { db, fsMod } = await cargarFirebase();
      await fsMod.updateDoc(fsMod.doc(db, 'users', student.id), {
        cursos: inscribir ? fsMod.arrayUnion(CURSO_ID) : fsMod.arrayRemove(CURSO_ID),
        accesoOrigen: inscribir ? 'manual' : fsMod.deleteField() // [CAMBIO PAGOS]
      });
      student.cursos = student.cursos.filter(c => c !== CURSO_ID).concat(inscribir ? [CURSO_ID] : []);
      student.inscrito = inscribir;
      student.accesoOrigen = inscribir ? 'manual' : ''; // [CAMBIO PAGOS]
    }

    if (btnToggleEnroll) {
      btnToggleEnroll.addEventListener('click', async () => {
        if (!estudianteAbierto) return;
        const estudiante = estudianteAbierto;
        const inscribir = !estudiante.inscrito;
        btnToggleEnroll.disabled = true;
        try {
          await cambiarInscripcion(estudiante, inscribir);
          pintarInscripcion(estudiante);
          mostrarAvisoInscripcion(inscribir
            ? 'Listo: ' + estudiante.name + ' ya ve el curso en Mis cursos.'
            : 'Inscripción retirada: el curso ya no aparece en Mis cursos.');
          renderStudents(studentSearchInput ? studentSearchInput.value : '');
        } catch (error) {
          console.error('No se pudo cambiar la inscripción:', error);
          btnToggleEnroll.disabled = false;
          mostrarAvisoInscripcion(error && error.code === 'permission-denied'
            ? 'Firestore rechazó el cambio: revisa las reglas de seguridad.'
            : 'No se pudo guardar. Inténtalo de nuevo.', true);
        }
      });
    }

    function openStudentModal(student) {
      if (!studentModal) return;
      document.getElementById('modal-student-avatar').textContent = student.initials;
      document.getElementById('student-modal-title').textContent = student.name;
      document.getElementById('modal-student-email').textContent = student.email;
      document.getElementById('modal-student-enrolled').textContent = student.enrolled;
      document.getElementById('modal-student-status').textContent = student.status;
      
      const progEl = document.getElementById('modal-student-progress');
      progEl.style.setProperty('--progress', `${student.progress}%`);
      document.getElementById('modal-student-progress-text').textContent = `${student.progress}%`;

      estudianteAbierto = student;
      pintarInscripcion(student);
      studentModal.style.display = 'flex';
    }

    if (btnCloseStudentModal) btnCloseStudentModal.addEventListener('click', () => { studentModal.style.display = 'none'; });
    if (studentModal) {
      studentModal.addEventListener('click', (e) => {
        if (e.target === studentModal) studentModal.style.display = 'none';
      });
    }

    function renderCourses() {
      if (!courseAdminList) return;
      courseAdminList.innerHTML = "";
      const statEl = document.getElementById('courses-count-stat');
      const labelEl = document.getElementById('courses-count-label');
      if (statEl) statEl.textContent = courses.length;
      if (labelEl) labelEl.textContent = `${courses.length} módulos`;

      courses.forEach((course, index) => {
        const num = String(index + 1).padStart(2, "0");
        const article = document.createElement('article');
        article.className = 'course-admin-row';
        article.innerHTML = `
          <span class="course-order">${num}</span>
          <div class="course-admin-copy">
            <span>${course.category}</span>
            <strong>${course.title}</strong>
            <small>${course.level} · ${course.lessons} lecciones</small>
          </div>
          <div class="course-enrollment">
            <small>ESTUDIANTES</small>
            <strong>${course.students.toLocaleString("es-CO")}</strong>
          </div>
          <div class="course-actions">
            <button class="btn-edit-course" aria-label="Editar ${course.title}" data-id="${course.id}">
              <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16"><path d="m4 20 4.2-1 10.3-10.3a2.1 2.1 0 0 0-3-3L5.2 16 4 20Zm10-13 3 3" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" /></svg>Editar
            </button>
            <button class="danger btn-delete-course" aria-label="Eliminar ${course.title}" data-id="${course.id}">
              <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16"><g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7" /><path d="M10 11v5m4-5v5" /></g></svg>
            </button>
          </div>
        `;
        courseAdminList.appendChild(article);
      });

      document.querySelectorAll('.btn-edit-course').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const course = courses.find(c => c.id === id);
          if (course) openCourseModal(course);
        });
      });

      document.querySelectorAll('.btn-delete-course').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const course = courses.find(c => c.id === id);
          if (course && confirm(`¿Quieres eliminar “${course.title}”?`)) {
            courses = courses.filter(c => c.id !== id);
            renderCourses();
          }
        });
      });
    }

    function openCourseModal(course = null) {
      if (!courseModal) return;
      if (course) {
        if (courseModalTitle) courseModalTitle.textContent = "Editar módulo";
        document.getElementById('course-form-id').value = course.id;
        document.getElementById('course-form-title').value = course.title;
        document.getElementById('course-form-category').value = course.category;
        document.getElementById('course-form-lessons').value = course.lessons;
        document.getElementById('course-form-level').value = course.level;
        if (courseFormSubmit) courseFormSubmit.querySelector('span').textContent = "Guardar cambios";
      } else {
        if (courseModalTitle) courseModalTitle.textContent = "Crear nuevo módulo";
        if (courseForm) courseForm.reset();
        document.getElementById('course-form-id').value = "";
        document.getElementById('course-form-lessons').value = 6;
        if (courseFormSubmit) courseFormSubmit.querySelector('span').textContent = "Crear módulo";
      }
      courseModal.style.display = 'flex';
    }

    if (btnCloseCourseModal) btnCloseCourseModal.addEventListener('click', () => { courseModal.style.display = 'none'; });
    if (courseModal) {
      courseModal.addEventListener('click', (e) => {
        if (e.target === courseModal) courseModal.style.display = 'none';
      });
    }

    if (courseForm) {
      courseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('course-form-id').value;
        const title = document.getElementById('course-form-title').value;
        const category = document.getElementById('course-form-category').value;
        const lessonsCount = Number(document.getElementById('course-form-lessons').value);
        const level = document.getElementById('course-form-level').value;

        if (id) {
          courses = courses.map(c => c.id === id ? { ...c, title, category, lessons: lessonsCount, level } : c);
        } else {
          const newId = String(courses.length + 1).padStart(2, "0");
          courses.push({
            id: newId,
            title,
            category,
            level,
            lessons: lessonsCount,
            students: 0
          });
        }

        renderCourses();
        courseModal.style.display = 'none';
      });
    }

    /* ---------- Estudiantes desde Firestore (colección "users") ---------- */
    const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

    const FECHAS_CUENTAS_ANTERIORES = {
      'lolhhh3345': '2026-10-14',
      'ignaciogaunap': '2026-10-14',
      'breinercamargo16': '2026-10-14',
      'chelsemipertumoren': '2026-10-15',
      'tortello.design': '2026-10-19',
      'pierohlr': '2026-10-19',
      'activosyhabitos': '2026-10-19',
      'hablemosdepaises': '2026-10-19',
      'delatorre': '2026-10-19',
      'bunuelou': '2026-10-19'
    };

    function fechaDeCuentaAnterior(correo) {
      const inicio = String(correo || '').toLowerCase();
      const clave = Object.keys(FECHAS_CUENTAS_ANTERIORES).find(k => inicio.startsWith(k));
      if (!clave) return null;
      const [anio, mes, dia] = FECHAS_CUENTAS_ANTERIORES[clave].split('-').map(Number);
      return new Date(anio, mes - 1, dia);
    }

    function aFecha(valor) {
      if (!valor) return null;
      if (typeof valor.toDate === 'function') return valor.toDate();
      const fecha = new Date(valor);
      return isNaN(fecha.getTime()) ? null : fecha;
    }

    function formatoFecha(fecha) {
      if (!fecha) return '—';
      return fecha.getDate() + ' ' + MESES[fecha.getMonth()] + ' ' + fecha.getFullYear();
    }

    function estudianteDesdeDoc(doc) {
      const d = doc.data();
      const correo = String(d.correo || d.email || '').trim();
      const nombre = String(d.nombre || d.name || '').trim() || nombreDesdeCorreo(correo) || 'Sin nombre';
      const progreso = Number(d.progreso != null ? d.progreso : d.progress);
      const fechaOriginal = d.creadoEn || d.createdAt;
      const fecha = aFecha(fechaOriginal) || fechaDeCuentaAnterior(correo);
      const cursos = Array.isArray(d.cursos) ? d.cursos : [];
      return {
        id: doc.id,
        initials: nombre.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]/g, '').slice(0, 2).toUpperCase() || '?',
        name: nombre,
        email: correo,
        fecha: fecha,
        enrolled: typeof fechaOriginal === 'string' && fechaOriginal ? fechaOriginal : formatoFecha(fecha),
        progress: Number.isFinite(progreso) ? Math.max(0, Math.min(100, Math.round(progreso))) : 0,
        status: String(d.estado || d.status || 'Activo'),
        cursos: cursos,
        inscrito: cursos.includes(CURSO_ID),
        accesoOrigen: String(d.accesoOrigen || ''), // [CAMBIO PAGOS]
        pagoEn: aFecha(d.pagoEn)                    // [CAMBIO PAGOS]
      };
    }

    function mensajeEnTabla(texto) {
      if (!studentTableBody) return;
      if (studentEmptyState) studentEmptyState.style.display = 'none';
      studentTableBody.innerHTML = '';
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 5;
      td.style.cssText = 'padding: 32px 20px; text-align: center; color: #a6a8b0;';
      td.textContent = texto;
      tr.appendChild(td);
      studentTableBody.appendChild(tr);
    }

    function actualizarEstadisticas() {
      const total = students.length;
      const activos = students.filter(s => s.status.toLowerCase() === 'activo').length;
      const promedio = total ? Math.round(students.reduce((suma, s) => suma + s.progress, 0) / total) : 0;
      const ahora = new Date();
      const nuevos = students.filter(s => s.fecha && s.fecha.getMonth() === ahora.getMonth() && s.fecha.getFullYear() === ahora.getFullYear()).length;

      const poner = (id, texto) => { const el = document.getElementById(id); if (el) el.textContent = texto; };
      poner('stat-students-count', total);
      poner('stat-students-new', '+' + nuevos + ' este mes');
      poner('stat-avg-progress', promedio + '%');
      poner('stat-active-percent', (total ? Math.round(activos / total * 100) : 0) + '%');
      poner('stat-active-accounts', activos + ' de ' + total + ' estudiantes');
    }

    async function cargarEstudiantes() {
      document.body.style.visibility = 'hidden';
      const mostrarPagina = () => { document.body.style.visibility = ''; };

      mensajeEnTabla('Cargando estudiantes…');
      if (!FIREBASE_ACTIVO) {
        mensajeEnTabla('Firebase no está configurado.');
        mostrarPagina();
        return;
      }

      try {
        const { auth, db, authMod, fsMod } = await cargarFirebase();

        const usuario = await new Promise(resolve => {
          const cancelar = authMod.onAuthStateChanged(auth, u => { cancelar(); resolve(u); });
        });
        if (!usuario) {
          window.location.replace('registro.html');
          return;
        }

        const resultado = await fsMod.getDocs(fsMod.collection(db, 'users'));
        const lista = [];
        resultado.forEach(doc => {
          const d = doc.data();
          const rol = String(d.rol || d.role || '').toLowerCase();
          if (rol === 'admin' || rol === 'administrador') return; 
          lista.push(estudianteDesdeDoc(doc));
        });

        lista.sort((a, b) => (b.fecha ? b.fecha.getTime() : 0) - (a.fecha ? a.fecha.getTime() : 0));
        students = lista;

        actualizarEstadisticas();
        renderStudents(studentSearchInput ? studentSearchInput.value : '');
        mostrarPagina();
      } catch (error) {
        console.error('Error al cargar estudiantes desde Firestore:', error);
        if (error && error.code === 'permission-denied') {
          window.location.replace('mis-cursos.html');
          return;
        }
        mensajeEnTabla('No pudimos cargar a los estudiantes. Revisa la consola.');
        mostrarPagina();
      }
    }

    switchView('students');
    cargarEstudiantes();
    renderCourses();
  }
});
// --- INTEGRACIÓN DE CORREO DE BIENVENIDA (Sin alterar Firebase) ---
document.addEventListener('DOMContentLoaded', () => {
  const formularioAuth = document.getElementById('auth-form');
  
  if (formularioAuth) {
    formularioAuth.addEventListener('submit', () => {
      const campoNombreContenedor = document.getElementById('field-name');
      
      // Verificamos si el formulario está en modo "Crear cuenta" (el campo nombre no está oculto)
      if (campoNombreContenedor && campoNombreContenedor.style.display !== 'none') {
        
        const nombreIngresado = document.getElementById('name').value;
        const correoIngresado = document.getElementById('email').value;
        
        // Reemplaza esto con tu NUEVA URL de la Aplicación Web de Google
        const urlGoogleSheets = "https://script.google.com/macros/s/https://script.google.com/macros/s/AKfycbyQYtji6cgbF6kB6HalWdgjPTvSVkh3_tpTgmARgR87XmjT6P2iFLVuDeoErnVpavr52Q/exec/exec";
        
        // Enviamos los datos en segundo plano a Google Sheets
        fetch(urlGoogleSheets, {
          method: 'POST',
          mode: 'no-cors', // Evita bloqueos de seguridad del navegador
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            nombre: nombreIngresado,
            email: correoIngresado
          })
        }).catch(e => console.log("Copia enviada silenciosamente."));
      }
    });
  }
});
document.addEventListener('DOMContentLoaded', () => {
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const btnSwitchMode = document.getElementById('btn-switch-mode');
  const fieldTerms = document.getElementById('field-terms');
  const termsCheckbox = document.getElementById('terms-checkbox');

  // Activa la obligatoriedad de la casilla
  const exigirTerminos = () => {
    if(fieldTerms && termsCheckbox) {
      fieldTerms.style.display = 'block';
      termsCheckbox.required = true;
    }
  };

  // Desactiva la obligatoriedad de la casilla
  const quitarTerminos = () => {
    if(fieldTerms && termsCheckbox) {
      fieldTerms.style.display = 'none';
      termsCheckbox.required = false;
    }
  };

  // Se añade como un evento adicional a los clics (no sobreescribe los anteriores)
  if(tabRegister) tabRegister.addEventListener('click', exigirTerminos);
  if(tabLogin) tabLogin.addEventListener('click', quitarTerminos);
  
  // También controla el botón de "¿Aún no tienes cuenta? / Crear cuenta" al final del formulario
  if(btnSwitchMode) {
    btnSwitchMode.addEventListener('click', () => {
      // Revisa el estado actual: si la casilla está oculta, la muestra; si no, la oculta.
      if (fieldTerms.style.display === 'none' || fieldTerms.style.display === '') {
        exigirTerminos();
      } else {
        quitarTerminos();
      }
    });
  }
});
