import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBtiyJm_lsw5OIxxIKWPWq8S4sRZ6WZa8A",
  authDomain: "cart-project-a035c.firebaseapp.com",
  projectId: "cart-project-a035c",
  storageBucket: "cart-project-a035c.firebasestorage.app",
  messagingSenderId: "264822136946",
  appId: "1:264822136946:web:0bd9700d68567a194422eb",
  measurementId: "G-D59PLNL9H7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);