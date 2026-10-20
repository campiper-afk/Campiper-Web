# Contexto del Proyecto: CamPiper

## 1. ¿Qué es?
CamPiper es una plataforma educativa enfocada en la enseñanza de edición audiovisual. Su producto inicial es una landing page de alta conversión para vender el curso "Domina DaVinci Resolve desde cero". La plataforma destaca por ofrecer contenido 100% grabado, acceso de por vida y aprendizaje sin horarios fijos.

## 2. Marca y Diseño (Design System)
El diseño sigue una estética "Dark Mode" moderna, tecnológica y enfocada en creadores.
* **Tipografías:** `Poppins` (Títulos, aporta modernidad) e `Inter` (Cuerpos de texto, máxima legibilidad).
* **Colores Principales:**
  * Fondo dominante (60%): Oscuro (`#1E1E24`, `#26262E`)
  * Secundario (30%): Azul (`#4A90E2`, `#335E92`)
  * Acento para CTAs (10%): Naranja (`#FF6B35`, `#E0552A`)
  * Texto: Claro (`#F5F5F7`) y Silenciado (`#A9ADBB`)

## 3. Rutas y Navegación (Routing)
Actualmente es una arquitectura "One-Page" (una sola página HTML). La navegación interna utiliza anclas (anchor links):
* `/` -> Hero (Propuesta de valor y video principal)
* `/#cursos-destacados` -> Tarjetas con la oferta educativa
* `/#requisitos` -> Tabla de hardware mínimo para DaVinci Resolve
* `/#temario` -> Acordeón interactivo con los módulos
* `/#precios` -> Tarjeta de checkout y temporizador de urgencia

## 4. Estructura de Carpetas
```text
campiper-landing/
├── index.html        # Maquetación principal, CSS integrado y lógica JS nativa.
├── CONTEXTO.md       # Reglas de negocio, diseño y arquitectura para IAs.
└── README.md         # (Opcional) Descripción pública del repositorio.
