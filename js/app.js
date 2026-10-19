/* =========================================================
   Campiper — JavaScript compartido por todas las páginas
   Cada función solo se ejecuta si encuentra sus elementos.
   ========================================================= */

/* =========================================================
   FIREBASE (Authentication + Firestore)

   1. Pega aquí tu firebaseConfig:
      Firebase > Configuración del proyecto > Tus apps > app web.
   2. Mientras apiKey diga "PEGA_AQUI", el sitio funciona en
      MODO DEMOSTRACIÓN (cuentas simuladas en este navegador).
   3. Con la configuración real, el registro, el inicio de sesión,
      Google y la recuperación de contraseña usan Firebase.
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

// Carga Firebase solo cuando hace falta (y una sola vez)
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
      _firebase = null; // permite reintentar si falló la conexión
      throw error;
    });
  }
  return _firebase;
}

/* ---------- Sesión guardada en este navegador ----------
   Sirve para pintar el header al instante. La fuente de verdad
   es Firebase (o el modo demostración si no hay configuración). */
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

/* ---------- Cuentas ----------
   Mismas funciones en los dos modos, para que el resto del código
   no tenga que saber si usa Firebase o la demostración:
   registrar(nombre, correo, clave) · entrar(correo, clave) · entrarConGoogle()
   recuperar(correo) · salir() · alCambiar(callback) */
