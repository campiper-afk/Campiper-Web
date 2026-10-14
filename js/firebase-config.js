// 1. Importar Firebase y los módulos de Autenticación
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDicr1FaMUZMtKT_qThtaKv_TFGdeYhFpE",
  authDomain: "campiper-7414d.firebaseapp.com",
  projectId: "campiper-7414d",
  storageBucket: "campiper-7414d.firebasestorage.app",
  messagingSenderId: "984212599762",
  appId: "1:984212599762:web:0a0299a4350edcb2818e0b",
  measurementId: "G-JP0QHCRVM5"
};

// 3. Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// 4. Hacer que el botón de Google funcione
const btnGoogle = document.querySelector('[data-google]'); // Busca tu botón en el HTML

if (btnGoogle) {
  btnGoogle.addEventListener('click', () => {
    // Abre la ventana emergente de Google
    signInWithPopup(auth, provider)
      .then((resultado) => {
        const usuario = resultado.user;
        console.log("¡Éxito! Usuario logueado:", usuario.displayName);
        alert("¡Bienvenido " + usuario.displayName + "! Google funciona perfecto.");
        
        // Más adelante, aquí pondremos el código para llevarlo a mis-cursos.html
      })
      .catch((error) => {
        console.error("Error al iniciar sesión:", error.message);
        alert("Hubo un error, mira la consola.");
      });
  });
}
