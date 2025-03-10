// src/firebase/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Substitua estas configurações pelas suas próprias credenciais do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB5s0kwxfFv4JDIPSNcHjAHxxqw-YMSXPk",
  authDomain: "myworld-34d7c.firebaseapp.com",
  projectId: "myworld-34d7c",
  storageBucket: "myworld-34d7c.firebasestorage.app",
  messagingSenderId: "967414019738",
  appId: "1:967414019738:web:14cf4e4be2e4a745505123",
  measurementId: "G-W4C2186J54"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços do Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;