function cuentasFirebase() {
  const datosUsuario = u => ({ nombre: u.displayName || nombreDesdeCorreo(u.email), correo: u.email || '' });

  // Guarda/actualiza el perfil en Firestore: users/{uid} (las reglas solo dejan a su dueño)
  async function guardarPerfil(usuario, nombre, extra) {
    try {
      const { db, fsMod } = await cargarFirebase();
      const datos = Object.assign({ nombre: nombre || '', correo: usuario.email || '' }, extra || {});
      await fsMod.setDoc(fsMod.doc(db, 'users', usuario.uid), datos, { merge: true });
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
      const credencial = await authMod.signInWithPopup(auth, new authMod.GoogleAuthProvider());
      await guardarPerfil(credencial.user, credencial.user.displayName);
      Sesion.iniciar(datosUsuario(credencial.user));
    },
    async recuperar(correo) {
      const { auth, authMod } = await cargarFirebase();
      try {
        await authMod.sendPasswordResetEmail(auth, correo);
      } catch (error) {
        // No revelamos si el correo existe o no
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
      }).catch(() => callback(Sesion.obtener())); // sin conexión: usa la sesión guardada
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

/* ---------- Header que cambia según la sesión ----------
   [data-solo="visitante"]  -> solo se ve sin sesión (Iniciar sesión)
   [data-solo="usuario"]    -> solo se ve con sesión (nombre, Mis cursos, Salir)
   [data-usuario-nombre] / [data-usuario-inicial] -> datos del usuario
   [data-salir]             -> cierra la sesión
   <body data-requiere-sesion> -> sin sesión, manda a registro.html */
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

  // Pinta enseguida con lo guardado, para que el header no parpadee.
  // En páginas protegidas solo se pinta si ya hay sesión guardada.
  if (!requiereSesion || guardada) pintarSesion(guardada);

  // Y se corrige cuando Firebase responde con el estado real
  Cuentas.alCambiar(usuario => {
    if (usuario) Sesion.iniciar(usuario); else Sesion.cerrar();
    if (requiereSesion && !usuario) {
      window.location.replace('registro.html');
      return;
    }
    pintarSesion(usuario);
  });

  document.querySelectorAll('[data-salir]').forEach(boton => {
    boton.addEventListener('click', async () => {
      try { await Cuentas.salir(); } catch (e) { Sesion.cerrar(); }
      window.location.href = 'index.html';
    });
  });
}

/* ---------- index.html: temporizador de la oferta ---------- */
function initTemporizador() {
  if (!document.getElementById('t-hours')) return;

  // Countdown timer (demo, cuenta atrás desde 23:59:59)
  let totalSeconds = 23 * 3600 + 59 * 60 + 59;
  const hEl = document.getElementById('t-hours');
  const mEl = document.getElementById('t-mins');
  const sEl = document.getElementById('t-secs');
  function pad(n){ return n.toString().padStart(2, '0'); }
  setInterval(() => {
    if (totalSeconds <= 0) { totalSeconds = 23 * 3600 + 59 * 60 + 59; }
    totalSeconds--;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    hEl.textContent = pad(h);
    mEl.textContent = pad(m);
    sEl.textContent = pad(s);
  }, 1000);
}

/* ---------- catalogo.html: tarjetas de módulos ---------- */
function initCatalogo() {
  if (!document.getElementById('course-grid')) return;
/* ---------- catalogo.html: tarjetas de módulos desde Firebase ---------- */
async function initCatalogo() {
  const gridContenedor = document.getElementById('course-grid');
  if (!gridContenedor) return;

  const botonesFiltro = document.querySelectorAll('.filter-btn');

  // Función para crear las tarjetas HTML
  function renderizarCursos(cursosFiltrados) {
    gridContenedor.innerHTML = ''; // Limpiar grid

    if (cursosFiltrados.length === 0) {
      gridContenedor.innerHTML = '<p class="catalogo-vacio">No hay cursos disponibles en este momento.</p>';
      return;
    }

    cursosFiltrados.forEach(curso => {
      const tarjeta = document.createElement('div');
      tarjeta.className = "tarjeta-curso caja";

      // Usamos una imagen por defecto si el admin no le puso ninguna
      const imgUrl = curso.imagen ? curso.imagen : "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

      tarjeta.innerHTML = `
        <div class="tarjeta-imagen">
          <img src="${imgUrl}" alt="${curso.titulo}" class="tarjeta-img">
          <span class="insignia insignia-tarjeta">${curso.nivel || 'Módulo'}</span>
        </div>
        <div class="tarjeta-contenido">
          <h3 class="tarjeta-titulo">${curso.titulo}</h3>
          <p class="tarjeta-descripcion">${curso.descripcion || 'Sin descripción'}</p>
          <div class="tarjeta-pie">
            <span class="tarjeta-precio">${curso.precio || ''}</span>
            <a href="detalle.html?mod=${curso.id}" class="tarjeta-link">
              Ver detalle
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
        </div>
      `;
      gridContenedor.appendChild(tarjeta);
    });
  }

  // Lógica de filtrado
  function configurarFiltros(cursosData) {
    botonesFiltro.forEach(boton => {
      boton.addEventListener('click', (e) => {
        botonesFiltro.forEach(btn => btn.classList.remove('active'));
        const btnSeleccionado = e.target;
        btnSeleccionado.classList.add('active');

        const categoriaSeleccionada = btnSeleccionado.getAttribute('data-filter');

        if (categoriaSeleccionada === 'todos' || !categoriaSeleccionada) {
          renderizarCursos(cursosData);
        } else {
          const filtrados = cursosData.filter(curso => curso.categoria === categoriaSeleccionada);
          renderizarCursos(filtrados);
        }
      });
    });
  }

  // --- CONEXIÓN CON FIREBASE ---
  gridContenedor.innerHTML = '<p class="catalogo-vacio">Cargando cursos desde la base de datos...</p>';
  let cursosFirebase = [];

  try {
    // Usamos la función cargarFirebase() que ya tienes en app.js
    const { db, fsMod } = await cargarFirebase();
    const querySnapshot = await fsMod.getDocs(fsMod.collection(db, "cursos"));

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      cursosFirebase.push({
        id: doc.id,
        titulo: data.titulo,
        categoria: data.categoria || "edicion",
        nivel: data.nivel,
        precio: data.precio || "",
        imagen: data.imagen,
        descripcion: data.descripcion
      });
    });

    renderizarCursos(cursosFirebase);
    configurarFiltros(cursosFirebase);

  } catch (error) {
    console.error("Error al cargar cursos de Firebase:", error);
    gridContenedor.innerHTML = '<p class="catalogo-vacio" style="color:red;">Error al cargar el catálogo de cursos.</p>';
  }
}
  // 3. Lógica de Filtrado
  botonesFiltro.forEach(boton => {
    boton.addEventListener('click', (e) => {
      // Quitar clase active de todos
      botonesFiltro.forEach(btn => btn.classList.remove('active'));

      // Poner clase active al botón clickeado
      const btnSeleccionado = e.target;
      btnSeleccionado.classList.add('active');

      // Filtrar array
      const categoriaSeleccionada = btnSeleccionado.getAttribute('data-filter');

      if (categoriaSeleccionada === 'todos') {
        renderizarCursos(cursos);
      } else {
        const filtrados = cursos.filter(curso => curso.categoria === categoriaSeleccionada);
        renderizarCursos(filtrados);
      }
    });
  });

  // 4. Inicializar vista con todos los cursos
  renderizarCursos(cursos);
}

