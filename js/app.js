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

/* ---------- Arranque ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initTemporizador();
  initCatalogo();
  initDetalle();
});
