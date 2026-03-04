import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAWPGftVLRq_3y7d4ABOtAUaWMg5nF_QXM",
  authDomain: "my-life-3519c.firebaseapp.com",
  projectId: "my-life-3519c",
  storageBucket: "my-life-3519c.firebasestorage.app",
  messagingSenderId: "628407543082",
  appId: "1:628407543082:web:e281446795ab10b333aa53",
  measurementId: "G-GBGK8SWXDL"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
