import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD7FcuHpLqnU-BCZDGIKagkBNsAwmTZklI",
  authDomain: "budget-system-a80ef.firebaseapp.com",
  projectId: "budget-system-a80ef",
  storageBucket: "budget-system-a80ef.firebasestorage.app",
  messagingSenderId: "951821068316",
  appId: "1:951821068316:web:f64ba85a6f9692187217d9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();