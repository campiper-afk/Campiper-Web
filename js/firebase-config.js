// Importar las funciones que necesitas de los SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";

// Pega AQUÍ el objeto firebaseConfig que te dio Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDicr1FaMUZMtKT_qThtaKv_TFGdeYhFpE",
  authDomain: "campiper-7414d.firebaseapp.com",
  projectId: "campiper-7414d",
  storageBucket: "campiper-7414d.firebasestorage.app",
  messagingSenderId: "984212599762",
  appId: "1:984212599762:web:0a0299a4350edcb2818e0b",
  measurementId: "G-JP0QHCRVM5"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
console.log("Firebase conectado correctamente 👍");
