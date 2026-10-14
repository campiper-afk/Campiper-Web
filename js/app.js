/* =========================================================
   Campiper — JavaScript compartido por todas las páginas
   Cada función solo se ejecuta si encuentra sus elementos.
   ========================================================= */

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

  // 1. Base de datos simulada (JSON)
  const cursos = [
    {
      id: 1,
      titulo: "Primeros pasos en Davinci Resolve",
      categoria: "edicion",
      nivel: "Primer Modulo",
      precio: "",
      imagen: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      descripcion: "Este módulo introductorio establece las bases para comenzar a utilizar el software, guiándote a través del proceso de instalación y su configuración inicial."
    },
    {
      id: 2,
      titulo: "Edicion básica de video",
      categoria: "edicion",
      nivel: "Segundo Modulo",
      precio: "",
      imagen: "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      descripcion: "En esta sección aprenderás a dominar la edición básica manejando cortes, transiciones y la línea de tiempo."
    },
    {
      id: 3,
      titulo: "Introducción al color granding",
      categoria: "edicion",
      nivel: "Tercer Modulo",
      precio: "",
      imagen: "https://images.unsplash.com/photo-1555099962-4199c345e5dd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      descripcion: "Explora la rueda de color primaria para distinguir entre corrección de color y estilización, dominando también el uso de scopes como el waveform."
    },
    {
      id: 4,
      titulo: "Audio y entrega final",
      categoria: "ia",
      nivel: "Cuarto Modulo",
      precio: "",
      imagen: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      descripcion: "Aplica la mezcla básica de audio en Fairlight y configura los ajustes de exportación para optimizar tus videos en redes sociales"
    }
  ];

  const gridContenedor = document.getElementById('course-grid');
  const botonesFiltro = document.querySelectorAll('.filter-btn');

  // 2. Función para renderizar las tarjetas
  function renderizarCursos(cursosFiltrados) {
    gridContenedor.innerHTML = ''; // Limpiar grid

    if (cursosFiltrados.length === 0) {
      gridContenedor.innerHTML = '<p class="catalogo-vacio">No se encontraron cursos en esta categoría.</p>';
      return;
    }

    cursosFiltrados.forEach(curso => {
      const tarjeta = document.createElement('div');
      // Las clases están definidas en css/style.css
      tarjeta.className = "tarjeta-curso caja";

      tarjeta.innerHTML = `
        <!-- Imagen del curso -->
        <div class="tarjeta-imagen">
          <img src="${curso.imagen}" alt="${curso.titulo}" class="tarjeta-img">
          <span class="insignia insignia-tarjeta">
            ${curso.nivel}
          </span>
        </div>

        <!-- Contenido -->
        <div class="tarjeta-contenido">
          <h3 class="tarjeta-titulo">${curso.titulo}</h3>
          <p class="tarjeta-descripcion">${curso.descripcion}</p>

          <!-- Pie de tarjeta (Precio y Botón) -->
          <div class="tarjeta-pie">
            <span class="tarjeta-precio">${curso.precio}</span>
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

  // Página a la que se va después de entrar (simulado, sin servidor)
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

  /* ===== Validación ===== */
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
  const regEmail = document.getElementById('registro-email');
  const regClave = document.getElementById('registro-clave');
  const regConfirmar = document.getElementById('registro-confirmar');
  const recEmail = document.getElementById('recuperar-email');

  const reglas = new Map([
    [loginEmail, () => validarCorreo(loginEmail)],
    [loginClave, () => validarClaveLogin(loginClave)],
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

  // Pone el botón en estado "cargando" y llama a la acción después de un momento
  function simularEnvio(boton, textoCargando, accion) {
    boton.disabled = true;
    boton.textContent = textoCargando;
    setTimeout(accion, 800);
  }

  /* ===== Iniciar sesión ===== */
  const formLogin = document.getElementById('form-login');
  formLogin.addEventListener('submit', e => {
    e.preventDefault();
    if (!validarFormulario(formLogin, [loginEmail, loginClave])) return;

    // TODO (servidor): aquí se enviaría loginEmail.value y loginClave.value al backend.
    simularEnvio(formLogin.querySelector('.auth-enviar'), 'Entrando…', () => {
      window.location.href = PAGINA_DESTINO;
    });
  });

  /* ===== Crear cuenta ===== */
  const formRegistro = document.getElementById('form-registro');
  formRegistro.addEventListener('submit', e => {
    e.preventDefault();
    if (!validarFormulario(formRegistro, [regEmail, regClave, regConfirmar])) return;

    // TODO (servidor): aquí se crearía la cuenta con regEmail.value y regClave.value.
    const estado = document.getElementById('registro-estado');
    simularEnvio(formRegistro.querySelector('.auth-enviar'), 'Creando cuenta…', () => {
      estado.textContent = 'Cuenta creada. Te llevamos a tus cursos…';
      estado.hidden = false;
      setTimeout(() => { window.location.href = PAGINA_DESTINO; }, 900);
    });
  });

  /* ===== Recuperar contraseña ===== */
  const formRecuperar = document.getElementById('form-recuperar');
  const recuperarOk = document.getElementById('recuperar-ok');
  const botonRecuperar = formRecuperar.querySelector('.auth-enviar');

  function reiniciarRecuperar() {
    formRecuperar.hidden = false;
    recuperarOk.hidden = true;
    botonRecuperar.disabled = false;
    botonRecuperar.textContent = 'Enviar enlace';
  }

  formRecuperar.addEventListener('submit', e => {
    e.preventDefault();
    if (!validarFormulario(formRecuperar, [recEmail])) return;

    // TODO (servidor): aquí se pediría al backend que envíe el enlace de recuperación.
    simularEnvio(botonRecuperar, 'Enviando…', () => {
      document.getElementById('recuperar-ok-correo').textContent = recEmail.value.trim();
      formRecuperar.hidden = true;
      recuperarOk.hidden = false;
    });
  });

  /* ===== Entrar con Google ===== */
  document.querySelectorAll('[data-google]').forEach(boton => {
    boton.addEventListener('click', () => {
      // TODO (servidor): aquí se iniciaría el flujo de Google (OAuth).
      boton.disabled = true;
      boton.querySelector('.btn-google-texto').textContent = 'Conectando con Google…';
      setTimeout(() => { window.location.href = PAGINA_DESTINO; }, 800);
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
  initTemporizador();
  initCatalogo();
  initDetalle();
  initAuth();
});
