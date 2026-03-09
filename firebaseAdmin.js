import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const initAdmin = () => {
  if (getApps().length > 0) return getApps()[0];

  const adminConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  };

  if (!adminConfig.projectId) {
    console.warn("Missing Firebase Admin credentials!");
    // Return dummy app or let it crash
  }

  return initializeApp({ credential: cert(adminConfig) });
};

export const getAdminAuth = () => getAuth(initAdmin());
export const getAdminDb = () => getFirestore(initAdmin());
