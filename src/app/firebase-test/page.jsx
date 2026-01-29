"use client";

import { useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

export default function FirebaseTest() {
  useEffect(() => {
    const test = async () => {
      try {
        const app = initializeApp({
          apiKey: "AIzaSyCQa6Nx0YPRM6v4A9-mXlIFP0-Gw_MSPCg",
          authDomain: "hedoomyy.firebaseapp.com",
          projectId: "hedoomyy",
        });

        const db = getFirestore(app);

        console.log("🔥 FIRESTORE INSTANCE:", db);

        // try reading a NON-EXISTENT doc
        const ref = doc(db, "___test___", "___test___");
        await getDoc(ref);

        console.log("✅ FIRESTORE REQUEST WENT THROUGH");
      } catch (e) {
        console.error("❌ FIRESTORE ERROR:", e);
      }
    };

    test();
  }, []);

  return <h1>Firebase Dashboard Test</h1>;
}
