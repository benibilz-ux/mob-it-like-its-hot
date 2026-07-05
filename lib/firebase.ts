import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// TODO: Ersetze diese Werte mit deiner Firebase-Projektkonfiguration
// Anleitung: siehe FIREBASE_SETUP.md
const firebaseConfig = {
  apiKey: 'AIzaSyCzkN7GE84Ql_9DDG7t-sQI-tIv7trqaw4',
  authDomain: 'haushaltsapp-6bcf9.firebaseapp.com',
  projectId: 'haushaltsapp-6bcf9',
  storageBucket: 'haushaltsapp-6bcf9.firebasestorage.app',
  messagingSenderId: '25234781126',
  appId: '1:25234781126:web:249f248c71ab17f18af8c7',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
