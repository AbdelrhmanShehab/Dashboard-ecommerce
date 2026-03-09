"use client";

import { useEffect } from "react";
import { messaging } from "../firebaseConfig";
import { getToken, onMessage } from "firebase/messaging";

export default function NotificationManager() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const registerServiceWorker = async () => {
        try {
          const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
          console.log("Service Worker registered with scope:", registration.scope);

          if (messaging) {
            const token = await getToken(messaging, {
              vapidKey: "BKe1M_Y6_I8T_9_J-v6z6z6z6z6z6z6z6z6z6z6z6z6z6z6z6z6z6z6z6z6z6z", // Placeholder VAPID key
              serviceWorkerRegistration: registration,
            });
            if (token) {
              console.log("FCM Token:", token);
              // In a real app, you'd send this token to your server to associate it with the user
            } else {
              console.log("No registration token available. Request permission to generate one.");
            }
          }
        } catch (err) {
          console.error("Service Worker registration failed:", err);
        }
      };

      registerServiceWorker();

      if (messaging) {
        const unsubscribe = onMessage(messaging, (payload) => {
          console.log("Foreground message received:", payload);
          // Foreground notifications are handled by the browser if the user has permitted them
          // But we can also show a custom UI or trigger the sound here if needed.
          // However, Header.js is already listening to Firestore, which is more "real-time" for orders.
        });
        return () => unsubscribe();
      }
    }
  }, []);

  return null;
}
