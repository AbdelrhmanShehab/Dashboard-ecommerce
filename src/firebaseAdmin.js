import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const initAdmin = () => {
  // Defensive check for client-side usage
  if (typeof window !== "undefined") {
    console.error("Firebase Admin initialized on client-side! This is a security risk.");
    return null;
  }

  if (getApps().length > 0) return getApps()[0];

  const adminConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/^"|"$/g, "")?.replace(/\\n/g, "\n"),
  };

  if (!adminConfig.projectId || !adminConfig.clientEmail || !adminConfig.privateKey) {
    console.error("❌ Firebase Admin credentials missing!");
    console.error("Checked for: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY");
    // Throwing instead of warning to make it obvious in server logs
    throw new Error("Missing Firebase Admin credentials. Please check your environment variables.");
  }

  try {
    return initializeApp({ credential: cert(adminConfig) });
  } catch (error) {
    console.error("❌ Firebase Admin initialization failed:", error.message);
    throw error;
  }
};

export const getAdminAuth = () => getAuth(initAdmin());
export const getAdminDb = () => getFirestore(initAdmin());