/* ---------- detalle.html: detalle de un módulo (?mod=N) ---------- */
function initDetalle() {
  if (!document.getElementById('lesson-list')) return;

  // Base de datos de los 4 módulos extraída de tu diseño
  const modulosData = {
    "1": {
      etiqueta: "Primer Módulo",
      titulo: "Primeros pasos en DaVinci Resolve",
      descripcion: "Este módulo introductorio establece las bases para comenzar a utilizar el software, guiándote a través del proceso de instalación y su configuración inicial.",
      lecciones: [
        "Instalación y configuración inicial",
        "Conociendo la interfaz: Media, Cut, Edit y Deliver",
        "Organización de tu primer proyecto y atajos de teclado"
      ]
    },
    "2": {
      etiqueta: "Segundo Módulo",
      titulo: "Edición básica de video",
      descripcion: "En esta sección aprenderás a dominar la edición básica manejando cortes, transiciones y la línea de tiempo.",
      lecciones: [
        "Cortes, transiciones y uso de la línea de tiempo",
        "Trabajando con múltiples pistas de video",
        "Ajustes de velocidad y duración de clips"
      ]
    },
    "3": {
      etiqueta: "Tercer Módulo",
      titulo: "Introducción al color grading",
      descripcion: "Explora la rueda de color primaria para distinguir entre corrección de color y estilización, dominando también el uso de scopes como el waveform.",
      lecciones: [
        "La rueda de color primaria y nodos básicos",
        "Corrección de color vs. estilización (LUTs)",
        "Uso de scopes: waveform y vectorscopio"
      ]
    },
    "4": {
      etiqueta: "Cuarto Módulo",
      titulo: "Audio y entrega final",
      descripcion: "Aplica la mezcla básica de audio en Fairlight y configura los ajustes de exportación para optimizar tus videos en redes sociales.",
      lecciones: [
        "Mezcla básica de audio y reducción de ruido en Fairlight",
        "Formatos y ajustes de exportación (Render)",
        "Optimización del video para YouTube, Instagram y TikTok"
      ]
    }
  };

  // 1. Leer el número de módulo desde la URL (ej: ?mod=2)
  const parametros = new URLSearchParams(window.location.search);
  const modId = parametros.get('mod') || "1"; // Si no hay número, carga el 1 por defecto

  // 2. Buscar la información de ese módulo en nuestra base de datos
  const datos = modulosData[modId];

  // 3. Inyectar la información en el HTML
  if(datos) {
    document.getElementById('mod-etiqueta').textContent = datos.etiqueta;
    document.getElementById('mod-titulo').textContent = datos.titulo;
    document.getElementById('mod-desc').textContent = datos.descripcion;

    const lista = document.getElementById('lesson-list');
    datos.lecciones.forEach(leccion => {
      const li = document.createElement('li');
      li.className = "leccion-item";
      li.innerHTML = `<svg class="leccion-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg><span>${leccion}</span>`;
      lista.appendChild(li);
    });
  }
}

