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

    const revealSelectors = "main > section, .learning-card, .module, .hardware-row, .course-card, .lessons-panel, .active-course-card, .resources-card, .certificate-card, .auth-intro, .auth-card";
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
    let mode = 'login'; // 'login' | 'register'

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

    // Toggle Mostrar/Ocultar Contraseña
    let passwordVisible = false;
    btnTogglePassword.addEventListener('click', () => {
      passwordVisible = !passwordVisible;
      passwordInput.type = passwordVisible ? 'text' : 'password';
      togglePasswordText.textContent = passwordVisible ? 'Ocultar' : 'Mostrar';
      btnTogglePassword.setAttribute('aria-label', passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña');
    });

    // Envíos de Formulario y Redirección
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      window.location.href = 'mis-cursos.html';
    });

    btnGoogle.addEventListener('click', () => {
      window.location.href = 'mis-cursos.html';
    });
  }
});