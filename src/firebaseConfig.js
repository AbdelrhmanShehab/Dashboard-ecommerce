// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
const firebaseConfig = {
  apiKey: "AIzaSyBQ1dsL56KLBYDcCu-v6vzjshjDw_0US6Q",
  authDomain: "products-dashboard-auth.firebaseapp.com",
  projectId: "products-dashboard-auth",
  storageBucket: "products-dashboard-auth.firebasestorage.app",
  messagingSenderId: "307365322374",
  appId: "1:307365322374:web:8860bdabd7de03e8077b07",
  measurementId: "G-T56ZSS961D",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export const storage = getStorage(app);
export { db };