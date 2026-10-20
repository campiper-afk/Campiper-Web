document.addEventListener("DOMContentLoaded", () => {
  const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

    const interactiveItems = document.querySelectorAll("button, .button");
    interactiveItems.forEach((item) => {
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
    });
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
    let currentKey = params.get("modulo") || "01";
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

    function updateAuthUI() {
      if (mode === 'login') {
        tabLogin.classList.add('active');
        tabLogin.setAttribute('aria-selected', 'true');
        tabRegister.classList.remove('active');
        tabRegister.setAttribute('aria-selected', 'false');

        kickerText.textContent = 'QUÉ BUENO VERTE';
        titleText.textContent = 'Bienvenido de nuevo';
        subtitleText.textContent = 'Entra con tu correo y contraseña.';

        fieldName.style.display = 'none';
        fieldPasswordRepeat.style.display = 'none';
        btnForgotPassword.style.display = 'inline-block';
        passwordHelper.style.display = 'none';

        submitBtn.textContent = 'Iniciar sesión';
        switchLabel.textContent = '¿Aún no tienes cuenta?';
        btnSwitchMode.textContent = 'Crear cuenta';
      } else {
        tabRegister.classList.add('active');
        tabRegister.setAttribute('aria-selected', 'true');
        tabLogin.classList.remove('active');
        tabLogin.setAttribute('aria-selected', 'false');

        kickerText.textContent = 'EMPIEZA A CREAR';
        titleText.textContent = 'Crea tu cuenta';
        subtitleText.textContent = 'Tu nombre, un correo y una contraseña.';

        fieldName.style.display = 'grid';
        fieldPasswordRepeat.style.display = 'grid';
        btnForgotPassword.style.display = 'none';
        passwordHelper.style.display = 'block';

        submitBtn.textContent = 'Crear cuenta';
        switchLabel.textContent = '¿Ya tienes cuenta?';
        btnSwitchMode.textContent = 'Iniciar sesión';
      }
    }

    tabLogin.addEventListener('click', () => { mode = 'login'; updateAuthUI(); });
    tabRegister.addEventListener('click', () => { mode = 'register'; updateAuthUI(); });
    btnSwitchMode.addEventListener('click', () => {
      mode = mode === 'login' ? 'register' : 'login';
      updateAuthUI();
    });

    let passwordVisible = false;
    btnTogglePassword.addEventListener('click', () => {
      passwordVisible = !passwordVisible;
      passwordInput.type = passwordVisible ? 'text' : 'password';
      togglePasswordText.textContent = passwordVisible ? 'Ocultar' : 'Mostrar';
      btnTogglePassword.setAttribute('aria-label', passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña');
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      window.location.href = 'mis-cursos.html';
    });

    btnGoogle.addEventListener('click', () => {
      window.location.href = 'mis-cursos.html';
    });
  }

  // 11. LÓGICA DE LA PÁGINA DE ADMINISTRACIÓN (admin.html)
  if (document.querySelector('.admin-page')) {
    // Datos iniciales
    const students = [
      { initials: "LO", name: "Loli123_gg", email: "lolhhh3345@gmail.com", enrolled: "18 feb 2026", progress: 84, status: "Activo" },
      { initials: "BR", name: "Brecaos", email: "breinercamargo16@gmail.com", enrolled: "16 feb 2026", progress: 45, status: "Activo" },
      { initials: "HA", name: "Hablemos de Países", email: "hablemosdepaises@gmail.com", enrolled: "12 feb 2026", progress: 72, status: "Activo" },
      { initials: "BU", name: "Bunuelo Usa", email: "bunuelo@gmail.com", enrolled: "08 feb 2026", progress: 31, status: "Activo" },
      { initials: "AN", name: "Andrea Diseño", email: "tortello.design@gmail.com", enrolled: "02 feb 2026", progress: 96, status: "Activo" },
      { initials: "JE", name: "Jean Delatorre", email: "delatorrenjeanpierre@gmail.com", enrolled: "28 ene 2026", progress: 58, status: "Activo" },
      { initials: "AC", name: "Activos y Hábitos", email: "activosyhabitos@gmail.com", enrolled: "22 ene 2026", progress: 19, status: "Activo" },
      { initials: "OR", name: "Orlando", email: "orjacace19@gmail.com", enrolled: "15 ene 2026", progress: 67, status: "Activo" },
      { initials: "LA", name: "Lannsi", email: "chelsemipertumoren@gmail.com", enrolled: "09 ene 2026", progress: 42, status: "Activo" },
      { initials: "PI", name: "Piero Rado Hilario", email: "pierohir@gmail.com", enrolled: "04 ene 2026", progress: 88, status: "Activo" }
    ];

    let courses = [
      { id: "01", title: "Primeros pasos en DaVinci Resolve", category: "Edición", level: "Primer módulo", lessons: 6, students: 1200 },
      { id: "02", title: "Edición básica de video", category: "Edición", level: "Segundo módulo", lessons: 8, students: 943 },
      { id: "03", title: "Introducción al color grading", category: "Color", level: "Tercer módulo", lessons: 9, students: 716 },
      { id: "04", title: "Audio y entrega final", category: "Audio", level: "Cuarto módulo", lessons: 9, students: 584 }
    ];

    let currentView = "students"; // "students" | "reports" | "courses"

    // Elementos DOM
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

    // Modales
    const studentModal = document.getElementById('student-modal-backdrop');
    const btnCloseStudentModal = document.getElementById('btn-close-student-modal');

    const courseModal = document.getElementById('course-modal-backdrop');
    const btnCloseCourseModal = document.getElementById('btn-close-course-modal');
    const courseForm = document.getElementById('course-form');
    const courseModalTitle = document.getElementById('course-modal-title');
    const courseFormSubmit = document.getElementById('course-form-submit');

    // Función auxiliar para descargas CSV
    function downloadCSV(filename, content) {
      const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    }

    // Navegación de Vistas
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
      [navStudents, navReports, navCourses].forEach(btn => btn.classList.remove('active'));

      viewStudentsSec.style.display = 'none';
      viewReportsSec.style.display = 'none';
      viewCoursesSec.style.display = 'none';

      if (targetView === 'students') {
        navStudents.classList.add('active');
        viewStudentsSec.style.display = 'block';
      } else if (targetView === 'reports') {
        navReports.classList.add('active');
        viewReportsSec.style.display = 'block';
      } else if (targetView === 'courses') {
        navCourses.classList.add('active');
        viewCoursesSec.style.display = 'block';
      }

      const info = viewDetails[targetView];
      viewKicker.textContent = info.kicker;
      viewTitle.textContent = info.title;
      viewCopy.textContent = info.copy;
      actionContainer.innerHTML = info.buttonHTML;

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

    // Menú Móvil Sidebar
    function openMobileMenu() {
      sidebar.classList.add('open');
      backdrop.style.display = 'block';
    }

    function closeMobileMenu() {
      sidebar.classList.remove('open');
      backdrop.style.display = 'none';
    }

    if (mobileToggle) mobileToggle.addEventListener('click', openMobileMenu);
    if (backdrop) backdrop.addEventListener('click', closeMobileMenu);
    if (sidebarClose) sidebarClose.addEventListener('click', closeMobileMenu);

    navStudents.addEventListener('click', () => switchView('students'));
    navReports.addEventListener('click', () => switchView('reports'));
    navCourses.addEventListener('click', () => switchView('courses'));

    // RENDERIZAR TABLA DE ESTUDIANTES
    function renderStudents(filterTerm = "") {
      studentTableBody.innerHTML = "";
      const term = filterTerm.trim().toLowerCase();

      const filtered = students.filter(s => 
        s.name.toLowerCase().includes(term) || s.email.toLowerCase().includes(term)
      );

      if (filtered.length === 0) {
        studentEmptyState.style.display = 'flex';
      } else {
        studentEmptyState.style.display = 'none';
        filtered.forEach(student => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>
              <div class="student-cell">
                <span>${student.initials}</span>
                <div><strong>${student.name}</strong><small>${student.email}</small></div>
              </div>
            </td>
            <td data-label="Inscripción">${student.enrolled}</td>
            <td data-label="Progreso">
              <div class="admin-progress" role="progressbar" aria-valuenow="${student.progress}" aria-valuemin="0" aria-valuemax="100" style="--progress: ${student.progress}%;">
                <span></span><strong>${student.progress}%</strong>
              </div>
            </td>
            <td data-label="Estado"><span class="status-pill"><i />${student.status}</span></td>
            <td>
              <button class="icon-action btn-view-student" aria-label="Ver a ${student.name}" data-email="${student.email}">
                <svg aria-hidden="true" fill="none" height="17" viewBox="0 0 24 24" width="17"><g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6S2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.5" /></g></svg>
              </button>
            </td>
          `;
          studentTableBody.appendChild(tr);
        });

        // Eventos para ver detalles de estudiante
        document.querySelectorAll('.btn-view-student').forEach(btn => {
          btn.addEventListener('click', () => {
            const email = btn.getAttribute('data-email');
            const student = students.find(s => s.email === email);
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

    // MODAL DETALLE ESTUDIANTE
    function openStudentModal(student) {
      document.getElementById('modal-student-avatar').textContent = student.initials;
      document.getElementById('student-modal-title').textContent = student.name;
      document.getElementById('modal-student-email').textContent = student.email;
      document.getElementById('modal-student-enrolled').textContent = student.enrolled;
      document.getElementById('modal-student-status').textContent = student.status;
      
      const progEl = document.getElementById('modal-student-progress');
      progEl.style.setProperty('--progress', `${student.progress}%`);
      document.getElementById('modal-student-progress-text').textContent = `${student.progress}%`;

      studentModal.style.display = 'flex';
    }

    btnCloseStudentModal.addEventListener('click', () => { studentModal.style.display = 'none'; });
    studentModal.addEventListener('click', (e) => {
      if (e.target === studentModal) studentModal.style.display = 'none';
    });

    // RENDERIZAR LISTA DE CURSOS
    function renderCourses() {
      courseAdminList.innerHTML = "";
      document.getElementById('courses-count-stat').textContent = courses.length;
      document.getElementById('courses-count-label').textContent = `${courses.length} módulos`;

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

      // Eventos de Editar y Eliminar
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

    // MODAL DE CURSO (CREAR / EDITAR)
    function openCourseModal(course = null) {
      if (course) {
        courseModalTitle.textContent = "Editar módulo";
        document.getElementById('course-form-id').value = course.id;
        document.getElementById('course-form-title').value = course.title;
        document.getElementById('course-form-category').value = course.category;
        document.getElementById('course-form-lessons').value = course.lessons;
        document.getElementById('course-form-level').value = course.level;
        courseFormSubmit.querySelector('span').textContent = "Guardar cambios";
      } else {
        courseModalTitle.textContent = "Crear nuevo módulo";
        courseForm.reset();
        document.getElementById('course-form-id').value = "";
        document.getElementById('course-form-lessons').value = 6;
        courseFormSubmit.querySelector('span').textContent = "Crear módulo";
      }
      courseModal.style.display = 'flex';
    }

    btnCloseCourseModal.addEventListener('click', () => { courseModal.style.display = 'none'; });
    courseModal.addEventListener('click', (e) => {
      if (e.target === courseModal) courseModal.style.display = 'none';
    });

    courseForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('course-form-id').value;
      const title = document.getElementById('course-form-title').value;
      const category = document.getElementById('course-form-category').value;
      const lessonsCount = Number(document.getElementById('course-form-lessons').value);
      const level = document.getElementById('course-form-level').value;

      if (id) {
        // Editar
        courses = courses.map(c => c.id === id ? { ...c, title, category, lessons: lessonsCount, level } : c);
      } else {
        // Crear
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

    // Inicialización
    switchView('students');
    renderStudents();
    renderCourses();
  }
});