/* ---------- registro.html: registro, inicio de sesión y recuperar contraseña ---------- */
function initAuth() {
  if (!document.getElementById('auth-card')) return;

  const PAGINA_DESTINO = 'mis-cursos.html';
  const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const paneles = {
    login: document.getElementById('panel-login'),
    registro: document.getElementById('panel-registro'),
    recuperar: document.getElementById('panel-recuperar')
  };
  const titulos = {
    login: 'Iniciar sesión - Campiper',
    registro: 'Crear cuenta - Campiper',
    recuperar: 'Recuperar contraseña - Campiper'
  };
  const barraTabs = document.getElementById('auth-tabs');
  const tabs = barraTabs.querySelectorAll('[data-vista]');

  /* ===== Cambiar entre vistas (login / registro / recuperar) ===== */
  function mostrarVista(vista, enfocar) {
    Object.keys(paneles).forEach(nombre => {
      paneles[nombre].hidden = nombre !== vista;
    });

    // Las pestañas solo se ven en login y registro
    barraTabs.hidden = vista === 'recuperar';
    tabs.forEach(tab => {
      const activa = tab.dataset.vista === vista;
      tab.classList.toggle('active', activa);
      tab.setAttribute('aria-selected', activa ? 'true' : 'false');
      tab.tabIndex = activa ? 0 : -1;
    });

    if (vista === 'recuperar') reiniciarRecuperar();
    document.title = titulos[vista];

    if (enfocar) {
      const primerCampo = paneles[vista].querySelector('input');
      if (primerCampo) primerCampo.focus();
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => mostrarVista(tab.dataset.vista, false));
    // Flechas izquierda/derecha para moverse entre pestañas
    tab.addEventListener('keydown', e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const otra = Array.from(tabs).find(t => t !== tab);
      mostrarVista(otra.dataset.vista, false);
      otra.focus();
    });
  });

  // Enlaces de texto: "Crear cuenta", "Iniciar sesión", "¿Olvidaste tu contraseña?"
  document.querySelectorAll('[data-ir]').forEach(boton => {
    boton.addEventListener('click', () => mostrarVista(boton.dataset.ir, true));
  });

  /* ===== Mostrar / ocultar contraseña ===== */
  document.querySelectorAll('[data-ver]').forEach(boton => {
    boton.addEventListener('click', () => {
      const input = document.getElementById(boton.dataset.ver);
      const mostrar = input.type === 'password';
      input.type = mostrar ? 'text' : 'password';
      boton.textContent = mostrar ? 'Ocultar' : 'Mostrar';
      boton.setAttribute('aria-label', (mostrar ? 'Ocultar' : 'Mostrar') + ' contraseña');
    });
  });

  /* ===== Validación de los campos ===== */
  function mostrarError(input, mensaje) {
    input.setAttribute('aria-invalid', 'true');
    document.getElementById(input.id + '-error').textContent = mensaje;
    return false;
  }
  function limpiarError(input) {
    input.removeAttribute('aria-invalid');
    document.getElementById(input.id + '-error').textContent = '';
    return true;
  }
  function validarNombre(input) {
    if (input.value.trim().length < 2) return mostrarError(input, 'Escribe tu nombre.');
    return limpiarError(input);
  }
  function validarCorreo(input) {
    const valor = input.value.trim();
    if (!valor) return mostrarError(input, 'Escribe tu correo electrónico.');
    if (!REGEX_CORREO.test(valor)) return mostrarError(input, 'Revisa el correo: debe verse como nombre@correo.com.');
    return limpiarError(input);
  }
  function validarClaveLogin(input) {
    if (!input.value) return mostrarError(input, 'Escribe tu contraseña.');
    return limpiarError(input);
  }
  function validarClaveNueva(input) {
    if (!input.value) return mostrarError(input, 'Crea una contraseña.');
    if (input.value.length < 8) return mostrarError(input, 'Usa al menos 8 caracteres.');
    return limpiarError(input);
  }
  function validarConfirmacion(input, clave) {
    if (!input.value) return mostrarError(input, 'Repite la contraseña.');
    if (input.value !== clave.value) return mostrarError(input, 'Las contraseñas no coinciden.');
    return limpiarError(input);
  }

  // Todos los campos con su regla (se vuelve a validar mientras el usuario corrige)
  const loginEmail = document.getElementById('login-email');
  const loginClave = document.getElementById('login-clave');
  const regNombre = document.getElementById('registro-nombre');
  const regEmail = document.getElementById('registro-email');
  const regClave = document.getElementById('registro-clave');
  const regConfirmar = document.getElementById('registro-confirmar');
  const recEmail = document.getElementById('recuperar-email');

  const reglas = new Map([
    [loginEmail, () => validarCorreo(loginEmail)],
    [loginClave, () => validarClaveLogin(loginClave)],
    [regNombre, () => validarNombre(regNombre)],
    [regEmail, () => validarCorreo(regEmail)],
    [regClave, () => validarClaveNueva(regClave)],
    [regConfirmar, () => validarConfirmacion(regConfirmar, regClave)],
    [recEmail, () => validarCorreo(recEmail)]
  ]);

  reglas.forEach((regla, input) => {
    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') regla();
      // Si cambia la contraseña, revisa de nuevo la confirmación
      if (input === regClave && regConfirmar.value) reglas.get(regConfirmar)();
    });
  });

  // Valida varios campos a la vez y enfoca el primero con error
  function validarFormulario(form, campos) {
    const resultados = campos.map(campo => reglas.get(campo)());
    if (resultados.includes(false)) {
      const primero = form.querySelector('[aria-invalid="true"]');
      if (primero) primero.focus();
      return false;
    }
    return true;
  }

  /* ===== Mensajes y botones ===== */
  // Mensaje general bajo el botón (tipo 'error' lo pinta en rojo)
  function mostrarEstado(el, mensaje, tipo) {
    el.textContent = mensaje || '';
    el.hidden = !mensaje;
    el.classList.toggle('auth-estado--error', tipo === 'error');
  }

  // Traduce los errores de Firebase a mensajes claros en español
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
      'auth/popup-blocked': 'Tu navegador bloqueó la ventana de Google. Permite las ventanas emergentes e inténtalo de nuevo.',
      'auth/operation-not-allowed': 'Este método de acceso no está activado en Firebase (Authentication > Método de acceso).',
      'auth/unauthorized-domain': 'Este dominio no está autorizado en Firebase (Authentication > Configuración > Dominios autorizados).'
    };
    console.error(error);
    return mensajes[error && error.code] || 'No pudimos completar la acción. Inténtalo de nuevo.';
  }
  // Cerrar la ventana de Google no es un error que haya que mostrar
  function esCancelacion(error) {
    return error && (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request');
  }

  function bloquear(boton, textoCargando) {
    boton.dataset.textoOriginal = boton.textContent;
    boton.disabled = true;
    boton.textContent = textoCargando;
  }
  function desbloquear(boton) {
    boton.disabled = false;
    boton.textContent = boton.dataset.textoOriginal;
  }

  /* ===== Iniciar sesión ===== */
  const formLogin = document.getElementById('form-login');
  const estadoLogin = document.getElementById('login-estado');
  formLogin.addEventListener('submit', async e => {
    e.preventDefault();
    mostrarEstado(estadoLogin, '');
    if (!validarFormulario(formLogin, [loginEmail, loginClave])) return;

    const boton = formLogin.querySelector('.auth-enviar');
    bloquear(boton, 'Entrando…');
    try {
      await Cuentas.entrar(loginEmail.value.trim().toLowerCase(), loginClave.value);
      window.location.href = PAGINA_DESTINO;
    } catch (error) {
      desbloquear(boton);
      mostrarEstado(estadoLogin, mensajeDeError(error), 'error');
    }
  });

  /* ===== Crear cuenta ===== */
  const formRegistro = document.getElementById('form-registro');
  const estadoRegistro = document.getElementById('registro-estado');
  formRegistro.addEventListener('submit', async e => {
    e.preventDefault();
    mostrarEstado(estadoRegistro, '');
    if (!validarFormulario(formRegistro, [regNombre, regEmail, regClave, regConfirmar])) return;

    const boton = formRegistro.querySelector('.auth-enviar');
    bloquear(boton, 'Creando cuenta…');
    try {
      await Cuentas.registrar(regNombre.value.trim(), regEmail.value.trim().toLowerCase(), regClave.value);
      mostrarEstado(estadoRegistro, 'Cuenta creada. Te llevamos a tus cursos…');
      setTimeout(() => { window.location.href = PAGINA_DESTINO; }, 900);
    } catch (error) {
      desbloquear(boton);
      mostrarEstado(estadoRegistro, mensajeDeError(error), 'error');
    }
  });

  /* ===== Recuperar contraseña ===== */
  const formRecuperar = document.getElementById('form-recuperar');
  const recuperarOk = document.getElementById('recuperar-ok');
  const estadoRecuperar = document.getElementById('recuperar-estado');
  const botonRecuperar = formRecuperar.querySelector('.auth-enviar');

  function reiniciarRecuperar() {
    formRecuperar.hidden = false;
    recuperarOk.hidden = true;
    mostrarEstado(estadoRecuperar, '');
    botonRecuperar.disabled = false;
    botonRecuperar.textContent = 'Enviar enlace';
  }

  formRecuperar.addEventListener('submit', async e => {
    e.preventDefault();
    mostrarEstado(estadoRecuperar, '');
    if (!validarFormulario(formRecuperar, [recEmail])) return;

    bloquear(botonRecuperar, 'Enviando…');
    try {
      await Cuentas.recuperar(recEmail.value.trim().toLowerCase());
      document.getElementById('recuperar-ok-correo').textContent = recEmail.value.trim();
      formRecuperar.hidden = true;
      recuperarOk.hidden = false;
    } catch (error) {
      desbloquear(botonRecuperar);
      mostrarEstado(estadoRecuperar, mensajeDeError(error), 'error');
    }
  });

  /* ===== Entrar con Google ===== */
  document.querySelectorAll('[data-google]').forEach(boton => {
    boton.addEventListener('click', async () => {
      const texto = boton.querySelector('.btn-google-texto');
      const estado = boton.closest('.auth-panel').querySelector('.auth-estado');
      const textoOriginal = texto.textContent;
      mostrarEstado(estado, '');
      boton.disabled = true;
      texto.textContent = 'Conectando con Google…';
      try {
        await Cuentas.entrarConGoogle();
        window.location.href = PAGINA_DESTINO;
      } catch (error) {
        boton.disabled = false;
        texto.textContent = textoOriginal;
        if (!esCancelacion(error)) mostrarEstado(estado, mensajeDeError(error), 'error');
      }
    });
  });

  // Si el usuario vuelve con el botón "Atrás", se recarga para que no queden botones bloqueados
  window.addEventListener('pageshow', e => { if (e.persisted) window.location.reload(); });

  /* ===== Vista inicial: registro.html?modo=registro abre "Crear cuenta" ===== */
  const modo = new URLSearchParams(window.location.search).get('modo');
  mostrarVista(Object.keys(paneles).includes(modo) ? modo : 'login', false);
}

/* ---------- Arranque ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initSesion();
  initTemporizador();
  initCatalogo();
  initDetalle();
  initAuth();
});
