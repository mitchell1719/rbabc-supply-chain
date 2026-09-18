import { initializeApp } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';
import { Auth, getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB5qz8FagIsb4Ct-xhU6xWhqKAUGlczIRc",
  authDomain: "rbabc-supply-chain.firebaseapp.com",
  projectId: "rbabc-supply-chain",
  storageBucket: "rbabc-supply-chain.firebasestorage.app",
  messagingSenderId: "996187684693",
  appId: "1:996187684693:web:758e9b461a658adf26f9dc",
  measurementId: "G-QPCBQJHC8H"
};

const firebaseApp = initializeApp(firebaseConfig);

export const db: Firestore =
  getFirestore(firebaseApp);

export const auth: Auth =
  getAuth(firebaseApp);