import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCQa6Nx0YPRM6v4A9-mXlIFP0-Gw_MSPCg",
  authDomain: "hedoomyy.firebaseapp.com",
  projectId: "hedoomyy",
  storageBucket: "gs://hedoomyy.firebasestorage.app",
  messagingSenderId: "298566845163",
  appId: "1:298566845163:web:5c284e9ce1f53bc33474ae",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
